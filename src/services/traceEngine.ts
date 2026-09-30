import { 
  OptiFiberDatabase, 
  TraceResult, 
  TraceStep, 
  FiberCore, 
  FiberCable, 
  JointBox, 
  SpliceConnection, 
  OpticalSplitter, 
  Customer, 
  PONPort, 
  OLT 
} from '../types';
import { calculateCustomerImpact } from './customerImpactEngine';

export function runFiberTrace(
  db: OptiFiberDatabase,
  sourceType: 'OLT' | 'PON' | 'CABLE' | 'CORE' | 'JOINT_BOX' | 'SPLICE' | 'SPLITTER' | 'CUSTOMER',
  sourceId: string,
  optionalParam?: { coreNumber?: number; portNumber?: number; direction?: 'Forward' | 'Reverse' | 'Bidirectional' }
): TraceResult {
  const steps: TraceStep[] = [];
  const connectedSplitters: string[] = [];
  const connectedJointBoxes: string[] = [];
  const cablesTraversed: string[] = [];
  let totalLengthMeters = 0;
  let cumulativeLossDb = 0;
  let currentPowerDbm = 5.0; // Default GPON SFP launch power
  let hasFault = false;
  let faultStep: TraceStep | undefined = undefined;
  let downstreamCustomerCount = 0;
  let sourceLabel = '';

  // Helper to add step
  function pushStep(step: Omit<TraceStep, 'stepNumber' | 'cumulativeLossDb'>): TraceStep {
    cumulativeLossDb += step.stepLossDb || 0;
    if (step.opticalPowerDbm === undefined) {
      step.opticalPowerDbm = +(currentPowerDbm - cumulativeLossDb).toFixed(2);
    }
    const fullStep: TraceStep = {
      ...step,
      stepNumber: steps.length + 1,
      cumulativeLossDb: +cumulativeLossDb.toFixed(2),
    };
    if (step.isFaultPoint && !hasFault) {
      hasFault = true;
      faultStep = fullStep;
    }
    steps.push(fullStep);
    return fullStep;
  }

  // 1. Identify starting point and build full chain
  if (sourceType === 'CUSTOMER') {
    const cust = db.customers.find(c => c.id === sourceId);
    if (!cust) return createEmptyResult('CUSTOMER', sourceId, 'Customer Not Found');
    sourceLabel = `${cust.name} (${cust.customerId})`;

    // Trace Customer -> Splitter -> Joint Boxes -> OLT
    let rootPon: PONPort | undefined;
    let rootOlt: OLT | undefined;
    let inputCable: FiberCable | undefined;
    let inputCore: FiberCore | undefined;

    if (cust.splitterId) {
      const splitter = db.splitters.find(s => s.id === cust.splitterId);
      if (splitter) {
        if (!connectedSplitters.includes(splitter.splitterId)) connectedSplitters.push(splitter.splitterId);
        if (splitter.inputCableId && splitter.inputCoreNumber) {
          inputCable = db.cables.find(c => c.id === splitter.inputCableId);
          inputCore = db.cores.find(c => c.cableId === splitter.inputCableId && c.coreNumber === splitter.inputCoreNumber);
        }
      }
    }

    // Attempt upstream resolution from inputCore
    const upstreamChain: {
      jointBox?: JointBox;
      splice?: SpliceConnection;
      cable: FiberCable;
      core: FiberCore;
    }[] = [];

    let currCable = inputCable;
    let currCore = inputCore;
    let guard = 0;

    while (currCable && currCore && guard < 15) {
      guard++;
      if (!cablesTraversed.includes(currCable.cableId)) cablesTraversed.push(currCable.cableId);
      totalLengthMeters += currCable.installedLengthMeters || currCable.totalLengthMeters || 1000;

      // Find incoming splice that targets this cable & core
      const spliceTargetingCurr = db.splices.find(
        s => s.outgoingCableId === currCable?.id && s.outgoingCoreNumber === currCore?.coreNumber
      );

      if (spliceTargetingCurr) {
        const jb = db.jointBoxes.find(j => j.id === spliceTargetingCurr.jointBoxId);
        if (jb && !connectedJointBoxes.includes(jb.jointBoxId)) connectedJointBoxes.push(jb.jointBoxId);
        upstreamChain.unshift({
          jointBox: jb,
          splice: spliceTargetingCurr,
          cable: currCable,
          core: currCore,
        });

        // Move to upstream cable & core
        const prevCable = db.cables.find(c => c.id === spliceTargetingCurr.incomingCableId);
        const prevCore = db.cores.find(
          c => c.cableId === spliceTargetingCurr.incomingCableId && c.coreNumber === spliceTargetingCurr.incomingCoreNumber
        );
        currCable = prevCable;
        currCore = prevCore;
      } else {
        // No further splice; check if this core connects to a PON Port or OLT
        upstreamChain.unshift({
          cable: currCable,
          core: currCore,
        });

        // Check if any PON connects to this core
        rootPon = db.ponPorts.find(
          p => p.connectedFiberCableId === currCable?.id && p.connectedCoreNumber === currCore?.coreNumber
        );
        if (rootPon) {
          rootOlt = db.olts.find(o => o.id === rootPon?.oltId);
        }
        break;
      }
    }

    // Now emit steps in Forward sequence (Root OLT -> Cables -> Splices -> Splitter -> Customer)
    if (rootOlt && rootPon) {
      currentPowerDbm = rootPon.txPower || 5.0;
      pushStep({
        entityType: 'OLT',
        id: rootOlt.id,
        name: rootOlt.name,
        detail: `${rootOlt.model} (${rootOlt.ip}) - Pop Location`,
        status: rootOlt.status,
        opticalPowerDbm: currentPowerDbm,
        stepLossDb: 0,
      });

      pushStep({
        entityType: 'PON',
        id: rootPon.id,
        name: rootPon.name,
        detail: `GPON Port Tx: +${rootPon.txPower} dBm (${rootPon.wavelength})`,
        status: rootPon.status,
        opticalPowerDbm: currentPowerDbm,
        stepLossDb: 0,
      });
    }

    // Add cables and splices along upstream chain
    upstreamChain.forEach((link, idx) => {
      const fiberSpanLoss = +((link.cable.installedLengthMeters / 1000) * (link.core.attenuationLossDb || 0.35)).toFixed(2);
      const isCoreFault = link.core.status === 'Fault' || link.core.status === 'Cut' || link.core.status === 'LOS';
      
      pushStep({
        entityType: 'CABLE',
        id: link.cable.id,
        name: link.cable.cableId,
        detail: `${link.cable.cableType} (${link.cable.coreCount} Cores, ${link.cable.installedLengthMeters}m)`,
        status: link.cable.status === 'Installed' ? 'Active' : link.cable.status === 'Damaged' ? 'Cut' : 'Spare',
        stepLossDb: fiberSpanLoss,
        location: `${link.cable.startLocation} → ${link.cable.endLocation}`,
      });

      pushStep({
        entityType: 'CORE',
        id: link.core.id,
        name: `Core #${link.core.coreNumber} (${link.core.colorName})`,
        detail: link.core.notes || `Buffer Tube ${link.core.tubeNumber || 1}`,
        status: link.core.status,
        coreNumber: link.core.coreNumber,
        coreColor: link.core.colorName,
        coreColorHex: link.core.colorHex,
        stepLossDb: 0,
        isFaultPoint: isCoreFault,
        faultReason: isCoreFault ? `High attenuation or fault on Core #${link.core.coreNumber}` : undefined,
      });

      if (link.splice && link.jointBox) {
        pushStep({
          entityType: 'JOINT_BOX',
          id: link.jointBox.id,
          name: link.jointBox.name,
          detail: `${link.jointBox.jointBoxId} (${link.jointBox.type}) - ${link.jointBox.location}`,
          status: link.jointBox.maintenanceStatus === 'Good' ? 'Active' : 'Warning',
          location: link.jointBox.location,
        });

        pushStep({
          entityType: 'SPLICE',
          id: link.splice.id,
          name: `Splice Tray #${link.splice.trayNumber}`,
          detail: `${link.splice.incomingCoreColor} Core #${link.splice.incomingCoreNumber} ➔ ${link.splice.outgoingCoreColor} Core #${link.splice.outgoingCoreNumber} (${link.splice.spliceType})`,
          status: link.splice.status,
          stepLossDb: link.splice.spliceLossDb || 0.03,
        });
      }
    });

    // Add Splitter
    if (cust.splitterId) {
      const splitter = db.splitters.find(s => s.id === cust.splitterId);
      if (splitter) {
        pushStep({
          entityType: 'SPLITTER',
          id: splitter.id,
          name: splitter.name || splitter.splitterId,
          detail: `Optical Splitter (${splitter.splitRatio}) - Insertion Loss: ${splitter.expectedLossDb} dB`,
          status: splitter.status,
          stepLossDb: splitter.expectedLossDb,
          location: splitter.location,
        });

        if (cust.splitterPortNumber) {
          pushStep({
            entityType: 'SPLITTER_PORT',
            id: `${splitter.id}-port-${cust.splitterPortNumber}`,
            name: `Splitter Port #${cust.splitterPortNumber}`,
            detail: `Output to subscriber drop cable`,
            status: 'Active',
            stepLossDb: 0.1,
          });
        }
      }
    }

    // Add Drop Cable & Customer ONU
    const dropLoss = +((cust.dropCableLengthM / 1000) * 0.35 + 0.3).toFixed(2);
    totalLengthMeters += cust.dropCableLengthM;

    pushStep({
      entityType: 'DROP_CABLE',
      id: `drop-${cust.id}`,
      name: `Drop Cable (${cust.dropCableLengthM}m)`,
      detail: `Aerial/Duct 1-Core drop to subscriber premises`,
      status: 'Active',
      stepLossDb: dropLoss,
    });

    pushStep({
      entityType: 'CUSTOMER_ONU',
      id: `onu-${cust.id}`,
      name: `ONU: ${cust.onuModel}`,
      detail: `MAC: ${cust.onuMac} | SN: ${cust.onuSerial}`,
      status: cust.status === 'Active' ? 'Active' : cust.status === 'LOS' ? 'Cut' : 'Warning',
      opticalPowerDbm: cust.rxPowerDbm,
    });

    pushStep({
      entityType: 'CUSTOMER',
      id: cust.id,
      name: cust.name,
      detail: `${cust.customerId} - ${cust.package} (${cust.address})`,
      status: cust.status === 'Active' ? 'Active' : 'Down',
      opticalPowerDbm: cust.rxPowerDbm,
      isFaultPoint: cust.status === 'LOS',
      faultReason: cust.status === 'LOS' ? 'Customer reporting Optical Loss of Signal (LOS)' : undefined,
    });

    downstreamCustomerCount = 1;

  } else {
    // Standard Forward Traversal starting from OLT, PON, Cable, Core, or Joint Box
    let startCableId: string | undefined;
    let startCoreNum: number | undefined;

    if (sourceType === 'OLT') {
      const olt = db.olts.find(o => o.id === sourceId);
      if (!olt) return createEmptyResult('OLT', sourceId, 'OLT Not Found');
      sourceLabel = olt.name;
      const pon = db.ponPorts.find(p => p.oltId === olt.id && p.connectedFiberCableId);
      if (pon) {
        startCableId = pon.connectedFiberCableId;
        startCoreNum = pon.connectedCoreNumber;
        currentPowerDbm = pon.txPower;
      }
      pushStep({
        entityType: 'OLT',
        id: olt.id,
        name: olt.name,
        detail: `${olt.model} (${olt.ip})`,
        status: olt.status,
        opticalPowerDbm: currentPowerDbm,
      });
      if (pon) {
        pushStep({
          entityType: 'PON',
          id: pon.id,
          name: pon.name,
          detail: `Tx Power: +${pon.txPower} dBm (${pon.wavelength})`,
          status: pon.status,
          opticalPowerDbm: currentPowerDbm,
        });
      }
    } else if (sourceType === 'PON') {
      const pon = db.ponPorts.find(p => p.id === sourceId);
      if (!pon) return createEmptyResult('PON', sourceId, 'PON Not Found');
      sourceLabel = pon.name;
      startCableId = pon.connectedFiberCableId;
      startCoreNum = pon.connectedCoreNumber;
      currentPowerDbm = pon.txPower;

      const olt = db.olts.find(o => o.id === pon.oltId);
      if (olt) {
        pushStep({
          entityType: 'OLT',
          id: olt.id,
          name: olt.name,
          detail: olt.model,
          status: olt.status,
          opticalPowerDbm: currentPowerDbm,
        });
      }
      pushStep({
        entityType: 'PON',
        id: pon.id,
        name: pon.name,
        detail: `Tx Power: +${pon.txPower} dBm (${pon.wavelength})`,
        status: pon.status,
        opticalPowerDbm: currentPowerDbm,
      });
    } else if (sourceType === 'CABLE') {
      startCableId = sourceId;
      startCoreNum = optionalParam?.coreNumber || 1;
      const cable = db.cables.find(c => c.id === sourceId);
      sourceLabel = cable?.cableId || 'Cable';
    } else if (sourceType === 'CORE') {
      const core = db.cores.find(c => c.id === sourceId);
      if (!core) return createEmptyResult('CORE', sourceId, 'Core Not Found');
      startCableId = core.cableId;
      startCoreNum = core.coreNumber;
      sourceLabel = `${core.cableId} Core #${core.coreNumber} (${core.colorName})`;
    } else if (sourceType === 'JOINT_BOX') {
      const jb = db.jointBoxes.find(j => j.id === sourceId);
      if (!jb) return createEmptyResult('JOINT_BOX', sourceId, 'Joint Box Not Found');
      sourceLabel = `${jb.name} (${jb.jointBoxId})`;
      pushStep({
        entityType: 'JOINT_BOX',
        id: jb.id,
        name: jb.name,
        detail: `${jb.jointBoxId} - ${jb.location}`,
        status: jb.maintenanceStatus === 'Good' ? 'Active' : 'Warning',
      });
      // Pick first splice in joint box to trace
      const splice = db.splices.find(s => s.jointBoxId === jb.id);
      if (splice) {
        startCableId = splice.outgoingCableId;
        startCoreNum = splice.outgoingCoreNumber;
      }
    } else if (sourceType === 'SPLITTER') {
      const spl = db.splitters.find(s => s.id === sourceId);
      if (!spl) return createEmptyResult('SPLITTER', sourceId, 'Splitter Not Found');
      sourceLabel = spl.name || spl.splitterId;
      startCableId = spl.inputCableId;
      startCoreNum = spl.inputCoreNumber;
    }

    // Traverse forward through splices, cables, splitters, customers
    let currCableId = startCableId;
    let currCoreNum = startCoreNum;
    let guard = 0;

    while (currCableId && currCoreNum && guard < 15) {
      guard++;
      const cable = db.cables.find(c => c.id === currCableId);
      const core = db.cores.find(c => c.cableId === currCableId && c.coreNumber === currCoreNum);

      if (cable && core) {
        if (!cablesTraversed.includes(cable.cableId)) cablesTraversed.push(cable.cableId);
        const len = cable.installedLengthMeters || 1000;
        totalLengthMeters += len;
        const spanLoss = +((len / 1000) * (core.attenuationLossDb || 0.35)).toFixed(2);
        const isFault = core.status === 'Fault' || core.status === 'Cut' || core.status === 'LOS';

        pushStep({
          entityType: 'CABLE',
          id: cable.id,
          name: cable.cableId,
          detail: `${cable.cableType} (${cable.coreCount} Cores, ${len}m)`,
          status: cable.status === 'Installed' ? 'Active' : cable.status === 'Damaged' ? 'Cut' : 'Spare',
          stepLossDb: spanLoss,
          location: `${cable.startLocation} → ${cable.endLocation}`,
        });

        pushStep({
          entityType: 'CORE',
          id: core.id,
          name: `Core #${core.coreNumber} (${core.colorName})`,
          detail: core.notes || `Color: ${core.colorName} (Hex: ${core.colorHex})`,
          status: core.status,
          coreNumber: core.coreNumber,
          coreColor: core.colorName,
          coreColorHex: core.colorHex,
          stepLossDb: 0,
          isFaultPoint: isFault,
          faultReason: isFault ? `Fault or Cut on Core #${core.coreNumber}` : undefined,
        });

        // Check if this core is input to any Splitter
        const splitter = db.splitters.find(
          s => s.inputCableId === cable.id && s.inputCoreNumber === core.coreNumber
        );

        if (splitter) {
          if (!connectedSplitters.includes(splitter.splitterId)) connectedSplitters.push(splitter.splitterId);
          pushStep({
            entityType: 'SPLITTER',
            id: splitter.id,
            name: splitter.name || splitter.splitterId,
            detail: `PLC Splitter ${splitter.splitRatio} - Loss: ${splitter.expectedLossDb} dB`,
            status: splitter.status,
            stepLossDb: splitter.expectedLossDb,
            location: splitter.location,
          });

          // Add connected customers to splitter ports
          splitter.ports.forEach(port => {
            if (port.connectedCustomerId) {
              const cust = db.customers.find(c => c.id === port.connectedCustomerId);
              if (cust) {
                downstreamCustomerCount++;
                pushStep({
                  entityType: 'SPLITTER_PORT',
                  id: `${splitter.id}-p${port.portNumber}`,
                  name: `Port #${port.portNumber}`,
                  detail: `Output: ${port.outputSignalDbm} dBm`,
                  status: port.status,
                  stepLossDb: 0.1,
                });
                pushStep({
                  entityType: 'CUSTOMER_ONU',
                  id: `onu-${cust.id}`,
                  name: `ONU: ${cust.onuModel}`,
                  detail: `SN: ${cust.onuSerial} (${cust.name})`,
                  status: cust.status === 'Active' ? 'Active' : 'Down',
                  opticalPowerDbm: cust.rxPowerDbm,
                });
              }
            }
          });
          break; // Terminal at splitter distribution
        }

        // Check if there is an outgoing splice from this core
        const splice = db.splices.find(
          s => s.incomingCableId === currCableId && s.incomingCoreNumber === currCoreNum
        );

        if (splice) {
          const jb = db.jointBoxes.find(j => j.id === splice.jointBoxId);
          if (jb && !connectedJointBoxes.includes(jb.jointBoxId)) connectedJointBoxes.push(jb.jointBoxId);

          if (jb) {
            pushStep({
              entityType: 'JOINT_BOX',
              id: jb.id,
              name: jb.name,
              detail: `${jb.jointBoxId} (${jb.type}) - ${jb.location}`,
              status: jb.maintenanceStatus === 'Good' ? 'Active' : 'Warning',
              location: jb.location,
            });
          }

          pushStep({
            entityType: 'SPLICE',
            id: splice.id,
            name: `Splice Tray #${splice.trayNumber}`,
            detail: `${splice.incomingCoreColor} Core #${splice.incomingCoreNumber} ➔ ${splice.outgoingCoreColor} Core #${splice.outgoingCoreNumber}`,
            status: splice.status,
            stepLossDb: splice.spliceLossDb || 0.03,
          });

          // Move to next spliced cable and core
          currCableId = splice.outgoingCableId;
          currCoreNum = splice.outgoingCoreNumber;
        } else {
          // No further splice; check if directly attached to customer
          const directCust = db.customers.find(c => c.notes && c.notes.includes(core.id));
          if (directCust) {
            downstreamCustomerCount++;
            pushStep({
              entityType: 'CUSTOMER',
              id: directCust.id,
              name: directCust.name,
              detail: directCust.package,
              status: directCust.status === 'Active' ? 'Active' : 'Down',
            });
          }
          break;
        }
      } else {
        break;
      }
    }
  }

  // Compute downstream customers impact
  const impact = calculateCustomerImpact(db, sourceType, sourceId, optionalParam?.coreNumber);
  const downstreamCustomers = impact.affectedCustomers;
  if (downstreamCustomerCount === 0) {
    downstreamCustomerCount = impact.affectedCustomerCount;
  }

  // Handle explicit Reverse / Backward trace direction request
  const requestedDir = optionalParam?.direction || (sourceType === 'CUSTOMER' ? 'Reverse' : 'Forward');
  let finalSteps = steps;
  if (requestedDir === 'Reverse' && sourceType !== 'CUSTOMER') {
    finalSteps = [...steps].reverse().map((st, i) => ({
      ...st,
      stepNumber: i + 1,
    }));
  }

  const expectedRxPowerDbm = +(currentPowerDbm - cumulativeLossDb).toFixed(2);
  const startStep = finalSteps[0];
  const endStep = finalSteps[finalSteps.length - 1];

  return {
    sourceEntityType: sourceType,
    sourceEntityId: sourceId,
    sourceEntityLabel: sourceLabel,
    direction: requestedDir,
    fullPath: finalSteps,
    startPoint: startStep ? `${startStep.name} (${startStep.entityType})` : 'Origin',
    endPoint: endStep ? `${endStep.name} (${endStep.entityType})` : 'Terminal',
    totalLengthMeters,
    totalLossDb: +cumulativeLossDb.toFixed(2),
    expectedRxPowerDbm,
    hasFault,
    faultStep,
    downstreamCustomerCount,
    downstreamCustomers,
    connectedSplitters,
    connectedJointBoxes,
    cablesTraversed,
  };
}

function createEmptyResult(type: string, id: string, label: string): TraceResult {
  return {
    sourceEntityType: type,
    sourceEntityId: id,
    sourceEntityLabel: label,
    direction: 'Bidirectional',
    fullPath: [],
    startPoint: 'None',
    endPoint: 'None',
    totalLengthMeters: 0,
    totalLossDb: 0,
    expectedRxPowerDbm: 0,
    hasFault: false,
    downstreamCustomerCount: 0,
    connectedSplitters: [],
    connectedJointBoxes: [],
    cablesTraversed: [],
  };
}

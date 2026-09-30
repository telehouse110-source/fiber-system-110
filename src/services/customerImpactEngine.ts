import { OptiFiberDatabase, Customer, JointBox, OpticalSplitter, FiberCable } from '../types';

export type ImpactTargetType = 'CABLE' | 'SEGMENT' | 'CORE' | 'JOINT_BOX' | 'SPLITTER' | 'ROUTE' | 'PON' | 'OLT' | 'CUSTOMER' | 'SPLICE';

export interface CustomerImpactResult {
  targetType: ImpactTargetType;
  targetId: string;
  targetName: string;
  affectedCustomers: Customer[];
  affectedCustomerCount: number;
  affectedSplitters: OpticalSplitter[];
  affectedJointBoxes: JointBox[];
  affectedCables: FiberCable[];
  calculatedAt: string;
}

/**
 * Traverses downstream physical and optical relationships to discover
 * all affected subscribers if a given node or link fails.
 */
export function calculateCustomerImpact(
  db: OptiFiberDatabase,
  targetType: ImpactTargetType,
  targetId: string,
  targetCoreNumber?: number
): CustomerImpactResult {
  const affectedCustomers: Customer[] = [];
  const affectedSplitters: OpticalSplitter[] = [];
  const affectedJointBoxes: JointBox[] = [];
  const affectedCables: FiberCable[] = [];

  let targetName = targetId;

  // 0. Direct Customer Failure
  if (targetType === 'CUSTOMER') {
    const cust = db.customers.find(c => c.id === targetId || c.customerId === targetId);
    if (cust) {
      targetName = cust.name;
      affectedCustomers.push(cust);
      if (cust.splitterId) {
        const s = db.splitters.find(sp => sp.id === cust.splitterId);
        if (s) affectedSplitters.push(s);
      }
    }
  }

  // 1. Direct Splitter Failure
  if (targetType === 'SPLITTER') {
    const splt = db.splitters.find(s => s.id === targetId || s.splitterId === targetId);
    if (splt) {
      targetName = splt.name || splt.splitterId;
      affectedSplitters.push(splt);
      const custs = db.customers.filter(c => c.splitterId === splt.id);
      custs.forEach(c => {
        if (!affectedCustomers.some(x => x.id === c.id)) affectedCustomers.push(c);
      });
    }
  }

  // 2. Individual Core Failure
  else if (targetType === 'CORE') {
    const core = db.cores.find(c => c.id === targetId);
    const cable = core ? db.cables.find(cb => cb.id === core.cableId) : undefined;
    targetName = core ? `${cable?.cableId || core.cableId} - Core #${core.coreNumber} (${core.colorName})` : targetId;

    if (core) {
      // Find all splitters fed by this core directly
      const directSplitters = db.splitters.filter(
        s => s.inputCableId === core.cableId && s.inputCoreNumber === core.coreNumber
      );
      directSplitters.forEach(s => {
        if (!affectedSplitters.some(x => x.id === s.id)) affectedSplitters.push(s);
        db.customers.filter(c => c.splitterId === s.id).forEach(c => {
          if (!affectedCustomers.some(x => x.id === c.id)) affectedCustomers.push(c);
        });
      });

      // Follow downstream splices from this core
      const findDownstreamSpliceCores = (cId: string, cNum: number) => {
        const splices = db.splices.filter(s => s.incomingCableId === cId && s.incomingCoreNumber === cNum);
        splices.forEach(spl => {
          const jb = db.jointBoxes.find(j => j.id === spl.jointBoxId);
          if (jb && !affectedJointBoxes.some(x => x.id === jb.id)) affectedJointBoxes.push(jb);

          // Check if outgoing core feeds a splitter
          db.splitters.filter(s => s.inputCableId === spl.outgoingCableId && s.inputCoreNumber === spl.outgoingCoreNumber).forEach(s => {
            if (!affectedSplitters.some(x => x.id === s.id)) affectedSplitters.push(s);
            db.customers.filter(c => c.splitterId === s.id).forEach(c => {
              if (!affectedCustomers.some(x => x.id === c.id)) affectedCustomers.push(c);
            });
          });

          // Recurse to next hop
          findDownstreamSpliceCores(spl.outgoingCableId, spl.outgoingCoreNumber);
        });
      };

      findDownstreamSpliceCores(core.cableId, core.coreNumber);
    }
  }

  // 3. Cable Cut / Damage Failure
  else if (targetType === 'CABLE') {
    const cable = db.cables.find(c => c.id === targetId || c.cableId === targetId);
    if (cable) {
      targetName = `${cable.cableId} (${cable.coreCount} Cores)`;
      affectedCables.push(cable);

      // Check all splitters with input on this cable
      db.splitters.filter(s => s.inputCableId === cable.id).forEach(s => {
        if (!affectedSplitters.some(x => x.id === s.id)) affectedSplitters.push(s);
        db.customers.filter(c => c.splitterId === s.id).forEach(c => {
          if (!affectedCustomers.some(x => x.id === c.id)) affectedCustomers.push(c);
        });
      });

      // Check all splices where this cable is incoming
      db.splices.filter(s => s.incomingCableId === cable.id).forEach(spl => {
        const jb = db.jointBoxes.find(j => j.id === spl.jointBoxId);
        if (jb && !affectedJointBoxes.some(x => x.id === jb.id)) affectedJointBoxes.push(jb);

        db.splitters.filter(s => s.inputCableId === spl.outgoingCableId).forEach(s => {
          if (!affectedSplitters.some(x => x.id === s.id)) affectedSplitters.push(s);
          db.customers.filter(c => c.splitterId === s.id).forEach(c => {
            if (!affectedCustomers.some(x => x.id === c.id)) affectedCustomers.push(c);
          });
        });
      });
    }
  }

  // 4. Joint Box Damage / Flooding Failure
  else if (targetType === 'JOINT_BOX') {
    const jb = db.jointBoxes.find(j => j.id === targetId || j.jointBoxId === targetId);
    if (jb) {
      targetName = `${jb.name} (${jb.jointBoxId})`;
      affectedJointBoxes.push(jb);

      // Find all splices inside this JB
      const splices = db.splices.filter(s => s.jointBoxId === jb.id);
      splices.forEach(spl => {
        // Find splitters downstream from outgoing cables
        db.splitters.filter(s => s.inputCableId === spl.outgoingCableId).forEach(s => {
          if (!affectedSplitters.some(x => x.id === s.id)) affectedSplitters.push(s);
          db.customers.filter(c => c.splitterId === s.id).forEach(c => {
            if (!affectedCustomers.some(x => x.id === c.id)) affectedCustomers.push(c);
          });
        });
      });
    }
  }

  // 5. PON Port Failure
  else if (targetType === 'PON') {
    const pon = db.ponPorts.find(p => p.id === targetId);
    if (pon) {
      targetName = pon.name;
      if (pon.connectedSplitterId) {
        const splt = db.splitters.find(s => s.id === pon.connectedSplitterId);
        if (splt) {
          affectedSplitters.push(splt);
          db.customers.filter(c => c.splitterId === splt.id).forEach(c => {
            if (!affectedCustomers.some(x => x.id === c.id)) affectedCustomers.push(c);
          });
        }
      }
      if (pon.connectedFiberCableId && pon.connectedCoreNumber) {
        const downstream = calculateCustomerImpact(db, 'CORE', `${pon.connectedFiberCableId}-C${pon.connectedCoreNumber.toString().padStart(2, '0')}`);
        downstream.affectedCustomers.forEach(c => {
          if (!affectedCustomers.some(x => x.id === c.id)) affectedCustomers.push(c);
        });
      }
    }
  }

  // Fallback: If no direct chain found yet, return all active customers on any splitters identified
  return {
    targetType,
    targetId,
    targetName,
    affectedCustomers,
    affectedCustomerCount: affectedCustomers.length,
    affectedSplitters,
    affectedJointBoxes,
    affectedCables,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Generate formatted Outage Broadcast SMS / Email text
 */
export function generateOutageNotificationText(
  impact: CustomerImpactResult,
  estimatedRestorationHours = 2
): string {
  return `[OptiFiber Network Alert] Dear Subscriber, our NOC has detected an emergency optical outage affecting ${impact.targetName}. Our field fiber restoration crew has been dispatched. Estimated repair time: ${estimatedRestorationHours} hours. Affected accounts: ${impact.affectedCustomerCount}. For priority updates contact ISP NOC hotline.`;
}

/**
 * Export Affected Customers to standard CSV string
 */
export function exportAffectedCustomersToCSV(customers: Customer[], db: OptiFiberDatabase): string {
  const headers = [
    'Customer ID',
    'Customer Name',
    'Phone',
    'WhatsApp',
    'Address',
    'Area',
    'Zone',
    'Package',
    'ONU Model',
    'ONU MAC',
    'Splitter ID',
    'Port #',
    'Status'
  ];

  const rows = customers.map(c => {
    const splt = db.splitters.find(s => s.id === c.splitterId);
    return [
      c.customerId,
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone,
      c.whatsapp || '',
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.area,
      c.zone,
      c.package,
      c.onuModel,
      c.onuMac,
      splt?.splitterId || c.splitterId || 'N/A',
      c.splitterPortNumber || '',
      c.status
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

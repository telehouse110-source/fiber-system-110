import { OptiFiberDatabase } from '../types';

export interface ValidationIssue {
  type: 'error' | 'warning';
  field?: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Validates a core connection / assignment
 */
export function validateCoreAssignment(
  db: OptiFiberDatabase,
  cableId: string,
  coreNumber: number,
  targetType: string,
  targetId: string,
  currentCoreId?: string
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const cable = db.cables.find(c => c.id === cableId);
  if (!cable) {
    errors.push({ type: 'error', field: 'cableId', message: `Target cable "${cableId}" does not exist.` });
    return { isValid: false, errors, warnings };
  }

  if (coreNumber < 1 || coreNumber > cable.coreCount) {
    errors.push({
      type: 'error',
      field: 'coreNumber',
      message: `Invalid Core #${coreNumber}. Cable "${cable.cableId}" only has ${cable.coreCount} cores (allowed: 1-${cable.coreCount}).`
    });
  }

  // Check if core is already connected to another entity
  const existingCore = db.cores.find(
    c => c.cableId === cableId && c.coreNumber === coreNumber && c.id !== currentCoreId
  );
  if (existingCore && existingCore.connectedToType && existingCore.connectedToType !== 'NONE') {
    warnings.push({
      type: 'warning',
      field: 'coreNumber',
      message: `Core #${coreNumber} of "${cable.cableId}" is already connected to [${existingCore.connectedToType}: ${existingCore.connectedToLabel || existingCore.connectedToId}]. Overwriting will break the existing link.`
    });
  }

  // Check if target is already occupied
  if (targetType === 'OLT_PON') {
    const pon = db.ponPorts.find(p => p.id === targetId);
    if (pon && pon.connectedFiberCableId && (pon.connectedFiberCableId !== cableId || pon.connectedCoreNumber !== coreNumber)) {
      warnings.push({
        type: 'warning',
        field: 'targetId',
        message: `PON Port "${pon.name}" is already linked to Cable "${pon.connectedFiberCableId}" Core #${pon.connectedCoreNumber}. Reassignment will update the PON feed.`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates fusion/mechanical splice parameters
 */
export function validateSplice(
  db: OptiFiberDatabase,
  jointBoxId: string,
  incomingCableId: string,
  incomingCoreNumber: number,
  outgoingCableId: string,
  outgoingCoreNumber: number,
  currentSpliceId?: string
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!jointBoxId) {
    errors.push({ type: 'error', field: 'jointBoxId', message: 'Joint Box enclosure is required.' });
  }

  if (!incomingCableId || !outgoingCableId) {
    errors.push({ type: 'error', field: 'cables', message: 'Both incoming and outgoing cables must be selected.' });
    return { isValid: false, errors, warnings };
  }

  // 1. Self-splice validation
  if (incomingCableId === outgoingCableId && incomingCoreNumber === outgoingCoreNumber) {
    errors.push({
      type: 'error',
      field: 'outgoingCoreNumber',
      message: 'Invalid loop: A fiber core cannot be spliced to itself.'
    });
  }

  // 2. Core bounds validation
  const inCable = db.cables.find(c => c.id === incomingCableId);
  const outCable = db.cables.find(c => c.id === outgoingCableId);

  if (inCable && (incomingCoreNumber < 1 || incomingCoreNumber > inCable.coreCount)) {
    errors.push({
      type: 'error',
      field: 'incomingCoreNumber',
      message: `Incoming Core #${incomingCoreNumber} is out of bounds for ${inCable.cableId} (Max: ${inCable.coreCount}).`
    });
  }

  if (outCable && (outgoingCoreNumber < 1 || outgoingCoreNumber > outCable.coreCount)) {
    errors.push({
      type: 'error',
      field: 'outgoingCoreNumber',
      message: `Outgoing Core #${outgoingCoreNumber} is out of bounds for ${outCable.cableId} (Max: ${outCable.coreCount}).`
    });
  }

  // 3. Existing splice collision check
  const existingIncoming = db.splices.find(
    s => s.id !== currentSpliceId &&
    ((s.incomingCableId === incomingCableId && s.incomingCoreNumber === incomingCoreNumber) ||
     (s.outgoingCableId === incomingCableId && s.outgoingCoreNumber === incomingCoreNumber))
  );
  if (existingIncoming) {
    const jb = db.jointBoxes.find(j => j.id === existingIncoming.jointBoxId);
    warnings.push({
      type: 'warning',
      field: 'incomingCoreNumber',
      message: `Incoming Core #${incomingCoreNumber} of ${inCable?.cableId || incomingCableId} is already spliced in ${jb?.name || existingIncoming.jointBoxId}.`
    });
  }

  const existingOutgoing = db.splices.find(
    s => s.id !== currentSpliceId &&
    ((s.incomingCableId === outgoingCableId && s.incomingCoreNumber === outgoingCoreNumber) ||
     (s.outgoingCableId === outgoingCableId && s.outgoingCoreNumber === outgoingCoreNumber))
  );
  if (existingOutgoing) {
    const jb = db.jointBoxes.find(j => j.id === existingOutgoing.jointBoxId);
    warnings.push({
      type: 'warning',
      field: 'outgoingCoreNumber',
      message: `Outgoing Core #${outgoingCoreNumber} of ${outCable?.cableId || outgoingCableId} is already spliced in ${jb?.name || existingOutgoing.jointBoxId}.`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates optical splitter port assignment
 */
export function validateSplitterPortAssignment(
  db: OptiFiberDatabase,
  splitterId: string,
  portNumber: number,
  customerId?: string
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const splitter = db.splitters.find(s => s.id === splitterId);
  if (!splitter) {
    errors.push({ type: 'error', field: 'splitterId', message: 'Target Optical Splitter does not exist.' });
    return { isValid: false, errors, warnings };
  }

  if (portNumber < 1 || portNumber > splitter.ports.length) {
    errors.push({
      type: 'error',
      field: 'portNumber',
      message: `Port #${portNumber} is invalid for Splitter "${splitter.splitterId}". It has ${splitter.ports.length} ports.`
    });
    return { isValid: false, errors, warnings };
  }

  const port = splitter.ports.find(p => p.portNumber === portNumber);
  if (port && port.connectedCustomerId && port.connectedCustomerId !== customerId) {
    const existingCust = db.customers.find(c => c.id === port.connectedCustomerId);
    warnings.push({
      type: 'warning',
      field: 'portNumber',
      message: `Port #${portNumber} of Splitter "${splitter.splitterId}" is already assigned to customer "${existingCust?.name || port.connectedCustomerId}".`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates active equipment serial number uniqueness
 */
export function validateSerialNumber(
  db: OptiFiberDatabase,
  serialNumber: string,
  currentDeviceId?: string
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!serialNumber || !serialNumber.trim()) {
    return { isValid: true, errors, warnings };
  }

  const cleanSn = serialNumber.trim().toUpperCase();

  // Check across ONUs, OLTs, Switches, SFPs
  const duplicateOnu = db.customers.find(c => c.onuSerial && c.onuSerial.trim().toUpperCase() === cleanSn && c.id !== currentDeviceId);
  if (duplicateOnu) {
    errors.push({
      type: 'error',
      field: 'serialNumber',
      message: `Duplicate Serial Number "${cleanSn}"! Already assigned to ONU of customer "${duplicateOnu.name}" (${duplicateOnu.customerId}).`
    });
  }

  const duplicateSfp = db.sfps.find(s => s.serialNumber && s.serialNumber.trim().toUpperCase() === cleanSn && s.id !== currentDeviceId);
  if (duplicateSfp) {
    errors.push({
      type: 'error',
      field: 'serialNumber',
      message: `Duplicate Serial Number "${cleanSn}"! Already assigned to SFP Module "${duplicateSfp.model}".`
    });
  }

  const duplicateOlt = db.olts.find(o => o.serialNumber && o.serialNumber.trim().toUpperCase() === cleanSn && o.id !== currentDeviceId);
  if (duplicateOlt) {
    errors.push({
      type: 'error',
      field: 'serialNumber',
      message: `Duplicate Serial Number "${cleanSn}"! Already assigned to OLT "${duplicateOlt.name}".`
    });
  }

  const duplicateSwitch = db.switches.find(s => s.serialNumber && s.serialNumber.trim().toUpperCase() === cleanSn && s.id !== currentDeviceId);
  if (duplicateSwitch) {
    errors.push({
      type: 'error',
      field: 'serialNumber',
      message: `Duplicate Serial Number "${cleanSn}"! Already assigned to Switch "${duplicateSwitch.name}".`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates Duct Capacity
 */
export function validateDuctCapacity(
  db: OptiFiberDatabase,
  ductId: string,
  cableIdsToAdd: string[] = []
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const duct = db.ducts?.find(d => d.id === ductId);
  if (!duct) {
    return { isValid: true, errors, warnings };
  }

  const currentCablesCount = (duct.assignedCableIds || []).length;
  const totalProjected = currentCablesCount + cableIdsToAdd.length;

  if (totalProjected > duct.totalDuctWays) {
    warnings.push({
      type: 'warning',
      field: 'capacity',
      message: `Duct "${duct.name}" (${duct.assetId}) capacity exceeded! Contains ${currentCablesCount} cables, adding ${cableIdsToAdd.length} exceeds total ${duct.totalDuctWays} conduit ways.`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

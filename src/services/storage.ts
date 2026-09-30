import { 
  OptiFiberDatabase, 
  AuditHistoryRecord, 
  UserRole, 
  UserPermissions,
  FiberRoute,
  FiberCable,
  FiberCore,
  JointBox,
  SpliceConnection,
  OpticalSplitter,
  Customer,
  Supplier,
  POP,
  OLT,
  PONPort,
  SwitchDevice,
  SFPModule,
  Dealer,
  MaintenanceTicket,
  FiberColorConfig,
  UserAccount,
  Duct,
  FiberSegment,
  SplitterRing,
  NetworkZone,
  NetworkArea,
  NetworkRoad,
  NetworkChangeRequest,
  SignalMeasurement
} from '../types';
import { INITIAL_DATABASE, generateCoresForCable } from '../data/seedData';
import { generateMasterAssetId } from './assetIdGenerator';

const DB_STORAGE_KEY = 'optifiber_isp_database_v1';

export function getDatabase(): OptiFiberDatabase {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      saveDatabase(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
    const parsed: OptiFiberDatabase = JSON.parse(raw);
    if (!parsed || !parsed.cables || !parsed.routes) {
      saveDatabase(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
    // Backward compatibility guarantee for all new relational tables
    if (!parsed.zones || parsed.zones.length === 0) {
      parsed.zones = INITIAL_DATABASE.zones;
    }
    if (!parsed.areas || parsed.areas.length === 0) {
      parsed.areas = INITIAL_DATABASE.areas;
    }
    if (!parsed.roads || parsed.roads.length === 0) {
      parsed.roads = INITIAL_DATABASE.roads;
    }
    if (!parsed.ducts || parsed.ducts.length === 0) {
      parsed.ducts = INITIAL_DATABASE.ducts;
    }
    if (!parsed.fiberSegments || parsed.fiberSegments.length === 0) {
      parsed.fiberSegments = INITIAL_DATABASE.fiberSegments;
    }
    if (!parsed.splitterRings || parsed.splitterRings.length === 0) {
      parsed.splitterRings = INITIAL_DATABASE.splitterRings;
    }
    if (!parsed.changeRequests || parsed.changeRequests.length === 0) {
      parsed.changeRequests = INITIAL_DATABASE.changeRequests;
    }
    if (!parsed.signalMeasurements || parsed.signalMeasurements.length === 0) {
      parsed.signalMeasurements = INITIAL_DATABASE.signalMeasurements;
    }
    if (!parsed.discoveryEvents) {
      parsed.discoveryEvents = INITIAL_DATABASE.discoveryEvents;
    }
    if (!parsed.telemetry) {
      parsed.telemetry = INITIAL_DATABASE.telemetry;
    }
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = INITIAL_DATABASE.users;
    }

    // Auto-populate Master Asset IDs if any legacy items lack one
    parsed.cables.forEach(c => { if (!c.assetId) c.assetId = generateMasterAssetId('FIBER_CABLE', parsed); });
    parsed.routes.forEach(r => { if (!r.assetId) r.assetId = generateMasterAssetId('FIBER_ROUTE', parsed); });
    parsed.jointBoxes.forEach(j => { if (!j.assetId) j.assetId = generateMasterAssetId('JOINT_BOX', parsed); });
    parsed.splitters.forEach(s => { if (!s.assetId) s.assetId = generateMasterAssetId('SPLITTER', parsed); });
    parsed.customers.forEach(c => { if (!c.assetId) c.assetId = generateMasterAssetId('CUSTOMER', parsed); });
    parsed.olts.forEach(o => { if (!o.assetId) o.assetId = generateMasterAssetId('OLT', parsed); });
    parsed.ponPorts.forEach(p => { if (!p.assetId) p.assetId = generateMasterAssetId('PON', parsed); });
    parsed.switches.forEach(s => { if (!s.assetId) s.assetId = generateMasterAssetId('SWITCH', parsed); });

    return parsed;
  } catch (err) {
    console.error('Failed to parse database from localStorage, resetting to initial seed:', err);
    saveDatabase(INITIAL_DATABASE);
    return INITIAL_DATABASE;
  }
}

export function saveDatabase(db: OptiFiberDatabase): void {
  try {
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    // Dispatch custom event for real-time cross-component reactivity
    window.dispatchEvent(new CustomEvent('optifiber-db-updated', { detail: { timestamp: db.lastUpdated } }));
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
  }
}

// User Permission Matrix
export function getPermissionsForRole(role: UserRole): UserPermissions {
  switch (role) {
    case 'Super Admin':
      return {
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canMaintenance: true,
        canReports: true,
        canBackup: true,
        canManageUsers: true,
        canRunDiscovery: true,
      };
    case 'Network Admin':
      return {
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canMaintenance: true,
        canReports: true,
        canBackup: true,
        canManageUsers: false,
        canRunDiscovery: true,
      };
    case 'Technician':
      return {
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canMaintenance: true,
        canReports: true,
        canBackup: false,
        canManageUsers: false,
        canRunDiscovery: false,
      };
    case 'Documentation Staff':
      return {
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canMaintenance: false,
        canReports: true,
        canBackup: false,
        canManageUsers: false,
        canRunDiscovery: false,
      };
    case 'Viewer':
    default:
      return {
        canView: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canMaintenance: false,
        canReports: true,
        canBackup: false,
        canManageUsers: false,
        canRunDiscovery: false,
      };
  }
}

// Helper to log audit events
export function logAudit(
  db: OptiFiberDatabase,
  entry: Omit<AuditHistoryRecord, 'id' | 'timestamp' | 'user' | 'userRole'> & { reason?: string }
): void {
  const user = db.currentUser || { name: 'Admin', role: 'Super Admin' as UserRole };
  const record: AuditHistoryRecord = {
    id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    user: user.name,
    userRole: user.role,
    ...entry,
    reason: entry.reason || 'Routine network maintenance',
  };
  db.auditLogs.unshift(record);
  // Keep last 500 audit records
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

// Conflict Checking Engine
export interface ConflictCheckResult {
  hasConflict: boolean;
  warnings: string[];
  blockers: string[];
}

export function checkSpliceConflict(
  db: OptiFiberDatabase,
  incomingCableId: string,
  incomingCoreNumber: number,
  outgoingCableId: string,
  outgoingCoreNumber: number,
  currentSpliceId?: string
): ConflictCheckResult {
  const warnings: string[] = [];
  const blockers: string[] = [];

  // 1. Same core self-splice check
  if (incomingCableId === outgoingCableId && incomingCoreNumber === outgoingCoreNumber) {
    blockers.push('Cannot splice a core to itself.');
  }

  // 2. Check if incoming core is already spliced elsewhere
  const existingIncoming = db.splices.find(
    s => s.id !== currentSpliceId && 
    ((s.incomingCableId === incomingCableId && s.incomingCoreNumber === incomingCoreNumber) ||
     (s.outgoingCableId === incomingCableId && s.outgoingCoreNumber === incomingCoreNumber))
  );
  if (existingIncoming) {
    const jb = db.jointBoxes.find(j => j.id === existingIncoming.jointBoxId);
    warnings.push(`Incoming Core #${incomingCoreNumber} of ${incomingCableId} is already spliced in ${jb?.name || existingIncoming.jointBoxId} (Splice ID: ${existingIncoming.id}). Saving will update or override this splice.`);
  }

  // 3. Check if outgoing core is already spliced elsewhere
  const existingOutgoing = db.splices.find(
    s => s.id !== currentSpliceId && 
    ((s.incomingCableId === outgoingCableId && s.incomingCoreNumber === outgoingCoreNumber) ||
     (s.outgoingCableId === outgoingCableId && s.outgoingCoreNumber === outgoingCoreNumber))
  );
  if (existingOutgoing) {
    const jb = db.jointBoxes.find(j => j.id === existingOutgoing.jointBoxId);
    warnings.push(`Outgoing Core #${outgoingCoreNumber} of ${outgoingCableId} is already spliced in ${jb?.name || existingOutgoing.jointBoxId} (Splice ID: ${existingOutgoing.id}).`);
  }

  return {
    hasConflict: blockers.length > 0 || warnings.length > 0,
    warnings,
    blockers,
  };
}

export function checkSplitterPortConflict(
  db: OptiFiberDatabase,
  splitterId: string,
  portNumber: number,
  newCustomerId: string
): ConflictCheckResult {
  const warnings: string[] = [];
  const blockers: string[] = [];

  const splitter = db.splitters.find(s => s.id === splitterId);
  if (splitter) {
    const port = splitter.ports.find(p => p.portNumber === portNumber);
    if (port && port.connectedCustomerId && port.connectedCustomerId !== newCustomerId) {
      const existingCust = db.customers.find(c => c.id === port.connectedCustomerId);
      warnings.push(`Splitter ${splitter.splitterId} Port #${portNumber} is already assigned to customer "${existingCust?.name || port.connectedCustomerId}".`);
    }
  }

  return {
    hasConflict: blockers.length > 0 || warnings.length > 0,
    warnings,
    blockers,
  };
}

// ----------------- CRUD IMPLEMENTATIONS -----------------

// Fiber Route
export function addRoute(route: Omit<FiberRoute, 'id'>, reason = 'New fiber route added'): FiberRoute {
  const db = getDatabase();
  const newRoute: FiberRoute = {
    ...route,
    id: 'rte-' + Date.now(),
  };
  db.routes.push(newRoute);
  logAudit(db, {
    entityType: 'FiberRoute',
    entityId: newRoute.id,
    entityName: newRoute.routeName,
    action: 'Created',
    newValue: `Route ID: ${newRoute.routeId}, Length: ${newRoute.cableLengthMeters}m, Cores: ${newRoute.coreCount}`,
    reason,
  });
  saveDatabase(db);
  return newRoute;
}

export function updateRoute(id: string, updates: Partial<FiberRoute>, reason = 'Route configuration updated'): FiberRoute | null {
  const db = getDatabase();
  const idx = db.routes.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const oldRoute = db.routes[idx];
  const updatedRoute = { ...oldRoute, ...updates };
  db.routes[idx] = updatedRoute;
  logAudit(db, {
    entityType: 'FiberRoute',
    entityId: id,
    entityName: updatedRoute.routeName,
    action: 'Updated',
    oldValue: oldRoute.status,
    newValue: updatedRoute.status,
    reason,
  });
  saveDatabase(db);
  return updatedRoute;
}

export function deleteRoute(id: string, reason = 'Fiber route removed'): boolean {
  const db = getDatabase();
  const idx = db.routes.findIndex(r => r.id === id);
  if (idx === -1) return false;
  const route = db.routes[idx];
  db.routes.splice(idx, 1);
  logAudit(db, {
    entityType: 'FiberRoute',
    entityId: id,
    entityName: route.routeName,
    action: 'Deleted',
    oldValue: route.routeId,
    reason,
  });
  saveDatabase(db);
  return true;
}

// Fiber Cable & Cores
export function addCable(cable: Omit<FiberCable, 'id'>, reason = 'New physical fiber cable registered'): FiberCable {
  const db = getDatabase();
  const newCable: FiberCable = {
    ...cable,
    id: 'cbl-' + Date.now(),
  };
  db.cables.push(newCable);

  // Automatically generate cores for this cable
  const newCores = generateCoresForCable(newCable.id, newCable.coreCount, db.colors);
  db.cores.push(...newCores);

  logAudit(db, {
    entityType: 'FiberCable',
    entityId: newCable.id,
    entityName: newCable.cableId,
    action: 'Created',
    newValue: `${newCable.coreCount} Cores, Length: ${newCable.totalLengthMeters}m`,
    reason,
  });
  saveDatabase(db);
  return newCable;
}

export function updateCable(id: string, updates: Partial<FiberCable>, reason = 'Cable details updated'): FiberCable | null {
  const db = getDatabase();
  const idx = db.cables.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const oldCable = db.cables[idx];
  const updated = { ...oldCable, ...updates };
  db.cables[idx] = updated;
  logAudit(db, {
    entityType: 'FiberCable',
    entityId: id,
    entityName: updated.cableId,
    action: 'Updated',
    oldValue: oldCable.status,
    newValue: updated.status,
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteCable(id: string, reason = 'Cable decommissioned'): boolean {
  const db = getDatabase();
  const idx = db.cables.findIndex(c => c.id === id);
  if (idx === -1) return false;
  const cable = db.cables[idx];
  db.cables.splice(idx, 1);
  // Remove cores and related splices
  db.cores = db.cores.filter(core => core.cableId !== id);
  db.splices = db.splices.filter(s => s.incomingCableId !== id && s.outgoingCableId !== id);
  logAudit(db, {
    entityType: 'FiberCable',
    entityId: id,
    entityName: cable.cableId,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// Fiber Core Updates
export function updateCore(id: string, updates: Partial<FiberCore>, reason = 'Core status/power modified'): FiberCore | null {
  const db = getDatabase();
  const idx = db.cores.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const oldCore = db.cores[idx];
  const updated = { ...oldCore, ...updates };
  db.cores[idx] = updated;
  
  if (oldCore.status !== updated.status) {
    logAudit(db, {
      entityType: 'FiberCore',
      entityId: id,
      entityName: `${oldCore.cableId} Core #${oldCore.coreNumber} (${oldCore.colorName})`,
      action: 'Status Changed',
      fieldChanged: 'Status',
      oldValue: oldCore.status,
      newValue: updated.status,
      reason,
    });
  } else {
    logAudit(db, {
      entityType: 'FiberCore',
      entityId: id,
      entityName: `${oldCore.cableId} Core #${oldCore.coreNumber}`,
      action: 'Updated',
      reason,
    });
  }
  saveDatabase(db);
  return updated;
}

// Joint Box
export function addJointBox(jb: Omit<JointBox, 'id'>, reason = 'New joint box deployed'): JointBox {
  const db = getDatabase();
  const newJb: JointBox = {
    ...jb,
    id: 'jb-' + Date.now(),
  };
  db.jointBoxes.push(newJb);
  logAudit(db, {
    entityType: 'JointBox',
    entityId: newJb.id,
    entityName: newJb.name,
    action: 'Created',
    newValue: `ID: ${newJb.jointBoxId}, Capacity: ${newJb.maxSpliceCapacity} splices`,
    reason,
  });
  saveDatabase(db);
  return newJb;
}

export function updateJointBox(id: string, updates: Partial<JointBox>, reason = 'Joint box details updated'): JointBox | null {
  const db = getDatabase();
  const idx = db.jointBoxes.findIndex(j => j.id === id);
  if (idx === -1) return null;
  const old = db.jointBoxes[idx];
  const updated = { ...old, ...updates };
  db.jointBoxes[idx] = updated;
  logAudit(db, {
    entityType: 'JointBox',
    entityId: id,
    entityName: updated.name,
    action: 'Updated',
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteJointBox(id: string, reason = 'Joint box removed'): boolean {
  const db = getDatabase();
  const idx = db.jointBoxes.findIndex(j => j.id === id);
  if (idx === -1) return false;
  const jb = db.jointBoxes[idx];
  db.jointBoxes.splice(idx, 1);
  // Remove splices inside this joint box
  db.splices = db.splices.filter(s => s.jointBoxId !== id);
  logAudit(db, {
    entityType: 'JointBox',
    entityId: id,
    entityName: jb.name,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// Splice Connections
export function addSplice(splice: Omit<SpliceConnection, 'id'>, reason = 'Core-to-core fusion splice completed'): SpliceConnection {
  const db = getDatabase();
  const newSplice: SpliceConnection = {
    ...splice,
    id: 'spl-' + Date.now(),
  };
  db.splices.push(newSplice);

  // Update core statuses to Active
  const inCore = db.cores.find(c => c.cableId === splice.incomingCableId && c.coreNumber === splice.incomingCoreNumber);
  if (inCore) {
    inCore.status = 'Active';
    inCore.connectedToType = 'SPLICE';
    inCore.connectedToId = newSplice.id;
    inCore.nextConnectionId = newSplice.id;
  }
  const outCore = db.cores.find(c => c.cableId === splice.outgoingCableId && c.coreNumber === splice.outgoingCoreNumber);
  if (outCore) {
    outCore.status = 'Active';
    outCore.connectedToType = 'SPLICE';
    outCore.connectedToId = newSplice.id;
    outCore.previousConnectionId = newSplice.id;
  }

  logAudit(db, {
    entityType: 'Splice',
    entityId: newSplice.id,
    entityName: `${splice.incomingCableId} C#${splice.incomingCoreNumber} -> ${splice.outgoingCableId} C#${splice.outgoingCoreNumber}`,
    action: 'Spliced',
    newValue: `Type: ${splice.spliceType}, Loss: ${splice.spliceLossDb} dB`,
    reason,
  });
  saveDatabase(db);
  return newSplice;
}

export function updateSplice(id: string, updates: Partial<SpliceConnection>, reason = 'Splice parameters modified'): SpliceConnection | null {
  const db = getDatabase();
  const idx = db.splices.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const old = db.splices[idx];
  const updated = { ...old, ...updates };
  db.splices[idx] = updated;
  logAudit(db, {
    entityType: 'Splice',
    entityId: id,
    entityName: `${updated.incomingCableId} C#${updated.incomingCoreNumber} -> ${updated.outgoingCableId} C#${updated.outgoingCoreNumber}`,
    action: 'Updated',
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteSplice(id: string, reason = 'Splice cut or disconnected'): boolean {
  const db = getDatabase();
  const idx = db.splices.findIndex(s => s.id === id);
  if (idx === -1) return false;
  const splice = db.splices[idx];
  db.splices.splice(idx, 1);

  // Revert core statuses to Spare if not connected elsewhere
  const inCore = db.cores.find(c => c.cableId === splice.incomingCableId && c.coreNumber === splice.incomingCoreNumber);
  if (inCore) {
    inCore.status = 'Spare';
    inCore.nextConnectionId = undefined;
  }
  const outCore = db.cores.find(c => c.cableId === splice.outgoingCableId && c.coreNumber === splice.outgoingCoreNumber);
  if (outCore) {
    outCore.status = 'Spare';
    outCore.previousConnectionId = undefined;
  }

  logAudit(db, {
    entityType: 'Splice',
    entityId: id,
    entityName: `${splice.incomingCableId} C#${splice.incomingCoreNumber} -> ${splice.outgoingCableId} C#${splice.outgoingCoreNumber}`,
    action: 'Cut',
    reason,
  });
  saveDatabase(db);
  return true;
}

// Splitter CRUD
export function calculateSplitterExpectedLoss(splitRatio: OpticalSplitter['splitRatio']): number {
  switch (splitRatio) {
    case '1:2': return 3.5;
    case '1:4': return 7.2;
    case '1:8': return 10.5;
    case '1:16': return 13.8;
    case '1:32': return 17.0;
    case '1:64': return 20.5;
    case '20/80': return 7.5;
    case '85/15': return 8.5;
    case '95/5': return 13.5;
    default: return 10.5;
  }
}

export function addSplitter(splitter: Omit<OpticalSplitter, 'id'>, reason = 'New optical splitter installed'): OpticalSplitter {
  const db = getDatabase();
  const newSplitter: OpticalSplitter = {
    ...splitter,
    id: 'spl-' + Date.now(),
  };
  db.splitters.push(newSplitter);
  logAudit(db, {
    entityType: 'OpticalSplitter',
    entityId: newSplitter.id,
    entityName: newSplitter.splitterId,
    action: 'Created',
    newValue: `Ratio: ${newSplitter.splitRatio}, Expected Loss: ${newSplitter.expectedLossDb} dB`,
    reason,
  });
  saveDatabase(db);
  return newSplitter;
}

export function updateSplitter(id: string, updates: Partial<OpticalSplitter>, reason = 'Splitter configuration modified'): OpticalSplitter | null {
  const db = getDatabase();
  const idx = db.splitters.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const old = db.splitters[idx];
  const updated = { ...old, ...updates };
  db.splitters[idx] = updated;
  logAudit(db, {
    entityType: 'OpticalSplitter',
    entityId: id,
    entityName: updated.splitterId,
    action: 'Updated',
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteSplitter(id: string, reason = 'Splitter removed'): boolean {
  const db = getDatabase();
  const idx = db.splitters.findIndex(s => s.id === id);
  if (idx === -1) return false;
  const splitter = db.splitters[idx];
  db.splitters.splice(idx, 1);
  logAudit(db, {
    entityType: 'OpticalSplitter',
    entityId: id,
    entityName: splitter.splitterId,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// Customers CRUD
export function addCustomer(cust: Omit<Customer, 'id'>, reason = 'New subscriber registered'): Customer {
  const db = getDatabase();
  const newCust: Customer = {
    ...cust,
    id: 'cust-' + Date.now(),
  };
  db.customers.push(newCust);

  // Link to splitter port if provided
  if (newCust.splitterId && newCust.splitterPortNumber) {
    const splitter = db.splitters.find(s => s.id === newCust.splitterId);
    if (splitter) {
      const port = splitter.ports.find(p => p.portNumber === newCust.splitterPortNumber);
      if (port) {
        port.status = 'Active';
        port.connectedCustomerId = newCust.id;
      }
    }
  }

  logAudit(db, {
    entityType: 'Customer',
    entityId: newCust.id,
    entityName: `${newCust.name} (${newCust.customerId})`,
    action: 'Created',
    newValue: `Package: ${newCust.package}, Status: ${newCust.status}`,
    reason,
  });
  saveDatabase(db);
  return newCust;
}

export function updateCustomer(id: string, updates: Partial<Customer>, reason = 'Customer details updated'): Customer | null {
  const db = getDatabase();
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const old = db.customers[idx];
  const updated = { ...old, ...updates };
  db.customers[idx] = updated;

  // If splitter or port changed, synchronize splitter ports
  if (updates.splitterId !== undefined || updates.splitterPortNumber !== undefined) {
    // Remove old port assignment
    if (old.splitterId && old.splitterPortNumber) {
      const oldSplitter = db.splitters.find(s => s.id === old.splitterId);
      if (oldSplitter) {
        const p = oldSplitter.ports.find(port => port.portNumber === old.splitterPortNumber);
        if (p && p.connectedCustomerId === id) {
          p.connectedCustomerId = undefined;
          p.status = 'Spare';
        }
      }
    }
    // Set new port assignment
    if (updated.splitterId && updated.splitterPortNumber) {
      const newSplitter = db.splitters.find(s => s.id === updated.splitterId);
      if (newSplitter) {
        const p = newSplitter.ports.find(port => port.portNumber === updated.splitterPortNumber);
        if (p) {
          p.status = 'Active';
          p.connectedCustomerId = id;
        }
      }
    }
  }

  logAudit(db, {
    entityType: 'Customer',
    entityId: id,
    entityName: `${updated.name} (${updated.customerId})`,
    action: 'Updated',
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteCustomer(id: string, reason = 'Subscriber deactivated/removed'): boolean {
  const db = getDatabase();
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx === -1) return false;
  const cust = db.customers[idx];
  db.customers.splice(idx, 1);

  // Unlink from splitter port
  if (cust.splitterId && cust.splitterPortNumber) {
    const spl = db.splitters.find(s => s.id === cust.splitterId);
    if (spl) {
      const p = spl.ports.find(port => port.portNumber === cust.splitterPortNumber);
      if (p && p.connectedCustomerId === id) {
        p.connectedCustomerId = undefined;
        p.status = 'Spare';
      }
    }
  }

  logAudit(db, {
    entityType: 'Customer',
    entityId: id,
    entityName: `${cust.name} (${cust.customerId})`,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// Maintenance Tickets CRUD
export function addTicket(ticket: Omit<MaintenanceTicket, 'id'>, reason = 'Maintenance ticket created'): MaintenanceTicket {
  const db = getDatabase();
  const newTicket: MaintenanceTicket = {
    ...ticket,
    id: 'tkt-' + Date.now(),
    photos: ticket.photos || [],
  };

  // If materials used includes fiber length, deduct from cable inventory
  if (newTicket.materialUsedItems && newTicket.cableId) {
    const cable = db.cables.find(c => c.id === newTicket.cableId || c.cableId === newTicket.cableId);
    if (cable) {
      newTicket.materialUsedItems.forEach(item => {
        if (item.unit === 'meters' && item.qty > 0) {
          cable.remainingLengthMeters = Math.max(0, (cable.remainingLengthMeters || 0) - item.qty);
        }
      });
    }
  }

  // If before/after signal recorded, log signal measurement
  if (newTicket.afterSignalDbm !== undefined && newTicket.afterSignalDbm !== null) {
    if (newTicket.cableId) {
      addSignalMeasurement({
        assetType: 'FIBER',
        assetId: newTicket.cableId,
        assetName: `Ticket ${newTicket.ticketId} Restoration`,
        date: new Date().toISOString(),
        signalDbm: newTicket.afterSignalDbm,
        lossDb: newTicket.afterLossDb,
        technician: newTicket.technician,
        status: 'Normal',
        notes: `Post-repair measurement. Work: ${newTicket.workPerformed || 'Spliced'}`,
      });
    }
  }

  db.tickets.unshift(newTicket);
  logAudit(db, {
    entityType: 'MaintenanceTicket',
    entityId: newTicket.id,
    entityName: `${newTicket.ticketId} (${newTicket.problem})`,
    action: 'Created',
    newValue: `Priority: ${newTicket.priority}, Status: ${newTicket.status}, Location: ${newTicket.location}`,
    reason,
  });
  saveDatabase(db);
  return newTicket;
}

export function updateTicket(id: string, updates: Partial<MaintenanceTicket>, reason = 'Ticket status/work log updated'): MaintenanceTicket | null {
  const db = getDatabase();
  const idx = db.tickets.findIndex(t => t.id === id);
  if (idx === -1) return null;
  const old = db.tickets[idx];
  const updated = { ...old, ...updates };

  // Material inventory deduction on status change to Resolved or Closed
  if (updates.status === 'Resolved' || updates.status === 'Closed') {
    if (updated.materialUsedItems && updated.cableId) {
      const cable = db.cables.find(c => c.id === updated.cableId || c.cableId === updated.cableId);
      if (cable) {
        updated.materialUsedItems.forEach(item => {
          if (item.unit === 'meters' && item.qty > 0 && old.status !== 'Resolved' && old.status !== 'Closed') {
            cable.remainingLengthMeters = Math.max(0, (cable.remainingLengthMeters || 0) - item.qty);
          }
        });
      }
    }

    // Auto-record restoration measurement
    if (updated.afterSignalDbm !== undefined && updated.afterSignalDbm !== null && old.afterSignalDbm === undefined) {
      addSignalMeasurement({
        assetType: 'FIBER',
        assetId: updated.cableId || updated.id,
        assetName: `Ticket ${updated.ticketId} Resolution`,
        date: new Date().toISOString(),
        signalDbm: updated.afterSignalDbm,
        lossDb: updated.afterLossDb,
        technician: updated.technician,
        status: 'Normal',
        notes: `Restoration signal: ${updated.afterSignalDbm} dBm (Previous: ${updated.beforeSignalDbm ?? 'N/A'} dBm)`,
      });
    }
  }

  db.tickets[idx] = updated;
  logAudit(db, {
    entityType: 'MaintenanceTicket',
    entityId: id,
    entityName: `${updated.ticketId} (${updated.problem})`,
    action: 'Updated',
    oldValue: old.status,
    newValue: updated.status,
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteTicket(id: string, reason = 'Ticket purged'): boolean {
  const db = getDatabase();
  const idx = db.tickets.findIndex(t => t.id === id);
  if (idx === -1) return false;
  const ticket = db.tickets[idx];
  db.tickets.splice(idx, 1);
  logAudit(db, {
    entityType: 'MaintenanceTicket',
    entityId: id,
    entityName: ticket.ticketId,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// Supplier CRUD
export function addSupplier(sup: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>, reason = 'Supplier onboarded'): Supplier {
  const db = getDatabase();
  const newSup: Supplier = {
    ...sup,
    id: 'sup-' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.suppliers.push(newSup);
  logAudit(db, {
    entityType: 'Supplier',
    entityId: newSup.id,
    entityName: newSup.name,
    action: 'Created',
    reason,
  });
  saveDatabase(db);
  return newSup;
}

export function updateSupplier(id: string, updates: Partial<Supplier>, reason = 'Supplier details updated'): Supplier | null {
  const db = getDatabase();
  const idx = db.suppliers.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const old = db.suppliers[idx];
  const updated = { ...old, ...updates, updatedAt: new Date().toISOString() };
  db.suppliers[idx] = updated;
  logAudit(db, {
    entityType: 'Supplier',
    entityId: id,
    entityName: updated.name,
    action: 'Updated',
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteSupplier(id: string, reason = 'Supplier removed'): boolean {
  const db = getDatabase();
  const idx = db.suppliers.findIndex(s => s.id === id);
  if (idx === -1) return false;
  const sup = db.suppliers[idx];
  db.suppliers.splice(idx, 1);
  logAudit(db, {
    entityType: 'Supplier',
    entityId: id,
    entityName: sup.name,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// Devices: OLT, PON, Switch, SFP
export function addOLT(olt: Omit<OLT, 'id'>, reason = 'New OLT installed'): OLT {
  const db = getDatabase();
  const newOlt: OLT = { ...olt, id: 'olt-' + Date.now() };
  db.olts.push(newOlt);
  logAudit(db, { entityType: 'OLT', entityId: newOlt.id, entityName: newOlt.name, action: 'Created', reason });
  saveDatabase(db);
  return newOlt;
}

export function updateOLT(id: string, updates: Partial<OLT>, reason = 'OLT updated'): OLT | null {
  const db = getDatabase();
  const idx = db.olts.findIndex(o => o.id === id);
  if (idx === -1) return null;
  const updated = { ...db.olts[idx], ...updates };
  db.olts[idx] = updated;
  logAudit(db, { entityType: 'OLT', entityId: id, entityName: updated.name, action: 'Updated', reason });
  saveDatabase(db);
  return updated;
}

export function deleteOLT(id: string, reason = 'OLT decommissioned'): boolean {
  const db = getDatabase();
  const idx = db.olts.findIndex(o => o.id === id);
  if (idx === -1) return false;
  const olt = db.olts[idx];
  db.olts.splice(idx, 1);
  db.ponPorts = db.ponPorts.filter(p => p.oltId !== id);
  logAudit(db, { entityType: 'OLT', entityId: id, entityName: olt.name, action: 'Deleted', reason });
  saveDatabase(db);
  return true;
}

export function addSwitch(sw: Omit<SwitchDevice, 'id'>, reason = 'Switch installed'): SwitchDevice {
  const db = getDatabase();
  const newSw: SwitchDevice = { ...sw, id: 'sw-' + Date.now() };
  db.switches.push(newSw);
  logAudit(db, { entityType: 'SwitchDevice', entityId: newSw.id, entityName: newSw.name, action: 'Created', reason });
  saveDatabase(db);
  return newSw;
}

export function updateSwitch(id: string, updates: Partial<SwitchDevice>, reason = 'Switch updated'): SwitchDevice | null {
  const db = getDatabase();
  const idx = db.switches.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const updated = { ...db.switches[idx], ...updates };
  db.switches[idx] = updated;
  logAudit(db, { entityType: 'SwitchDevice', entityId: id, entityName: updated.name, action: 'Updated', reason });
  saveDatabase(db);
  return updated;
}

export function deleteSwitch(id: string, reason = 'Switch decommissioned'): boolean {
  const db = getDatabase();
  const idx = db.switches.findIndex(s => s.id === id);
  if (idx === -1) return false;
  const sw = db.switches[idx];
  db.switches.splice(idx, 1);
  logAudit(db, { entityType: 'SwitchDevice', entityId: id, entityName: sw.name, action: 'Deleted', reason });
  saveDatabase(db);
  return true;
}

export function addPOP(pop: Omit<POP, 'id'>, reason = 'New POP created'): POP {
  const db = getDatabase();
  const newPop: POP = { ...pop, id: 'pop-' + Date.now() };
  db.pops.push(newPop);
  logAudit(db, { entityType: 'POP', entityId: newPop.id, entityName: newPop.name, action: 'Created', reason });
  saveDatabase(db);
  return newPop;
}

export function updatePOP(id: string, updates: Partial<POP>, reason = 'POP updated'): POP | null {
  const db = getDatabase();
  const idx = db.pops.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated = { ...db.pops[idx], ...updates };
  db.pops[idx] = updated;
  logAudit(db, { entityType: 'POP', entityId: id, entityName: updated.name, action: 'Updated', reason });
  saveDatabase(db);
  return updated;
}

export function deletePOP(id: string, reason = 'POP removed'): boolean {
  const db = getDatabase();
  const idx = db.pops.findIndex(p => p.id === id);
  if (idx === -1) return false;
  const pop = db.pops[idx];
  db.pops.splice(idx, 1);
  logAudit(db, { entityType: 'POP', entityId: id, entityName: pop.name, action: 'Deleted', reason });
  saveDatabase(db);
  return true;
}

export function addDealer(dealer: Omit<Dealer, 'id'>, reason = 'New dealer partner added'): Dealer {
  const db = getDatabase();
  const newDealer: Dealer = { ...dealer, id: 'dlr-' + Date.now() };
  db.dealers.push(newDealer);
  logAudit(db, { entityType: 'Dealer', entityId: newDealer.id, entityName: newDealer.name, action: 'Created', reason });
  saveDatabase(db);
  return newDealer;
}

export function updateDealer(id: string, updates: Partial<Dealer>, reason = 'Dealer updated'): Dealer | null {
  const db = getDatabase();
  const idx = db.dealers.findIndex(d => d.id === id);
  if (idx === -1) return null;
  const updated = { ...db.dealers[idx], ...updates };
  db.dealers[idx] = updated;
  logAudit(db, { entityType: 'Dealer', entityId: id, entityName: updated.name, action: 'Updated', reason });
  saveDatabase(db);
  return updated;
}

export function deleteDealer(id: string, reason = 'Dealer removed'): boolean {
  const db = getDatabase();
  const idx = db.dealers.findIndex(d => d.id === id);
  if (idx === -1) return false;
  const dealer = db.dealers[idx];
  db.dealers.splice(idx, 1);
  logAudit(db, { entityType: 'Dealer', entityId: id, entityName: dealer.name, action: 'Deleted', reason });
  saveDatabase(db);
  return true;
}

// Colors CRUD
export function updateColor(id: string, updates: Partial<FiberColorConfig>): FiberColorConfig | null {
  const db = getDatabase();
  const idx = db.colors.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const updated = { ...db.colors[idx], ...updates };
  db.colors[idx] = updated;
  
  // Propagate updated color hex and name to all corresponding cores
  db.cores.forEach(core => {
    if (core.coreNumber === updated.coreNumber) {
      core.colorName = updated.name;
      core.colorHex = updated.hex;
    }
  });

  logAudit(db, {
    entityType: 'FiberColorConfig',
    entityId: id,
    entityName: `Color #${updated.coreNumber} (${updated.name})`,
    action: 'Updated',
    newValue: `Hex: ${updated.hex}`,
    reason: 'Fiber color code standard updated',
  });
  saveDatabase(db);
  return updated;
}

// ----------------- DUCT / DUCT PATH CRUD -----------------
export function addDuct(
  duct: Omit<Duct, 'id' | 'assetId'> & { assetId?: string },
  reason = 'New duct conduit path surveyed and commissioned'
): Duct {
  const db = getDatabase();
  const assetId = duct.assetId || generateMasterAssetId('DUCT', db);
  const newDuct: Duct = {
    ...duct,
    id: 'dct-' + Date.now(),
    assetId,
    coordinates: duct.coordinates || [],
    photos: duct.photos || [],
    documents: duct.documents || [],
    assignedCableIds: duct.assignedCableIds || [],
  };
  if (!db.ducts) db.ducts = [];
  db.ducts.push(newDuct);

  logAudit(db, {
    entityType: 'Duct',
    entityId: newDuct.id,
    entityName: `${newDuct.name} (${newDuct.assetId})`,
    action: 'Created',
    newValue: `Type: ${newDuct.type}, Ways: ${newDuct.totalDuctWays}, Length: ${newDuct.lengthMeters}m`,
    reason,
  });
  saveDatabase(db);
  return newDuct;
}

export function updateDuct(
  id: string,
  updates: Partial<Duct>,
  reason = 'Duct path attributes/assigned cables updated'
): Duct | null {
  const db = getDatabase();
  if (!db.ducts) db.ducts = [];
  const idx = db.ducts.findIndex(d => d.id === id);
  if (idx === -1) return null;
  const old = db.ducts[idx];

  // Record version history snapshot
  const versionHistory = old.versionHistory || [];
  versionHistory.push({
    version: versionHistory.length + 1,
    date: new Date().toISOString(),
    user: db.currentUser?.name || 'Administrator',
    changes: reason,
    snapshotSummary: `${old.type} · ${old.occupiedWays}/${old.totalDuctWays} Ways Occupied · ${old.lengthMeters}m`,
  });

  const updated: Duct = {
    ...old,
    ...updates,
    versionHistory,
  };
  db.ducts[idx] = updated;

  logAudit(db, {
    entityType: 'Duct',
    entityId: id,
    entityName: updated.name,
    action: 'Updated',
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteDuct(id: string, reason = 'Duct decommissioned'): boolean {
  const db = getDatabase();
  if (!db.ducts) return false;
  const idx = db.ducts.findIndex(d => d.id === id);
  if (idx === -1) return false;
  const d = db.ducts[idx];
  db.ducts.splice(idx, 1);
  logAudit(db, {
    entityType: 'Duct',
    entityId: id,
    entityName: `${d.name} (${d.assetId})`,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// ----------------- FIBER SEGMENT CRUD -----------------
export function addFiberSegment(
  segment: Omit<FiberSegment, 'id' | 'assetId'> & { assetId?: string },
  reason = 'Fiber segment documented'
): FiberSegment {
  const db = getDatabase();
  const assetId = segment.assetId || generateMasterAssetId('FIBER_SEGMENT', db);
  const newSegment: FiberSegment = {
    ...segment,
    id: 'fsg-' + Date.now(),
    assetId,
    coordinates: segment.coordinates || [],
    photos: segment.photos || [],
  };
  if (!db.fiberSegments) db.fiberSegments = [];
  db.fiberSegments.push(newSegment);

  // Link segment ID to parent cable
  const cable = db.cables.find(c => c.id === segment.cableId);
  if (cable) {
    if (!cable.segmentIds) cable.segmentIds = [];
    if (!cable.segmentIds.includes(newSegment.id)) {
      cable.segmentIds.push(newSegment.id);
    }
  }

  logAudit(db, {
    entityType: 'FiberSegment',
    entityId: newSegment.id,
    entityName: `${newSegment.name} (${newSegment.assetId})`,
    action: 'Created',
    newValue: `Cable: ${segment.cableId}, Length: ${newSegment.lengthMeters}m, Cores: ${newSegment.coreCount}`,
    reason,
  });
  saveDatabase(db);
  return newSegment;
}

export function updateFiberSegment(
  id: string,
  updates: Partial<FiberSegment>,
  reason = 'Fiber segment status/details updated'
): FiberSegment | null {
  const db = getDatabase();
  if (!db.fiberSegments) db.fiberSegments = [];
  const idx = db.fiberSegments.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const old = db.fiberSegments[idx];
  const updated: FiberSegment = { ...old, ...updates };
  db.fiberSegments[idx] = updated;

  logAudit(db, {
    entityType: 'FiberSegment',
    entityId: id,
    entityName: updated.name,
    action: 'Updated',
    oldValue: old.status,
    newValue: updated.status,
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteFiberSegment(id: string, reason = 'Fiber segment removed'): boolean {
  const db = getDatabase();
  if (!db.fiberSegments) return false;
  const idx = db.fiberSegments.findIndex(s => s.id === id);
  if (idx === -1) return false;
  const s = db.fiberSegments[idx];
  db.fiberSegments.splice(idx, 1);
  logAudit(db, {
    entityType: 'FiberSegment',
    entityId: id,
    entityName: `${s.name} (${s.assetId})`,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// ----------------- SPLITTER RING CRUD -----------------
export function addSplitterRing(
  ring: Omit<SplitterRing, 'id' | 'assetId'> & { assetId?: string },
  reason = 'New protected splitter ring commissioned'
): SplitterRing {
  const db = getDatabase();
  const assetId = ring.assetId || generateMasterAssetId('SPLITTER_RING', db);
  const newRing: SplitterRing = {
    ...ring,
    id: 'rng-' + Date.now(),
    assetId,
    primarySegmentIds: ring.primarySegmentIds || [],
    backupSegmentIds: ring.backupSegmentIds || [],
    jointBoxIds: ring.jointBoxIds || [],
    splitterIds: ring.splitterIds || [],
  };
  if (!db.splitterRings) db.splitterRings = [];
  db.splitterRings.push(newRing);

  logAudit(db, {
    entityType: 'SplitterRing',
    entityId: newRing.id,
    entityName: `${newRing.name} (${newRing.assetId})`,
    action: 'Created',
    newValue: `Type: ${newRing.type}, Primary Segments: ${newRing.primarySegmentIds.length}, Backup Segments: ${newRing.backupSegmentIds.length}`,
    reason,
  });
  saveDatabase(db);
  return newRing;
}

export function updateSplitterRing(
  id: string,
  updates: Partial<SplitterRing>,
  reason = 'Splitter ring topology/failover mode updated'
): SplitterRing | null {
  const db = getDatabase();
  if (!db.splitterRings) db.splitterRings = [];
  const idx = db.splitterRings.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const old = db.splitterRings[idx];
  const updated: SplitterRing = { ...old, ...updates };
  db.splitterRings[idx] = updated;

  logAudit(db, {
    entityType: 'SplitterRing',
    entityId: id,
    entityName: updated.name,
    action: 'Updated',
    oldValue: old.status,
    newValue: updated.status,
    reason,
  });
  saveDatabase(db);
  return updated;
}

export function deleteSplitterRing(id: string, reason = 'Splitter ring removed'): boolean {
  const db = getDatabase();
  if (!db.splitterRings) return false;
  const idx = db.splitterRings.findIndex(r => r.id === id);
  if (idx === -1) return false;
  const r = db.splitterRings[idx];
  db.splitterRings.splice(idx, 1);
  logAudit(db, {
    entityType: 'SplitterRing',
    entityId: id,
    entityName: `${r.name} (${r.assetId})`,
    action: 'Deleted',
    reason,
  });
  saveDatabase(db);
  return true;
}

// ----------------- CHANGE REQUEST (MCR / RFC) CRUD -----------------
export function addChangeRequest(
  mcr: Omit<NetworkChangeRequest, 'id'>,
  reason = 'Major network change request filed'
): NetworkChangeRequest {
  const db = getDatabase();
  const newMcr: NetworkChangeRequest = {
    ...mcr,
    id: 'mcr-' + Date.now(),
    photos: mcr.photos || [],
    affectedAssetIds: mcr.affectedAssetIds || [],
  };
  if (!db.changeRequests) db.changeRequests = [];
  db.changeRequests.unshift(newMcr);

  logAudit(db, {
    entityType: 'ChangeRequest',
    entityId: newMcr.id,
    entityName: `${newMcr.changeId}: ${newMcr.title}`,
    action: 'Created',
    newValue: `Requested By: ${newMcr.requestedBy}, Status: ${newMcr.approvalStatus}`,
    reason,
  });
  saveDatabase(db);
  return newMcr;
}

export function updateChangeRequest(
  id: string,
  updates: Partial<NetworkChangeRequest>,
  reason = 'Change request reviewed/completed'
): NetworkChangeRequest | null {
  const db = getDatabase();
  if (!db.changeRequests) db.changeRequests = [];
  const idx = db.changeRequests.findIndex(m => m.id === id);
  if (idx === -1) return null;
  const old = db.changeRequests[idx];
  const updated: NetworkChangeRequest = { ...old, ...updates };
  db.changeRequests[idx] = updated;

  logAudit(db, {
    entityType: 'ChangeRequest',
    entityId: id,
    entityName: `${updated.changeId}: ${updated.title}`,
    action: 'Updated',
    oldValue: old.approvalStatus,
    newValue: updated.approvalStatus,
    reason,
  });
  saveDatabase(db);
  return updated;
}

// ----------------- SIGNAL MEASUREMENT CRUD -----------------
export function addSignalMeasurement(measurement: Omit<SignalMeasurement, 'id'>): SignalMeasurement {
  const db = getDatabase();
  const newSig: SignalMeasurement = {
    ...measurement,
    id: 'sig-' + Date.now(),
  };
  if (!db.signalMeasurements) db.signalMeasurements = [];
  db.signalMeasurements.unshift(newSig);

  // If customer link, also update latest rxPowerDbm on customer record
  if (newSig.assetType === 'CUSTOMER') {
    const cust = db.customers.find(c => c.id === newSig.assetId);
    if (cust) {
      cust.rxPowerDbm = newSig.signalDbm;
    }
  }

  saveDatabase(db);
  return newSig;
}


// Current User Switcher
export function setCurrentUser(user: UserAccount): void {
  const db = getDatabase();
  db.currentUser = user;
  saveDatabase(db);
}

// Backup & Restore
export function exportDatabaseJSON(): void {
  const db = getDatabase();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `optifiber_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importDatabaseJSON(jsonContent: string): { success: boolean; message: string } {
  try {
    const parsed: OptiFiberDatabase = JSON.parse(jsonContent);
    if (!parsed || !Array.isArray(parsed.cables) || !Array.isArray(parsed.routes)) {
      return { success: false, message: 'Invalid database backup structure: Missing required tables.' };
    }
    parsed.lastUpdated = new Date().toISOString();
    logAudit(parsed, {
      entityType: 'System',
      entityId: 'backup-restore',
      entityName: 'Database Restore',
      action: 'Restored',
      reason: 'Full database restored from JSON backup file',
    });
    saveDatabase(parsed);
    return { success: true, message: `Successfully restored database! Total Routes: ${parsed.routes.length}, Cables: ${parsed.cables.length}, Cores: ${parsed.cores.length}.` };
  } catch (err: any) {
    return { success: false, message: 'Failed to parse JSON file: ' + err.message };
  }
}

export function resetDatabase(): void {
  saveDatabase(INITIAL_DATABASE);
}

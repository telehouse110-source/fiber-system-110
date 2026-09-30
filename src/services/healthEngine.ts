import { OptiFiberDatabase } from '../types';

export interface HealthMetric {
  category: string;
  score: number; // 0 - 100
  total: number;
  complete: number;
  description: string;
  color: string;
}

export interface MissingDataItem {
  id: string;
  category: 'ROUTE' | 'JOINT_BOX' | 'CORE' | 'SPLITTER' | 'CUSTOMER' | 'DUCT' | 'SEGMENT' | 'DEVICE';
  title: string;
  detail: string;
  entityId: string;
  section: string;
  severity: 'low' | 'medium' | 'high';
}

export interface OrphanObjectItem {
  id: string;
  entityType: string;
  name: string;
  detail: string;
  reason: string;
  entityId: string;
  section: string;
}

export interface DocumentationHealthReport {
  overallHealthScore: number;
  metrics: HealthMetric[];
  missingItems: MissingDataItem[];
  orphanObjects: OrphanObjectItem[];
  generatedAt: string;
}

export function computeDocumentationHealth(db: OptiFiberDatabase): DocumentationHealthReport {
  const missingItems: MissingDataItem[] = [];
  const orphanObjects: OrphanObjectItem[] = [];

  // 1. Fiber Routes Analysis
  const totalRoutes = db.routes.length;
  let completeRoutes = 0;
  db.routes.forEach(r => {
    let hasIssues = false;
    if (!r.coordinates || r.coordinates.length < 2) {
      hasIssues = true;
      missingItems.push({
        id: `miss-rte-gps-${r.id}`,
        category: 'ROUTE',
        title: `Route "${r.routeName}" lacking complete GPS polyline`,
        detail: `Route ID: ${r.routeId}. Coordinates must contain at least start and end GPS points.`,
        entityId: r.id,
        section: 'routes',
        severity: 'high',
      });
    }
    if (!r.supplierId) {
      hasIssues = true;
      missingItems.push({
        id: `miss-rte-sup-${r.id}`,
        category: 'ROUTE',
        title: `Route "${r.routeName}" has no linked cable supplier`,
        detail: `Supplier / vendor association missing.`,
        entityId: r.id,
        section: 'routes',
        severity: 'medium',
      });
    }
    if (!r.cableLengthMeters || r.cableLengthMeters <= 0) {
      hasIssues = true;
      missingItems.push({
        id: `miss-rte-len-${r.id}`,
        category: 'ROUTE',
        title: `Route "${r.routeName}" has 0m recorded length`,
        detail: `Accurate length is required for OTDR loss budgets.`,
        entityId: r.id,
        section: 'routes',
        severity: 'high',
      });
    }
    if (!hasIssues) completeRoutes++;
  });

  // 2. Joint Boxes Analysis
  const totalJb = db.jointBoxes.length;
  let completeJb = 0;
  db.jointBoxes.forEach(j => {
    let hasIssues = false;
    if (!j.latitude || !j.longitude || (j.latitude === 0 && j.longitude === 0)) {
      hasIssues = true;
      missingItems.push({
        id: `miss-jb-gps-${j.id}`,
        category: 'JOINT_BOX',
        title: `Joint Box "${j.name}" (${j.jointBoxId}) without GPS coordinates`,
        detail: `Technicians in field cannot locate enclosure on GIS map.`,
        entityId: j.id,
        section: 'jointBoxes',
        severity: 'high',
      });
    }
    if (!j.photos || j.photos.length === 0) {
      hasIssues = true;
      missingItems.push({
        id: `miss-jb-photo-${j.id}`,
        category: 'JOINT_BOX',
        title: `Joint Box "${j.name}" has no installation or internal splice photos`,
        detail: `Visual photo documentation missing.`,
        entityId: j.id,
        section: 'jointBoxes',
        severity: 'low',
      });
    }
    if ((j.incomingCableIds || []).length === 0 && (j.outgoingCableIds || []).length === 0) {
      orphanObjects.push({
        id: `orph-jb-${j.id}`,
        entityType: 'Joint Box',
        name: j.name,
        detail: `ID: ${j.jointBoxId} at ${j.location}`,
        reason: 'Joint box enclosure has no incoming or outgoing cables attached.',
        entityId: j.id,
        section: 'jointBoxes',
      });
    }
    if (!hasIssues) completeJb++;
  });

  // 3. Core Records Analysis
  const totalCores = db.cores.length;
  let completeCores = 0;
  db.cores.forEach(c => {
    let hasIssues = false;
    if (!c.status || c.status === 'Unknown') {
      hasIssues = true;
      missingItems.push({
        id: `miss-cor-stat-${c.id}`,
        category: 'CORE',
        title: `Core #${c.coreNumber} of Cable "${c.cableId}" has unknown status`,
        detail: `Status must be set to Active, Spare, Reserved, or Fault.`,
        entityId: c.id,
        section: 'cores',
        severity: 'medium',
      });
    }
    if (!c.colorName || !c.colorHex) {
      hasIssues = true;
      missingItems.push({
        id: `miss-cor-col-${c.id}`,
        category: 'CORE',
        title: `Core #${c.coreNumber} of Cable "${c.cableId}" has missing TIA-598 color code`,
        detail: `Color mapping missing.`,
        entityId: c.id,
        section: 'cores',
        severity: 'medium',
      });
    }
    // Check if cable exists
    const cableExists = db.cables.some(cb => cb.id === c.cableId || cb.cableId === c.cableId);
    if (!cableExists) {
      orphanObjects.push({
        id: `orph-cor-${c.id}`,
        entityType: 'Fiber Core',
        name: `Core #${c.coreNumber}`,
        detail: `Parent Cable ID "${c.cableId}" not found in inventory.`,
        reason: 'Orphan core record without matching physical cable.',
        entityId: c.id,
        section: 'cores',
      });
    }
    if (!hasIssues) completeCores++;
  });

  // 4. Splitters Analysis
  const totalSplitters = db.splitters.length;
  let completeSplitters = 0;
  db.splitters.forEach(s => {
    let hasIssues = false;
    if (!s.inputCableId || !s.inputCoreNumber) {
      hasIssues = true;
      missingItems.push({
        id: `miss-splt-src-${s.id}`,
        category: 'SPLITTER',
        title: `Splitter "${s.name || s.splitterId}" without input source fiber`,
        detail: `No input cable or feeding core defined. Trace cannot trace upstream to OLT.`,
        entityId: s.id,
        section: 'splitters',
        severity: 'high',
      });
      orphanObjects.push({
        id: `orph-splt-${s.id}`,
        entityType: 'Optical Splitter',
        name: s.name || s.splitterId,
        detail: `Split ratio: ${s.splitRatio} at ${s.location}`,
        reason: 'Splitter has no feeding optical core or cable connected to its input port.',
        entityId: s.id,
        section: 'splitters',
      });
    }
    if (!hasIssues) completeSplitters++;
  });

  // 5. Customer Relationships
  const totalCustomers = db.customers.length;
  let completeCustomers = 0;
  db.customers.forEach(c => {
    let hasIssues = false;
    if (!c.splitterId || !c.splitterPortNumber) {
      hasIssues = true;
      missingItems.push({
        id: `miss-cust-splt-${c.id}`,
        category: 'CUSTOMER',
        title: `Customer "${c.name}" (${c.customerId}) without assigned splitter port`,
        detail: `Subscriber is not mapped to an optical splitter port. Downstream signal path broken.`,
        entityId: c.id,
        section: 'customers',
        severity: 'high',
      });
      orphanObjects.push({
        id: `orph-cust-${c.id}`,
        entityType: 'Customer',
        name: c.name,
        detail: `ID: ${c.customerId}, Package: ${c.package}`,
        reason: 'Subscriber is not connected to any optical splitter port.',
        entityId: c.id,
        section: 'customers',
      });
    }
    if (!c.latitude || !c.longitude || (c.latitude === 0 && c.longitude === 0)) {
      missingItems.push({
        id: `miss-cust-gps-${c.id}`,
        category: 'CUSTOMER',
        title: `Customer "${c.name}" lacking GPS location coordinates`,
        detail: `Address: ${c.address || 'Unknown'}. Required for GIS dispatching.`,
        entityId: c.id,
        section: 'customers',
        severity: 'medium',
      });
    }
    if (!hasIssues) completeCustomers++;
  });

  // 6. Active Hardware Serial Numbers
  db.olts.forEach(o => {
    if (!o.serialNumber) {
      missingItems.push({
        id: `miss-olt-sn-${o.id}`,
        category: 'DEVICE',
        title: `OLT "${o.name}" without recorded hardware serial number`,
        detail: `Serial number tracking required for warranty & RMA management.`,
        entityId: o.id,
        section: 'devices',
        severity: 'medium',
      });
    }
  });

  // 7. PON Ports without fibers
  db.ponPorts.forEach(p => {
    if (!p.connectedFiberCableId) {
      orphanObjects.push({
        id: `orph-pon-${p.id}`,
        entityType: 'PON Port',
        name: p.name,
        detail: `Tx Power: +${p.txPower} dBm`,
        reason: 'PON port is configured but not connected to any ODF or feeder cable.',
        entityId: p.id,
        section: 'devices',
      });
    }
  });

  // Calculate scores
  const routeScore = totalRoutes > 0 ? Math.round((completeRoutes / totalRoutes) * 100) : 100;
  const jbScore = totalJb > 0 ? Math.round((completeJb / totalJb) * 100) : 100;
  const coreScore = totalCores > 0 ? Math.round((completeCores / totalCores) * 100) : 100;
  const splitterScore = totalSplitters > 0 ? Math.round((completeSplitters / totalSplitters) * 100) : 100;
  const customerScore = totalCustomers > 0 ? Math.round((completeCustomers / totalCustomers) * 100) : 100;

  // GPS completeness
  const totalPhysicalAssets = totalJb + totalRoutes + totalCustomers + (db.pops?.length || 0);
  const assetsWithGps = 
    db.jointBoxes.filter(j => j.latitude && j.longitude).length +
    db.routes.filter(r => r.coordinates && r.coordinates.length >= 2).length +
    db.customers.filter(c => c.latitude && c.longitude).length +
    (db.pops?.filter(p => p.latitude && p.longitude).length || 0);
  const gpsScore = totalPhysicalAssets > 0 ? Math.round((assetsWithGps / totalPhysicalAssets) * 100) : 100;

  // Photo completeness
  const assetsWithPhotos = 
    db.jointBoxes.filter(j => j.photos && j.photos.length > 0).length +
    db.cables.filter(c => c.photos && c.photos.length > 0).length;
  const photoScore = (totalJb + db.cables.length) > 0 
    ? Math.round((assetsWithPhotos / (totalJb + db.cables.length)) * 100) 
    : 100;

  const metrics: HealthMetric[] = [
    { category: 'Fiber Routes', score: routeScore, total: totalRoutes, complete: completeRoutes, description: 'Routes with length, GPS and complete metadata', color: 'emerald' },
    { category: 'Joint Boxes', score: jbScore, total: totalJb, complete: completeJb, description: 'Closures with GPS coordinates & incoming/outgoing cables', color: 'blue' },
    { category: 'Core Records', score: coreScore, total: totalCores, complete: completeCores, description: 'Cores with valid status & TIA-598 color codes', color: 'indigo' },
    { category: 'Splitter Records', score: splitterScore, total: totalSplitters, complete: completeSplitters, description: 'Splitters with verified feeder fiber input', color: 'violet' },
    { category: 'Customer Links', score: customerScore, total: totalCustomers, complete: completeCustomers, description: 'Subscribers mapped to splitter ports and ONUs', color: 'amber' },
    { category: 'GPS Geolocation', score: gpsScore, total: totalPhysicalAssets, complete: assetsWithGps, description: 'Physical assets with verified coordinates', color: 'cyan' },
    { category: 'Visual Photos', score: photoScore, total: totalJb + db.cables.length, complete: assetsWithPhotos, description: 'Field enclosures and cables with photo evidence', color: 'rose' },
  ];

  const overallHealthScore = Math.round(
    metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length
  );

  return {
    overallHealthScore,
    metrics,
    missingItems,
    orphanObjects,
    generatedAt: new Date().toISOString(),
  };
}

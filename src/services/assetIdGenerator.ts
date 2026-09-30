import { OptiFiberDatabase } from '../types';

export type AssetType = 
  | 'ZONE'
  | 'AREA'
  | 'ROAD'
  | 'DUCT'
  | 'DUCT_SEGMENT'
  | 'FIBER_CABLE'
  | 'FIBER_ROUTE'
  | 'FIBER_SEGMENT'
  | 'CORE'
  | 'JOINT_BOX'
  | 'SPLICE'
  | 'SPLITTER'
  | 'SPLITTER_PORT'
  | 'SPLITTER_RING'
  | 'POP'
  | 'OLT'
  | 'OLT_CARD'
  | 'PON'
  | 'SWITCH'
  | 'SWITCH_PORT'
  | 'SFP'
  | 'ROUTER'
  | 'TOWER'
  | 'DISTRIBUTION_POINT'
  | 'ONU'
  | 'CUSTOMER'
  | 'DEALER';

export const ASSET_PREFIXES: Record<AssetType, string> = {
  ZONE: 'ZON',
  AREA: 'ARA',
  ROAD: 'ROA',
  DUCT: 'DCT',
  DUCT_SEGMENT: 'DCS',
  FIBER_CABLE: 'CBL',
  FIBER_ROUTE: 'FBR',
  FIBER_SEGMENT: 'FSG',
  CORE: 'COR',
  JOINT_BOX: 'JB',
  SPLICE: 'SPL',
  SPLITTER: 'SPLT',
  SPLITTER_PORT: 'SPP',
  SPLITTER_RING: 'RNG',
  POP: 'POP',
  OLT: 'OLT',
  OLT_CARD: 'CRD',
  PON: 'PON',
  SWITCH: 'SW',
  SWITCH_PORT: 'SWP',
  SFP: 'SFP',
  ROUTER: 'RTR',
  TOWER: 'TWR',
  DISTRIBUTION_POINT: 'DP',
  ONU: 'ONU',
  CUSTOMER: 'CUST',
  DEALER: 'DLR',
};

/**
 * Collect all existing Asset IDs across every physical and logical collection
 * in the database to guarantee 100% collision-free IDs.
 */
export function getAllAssetIds(db: OptiFiberDatabase): Set<string> {
  const ids = new Set<string>();

  const register = (id?: string) => {
    if (id && typeof id === 'string') ids.add(id.trim().toUpperCase());
  };

  (db.zones || []).forEach(z => { register(z.assetId); register(z.code); });
  (db.areas || []).forEach(a => { register(a.assetId); register(a.code); });
  (db.roads || []).forEach(r => register(r.assetId));
  (db.ducts || []).forEach(d => register(d.assetId));
  (db.fiberSegments || []).forEach(s => register(s.assetId));
  (db.splitterRings || []).forEach(r => register(r.assetId));
  (db.cables || []).forEach(c => { register(c.assetId); register(c.cableId); });
  (db.routes || []).forEach(r => { register(r.assetId); register(r.routeId); });
  (db.cores || []).forEach(c => { register(c.assetId); register(c.id); });
  (db.jointBoxes || []).forEach(j => { register(j.assetId); register(j.jointBoxId); });
  (db.splices || []).forEach(s => register(s.assetId));
  (db.splitters || []).forEach(s => { register(s.assetId); register(s.splitterId); });
  (db.pops || []).forEach(p => { register(p.assetId); register(p.code); });
  (db.olts || []).forEach(o => register(o.assetId));
  (db.ponPorts || []).forEach(p => register(p.assetId));
  (db.switches || []).forEach(s => register(s.assetId));
  (db.sfps || []).forEach(s => { register(s.assetId); register(s.serialNumber); });
  (db.customers || []).forEach(c => { register(c.assetId); register(c.customerId); });
  (db.dealers || []).forEach(d => { register(d.assetId); register(d.dealerCode); });

  return ids;
}

/**
 * Generate a guaranteed unique, non-duplicated Master Network Asset ID.
 * Follows the pattern: [PREFIX]-[3 or 4 digits] e.g. DCT-001, FSG-001, RNG-001
 */
export function generateMasterAssetId(type: AssetType, db: OptiFiberDatabase): string {
  const prefix = ASSET_PREFIXES[type] || 'AST';
  const existingIds = getAllAssetIds(db);

  let sequence = 1;
  // Determine starting sequence by checking length of collection
  switch (type) {
    case 'ZONE': sequence = (db.zones?.length || 0) + 1; break;
    case 'AREA': sequence = (db.areas?.length || 0) + 1; break;
    case 'ROAD': sequence = (db.roads?.length || 0) + 1; break;
    case 'DUCT': sequence = (db.ducts?.length || 0) + 1; break;
    case 'FIBER_SEGMENT': sequence = (db.fiberSegments?.length || 0) + 1; break;
    case 'SPLITTER_RING': sequence = (db.splitterRings?.length || 0) + 1; break;
    case 'FIBER_CABLE': sequence = db.cables.length + 1; break;
    case 'FIBER_ROUTE': sequence = db.routes.length + 1; break;
    case 'CORE': sequence = db.cores.length + 1; break;
    case 'JOINT_BOX': sequence = db.jointBoxes.length + 1; break;
    case 'SPLICE': sequence = db.splices.length + 1; break;
    case 'SPLITTER': sequence = db.splitters.length + 1; break;
    case 'POP': sequence = db.pops.length + 1; break;
    case 'OLT': sequence = db.olts.length + 1; break;
    case 'PON': sequence = db.ponPorts.length + 1; break;
    case 'SWITCH': sequence = db.switches.length + 1; break;
    case 'SFP': sequence = db.sfps.length + 1; break;
    case 'CUSTOMER': sequence = db.customers.length + 1; break;
    case 'DEALER': sequence = db.dealers.length + 1; break;
    default: sequence = 1;
  }

  while (true) {
    const candidate = `${prefix}-${sequence.toString().padStart(3, '0')}`;
    if (!existingIds.has(candidate.toUpperCase())) {
      return candidate;
    }
    sequence++;
  }
}

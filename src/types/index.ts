// OptiFiber ISP Network Relational Schema & Types

export type EntityStatus = 'Active' | 'Warning' | 'Down' | 'Maintenance' | 'Spare' | 'Faulty' | 'Cut' | 'LOS' | 'Reserved' | 'Decommissioned' | 'Removed' | 'Unknown';

export interface FieldVerification {
  isVerified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  gpsSource?: 'RTK_GPS' | 'MOBILE_GPS' | 'MANUAL_MAP';
  accuracyMeters?: number;
  verificationPhoto?: string;
}

export interface VersionSnapshot {
  version: number;
  date: string;
  user: string;
  changes: string;
  snapshotSummary: string;
}

export interface NetworkZone {
  id: string;
  assetId: string; // e.g. ZON-001
  name: string;
  code: string;
  description: string;
  popCount?: number;
}

export interface NetworkArea {
  id: string;
  assetId: string; // e.g. ARA-001
  name: string;
  zoneId: string;
  zoneName: string;
  code: string;
}

export interface NetworkRoad {
  id: string;
  assetId: string; // e.g. ROA-001
  name: string;
  areaId: string;
  zoneId: string;
  areaName: string;
  zoneName: string;
}

export interface FiberColorConfig {
  id: string;
  coreNumber: number;
  name: string;
  hex: string;
  textColor: string;
  description?: string;
}

export interface SupplierPurchase {
  date: string;
  item: string;
  qty: number;
  amount: string;
  invoiceNo: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size?: string;
  date: string;
  url?: string;
}

export interface Supplier {
  id: string;
  assetId?: string;
  name: string;
  company: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  products: string[];
  purchaseHistory: SupplierPurchase[];
  warranty: string;
  notes: string;
  documents: DocumentAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface POP {
  id: string;
  assetId?: string; // e.g. POP-001
  name: string;
  code: string;
  area: string;
  zone: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'Active' | 'Maintenance' | 'Down';
  powerBackup: string;
  temperature: string;
  racksCount: number;
  notes: string;
  photos: string[];
  fieldVerification?: FieldVerification;
  versionHistory?: VersionSnapshot[];
}

export interface OLT {
  id: string;
  assetId?: string; // e.g. OLT-001
  name: string;
  model: string;
  ip: string;
  popId: string;
  location: string;
  totalSlots: number;
  cards: string[];
  ponPortsCount: number;
  uplinkPortsCount: number;
  sfpPortsCount: number;
  status: 'Active' | 'Warning' | 'Down';
  firmware: string;
  serialNumber?: string;
  supplierId?: string;
  warrantyEnd?: string;
  notes: string;
  fieldVerification?: FieldVerification;
  versionHistory?: VersionSnapshot[];
}

export interface PONPort {
  id: string;
  assetId?: string; // e.g. PON-001
  oltId: string;
  portNumber: number;
  cardSlot: number;
  name: string;
  txPower: number; // dBm e.g. +4.5
  wavelength: string; // e.g. 1490/1310nm
  status: 'Active' | 'Maintenance' | 'Down';
  connectedFiberCableId?: string;
  connectedCoreNumber?: number;
  connectedSplitterId?: string;
  maxOnus: number;
  activeOnus: number;
  serialNumber?: string;
}

export interface SwitchDevice {
  id: string;
  assetId?: string; // e.g. SW-001
  name: string;
  model: string;
  ip: string;
  popId: string;
  location: string;
  portCount: number;
  sfpPortsCount: number;
  status: 'Active' | 'Warning' | 'Down';
  vlans: string[];
  connectedDevice?: string;
  connectedFiberCableId?: string;
  connectedCoreNumber?: number;
  serialNumber?: string;
  supplierId?: string;
  warrantyEnd?: string;
  notes: string;
}

export interface SFPModule {
  id: string;
  assetId?: string; // e.g. SFP-001
  serialNumber: string;
  model: string;
  type: 'GPON-C+' | 'GPON-C++' | 'XGS-PON' | 'SFP-1G' | 'SFP-10G' | 'BiDi';
  wavelength: string;
  reachKm: number;
  connector: 'SC/UPC' | 'SC/APC' | 'LC/UPC';
  supplierId: string;
  assignedDeviceId?: string;
  assignedPort?: string;
  status: 'In Service' | 'Spare' | 'Faulty';
  txPowerDbm: number;
  rxSensitivityDbm: number;
  warrantyEnd?: string;
}

export interface RouteCoordinate {
  lat: number;
  lng: number;
  name?: string;
  type?: 'start' | 'end' | 'waypoint' | 'jointBox' | 'pole' | 'splitter' | 'duct';
}

export interface Duct {
  id: string;
  assetId: string; // e.g. DCT-001
  name: string;
  type: 'PVC Conduit' | 'HDPE Subduct' | 'Microduct Bundle' | 'Concrete Trench' | 'Aerial Conduit' | 'Corrugated Pipe';
  startPoint: string;
  endPoint: string;
  latitude: number;
  longitude: number;
  coordinates: RouteCoordinate[];
  zone: string;
  area: string;
  road: string;
  lengthMeters: number;
  totalDuctWays: number; // e.g. 4-way, 7-way, 12-way subducts
  occupiedWays: number;
  spareWays: number;
  reservedWays: number;
  damagedWays: number;
  assignedCableIds: string[];
  installationDate: string;
  contractorSupplierId?: string;
  photos: string[];
  documents: DocumentAttachment[];
  maintenanceHistory?: string[];
  notes: string;
  fieldVerification?: FieldVerification;
  versionHistory?: VersionSnapshot[];
}

export interface FiberSegment {
  id: string;
  assetId: string; // e.g. FSG-001-S01
  name: string;
  cableId: string;
  routeId?: string;
  ductId?: string;
  segmentNumber: number;
  startPoint: string;
  endPoint: string;
  lengthMeters: number;
  coreCount: number;
  activeCores: number;
  spareCores: number;
  faultyCores: number;
  status: 'Active' | 'Maintenance' | 'Cut' | 'Spare' | 'Decommissioned';
  coordinates: RouteCoordinate[];
  photos: string[];
  notes: string;
}

export interface SplitterRing {
  id: string;
  assetId: string; // e.g. RNG-001
  name: string;
  type: 'Protected Ring' | 'Collapsed Ring' | 'Feeder Ring' | 'Metro Aggregation Ring';
  startPoint: string;
  endPoint: string;
  primarySegmentIds: string[];
  backupSegmentIds: string[];
  jointBoxIds: string[];
  splitterIds: string[];
  status: 'Normal' | 'Failover Active' | 'Degraded' | 'Broken';
  failoverMode: 'Automatic' | 'Manual';
  breakPointSegmentId?: string;
  backupCapacityCores: number;
  notes: string;
}

export interface FiberRoute {
  id: string;
  assetId?: string; // e.g. FBR-001
  routeId: string; // e.g. RTE-NORTH-01
  routeName: string;
  fiberType: 'G.652D' | 'G.655' | 'G.657A1' | 'G.657A2' | 'OM3' | 'OM4';
  coreCount: number; // 2, 4, 6, 8, 12, 24, 48, 72, 96, custom
  cableSizeMm: number;
  startPoint: string;
  endPoint: string;
  intermediatePoints: string[];
  popId: string;
  area: string;
  zone: string;
  roadStreet: string;
  cableLengthMeters: number;
  installationType: 'Aerial' | 'Underground Duct' | 'Direct Buried' | 'Underwater';
  installationDate: string;
  supplierId: string;
  status: 'Active' | 'Warning' | 'Down';
  maintenanceStatus: 'Normal' | 'Under Maintenance' | 'Scheduled Maintenance' | 'Critical Attention';
  coordinates: RouteCoordinate[];
  notes: string;
  photos: string[];
  documents: DocumentAttachment[];
  ductId?: string;
  fieldVerification?: FieldVerification;
  versionHistory?: VersionSnapshot[];
}

export interface FiberCable {
  id: string;
  assetId?: string; // e.g. CBL-001
  cableId: string; // e.g. CBL-048-A1
  routeId: string;
  supplierId: string;
  brand: string;
  cableType: string;
  coreCount: number;
  totalLengthMeters: number;
  installedLengthMeters: number;
  remainingLengthMeters: number;
  batchNumber: string;
  invoiceNumber: string;
  purchaseDate: string;
  installationDate: string;
  warranty: string;
  warrantyEnd?: string;
  startLocation: string;
  endLocation: string;
  status: 'Installed' | 'Partial Roll' | 'New' | 'Used' | 'Damaged' | 'Scrap' | 'Reserved' | 'Decommissioned';
  ductId?: string;
  segmentIds?: string[];
  notes: string;
  photos: string[];
  fieldVerification?: FieldVerification;
  versionHistory?: VersionSnapshot[];
}

export type CoreStatus = 'Active' | 'Spare' | 'Used' | 'Fault' | 'Cut' | 'LOS' | 'Maintenance' | 'Reserved' | 'Decommissioned' | 'Unknown';

export interface FiberCore {
  id: string; // e.g. CBL-048-A1-C04
  assetId?: string; // e.g. COR-001
  cableId: string;
  coreNumber: number;
  tubeNumber?: number;
  tubeColor?: string;
  colorName: string;
  colorHex: string;
  status: CoreStatus;
  signalPowerDbm?: number;
  attenuationLossDb?: number;
  startPoint: string;
  endPoint: string;
  connectedToType?: 'OLT_PON' | 'SWITCH_PORT' | 'SPLITTER_IN' | 'SPLITTER_OUT' | 'CUSTOMER_ONU' | 'SPLICE' | 'PATCH_PANEL' | 'NONE';
  connectedToId?: string;
  connectedToLabel?: string;
  previousConnectionId?: string;
  nextConnectionId?: string;
  notes: string;
  lastTestedDate?: string;
  history?: {
    date: string;
    action: string;
    spliceId?: string;
    connectedTo?: string;
    user?: string;
  }[];
}

export interface JointBox {
  id: string;
  assetId?: string; // e.g. JB-001
  jointBoxId: string; // e.g. JB-001
  name: string;
  type: 'Dome' | 'Inline' | 'Cabinet' | 'Pole Mount' | 'Manhole';
  trayCount: number;
  maxSpliceCapacity: number;
  location: string;
  area: string;
  zone: string;
  road?: string;
  latitude: number;
  longitude: number;
  installationDate: string;
  technician: string;
  supplierId: string;
  maintenanceStatus: 'Good' | 'Maintenance Needed' | 'Damaged' | 'Water Ingress Alert';
  incomingCableIds: string[];
  outgoingCableIds: string[];
  notes: string;
  photos: string[];
  fieldVerification?: FieldVerification;
  versionHistory?: VersionSnapshot[];
}

export interface SpliceConnection {
  id: string;
  assetId?: string; // e.g. SPL-001
  jointBoxId: string;
  trayNumber: number;
  incomingCableId: string;
  incomingCoreNumber: number;
  incomingCoreColor: string;
  spliceType: 'Fusion' | 'Mechanical' | 'Patch' | 'Loop' | 'Terminated' | 'Cut';
  spliceLossDb: number;
  outgoingCableId: string;
  outgoingCoreNumber: number;
  outgoingCoreColor: string;
  status: 'Active' | 'Spare' | 'Faulty' | 'Cut' | 'Maintenance';
  technician: string;
  splicedDate: string;
  notes: string;
}

export interface SplitterPort {
  id?: string;
  assetId?: string; // e.g. SPP-001
  portNumber: number;
  status: 'Active' | 'Spare' | 'Faulty' | 'Reserved';
  outputSignalDbm: number;
  connectedCustomerId?: string;
  connectedDistributionFiberId?: string;
  connectedCoreNumber?: number;
  notes?: string;
}

export type SplitRatio = '1:2' | '1:4' | '1:8' | '1:16' | '1:32' | '1:64' | '20/80' | '85/15' | '95/5' | 'Custom';

export interface OpticalSplitter {
  id: string;
  assetId?: string; // e.g. SPL-001
  splitterId: string; // e.g. SPL-01-A
  name?: string;
  jointBoxId?: string;
  popId?: string;
  location: string;
  type: 'PLC' | 'FBT';
  splitRatio: SplitRatio;
  expectedLossDb: number;
  actualLossDb: number;
  lossOverrideReason?: string;
  inputCableId?: string;
  inputCoreNumber?: number;
  inputSourceLabel: string;
  inputSignalDbm: number;
  status: 'Active' | 'Warning' | 'Maintenance' | 'Faulty';
  ports: SplitterPort[];
  latitude?: number;
  longitude?: number;
  area?: string;
  zone?: string;
  road?: string;
  notes: string;
  photos: string[];
  fieldVerification?: FieldVerification;
  versionHistory?: VersionSnapshot[];
}

export interface Customer {
  id: string;
  assetId?: string; // e.g. CUST-001
  customerId: string; // e.g. CUST-10492
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  area: string;
  zone: string;
  road?: string;
  latitude: number;
  longitude: number;
  package: string;
  onuModel: string;
  onuMac: string;
  onuSerial: string;
  status: 'Active' | 'Suspended' | 'LOS' | 'Offline' | 'Pending';
  dealerId?: string;
  splitterId?: string;
  splitterPortNumber?: number;
  dropCableLengthM: number;
  rxPowerDbm: number;
  installationDate: string;
  notes: string;
  photos?: string[];
  fieldVerification?: FieldVerification;
}

export interface Dealer {
  id: string;
  assetId?: string; // e.g. DLR-001
  dealerCode: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  area: string;
  zone: string;
  commissionRate: string;
  activeCustomersCount: number;
  status: 'Active' | 'Suspended';
  notes: string;
}

export type MaintenanceProblem = 
  | 'Fiber Cut'
  | 'High Loss'
  | 'LOS'
  | 'Low Signal'
  | 'Joint Box Issue'
  | 'Splitter Issue'
  | 'OLT Issue'
  | 'SFP Issue'
  | 'Switch Issue'
  | 'Power Issue'
  | 'Cable Damage'
  | 'Water Damage'
  | 'Unknown Fault'
  | 'Planned Maintenance';

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';

export interface MaintenanceMaterialItem {
  itemId: string;
  name: string;
  qty: number;
  unit: string;
}

export interface MaintenanceTicket {
  id: string;
  ticketId: string; // e.g. TKT-2026-0042
  dateTime: string;
  problem: MaintenanceProblem;
  problemDescription?: string;
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  routeId?: string;
  cableId?: string;
  segmentId?: string;
  coreNumber?: number;
  jointBoxId?: string;
  deviceId?: string;
  technician: string;
  beforeSignalDbm?: number;
  afterSignalDbm?: number;
  beforeLossDb?: number;
  afterLossDb?: number;
  beforeStatus?: string;
  afterStatus?: string;
  beforePhoto?: string;
  afterPhoto?: string;
  rootCause: string;
  workPerformed: string;
  materialUsed: string;
  materialUsedItems?: MaintenanceMaterialItem[];
  resolution: string;
  closingTime?: string;
  photos: string[];
}

export interface NetworkChangeRequest {
  id: string;
  changeId: string; // e.g. MCR-2026-001
  title: string;
  requestedBy: string;
  reason: string;
  currentConfiguration: string;
  proposedConfiguration: string;
  approvalStatus: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed';
  workPerformed?: string;
  newConfiguration?: string;
  photos: string[];
  date: string;
  technician: string;
  affectedAssetIds: string[];
}

export interface SignalMeasurement {
  id: string;
  assetType: 'FIBER' | 'CORE' | 'SPLITTER' | 'PON' | 'CUSTOMER';
  assetId: string;
  assetName: string;
  date: string;
  signalDbm: number;
  lossDb?: number;
  technician: string;
  status: 'Normal' | 'Degraded' | 'Critical';
  notes?: string;
}

export interface AuditHistoryRecord {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Status Changed' | 'Spliced' | 'Cut' | 'Restored';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  user: string;
  userRole: string;
  timestamp: string;
  reason: string;
}

export type UserRole = 'Super Admin' | 'Network Admin' | 'Technician' | 'Documentation Staff' | 'Viewer';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  salt?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface UserPermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canMaintenance: boolean;
  canReports: boolean;
  canBackup: boolean;
  canManageUsers: boolean;
  canRunDiscovery: boolean;
}

export interface NetworkDiscoveryEvent {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'OLT' | 'SWITCH' | 'ROUTER' | 'PON' | 'SFP';
  ip: string;
  eventType: 'DEVICE_ONLINE' | 'DEVICE_OFFLINE' | 'PORT_UP' | 'PORT_DOWN' | 'SIGNAL_DEGRADED' | 'LATENCY_SPIKE' | 'CONFIG_CHANGED';
  details: string;
  severity: 'info' | 'warning' | 'critical';
  latencyMs?: number;
  packetLossPercent?: number;
  autoTicketCreated?: boolean;
  ticketId?: string;
}

export interface DeviceDiscoveryTelemetry {
  deviceId: string;
  lastPingTime: string;
  pingStatus: 'Online' | 'Offline' | 'High Latency' | 'Unreachable';
  latencyMs: number;
  packetLossPercent: number;
  uptime: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  temperatureCelsius: number;
  portsTelemetry: {
    portId: string;
    name: string;
    linkStatus: 'UP' | 'DOWN' | 'TESTING';
    speedMbps: number;
    rxPowerDbm?: number;
    txPowerDbm?: number;
    errorFramesCount: number;
  }[];
}

// Master Database State Structure
export interface OptiFiberDatabase {
  version: number;
  lastUpdated: string;
  zones: NetworkZone[];
  areas: NetworkArea[];
  roads: NetworkRoad[];
  ducts: Duct[];
  fiberSegments: FiberSegment[];
  splitterRings: SplitterRing[];
  colors: FiberColorConfig[];
  suppliers: Supplier[];
  pops: POP[];
  olts: OLT[];
  ponPorts: PONPort[];
  switches: SwitchDevice[];
  sfps: SFPModule[];
  routes: FiberRoute[];
  cables: FiberCable[];
  cores: FiberCore[];
  jointBoxes: JointBox[];
  splices: SpliceConnection[];
  splitters: OpticalSplitter[];
  customers: Customer[];
  dealers: Dealer[];
  tickets: MaintenanceTicket[];
  changeRequests: NetworkChangeRequest[];
  signalMeasurements: SignalMeasurement[];
  auditLogs: AuditHistoryRecord[];
  discoveryEvents: NetworkDiscoveryEvent[];
  telemetry: Record<string, DeviceDiscoveryTelemetry>;
  users: UserAccount[];
  currentUser: UserAccount;
}

// Trace Engine Output Structures
export interface TraceStep {
  stepNumber: number;
  entityType: 'OLT' | 'PON' | 'SFP' | 'CABLE' | 'SEGMENT' | 'CORE' | 'DUCT' | 'JOINT_BOX' | 'SPLICE' | 'SPLITTER' | 'SPLITTER_PORT' | 'DROP_CABLE' | 'CUSTOMER_ONU' | 'CUSTOMER';
  id: string;
  name: string;
  detail: string;
  status: EntityStatus | CoreStatus | TicketStatus;
  coreNumber?: number;
  coreColor?: string;
  coreColorHex?: string;
  opticalPowerDbm?: number;
  stepLossDb?: number;
  cumulativeLossDb?: number;
  isFaultPoint?: boolean;
  faultReason?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface TraceResult {
  sourceEntityType: string;
  sourceEntityId: string;
  sourceEntityLabel: string;
  direction: 'Forward' | 'Reverse' | 'Bidirectional';
  fullPath: TraceStep[];
  startPoint: string;
  endPoint: string;
  totalLengthMeters: number;
  totalLossDb: number;
  expectedRxPowerDbm: number;
  hasFault: boolean;
  faultStep?: TraceStep;
  downstreamCustomerCount: number;
  downstreamCustomers?: Customer[];
  connectedSplitters: string[];
  connectedJointBoxes: string[];
  cablesTraversed: string[];
}


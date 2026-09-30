import { 
  OptiFiberDatabase, 
  NetworkDiscoveryEvent, 
  DeviceDiscoveryTelemetry, 
  OLT, 
  SwitchDevice 
} from '../types';
import { getDatabase, saveDatabase, logAudit, addTicket } from './storage';

export interface ScanResult {
  devicesScanned: number;
  onlineCount: number;
  offlineCount: number;
  warningCount: number;
  eventsGenerated: NetworkDiscoveryEvent[];
  timestamp: string;
}

export async function runNetworkDiscoveryScan(): Promise<ScanResult> {
  const db = getDatabase();
  const timestamp = new Date().toISOString();
  const events: NetworkDiscoveryEvent[] = [];

  let onlineCount = 0;
  let offlineCount = 0;
  let warningCount = 0;

  if (!db.telemetry) db.telemetry = {};
  if (!db.discoveryEvents) db.discoveryEvents = [];

  // 1. Scan all OLTs
  for (const olt of db.olts) {
    const existing = db.telemetry[olt.id];
    const isOnline = olt.status !== 'Down';

    // Simulate realistic ICMP ping & SNMP response
    const latencyMs = isOnline ? +(0.8 + Math.random() * 2.2).toFixed(1) : 0;
    const packetLoss = isOnline ? (Math.random() > 0.95 ? 5 : 0) : 100;
    const cpuUsage = isOnline ? Math.min(95, Math.max(8, Math.round(15 + Math.random() * 20))) : 0;
    const memUsage = isOnline ? Math.min(95, Math.max(15, Math.round(30 + Math.random() * 15))) : 0;

    const previousStatus = existing?.pingStatus || 'Online';
    const currentStatus = isOnline ? (packetLoss > 0 ? 'High Latency' : 'Online') : 'Offline';

    if (isOnline) onlineCount++;
    else offlineCount++;

    // Detect state change
    if (previousStatus !== currentStatus) {
      const event: NetworkDiscoveryEvent = {
        id: 'disc-ev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp,
        deviceId: olt.id,
        deviceName: olt.name,
        deviceType: 'OLT',
        ip: olt.ip,
        eventType: currentStatus === 'Offline' ? 'DEVICE_OFFLINE' : 'DEVICE_ONLINE',
        details: currentStatus === 'Offline' 
          ? `OLT ${olt.name} (${olt.ip}) failed ICMP keepalive (100% packet loss)`
          : `OLT ${olt.name} (${olt.ip}) resumed nominal communication (${latencyMs}ms)`,
        severity: currentStatus === 'Offline' ? 'critical' : 'info',
        latencyMs,
        packetLossPercent: packetLoss,
      };
      events.push(event);
      db.discoveryEvents.unshift(event);

      logAudit(db, {
        entityType: 'OLT',
        entityId: olt.id,
        entityName: olt.name,
        action: 'Status Changed',
        fieldChanged: 'PingStatus',
        oldValue: previousStatus,
        newValue: currentStatus,
        reason: 'Automated SNMP/ICMP network discovery polling',
      });
    }

    // Telemetry for OLT PON ports
    const oltPonPorts = db.ponPorts.filter(p => p.oltId === olt.id);
    const portsTelemetry = oltPonPorts.map(pon => {
      const isPortUp = pon.status === 'Active';
      return {
        portId: pon.id,
        name: pon.name.split('/').pop() || `PON ${pon.portNumber}`,
        linkStatus: isPortUp ? ('UP' as const) : ('DOWN' as const),
        speedMbps: 2500,
        txPowerDbm: isPortUp ? pon.txPower : 0,
        errorFramesCount: isPortUp ? (Math.random() > 0.8 ? Math.floor(Math.random() * 15) : 0) : 0,
      };
    });

    db.telemetry[olt.id] = {
      deviceId: olt.id,
      lastPingTime: timestamp,
      pingStatus: currentStatus,
      latencyMs,
      packetLossPercent: packetLoss,
      uptime: existing?.uptime || '142 days, 18 hrs, 32 mins',
      cpuUsagePercent: cpuUsage,
      memoryUsagePercent: memUsage,
      temperatureCelsius: 38.5,
      portsTelemetry,
    };
  }

  // 2. Scan all Switches
  for (const sw of db.switches) {
    const existing = db.telemetry[sw.id];
    const isOnline = sw.status !== 'Down';

    const latencyMs = isOnline ? +(0.5 + Math.random() * 1.5).toFixed(1) : 0;
    const packetLoss = isOnline ? 0 : 100;
    const cpuUsage = isOnline ? Math.min(90, Math.max(5, Math.round(12 + Math.random() * 10))) : 0;
    const memUsage = isOnline ? Math.min(90, Math.max(10, Math.round(25 + Math.random() * 10))) : 0;

    const previousStatus = existing?.pingStatus || 'Online';
    const currentStatus = isOnline ? 'Online' : 'Offline';

    if (isOnline) onlineCount++;
    else offlineCount++;

    if (previousStatus !== currentStatus) {
      const event: NetworkDiscoveryEvent = {
        id: 'disc-ev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp,
        deviceId: sw.id,
        deviceName: sw.name,
        deviceType: 'SWITCH',
        ip: sw.ip,
        eventType: currentStatus === 'Offline' ? 'DEVICE_OFFLINE' : 'DEVICE_ONLINE',
        details: currentStatus === 'Offline'
          ? `Aggregation switch ${sw.name} (${sw.ip}) is unreachable`
          : `Aggregation switch ${sw.name} reachable (${latencyMs}ms)`,
        severity: currentStatus === 'Offline' ? 'critical' : 'info',
        latencyMs,
        packetLossPercent: packetLoss,
      };
      events.push(event);
      db.discoveryEvents.unshift(event);
    }

    // Telemetry for Switch SFP ports
    const assignedSfps = db.sfps.filter(s => s.assignedDeviceId === sw.id);
    const portsTelemetry = assignedSfps.map(sfp => {
      const isUp = sfp.status === 'In Service';
      return {
        portId: sfp.id,
        name: sfp.assignedPort || sfp.model,
        linkStatus: isUp ? ('UP' as const) : ('DOWN' as const),
        speedMbps: 10000,
        txPowerDbm: isUp ? sfp.txPowerDbm : 0,
        rxPowerDbm: isUp ? -3.4 : -40.0,
        errorFramesCount: 0,
      };
    });

    db.telemetry[sw.id] = {
      deviceId: sw.id,
      lastPingTime: timestamp,
      pingStatus: currentStatus,
      latencyMs,
      packetLossPercent: packetLoss,
      uptime: existing?.uptime || '210 days, 11 hrs',
      cpuUsagePercent: cpuUsage,
      memoryUsagePercent: memUsage,
      temperatureCelsius: 35.0,
      portsTelemetry,
    };
  }

  // Cap discovery events to 150
  if (db.discoveryEvents.length > 150) {
    db.discoveryEvents = db.discoveryEvents.slice(0, 150);
  }

  saveDatabase(db);

  return {
    devicesScanned: db.olts.length + db.switches.length,
    onlineCount,
    offlineCount,
    warningCount,
    eventsGenerated: events,
    timestamp,
  };
}

// Helper to simulate device state flip (for operator live testing)
export async function toggleDeviceSimulation(deviceId: string): Promise<void> {
  const db = getDatabase();
  const olt = db.olts.find(o => o.id === deviceId);
  if (olt) {
    olt.status = olt.status === 'Active' ? 'Down' : 'Active';
    saveDatabase(db);
    await runNetworkDiscoveryScan();
    return;
  }
  const sw = db.switches.find(s => s.id === deviceId);
  if (sw) {
    sw.status = sw.status === 'Active' ? 'Down' : 'Active';
    saveDatabase(db);
    await runNetworkDiscoveryScan();
  }
}

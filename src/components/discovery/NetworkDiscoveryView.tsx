import React, { useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Server, 
  Wifi, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Clock, 
  Zap,
  SlidersHorizontal,
  Flame,
  Power
} from 'lucide-react';
import { OptiFiberDatabase, NetworkDiscoveryEvent } from '../../types';
import { runNetworkDiscoveryScan, toggleDeviceSimulation } from '../../services/networkDiscovery';

interface NetworkDiscoveryViewProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
}

export const NetworkDiscoveryView: React.FC<NetworkDiscoveryViewProps> = ({
  db,
  onLaunchTrace,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const telemetry = db.telemetry || {};
  const events = db.discoveryEvents || [];

  const allDevices: { id: string; name: string; type: 'OLT' | 'SWITCH'; ip: string; status: string }[] = [
    ...db.olts.map(o => ({ id: o.id, name: o.name, type: 'OLT' as const, ip: o.ip, status: o.status })),
    ...db.switches.map(s => ({ id: s.id, name: s.name, type: 'SWITCH' as const, ip: s.ip, status: s.status })),
  ];

  const onlineDevicesCount = allDevices.filter(d => telemetry[d.id]?.pingStatus === 'Online').length;
  const offlineDevicesCount = allDevices.length - onlineDevicesCount;

  const handleScanNow = async () => {
    setIsScanning(true);
    setScanMessage('Sending ICMP echo requests and querying SNMP OIDs across all network nodes...');
    try {
      const res = await runNetworkDiscoveryScan();
      setScanMessage(`Scan complete: ${res.devicesScanned} devices queried. ${res.onlineCount} online, ${res.offlineCount} offline.`);
      setTimeout(() => setScanMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setScanMessage('Discovery query error.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleDevice = async (deviceId: string) => {
    setIsScanning(true);
    await toggleDeviceSimulation(deviceId);
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Automated Network Discovery & Device Health Monitoring</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time ICMP ping probing, SNMP telemetry interrogation, SFP optical link state detection, and event logging
          </p>
        </div>

        <button
          onClick={handleScanNow}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl cursor-pointer transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Probing Network...' : 'Run Discovery Scan Now'}</span>
        </button>
      </div>

      {/* Status Notice Banner */}
      {scanMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Discovery Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nodes Responding</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {onlineDevicesCount} <span className="text-xs text-slate-400 font-normal">/ {allDevices.length}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">ICMP Keepalive Nominal</p>
        </div>

        <div className={`border rounded-xl p-3.5 shadow-2xs ${
          offlineDevicesCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unreachable / Offline</span>
          <p className={`text-2xl font-bold font-mono mt-1 tabular-nums ${offlineDevicesCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {offlineDevicesCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {offlineDevicesCount > 0 ? 'Packet loss detected' : 'Zero dropped nodes'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Ping Latency</span>
          <p className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
            1.2 <span className="text-xs font-normal text-slate-500">ms</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sub-millisecond core jitter</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Discovery Events</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {events.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Recorded in audit ledger</p>
        </div>
      </div>

      {/* Monitored Devices Discovery Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Active Hardware Query & Telemetry Matrix
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Auto-Polling: Enabled
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Device Name / Type</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4">ICMP Ping</th>
              <th className="py-3 px-4">Latency</th>
              <th className="py-3 px-4">System Load</th>
              <th className="py-3 px-4">Ports & Link State</th>
              <th className="py-3 px-4">Uptime</th>
              <th className="py-3 px-4 text-right">Simulation Test</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {allDevices.map(dev => {
              const tel = telemetry[dev.id];
              const isOnline = tel?.pingStatus === 'Online';
              const ports = tel?.portsTelemetry || [];

              return (
                <tr key={dev.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="font-mono text-slate-500 text-[10px] px-1.5 py-0.5 bg-slate-100 rounded">
                        {dev.type}
                      </span>
                      <span>{dev.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800">
                    {dev.ip}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{tel?.pingStatus || (isOnline ? 'Online' : 'Offline')}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {isOnline ? (
                      <span className="text-slate-800 font-bold">{tel?.latencyMs || 1.2} ms</span>
                    ) : (
                      <span className="text-rose-600 font-bold">Timeout</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {isOnline ? (
                      <div className="space-y-0.5">
                        <div>CPU: <span className="font-semibold text-slate-900">{tel?.cpuUsagePercent || 15}%</span></div>
                        <div>RAM: <span className="font-semibold text-slate-900">{tel?.memoryUsagePercent || 30}%</span></div>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {ports.map((p, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            p.linkStatus === 'UP'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                          title={`${p.name}: Link ${p.linkStatus}`}
                        >
                          {p.name}: {p.linkStatus}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {tel?.uptime || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleDevice(dev.id)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors border ${
                        isOnline 
                          ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                      }`}
                      title="Simulate hardware failure or recovery to test automated discovery logging"
                    >
                      {isOnline ? 'Simulate Cut' : 'Restore Link'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Discovery Events Log Stream */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Automated Discovery Event Stream & Carrier Flap Logs
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {events.length} Historical Events
          </span>
        </div>

        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {events.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No status changes detected. All devices running nominal.</p>
          ) : (
            events.map(ev => (
              <div
                key={ev.id}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  ev.severity === 'critical' ? 'bg-rose-50/40 border-rose-200' :
                  ev.severity === 'warning' ? 'bg-amber-50/40 border-amber-200' :
                  'bg-slate-50/40 border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ev.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                      ev.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ev.eventType}
                    </span>
                    <span className="font-bold text-slate-900">{ev.deviceName} ({ev.ip})</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{ev.details}</p>
                </div>

                <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Route,
  Disc,
  Boxes,
  Split,
  Building2,
  Server,
  Layers,
  Users,
  Wrench,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  GitBranch,
  MapPin,
  Clock,
  Sparkles,
  Plus,
  RefreshCw,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';
import { runNetworkDiscoveryScan } from '../../services/networkDiscovery';

interface DashboardOverviewProps {
  db: OptiFiberDatabase;
  onNavigate: (section: any, targetId?: string) => void;
  onLaunchTrace: (type: any, id: string) => void;
  onOpenQuickAction: (actionType: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  db,
  onNavigate,
  onLaunchTrace,
  onOpenQuickAction,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanMessage('Pinging network devices & querying SNMP...');
    try {
      const res = await runNetworkDiscoveryScan();
      setScanMessage(`Scan complete: ${res.onlineCount} online, ${res.offlineCount} offline.`);
      setTimeout(() => setScanMessage(null), 3500);
    } catch (e) {
      console.error(e);
      setScanMessage('Discovery query error.');
    } finally {
      setIsScanning(false);
    }
  };
  // Computed statistics
  const totalRoutes = db.routes.length;
  const totalCores = db.cores.length;
  const activeCores = db.cores.filter(c => c.status === 'Active' || c.status === 'Used').length;
  const spareCores = db.cores.filter(c => c.status === 'Spare').length;
  const faultyCores = db.cores.filter(c => c.status === 'Fault' || c.status === 'Cut' || c.status === 'LOS').length;
  const maintenanceCores = db.cores.filter(c => c.status === 'Maintenance').length;

  const totalJointBoxes = db.jointBoxes.length;
  const totalSplitters = db.splitters.length;
  const totalPops = db.pops.length;
  const totalOlts = db.olts.length;
  const totalSwitches = db.switches.length;
  const totalSfpPorts = db.sfps.length;
  const totalPonPorts = db.ponPorts.length;
  const totalCustomers = db.customers.length;
  const totalDealers = db.dealers.length;

  const activeLinks = db.routes.filter(r => r.status === 'Active').length;
  const downLinks = db.routes.filter(r => r.status === 'Down').length;
  const maintenanceItems = db.tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const openFaults = faultyCores + downLinks;

  const totalFiberMeters = db.cables.reduce((acc, c) => acc + (c.installedLengthMeters || 0), 0);
  const coreUtilizationRate = totalCores > 0 ? Math.round((activeCores / totalCores) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Headline & Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Network Operations & Infrastructure Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status across <span className="font-semibold text-slate-700">{totalRoutes} routes</span>,{' '}
            <span className="font-semibold text-slate-700">{totalJointBoxes} joint boxes</span>, and{' '}
            <span className="font-semibold text-slate-700">{(totalFiberMeters / 1000).toFixed(1)} km</span> of deployed fiber.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenQuickAction('newRoute')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Route</span>
          </button>
          <button
            onClick={() => onOpenQuickAction('newJointBox')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5 text-slate-500" />
            <span>New Joint Box</span>
          </button>
          <button
            onClick={() => onOpenQuickAction('newSplice')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5 text-blue-600" />
            <span>Splice Core</span>
          </button>
          <button
            onClick={() => onOpenQuickAction('newTicket')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>Log Ticket</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Routes */}
        <div 
          onClick={() => onNavigate('routes')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Fiber Routes</span>
            <Route className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalRoutes}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">{activeLinks} Active</span>
            <span>·</span>
            <span className={downLinks > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}>{downLinks} Down</span>
          </div>
        </div>

        {/* Total Cores */}
        <div 
          onClick={() => onNavigate('cores')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Cores</span>
            <Disc className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalCores}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">{activeCores} Used</span>
            <span>·</span>
            <span className="text-slate-500">{spareCores} Spare</span>
          </div>
        </div>

        {/* Faulty / Cut Cores */}
        <div 
          onClick={() => onNavigate('cores')}
          className={`bg-white border rounded-xl p-3.5 hover:border-slate-300 transition-colors cursor-pointer group shadow-2xs ${
            faultyCores > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Faulty / Cut</span>
            <AlertTriangle className={`w-4 h-4 ${faultyCores > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${faultyCores > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {faultyCores}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {faultyCores > 0 ? (
              <span className="text-rose-600 font-semibold">{faultyCores} Cores need splicing</span>
            ) : (
              <span className="text-emerald-700 font-medium">0 Loss of Signal</span>
            )}
          </div>
        </div>

        {/* Joint Boxes */}
        <div 
          onClick={() => onNavigate('jointBoxes')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Joint Boxes</span>
            <Boxes className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalJointBoxes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{db.splices.length} Active Splices</span>
          </div>
        </div>

        {/* Optical Splitters */}
        <div 
          onClick={() => onNavigate('splitters')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Splitters</span>
            <Split className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalSplitters}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>PLC & FBT Cassettes</span>
          </div>
        </div>

        {/* Customers */}
        <div 
          onClick={() => onNavigate('customers')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Subscribers</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalCustomers}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">{db.customers.filter(c => c.status === 'Active').length} Online ONUs</span>
          </div>
        </div>
      </div>

      {/* Secondary Hardware & Capacity Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">Core POPs</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{totalPops}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">OLT Chassis</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{totalOlts}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">PON Ports</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{totalPonPorts}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">Switches</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{totalSwitches}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">SFP Modules</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{totalSfpPorts}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">Dealers</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{totalDealers}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">Open Tickets</p>
          <p className={`text-lg font-bold font-mono mt-0.5 ${maintenanceItems > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {maintenanceItems}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">Utilization</p>
          <p className="text-lg font-bold font-mono text-blue-700 mt-0.5">{coreUtilizationRate}%</p>
        </div>
      </div>

      {/* Core Capacity & Health Distribution Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Fiber Core Capacity & Utilization Distribution</h3>
            <p className="text-xs text-slate-500">Live operational state across all {totalCores} physical cores in database</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Active: {activeCores} ({totalCores > 0 ? Math.round((activeCores / totalCores) * 100) : 0}%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span>Spare: {spareCores} ({totalCores > 0 ? Math.round((spareCores / totalCores) * 100) : 0}%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Fault: {faultyCores} ({totalCores > 0 ? Math.round((faultyCores / totalCores) * 100) : 0}%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Maint: {maintenanceCores}</span>
            </span>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
          <div 
            style={{ width: `${totalCores > 0 ? (activeCores / totalCores) * 100 : 0}%` }} 
            className="bg-emerald-500 transition-all duration-300"
            title={`Active Cores: ${activeCores}`}
          />
          <div 
            style={{ width: `${totalCores > 0 ? (spareCores / totalCores) * 100 : 0}%` }} 
            className="bg-slate-300 transition-all duration-300"
            title={`Spare Cores: ${spareCores}`}
          />
          <div 
            style={{ width: `${totalCores > 0 ? (faultyCores / totalCores) * 100 : 0}%` }} 
            className="bg-rose-500 transition-all duration-300"
            title={`Faulty Cores: ${faultyCores}`}
          />
          <div 
            style={{ width: `${totalCores > 0 ? (maintenanceCores / totalCores) * 100 : 0}%` }} 
            className="bg-amber-500 transition-all duration-300"
            title={`Maintenance Cores: ${maintenanceCores}`}
          />
        </div>
      </div>

      {/* Automated Network Discovery & Live Telemetry Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Automated Network Discovery & Device Telemetry</span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Monitoring
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ICMP Ping keepalive and SNMP port status across all OLTs, aggregation switches, and core routers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {scanMessage && (
              <span className="text-xs text-blue-600 font-medium animate-pulse">{scanMessage}</span>
            )}
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Ping Scan Now'}</span>
            </button>
            <button
              onClick={() => onNavigate('discovery')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <span>Full Discovery Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Device Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...db.olts, ...db.switches].slice(0, 4).map((dev) => {
            const tel = db.telemetry?.[dev.id];
            const isOnline = tel ? tel.pingStatus === 'Online' : dev.status === 'Active';
            return (
              <div
                key={dev.id}
                onClick={() => onNavigate('devices')}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">{dev.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                    isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{dev.ip}</span>
                  <span>{tel?.latencyMs ? `${tel.latencyMs} ms` : '1.2 ms'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                  <span>CPU: {tel?.cpuUsagePercent ? `${tel.cpuUsagePercent}%` : '24%'}</span>
                  <span>Ports UP: {tel?.portsTelemetry ? tel.portsTelemetry.filter(p => p.linkStatus === 'UP').length : 'All'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Key Fiber Routes & Recent Changes Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Fiber Routes Overview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Key Backbone & Distribution Routes</h3>
            </div>
            <button
              onClick={() => onNavigate('routes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {db.routes.slice(0, 4).map((r) => {
              const routeCables = db.cables.filter(c => c.routeId === r.id);
              const routeSplices = db.splices.filter(s => routeCables.some(c => c.id === s.incomingCableId || c.id === s.outgoingCableId));
              return (
                <div
                  key={r.id}
                  onClick={() => onNavigate('routes', r.id)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">{r.routeName}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      r.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{r.routeId}</span>
                    <span>·</span>
                    <span>{r.coreCount} Cores</span>
                    <span>·</span>
                    <span>{(r.cableLengthMeters / 1000).toFixed(2)} km</span>
                    <span>·</span>
                    <span>{r.installationType}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-1">
                    {r.startPoint} ➔ {r.endPoint}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Network Changes & Audit Trail */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Network Changes & History</h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
            >
              <span>Full Audit Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {db.auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {log.entityType}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                      {log.entityName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  <span className="font-semibold text-slate-800">{log.action}:</span> {log.reason}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                  <span>By: {log.user} ({log.userRole})</span>
                  {log.oldValue && log.newValue && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-slate-500">{log.oldValue} ➔ {log.newValue}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

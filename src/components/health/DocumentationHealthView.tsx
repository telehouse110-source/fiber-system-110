import React, { useState } from 'react';
import { 
  HeartPulse, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Disc, 
  Boxes, 
  Split, 
  Users, 
  MapPin, 
  Camera, 
  ArrowRight, 
  ExternalLink,
  Search,
  Filter,
  BarChart3,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  Zap
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';
import { computeDocumentationHealth } from '../../services/healthEngine';

interface DocumentationHealthViewProps {
  db: OptiFiberDatabase;
  onNavigateToAsset?: (section: string, id: string) => void;
}

export const DocumentationHealthView: React.FC<DocumentationHealthViewProps> = ({
  db,
  onNavigateToAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'MISSING' | 'ORPHANS' | 'CAPACITY'>('HEALTH');
  const [missingCategoryFilter, setMissingCategoryFilter] = useState('ALL');

  const report = computeDocumentationHealth(db);

  // Capacity calculations (Requirement 12)
  const totalCores = db.cores.length;
  const activeCores = db.cores.filter(c => c.status === 'Active').length;
  const spareCores = db.cores.filter(c => c.status === 'Spare').length;
  const reservedCores = db.cores.filter(c => c.status === 'Reserved').length;
  const faultCores = db.cores.filter(c => c.status === 'Fault' || c.status === 'Cut' || c.status === 'LOS').length;
  const fiberUtilization = totalCores > 0 ? Math.round(((activeCores + reservedCores) / totalCores) * 100) : 0;

  // Splitter capacity
  const totalSplitterPorts = db.splitters.reduce((acc, s) => acc + s.ports.length, 0);
  const usedSplitterPorts = db.splitters.reduce((acc, s) => acc + s.ports.filter(p => p.connectedCustomerId).length, 0);
  const availableSplitterPorts = totalSplitterPorts - usedSplitterPorts;
  const splitterUtilization = totalSplitterPorts > 0 ? Math.round((usedSplitterPorts / totalSplitterPorts) * 100) : 0;

  // PON capacity
  const totalPonCapacity = db.ponPorts.reduce((acc, p) => acc + (p.maxOnus || 64), 0);
  const activePonOnus = db.ponPorts.reduce((acc, p) => acc + (p.activeOnus || 0), 0);
  const availablePonOnus = Math.max(0, totalPonCapacity - activePonOnus);
  const ponUtilization = totalPonCapacity > 0 ? Math.round((activePonOnus / totalPonCapacity) * 100) : 0;

  // Duct capacity
  const totalDuctWays = (db.ducts || []).reduce((acc, d) => acc + (d.totalDuctWays || 0), 0);
  const usedDuctWays = (db.ducts || []).reduce((acc, d) => acc + (d.occupiedWays || d.assignedCableIds.length || 0), 0);
  const spareDuctWays = Math.max(0, totalDuctWays - usedDuctWays);
  const ductUtilization = totalDuctWays > 0 ? Math.round((usedDuctWays / totalDuctWays) * 100) : 0;

  const filteredMissing = report.missingItems.filter(item => {
    return missingCategoryFilter === 'ALL' || item.category === missingCategoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Network Documentation Health Score & Completeness Audit
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
                  {report.overallHealthScore}% Complete
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Factual verification of records, missing data gap analysis, orphan asset scanner, and capacity planning
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('HEALTH')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'HEALTH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completeness Score
            </button>
            <button
              onClick={() => setActiveTab('MISSING')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'MISSING' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Missing Data ({report.missingItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ORPHANS')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ORPHANS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Orphan Objects ({report.orphanObjects.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('CAPACITY')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'CAPACITY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Capacity Planning
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Factual Completeness Health Score Report */}
      {activeTab === 'HEALTH' && (
        <div className="space-y-6">
          {/* Health Gauge Hero */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-500"
                    strokeDasharray={`${report.overallHealthScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono text-slate-900">{report.overallHealthScore}%</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Audit Score</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Overall Documentation Health
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Calculated against standard engineering criteria: complete GPS polyline coords, verified feeder inputs, status integrity, and subscriber drops.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('MISSING')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Review Actionable Missing Data ({report.missingItems.length})
            </button>
          </div>

          {/* Factual Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.metrics.map(m => (
              <div key={m.category} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{m.category}</span>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                    m.score >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    m.score >= 75 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {m.score}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      m.score >= 90 ? 'bg-emerald-500' :
                      m.score >= 75 ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{m.complete} of {m.total} Verified</span>
                  <span className="text-slate-400">{m.total - m.complete} Incomplete</span>
                </div>
                <p className="text-[11px] text-slate-400">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Actionable "What is Missing?" Report */}
      {activeTab === 'MISSING' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Actionable "What is Missing?" Documentation Tasks
              </h3>
              <p className="text-xs text-slate-500">
                Click "Fix & Navigate" to resolve missing GPS, unlinked inputs, or incomplete metadata directly in the editor
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={missingCategoryFilter}
                onChange={(e) => setMissingCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
              >
                <option value="ALL">All Categories</option>
                <option value="ROUTE">Fiber Routes</option>
                <option value="JOINT_BOX">Joint Boxes</option>
                <option value="CORE">Fiber Cores</option>
                <option value="SPLITTER">Splitters</option>
                <option value="CUSTOMER">Customers</option>
                <option value="DEVICE">Active Devices</option>
              </select>
            </div>
          </div>

          {/* Missing Items List */}
          <div className="space-y-3">
            {filteredMissing.map(item => (
              <div 
                key={item.id}
                className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4 hover:border-slate-300 transition-colors shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.severity === 'high' ? 'bg-rose-50 text-rose-600' :
                    item.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono uppercase">
                        {item.category}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.severity === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.severity.toUpperCase()} Priority
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.detail}</p>
                  </div>
                </div>

                {onNavigateToAsset && (
                  <button
                    onClick={() => onNavigateToAsset(item.section, item.entityId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <span>Fix & Navigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {filteredMissing.length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Zero Missing Data Items Found!</h4>
                <p className="text-xs text-slate-500 mt-1">All network objects in this category meet 100% documentation completeness.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Orphan Object Detection */}
      {activeTab === 'ORPHANS' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Orphan Object Detection Scanner
            </h3>
            <p className="text-xs text-slate-500">
              Objects with no upstream transmitter, missing cable parents, or unassigned subscriber links
            </p>
          </div>

          <div className="space-y-3">
            {report.orphanObjects.map(orph => (
              <div 
                key={orph.id}
                className="p-4 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono">
                        {orph.entityType}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{orph.name}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">{orph.reason}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{orph.detail}</p>
                  </div>
                </div>

                {onNavigateToAsset && (
                  <button
                    onClick={() => onNavigateToAsset(orph.section, orph.entityId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer shrink-0"
                  >
                    <span>Connect / Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {report.orphanObjects.length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Zero Disconnected Orphans Detected</h4>
                <p className="text-xs text-slate-500 mt-1">Every physical fiber, core, closure, and active port belongs to a linked network relationship.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Network Capacity Planning (Requirement 12) */}
      {activeTab === 'CAPACITY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fiber Cores Capacity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fiber Cores</span>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {fiberUtilization}% Used
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {activeCores} <span className="text-xs text-slate-400 font-normal">/ {totalCores} Total Cores</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-600" style={{ width: `${(activeCores / totalCores) * 100}%` }} />
                <div className="h-full bg-amber-400" style={{ width: `${(reservedCores / totalCores) * 100}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${(faultCores / totalCores) * 100}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                <span>Spare: {spareCores}</span>
                <span>Reserved: {reservedCores}</span>
                <span>Fault: {faultCores}</span>
              </div>
            </div>

            {/* Splitter Ports Capacity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Splitter Ports</span>
                <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                  {splitterUtilization}% Used
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {usedSplitterPorts} <span className="text-xs text-slate-400 font-normal">/ {totalSplitterPorts} Drop Ports</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-violet-600" style={{ width: `${splitterUtilization}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                <span>Available Drops: {availableSplitterPorts}</span>
              </div>
            </div>

            {/* PON Capacity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GPON Bandwidth/ONUs</span>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {ponUtilization}%
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {activePonOnus} <span className="text-xs text-slate-400 font-normal">/ {totalPonCapacity} ONUs</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-600" style={{ width: `${ponUtilization}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                <span>Spare Capacity: {availablePonOnus} ONUs</span>
              </div>
            </div>

            {/* Duct Ways Capacity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duct Conduit Ways</span>
                <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                  {ductUtilization}% Used
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {usedDuctWays} <span className="text-xs text-slate-400 font-normal">/ {totalDuctWays} Ways</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-cyan-600" style={{ width: `${ductUtilization}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                <span>Available Ways: {spareDuctWays}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

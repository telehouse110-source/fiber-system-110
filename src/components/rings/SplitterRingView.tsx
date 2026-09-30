import React, { useState } from 'react';
import { 
  GitBranch, 
  RotateCw, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Radio, 
  Layers, 
  Boxes, 
  Split, 
  Users, 
  Activity, 
  Play, 
  RefreshCw, 
  X, 
  Plus, 
  QrCode,
  Share2
} from 'lucide-react';
import { OptiFiberDatabase, SplitterRing, FiberSegment, Customer } from '../../types';
import { addSplitterRing, updateSplitterRing, deleteSplitterRing } from '../../services/storage';
import { calculateCustomerImpact } from '../../services/customerImpactEngine';
import { AssetQRModal } from '../common/AssetQRModal';
import { ConnectedNetworkModal } from '../common/ConnectedNetworkModal';

interface SplitterRingViewProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
  onNavigateToDetail?: (section: string, id: string) => void;
}

export const SplitterRingView: React.FC<SplitterRingViewProps> = ({
  db,
  onLaunchTrace,
  onNavigateToDetail,
}) => {
  const rings = db.splitterRings || [];
  const [selectedRingId, setSelectedRingId] = useState<string>(rings[0]?.id || '');
  
  // Interactive Fiber Break Simulation
  const [simulatedBrokenSegmentId, setSimulatedBrokenSegmentId] = useState<string | null>(null);

  // Modals
  const [qrModalAsset, setQrModalAsset] = useState<any | null>(null);
  const [connectedModalAssetId, setConnectedModalAssetId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeRing = rings.find(r => r.id === selectedRingId) || rings[0];

  // Resolve Ring Components
  const segments = (activeRing?.primarySegmentIds || [])
    .concat(activeRing?.backupSegmentIds || [])
    .map(segId => db.fiberSegments?.find(s => s.id === segId))
    .filter((s): s is FiberSegment => !!s);

  const jointBoxes = (activeRing?.jointBoxIds || [])
    .map(jbId => db.jointBoxes.find(j => j.id === jbId || j.jointBoxId === jbId))
    .filter(Boolean);

  const splitters = (activeRing?.splitterIds || [])
    .map(sId => db.splitters.find(s => s.id === sId || s.splitterId === sId))
    .filter(Boolean);

  // Calculate Customers on this Ring
  const ringCustomers: Customer[] = [];
  splitters.forEach(splt => {
    if (splt) {
      db.customers.filter(c => c.splitterId === splt.id).forEach(c => {
        if (!ringCustomers.some(x => x.id === c.id)) ringCustomers.push(c);
      });
    }
  });

  // Simulation calculations
  const isSimulationActive = !!simulatedBrokenSegmentId;
  const brokenSegment = simulatedBrokenSegmentId ? db.fiberSegments?.find(s => s.id === simulatedBrokenSegmentId) : null;
  const isBrokenSegmentOnPrimary = activeRing?.primarySegmentIds.includes(simulatedBrokenSegmentId || '');

  // Affected vs Protected customers during simulation
  // If ring has automatic failover and backup path intact, customers are protected via failover!
  const isFailoverAvailable = activeRing?.backupSegmentIds && activeRing.backupSegmentIds.length > 0 && !activeRing.backupSegmentIds.includes(simulatedBrokenSegmentId || '');
  const protectedCustomerCount = isFailoverAvailable ? ringCustomers.length : 0;
  const affectedCustomerCount = isFailoverAvailable ? 0 : ringCustomers.length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Splitter Ring & Resilient Ring Topology Management
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-mono font-bold">
                  {rings.length} Rings Configured
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Protected fiber loops, counter-rotating backup paths, failover routing, and simulated ring break points
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Ring Selector */}
            <select
              value={selectedRingId}
              onChange={(e) => {
                setSelectedRingId(e.target.value);
                setSimulatedBrokenSegmentId(null);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              {rings.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.assetId})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ring Summary Info Strip */}
        {activeRing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ring Master ID</span>
              <span className="font-mono font-bold text-violet-700 text-sm">{activeRing.assetId}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Protection Type</span>
              <span className="font-semibold text-slate-900">{activeRing.type}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Failover Mechanism</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {activeRing.failoverMode} ({activeRing.backupCapacityCores} Spare Cores)
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Protected Subscribers</span>
              <span className="font-bold text-slate-900">{ringCustomers.length} Active FTTH ONUs</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Topology Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive SVG Ring Canvas */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Visual Ring Topology Diagram & Path Simulator
              </h3>
            </div>
            {isSimulationActive ? (
              <button
                onClick={() => setSimulatedBrokenSegmentId(null)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-amber-600" />
                <span>Reset Simulation</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">
                Click any segment line below to test fiber break & failover
              </span>
            )}
          </div>

          {/* SVG Ring Graph Canvas */}
          <div className="flex items-center justify-center p-4 min-h-[380px] bg-slate-50/50 rounded-xl border border-slate-100">
            <svg width="100%" height="360" viewBox="0 0 600 360" className="max-w-xl">
              {/* Circular Path Guides */}
              <circle 
                cx="300" 
                cy="180" 
                r="130" 
                fill="none" 
                stroke="#E2E8F0" 
                strokeWidth="8" 
              />

              {/* Segment 1: POP-01 -> JB-01 (Top-Right Arc) */}
              <path
                d="M 300 50 A 130 130 0 0 1 430 180"
                fill="none"
                stroke={simulatedBrokenSegmentId === 'fsg-01-01' ? '#EF4444' : '#2563EB'}
                strokeWidth="5"
                strokeDasharray={simulatedBrokenSegmentId === 'fsg-01-01' ? '6 6' : undefined}
                className="cursor-pointer hover:stroke-blue-700 transition-all"
                onClick={() => setSimulatedBrokenSegmentId('fsg-01-01')}
              />

              {/* Segment 2: JB-01 -> JB-02 (Bottom-Right Arc) */}
              <path
                d="M 430 180 A 130 130 0 0 1 300 310"
                fill="none"
                stroke={simulatedBrokenSegmentId === 'fsg-01-02' ? '#EF4444' : '#2563EB'}
                strokeWidth="5"
                strokeDasharray={simulatedBrokenSegmentId === 'fsg-01-02' ? '6 6' : undefined}
                className="cursor-pointer hover:stroke-blue-700 transition-all"
                onClick={() => setSimulatedBrokenSegmentId('fsg-01-02')}
              />

              {/* Segment 3: JB-02 -> JB-03 (Bottom-Left Arc) */}
              <path
                d="M 300 310 A 130 130 0 0 1 170 180"
                fill="none"
                stroke={simulatedBrokenSegmentId === 'fsg-01-03' ? '#EF4444' : '#2563EB'}
                strokeWidth="5"
                strokeDasharray={simulatedBrokenSegmentId === 'fsg-01-03' ? '6 6' : undefined}
                className="cursor-pointer hover:stroke-blue-700 transition-all"
                onClick={() => setSimulatedBrokenSegmentId('fsg-01-03')}
              />

              {/* Segment 4: JB-03 -> POP-01 (Top-Left Arc - Secondary / Backup Path) */}
              <path
                d="M 170 180 A 130 130 0 0 1 300 50"
                fill="none"
                stroke={simulatedBrokenSegmentId === 'fsg-02-02' ? '#EF4444' : (isSimulationActive ? '#10B981' : '#10B981')}
                strokeWidth="4"
                strokeDasharray={isSimulationActive ? undefined : '5 5'}
                className="cursor-pointer hover:stroke-emerald-700 transition-all"
                onClick={() => setSimulatedBrokenSegmentId('fsg-02-02')}
              />

              {/* Node 1: POP-01 Headend (Top Center) */}
              <g transform="translate(260, 20)">
                <rect width="80" height="48" rx="10" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                <text x="40" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#FFFFFF">POP-01</text>
                <text x="40" y="38" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94A3B8">Core Headend</text>
              </g>

              {/* Node 2: JB-01 Manhole (Right Center) */}
              <g transform="translate(405, 155)">
                <rect width="70" height="48" rx="10" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
                <text x="35" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E40AF">JB-01</text>
                <text x="35" y="38" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#3B82F6">North Manhole</text>
              </g>

              {/* Node 3: JB-02 Pole Mount & Splitter (Bottom Center) */}
              <g transform="translate(260, 285)">
                <rect width="80" height="48" rx="10" fill="#F5F3FF" stroke="#8B5CF6" strokeWidth="2" />
                <text x="40" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#5B21B6">JB-02 / SPL</text>
                <text x="40" y="38" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#8B5CF6">Green Park</text>
              </g>

              {/* Node 4: JB-03 Cabinet (Left Center) */}
              <g transform="translate(125, 155)">
                <rect width="70" height="48" rx="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
                <text x="35" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#065F46">JB-03</text>
                <text x="35" y="38" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#059669">Cedar Ridge</text>
              </g>

              {/* Central Ring Status Legend */}
              <g transform="translate(230, 140)">
                <rect width="140" height="75" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))" />
                <text x="70" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F172A">
                  {isSimulationActive ? 'SIMULATION MODE' : 'PROTECTED RING'}
                </text>
                <text x="70" y="42" textAnchor="middle" fontSize="10" fontFamily="monospace" fill={isSimulationActive ? '#DC2626' : '#059669'}>
                  {isSimulationActive ? 'FAILOVER ENGAGED' : 'Primary Path Normal'}
                </text>
                <text x="70" y="60" textAnchor="middle" fontSize="9" fill="#64748B">
                  {isSimulationActive ? `${protectedCustomerCount} Protected · ${affectedCustomerCount} Down` : 'Zero Single Point of Failure'}
                </text>
              </g>

              {/* Simulation Cut Icon Indicator */}
              {simulatedBrokenSegmentId && (
                <g transform="translate(420, 240)">
                  <circle cx="15" cy="15" r="16" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
                  <text x="15" y="20" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#DC2626">✕</text>
                </g>
              )}
            </svg>
          </div>

          {/* SVG Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-blue-600 rounded"></span>
              <span>Primary Counter-Clockwise Path</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 rounded border-dashed"></span>
              <span>Secondary / Standby Backup Path</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-rose-500 rounded"></span>
              <span>Simulated Cut / Break Point</span>
            </span>
          </div>
        </div>

        {/* Right Col: Ring Break Point & Customer Impact Diagnostics */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Resilience & Failover Analysis</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time ring path continuity and downstream subscriber protection status
            </p>

            {isSimulationActive ? (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Break Point: {brokenSegment?.name || simulatedBrokenSegmentId}</span>
                  </div>
                  <p className="text-rose-700 text-[11px]">
                    Primary physical fiber link interrupted at 1.2km span.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>OPS Protection Switch: Active</span>
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    Traffic reversed through Secondary Backup Path in &lt;50ms.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">Protected</span>
                    <span className="text-lg font-bold text-emerald-800">{protectedCustomerCount}</span>
                  </div>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-[10px] text-rose-700 font-bold uppercase block">Affected</span>
                    <span className="text-lg font-bold text-rose-800">{affectedCustomerCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ring State: 100% Intact & Operational</span>
                </div>
                <p className="text-emerald-700 text-[11px]">
                  All primary and backup fiber spans have active continuity. In case of cable damage, backup path automatically takes over.
                </p>
              </div>
            )}
          </div>

          {/* Connected Ring Elements List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Ring Physical Infrastructure
            </h4>

            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-600">Segments:</span>
                <span className="font-bold text-slate-900">{segments.length} Physical Spans</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-600">Joint Boxes:</span>
                <span className="font-bold text-slate-900">{jointBoxes.length} Enclosures</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-600">Optical Splitters:</span>
                <span className="font-bold text-slate-900">{splitters.length} Nodes</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-600">Connected Customers:</span>
                <span className="font-bold text-slate-900">{ringCustomers.length} Subscribers</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setQrModalAsset({
                  assetId: activeRing.assetId,
                  name: activeRing.name,
                  type: 'SPLITTER RING',
                  location: activeRing.startPoint,
                  verified: true,
                })}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Tag</span>
              </button>
              <button
                onClick={() => setConnectedModalAssetId(activeRing.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl font-semibold text-violet-700 cursor-pointer transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Topology Tree</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Asset QR Label Modal */}
      {qrModalAsset && (
        <AssetQRModal
          isOpen={true}
          onClose={() => setQrModalAsset(null)}
          asset={qrModalAsset}
        />
      )}

      {/* Show Connected Network Modal */}
      {connectedModalAssetId && (
        <ConnectedNetworkModal
          isOpen={true}
          onClose={() => setConnectedModalAssetId(null)}
          assetType="ROUTE"
          assetId={connectedModalAssetId}
          db={db}
          onNavigateToAsset={onNavigateToDetail}
        />
      )}
    </div>
  );
};

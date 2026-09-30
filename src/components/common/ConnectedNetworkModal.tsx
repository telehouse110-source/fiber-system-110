import React, { useState } from 'react';
import { 
  X, 
  GitBranch, 
  Layers, 
  Disc, 
  Boxes, 
  Split, 
  Users, 
  Server, 
  Radio, 
  Share2, 
  ChevronRight, 
  ChevronDown,
  ExternalLink,
  Shield,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';

interface ConnectedNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: 'CABLE' | 'ROUTE' | 'JOINT_BOX' | 'SPLITTER' | 'CUSTOMER' | 'OLT' | 'PON' | 'DUCT';
  assetId: string;
  db: OptiFiberDatabase;
  onNavigateToAsset?: (section: string, id: string) => void;
}

export const ConnectedNetworkModal: React.FC<ConnectedNetworkModalProps> = ({
  isOpen,
  onClose,
  assetType,
  assetId,
  db,
  onNavigateToAsset,
}) => {
  const [viewMode, setViewMode] = useState<'TREE' | 'GRAPH'>('TREE');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ root: true });

  if (!isOpen) return null;

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Find root asset details
  let rootTitle = assetId;
  let rootTypeLabel: string = assetType;
  let rootSubtitle = '';
  let rootAssetId = '';

  switch (assetType) {
    case 'CABLE': {
      const c = db.cables.find(x => x.id === assetId || x.cableId === assetId);
      if (c) {
        rootTitle = c.cableId;
        rootTypeLabel = `Fiber Cable (${c.coreCount} Cores)`;
        rootSubtitle = `${c.startLocation} ➔ ${c.endLocation}`;
        rootAssetId = c.assetId || c.cableId;
      }
      break;
    }
    case 'ROUTE': {
      const r = db.routes.find(x => x.id === assetId || x.routeId === assetId);
      if (r) {
        rootTitle = r.routeName;
        rootTypeLabel = `Fiber Route (${r.fiberType})`;
        rootSubtitle = `${r.startPoint} ➔ ${r.endPoint} (${(r.cableLengthMeters / 1000).toFixed(2)} km)`;
        rootAssetId = r.assetId || r.routeId;
      }
      break;
    }
    case 'JOINT_BOX': {
      const j = db.jointBoxes.find(x => x.id === assetId || x.jointBoxId === assetId);
      if (j) {
        rootTitle = j.name;
        rootTypeLabel = `Joint Box Enclosure (${j.type})`;
        rootSubtitle = `${j.location} · ${j.area}`;
        rootAssetId = j.assetId || j.jointBoxId;
      }
      break;
    }
    case 'SPLITTER': {
      const s = db.splitters.find(x => x.id === assetId || x.splitterId === assetId);
      if (s) {
        rootTitle = s.name || s.splitterId;
        rootTypeLabel = `Optical Splitter (${s.splitRatio})`;
        rootSubtitle = `${s.location} · Expected Loss: ${s.expectedLossDb} dB`;
        rootAssetId = s.assetId || s.splitterId;
      }
      break;
    }
    case 'CUSTOMER': {
      const c = db.customers.find(x => x.id === assetId || x.customerId === assetId);
      if (c) {
        rootTitle = c.name;
        rootTypeLabel = `Customer / Subscriber`;
        rootSubtitle = `${c.address} · ONU: ${c.onuModel}`;
        rootAssetId = c.assetId || c.customerId;
      }
      break;
    }
    case 'OLT': {
      const o = db.olts.find(x => x.id === assetId);
      if (o) {
        rootTitle = o.name;
        rootTypeLabel = `OLT Chassis (${o.model})`;
        rootSubtitle = `${o.ip} · ${o.location}`;
        rootAssetId = o.assetId || o.id;
      }
      break;
    }
    case 'PON': {
      const p = db.ponPorts.find(x => x.id === assetId);
      if (p) {
        rootTitle = p.name;
        rootTypeLabel = `PON Port (+${p.txPower} dBm)`;
        rootSubtitle = `${p.wavelength} · Active ONUs: ${p.activeOnus}`;
        rootAssetId = p.assetId || p.id;
      }
      break;
    }
    case 'DUCT': {
      const d = db.ducts?.find(x => x.id === assetId);
      if (d) {
        rootTitle = d.name;
        rootTypeLabel = `Duct Trench (${d.type})`;
        rootSubtitle = `${d.startPoint} ➔ ${d.endPoint} (${d.lengthMeters}m)`;
        rootAssetId = d.assetId || d.id;
      }
      break;
    }
  }

  // Discover all connected entities
  const connectedCables = db.cables.filter(c => {
    if (assetType === 'CABLE') return c.id === assetId;
    if (assetType === 'JOINT_BOX') return c.startLocation.includes(assetId) || c.endLocation.includes(assetId) || (db.jointBoxes.find(j => j.id === assetId)?.incomingCableIds || []).includes(c.id);
    if (assetType === 'ROUTE') return c.routeId === assetId;
    return false;
  });

  const connectedJointBoxes = db.jointBoxes.filter(j => {
    if (assetType === 'JOINT_BOX') return j.id === assetId;
    if (assetType === 'CABLE') return j.incomingCableIds.includes(assetId) || j.outgoingCableIds.includes(assetId);
    if (assetType === 'SPLITTER') return j.id === (db.splitters.find(s => s.id === assetId)?.jointBoxId);
    return false;
  });

  const connectedSplitters = db.splitters.filter(s => {
    if (assetType === 'SPLITTER') return s.id === assetId;
    if (assetType === 'JOINT_BOX') return s.jointBoxId === assetId;
    if (assetType === 'CABLE') return s.inputCableId === assetId;
    if (assetType === 'CUSTOMER') return s.id === (db.customers.find(c => c.id === assetId)?.splitterId);
    return false;
  });

  const connectedCustomers = db.customers.filter(c => {
    if (assetType === 'CUSTOMER') return c.id === assetId;
    if (assetType === 'SPLITTER') return c.splitterId === assetId;
    return false;
  });

  const connectedPons = db.ponPorts.filter(p => {
    if (assetType === 'PON') return p.id === assetId;
    if (assetType === 'OLT') return p.oltId === assetId;
    if (assetType === 'CABLE') return p.connectedFiberCableId === assetId;
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{rootTitle}</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {rootAssetId}
                </span>
              </div>
              <p className="text-xs text-slate-500">{rootTypeLabel} · {rootSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('TREE')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === 'TREE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode('GRAPH')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === 'GRAPH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Topology Graph
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {viewMode === 'TREE' ? (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Directly & Indirectly Connected Network Hierarchy
                </h4>

                {/* Tree Structure */}
                <div className="space-y-3 font-sans text-xs">
                  {/* Root Node */}
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>{rootTypeLabel}: {rootTitle} ({rootAssetId})</span>
                  </div>

                  {/* Upstream Section (OLT / PON) */}
                  {connectedPons.length > 0 && (
                    <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Upstream Optical Transmitters ({connectedPons.length})
                      </span>
                      {connectedPons.map(pon => (
                        <div key={pon.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Server className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-semibold text-slate-800">{pon.name}</span>
                            <span className="font-mono text-[10px] text-emerald-600">+{pon.txPower} dBm</span>
                          </div>
                          {onNavigateToAsset && (
                            <button
                              onClick={() => { onClose(); onNavigateToAsset('devices', pon.oltId); }}
                              className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
                            >
                              View OLT
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Connected Joint Boxes */}
                  {connectedJointBoxes.length > 0 && (
                    <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Connected Joint Box Closures ({connectedJointBoxes.length})
                      </span>
                      {connectedJointBoxes.map(jb => (
                        <div key={jb.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="font-semibold text-slate-800">{jb.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{jb.jointBoxId} · {jb.type}</span>
                          </div>
                          {onNavigateToAsset && (
                            <button
                              onClick={() => { onClose(); onNavigateToAsset('jointBoxes', jb.id); }}
                              className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
                            >
                              View Splices
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Connected Cables */}
                  {connectedCables.length > 0 && (
                    <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Connected Fiber Cables ({connectedCables.length})
                      </span>
                      {connectedCables.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-semibold text-slate-800">{c.cableId}</span>
                            <span className="font-mono text-[10px] text-slate-500">{c.coreCount} Cores · {c.cableType}</span>
                          </div>
                          {onNavigateToAsset && (
                            <button
                              onClick={() => { onClose(); onNavigateToAsset('inventory', c.id); }}
                              className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
                            >
                              View Cores
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Connected Splitters */}
                  {connectedSplitters.length > 0 && (
                    <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Optical Splitters ({connectedSplitters.length})
                      </span>
                      {connectedSplitters.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Split className="w-3.5 h-3.5 text-violet-600" />
                            <span className="font-semibold text-slate-800">{s.name || s.splitterId}</span>
                            <span className="font-mono text-[10px] text-slate-500">Ratio: {s.splitRatio} · Loss: {s.expectedLossDb} dB</span>
                          </div>
                          {onNavigateToAsset && (
                            <button
                              onClick={() => { onClose(); onNavigateToAsset('splitters', s.id); }}
                              className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
                            >
                              View Splitter
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Downstream Customers */}
                  {connectedCustomers.length > 0 && (
                    <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Downstream Subscribers ({connectedCustomers.length})
                      </span>
                      {connectedCustomers.map(cust => (
                        <div key={cust.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-semibold text-slate-800">{cust.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{cust.customerId} · {cust.package}</span>
                          </div>
                          {onNavigateToAsset && (
                            <button
                              onClick={() => { onClose(); onNavigateToAsset('customers', cust.id); }}
                              className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
                            >
                              View Customer
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Visual Topology Graph Representation */
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center min-h-[360px]">
              <svg width="100%" height="320" viewBox="0 0 600 320" className="max-w-xl">
                {/* Connecting Lines */}
                <line x1="80" y1="160" x2="220" y2="160" stroke="#94A3B8" strokeWidth="2.5" strokeDasharray="4 4" />
                <line x1="220" y1="160" x2="360" y2="100" stroke="#2563EB" strokeWidth="3" />
                <line x1="220" y1="160" x2="360" y2="220" stroke="#7C3AED" strokeWidth="3" />
                <line x1="360" y1="100" x2="500" y2="100" stroke="#059669" strokeWidth="2.5" />
                <line x1="360" y1="220" x2="500" y2="220" stroke="#059669" strokeWidth="2.5" />

                {/* Node 1: Upstream OLT / Headend */}
                <g transform="translate(40, 130)">
                  <rect width="80" height="60" rx="10" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
                  <text x="40" y="28" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F172A">OLT Headend</text>
                  <text x="40" y="44" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#64748B">POP-01</text>
                </g>

                {/* Node 2: Selected Focus Asset */}
                <g transform="translate(180, 120)">
                  <rect width="90" height="80" rx="12" fill="#EFF6FF" stroke="#2563EB" strokeWidth="3" />
                  <text x="45" y="32" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E40AF">Active Target</text>
                  <text x="45" y="48" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F172A">{rootTitle}</text>
                  <text x="45" y="64" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#3B82F6">{rootAssetId}</text>
                </g>

                {/* Node 3: Joint Box / Splice */}
                <g transform="translate(320, 70)">
                  <rect width="85" height="60" rx="10" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
                  <text x="42" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3730A3">Joint Closure</text>
                  <text x="42" y="44" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#6366F1">JB-001 / JB-002</text>
                </g>

                {/* Node 4: Splitter */}
                <g transform="translate(320, 190)">
                  <rect width="85" height="60" rx="10" fill="#FAF5FF" stroke="#9333EA" strokeWidth="2" />
                  <text x="42" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6B21A8">Splitter 1:8</text>
                  <text x="42" y="44" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#A855F7">SPL-01-A</text>
                </g>

                {/* Node 5: Customer Premise */}
                <g transform="translate(460, 70)">
                  <rect width="85" height="60" rx="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
                  <text x="42" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065F46">Subscribers</text>
                  <text x="42" y="44" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#059669">FTTH ONUs</text>
                </g>

                {/* Node 6: Customer Premise 2 */}
                <g transform="translate(460, 190)">
                  <rect width="85" height="60" rx="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
                  <text x="42" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065F46">Drop Cables</text>
                  <text x="42" y="44" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#059669">24 Drops</text>
                </g>
              </svg>
              <p className="text-xs text-slate-500 mt-2">
                Interactive relationship topology representing all direct and indirect physical and optical links.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {connectedCables.length} Cables · {connectedJointBoxes.length} JBs · {connectedSplitters.length} Splitters · {connectedCustomers.length} Subscribers
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

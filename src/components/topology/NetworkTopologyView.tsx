import React, { useState } from 'react';
import { 
  GitFork, 
  Layers, 
  Server, 
  Disc, 
  Boxes, 
  Split, 
  Users, 
  Radio, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Search, 
  Filter, 
  ArrowRight,
  Info,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';

interface NetworkTopologyViewProps {
  db: OptiFiberDatabase;
  onNavigateToAsset?: (section: string, id: string) => void;
  onLaunchTrace?: (type: any, id: string) => void;
}

export const NetworkTopologyView: React.FC<NetworkTopologyViewProps> = ({
  db,
  onNavigateToAsset,
  onLaunchTrace,
}) => {
  const [activeModel, setActiveModel] = useState<'PHYSICAL' | 'LOGICAL' | 'GRAPH'>('GRAPH');
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: string; name: string; details: any } | null>(null);
  const [search, setSearch] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Nodes for the interactive graph
  const nodes = [
    { id: 'pop-01', type: 'POP', name: 'POP-01 Core Headend', x: 80, y: 180, color: '#1E293B', textColor: '#FFFFFF' },
    { id: 'olt-01', type: 'OLT', name: 'OLT-CORE-HW01', x: 200, y: 120, color: '#2563EB', textColor: '#FFFFFF' },
    { id: 'sw-01', type: 'SWITCH', name: 'SW-CORE-CS01 (10G)', x: 200, y: 240, color: '#0284C7', textColor: '#FFFFFF' },
    { id: 'pon-01', type: 'PON', name: 'PON Port 01/3/1', x: 310, y: 120, color: '#4F46E5', textColor: '#FFFFFF' },
    { id: 'dct-01', type: 'DUCT', name: 'Grand Ave Conduit (DCT-001)', x: 420, y: 60, color: '#0891B2', textColor: '#FFFFFF' },
    { id: 'cbl-01', type: 'CABLE', name: 'CBL-048-A1 (48C)', x: 420, y: 180, color: '#3B82F6', textColor: '#FFFFFF' },
    { id: 'jb-01', type: 'JOINT_BOX', name: 'JB-001 North Manhole', x: 550, y: 180, color: '#6366F1', textColor: '#FFFFFF' },
    { id: 'spl-jb1', type: 'SPLICE', name: 'Splice Tray 1 (Fusion)', x: 670, y: 120, color: '#8B5CF6', textColor: '#FFFFFF' },
    { id: 'cbl-02', type: 'CABLE', name: 'CBL-024-B1 (24C)', x: 670, y: 240, color: '#3B82F6', textColor: '#FFFFFF' },
    { id: 'jb-02', type: 'JOINT_BOX', name: 'JB-002 Green Park Pole', x: 790, y: 180, color: '#6366F1', textColor: '#FFFFFF' },
    { id: 'spl-01', type: 'SPLITTER', name: 'SPL-01-A (1:8 PLC)', x: 910, y: 180, color: '#9333EA', textColor: '#FFFFFF' },
    { id: 'cust-cluster', type: 'CUSTOMER', name: '24 FTTH Subscribers', x: 1040, y: 180, color: '#059669', textColor: '#FFFFFF' },
  ];

  const edges = [
    { from: 'pop-01', to: 'olt-01', label: 'Houses' },
    { from: 'pop-01', to: 'sw-01', label: 'Houses' },
    { from: 'olt-01', to: 'pon-01', label: 'Equipped With' },
    { from: 'pon-01', to: 'cbl-01', label: 'Transmits Over' },
    { from: 'cbl-01', to: 'dct-01', label: 'Installed In' },
    { from: 'cbl-01', to: 'jb-01', label: 'Terminated In' },
    { from: 'jb-01', to: 'spl-jb1', label: 'Contains Splice' },
    { from: 'spl-jb1', to: 'cbl-02', label: 'Spliced Cross-connect' },
    { from: 'cbl-02', to: 'jb-02', label: 'Routed Through' },
    { from: 'jb-02', to: 'spl-01', label: 'Feeds Input' },
    { from: 'spl-01', to: 'cust-cluster', label: 'Distributes Drop to' },
  ];

  const handleSelectGraphNode = (node: any) => {
    setSelectedNode({
      id: node.id,
      type: node.type,
      name: node.name,
      details: {
        x: node.x,
        y: node.y,
        status: 'Active',
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Physical + Logical Network Model & Relationship Graph
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                  Interactive Node-Link
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Switch seamlessly between Physical Conduit/Splice view and Logical OLT/PON/ONU service paths
              </p>
            </div>
          </div>

          {/* Model Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveModel('GRAPH')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                activeModel === 'GRAPH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interactive Graph
            </button>
            <button
              onClick={() => setActiveModel('PHYSICAL')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                activeModel === 'PHYSICAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Physical Model
            </button>
            <button
              onClick={() => setActiveModel('LOGICAL')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                activeModel === 'LOGICAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Logical Model
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Node Types:</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span> POP Headend</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> OLT / Switch</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span> Duct Trench</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Joint Box / Splice</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span> Optical Splitter</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Customer ONUs</span>
        </div>
      </div>

      {/* Main Graph Viewport */}
      {activeModel === 'GRAPH' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          {/* Zoom Controls */}
          <div className="absolute right-6 top-6 z-10 flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
            <button 
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.6))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer text-[10px] font-mono font-bold"
              title="Reset Zoom"
            >
              1x
            </button>
          </div>

          {/* SVG Canvas */}
          <div className="overflow-x-auto min-h-[460px] flex items-center justify-start py-4">
            <svg 
              width={1180 * zoomLevel} 
              height={380 * zoomLevel} 
              viewBox="0 0 1180 380"
              className="transition-transform duration-150 origin-top-left"
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
                </marker>
              </defs>

              {/* Connecting Edges */}
              {edges.map((e, idx) => {
                const src = nodes.find(n => n.id === e.from);
                const dst = nodes.find(n => n.id === e.to);
                if (!src || !dst) return null;
                const midX = (src.x + dst.x) / 2;
                const midY = (src.y + dst.y) / 2;

                return (
                  <g key={idx}>
                    <line
                      x1={src.x + 40}
                      y1={src.y + 24}
                      x2={dst.x}
                      y2={dst.y + 24}
                      stroke="#94A3B8"
                      strokeWidth="2.5"
                      markerEnd="url(#arrow)"
                    />
                    <text
                      x={midX}
                      y={midY + 12}
                      fontSize="9"
                      fill="#64748B"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none"
                    >
                      {e.label}
                    </text>
                  </g>
                );
              })}

              {/* Render Nodes */}
              {nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => handleSelectGraphNode(node)}
                    className="cursor-pointer group"
                  >
                    <rect
                      width="120"
                      height="50"
                      rx="10"
                      fill={node.color}
                      stroke={isSelected ? '#F59E0B' : '#0F172A'}
                      strokeWidth={isSelected ? 3 : 1}
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))"
                      className="group-hover:opacity-90 transition-all"
                    />
                    <text
                      x="60"
                      y="20"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={node.textColor}
                      className="select-none"
                    >
                      {node.type}
                    </text>
                    <text
                      x="60"
                      y="36"
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="sans-serif"
                      fill="#E2E8F0"
                      className="select-none truncate"
                    >
                      {node.name.length > 17 ? node.name.slice(0, 16) + '...' : node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node Inspector Bottom Drawer */}
          {selectedNode && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-xs font-bold uppercase">
                  {selectedNode.type}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedNode.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">Entity ID: {selectedNode.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onLaunchTrace && (
                  <button
                    onClick={() => onLaunchTrace(selectedNode.type, selectedNode.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Trace Path
                  </button>
                )}
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeModel === 'PHYSICAL' ? (
        /* Physical View Tab */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Physical Infrastructure Chain</h3>
            <p className="text-xs text-slate-500">
              Duct ➔ Fiber Cable ➔ Core ➔ Joint Box ➔ Splice Tray ➔ Optical Splitter ➔ Distribution Drop ➔ Customer Premise
            </p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-cyan-900">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>1. Underground Duct Conduit (DCT-001)</span>
              </div>
              <span className="font-mono text-cyan-700">12-Way Concrete Trench (3.2 km)</span>
            </div>

            <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>2. Physical Armored Cable (CBL-048-A1)</span>
                </div>
                <span className="font-mono text-blue-700">48-Core G.652D Corning ALTOS</span>
              </div>

              <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-indigo-900">
                    <Disc className="w-4 h-4 text-indigo-600" />
                    <span>3. Fiber Core #04 (Orange) & #01 (Blue)</span>
                  </div>
                  <span className="font-mono text-indigo-700">TIA-598 Color Map · 0.35 dB/km</span>
                </div>

                <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-purple-900">
                      <Boxes className="w-4 h-4 text-purple-600" />
                      <span>4. Joint Box Closure JB-001 (Dome FOSC-400)</span>
                    </div>
                    <span className="font-mono text-purple-700">Splice Tray 1 · Fusion Loss: 0.03 dB</span>
                  </div>

                  <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-900">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>5. Subscribers Premises (24 Drop Cables)</span>
                      </div>
                      <span className="font-mono text-emerald-700">Drop length: 65m - 120m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Logical View Tab */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Logical Network Service Path</h3>
            <p className="text-xs text-slate-500">
              OLT Chassis ➔ Line Card ➔ PON Port ➔ Optical Service Channel ➔ Splitter ➔ ONU ➔ Customer Internet Service
            </p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Server className="w-4 h-4 text-slate-700" />
                <span>1. OLT-CORE-HW01 (Huawei SmartAX MA5800-X7)</span>
              </div>
              <span className="font-mono text-slate-600">IP: 10.100.1.10 · 32 GPON Ports</span>
            </div>

            <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <span>2. Line Card Slot 3 ➔ PON Port 01</span>
                </div>
                <span className="font-mono text-blue-700">Tx: +5.2 dBm (1490nm Class C++)</span>
              </div>

              <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-violet-900">
                    <Split className="w-4 h-4 text-violet-600" />
                    <span>3. Optical Splitter SPL-01-A (1:8 PLC Cassette)</span>
                  </div>
                  <span className="font-mono text-violet-700">Insertion Loss: 10.7 dB</span>
                </div>

                <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>4. Customer ONU (Huawei HG8310M GPON ONT)</span>
                    </div>
                    <span className="font-mono text-emerald-700">Rx Power: -18.2 dBm · Active Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

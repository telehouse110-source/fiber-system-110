import React, { useState, useRef } from 'react';
import { 
  GitBranch, 
  Boxes, 
  Layers, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Maximize2
} from 'lucide-react';
import { OptiFiberDatabase, JointBox, FiberCable, FiberCore, SpliceConnection } from '../../types';

interface SchematicGeneratorViewProps {
  db: OptiFiberDatabase;
  initialJbId?: string;
  initialCableId?: string;
  initialMode?: 'JOINT_BOX' | 'CABLE';
  onLaunchTrace: (type: any, id: string) => void;
}

export const SchematicGeneratorView: React.FC<SchematicGeneratorViewProps> = ({
  db,
  initialJbId,
  initialCableId,
  initialMode,
  onLaunchTrace,
}) => {
  const [mode, setMode] = useState<'JOINT_BOX' | 'CABLE'>(initialMode || (initialCableId ? 'CABLE' : 'JOINT_BOX'));
  const [selectedJbId, setSelectedJbId] = useState<string>(initialJbId || db.jointBoxes[0]?.id || '');
  const [selectedCableId, setSelectedCableId] = useState<string>(initialCableId || db.cables[0]?.id || '');
  const [highlightedSpliceId, setHighlightedSpliceId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [exporting, setExporting] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  const selectedJb = db.jointBoxes.find(j => j.id === selectedJbId);
  const selectedCable = db.cables.find(c => c.id === selectedCableId);
  const selectedRoute = selectedCable ? db.routes.find(r => r.id === selectedCable.routeId) : null;

  // Joint Box Data
  const jbSplices = selectedJb ? db.splices.filter(s => s.jointBoxId === selectedJb.id) : [];
  const inCables = selectedJb ? selectedJb.incomingCableIds.map(id => db.cables.find(c => c.id === id)).filter(Boolean) as FiberCable[] : [];
  const outCables = selectedJb ? selectedJb.outgoingCableIds.map(id => db.cables.find(c => c.id === id)).filter(Boolean) as FiberCable[] : [];

  // Export as PNG via canvas
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    setExporting(true);

    try {
      const svg = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 900;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const png = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          const filename = mode === 'JOINT_BOX' 
            ? `${selectedJb?.jointBoxId || 'joint_box'}_schematic.png`
            : `${selectedCable?.cableId || 'cable'}_schematic.png`;
          downloadLink.download = filename;
          downloadLink.href = png;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.remove();
        }
        setExporting(false);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Failed to export PNG:', err);
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Geometry calculations for Joint Box Schematic SVG
  const svgWidth = 1200;
  const svgHeight = 700;

  // Incoming cores (left side)
  const incomingCoresList: { cable: FiberCable; core: FiberCore; y: number }[] = [];
  let inY = 90;
  inCables.forEach(c => {
    const cores = db.cores.filter(core => core.cableId === c.id).slice(0, 12);
    cores.forEach(core => {
      incomingCoresList.push({ cable: c, core, y: inY });
      inY += 34;
    });
  });

  // Outgoing cores (right side)
  const outgoingCoresList: { cable: FiberCable; core: FiberCore; y: number }[] = [];
  let outY = 90;
  outCables.forEach(c => {
    const cores = db.cores.filter(core => core.cableId === c.id).slice(0, 12);
    cores.forEach(core => {
      outgoingCoresList.push({ cable: c, core, y: outY });
      outY += 34;
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <span>Interactive Fiber Optical Schematic & Splice Diagram Generator</span>
          </h1>
          <p className="text-xs text-slate-500">
            Generate vector schematics for joint boxes, splice trays, color conversion curves, and longitudinal cable routes
          </p>
        </div>

        {/* Mode Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setMode('JOINT_BOX')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === 'JOINT_BOX' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Joint Box Enclosure
            </button>
            <button
              onClick={() => setMode('CABLE')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === 'CABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cable & Core Route
            </button>
          </div>

          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export PNG'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Vector</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Select Target & Zoom */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {mode === 'JOINT_BOX' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-600 shrink-0">Closure:</label>
              <select
                value={selectedJbId}
                onChange={(e) => {
                  setSelectedJbId(e.target.value);
                  setHighlightedSpliceId(null);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 cursor-pointer focus:outline-hidden"
              >
                {db.jointBoxes.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.jointBoxId} - {j.name} ({j.type})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-600 shrink-0">Cable Drum:</label>
              <select
                value={selectedCableId}
                onChange={(e) => setSelectedCableId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 cursor-pointer focus:outline-hidden"
              >
                {db.cables.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.cableId} ({c.coreCount} Cores) - {c.brand}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-mono text-[11px] font-semibold mr-1">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.1))}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive SVG Canvas Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs overflow-auto">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.15s ease-out' }}
          className="min-w-[1200px]"
        >
          {mode === 'JOINT_BOX' && selectedJb && (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto bg-slate-50/50 rounded-xl border border-slate-200 select-none"
            >
              {/* Definitions: Gradients and Markers */}
              <defs>
                <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.08" />
                </filter>
                <linearGradient id="enclosureGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#F8FAFC" />
                </linearGradient>
                <linearGradient id="trayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F1F5F9" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
              </defs>

              {/* Closure Outer Casing */}
              <rect
                x="60"
                y="30"
                width={svgWidth - 120}
                height={svgHeight - 60}
                rx="24"
                fill="url(#enclosureGrad)"
                stroke="#CBD5E1"
                strokeWidth="2"
                filter="url(#shadow)"
              />

              {/* Closure Header Banner */}
              <rect x="60" y="30" width={svgWidth - 120} height="44" rx="24" fill="#0F172A" />
              <text x="85" y="58" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                {selectedJb.name} ({selectedJb.jointBoxId}) — {selectedJb.type} Splice Closure Schematic
              </text>
              <text x={svgWidth - 85} y="58" textAnchor="end" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">
                Capacity: {selectedJb.maxSpliceCapacity} Splices · Trays: {selectedJb.trayCount} · Location: {selectedJb.location}
              </text>

              {/* Ingress Glands (Left) */}
              <rect x="35" y="80" width="35" height="480" rx="8" fill="#64748B" />
              <text x="45" y="320" transform="rotate(-90 45,320)" fill="#FFFFFF" fontSize="10" fontWeight="bold" letterSpacing="2">
                INCOMING FEEDER CABLES
              </text>

              {/* Egress Glands (Right) */}
              <rect x={svgWidth - 70} y="80" width="35" height="480" rx="8" fill="#64748B" />
              <text x={svgWidth - 55} y="320" transform="rotate(90 svgWidth-55,320)" fill="#FFFFFF" fontSize="10" fontWeight="bold" letterSpacing="2">
                OUTGOING DISTRIBUTION
              </text>

              {/* Center Splice Tray Area */}
              <rect
                x="440"
                y="90"
                width="320"
                height="460"
                rx="16"
                fill="url(#trayGrad)"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x="600" y="115" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="bold">
                SPLICE TRAY #1 (Fusion Matrix)
              </text>

              {/* Render Splice Connecting Curves */}
              {jbSplices.map(splice => {
                const inIndex = incomingCoresList.findIndex(
                  item => item.cable.id === splice.incomingCableId && item.core.coreNumber === splice.incomingCoreNumber
                );
                const outIndex = outgoingCoresList.findIndex(
                  item => item.cable.id === splice.outgoingCableId && item.core.coreNumber === splice.outgoingCoreNumber
                );

                if (inIndex === -1 || outIndex === -1) return null;

                const startY = incomingCoresList[inIndex].y;
                const endY = outgoingCoresList[outIndex].y;
                const startX = 260;
                const endX = svgWidth - 260;
                const isSelected = highlightedSpliceId === splice.id;

                // Splice sleeve in center
                const trayY = 140 + inIndex * 32;

                return (
                  <g 
                    key={splice.id}
                    onClick={() => setHighlightedSpliceId(isSelected ? null : splice.id)}
                    className="cursor-pointer group"
                  >
                    {/* Splice Curve from Left to Center Sleeve */}
                    <path
                      d={`M ${startX} ${startY} C 360 ${startY}, 420 ${trayY}, 500 ${trayY}`}
                      fill="none"
                      stroke={isSelected ? '#2563EB' : splice.incomingCoreColor ? '#EA580C' : '#3B82F6'}
                      strokeWidth={isSelected ? 4 : 2.5}
                      opacity={isSelected ? 1 : 0.85}
                    />

                    {/* Splice Sleeve Cylinder */}
                    <rect
                      x="500"
                      y={trayY - 6}
                      width="200"
                      height="12"
                      rx="6"
                      fill={isSelected ? '#1D4ED8' : '#334155'}
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <text x="600" y={trayY + 3} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace">
                      {splice.incomingCoreColor} C#{splice.incomingCoreNumber} ➔ {splice.outgoingCoreColor} C#{splice.outgoingCoreNumber} ({splice.spliceLossDb} dB)
                    </text>

                    {/* Splice Curve from Center Sleeve to Right */}
                    <path
                      d={`M 700 ${trayY} C 780 ${trayY}, 840 ${endY}, ${endX} ${endY}`}
                      fill="none"
                      stroke={isSelected ? '#16A34A' : '#10B981'}
                      strokeWidth={isSelected ? 4 : 2.5}
                      opacity={isSelected ? 1 : 0.85}
                    />
                  </g>
                );
              })}

              {/* Render Incoming Cores (Left) */}
              {incomingCoresList.map((item, idx) => (
                <g key={`in-${item.core.id}`} className="group">
                  {/* Lead Line */}
                  <line x1="120" y1={item.y} x2="260" y2={item.y} stroke="#CBD5E1" strokeWidth="1" />
                  
                  {/* Core Color Dot */}
                  <circle
                    cx="260"
                    cy={item.y}
                    r="6"
                    fill={item.core.colorHex}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

                  {/* Core Label */}
                  <text x="245" y={item.y + 3} textAnchor="end" fill="#0F172A" fontSize="10" fontFamily="sans-serif" fontWeight="600">
                    C#{item.core.coreNumber} {item.core.colorName}
                  </text>
                  <text x="120" y={item.y - 4} fill="#64748B" fontSize="8" fontFamily="monospace">
                    {item.cable.cableId}
                  </text>
                </g>
              ))}

              {/* Render Outgoing Cores (Right) */}
              {outgoingCoresList.map((item, idx) => (
                <g key={`out-${item.core.id}`} className="group">
                  {/* Lead Line */}
                  <line x1={svgWidth - 260} y1={item.y} x2={svgWidth - 120} y2={item.y} stroke="#CBD5E1" strokeWidth="1" />
                  
                  {/* Core Color Dot */}
                  <circle
                    cx={svgWidth - 260}
                    cy={item.y}
                    r="6"
                    fill={item.core.colorHex}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

                  {/* Core Label */}
                  <text x={svgWidth - 245} y={item.y + 3} fill="#0F172A" fontSize="10" fontFamily="sans-serif" fontWeight="600">
                    C#{item.core.coreNumber} {item.core.colorName}
                  </text>
                  <text x={svgWidth - 120} y={item.y - 4} textAnchor="end" fill="#64748B" fontSize="8" fontFamily="monospace">
                    {item.cable.cableId}
                  </text>
                </g>
              ))}

              {/* Schematic Footer / Color Key */}
              <rect x="75" y={svgHeight - 100} width={svgWidth - 150} height="55" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
              <text x="90" y={svgHeight - 75} fill="#64748B" fontSize="10" fontWeight="bold">
                COLOR KEY (TIA-598-C):
              </text>
              <g transform={`translate(230, ${svgHeight - 82})`}>
                {db.colors.slice(0, 12).map((col, idx) => (
                  <g key={col.id} transform={`translate(${idx * 75}, 0)`}>
                    <circle cx="5" cy="5" r="5" fill={col.hex} stroke="#CBD5E1" strokeWidth="1" />
                    <text x="14" y="8" fill="#334155" fontSize="9" fontWeight="500">
                      {col.name}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          )}

          {mode === 'CABLE' && selectedCable && (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto bg-slate-50/50 rounded-xl border border-slate-200 select-none"
            >
              {/* Header */}
              <rect x="60" y="30" width={svgWidth - 120} height="44" rx="24" fill="#0F172A" />
              <text x="85" y="58" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                {selectedCable.cableId} — {selectedCable.brand} ({selectedCable.coreCount} Cores) Cross-Section & Route Profile
              </text>
              <text x={svgWidth - 85} y="58" textAnchor="end" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">
                Type: {selectedCable.cableType} · Installed: {selectedCable.installedLengthMeters}m · Batch: {selectedCable.batchNumber}
              </text>

              {/* Left: Cross-Sectional Geometry of Cable */}
              <g transform="translate(220, 280)">
                <text x="0" y="-160" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="bold">
                  Radial Cable Cross-Section
                </text>
                
                {/* Outer HDPE Jacket */}
                <circle cx="0" cy="0" r="140" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
                <text x="0" y="-120" textAnchor="middle" fill="#94A3B8" fontSize="9">Outer HDPE Sheath</text>

                {/* Corrugated Steel Armor */}
                <circle cx="0" cy="0" r="115" fill="#475569" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />

                {/* Water Blocking Tape Layer */}
                <circle cx="0" cy="0" r="100" fill="#E2E8F0" />

                {/* Central FRP Strength Member */}
                <circle cx="0" cy="0" r="24" fill="#64748B" stroke="#334155" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">FRP</text>

                {/* Buffer Tubes with 12 Cores Each */}
                {[0, 90, 180, 270].map((deg, i) => {
                  const rad = (deg * Math.PI) / 180;
                  const tubeX = Math.cos(rad) * 60;
                  const tubeY = Math.sin(rad) * 60;
                  const tubeCol = db.colors[i % 12];

                  return (
                    <g key={deg} transform={`translate(${tubeX}, ${tubeY})`}>
                      <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke={tubeCol.hex} strokeWidth="3" />
                      <text x="0" y="-14" textAnchor="middle" fill="#334155" fontSize="7" fontWeight="bold">
                        Tube {i + 1}
                      </text>
                      {/* Individual Colored Fibers inside Buffer Tube */}
                      {Array.from({ length: 6 }).map((_, fIdx) => {
                        const fDeg = (fIdx * 60 * Math.PI) / 180;
                        const fX = Math.cos(fDeg) * 14;
                        const fY = Math.sin(fDeg) * 14;
                        const fCol = db.colors[fIdx % 12];
                        return (
                          <circle
                            key={fIdx}
                            cx={fX}
                            cy={fY + 4}
                            r="3.5"
                            fill={fCol.hex}
                            stroke="#FFFFFF"
                            strokeWidth="0.5"
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </g>

              {/* Right: Longitudinal Route Continuous Core Status Strip */}
              <g transform="translate(480, 100)">
                <text x="0" y="20" fill="#0F172A" fontSize="12" fontWeight="bold">
                  Longitudinal Core Continuity & Color Strip (Cores 1 to {Math.min(24, selectedCable.coreCount)})
                </text>
                <text x="0" y="38" fill="#64748B" fontSize="10">
                  {selectedCable.startLocation} ➔ {selectedCable.endLocation} ({selectedRoute?.cableLengthMeters}m)
                </text>

                {/* Cores Linear Matrix */}
                {db.cores.filter(c => c.cableId === selectedCable.id).slice(0, 16).map((core, idx) => {
                  const y = 60 + idx * 30;
                  return (
                    <g key={core.id}>
                      {/* Core Number and Color Chip */}
                      <circle cx="10" cy={y} r="5" fill={core.colorHex} stroke="#CBD5E1" strokeWidth="1" />
                      <text x="25" y={y + 3} fill="#0F172A" fontSize="10" fontWeight="bold">
                        C#{core.coreNumber} ({core.colorName})
                      </text>

                      {/* Optical Path Wire */}
                      <line
                        x1="120"
                        y1={y}
                        x2="560"
                        y2={y}
                        stroke={core.status === 'Active' ? '#16A34A' : core.status === 'Fault' ? '#DC2626' : '#94A3B8'}
                        strokeWidth="3"
                        strokeDasharray={core.status === 'Spare' ? '4 4' : 'none'}
                      />

                      {/* Power Badge */}
                      <text x="580" y={y + 3} fill="#475569" fontSize="10" fontFamily="monospace">
                        {core.signalPowerDbm ? `${core.signalPowerDbm} dBm` : '0.35 dB/km'}
                      </text>

                      {/* Status Pill */}
                      <rect
                        x="650"
                        y={y - 8}
                        width="60"
                        height="16"
                        rx="8"
                        fill={core.status === 'Active' ? '#DCFCE7' : core.status === 'Fault' ? '#FEE2E2' : '#F1F5F9'}
                      />
                      <text
                        x="680"
                        y={y + 3}
                        textAnchor="middle"
                        fill={core.status === 'Active' ? '#15803D' : core.status === 'Fault' ? '#B91C1C' : '#475569'}
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {core.status}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

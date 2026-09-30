import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  ArrowRight,
  ArrowDown,
  Layers,
  Disc,
  Boxes,
  Split,
  Users,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { OptiFiberDatabase, TraceResult, TraceStep } from '../../types';
import { runFiberTrace } from '../../services/traceEngine';

interface FiberTraceViewProps {
  db: OptiFiberDatabase;
  initialType?: string;
  initialId?: string;
  onNavigate: (section: any, id?: string) => void;
}

export const FiberTraceView: React.FC<FiberTraceViewProps> = ({
  db,
  initialType,
  initialId,
  onNavigate,
}) => {
  const [sourceType, setSourceType] = useState<any>(initialType || 'CUSTOMER');
  const [sourceId, setSourceId] = useState<string>(initialId || (db.customers[0]?.id || ''));
  const [selectedCoreNum, setSelectedCoreNum] = useState<number>(4);
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);

  // Synchronize when initial props change
  useEffect(() => {
    if (initialType && initialId) {
      setSourceType(initialType);
      setSourceId(initialId);
    }
  }, [initialType, initialId]);

  // Execute trace whenever inputs change
  useEffect(() => {
    if (!sourceId) return;
    const res = runFiberTrace(db, sourceType, sourceId, { coreNumber: selectedCoreNum });
    setTraceResult(res);
  }, [db, sourceType, sourceId, selectedCoreNum]);

  // Get options based on selected sourceType
  const getSelectOptions = () => {
    switch (sourceType) {
      case 'CUSTOMER':
        return db.customers.map(c => ({ id: c.id, label: `${c.name} (${c.customerId}) - ${c.package}` }));
      case 'PON':
        return db.ponPorts.map(p => ({ id: p.id, label: `${p.name} (+${p.txPower} dBm)` }));
      case 'OLT':
        return db.olts.map(o => ({ id: o.id, label: `${o.name} (${o.model})` }));
      case 'CABLE':
        return db.cables.map(c => ({ id: c.id, label: `${c.cableId} (${c.coreCount} Cores - ${c.brand})` }));
      case 'CORE':
        return db.cores.filter(c => c.status === 'Active' || c.status === 'Fault').slice(0, 50).map(c => ({
          id: c.id,
          label: `${c.cableId} Core #${c.coreNumber} (${c.colorName}) [${c.status}]`,
        }));
      case 'SPLITTER':
        return db.splitters.map(s => ({ id: s.id, label: `${s.name || s.splitterId} (${s.splitRatio}) - ${s.location}` }));
      case 'JOINT_BOX':
        return db.jointBoxes.map(j => ({ id: j.id, label: `${j.name} (${j.jointBoxId})` }));
      default:
        return [];
    }
  };

  const options = getSelectOptions();

  return (
    <div className="space-y-6">
      {/* Header & Controls Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Bidirectional Fiber Relationship & Trace Engine
                </h1>
                <p className="text-xs text-slate-500">
                  Trace optical continuity, core color conversion, splices, splitters and calculate power loss
                </p>
              </div>
            </div>
          </div>

          {/* Quick Real-World Example Button */}
          <button
            onClick={() => {
              setSourceType('CUSTOMER');
              setSourceId('cust-01');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer self-start lg:self-auto"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Real FTTH Chain Example</span>
          </button>
        </div>

        {/* Input Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trace Origin Entity
            </label>
            <select
              value={sourceType}
              onChange={(e) => {
                const newType = e.target.value;
                setSourceType(newType);
                // Reset sourceId to first item of new type
                if (newType === 'CUSTOMER' && db.customers[0]) setSourceId(db.customers[0].id);
                else if (newType === 'PON' && db.ponPorts[0]) setSourceId(db.ponPorts[0].id);
                else if (newType === 'OLT' && db.olts[0]) setSourceId(db.olts[0].id);
                else if (newType === 'CABLE' && db.cables[0]) setSourceId(db.cables[0].id);
                else if (newType === 'CORE' && db.cores[0]) setSourceId(db.cores[0].id);
                else if (newType === 'SPLITTER' && db.splitters[0]) setSourceId(db.splitters[0].id);
                else if (newType === 'JOINT_BOX' && db.jointBoxes[0]) setSourceId(db.jointBoxes[0].id);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="CUSTOMER">Customer / Subscriber</option>
              <option value="PON">OLT PON Port</option>
              <option value="OLT">OLT Chassis</option>
              <option value="CABLE">Physical Fiber Cable</option>
              <option value="CORE">Individual Fiber Core</option>
              <option value="SPLITTER">Optical Splitter</option>
              <option value="JOINT_BOX">Joint Box Closure</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Specific Target
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {sourceType === 'CABLE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Core Number
              </label>
              <input
                type="number"
                min="1"
                max="96"
                value={selectedCoreNum}
                onChange={(e) => setSelectedCoreNum(parseInt(e.target.value) || 1)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Optical Budget & Health Summary Cards */}
      {traceResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Path Distance</span>
            <p className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {(traceResult.totalLengthMeters / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">km</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{traceResult.cablesTraversed.length} Cables Traversed</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cumulative Loss</span>
            <p className="text-xl font-bold font-mono text-amber-600 mt-1 tabular-nums">
              -{traceResult.totalLossDb.toFixed(2)} <span className="text-xs font-normal text-slate-500">dB</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Fiber + Splices + Splitters</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Calculated Rx Signal</span>
            <p className={`text-xl font-bold font-mono mt-1 tabular-nums ${
              traceResult.expectedRxPowerDbm > -25 && traceResult.expectedRxPowerDbm < -8 
                ? 'text-emerald-600' 
                : 'text-rose-600'
            }`}>
              {traceResult.expectedRxPowerDbm.toFixed(2)} <span className="text-xs font-normal text-slate-500">dBm</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {traceResult.expectedRxPowerDbm > -25 && traceResult.expectedRxPowerDbm < -8 ? 'Nominal GPON Window' : 'Warning: High Loss'}
            </p>
          </div>

          <div className={`border rounded-xl p-3.5 shadow-2xs ${
            traceResult.hasFault ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Continuity Health</span>
            <div className="flex items-center gap-1.5 mt-1">
              {traceResult.hasFault ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="text-sm font-bold text-rose-800">Fault Detected</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-bold text-emerald-800">Complete Path OK</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {traceResult.hasFault ? traceResult.faultStep?.name : 'Zero cut or high-loss points'}
            </p>
          </div>
        </div>
      )}

      {/* Visual Step-by-Step Topology Chain */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Complete End-to-End Fiber Topology Path
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold font-mono">
              {traceResult?.fullPath.length || 0} Steps
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{traceResult?.startPoint}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>{traceResult?.endPoint}</span>
          </div>
        </div>

        {/* Step Nodes List */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {traceResult?.fullPath.map((step, idx) => {
            const isLast = idx === traceResult.fullPath.length - 1;
            return (
              <div key={`${step.entityType}-${step.id}-${idx}`} className="relative group">
                {/* Step Connector Node Dot */}
                <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center text-[10px] font-bold z-10 ${
                  step.isFaultPoint 
                    ? 'border-rose-500 text-rose-600 bg-rose-50' 
                    : step.status === 'Active' 
                    ? 'border-emerald-500 text-emerald-700' 
                    : 'border-blue-500 text-blue-700'
                }`}>
                  {step.stepNumber}
                </div>

                {/* Step Card Content */}
                <div className={`p-4 rounded-xl border transition-all ${
                  step.isFaultPoint 
                    ? 'bg-rose-50/40 border-rose-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Entity Type Badge */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 tracking-wide uppercase">
                        {step.entityType.replace('_', ' ')}
                      </span>

                      {/* Core Color Swatch if applicable */}
                      {step.coreColorHex && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-xs font-semibold">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: step.coreColorHex }}
                          />
                          <span className="text-slate-800">{step.coreColor} Core #{step.coreNumber}</span>
                        </div>
                      )}

                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {step.name}
                      </h3>
                    </div>

                    {/* Step Metrics: Signal & Loss */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      {step.stepLossDb !== undefined && step.stepLossDb > 0 && (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          -{step.stepLossDb.toFixed(2)} dB
                        </span>
                      )}
                      {step.opticalPowerDbm !== undefined && (
                        <span className="text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {step.opticalPowerDbm.toFixed(2)} dBm
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-medium ${
                        step.status === 'Active' || (step.status as string) === 'Good'
                          ? 'bg-emerald-50 text-emerald-700'
                          : step.status === 'Fault' || step.status === 'Cut' || step.status === 'LOS'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {step.detail}
                  </p>

                  {step.location && (
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span className="font-semibold text-slate-500">Location:</span> {step.location}
                    </p>
                  )}

                  {step.isFaultPoint && (
                    <div className="mt-2 text-xs font-semibold text-rose-700 bg-rose-100/60 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{step.faultReason || 'Signal broken at this location'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

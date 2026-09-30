import React, { useState } from 'react';
import { 
  Smartphone, 
  Search, 
  Disc, 
  Boxes, 
  Split, 
  Users, 
  Wrench, 
  GitBranch, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  ArrowRight 
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';
import { updateCore, updateTicket, addTicket, updateCustomer } from '../../services/storage';

interface MobileTechnicianViewProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
  onExitFieldMode: () => void;
}

export const MobileTechnicianView: React.FC<MobileTechnicianViewProps> = ({
  db,
  onLaunchTrace,
  onExitFieldMode,
}) => {
  const [activeTab, setActiveTab] = useState<'CORE_CHECK' | 'SPLICE_LOOKUP' | 'FAULT_LOG' | 'POWER_CHECK'>('CORE_CHECK');

  // Core Check Tab State
  const [selectedCableId, setSelectedCableId] = useState(db.cables[0]?.id || '');
  const [coreNumInput, setCoreNumInput] = useState(4);
  const [coreStatusUpdate, setCoreStatusUpdate] = useState<'Active' | 'Spare' | 'Fault' | 'Maintenance'>('Active');
  const [corePowerUpdate, setCorePowerUpdate] = useState<string>('5.2');
  const [coreSavedNotice, setCoreSavedNotice] = useState(false);

  // Splice Lookup Tab State
  const [selectedJbId, setSelectedJbId] = useState(db.jointBoxes[0]?.id || '');

  // Quick Fault Log Tab State
  const [faultProblem, setFaultProblem] = useState<'Fiber Cut' | 'High Loss' | 'Joint Box Issue'>('Fiber Cut');
  const [faultLocation, setFaultLocation] = useState('Broad Street Pole 14');
  const [faultTechnician, setFaultTechnician] = useState('Marcus Vance');
  const [faultSignal, setFaultSignal] = useState('-30.5');
  const [faultNotes, setFaultNotes] = useState('');
  const [ticketLoggedNotice, setTicketLoggedNotice] = useState(false);

  // Customer Optical Power Tab State
  const [custSearch, setCustSearch] = useState('');
  const [selectedCustId, setSelectedCustId] = useState(db.customers[0]?.id || '');
  const [newCustPower, setNewCustPower] = useState('-18.2');
  const [custSavedNotice, setCustSavedNotice] = useState(false);

  // Current checked core
  const currentCore = db.cores.find(c => c.cableId === selectedCableId && c.coreNumber === coreNumInput);
  const currentSplice = currentCore ? db.splices.find(
    s => (s.incomingCableId === currentCore.cableId && s.incomingCoreNumber === currentCore.coreNumber) ||
         (s.outgoingCableId === currentCore.cableId && s.outgoingCoreNumber === currentCore.coreNumber)
  ) : null;

  const handleSaveCore = () => {
    if (!currentCore) return;
    updateCore(currentCore.id, {
      status: coreStatusUpdate,
      signalPowerDbm: corePowerUpdate ? parseFloat(corePowerUpdate) : undefined,
    }, 'Technician field test update');
    setCoreSavedNotice(true);
    setTimeout(() => setCoreSavedNotice(false), 2000);
  };

  const handleLogFault = () => {
    addTicket({
      ticketId: `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      dateTime: new Date().toISOString(),
      problem: faultProblem,
      priority: 'High',
      status: 'In Progress',
      location: faultLocation,
      technician: faultTechnician,
      beforeSignalDbm: faultSignal ? parseFloat(faultSignal) : undefined,
      rootCause: faultNotes,
      workPerformed: 'Emergency dispatch logged from field mobile tool',
      materialUsed: '',
      resolution: '',
      photos: [],
    }, 'Logged from mobile field view');
    setTicketLoggedNotice(true);
    setTimeout(() => setTicketLoggedNotice(false), 2000);
  };

  const handleUpdateCustPower = () => {
    updateCustomer(selectedCustId, {
      rxPowerDbm: parseFloat(newCustPower) || -18.2,
      status: parseFloat(newCustPower) < -27 ? 'LOS' : 'Active',
    }, 'Field optical power meter reading');
    setCustSavedNotice(true);
    setTimeout(() => setCustSavedNotice(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Field Mode Banner */}
      <div className="bg-amber-600 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-5 h-5" />
          <div>
            <h2 className="text-sm font-bold">Field Technician Mobile Mode</h2>
            <p className="text-[11px] text-amber-100">Optimized for handheld phone & tablet use on local LAN</p>
          </div>
        </div>
        <button
          onClick={onExitFieldMode}
          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
        >
          Exit Field Mode
        </button>
      </div>

      {/* Touch-Friendly Nav Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('CORE_CHECK')}
          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === 'CORE_CHECK'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Disc className="w-4 h-4 mx-auto mb-1" />
          <span>Core Checker</span>
        </button>

        <button
          onClick={() => setActiveTab('SPLICE_LOOKUP')}
          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === 'SPLICE_LOOKUP'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Boxes className="w-4 h-4 mx-auto mb-1" />
          <span>Splice Lookup</span>
        </button>

        <button
          onClick={() => setActiveTab('FAULT_LOG')}
          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === 'FAULT_LOG'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-4 h-4 mx-auto mb-1" />
          <span>Quick Fault Log</span>
        </button>

        <button
          onClick={() => setActiveTab('POWER_CHECK')}
          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === 'POWER_CHECK'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 mx-auto mb-1" />
          <span>ONU Power</span>
        </button>
      </div>

      {/* TAB 1: Core Checker */}
      {activeTab === 'CORE_CHECK' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Field Optical Core Identifier & Diagnostic
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Cable</label>
              <select
                value={selectedCableId}
                onChange={(e) => setSelectedCableId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
              >
                {db.cables.map(c => (
                  <option key={c.id} value={c.id}>{c.cableId} ({c.coreCount} Cores)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Enter Core Number</label>
              <input
                type="number"
                min="1"
                max="96"
                value={coreNumInput}
                onChange={(e) => setCoreNumInput(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-base font-mono font-bold text-slate-900"
              />
            </div>

            {/* Current Core Info Card */}
            {currentCore ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: currentCore.colorHex }}
                    />
                    <span className="text-sm font-bold text-slate-900">
                      {currentCore.colorName} Core #{currentCore.coreNumber}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    currentCore.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                    currentCore.status === 'Fault' || currentCore.status === 'Cut' ? 'bg-rose-50 text-rose-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {currentCore.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><span className="font-semibold text-slate-700">Trajectory:</span> {currentCore.startPoint} ➔ {currentCore.endPoint}</p>
                  {currentSplice ? (
                    <p className="text-blue-700 font-semibold font-mono">
                      ➔ Spliced in {currentSplice.jointBoxId} (Tray #{currentSplice.trayNumber}) to {currentSplice.outgoingCableId} Core #{currentSplice.outgoingCoreNumber} ({currentSplice.outgoingCoreColor})
                    </p>
                  ) : (
                    <p className="text-slate-400">Spare / Dark Fiber</p>
                  )}
                </div>

                {/* Quick Edit In The Field */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Update Status</label>
                    <select
                      value={coreStatusUpdate}
                      onChange={(e) => setCoreStatusUpdate(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                    >
                      <option value="Active">Active</option>
                      <option value="Spare">Spare</option>
                      <option value="Fault">Fault / Cut</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Measured Power (dBm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={corePowerUpdate}
                      onChange={(e) => setCorePowerUpdate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                      placeholder="-18.2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveCore}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Field Measurement</span>
                  </button>

                  <button
                    onClick={() => onLaunchTrace('CORE', currentCore.id)}
                    className="px-3 py-2.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1 border border-blue-200"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Trace</span>
                  </button>
                </div>

                {coreSavedNotice && (
                  <p className="text-xs text-emerald-600 font-semibold text-center flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Core status saved to database!</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Core number not found in selected cable</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Splice Lookup */}
      {activeTab === 'SPLICE_LOOKUP' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Joint Box Splice Lookup in the Field
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Closure / Enclosure</label>
            <select
              value={selectedJbId}
              onChange={(e) => setSelectedJbId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
            >
              {db.jointBoxes.map(j => (
                <option key={j.id} value={j.id}>{j.name} ({j.jointBoxId})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {db.splices.filter(s => s.jointBoxId === selectedJbId).map(splice => (
              <div key={splice.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono">Tray #{splice.trayNumber} · {splice.spliceType}</span>
                  <span className="font-mono text-emerald-700 font-semibold">{splice.spliceLossDb} dB</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-blue-700 font-semibold">
                    {splice.incomingCableId} C#{splice.incomingCoreNumber} ({splice.incomingCoreColor})
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-emerald-700 font-semibold">
                    {splice.outgoingCableId} C#{splice.outgoingCoreNumber} ({splice.outgoingCoreColor})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Quick Fault Log */}
      {activeTab === 'FAULT_LOG' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Report Cable Damage / Fiber Break On-Site
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Problem Category</label>
              <select
                value={faultProblem}
                onChange={(e) => setFaultProblem(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              >
                <option value="Fiber Cut">Fiber Cut (Physical Sever)</option>
                <option value="High Loss">High Attenuation / Bend</option>
                <option value="Joint Box Issue">Closure Flooded / Damaged</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Field Location</label>
              <input
                type="text"
                value={faultLocation}
                onChange={(e) => setFaultLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Measured Optical Power (dBm)</label>
              <input
                type="text"
                value={faultSignal}
                onChange={(e) => setFaultSignal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                placeholder="-99.0 for LOS"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Field Notes / OTDR Marker</label>
              <textarea
                rows={2}
                value={faultNotes}
                onChange={(e) => setFaultNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                placeholder="e.g. Cut detected at 1.4km from Central POP..."
              />
            </div>

            <button
              onClick={handleLogFault}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer shadow-xs text-xs"
            >
              Log Emergency Incident
            </button>

            {ticketLoggedNotice && (
              <p className="text-xs text-emerald-600 font-semibold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ticket registered and dispatched!</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Customer ONU Power Meter */}
      {activeTab === 'POWER_CHECK' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Subscriber Optical Power (dBm) Verification
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Select Customer</label>
              <select
                value={selectedCustId}
                onChange={(e) => {
                  setSelectedCustId(e.target.value);
                  const cust = db.customers.find(c => c.id === e.target.value);
                  if (cust) setNewCustPower(cust.rxPowerDbm.toString());
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
              >
                {db.customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.customerId}) - {c.address}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Optical Power Meter Reading (dBm)</label>
              <input
                type="number"
                step="0.1"
                value={newCustPower}
                onChange={(e) => setNewCustPower(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-base font-mono font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Acceptable GPON window: -8.0 dBm to -25.0 dBm</p>
            </div>

            <button
              onClick={handleUpdateCustPower}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs text-xs flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Subscriber Signal in Database</span>
            </button>

            {custSavedNotice && (
              <p className="text-xs text-emerald-600 font-semibold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Customer optical reading updated!</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  GitBranch, 
  ArrowRight, 
  MapPin, 
  Layers, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Sparkles,
  FileCode
} from 'lucide-react';
import { OptiFiberDatabase, JointBox, SpliceConnection } from '../../types';
import { 
  addJointBox, 
  updateJointBox, 
  deleteJointBox, 
  addSplice, 
  updateSplice, 
  deleteSplice, 
  checkSpliceConflict 
} from '../../services/storage';
import { ConflictDialog } from '../common/ConflictDialog';

interface JointBoxManagementProps {
  db: OptiFiberDatabase;
  selectedJbId?: string;
  onLaunchTrace: (type: any, id: string) => void;
  onOpenSchematic?: (jbId: string) => void;
}

export const JointBoxManagement: React.FC<JointBoxManagementProps> = ({
  db,
  selectedJbId,
  onLaunchTrace,
  onOpenSchematic,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals
  const [activeJb, setActiveJb] = useState<JointBox | null>(
    selectedJbId ? db.jointBoxes.find(j => j.id === selectedJbId) || null : (db.jointBoxes[0] || null)
  );
  const [isAddJbModalOpen, setIsAddJbModalOpen] = useState(false);
  const [editingJb, setEditingJb] = useState<JointBox | null>(null);
  const [jbFormData, setJbFormData] = useState<Partial<JointBox>>({});

  // Splice Wizard Modal
  const [isSpliceWizardOpen, setIsSpliceWizardOpen] = useState(false);
  const [editingSplice, setEditingSplice] = useState<SpliceConnection | null>(null);
  const [spliceForm, setSpliceForm] = useState<{
    trayNumber: number;
    incomingCableId: string;
    incomingCoreNumber: number;
    outgoingCableId: string;
    outgoingCoreNumber: number;
    spliceType: SpliceConnection['spliceType'];
    spliceLossDb: number;
    status: SpliceConnection['status'];
    technician: string;
    notes: string;
  }>({
    trayNumber: 1,
    incomingCableId: db.cables[0]?.id || '',
    incomingCoreNumber: 1,
    outgoingCableId: db.cables[1]?.id || '',
    outgoingCoreNumber: 1,
    spliceType: 'Fusion',
    spliceLossDb: 0.03,
    status: 'Active',
    technician: 'Marcus Vance',
    notes: '',
  });

  // Conflict state
  const [conflictResult, setConflictResult] = useState<any>(null);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  const filteredJbs = db.jointBoxes.filter(jb => {
    const matchSearch = 
      jb.name.toLowerCase().includes(search.toLowerCase()) ||
      jb.jointBoxId.toLowerCase().includes(search.toLowerCase()) ||
      jb.location.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || jb.type === typeFilter;
    return matchSearch && matchType;
  });

  const jbSplices = activeJb ? db.splices.filter(s => s.jointBoxId === activeJb.id) : [];

  const handleOpenAddJb = () => {
    setJbFormData({
      name: '',
      jointBoxId: `JB-${(db.jointBoxes.length + 1).toString().padStart(3, '0')}`,
      type: 'Dome',
      trayCount: 4,
      maxSpliceCapacity: 48,
      location: 'Main Street & Elm Vault',
      area: 'Downtown Metro',
      zone: 'Zone North-A',
      latitude: 37.7845,
      longitude: -122.4080,
      installationDate: new Date().toISOString().split('T')[0],
      technician: 'Marcus Vance',
      supplierId: db.suppliers[0]?.id || '',
      maintenanceStatus: 'Good',
      incomingCableIds: [db.cables[0]?.id || ''],
      outgoingCableIds: [db.cables[1]?.id || ''],
      notes: '',
      photos: [],
    });
    setIsAddJbModalOpen(true);
  };

  const handleSaveAddJb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jbFormData.name || !jbFormData.jointBoxId) return;
    const newJb = addJointBox(jbFormData as Omit<JointBox, 'id'>, 'Added new splice closure');
    setActiveJb(newJb);
    setIsAddJbModalOpen(false);
  };

  const handleSaveEditJb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJb) return;
    const updated = updateJointBox(editingJb.id, jbFormData, 'Updated joint box specifications');
    if (updated) setActiveJb(updated);
    setEditingJb(null);
  };

  const handleDeleteJb = (id: string) => {
    deleteJointBox(id, 'Removed joint box closure');
    if (activeJb?.id === id) {
      setActiveJb(db.jointBoxes[0] || null);
    }
  };

  // Splice operations
  const handleOpenSpliceWizard = () => {
    setEditingSplice(null);
    setSpliceForm({
      trayNumber: 1,
      incomingCableId: activeJb?.incomingCableIds[0] || db.cables[0]?.id || '',
      incomingCoreNumber: 1,
      outgoingCableId: activeJb?.outgoingCableIds[0] || db.cables[1]?.id || '',
      outgoingCoreNumber: 1,
      spliceType: 'Fusion',
      spliceLossDb: 0.03,
      status: 'Active',
      technician: activeJb?.technician || 'Marcus Vance',
      notes: '',
    });
    setIsSpliceWizardOpen(true);
  };

  const handleSaveSplice = (force = false) => {
    if (!activeJb) return;

    // Check conflict
    if (!force) {
      const conflict = checkSpliceConflict(
        db,
        spliceForm.incomingCableId,
        spliceForm.incomingCoreNumber,
        spliceForm.outgoingCableId,
        spliceForm.outgoingCoreNumber,
        editingSplice?.id
      );

      if (conflict.hasConflict) {
        setConflictResult(conflict);
        setIsConflictDialogOpen(true);
        return;
      }
    }

    const inCore = db.cores.find(c => c.cableId === spliceForm.incomingCableId && c.coreNumber === spliceForm.incomingCoreNumber);
    const outCore = db.cores.find(c => c.cableId === spliceForm.outgoingCableId && c.coreNumber === spliceForm.outgoingCoreNumber);

    if (editingSplice) {
      updateSplice(editingSplice.id, {
        ...spliceForm,
        incomingCoreColor: inCore?.colorName || 'Blue',
        outgoingCoreColor: outCore?.colorName || 'Orange',
      }, 'Updated splice connection');
    } else {
      addSplice({
        jointBoxId: activeJb.id,
        ...spliceForm,
        incomingCoreColor: inCore?.colorName || 'Blue',
        outgoingCoreColor: outCore?.colorName || 'Orange',
        splicedDate: new Date().toISOString().split('T')[0],
      }, 'Added new core-to-core splice');
    }

    setIsSpliceWizardOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>Joint Box Enclosures & Core-to-Core Splicing</span>
          </h1>
          <p className="text-xs text-slate-500">
            Document splice trays, fusion splices, color conversions, pass-through fibers, and branch closures
          </p>
        </div>

        <button
          onClick={handleOpenAddJb}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Joint Box</span>
        </button>
      </div>

      {/* Main Grid: Left Column JB Selector, Right Column Splice Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Closures Selector & List */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Closures ({filteredJbs.length})</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-600 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="Dome">Dome</option>
                <option value="Pole Mount">Pole Mount</option>
                <option value="Cabinet">Cabinet</option>
                <option value="Inline">Inline</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search closure..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredJbs.map(jb => {
                const count = db.splices.filter(s => s.jointBoxId === jb.id).length;
                const isSelected = activeJb?.id === jb.id;
                return (
                  <div
                    key={jb.id}
                    onClick={() => setActiveJb(jb)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">{jb.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {jb.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{jb.location}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100">
                      <span>{count} / {jb.maxSpliceCapacity} Splices</span>
                      <span className={jb.maintenanceStatus === 'Good' ? 'text-emerald-700' : 'text-amber-700'}>
                        {jb.maintenanceStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Splice Matrix for Selected Joint Box */}
        <div className="lg:col-span-2 space-y-6">
          {activeJb ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
              {/* Active JB Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{activeJb.name}</span>
                    <span className="text-xs font-mono text-slate-500 font-semibold">({activeJb.jointBoxId})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                      {activeJb.maintenanceStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeJb.location} ({activeJb.area}, {activeJb.zone})</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingJb(activeJb);
                      setJbFormData({ ...activeJb });
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Edit Joint Box Specs"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {onOpenSchematic && (
                    <button
                      onClick={() => onOpenSchematic(activeJb.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer transition-colors shadow-xs"
                      title="Open visual splice schematic diagram"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>View Schematic</span>
                    </button>
                  )}
                  <button
                    onClick={handleOpenSpliceWizard}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Splice Cores</span>
                  </button>
                </div>
              </div>

              {/* Cable Ingress / Egress Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Incoming Feeder Cables</span>
                  <div className="mt-1 font-mono font-semibold text-slate-800">
                    {activeJb.incomingCableIds.map(cid => {
                      const c = db.cables.find(cable => cable.id === cid);
                      return c ? `${c.cableId} (${c.coreCount}C)` : cid;
                    }).join(', ') || 'Direct Loop'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Outgoing Distribution Cables</span>
                  <div className="mt-1 font-mono font-semibold text-slate-800">
                    {activeJb.outgoingCableIds.map(cid => {
                      const c = db.cables.find(cable => cable.id === cid);
                      return c ? `${c.cableId} (${c.coreCount}C)` : cid;
                    }).join(', ') || 'Drop Cluster'}
                  </div>
                </div>
              </div>

              {/* VISUAL SPLICE TABLE (Prompt Requirement 6) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Visual Core Splice Matrix ({jbSplices.length} Splices)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Capacity: {jbSplices.length} / {activeJb.maxSpliceCapacity}
                  </span>
                </div>

                {jbSplices.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">No core splices recorded in this closure yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Splice Cores" above to fusion-splice incoming and outgoing fibers.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Tray</th>
                          <th className="py-2.5 px-3">Incoming Cable & Core</th>
                          <th className="py-2.5 px-3 text-center">Splice</th>
                          <th className="py-2.5 px-3">Outgoing Cable & Core</th>
                          <th className="py-2.5 px-3">Loss</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {jbSplices.map((splice) => {
                          const inCable = db.cables.find(c => c.id === splice.incomingCableId);
                          const outCable = db.cables.find(c => c.id === splice.outgoingCableId);
                          const inCore = db.cores.find(c => c.cableId === splice.incomingCableId && c.coreNumber === splice.incomingCoreNumber);
                          const outCore = db.cores.find(c => c.cableId === splice.outgoingCableId && c.coreNumber === splice.outgoingCoreNumber);

                          return (
                            <tr key={splice.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-slate-500">
                                T{splice.trayNumber}
                              </td>

                              {/* Incoming Cable & Core with Color Chip */}
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900 font-mono text-[11px]">
                                  {inCable?.cableId || splice.incomingCableId}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                                    style={{ backgroundColor: inCore?.colorHex || '#2563EB' }}
                                  />
                                  <span className="text-[11px] font-medium text-slate-700">
                                    C#{splice.incomingCoreNumber} ({splice.incomingCoreColor})
                                  </span>
                                </div>
                              </td>

                              {/* Splice Type Arrow Indicator */}
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                  <span>➔</span>
                                  <span>{splice.spliceType}</span>
                                </span>
                              </td>

                              {/* Outgoing Cable & Core with Color Chip */}
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900 font-mono text-[11px]">
                                  {outCable?.cableId || splice.outgoingCableId}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                                    style={{ backgroundColor: outCore?.colorHex || '#EA580C' }}
                                  />
                                  <span className="text-[11px] font-medium text-slate-700">
                                    C#{splice.outgoingCoreNumber} ({splice.outgoingCoreColor})
                                  </span>
                                </div>
                              </td>

                              {/* Loss dB */}
                              <td className="py-2.5 px-3 font-mono text-slate-800">
                                {splice.spliceLossDb} dB
                              </td>

                              {/* Status */}
                              <td className="py-2.5 px-3">
                                <span className={`inline-flex items-center px-2 py-0.2 text-[10px] rounded-full font-medium ${
                                  splice.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {splice.status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => onLaunchTrace('SPLICE', splice.id)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                    title="Trace Spliced Fiber Path"
                                  >
                                    <GitBranch className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingSplice(splice);
                                      setSpliceForm({
                                        trayNumber: splice.trayNumber,
                                        incomingCableId: splice.incomingCableId,
                                        incomingCoreNumber: splice.incomingCoreNumber,
                                        outgoingCableId: splice.outgoingCableId,
                                        outgoingCoreNumber: splice.outgoingCoreNumber,
                                        spliceType: splice.spliceType,
                                        spliceLossDb: splice.spliceLossDb,
                                        status: splice.status,
                                        technician: splice.technician,
                                        notes: splice.notes,
                                      });
                                      setIsSpliceWizardOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                                    title="Edit Splice"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteSplice(splice.id, 'Cut splice')}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                    title="Cut / Delete Splice"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Boxes className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No joint box selected</p>
              <p className="text-xs text-slate-400 mt-1">Select a closure on the left to inspect and configure core splices.</p>
            </div>
          )}
        </div>
      </div>

      {/* Splice Wizard Modal */}
      {isSpliceWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSplice ? 'Modify Core Splice' : 'Core-to-Core Fusion Splicing Wizard'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSpliceWizardOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Incoming Core Selection */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                    Incoming Feeder Side
                  </span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Incoming Cable</label>
                    <select
                      value={spliceForm.incomingCableId}
                      onChange={(e) => setSpliceForm({ ...spliceForm, incomingCableId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-slate-800"
                    >
                      {db.cables.map(c => (
                        <option key={c.id} value={c.id}>{c.cableId} ({c.coreCount}C)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Core Number</label>
                    <input
                      type="number"
                      min="1"
                      max="96"
                      value={spliceForm.incomingCoreNumber}
                      onChange={(e) => setSpliceForm({ ...spliceForm, incomingCoreNumber: parseInt(e.target.value) || 1 })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Outgoing Core Selection */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Outgoing Distribution Side
                  </span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Outgoing Cable</label>
                    <select
                      value={spliceForm.outgoingCableId}
                      onChange={(e) => setSpliceForm({ ...spliceForm, outgoingCableId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-slate-800"
                    >
                      {db.cables.map(c => (
                        <option key={c.id} value={c.id}>{c.cableId} ({c.coreCount}C)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Core Number</label>
                    <input
                      type="number"
                      min="1"
                      max="96"
                      value={spliceForm.outgoingCoreNumber}
                      onChange={(e) => setSpliceForm({ ...spliceForm, outgoingCoreNumber: parseInt(e.target.value) || 1 })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Splice Parameters */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Splice Tray #</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={spliceForm.trayNumber}
                    onChange={(e) => setSpliceForm({ ...spliceForm, trayNumber: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Splice Type</label>
                  <select
                    value={spliceForm.spliceType}
                    onChange={(e) => setSpliceForm({ ...spliceForm, spliceType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  >
                    <option value="Fusion">Arc Fusion</option>
                    <option value="Mechanical">Mechanical Splice</option>
                    <option value="Patch">Patch Interconnect</option>
                    <option value="Loop">Loop / Ring</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Splice Loss (dB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={spliceForm.spliceLossDb}
                    onChange={(e) => setSpliceForm({ ...spliceForm, spliceLossDb: parseFloat(e.target.value) || 0.03 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Field Technician</label>
                <input
                  type="text"
                  value={spliceForm.technician}
                  onChange={(e) => setSpliceForm({ ...spliceForm, technician: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Splice Notes</label>
                <textarea
                  rows={2}
                  value={spliceForm.notes}
                  onChange={(e) => setSpliceForm({ ...spliceForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  placeholder="e.g. Splicer arc count 450, Sumitomo 72C, cleave angle 0.4°"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSpliceWizardOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveSplice(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs"
              >
                Save Splice Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Dialog */}
      {isConflictDialogOpen && conflictResult && (
        <ConflictDialog
          isOpen={isConflictDialogOpen}
          onClose={() => setIsConflictDialogOpen(false)}
          onConfirm={() => {
            setIsConflictDialogOpen(false);
            handleSaveSplice(true);
          }}
          conflict={conflictResult}
          title="Splice Overlap Warning"
          confirmLabel="Overwrite & Save Splice"
        />
      )}
    </div>
  );
};

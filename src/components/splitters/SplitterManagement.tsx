import React, { useState } from 'react';
import { 
  Split, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  GitBranch, 
  Users, 
  Layers, 
  X, 
  AlertTriangle, 
  CheckCircle2,
  SlidersHorizontal,
  MapPin
} from 'lucide-react';
import { OptiFiberDatabase, OpticalSplitter, SplitRatio } from '../../types';
import { 
  addSplitter, 
  updateSplitter, 
  deleteSplitter, 
  calculateSplitterExpectedLoss 
} from '../../services/storage';

interface SplitterManagementProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
  onNavigateToCustomer: (custId: string) => void;
}

export const SplitterManagement: React.FC<SplitterManagementProps> = ({
  db,
  onLaunchTrace,
  onNavigateToCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [ratioFilter, setRatioFilter] = useState('ALL');

  // Modals
  const [activeSplitter, setActiveSplitter] = useState<OpticalSplitter | null>(db.splitters[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSplitter, setEditingSplitter] = useState<OpticalSplitter | null>(null);
  const [formData, setFormData] = useState<Partial<OpticalSplitter>>({});

  const filteredSplitters = db.splitters.filter(s => {
    const matchSearch = 
      s.splitterId.toLowerCase().includes(search.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      s.location.toLowerCase().includes(search.toLowerCase());
    const matchRatio = ratioFilter === 'ALL' || s.splitRatio === ratioFilter;
    return matchSearch && matchRatio;
  });

  const handleOpenAdd = () => {
    const defaultRatio: SplitRatio = '1:8';
    const loss = calculateSplitterExpectedLoss(defaultRatio);
    setFormData({
      splitterId: `SPL-${(db.splitters.length + 1).toString().padStart(2, '0')}-A`,
      name: 'New FTTH Splitter',
      jointBoxId: db.jointBoxes[0]?.id || '',
      popId: db.pops[0]?.id || '',
      location: 'Pedestal Ped-101',
      type: 'PLC',
      splitRatio: defaultRatio,
      expectedLossDb: loss,
      actualLossDb: loss + 0.2,
      inputCableId: db.cables[0]?.id || '',
      inputCoreNumber: 1,
      inputSourceLabel: 'Feeder Core #1',
      inputSignalDbm: 3.5,
      status: 'Active',
      ports: Array.from({ length: 8 }, (_, i) => ({
        portNumber: i + 1,
        status: 'Spare',
        outputSignalDbm: +(3.5 - loss).toFixed(2),
        notes: `Port ${i + 1}`,
      })),
      notes: '',
      photos: [],
    });
    setIsAddModalOpen(true);
  };

  const handleRatioChange = (ratio: SplitRatio) => {
    const loss = calculateSplitterExpectedLoss(ratio);
    let portCount = 8;
    if (ratio === '1:2') portCount = 2;
    else if (ratio === '1:4') portCount = 4;
    else if (ratio === '1:8') portCount = 8;
    else if (ratio === '1:16') portCount = 16;
    else if (ratio === '1:32') portCount = 32;
    else if (ratio === '1:64') portCount = 64;

    const inSig = formData.inputSignalDbm || 3.5;
    const outSig = +(inSig - loss).toFixed(2);

    setFormData({
      ...formData,
      splitRatio: ratio,
      expectedLossDb: loss,
      actualLossDb: loss + 0.2,
      ports: Array.from({ length: portCount }, (_, i) => ({
        portNumber: i + 1,
        status: 'Spare',
        outputSignalDbm: outSig,
        notes: `Port ${i + 1}`,
      })),
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.splitterId) return;
    const newSpl = addSplitter(formData as Omit<OpticalSplitter, 'id'>, 'Added new optical splitter');
    setActiveSplitter(newSpl);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSplitter) return;
    const updated = updateSplitter(editingSplitter.id, formData, 'Updated splitter configurations');
    if (updated) setActiveSplitter(updated);
    setEditingSplitter(null);
  };

  const handleDelete = (id: string) => {
    deleteSplitter(id, 'Removed optical splitter');
    if (activeSplitter?.id === id) {
      setActiveSplitter(db.splitters[0] || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Split className="w-5 h-5 text-blue-600" />
            <span>Optical Splitter Management (PLC / FBT)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Split ratios (1:2 to 1:64, 20/80, 85/15), auto-calculated insertion losses, port allocations and customer drops
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Splitter</span>
        </button>
      </div>

      {/* Main Grid: Left Column Splitters List, Right Column Port Allocation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Splitters List */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Splitters ({filteredSplitters.length})</span>
              <select
                value={ratioFilter}
                onChange={(e) => setRatioFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-600 cursor-pointer"
              >
                <option value="ALL">All Ratios</option>
                <option value="1:2">1:2</option>
                <option value="1:4">1:4</option>
                <option value="1:8">1:8</option>
                <option value="1:16">1:16</option>
                <option value="1:32">1:32</option>
                <option value="20/80">20/80</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search splitter ID, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredSplitters.map(spl => {
                const connectedCustCount = spl.ports.filter(p => p.connectedCustomerId).length;
                const isSelected = activeSplitter?.id === spl.id;
                return (
                  <div
                    key={spl.id}
                    onClick={() => setActiveSplitter(spl)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {spl.name || spl.splitterId}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {spl.splitRatio}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{spl.location}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100">
                      <span>{connectedCustCount} / {spl.ports.length} Ports Used</span>
                      <span className="text-amber-700">-{spl.expectedLossDb} dB</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Splitter & Port Matrix */}
        <div className="lg:col-span-2 space-y-6">
          {activeSplitter ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{activeSplitter.name || activeSplitter.splitterId}</span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {activeSplitter.splitRatio} ({activeSplitter.type})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                      {activeSplitter.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeSplitter.location}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLaunchTrace('SPLITTER', activeSplitter.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Trace Splitter</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingSplitter(activeSplitter);
                      setFormData({ ...activeSplitter });
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Edit Splitter Specs"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(activeSplitter.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Delete Splitter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Optical Input / Loss Budget Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Optical Input Feed</span>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono truncate">{activeSplitter.inputSourceLabel}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Input Power</span>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono">+{activeSplitter.inputSignalDbm} dBm</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Theoretical Loss</span>
                  <p className="font-bold text-amber-700 mt-0.5 font-mono">-{activeSplitter.expectedLossDb} dB</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Port Output Power</span>
                  <p className="font-bold text-emerald-700 mt-0.5 font-mono">
                    {(activeSplitter.inputSignalDbm - activeSplitter.actualLossDb).toFixed(2)} dBm
                  </p>
                </div>
              </div>

              {/* Port-by-Port Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Splitter Output Ports ({activeSplitter.ports.length})
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Allocated: {activeSplitter.ports.filter(p => p.connectedCustomerId).length} / {activeSplitter.ports.length}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Port #</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Output Signal</th>
                        <th className="py-2.5 px-3">Connected Subscriber</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeSplitter.ports.map((port) => {
                        const cust = db.customers.find(c => c.id === port.connectedCustomerId);
                        return (
                          <tr key={port.portNumber} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              Port #{port.portNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-medium ${
                                port.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                port.status === 'Reserved' ? 'bg-blue-50 text-blue-700' :
                                port.status === 'Faulty' ? 'bg-rose-50 text-rose-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {port.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {port.outputSignalDbm} dBm
                            </td>
                            <td className="py-2.5 px-3">
                              {cust ? (
                                <button
                                  onClick={() => onNavigateToCustomer(cust.id)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{cust.name} ({cust.customerId})</span>
                                </button>
                              ) : (
                                <span className="text-slate-400">Available / Unallocated</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 truncate max-w-[150px]">
                              {port.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Split className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No splitter selected</p>
              <p className="text-xs text-slate-400 mt-1">Select an optical splitter from the list to view port assignments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Splitter Modal */}
      {(isAddModalOpen || editingSplitter) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAddModalOpen ? 'Deploy Optical Splitter' : `Edit Splitter ${editingSplitter?.splitterId}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSplitter(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Splitter ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.splitterId || ''}
                      onChange={(e) => setFormData({ ...formData, splitterId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Split Ratio</label>
                    <select
                      value={formData.splitRatio || '1:8'}
                      onChange={(e) => handleRatioChange(e.target.value as SplitRatio)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                    >
                      <option value="1:2">1:2 (Loss ~3.5 dB)</option>
                      <option value="1:4">1:4 (Loss ~7.2 dB)</option>
                      <option value="1:8">1:8 (Loss ~10.5 dB)</option>
                      <option value="1:16">1:16 (Loss ~13.8 dB)</option>
                      <option value="1:32">1:32 (Loss ~17.0 dB)</option>
                      <option value="1:64">1:64 (Loss ~20.5 dB)</option>
                      <option value="20/80">20/80 FBT Asymmetric</option>
                      <option value="85/15">85/15 FBT Asymmetric</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Theoretical Loss (dB)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.expectedLossDb || 10.5}
                      onChange={(e) => setFormData({ ...formData, expectedLossDb: parseFloat(e.target.value) || 10.5 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Measured Loss (dB)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.actualLossDb || 10.7}
                      onChange={(e) => setFormData({ ...formData, actualLossDb: parseFloat(e.target.value) || 10.7 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Input Cable Feed</label>
                    <select
                      value={formData.inputCableId || ''}
                      onChange={(e) => setFormData({ ...formData, inputCableId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                    >
                      {db.cables.map(c => (
                        <option key={c.id} value={c.id}>{c.cableId} ({c.coreCount} Cores)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Input Core #</label>
                    <input
                      type="number"
                      min="1"
                      max="96"
                      value={formData.inputCoreNumber || 1}
                      onChange={(e) => setFormData({ ...formData, inputCoreNumber: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / Cabinet</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="Pedestal Ped-102, Cedar Hills"
                  />
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSplitter(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Save Splitter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

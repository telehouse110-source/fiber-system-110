import React, { useState } from 'react';
import { 
  Disc, 
  Search, 
  Filter, 
  GitBranch, 
  Edit2, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  X,
  Palette,
  ArrowRight
} from 'lucide-react';
import { OptiFiberDatabase, FiberCore, CoreStatus } from '../../types';
import { updateCore } from '../../services/storage';

interface CoreManagementProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
}

export const CoreManagement: React.FC<CoreManagementProps> = ({
  db,
  onLaunchTrace,
}) => {
  const [selectedCableId, setSelectedCableId] = useState<string>(db.cables[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Edit core modal
  const [editingCore, setEditingCore] = useState<FiberCore | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<FiberCore>>({});

  const selectedCable = db.cables.find(c => c.id === selectedCableId);
  const selectedRoute = selectedCable ? db.routes.find(r => r.id === selectedCable.routeId) : null;

  const cableCores = db.cores.filter(c => c.cableId === selectedCableId);

  const filteredCores = cableCores.filter(c => {
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchSearch = 
      c.coreNumber.toString().includes(search) ||
      c.colorName.toLowerCase().includes(search.toLowerCase()) ||
      (c.notes || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.connectedToLabel || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeCount = cableCores.filter(c => c.status === 'Active' || c.status === 'Used').length;
  const spareCount = cableCores.filter(c => c.status === 'Spare').length;
  const faultCount = cableCores.filter(c => c.status === 'Fault' || c.status === 'Cut' || c.status === 'LOS').length;
  const maintenanceCount = cableCores.filter(c => c.status === 'Maintenance').length;

  const handleOpenEdit = (core: FiberCore) => {
    setEditingCore(core);
    setEditFormData({ ...core });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCore) return;
    updateCore(editingCore.id, editFormData, `Core #${editingCore.coreNumber} parameters updated`);
    setEditingCore(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Disc className="w-5 h-5 text-blue-600" />
            <span>Fiber Core-Level Management & Color Coding</span>
          </h1>
          <p className="text-xs text-slate-500">
            Full individual core matrix, status assignments, optical attenuation, and complete end-to-end splice chains
          </p>
        </div>

        {/* Cable Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Selected Cable:</label>
          <select
            value={selectedCableId}
            onChange={(e) => setSelectedCableId(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-900 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
          >
            {db.cables.map(c => {
              const r = db.routes.find(route => route.id === c.routeId);
              return (
                <option key={c.id} value={c.id}>
                  {c.cableId} ({c.coreCount} Cores) - {r?.routeName || 'Unassigned'}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Selected Cable Overview Card */}
      {selectedCable && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{selectedCable.cableId}</span>
                <span className="text-xs text-slate-500">({selectedCable.brand} - {selectedCable.cableType})</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {selectedCable.coreCount} Cores
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Route: <span className="font-semibold text-slate-700">{selectedRoute?.routeName || 'N/A'}</span> · Length: <span className="font-mono text-slate-700 font-semibold">{selectedCable.installedLengthMeters}m</span> ({selectedCable.startLocation} ➔ {selectedCable.endLocation})
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                {activeCount} Active
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {spareCount} Spare
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-semibold border ${
                faultCount > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {faultCount} Fault/Cut
              </span>
            </div>
          </div>

          {/* Color Legend (TIA-598 Standard) */}
          <div className="pt-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              TIA-598 12-Color Optical Sequence
            </span>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {db.colors.map(col => (
                <div
                  key={col.id}
                  className="flex items-center gap-1.5 p-1 rounded-md border border-slate-200 bg-slate-50 text-[10px]"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span className="truncate text-slate-700 font-medium">{col.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search core number, color, splice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">All Core Statuses</option>
            <option value="Active">Active</option>
            <option value="Spare">Spare</option>
            <option value="Fault">Fault / Cut</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visual Matrix Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Table
          </button>
        </div>
      </div>

      {/* VIEW 1: Visual Matrix Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredCores.map((core) => {
            const isFault = core.status === 'Fault' || core.status === 'Cut' || core.status === 'LOS';
            const isActive = core.status === 'Active' || core.status === 'Used';

            // Find splice connection for this core
            const splice = db.splices.find(
              s => (s.incomingCableId === core.cableId && s.incomingCoreNumber === core.coreNumber) ||
                   (s.outgoingCableId === core.cableId && s.outgoingCoreNumber === core.coreNumber)
            );

            return (
              <div
                key={core.id}
                className={`bg-white border rounded-xl p-3.5 transition-all shadow-2xs hover:shadow-xs group ${
                  isFault 
                    ? 'border-rose-300 bg-rose-50/20' 
                    : isActive 
                    ? 'border-emerald-200' 
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Core Number & Color Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: core.colorHex }}
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Core #{core.coreNumber} ({core.colorName})
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : isFault
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {core.status}
                  </span>
                </div>

                {/* Signal / Attenuation */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono py-1 border-t border-b border-slate-100 my-1.5">
                  <span>Power: <strong className="text-slate-800">{core.signalPowerDbm ? `${core.signalPowerDbm} dBm` : 'Untested'}</strong></span>
                  <span>Loss: <strong className="text-slate-800">{core.attenuationLossDb || 0.35} dB/km</strong></span>
                </div>

                {/* Splicing & Relationship chain */}
                <div className="text-[11px] text-slate-600 min-h-[36px] line-clamp-2 mt-1">
                  {splice ? (
                    <div className="text-blue-700 font-medium flex items-center gap-1">
                      <GitBranch className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        Spliced in {splice.jointBoxId} (➔ {splice.outgoingCableId} C#{splice.outgoingCoreNumber})
                      </span>
                    </div>
                  ) : core.connectedToLabel ? (
                    <div className="text-emerald-700 truncate font-medium">
                      ➔ {core.connectedToLabel}
                    </div>
                  ) : (
                    <span className="text-slate-400">Spare / Dark fiber termination</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => onLaunchTrace('CORE', core.id)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <GitBranch className="w-3 h-3" />
                    <span>Trace Path</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(core)}
                    className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Data Table */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Core #</th>
                  <th className="py-3 px-4">Color</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Signal Power</th>
                  <th className="py-3 px-4">Attenuation</th>
                  <th className="py-3 px-4">Connection / Relationship</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredCores.map((core) => {
                  const splice = db.splices.find(
                    s => (s.incomingCableId === core.cableId && s.incomingCoreNumber === core.coreNumber) ||
                         (s.outgoingCableId === core.cableId && s.outgoingCoreNumber === core.coreNumber)
                  );
                  return (
                    <tr key={core.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        Core #{core.coreNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: core.colorHex }}
                          />
                          <span className="font-semibold text-slate-800">{core.colorName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          core.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                          core.status === 'Fault' || core.status === 'Cut' ? 'bg-rose-50 text-rose-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {core.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {core.signalPowerDbm ? `${core.signalPowerDbm} dBm` : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {core.attenuationLossDb || 0.35} dB/km
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-700">
                        {splice ? (
                          <span className="text-blue-600">
                            Splice in {splice.jointBoxId} (➔ {splice.outgoingCableId} C#{splice.outgoingCoreNumber})
                          </span>
                        ) : core.connectedToLabel ? (
                          <span className="text-emerald-700">{core.connectedToLabel}</span>
                        ) : (
                          <span className="text-slate-400">Spare</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[150px]">
                        {core.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onLaunchTrace('CORE', core.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                            title="Trace Core Path"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(core)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                            title="Edit Core"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Core Modal */}
      {editingCore && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSaveEdit}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: editingCore.colorHex }}
                  />
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Core #{editingCore.coreNumber} ({editingCore.colorName})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCore(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational Status</label>
                  <select
                    value={editFormData.status || 'Spare'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as CoreStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                  >
                    <option value="Active">Active / Live Transmission</option>
                    <option value="Spare">Spare / Dark Fiber</option>
                    <option value="Used">Used / Allocated</option>
                    <option value="Fault">Fault / High Attenuation</option>
                    <option value="Cut">Cut / Physical Break</option>
                    <option value="LOS">LOS (Loss of Signal)</option>
                    <option value="Maintenance">Under Maintenance</option>
                    <option value="Reserved">Reserved</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Optical Signal (dBm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.signalPowerDbm ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, signalPowerDbm: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                      placeholder="e.g. -18.2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Loss Rate (dB/km)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.attenuationLossDb || 0.35}
                      onChange={(e) => setEditFormData({ ...editFormData, attenuationLossDb: parseFloat(e.target.value) || 0.35 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Point</label>
                    <input
                      type="text"
                      value={editFormData.startPoint || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, startPoint: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Point</label>
                    <input
                      type="text"
                      value={editFormData.endPoint || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, endPoint: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Connection Label</label>
                  <input
                    type="text"
                    value={editFormData.connectedToLabel || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, connectedToLabel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="e.g. Spliced to CBL-024-B1 Core 2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notes / OTDR Diagnostics</label>
                  <textarea
                    rows={2}
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="Inspection findings, loss readings, OTDR markers..."
                  />
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCore(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Save Core Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

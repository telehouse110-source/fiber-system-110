import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  GitBranch, 
  Disc, 
  X,
  Package,
  Calendar,
  Truck,
  FileCode
} from 'lucide-react';
import { OptiFiberDatabase, FiberCable } from '../../types';
import { addCable, updateCable, deleteCable } from '../../services/storage';

interface CableInventoryViewProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
  onNavigateToCores: (cableId: string) => void;
  onOpenSchematic?: (cableId: string) => void;
}

export const CableInventoryView: React.FC<CableInventoryViewProps> = ({
  db,
  onLaunchTrace,
  onNavigateToCores,
  onOpenSchematic,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCable, setEditingCable] = useState<FiberCable | null>(null);
  const [formData, setFormData] = useState<Partial<FiberCable>>({});

  const filteredCables = db.cables.filter(c => {
    const matchSearch = 
      c.cableId.toLowerCase().includes(search.toLowerCase()) ||
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.batchNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInstalledMeters = db.cables.reduce((acc, c) => acc + (c.installedLengthMeters || 0), 0);
  const totalWarehouseMeters = db.cables.reduce((acc, c) => acc + (c.remainingLengthMeters || 0), 0);

  const handleOpenAdd = () => {
    setFormData({
      cableId: `CBL-${(db.cables.length + 1).toString().padStart(3, '0')}`,
      routeId: db.routes[0]?.id || '',
      supplierId: db.suppliers[0]?.id || '',
      brand: 'Corning ALTOS Lite',
      cableType: 'Armored Loose Tube Aerial',
      coreCount: 24,
      totalLengthMeters: 2000,
      installedLengthMeters: 1800,
      remainingLengthMeters: 200,
      batchNumber: `LOT-${Date.now().toString().slice(-6)}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      installationDate: new Date().toISOString().split('T')[0],
      warranty: '25-Year Manufacturer',
      startLocation: 'Central Hub',
      endLocation: 'North Substation',
      status: 'Installed',
      notes: '',
      photos: [],
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cableId) return;
    addCable(formData as Omit<FiberCable, 'id'>, 'Added physical cable reel to inventory');
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCable) return;
    updateCable(editingCable.id, formData, 'Updated physical cable specifications');
    setEditingCable(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Physical Fiber Cable Drum & Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Track cable spools, installed spans, remaining partial drum lengths, lot batch numbers and warranties
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Cable Roll</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cables Cataloged</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{db.cables.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Installed In-Ground / Aerial</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {(totalInstalledMeters / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">km</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Warehouse Reel Stock</span>
          <p className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
            {(totalWarehouseMeters / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">km</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Associated Cores</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{db.cores.length}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Cable ID, brand, batch number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="Installed">Installed</option>
          <option value="Partial Roll">Partial Roll</option>
          <option value="New">New / In Warehouse</option>
          <option value="Used">Used</option>
          <option value="Damaged">Damaged</option>
        </select>
      </div>

      {/* Cables Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Cable ID</th>
              <th className="py-3 px-4">Brand & Type</th>
              <th className="py-3 px-4">Cores</th>
              <th className="py-3 px-4">Total Length</th>
              <th className="py-3 px-4">Installed Length</th>
              <th className="py-3 px-4">Warehouse Remaining</th>
              <th className="py-3 px-4">Batch #</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredCables.map((cable) => (
              <tr key={cable.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  {cable.cableId}
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800">{cable.brand}</div>
                  <div className="text-[11px] text-slate-400">{cable.cableType}</div>
                </td>
                <td className="py-3 px-4 font-mono">
                  {cable.coreCount} Cores
                </td>
                <td className="py-3 px-4 font-mono">
                  {cable.totalLengthMeters}m
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                  {cable.installedLengthMeters}m
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                  {cable.remainingLengthMeters}m
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                  {cable.batchNumber}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    cable.status === 'Installed' ? 'bg-emerald-50 text-emerald-700' :
                    cable.status === 'Partial Roll' ? 'bg-blue-50 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {cable.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onNavigateToCores(cable.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                      title="Inspect Individual Cores"
                    >
                      <Disc className="w-3.5 h-3.5" />
                    </button>
                    {onOpenSchematic && (
                      <button
                        onClick={() => onOpenSchematic(cable.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 cursor-pointer"
                        title="View Visual Cable Schematic"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onLaunchTrace('CABLE', cable.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                      title="Trace Cable Path"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCable(cable);
                        setFormData({ ...cable });
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCable(cable.id, 'Decommissioned cable')}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Cable Modal */}
      {(isAddModalOpen || editingCable) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAddModalOpen ? 'Register Fiber Cable Reel' : `Edit Cable ${editingCable?.cableId}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCable(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cable ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.cableId || ''}
                      onChange={(e) => setFormData({ ...formData, cableId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Brand Manufacturer</label>
                    <input
                      type="text"
                      value={formData.brand || ''}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Core Count</label>
                    <select
                      value={formData.coreCount || 24}
                      onChange={(e) => setFormData({ ...formData, coreCount: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                    >
                      <option value="2">2 Cores</option>
                      <option value="4">4 Cores</option>
                      <option value="6">6 Cores</option>
                      <option value="8">8 Cores</option>
                      <option value="12">12 Cores</option>
                      <option value="24">24 Cores</option>
                      <option value="48">48 Cores</option>
                      <option value="72">72 Cores</option>
                      <option value="96">96 Cores</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Spool (m)</label>
                    <input
                      type="number"
                      value={formData.totalLengthMeters || 2000}
                      onChange={(e) => setFormData({ ...formData, totalLengthMeters: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Installed (m)</label>
                    <input
                      type="number"
                      value={formData.installedLengthMeters || 1800}
                      onChange={(e) => setFormData({ ...formData, installedLengthMeters: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cable Type</label>
                    <input
                      type="text"
                      value={formData.cableType || ''}
                      onChange={(e) => setFormData({ ...formData, cableType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                      placeholder="e.g. Armored Loose Tube Duct"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Batch / Lot #</label>
                    <input
                      type="text"
                      value={formData.batchNumber || ''}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCable(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Save Cable Drum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  X, 
  QrCode, 
  Share2, 
  ShieldCheck,
  Calendar,
  Truck,
  Eye,
  Info
} from 'lucide-react';
import { OptiFiberDatabase, Duct } from '../../types';
import { addDuct, updateDuct, deleteDuct } from '../../services/storage';
import { AssetQRModal } from '../common/AssetQRModal';
import { ConnectedNetworkModal } from '../common/ConnectedNetworkModal';
import { validateDuctCapacity } from '../../services/validationEngine';

interface DuctManagementViewProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
  onNavigateToDetail?: (section: string, id: string) => void;
}

export const DuctManagementView: React.FC<DuctManagementViewProps> = ({
  db,
  onLaunchTrace,
  onNavigateToDetail,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDuct, setEditingDuct] = useState<Duct | null>(null);
  const [formData, setFormData] = useState<Partial<Duct>>({});

  // QR Modal
  const [qrModalAsset, setQrModalAsset] = useState<any | null>(null);

  // Connected Network Modal
  const [connectedModalAssetId, setConnectedModalAssetId] = useState<string | null>(null);

  // Validation Warnings
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  const ducts = db.ducts || [];

  const filteredDucts = ducts.filter(d => {
    const matchSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.assetId.toLowerCase().includes(search.toLowerCase()) ||
      d.road.toLowerCase().includes(search.toLowerCase()) ||
      d.startPoint.toLowerCase().includes(search.toLowerCase()) ||
      d.endPoint.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || d.type === typeFilter;
    const matchZone = zoneFilter === 'ALL' || d.zone === zoneFilter;
    return matchSearch && matchType && matchZone;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: 'New Telecom Duct Run',
      type: 'HDPE Subduct',
      startPoint: 'Central Metro Core POP-01',
      endPoint: 'North Manhole Junction JB-01',
      zone: db.zones[0]?.name || 'Zone North-A',
      area: db.areas[0]?.name || 'Downtown Metro',
      road: db.roads[0]?.name || 'Grand Avenue',
      lengthMeters: 1000,
      totalDuctWays: 4,
      occupiedWays: 1,
      spareWays: 3,
      reservedWays: 0,
      damagedWays: 0,
      assignedCableIds: [],
      latitude: 37.7780,
      longitude: -122.4160,
      installationDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setCapacityWarning(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (duct: Duct) => {
    setEditingDuct(duct);
    setFormData(duct);
    setCapacityWarning(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalDuctWays) return;

    addDuct({
      name: formData.name || 'Unnamed Duct',
      type: formData.type as any || 'PVC Conduit',
      startPoint: formData.startPoint || 'Origin',
      endPoint: formData.endPoint || 'Terminal',
      latitude: Number(formData.latitude) || 37.7780,
      longitude: Number(formData.longitude) || -122.4160,
      coordinates: formData.coordinates || [],
      zone: formData.zone || 'Zone North-A',
      area: formData.area || 'Downtown Metro',
      road: formData.road || 'Main St',
      lengthMeters: Number(formData.lengthMeters) || 500,
      totalDuctWays: Number(formData.totalDuctWays) || 4,
      occupiedWays: Number(formData.occupiedWays) || 0,
      spareWays: Number(formData.spareWays) || Number(formData.totalDuctWays) || 4,
      reservedWays: Number(formData.reservedWays) || 0,
      damagedWays: Number(formData.damagedWays) || 0,
      assignedCableIds: formData.assignedCableIds || [],
      installationDate: formData.installationDate || new Date().toISOString().split('T')[0],
      contractorSupplierId: formData.contractorSupplierId,
      photos: formData.photos || [],
      documents: formData.documents || [],
      notes: formData.notes || '',
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDuct) return;

    updateDuct(editingDuct.id, formData);
    setEditingDuct(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to decommission duct "${name}"? Relationships will be safely unlinked.`)) {
      deleteDuct(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Duct & Underground Conduit Path Management
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                  {ducts.length} Paths Recorded
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track PVC trenches, HDPE subducts, microduct bundles, conduit ways, cable occupancy, and capacity limits
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Commission New Duct Path</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Duct ID, name, road, or terminus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Duct Types</option>
              <option value="Concrete Trench">Concrete Trench</option>
              <option value="HDPE Subduct">HDPE Subduct</option>
              <option value="Microduct Bundle">Microduct Bundle</option>
              <option value="PVC Conduit">PVC Conduit</option>
              <option value="Aerial Conduit">Aerial Conduit</option>
              <option value="Corrugated Pipe">Corrugated Pipe</option>
            </select>
          </div>

          <div>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Network Zones</option>
              {db.zones.map(z => (
                <option key={z.id} value={z.name}>{z.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Duct Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredDucts.map(duct => {
          const used = duct.occupiedWays || duct.assignedCableIds.length;
          const total = duct.totalDuctWays || 1;
          const usagePercent = Math.min(100, Math.round((used / total) * 100));
          const isOverCapacity = used > total;

          return (
            <div 
              key={duct.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {duct.assetId}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {duct.type}
                      </span>
                      {duct.fieldVerification?.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>GPS Verified</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{duct.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{duct.road} · {duct.area} ({duct.zone})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQrModalAsset({
                        assetId: duct.assetId,
                        name: duct.name,
                        type: 'DUCT CONDUIT',
                        location: duct.road,
                        coordinates: { lat: duct.latitude, lng: duct.longitude },
                        verified: duct.fieldVerification?.isVerified,
                      })}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                      title="Generate Asset QR Label"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConnectedModalAssetId(duct.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                      title="Show Connected Network"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(duct)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                      title="Edit Duct"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(duct.id, duct.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                      title="Delete Duct"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Terminus Span & Length */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-3 space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Span:</span>
                    <span className="truncate max-w-[280px]">{duct.startPoint} ➔ {duct.endPoint}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Trench Length:</span>
                    <span className="font-bold text-slate-900">{duct.lengthMeters} meters ({(duct.lengthMeters / 1000).toFixed(2)} km)</span>
                  </div>
                </div>

                {/* CAPACITY VISUALIZER & OVER-CAPACITY ALERT */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Duct Capacity & Conduit Ways:</span>
                      {isOverCapacity && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Capacity Exceeded!
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-slate-600 font-bold">
                      {used} / {total} Ways ({usagePercent}%)
                    </span>
                  </div>

                  {/* Multi-Segment Capacity Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div 
                      className={`h-full ${isOverCapacity ? 'bg-rose-500' : 'bg-cyan-600'}`} 
                      style={{ width: `${Math.min(100, (duct.occupiedWays / total) * 100)}%` }}
                      title={`Occupied: ${duct.occupiedWays} Ways`}
                    />
                    <div 
                      className="h-full bg-amber-400" 
                      style={{ width: `${Math.min(100, (duct.reservedWays / total) * 100)}%` }}
                      title={`Reserved: ${duct.reservedWays} Ways`}
                    />
                    <div 
                      className="h-full bg-rose-600" 
                      style={{ width: `${Math.min(100, (duct.damagedWays / total) * 100)}%` }}
                      title={`Damaged: ${duct.damagedWays} Ways`}
                    />
                  </div>

                  {/* Subduct Status Badges */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                      <span>Occupied: {duct.occupiedWays}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Spare: {duct.spareWays}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Reserved: {duct.reservedWays}</span>
                    </span>
                    {duct.damagedWays > 0 && (
                      <span className="flex items-center gap-1 text-rose-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                        <span>Damaged: {duct.damagedWays}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Fiber Cables in Duct */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Assigned Fiber Cables Inside Conduit ({duct.assignedCableIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {duct.assignedCableIds.length > 0 ? (
                      duct.assignedCableIds.map(cableId => {
                        const cable = db.cables.find(c => c.id === cableId || c.cableId === cableId);
                        return (
                          <span 
                            key={cableId}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            <span>{cable?.cableId || cableId}</span>
                            <span className="text-slate-400 text-[10px]">({cable?.coreCount || 48}C)</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic">No cables pulled into this duct yet (Dark duct bank).</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Installed: {duct.installationDate}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  GPS: {duct.latitude.toFixed(4)}, {duct.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commission / Edit Duct Modal */}
      {(isAddModalOpen || editingDuct) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingDuct ? `Edit Duct: ${editingDuct.name}` : 'Commission New Duct Conduit Path'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingDuct(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingDuct ? handleSaveEdit : handleSaveAdd} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duct Path Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900"
                    placeholder="e.g. Grand Ave 12-Way Concrete Trench Bank"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duct Type *</label>
                  <select
                    value={formData.type || 'HDPE Subduct'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 cursor-pointer"
                  >
                    <option value="Concrete Trench">Concrete Trench</option>
                    <option value="HDPE Subduct">HDPE Subduct</option>
                    <option value="Microduct Bundle">Microduct Bundle</option>
                    <option value="PVC Conduit">PVC Conduit</option>
                    <option value="Aerial Conduit">Aerial Conduit</option>
                    <option value="Corrugated Pipe">Corrugated Pipe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Network Zone</label>
                  <select
                    value={formData.zone || db.zones[0]?.name}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 cursor-pointer"
                  >
                    {db.zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Area / Sector</label>
                  <select
                    value={formData.area || db.areas[0]?.name}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 cursor-pointer"
                  >
                    {db.areas.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Road / Street</label>
                  <input
                    type="text"
                    value={formData.road || ''}
                    onChange={(e) => setFormData({ ...formData, road: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="e.g. Grand Avenue / Broad St"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Point (Origin)</label>
                  <input
                    type="text"
                    value={formData.startPoint || ''}
                    onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="e.g. POP-01 Headend"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Point (Destination)</label>
                  <input
                    type="text"
                    value={formData.endPoint || ''}
                    onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="e.g. JB-01 North Manhole"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Length (Meters)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lengthMeters || ''}
                    onChange={(e) => setFormData({ ...formData, lengthMeters: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    placeholder="e.g. 1850"
                  />
                </div>
              </div>

              {/* Subduct Capacity Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Conduit Ways Capacity Breakdown
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Total Ways *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.totalDuctWays || 4}
                      onChange={(e) => setFormData({ ...formData, totalDuctWays: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-cyan-700 mb-1">Occupied</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.occupiedWays ?? 1}
                      onChange={(e) => setFormData({ ...formData, occupiedWays: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-cyan-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-emerald-700 mb-1">Spare</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.spareWays ?? 3}
                      onChange={(e) => setFormData({ ...formData, spareWays: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-emerald-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-700 mb-1">Reserved</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reservedWays ?? 0}
                      onChange={(e) => setFormData({ ...formData, reservedWays: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-amber-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">Damaged</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.damagedWays ?? 0}
                      onChange={(e) => setFormData({ ...formData, damagedWays: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-rose-800 font-bold"
                    />
                  </div>
                </div>

                {/* Over capacity warning if occupied > total */}
                {(formData.occupiedWays || 0) > (formData.totalDuctWays || 0) && (
                  <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Warning: Occupied conduit ways ({formData.occupiedWays}) exceeds total capacity ({formData.totalDuctWays})!</span>
                  </div>
                )}
              </div>

              {/* Assign Fiber Cables */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Fiber Cables Installed in this Duct
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {db.cables.map(c => {
                    const isChecked = (formData.assignedCableIds || []).includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const prev = formData.assignedCableIds || [];
                            const updated = e.target.checked
                              ? [...prev, c.id]
                              : prev.filter(x => x !== c.id);
                            setFormData({ ...formData, assignedCableIds: updated, occupiedWays: updated.length });
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="font-mono">{c.cableId}</span>
                        <span className="text-slate-400 text-[10px]">({c.coreCount}C)</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Coordinates & Installation Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Installation Date</label>
                  <input
                    type="date"
                    value={formData.installationDate || ''}
                    onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Engineering Notes & Civil Specs</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  placeholder="e.g. Warning tape placed at 0.5m depth. Concrete encasement under roadway."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingDuct(null); }}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {editingDuct ? 'Save Changes' : 'Commission Duct'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          assetType="DUCT"
          assetId={connectedModalAssetId}
          db={db}
          onNavigateToAsset={onNavigateToDetail}
        />
      )}
    </div>
  );
};

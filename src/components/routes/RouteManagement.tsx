import React, { useState } from 'react';
import { 
  Route as RouteIcon, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye, 
  GitBranch, 
  MapPin, 
  Layers, 
  Boxes, 
  Split, 
  FileText, 
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building
} from 'lucide-react';
import { OptiFiberDatabase, FiberRoute, DocumentAttachment } from '../../types';
import { addRoute, updateRoute, deleteRoute, addCable } from '../../services/storage';

interface RouteManagementProps {
  db: OptiFiberDatabase;
  selectedRouteId?: string;
  onLaunchTrace: (type: any, id: string) => void;
  onNavigateToMap: () => void;
}

export const RouteManagement: React.FC<RouteManagementProps> = ({
  db,
  selectedRouteId,
  onLaunchTrace,
  onNavigateToMap,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'routeName' | 'cableLengthMeters' | 'coreCount'>('routeName');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [detailModalRoute, setDetailModalRoute] = useState<FiberRoute | null>(
    selectedRouteId ? db.routes.find(r => r.id === selectedRouteId) || null : null
  );
  const [editModalRoute, setEditModalRoute] = useState<FiberRoute | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<FiberRoute>>({
    routeName: '',
    routeId: '',
    fiberType: 'G.652D',
    coreCount: 24,
    cableSizeMm: 8.5,
    startPoint: '',
    endPoint: '',
    intermediatePoints: [],
    popId: db.pops[0]?.id || '',
    area: 'Downtown Metro',
    zone: 'Zone North-A',
    roadStreet: '',
    cableLengthMeters: 1000,
    installationType: 'Aerial',
    installationDate: new Date().toISOString().split('T')[0],
    supplierId: db.suppliers[0]?.id || '',
    status: 'Active',
    maintenanceStatus: 'Normal',
    notes: '',
    coordinates: [
      { lat: 37.7749, lng: -122.4194, name: 'Start', type: 'start' },
      { lat: 37.7810, lng: -122.4120, name: 'End', type: 'end' },
    ],
    photos: [],
    documents: [],
  });

  const areas = Array.from(new Set(db.routes.map(r => r.area)));

  // Filter & Sort
  const filteredRoutes = db.routes
    .filter(r => {
      const matchSearch = 
        r.routeName.toLowerCase().includes(search.toLowerCase()) ||
        r.routeId.toLowerCase().includes(search.toLowerCase()) ||
        r.startPoint.toLowerCase().includes(search.toLowerCase()) ||
        r.endPoint.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchArea = areaFilter === 'ALL' || r.area === areaFilter;
      return matchSearch && matchStatus && matchArea;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

  const handleOpenAdd = () => {
    setFormData({
      routeName: '',
      routeId: `RTE-${Date.now().toString().slice(-4)}`,
      fiberType: 'G.652D',
      coreCount: 24,
      cableSizeMm: 8.5,
      startPoint: 'Central POP-01',
      endPoint: 'Destination Enclosure',
      intermediatePoints: [],
      popId: db.pops[0]?.id || '',
      area: 'Downtown Metro',
      zone: 'Zone North-A',
      roadStreet: 'Main Street',
      cableLengthMeters: 1500,
      installationType: 'Aerial',
      installationDate: new Date().toISOString().split('T')[0],
      supplierId: db.suppliers[0]?.id || '',
      status: 'Active',
      maintenanceStatus: 'Normal',
      notes: '',
      coordinates: [
        { lat: 37.7749, lng: -122.4194, name: 'Start', type: 'start' },
        { lat: 37.7810, lng: -122.4120, name: 'End', type: 'end' },
      ],
      photos: [],
      documents: [],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (route: FiberRoute) => {
    setEditModalRoute(route);
    setFormData({ ...route });
  };

  const handleDuplicate = (route: FiberRoute) => {
    const duplicated = addRoute({
      ...route,
      routeName: `${route.routeName} (Copy)`,
      routeId: `${route.routeId}-COPY`,
    }, `Duplicated route from ${route.routeId}`);
    setDetailModalRoute(duplicated);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.routeName || !formData.routeId) return;
    const newRoute = addRoute(formData as Omit<FiberRoute, 'id'>, 'Created new fiber route');

    // Also automatically register a physical cable for this route
    addCable({
      cableId: `CBL-${newRoute.routeId}`,
      routeId: newRoute.id,
      supplierId: newRoute.supplierId,
      brand: 'Standard Fiber Cable',
      cableType: `${newRoute.installationType} Loose Tube`,
      coreCount: newRoute.coreCount,
      totalLengthMeters: Math.round(newRoute.cableLengthMeters * 1.1),
      installedLengthMeters: newRoute.cableLengthMeters,
      remainingLengthMeters: Math.round(newRoute.cableLengthMeters * 0.1),
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      purchaseDate: newRoute.installationDate,
      installationDate: newRoute.installationDate,
      warranty: '25-Year Manufacturer',
      startLocation: newRoute.startPoint,
      endLocation: newRoute.endPoint,
      status: 'Installed',
      notes: `Associated cable deployed on route ${newRoute.routeName}`,
      photos: [],
    }, `Created associated physical cable for route ${newRoute.routeId}`);

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalRoute) return;
    updateRoute(editModalRoute.id, formData, 'Updated route specifications');
    setEditModalRoute(null);
  };

  const handleDelete = (id: string) => {
    deleteRoute(id, 'Decommissioned fiber route');
    setDeleteConfirmId(null);
    if (detailModalRoute?.id === id) setDetailModalRoute(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-blue-600" />
            <span>Fiber Route Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Document, map, edit and inspect physical fiber spans, aerial cables, underground ducts and waypoints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Draw / View on Map</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fiber Route</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by route name, ID, start/end locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active / Nominal</option>
            <option value="Warning">Warning / Maintenance</option>
            <option value="Down">Down / Cut</option>
          </select>

          {/* Area Filter */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer focus:outline-hidden"
          >
            <option value="ALL">All Areas</option>
            {areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Sort Control */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="capitalize">{sortField}</span>
          </button>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Route ID / Name</th>
                <th className="py-3 px-4">Endpoints</th>
                <th className="py-3 px-4">Fiber Specs</th>
                <th className="py-3 px-4">Area & Road</th>
                <th className="py-3 px-4">Length</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Cores Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {filteredRoutes.map((route) => {
                const cables = db.cables.filter(c => c.routeId === route.id);
                const cableIds = cables.map(c => c.id);
                const routeCores = db.cores.filter(c => cableIds.includes(c.cableId));
                const activeCores = routeCores.filter(c => c.status === 'Active' || c.status === 'Used').length;
                const faultCores = routeCores.filter(c => c.status === 'Fault' || c.status === 'Cut' || c.status === 'LOS').length;
                const spareCores = routeCores.filter(c => c.status === 'Spare').length;

                return (
                  <tr key={route.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer" onClick={() => setDetailModalRoute(route)}>
                        {route.routeName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{route.routeId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 truncate max-w-[200px]">{route.startPoint}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">➔ {route.endPoint}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800">{route.coreCount} Cores ({route.fiberType})</div>
                      <div className="text-[11px] text-slate-400">{route.installationType} · {route.cableSizeMm}mm</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{route.area}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{route.roadStreet}</div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-800">
                      {(route.cableLengthMeters / 1000).toFixed(2)} km
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        route.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-emerald-700">{activeCores}A</span>
                        <span>·</span>
                        <span className="text-slate-500">{spareCores}S</span>
                        {faultCores > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-rose-600 font-bold">{faultCores}F</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailModalRoute(route)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
                          title="View Relationships & Infrastructure"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(route)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                          title="Edit Route"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(route)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                          title="Duplicate Route"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(route.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                          title="Delete Route"
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
      </div>

      {/* Route Detail & Relationships Modal */}
      {detailModalRoute && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{detailModalRoute.routeName}</h3>
                  <p className="text-xs text-slate-500 font-mono">{detailModalRoute.routeId} · {detailModalRoute.fiberType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const cable = db.cables.find(c => c.routeId === detailModalRoute.id);
                    if (cable) onLaunchTrace('CABLE', cable.id);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Trace Route</span>
                </button>
                <button
                  onClick={() => setDetailModalRoute(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Core Count</span>
                  <p className="font-bold text-slate-900 mt-0.5">{detailModalRoute.coreCount} Cores</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Span Length</span>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono">{(detailModalRoute.cableLengthMeters / 1000).toFixed(2)} km</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Installation</span>
                  <p className="font-bold text-slate-900 mt-0.5">{detailModalRoute.installationType}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Status</span>
                  <p className="font-bold text-emerald-700 mt-0.5">{detailModalRoute.status}</p>
                </div>
              </div>

              {/* Geographic Path */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Geographic Trajectory & Intermediate Waypoints</span>
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
                  <p><span className="font-semibold text-slate-900">Start Point:</span> {detailModalRoute.startPoint}</p>
                  <p><span className="font-semibold text-slate-900">End Point:</span> {detailModalRoute.endPoint}</p>
                  <p><span className="font-semibold text-slate-900">Road / Street:</span> {detailModalRoute.roadStreet}, {detailModalRoute.area} ({detailModalRoute.zone})</p>
                  {detailModalRoute.intermediatePoints.length > 0 && (
                    <div className="pt-1">
                      <span className="font-semibold text-slate-900">Waypoints:</span>
                      <ul className="list-disc list-inside text-slate-600 pl-2">
                        {detailModalRoute.intermediatePoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Connected Infrastructure Relationships (Prompt Requirement 3 & 17) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Connected Infrastructure Relationships</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Physical Cables */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Physical Cables</span>
                    </span>
                    <div className="mt-2 space-y-1">
                      {db.cables.filter(c => c.routeId === detailModalRoute.id).map(c => (
                        <div key={c.id} className="text-xs font-medium text-slate-800 bg-slate-50 p-1.5 rounded">
                          {c.cableId} ({c.brand})
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Joint Boxes along route */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Joint Boxes</span>
                    </span>
                    <div className="mt-2 space-y-1">
                      {db.jointBoxes.filter(j => j.location.includes(detailModalRoute.area) || j.name.includes(detailModalRoute.routeId)).map(j => (
                        <div key={j.id} className="text-xs font-medium text-slate-800 bg-slate-50 p-1.5 rounded">
                          {j.name} ({j.jointBoxId})
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Splitters */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Split className="w-3.5 h-3.5 text-amber-600" />
                      <span>Optical Splitters</span>
                    </span>
                    <div className="mt-2 space-y-1">
                      {db.splitters.filter(s => s.location.includes(detailModalRoute.area)).map(s => (
                        <div key={s.id} className="text-xs font-medium text-slate-800 bg-slate-50 p-1.5 rounded">
                          {s.name || s.splitterId} ({s.splitRatio})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Documents */}
              {detailModalRoute.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Engineering Notes</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {detailModalRoute.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setDetailModalRoute(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Route Form Modal */}
      {(isAddModalOpen || editModalRoute) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAddModalOpen ? 'Create New Fiber Route' : `Edit Route: ${editModalRoute?.routeName}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditModalRoute(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Route Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.routeName || ''}
                      onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
                      placeholder="e.g. North Metro Backbone Trunk"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Route ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.routeId || ''}
                      onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                      placeholder="e.g. RTE-NORTH-01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fiber Type</label>
                    <select
                      value={formData.fiberType || 'G.652D'}
                      onChange={(e) => setFormData({ ...formData, fiberType: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    >
                      <option value="G.652D">G.652D Standard</option>
                      <option value="G.657A1">G.657A1 Bend-Insensitive</option>
                      <option value="G.657A2">G.657A2 Ultra-Bend</option>
                      <option value="G.655">G.655 NZDSF</option>
                      <option value="OM3">OM3 Multi-mode</option>
                      <option value="OM4">OM4 Multi-mode</option>
                    </select>
                  </div>
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
                    <label className="block font-semibold text-slate-700 mb-1">Length (Meters)</label>
                    <input
                      type="number"
                      required
                      value={formData.cableLengthMeters || 1000}
                      onChange={(e) => setFormData({ ...formData, cableLengthMeters: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cable Size (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.cableSizeMm || 8.5}
                      onChange={(e) => setFormData({ ...formData, cableSizeMm: parseFloat(e.target.value) || 8.0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Point</label>
                    <input
                      type="text"
                      value={formData.startPoint || ''}
                      onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Point</label>
                    <input
                      type="text"
                      value={formData.endPoint || ''}
                      onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Area</label>
                    <input
                      type="text"
                      value={formData.area || ''}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Zone</label>
                    <input
                      type="text"
                      value={formData.zone || ''}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Installation Type</label>
                    <select
                      value={formData.installationType || 'Aerial'}
                      onChange={(e) => setFormData({ ...formData, installationType: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    >
                      <option value="Aerial">Aerial</option>
                      <option value="Underground Duct">Underground Duct</option>
                      <option value="Direct Buried">Direct Buried</option>
                      <option value="Underwater">Underwater</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Engineering Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="Conduit specifications, duct occupancy, pole permits..."
                  />
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditModalRoute(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  {isAddModalOpen ? 'Create Route & Deploy Cable' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Delete Fiber Route</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this route? Physical cables and associated cores will be archived.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  GitBranch, 
  X,
  FileText,
  User,
  MapPin
} from 'lucide-react';
import { OptiFiberDatabase, MaintenanceTicket, MaintenanceProblem, TicketPriority, TicketStatus } from '../../types';
import { addTicket, updateTicket, deleteTicket } from '../../services/storage';

interface MaintenanceViewProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  db,
  onLaunchTrace,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [formData, setFormData] = useState<Partial<MaintenanceTicket>>({});

  const filteredTickets = db.tickets.filter(t => {
    const matchSearch = 
      t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      t.problem.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase()) ||
      t.technician.toLowerCase().includes(search.toLowerCase()) ||
      (t.rootCause || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleOpenAdd = () => {
    setFormData({
      ticketId: `TKT-${new Date().getFullYear()}-${(db.tickets.length + 43).toString().padStart(4, '0')}`,
      dateTime: new Date().toISOString(),
      problem: 'Fiber Cut',
      priority: 'High',
      status: 'Open',
      location: 'Broad Street Vault 14',
      routeId: db.routes[0]?.id || '',
      cableId: db.cables[0]?.id || '',
      coreNumber: 1,
      jointBoxId: db.jointBoxes[0]?.id || '',
      technician: 'Marcus Vance',
      beforeSignalDbm: -32.5,
      afterSignalDbm: undefined,
      rootCause: '',
      workPerformed: '',
      materialUsed: '',
      resolution: '',
      photos: [],
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ticketId || !formData.problem) return;
    addTicket(formData as Omit<MaintenanceTicket, 'id'>, 'Logged new network maintenance ticket');
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    updateTicket(editingTicket.id, formData, 'Updated ticket work progress and resolution');
    setEditingTicket(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            <span>Network Maintenance & Fault Incident Ticketing</span>
          </h1>
          <p className="text-xs text-slate-500">
            Document fiber breaks, high-attenuation bends, closure water ingress, optical OTDR testing, and field repair logs
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Maintenance Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ticket ID, problem, technician, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting">Waiting</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Ticket ID</th>
              <th className="py-3 px-4">Problem / Fault</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Optical Signal</th>
              <th className="py-3 px-4">Assigned Tech</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredTickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  {t.ticketId}
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{t.problem}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{t.rootCause || 'Under investigation'}</div>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  <div className="truncate max-w-[180px]">{t.location}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(t.dateTime).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    t.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                    t.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {t.priority}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">
                  <div>Before: <span className="text-rose-600 font-semibold">{t.beforeSignalDbm !== undefined ? `${t.beforeSignalDbm} dBm` : '-'}</span></div>
                  <div>After: <span className="text-emerald-700 font-semibold">{t.afterSignalDbm !== undefined ? `${t.afterSignalDbm} dBm` : '-'}</span></div>
                </td>
                <td className="py-3 px-4 text-slate-800 font-medium">
                  {t.technician}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    t.status === 'Resolved' || t.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' :
                    t.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {t.cableId && (
                      <button
                        onClick={() => onLaunchTrace('CABLE', t.cableId!)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                        title="Trace Affected Fiber"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingTicket(t);
                        setFormData({ ...t });
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTicket(t.id, 'Purged ticket')}
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

      {/* Add / Edit Ticket Modal */}
      {(isAddModalOpen || editingTicket) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAddModalOpen ? 'Create Network Maintenance Ticket' : `Edit Ticket: ${editingTicket?.ticketId}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTicket(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ticket ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.ticketId || ''}
                      onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Problem Category</label>
                    <select
                      value={formData.problem || 'Fiber Cut'}
                      onChange={(e) => setFormData({ ...formData, problem: e.target.value as MaintenanceProblem })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                    >
                      <option value="Fiber Cut">Fiber Cut</option>
                      <option value="High Loss">High Loss</option>
                      <option value="LOS">LOS (Loss of Signal)</option>
                      <option value="Low Signal">Low Signal</option>
                      <option value="Joint Box Issue">Joint Box Issue</option>
                      <option value="Splitter Issue">Splitter Issue</option>
                      <option value="OLT Issue">OLT Issue</option>
                      <option value="SFP Issue">SFP Issue</option>
                      <option value="Switch Issue">Switch Issue</option>
                      <option value="Cable Damage">Cable Damage</option>
                      <option value="Water Damage">Water Damage</option>
                      <option value="Planned Maintenance">Planned Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={formData.priority || 'High'}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status || 'Open'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                    >
                      <option value="Open">Open</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Waiting">Waiting</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / Field Coordinates</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="e.g. Broad Street Pole 14, Cedar Hills Pedestal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Before Signal (dBm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.beforeSignalDbm ?? ''}
                      onChange={(e) => setFormData({ ...formData, beforeSignalDbm: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                      placeholder="-99.0 for LOS"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">After Repair Signal (dBm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.afterSignalDbm ?? ''}
                      onChange={(e) => setFormData({ ...formData, afterSignalDbm: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                      placeholder="e.g. -18.2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={formData.technician || ''}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Root Cause Analysis</label>
                  <textarea
                    rows={2}
                    value={formData.rootCause || ''}
                    onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="Detailed failure mechanism: rodent chew, backhoe cut, dirty connector..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Performed & Material Used</label>
                  <textarea
                    rows={2}
                    value={formData.workPerformed || ''}
                    onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="e.g. Cleaved and re-spliced cores 1-4 with 60mm protection sleeves"
                  />
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTicket(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Save Maintenance Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

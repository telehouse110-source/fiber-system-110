import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  User, 
  Calendar, 
  Wrench, 
  ArrowRight,
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { OptiFiberDatabase, NetworkChangeRequest } from '../../types';
import { addChangeRequest, updateChangeRequest } from '../../services/storage';

interface ChangeRequestViewProps {
  db: OptiFiberDatabase;
  onNavigateToAsset?: (section: string, id: string) => void;
}

export const ChangeRequestView: React.FC<ChangeRequestViewProps> = ({
  db,
  onNavigateToAsset,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMcr, setEditingMcr] = useState<NetworkChangeRequest | null>(null);
  const [formData, setFormData] = useState<Partial<NetworkChangeRequest>>({});

  const mcrs = db.changeRequests || [];

  const filteredMcrs = mcrs.filter(m => {
    const matchSearch = 
      m.changeId.toLowerCase().includes(search.toLowerCase()) ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.requestedBy.toLowerCase().includes(search.toLowerCase()) ||
      m.technician.toLowerCase().includes(search.toLowerCase()) ||
      m.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || m.approvalStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      changeId: `MCR-${new Date().getFullYear()}-${(mcrs.length + 3).toString().padStart(3, '0')}`,
      title: '',
      requestedBy: db.currentUser?.name || 'Network Engineer',
      reason: '',
      currentConfiguration: '',
      proposedConfiguration: '',
      approvalStatus: 'Draft',
      workPerformed: '',
      newConfiguration: '',
      date: new Date().toISOString().split('T')[0],
      technician: 'Marcus Vance',
      affectedAssetIds: [],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (mcr: NetworkChangeRequest) => {
    setEditingMcr(mcr);
    setFormData(mcr);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.changeId) return;

    addChangeRequest({
      changeId: formData.changeId || `MCR-${Date.now()}`,
      title: formData.title || 'Untitled Change',
      requestedBy: formData.requestedBy || 'NOC Staff',
      reason: formData.reason || '',
      currentConfiguration: formData.currentConfiguration || '',
      proposedConfiguration: formData.proposedConfiguration || '',
      approvalStatus: (formData.approvalStatus as any) || 'Draft',
      workPerformed: formData.workPerformed || '',
      newConfiguration: formData.newConfiguration || '',
      photos: formData.photos || [],
      date: formData.date || new Date().toISOString().split('T')[0],
      technician: formData.technician || 'Marcus Vance',
      affectedAssetIds: formData.affectedAssetIds || [],
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMcr) return;

    updateChangeRequest(editingMcr.id, formData);
    setEditingMcr(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Network Change Requests (MCR / RFC) Management
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
                  {mcrs.length} Change Tickets
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Formal approval process, reason tracking, before/after configuration snapshots, and field technician work logs
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Change Request</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by MCR ID, title, requested by, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Approval Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Change Requests List */}
      <div className="space-y-4">
        {filteredMcrs.map(mcr => {
          const getStatusBadge = (st: string) => {
            switch (st) {
              case 'Completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
              case 'Approved':
                return 'bg-blue-50 text-blue-700 border-blue-200';
              case 'Under Review':
                return 'bg-amber-50 text-amber-700 border-amber-200';
              case 'Rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
              default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
            }
          };

          return (
            <div 
              key={mcr.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    {mcr.changeId}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{mcr.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(mcr.approvalStatus)}`}>
                    {mcr.approvalStatus}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(mcr)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Reason & Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requested By</span>
                  <span className="font-semibold text-slate-800">{mcr.requestedBy}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Technician</span>
                  <span className="font-semibold text-slate-800">{mcr.technician}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Effective Date</span>
                  <span className="font-semibold text-slate-800">{mcr.date}</span>
                </div>
              </div>

              {/* Justification / Reason */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Business & Engineering Justification:</span>
                <p className="text-slate-600">{mcr.reason}</p>
              </div>

              {/* Before vs After Configuration Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl">
                  <span className="font-bold text-rose-800 block mb-1">Current / Previous Configuration:</span>
                  <p className="text-rose-900 font-mono text-[11px] whitespace-pre-wrap">{mcr.currentConfiguration || 'N/A'}</p>
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-800 block mb-1">Proposed / New Configuration:</span>
                  <p className="text-emerald-900 font-mono text-[11px] whitespace-pre-wrap">{mcr.newConfiguration || mcr.proposedConfiguration || 'N/A'}</p>
                </div>
              </div>

              {mcr.workPerformed && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Work Performed by Field Splicer:</span>
                  <p className="text-slate-600 font-mono text-[11px]">{mcr.workPerformed}</p>
                </div>
              )}
            </div>
          );
        })}

        {filteredMcrs.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">No Change Requests Found</h4>
            <p className="text-xs text-slate-500 mt-1">Create an MCR before undertaking physical route modifications or splitter upgrades.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingMcr) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingMcr ? `Edit Change Request: ${editingMcr.changeId}` : 'Create Network Change Request (MCR)'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingMcr(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingMcr ? handleSaveEdit : handleSaveAdd} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Change ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.changeId || ''}
                    onChange={(e) => setFormData({ ...formData, changeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Approval Status</label>
                  <select
                    value={formData.approvalStatus || 'Draft'}
                    onChange={(e) => setFormData({ ...formData, approvalStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Change Request Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
                  placeholder="e.g. Upgrade Cedar Ridge Feeder to 24-Core Microduct Cable"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Engineering Reason / Justification</label>
                <textarea
                  rows={2}
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  placeholder="Explain why this change is necessary..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">Current Configuration</label>
                  <textarea
                    rows={2}
                    value={formData.currentConfiguration || ''}
                    onChange={(e) => setFormData({ ...formData, currentConfiguration: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-900"
                    placeholder="e.g. 12-Core cable CBL-012-C1 in JB-03"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-700 mb-1">Proposed Configuration</label>
                  <textarea
                    rows={2}
                    value={formData.proposedConfiguration || ''}
                    onChange={(e) => setFormData({ ...formData, proposedConfiguration: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-900"
                    placeholder="e.g. 24-Core cable through Microduct #4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Requested By</label>
                  <input
                    type="text"
                    value={formData.requestedBy || ''}
                    onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Splicer</label>
                  <input
                    type="text"
                    value={formData.technician || ''}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Performed Log (Post-Execution)</label>
                <textarea
                  rows={2}
                  value={formData.workPerformed || ''}
                  onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  placeholder="Record actual fusion splices completed, OTDR readings, or cable batch numbers..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingMcr(null); }}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {editingMcr ? 'Save MCR' : 'Submit Change Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

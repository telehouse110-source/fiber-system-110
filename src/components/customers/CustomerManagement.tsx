import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  GitBranch, 
  Split, 
  X,
  Phone,
  Mail,
  MapPin,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { OptiFiberDatabase, Customer } from '../../types';
import { addCustomer, updateCustomer, deleteCustomer, checkSplitterPortConflict } from '../../services/storage';
import { ConflictDialog } from '../common/ConflictDialog';

interface CustomerManagementProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  db,
  onLaunchTrace,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  // Conflict state
  const [conflictResult, setConflictResult] = useState<any>(null);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  const filteredCustomers = db.customers.filter(c => {
    const matchSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customerId.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.onuMac.toLowerCase().includes(search.toLowerCase()) ||
      c.onuSerial.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      customerId: `CUST-${(db.customers.length + 10495).toString()}`,
      name: '',
      phone: '+1 (415) 555-0100',
      whatsapp: '+14155550100',
      email: '',
      address: '',
      area: 'Cedar Hills',
      zone: 'Zone North-A',
      latitude: 37.8005,
      longitude: -122.3880,
      package: 'Residential Fiber Ultra 300 Mbps',
      onuModel: 'Huawei EchoLife HG8310M',
      onuMac: '48:57:02:AA:BB:CC',
      onuSerial: '48575443AABBCC01',
      status: 'Active',
      dealerId: db.dealers[0]?.id || '',
      splitterId: db.splitters[0]?.id || '',
      splitterPortNumber: 5,
      dropCableLengthM: 65,
      rxPowerDbm: -18.2,
      installationDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSave = (force = false) => {
    if (!formData.name || !formData.customerId) return;

    // Check conflict if splitter port is changed
    if (!force && formData.splitterId && formData.splitterPortNumber) {
      const conflict = checkSplitterPortConflict(
        db,
        formData.splitterId,
        formData.splitterPortNumber,
        editingCustomer?.id || ''
      );
      if (conflict.hasConflict) {
        setConflictResult(conflict);
        setIsConflictDialogOpen(true);
        return;
      }
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData, 'Updated subscriber account');
      setEditingCustomer(null);
    } else {
      addCustomer(formData as Omit<Customer, 'id'>, 'Registered new subscriber');
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Subscriber & Customer Relationship Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Document ONU hardware MACs, optical drop lengths, received powers (dBm), and trace full fiber paths to headend OLT
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subscriber</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, phone, ONU MAC, serial, address..."
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
          <option value="Active">Active</option>
          <option value="LOS">LOS (Loss of Signal)</option>
          <option value="Offline">Offline</option>
          <option value="Suspended">Suspended</option>
          <option value="Pending">Pending Installation</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Customer ID / Name</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Broadband Plan</th>
              <th className="py-3 px-4">ONU Hardware</th>
              <th className="py-3 px-4">Optical Rx Signal</th>
              <th className="py-3 px-4">Splitter / Drop</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredCustomers.map((cust) => {
              const spl = db.splitters.find(s => s.id === cust.splitterId);
              const isLos = cust.status === 'LOS';
              return (
                <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{cust.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{cust.customerId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800">{cust.phone}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{cust.address}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {cust.package}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{cust.onuModel}</div>
                    <div className="text-[11px] text-slate-400 font-mono">MAC: {cust.onuMac}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={`font-bold ${isLos ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {isLos ? 'LOS (No Signal)' : `${cust.rxPowerDbm} dBm`}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-700">
                    {spl ? (
                      <div>
                        {spl.splitterId} P#{cust.splitterPortNumber} ({cust.dropCableLengthM}m)
                      </div>
                    ) : (
                      <span className="text-slate-400">Direct Feed</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      cust.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                      cust.status === 'LOS' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {cust.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onLaunchTrace('CUSTOMER', cust.id)}
                        className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md cursor-pointer flex items-center gap-1"
                        title="Trace Full Reverse Fiber Path to OLT"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Trace</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingCustomer(cust);
                          setFormData({ ...cust });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCustomer(cust.id, 'Deactivated subscriber')}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
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

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAddModalOpen ? 'Register New Fiber Subscriber' : `Edit Customer: ${editingCustomer?.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subscriber Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customer ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp || ''}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Installation Street Address</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Broadband Plan</label>
                    <input
                      type="text"
                      value={formData.package || ''}
                      onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                    <select
                      value={formData.status || 'Active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                    >
                      <option value="Active">Active</option>
                      <option value="LOS">LOS (Loss of Signal)</option>
                      <option value="Offline">Offline</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Pending">Pending Installation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ONU Model</label>
                    <input
                      type="text"
                      value={formData.onuModel || ''}
                      onChange={(e) => setFormData({ ...formData, onuModel: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ONU MAC</label>
                    <input
                      type="text"
                      value={formData.onuMac || ''}
                      onChange={(e) => setFormData({ ...formData, onuMac: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Serial Number</label>
                    <input
                      type="text"
                      value={formData.onuSerial || ''}
                      onChange={(e) => setFormData({ ...formData, onuSerial: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Splitter</label>
                    <select
                      value={formData.splitterId || ''}
                      onChange={(e) => setFormData({ ...formData, splitterId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                    >
                      {db.splitters.map(s => (
                        <option key={s.id} value={s.id}>{s.name || s.splitterId} ({s.splitRatio})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Splitter Port #</label>
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={formData.splitterPortNumber || 1}
                      onChange={(e) => setFormData({ ...formData, splitterPortNumber: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Drop Cable (m)</label>
                    <input
                      type="number"
                      value={formData.dropCableLengthM || 50}
                      onChange={(e) => setFormData({ ...formData, dropCableLengthM: parseInt(e.target.value) || 50 })}
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
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Save Subscriber
                </button>
              </div>
            </form>
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
            handleSave(true);
          }}
          conflict={conflictResult}
          title="Splitter Port Conflict Warning"
          confirmLabel="Reassign Port to this Subscriber"
        />
      )}
    </div>
  );
};

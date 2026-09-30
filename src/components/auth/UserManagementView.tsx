import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Shield, 
  KeyRound, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  X, 
  Lock, 
  Check, 
  Minus 
} from 'lucide-react';
import { OptiFiberDatabase, UserAccount, UserRole } from '../../types';
import { createUser, updateUser, deleteUser } from '../../services/cryptoAuth';

interface UserManagementViewProps {
  db: OptiFiberDatabase;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ db }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [addForm, setAddForm] = useState({
    username: '',
    name: '',
    email: '',
    role: 'Technician' as UserRole,
    passwordPlain: '',
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'Technician' as UserRole,
    isActive: true,
    newPasswordPlain: '',
  });

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.username || !addForm.passwordPlain) return;
    await createUser(addForm);
    setIsAddModalOpen(false);
    setAddForm({ username: '', name: '', email: '', role: 'Technician', passwordPlain: '', isActive: true });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateUser(editingUser.id, editForm);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    try {
      deleteUser(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Permission Matrix Definition
  const permissionsMatrix: { feature: string; superAdmin: boolean; netAdmin: boolean; tech: boolean; docStaff: boolean; viewer: boolean }[] = [
    { feature: 'View Network Dashboard & GIS Map', superAdmin: true, netAdmin: true, tech: true, docStaff: true, viewer: true },
    { feature: 'Trace Fiber Paths & Topology', superAdmin: true, netAdmin: true, tech: true, docStaff: true, viewer: true },
    { feature: 'Add / Edit / Delete Fiber Routes', superAdmin: true, netAdmin: true, tech: false, docStaff: false, viewer: false },
    { feature: 'Manage OLTs, Switches & Headend Ports', superAdmin: true, netAdmin: true, tech: false, docStaff: false, viewer: false },
    { feature: 'Joint Box Splice Creation & Editing', superAdmin: true, netAdmin: true, tech: true, docStaff: false, viewer: false },
    { feature: 'Log Maintenance Tickets & Field Readings', superAdmin: true, netAdmin: true, tech: true, docStaff: false, viewer: false },
    { feature: 'Run Automated Network Discovery Scan', superAdmin: true, netAdmin: true, tech: true, docStaff: false, viewer: false },
    { feature: 'Manage Suppliers & Cable Drum Inventory', superAdmin: true, netAdmin: true, tech: false, docStaff: true, viewer: false },
    { feature: 'Database Backup & JSON Restore', superAdmin: true, netAdmin: true, tech: false, docStaff: false, viewer: false },
    { feature: 'User Accounts & Role Permissions Admin', superAdmin: true, netAdmin: false, tech: false, docStaff: false, viewer: false },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Role-Based Access Control & User Account Security</span>
          </h1>
          <p className="text-xs text-slate-500">
            Enforce role boundaries across Super Admin, Network Admin, Technician, Documentation Staff, and Viewer
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Registered System Users ({db.users.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            SHA-256 Salted Passwords
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Operator Name</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Assigned Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Login</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {db.users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">
                  {user.name}
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  {user.username}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {user.email || `${user.username}@optifiber.local`}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'Network Admin' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'Technician' ? 'bg-amber-100 text-amber-800' :
                    user.role === 'Documentation Staff' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                    user.isActive ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{user.isActive ? 'Active' : 'Disabled'}</span>
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setEditForm({
                          name: user.name,
                          email: user.email,
                          role: user.role,
                          isActive: user.isActive,
                          newPasswordPlain: '',
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                      title="Edit User Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {user.role !== 'Super Admin' && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Permission Matrix Reference Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Role Permission Matrix & Access Entitlements
          </h3>
          <p className="text-xs text-slate-500">
            System enforces these permissions across all API actions, navigation routes, and database edits
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">System Capability / Module</th>
                <th className="py-2.5 px-3 text-center">Super Admin</th>
                <th className="py-2.5 px-3 text-center">Network Admin</th>
                <th className="py-2.5 px-3 text-center">Technician</th>
                <th className="py-2.5 px-3 text-center">Doc Staff</th>
                <th className="py-2.5 px-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {item.feature}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.superAdmin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.netAdmin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.tech ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.docStaff ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.viewer ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSaveAdd}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Create New User Account</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    placeholder="e.g. john_doe"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                  >
                    <option value="Super Admin">Super Admin (Full Access)</option>
                    <option value="Network Admin">Network Admin</option>
                    <option value="Technician">Technician</option>
                    <option value="Documentation Staff">Documentation Staff</option>
                    <option value="Viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={addForm.passwordPlain}
                    onChange={(e) => setAddForm({ ...addForm, passwordPlain: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSaveEdit}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Edit User: {editingUser.username}</h3>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Network Admin">Network Admin</option>
                    <option value="Technician">Technician</option>
                    <option value="Documentation Staff">Documentation Staff</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reset Password (leave empty to keep current)</label>
                  <input
                    type="password"
                    value={editForm.newPasswordPlain}
                    onChange={(e) => setEditForm({ ...editForm, newPasswordPlain: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    placeholder="New password"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="user-is-active"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="user-is-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Account is Active
                  </label>
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

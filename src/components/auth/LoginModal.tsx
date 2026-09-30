import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { verifyAndLogin } from '../../services/cryptoAuth';
import { UserAccount, UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  currentUser?: UserAccount;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await verifyAndLogin(username, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Authentication failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">OptiFiber System Authentication</h2>
          <p className="text-xs text-slate-500 mt-0.5">Secure local role-based access control</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In & Validate Session'}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              One-Click Role Demonstration Accounts:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left cursor-pointer"
              >
                <div className="font-semibold text-slate-900">Super Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('netadmin', 'netadmin123')}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left cursor-pointer"
              >
                <div className="font-semibold text-slate-900">Network Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">netadmin / netadmin123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('tech_marcus', 'tech123')}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left cursor-pointer"
              >
                <div className="font-semibold text-slate-900">Technician</div>
                <div className="text-[10px] text-slate-400 font-mono">tech_marcus / tech123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('viewer', 'viewer123')}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left cursor-pointer"
              >
                <div className="font-semibold text-slate-900">Viewer</div>
                <div className="text-[10px] text-slate-400 font-mono">viewer / viewer123</div>
              </button>
            </div>
          </div>
        </form>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

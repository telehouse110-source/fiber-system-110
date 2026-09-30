import React from 'react';
import { 
  Search, 
  GitBranch, 
  Wifi, 
  Smartphone, 
  Shield, 
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { UserRole, UserAccount } from '../../types';

interface HeaderProps {
  currentSection: string;
  onOpenSearch: () => void;
  onOpenLANModal: () => void;
  onOpenTrace: () => void;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  onOpenLogin?: () => void;
  onNavigateToUsers?: () => void;
  isFieldMode: boolean;
  onToggleFieldMode: () => void;
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onOpenSearch,
  onOpenLANModal,
  onOpenTrace,
  currentUser,
  allUsers,
  onSelectUser,
  onOpenLogin,
  onNavigateToUsers,
  isFieldMode,
  onToggleFieldMode,
  lastUpdated,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Breadcrumbs & Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span className="hidden sm:inline text-slate-400">OptiFiber</span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="text-slate-900 font-semibold truncate capitalize">
            {currentSection.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 ml-2 pl-3 border-l border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Synced</span>
          <span className="font-mono text-slate-500">{new Date(lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Zone 2: Global Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="truncate">Search cables, cores, joint boxes, splitters, customers...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-white border border-slate-300 rounded shadow-xs text-slate-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Primary Actions, Field Mode, LAN Access, Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Quick Trace Trigger */}
        <button
          onClick={onOpenTrace}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          title="Launch Fiber Tracing Engine"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trace Engine</span>
        </button>

        {/* Mobile LAN Access Modal Trigger */}
        <button
          onClick={onOpenLANModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          title="View Local IP & QR for Mobile Access on LAN"
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">LAN Access</span>
        </button>

        {/* Field Mode Toggle for Technicians */}
        <button
          onClick={onToggleFieldMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
            isFieldMode 
              ? 'bg-amber-600 text-white border-amber-700 shadow-xs' 
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
          }`}
          title="Toggle Mobile Field Mode"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{isFieldMode ? 'Exit Field Mode' : 'Field Mode'}</span>
        </button>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="font-semibold text-slate-900 truncate max-w-[90px]">{currentUser.name}</span>
              <span className="text-[10px] text-slate-500 font-normal">{currentUser.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">Switch User Role</p>
                <p className="text-[11px] text-slate-500">Test different permission levels</p>
              </div>
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u);
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    u.id === currentUser.id ? 'bg-blue-50/50 text-blue-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p>{u.name}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{u.role}</p>
                  </div>
                  {u.id === currentUser.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  )}
                </button>
              ))}

              <div className="pt-1 mt-1 border-t border-slate-100">
                {onOpenLogin && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Login with Password</span>
                  </button>
                )}
                {onNavigateToUsers && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigateToUsers();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Manage All Users & RBAC</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

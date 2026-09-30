import React from 'react';
import {
  LayoutDashboard,
  Route,
  Disc,
  Boxes,
  Split,
  GitBranch,
  MapPin,
  Server,
  Layers,
  Users,
  Wrench,
  History,
  Palette,
  BarChart3,
  Truck,
  Database,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Smartphone,
  Activity,
  FileCode,
  ShieldCheck,
  FolderTree,
  RotateCw,
  GitPullRequest,
  HeartPulse,
  Network
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'routes'
  | 'ducts'
  | 'rings'
  | 'cores'
  | 'jointBoxes'
  | 'schematics'
  | 'splitters'
  | 'trace'
  | 'map'
  | 'devices'
  | 'discovery'
  | 'inventory'
  | 'customers'
  | 'maintenance'
  | 'hierarchy'
  | 'topology'
  | 'health'
  | 'changes'
  | 'users'
  | 'audit'
  | 'colors'
  | 'reports'
  | 'suppliers'
  | 'backup';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  openFaultCount: number;
  openTicketCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenLANModal: () => void;
  onToggleFieldMode: () => void;
  isFieldMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  openFaultCount,
  openTicketCount,
  isCollapsed,
  onToggleCollapse,
  onOpenLANModal,
  onToggleFieldMode,
  isFieldMode,
}) => {
  const primaryNavItems: { id: NavSection; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'trace', label: 'Fiber Trace Engine', icon: <GitBranch className="w-4 h-4 text-blue-600" /> },
    { id: 'map', label: 'GIS Network Map', icon: <MapPin className="w-4 h-4 text-emerald-600" /> },
    { id: 'routes', label: 'Fiber Routes & Segments', icon: <Route className="w-4 h-4 text-indigo-600" /> },
    { id: 'ducts', label: 'Duct Management', icon: <Layers className="w-4 h-4 text-cyan-600" /> },
    { id: 'rings', label: 'Splitter Rings & Backup', icon: <RotateCw className="w-4 h-4 text-amber-600" /> },
    { id: 'cores', label: 'Core Management', icon: <Disc className="w-4 h-4" />, badge: openFaultCount > 0 ? openFaultCount : undefined, badgeColor: 'bg-rose-100 text-rose-700' },
    { id: 'jointBoxes', label: 'Joint Boxes & Splices', icon: <Boxes className="w-4 h-4" /> },
    { id: 'schematics', label: 'Visual Schematics', icon: <FileCode className="w-4 h-4 text-indigo-600" /> },
    { id: 'splitters', label: 'Optical Splitters', icon: <Split className="w-4 h-4" /> },
    { id: 'devices', label: 'OLT, PON & Switches', icon: <Server className="w-4 h-4" /> },
    { id: 'discovery', label: 'Network Discovery', icon: <Activity className="w-4 h-4 text-cyan-600" /> },
    { id: 'inventory', label: 'Cable Inventory', icon: <Layers className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers & ONUs', icon: <Users className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance Tickets', icon: <Wrench className="w-4 h-4" />, badge: openTicketCount > 0 ? openTicketCount : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
  ];

  const topologyNavItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'hierarchy', label: 'Network Hierarchy', icon: <FolderTree className="w-4 h-4 text-indigo-600" /> },
    { id: 'topology', label: 'Topology & Models', icon: <Network className="w-4 h-4 text-blue-600" /> },
    { id: 'health', label: 'Documentation Health', icon: <HeartPulse className="w-4 h-4 text-emerald-600" /> },
    { id: 'changes', label: 'Change Requests (MCR)', icon: <GitPullRequest className="w-4 h-4 text-purple-600" /> },
  ];

  const secondaryNavItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'User Roles & RBAC', icon: <ShieldCheck className="w-4 h-4 text-violet-600" /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit History', icon: <History className="w-4 h-4" /> },
    { id: 'colors', label: 'Fiber Color Codes', icon: <Palette className="w-4 h-4" /> },
    { id: 'suppliers', label: 'Suppliers & Vendors', icon: <Truck className="w-4 h-4" /> },
    { id: 'backup', label: 'Backup & Restore', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              <span className="text-base font-mono">OF</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-slate-900 text-sm tracking-tight truncate">OptiFiber ISP</span>
              <span className="text-[11px] text-slate-500 truncate">Fiber Network System</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <span className="text-xs font-mono">OF</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Link List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-6">
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Network Operations
            </div>
          )}
          <nav className="space-y-0.5">
            {primaryNavItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer group text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!isCollapsed && item.badge !== undefined && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Architecture & Health
            </div>
          )}
          <nav className="space-y-0.5">
            {topologyNavItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer group text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              System & Administration
            </div>
          )}
          <nav className="space-y-0.5">
            {secondaryNavItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer group text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* LAN & Field Mode Quick Actions Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Local Server</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              PORT 3000
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onOpenLANModal}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>LAN Setup</span>
            </button>
            <button
              onClick={onToggleFieldMode}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium border rounded-md transition-colors cursor-pointer ${
                isFieldMode 
                  ? 'bg-amber-600 text-white border-amber-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>{isFieldMode ? 'Exit Field' : 'Field View'}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

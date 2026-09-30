import React, { useState, useEffect } from 'react';
import { getDatabase, setCurrentUser, saveDatabase } from './services/storage';
import { OptiFiberDatabase, UserAccount } from './types';
import { Header } from './components/common/Header';
import { Sidebar, NavSection } from './components/common/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { LANAccessModal } from './components/common/LANAccessModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { RouteManagement } from './components/routes/RouteManagement';
import { CoreManagement } from './components/cores/CoreManagement';
import { JointBoxManagement } from './components/jointBoxes/JointBoxManagement';
import { SplitterManagement } from './components/splitters/SplitterManagement';
import { FiberTraceView } from './components/trace/FiberTraceView';
import { NetworkGISMap } from './components/map/NetworkGISMap';
import { DeviceManagement } from './components/devices/DeviceManagement';
import { CableInventoryView } from './components/inventory/CableInventoryView';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { AuditHistoryView } from './components/audit/AuditHistoryView';
import { ColorManagementView } from './components/colors/ColorManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { SupplierManagement } from './components/suppliers/SupplierManagement';
import { BackupRestoreView } from './components/backup/BackupRestoreView';
import { MobileTechnicianView } from './components/mobile/MobileTechnicianView';
import { NetworkDiscoveryView } from './components/discovery/NetworkDiscoveryView';
import { SchematicGeneratorView } from './components/schematics/SchematicGeneratorView';
import { UserManagementView } from './components/auth/UserManagementView';
import { LoginModal } from './components/auth/LoginModal';
import { DuctManagementView } from './components/ducts/DuctManagementView';
import { SplitterRingView } from './components/rings/SplitterRingView';
import { NetworkHierarchyView } from './components/hierarchy/NetworkHierarchyView';
import { ChangeRequestView } from './components/changes/ChangeRequestView';
import { DocumentationHealthView } from './components/health/DocumentationHealthView';
import { NetworkTopologyView } from './components/topology/NetworkTopologyView';

export default function App() {
  const [db, setDb] = useState<OptiFiberDatabase>(() => getDatabase());
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLANModalOpen, setIsLANModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isFieldMode, setIsFieldMode] = useState(false);

  // Selected item targets for direct navigation
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);
  const [selectedJbId, setSelectedJbId] = useState<string | undefined>(undefined);
  const [selectedSchematicJbId, setSelectedSchematicJbId] = useState<string | undefined>(undefined);
  const [selectedSchematicCableId, setSelectedSchematicCableId] = useState<string | undefined>(undefined);
  const [traceTarget, setTraceTarget] = useState<{ type: string; id: string } | null>(null);

  // Subscribe to real-time database updates
  useEffect(() => {
    const handleDbUpdated = () => {
      setDb(getDatabase());
    };
    window.addEventListener('optifiber-db-updated', handleDbUpdated);
    return () => window.removeEventListener('optifiber-db-updated', handleDbUpdated);
  }, []);

  // Compute badges for sidebar
  const openFaultCount = db.cores.filter(c => c.status === 'Fault' || c.status === 'Cut' || c.status === 'LOS').length;
  const openTicketCount = db.tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  const handleLaunchTrace = (type: any, id: string) => {
    setTraceTarget({ type, id });
    setCurrentSection('trace');
  };

  const handleNavigate = (section: NavSection, id?: string, subType?: string) => {
    if (section === 'routes' && id) {
      setSelectedRouteId(id);
    }
    if (section === 'jointBoxes' && id) {
      setSelectedJbId(id);
    }
    if (section === 'schematics' && id) {
      if (subType === 'cable') {
        setSelectedSchematicCableId(id);
        setSelectedSchematicJbId(undefined);
      } else {
        setSelectedSchematicJbId(id);
        setSelectedSchematicCableId(undefined);
      }
    }
    setCurrentSection(section);
  };

  const handleSelectUser = (user: UserAccount) => {
    setCurrentUser(user);
    setDb(getDatabase());
  };

  const handleQuickAction = (actionType: string) => {
    if (actionType === 'newRoute') {
      setCurrentSection('routes');
    } else if (actionType === 'newJointBox') {
      setCurrentSection('jointBoxes');
    } else if (actionType === 'newSplice') {
      setCurrentSection('jointBoxes');
    } else if (actionType === 'newTicket') {
      setCurrentSection('maintenance');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(section) => {
          setCurrentSection(section);
          if (isFieldMode) setIsFieldMode(false);
        }}
        openFaultCount={openFaultCount}
        openTicketCount={openTicketCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenLANModal={() => setIsLANModalOpen(true)}
        onToggleFieldMode={() => setIsFieldMode(!isFieldMode)}
        isFieldMode={isFieldMode}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentSection={isFieldMode ? 'Field Mode' : currentSection}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenLANModal={() => setIsLANModalOpen(true)}
          onOpenTrace={() => {
            setTraceTarget(null);
            setCurrentSection('trace');
          }}
          currentUser={db.currentUser}
          allUsers={db.users}
          onSelectUser={handleSelectUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onNavigateToUsers={() => setCurrentSection('users')}
          isFieldMode={isFieldMode}
          onToggleFieldMode={() => setIsFieldMode(!isFieldMode)}
          lastUpdated={db.lastUpdated}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {isFieldMode ? (
              <MobileTechnicianView
                db={db}
                onLaunchTrace={handleLaunchTrace}
                onExitFieldMode={() => setIsFieldMode(false)}
              />
            ) : (
              <>
                {currentSection === 'dashboard' && (
                  <DashboardOverview
                    db={db}
                    onNavigate={handleNavigate}
                    onLaunchTrace={handleLaunchTrace}
                    onOpenQuickAction={handleQuickAction}
                  />
                )}

                {currentSection === 'trace' && (
                  <FiberTraceView
                    db={db}
                    initialType={traceTarget?.type}
                    initialId={traceTarget?.id}
                    onNavigate={handleNavigate}
                  />
                )}

                {currentSection === 'map' && (
                  <NetworkGISMap
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                    onNavigateToDetail={(sec, id) => handleNavigate(sec as NavSection, id)}
                  />
                )}

                {currentSection === 'routes' && (
                  <RouteManagement
                    db={db}
                    selectedRouteId={selectedRouteId}
                    onLaunchTrace={handleLaunchTrace}
                    onNavigateToMap={() => setCurrentSection('map')}
                  />
                )}

                {currentSection === 'ducts' && (
                  <DuctManagementView
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                    onNavigateToDetail={(sec, id) => handleNavigate(sec as NavSection, id)}
                  />
                )}

                {currentSection === 'rings' && (
                  <SplitterRingView
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                    onNavigateToDetail={(sec, id) => handleNavigate(sec as NavSection, id)}
                  />
                )}

                {currentSection === 'hierarchy' && (
                  <NetworkHierarchyView
                    db={db}
                    onNavigateToAsset={(sec, id) => handleNavigate(sec as NavSection, id)}
                  />
                )}

                {currentSection === 'topology' && (
                  <NetworkTopologyView
                    db={db}
                    onNavigateToAsset={(sec, id) => handleNavigate(sec as NavSection, id)}
                    onLaunchTrace={handleLaunchTrace}
                  />
                )}

                {currentSection === 'health' && (
                  <DocumentationHealthView
                    db={db}
                    onNavigateToAsset={(sec, id) => handleNavigate(sec as NavSection, id)}
                  />
                )}

                {currentSection === 'changes' && (
                  <ChangeRequestView
                    db={db}
                    onNavigateToAsset={(sec, id) => handleNavigate(sec as NavSection, id)}
                  />
                )}

                {currentSection === 'cores' && (
                  <CoreManagement
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                  />
                )}

                {currentSection === 'jointBoxes' && (
                  <JointBoxManagement
                    db={db}
                    selectedJbId={selectedJbId}
                    onLaunchTrace={handleLaunchTrace}
                    onOpenSchematic={(jbId) => handleNavigate('schematics', jbId)}
                  />
                )}

                {currentSection === 'schematics' && (
                  <SchematicGeneratorView
                    db={db}
                    initialJbId={selectedSchematicJbId}
                    initialCableId={selectedSchematicCableId}
                    initialMode={selectedSchematicCableId ? 'CABLE' : 'JOINT_BOX'}
                    onLaunchTrace={handleLaunchTrace}
                  />
                )}

                {currentSection === 'splitters' && (
                  <SplitterManagement
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                    onNavigateToCustomer={(custId) => {
                      setCurrentSection('customers');
                    }}
                  />
                )}

                {currentSection === 'devices' && (
                  <DeviceManagement
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                  />
                )}

                {currentSection === 'discovery' && (
                  <NetworkDiscoveryView
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                  />
                )}

                {currentSection === 'inventory' && (
                  <CableInventoryView
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                    onNavigateToCores={(cableId) => {
                      setCurrentSection('cores');
                    }}
                    onOpenSchematic={(cableId) => handleNavigate('schematics', cableId, 'cable')}
                  />
                )}

                {currentSection === 'customers' && (
                  <CustomerManagement
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                  />
                )}

                {currentSection === 'maintenance' && (
                  <MaintenanceView
                    db={db}
                    onLaunchTrace={handleLaunchTrace}
                  />
                )}

                {currentSection === 'users' && (
                  <UserManagementView db={db} />
                )}

                {currentSection === 'audit' && (
                  <AuditHistoryView db={db} />
                )}

                {currentSection === 'colors' && (
                  <ColorManagementView db={db} />
                )}

                {currentSection === 'reports' && (
                  <ReportsView db={db} />
                )}

                {currentSection === 'suppliers' && (
                  <SupplierManagement db={db} />
                )}

                {currentSection === 'backup' && (
                  <BackupRestoreView db={db} />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        db={db}
        onNavigate={handleNavigate}
        onLaunchTrace={handleLaunchTrace}
      />

      <LANAccessModal
        isOpen={isLANModalOpen}
        onClose={() => setIsLANModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setDb(getDatabase());
        }}
        currentUser={db.currentUser}
      />
    </div>
  );
}

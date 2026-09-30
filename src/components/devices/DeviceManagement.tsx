import React, { useState } from 'react';
import { 
  Server, 
  Cpu, 
  Plus, 
  Search, 
  GitBranch, 
  Edit2, 
  Trash2, 
  Zap, 
  Layers, 
  X, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { OptiFiberDatabase, OLT, PONPort, SwitchDevice, SFPModule } from '../../types';
import { 
  addOLT, 
  updateOLT, 
  deleteOLT, 
  addSwitch, 
  updateSwitch, 
  deleteSwitch, 
  saveDatabase, 
  getDatabase 
} from '../../services/storage';

interface DeviceManagementProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
}

export const DeviceManagement: React.FC<DeviceManagementProps> = ({
  db,
  onLaunchTrace,
}) => {
  const [activeTab, setActiveTab] = useState<'OLT' | 'PON' | 'SWITCH' | 'SFP'>('OLT');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOltOpen, setIsAddOltOpen] = useState(false);
  const [isAddSwitchOpen, setIsAddSwitchOpen] = useState(false);
  const [editingOlt, setEditingOlt] = useState<OLT | null>(null);
  const [editingSwitch, setEditingSwitch] = useState<SwitchDevice | null>(null);

  const [oltForm, setOltForm] = useState<Partial<OLT>>({
    name: '',
    model: 'Huawei SmartAX MA5800-X7',
    ip: '10.100.1.15',
    popId: db.pops[0]?.id || '',
    location: 'Rack R-01',
    totalSlots: 7,
    cards: ['H901MPLA (Control)', 'H901GPSF (16-Port GPON)'],
    ponPortsCount: 16,
    uplinkPortsCount: 4,
    sfpPortsCount: 20,
    status: 'Active',
    firmware: 'V100R019C12',
    notes: '',
  });

  const [switchForm, setSwitchForm] = useState<Partial<SwitchDevice>>({
    name: '',
    model: 'Cisco Catalyst 3850-24S-S',
    ip: '10.100.1.5',
    popId: db.pops[0]?.id || '',
    location: 'Rack R-01, Unit 35',
    portCount: 24,
    sfpPortsCount: 24,
    status: 'Active',
    vlans: ['VLAN-10', 'VLAN-100'],
    connectedDevice: 'Core Router Transit',
    notes: '',
  });

  const handleSaveOlt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oltForm.name) return;
    if (editingOlt) {
      updateOLT(editingOlt.id, oltForm, 'Updated OLT configuration');
      setEditingOlt(null);
    } else {
      addOLT(oltForm as Omit<OLT, 'id'>, 'Deployed new OLT chassis');
      setIsAddOltOpen(false);
    }
  };

  const handleSaveSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchForm.name) return;
    if (editingSwitch) {
      updateSwitch(editingSwitch.id, switchForm, 'Updated Switch configuration');
      setEditingSwitch(null);
    } else {
      addSwitch(switchForm as Omit<SwitchDevice, 'id'>, 'Installed aggregation switch');
      setIsAddSwitchOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <span>Active Network Equipment (OLT, PON, Switches, SFPs)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Link physical optical fibers directly with central office headend electronics, transceivers and VLAN ports
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'OLT' && (
            <button
              onClick={() => {
                setEditingOlt(null);
                setOltForm({
                  name: `OLT-NODE-${db.olts.length + 1}`,
                  model: 'Huawei SmartAX MA5800-X7',
                  ip: `10.100.${db.olts.length + 1}.10`,
                  popId: db.pops[0]?.id || '',
                  location: 'Rack R-01',
                  totalSlots: 7,
                  cards: ['H901MPLA', 'H901GPSF'],
                  ponPortsCount: 16,
                  uplinkPortsCount: 4,
                  sfpPortsCount: 20,
                  status: 'Active',
                  firmware: 'V100R019C12',
                  notes: '',
                });
                setIsAddOltOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add OLT</span>
            </button>
          )}

          {activeTab === 'SWITCH' && (
            <button
              onClick={() => {
                setEditingSwitch(null);
                setSwitchForm({
                  name: `SW-AGG-${db.switches.length + 1}`,
                  model: 'Cisco Catalyst 3850',
                  ip: `10.100.${db.switches.length + 1}.2`,
                  popId: db.pops[0]?.id || '',
                  location: 'Rack R-02',
                  portCount: 24,
                  sfpPortsCount: 24,
                  status: 'Active',
                  vlans: ['VLAN-100', 'VLAN-200'],
                  connectedDevice: 'Core Router',
                  notes: '',
                });
                setIsAddSwitchOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Switch</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('OLT')}
          className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'OLT'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          OLT Chassis ({db.olts.length})
        </button>
        <button
          onClick={() => setActiveTab('PON')}
          className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'PON'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          PON Ports ({db.ponPorts.length})
        </button>
        <button
          onClick={() => setActiveTab('SWITCH')}
          className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'SWITCH'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Switches ({db.switches.length})
        </button>
        <button
          onClick={() => setActiveTab('SFP')}
          className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'SFP'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          SFP Modules ({db.sfps.length})
        </button>
      </div>

      {/* TAB 1: OLTs */}
      {activeTab === 'OLT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.olts.map((olt) => {
            const pop = db.pops.find(p => p.id === olt.popId);
            const ponPorts = db.ponPorts.filter(p => p.oltId === olt.id);
            const activeOnusTotal = ponPorts.reduce((acc, p) => acc + p.activeOnus, 0);

            return (
              <div key={olt.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{olt.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{olt.model} · {olt.ip}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {db.telemetry?.[olt.id] && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                        db.telemetry[olt.id].pingStatus === 'Online'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${db.telemetry[olt.id].pingStatus === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {db.telemetry[olt.id].pingStatus} ({db.telemetry[olt.id].latencyMs}ms)
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      olt.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {olt.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Headend POP</span>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">{pop?.name || 'Central POP'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">PON Ports</span>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">{olt.ponPortsCount}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Active ONUs</span>
                    <p className="font-bold text-emerald-700 mt-0.5 font-mono">{activeOnusTotal}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Installed Line Cards:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {olt.cards.map((card, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                        {card}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onLaunchTrace('OLT', olt.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Trace OLT Infrastructure</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingOlt(olt);
                        setOltForm({ ...olt });
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteOLT(olt.id, 'Decommissioned OLT')}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PON Ports */}
      {activeTab === 'PON' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Port Name</th>
                <th className="py-3 px-4">OLT</th>
                <th className="py-3 px-4">Tx Optical Power</th>
                <th className="py-3 px-4">Wavelength</th>
                <th className="py-3 px-4">Connected Fiber & Core</th>
                <th className="py-3 px-4">Subscribers</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {db.ponPorts.map((pon) => {
                const olt = db.olts.find(o => o.id === pon.oltId);
                const cable = db.cables.find(c => c.id === pon.connectedFiberCableId);
                return (
                  <tr key={pon.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {pon.name}
                    </td>
                    <td className="py-3 px-4">
                      {olt?.name || pon.oltId}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      +{pon.txPower} dBm
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      {pon.wavelength}
                    </td>
                    <td className="py-3 px-4">
                      {cable ? (
                        <div className="font-mono text-blue-700">
                          {cable.cableId} ➔ Core #{pon.connectedCoreNumber}
                        </div>
                      ) : (
                        <span className="text-slate-400">Unconnected</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {pon.activeOnus} / {pon.maxOnus} ONUs
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {pon.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onLaunchTrace('PON', pon.id)}
                        className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md cursor-pointer flex items-center gap-1 inline-flex"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Trace</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Switches */}
      {activeTab === 'SWITCH' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.switches.map((sw) => {
            const pop = db.pops.find(p => p.id === sw.popId);
            return (
              <div key={sw.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sw.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{sw.model} · {sw.ip}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {db.telemetry?.[sw.id] && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                        db.telemetry[sw.id].pingStatus === 'Online'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${db.telemetry[sw.id].pingStatus === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {db.telemetry[sw.id].pingStatus} ({db.telemetry[sw.id].latencyMs}ms)
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                      {sw.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">POP Location</span>
                    <p className="font-bold text-slate-900 mt-0.5">{pop?.name || 'Headend'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Ports</span>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">{sw.portCount} (SFPs: {sw.sfpPortsCount})</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Configured VLANs:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sw.vlans.map((vlan, i) => (
                      <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                        {vlan}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Uplink: <span className="font-semibold text-slate-700">{sw.connectedDevice || 'Core Aggregation'}</span>
                </p>

                <div className="flex justify-end gap-1 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingSwitch(sw);
                      setSwitchForm({ ...sw });
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSwitch(sw.id, 'Decommissioned switch')}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: SFP Modules */}
      {activeTab === 'SFP' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Model & Type</th>
                <th className="py-3 px-4">Wavelength</th>
                <th className="py-3 px-4">Reach</th>
                <th className="py-3 px-4">Tx Power</th>
                <th className="py-3 px-4">Rx Sensitivity</th>
                <th className="py-3 px-4">Assigned Port</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {db.sfps.map((sfp) => (
                <tr key={sfp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {sfp.serialNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{sfp.model}</span>
                    <span className="text-[10px] block text-slate-400 font-mono">{sfp.type} · {sfp.connector}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {sfp.wavelength}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {sfp.reachKm} km
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    +{sfp.txPowerDbm} dBm
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {sfp.rxSensitivityDbm} dBm
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-700 truncate max-w-[150px]">
                    {sfp.assignedPort || 'Warehouse Spare'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      sfp.status === 'In Service' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sfp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit OLT Modal */}
      {(isAddOltOpen || editingOlt) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSaveOlt}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAddOltOpen ? 'Deploy Optical Line Terminal (OLT)' : `Edit OLT: ${editingOlt?.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOltOpen(false);
                    setEditingOlt(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">OLT Name *</label>
                    <input
                      type="text"
                      required
                      value={oltForm.name || ''}
                      onChange={(e) => setOltForm({ ...oltForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IP Address</label>
                    <input
                      type="text"
                      value={oltForm.ip || ''}
                      onChange={(e) => setOltForm({ ...oltForm, ip: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={oltForm.model || ''}
                      onChange={(e) => setOltForm({ ...oltForm, model: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Headend POP</label>
                    <select
                      value={oltForm.popId || ''}
                      onChange={(e) => setOltForm({ ...oltForm, popId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    >
                      {db.pops.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Slots</label>
                    <input
                      type="number"
                      value={oltForm.totalSlots || 7}
                      onChange={(e) => setOltForm({ ...oltForm, totalSlots: parseInt(e.target.value) || 2 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PON Ports</label>
                    <input
                      type="number"
                      value={oltForm.ponPortsCount || 16}
                      onChange={(e) => setOltForm({ ...oltForm, ponPortsCount: parseInt(e.target.value) || 16 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={oltForm.status || 'Active'}
                      onChange={(e) => setOltForm({ ...oltForm, status: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                    >
                      <option value="Active">Active</option>
                      <option value="Warning">Warning</option>
                      <option value="Down">Down</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOltOpen(false);
                    setEditingOlt(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Save OLT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

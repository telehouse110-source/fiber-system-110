import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Route, 
  Boxes, 
  Split, 
  Users, 
  Server, 
  Disc, 
  GitBranch, 
  ArrowRight,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: OptiFiberDatabase;
  onNavigate: (section: any, id?: string) => void;
  onLaunchTrace: (type: any, id: string) => void;
}

interface SearchResultItem {
  id: string;
  category: 'Route' | 'Cable' | 'Core' | 'JointBox' | 'Splitter' | 'Customer' | 'Device' | 'Ticket';
  title: string;
  subtitle: string;
  relationshipChain?: string;
  section: string;
  traceType?: any;
  targetId: string;
  status?: string;
  colorHex?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  db,
  onNavigate,
  onLaunchTrace,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search execution
  const results: SearchResultItem[] = [];

  if (q.length >= 1) {
    // 1. Routes
    db.routes.forEach(r => {
      if (
        r.routeName.toLowerCase().includes(q) ||
        r.routeId.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.zone.toLowerCase().includes(q) ||
        r.roadStreet.toLowerCase().includes(q)
      ) {
        results.push({
          id: r.id,
          category: 'Route',
          title: `${r.routeName} (${r.routeId})`,
          subtitle: `${r.fiberType} · ${r.coreCount} Cores · ${r.cableLengthMeters}m · Area: ${r.area}`,
          relationshipChain: `${r.startPoint} ➔ ${r.endPoint}`,
          section: 'routes',
          targetId: r.id,
          status: r.status,
        });
      }
    });

    // 2. Cables
    db.cables.forEach(c => {
      if (
        c.cableId.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.batchNumber.toLowerCase().includes(q) ||
        c.startLocation.toLowerCase().includes(q) ||
        c.endLocation.toLowerCase().includes(q)
      ) {
        const route = db.routes.find(r => r.id === c.routeId);
        results.push({
          id: c.id,
          category: 'Cable',
          title: `Cable ${c.cableId} (${c.brand})`,
          subtitle: `${c.coreCount} Cores · ${c.cableType} · Route: ${route?.routeId || 'N/A'}`,
          relationshipChain: `${c.startLocation} ➔ ${c.endLocation}`,
          section: 'inventory',
          traceType: 'CABLE',
          targetId: c.id,
          status: c.status,
        });
      }
    });

    // 3. Cores (Core number, color name, notes, connection)
    db.cores.forEach(core => {
      const matchCoreNum = q.includes(core.coreNumber.toString());
      const matchColor = core.colorName.toLowerCase().includes(q);
      const matchNotes = (core.notes || '').toLowerCase().includes(q);
      const matchCable = core.cableId.toLowerCase().includes(q);

      if (matchColor || (matchCoreNum && (q.includes('core') || matchCable)) || matchNotes) {
        // Resolve relationship: Cable -> Splice or Device
        const cable = db.cables.find(c => c.id === core.cableId);
        const splice = db.splices.find(
          s => (s.incomingCableId === core.cableId && s.incomingCoreNumber === core.coreNumber) ||
               (s.outgoingCableId === core.cableId && s.outgoingCoreNumber === core.coreNumber)
        );
        let chain = `${core.cableId} Core #${core.coreNumber}`;
        if (splice) {
          chain += ` ➔ Spliced (${splice.incomingCoreColor} C#${splice.incomingCoreNumber} ➔ ${splice.outgoingCoreColor} C#${splice.outgoingCoreNumber})`;
        } else if (core.connectedToLabel) {
          chain += ` ➔ ${core.connectedToLabel}`;
        }

        results.push({
          id: core.id,
          category: 'Core',
          title: `${cable?.cableId || core.cableId} — Core #${core.coreNumber} (${core.colorName})`,
          subtitle: `Status: ${core.status} · Power: ${core.signalPowerDbm ? core.signalPowerDbm + ' dBm' : 'Untested'} · Loss: ${core.attenuationLossDb} dB/km`,
          relationshipChain: chain,
          section: 'cores',
          traceType: 'CORE',
          targetId: core.id,
          status: core.status,
          colorHex: core.colorHex,
        });
      }
    });

    // 4. Joint Boxes
    db.jointBoxes.forEach(jb => {
      if (
        jb.name.toLowerCase().includes(q) ||
        jb.jointBoxId.toLowerCase().includes(q) ||
        jb.location.toLowerCase().includes(q) ||
        jb.area.toLowerCase().includes(q) ||
        jb.technician.toLowerCase().includes(q)
      ) {
        const splicesCount = db.splices.filter(s => s.jointBoxId === jb.id).length;
        results.push({
          id: jb.id,
          category: 'JointBox',
          title: `${jb.name} (${jb.jointBoxId})`,
          subtitle: `${jb.type} Closure · ${splicesCount} Splices · ${jb.location}`,
          relationshipChain: `Incoming: ${jb.incomingCableIds.length} cables ➔ Outgoing: ${jb.outgoingCableIds.length} cables`,
          section: 'jointBoxes',
          traceType: 'JOINT_BOX',
          targetId: jb.id,
          status: jb.maintenanceStatus === 'Good' ? 'Active' : 'Warning',
        });
      }
    });

    // 5. Splitters
    db.splitters.forEach(spl => {
      if (
        spl.splitterId.toLowerCase().includes(q) ||
        (spl.name && spl.name.toLowerCase().includes(q)) ||
        spl.location.toLowerCase().includes(q) ||
        spl.splitRatio.toLowerCase().includes(q)
      ) {
        const connectedCusts = spl.ports.filter(p => p.connectedCustomerId).length;
        results.push({
          id: spl.id,
          category: 'Splitter',
          title: `${spl.name || spl.splitterId} (${spl.splitRatio})`,
          subtitle: `Expected Loss: ${spl.expectedLossDb} dB · ${connectedCusts}/${spl.ports.length} Active Subscribers`,
          relationshipChain: `Input: ${spl.inputSourceLabel} ➔ Output: ${spl.ports.length} Ports`,
          section: 'splitters',
          traceType: 'SPLITTER',
          targetId: spl.id,
          status: spl.status,
        });
      }
    });

    // 6. Customers
    db.customers.forEach(cust => {
      if (
        cust.name.toLowerCase().includes(q) ||
        cust.customerId.toLowerCase().includes(q) ||
        cust.phone.toLowerCase().includes(q) ||
        cust.onuMac.toLowerCase().includes(q) ||
        cust.onuSerial.toLowerCase().includes(q) ||
        cust.onuModel.toLowerCase().includes(q) ||
        cust.address.toLowerCase().includes(q)
      ) {
        const splitter = db.splitters.find(s => s.id === cust.splitterId);
        results.push({
          id: cust.id,
          category: 'Customer',
          title: `${cust.name} (${cust.customerId})`,
          subtitle: `${cust.package} · ONU: ${cust.onuModel} · MAC: ${cust.onuMac} · Rx: ${cust.rxPowerDbm} dBm`,
          relationshipChain: `Splitter: ${splitter?.splitterId || 'Direct'} Port #${cust.splitterPortNumber || 1} ➔ Drop ${cust.dropCableLengthM}m ➔ ONU`,
          section: 'customers',
          traceType: 'CUSTOMER',
          targetId: cust.id,
          status: cust.status,
        });
      }
    });

    // 7. Devices (OLT, PON, Switch)
    db.olts.forEach(olt => {
      if (olt.name.toLowerCase().includes(q) || olt.model.toLowerCase().includes(q) || olt.ip.toLowerCase().includes(q)) {
        results.push({
          id: olt.id,
          category: 'Device',
          title: `OLT: ${olt.name} (${olt.model})`,
          subtitle: `IP: ${olt.ip} · Slots: ${olt.totalSlots} · PON Ports: ${olt.ponPortsCount}`,
          section: 'devices',
          traceType: 'OLT',
          targetId: olt.id,
          status: olt.status,
        });
      }
    });

    db.ponPorts.forEach(pon => {
      if (pon.name.toLowerCase().includes(q) || pon.wavelength.toLowerCase().includes(q)) {
        results.push({
          id: pon.id,
          category: 'Device',
          title: `PON Port: ${pon.name}`,
          subtitle: `Tx: +${pon.txPower} dBm · Active ONUs: ${pon.activeOnus}/${pon.maxOnus}`,
          relationshipChain: `Fiber Cable: ${pon.connectedFiberCableId || 'Unassigned'} Core #${pon.connectedCoreNumber || 1}`,
          section: 'devices',
          traceType: 'PON',
          targetId: pon.id,
          status: pon.status,
        });
      }
    });

    db.switches.forEach(sw => {
      if (sw.name.toLowerCase().includes(q) || sw.model.toLowerCase().includes(q) || sw.ip.toLowerCase().includes(q)) {
        results.push({
          id: sw.id,
          category: 'Device',
          title: `Switch: ${sw.name} (${sw.model})`,
          subtitle: `IP: ${sw.ip} · Ports: ${sw.portCount} · SFPs: ${sw.sfpPortsCount}`,
          relationshipChain: sw.connectedDevice || 'Core Aggregation',
          section: 'devices',
          targetId: sw.id,
          status: sw.status,
        });
      }
    });

    // 8. Ducts
    (db.ducts || []).forEach(d => {
      if (
        d.name.toLowerCase().includes(q) ||
        d.assetId.toLowerCase().includes(q) ||
        d.road.toLowerCase().includes(q) ||
        d.startPoint.toLowerCase().includes(q) ||
        d.endPoint.toLowerCase().includes(q)
      ) {
        results.push({
          id: d.id,
          category: 'Route',
          title: `Duct: ${d.name} (${d.assetId})`,
          subtitle: `${d.type} · Ways: ${d.occupiedWays}/${d.totalDuctWays} · Length: ${d.lengthMeters}m · Road: ${d.road}`,
          relationshipChain: `${d.startPoint} ➔ ${d.endPoint} (${d.assignedCableIds.length} cables)`,
          section: 'ducts',
          targetId: d.id,
          status: d.damagedWays > 0 ? 'Warning' : 'Active',
        });
      }
    });

    // 9. Splitter Rings
    (db.splitterRings || []).forEach(ring => {
      if (
        ring.name.toLowerCase().includes(q) ||
        ring.assetId.toLowerCase().includes(q) ||
        ring.startPoint.toLowerCase().includes(q) ||
        ring.endPoint.toLowerCase().includes(q)
      ) {
        results.push({
          id: ring.id,
          category: 'Splitter',
          title: `Ring: ${ring.name} (${ring.assetId})`,
          subtitle: `${ring.type} · ${ring.jointBoxIds.length} Joint Boxes · ${ring.splitterIds.length} Splitters`,
          relationshipChain: `${ring.startPoint} ➔ Primary & Backup Paths`,
          section: 'rings',
          targetId: ring.id,
          status: ring.status,
        });
      }
    });

    // 10. Change Requests (MCR)
    (db.changeRequests || []).forEach(mcr => {
      if (
        mcr.title.toLowerCase().includes(q) ||
        mcr.changeId.toLowerCase().includes(q) ||
        mcr.requestedBy.toLowerCase().includes(q) ||
        mcr.technician.toLowerCase().includes(q)
      ) {
        results.push({
          id: mcr.id,
          category: 'Ticket',
          title: `MCR: ${mcr.title} (${mcr.changeId})`,
          subtitle: `Status: ${mcr.approvalStatus} · Requested: ${mcr.requestedBy} · Tech: ${mcr.technician}`,
          relationshipChain: `Reason: ${mcr.reason}`,
          section: 'changes',
          targetId: mcr.id,
          status: mcr.approvalStatus,
        });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any fiber, core number (e.g. 'Core 4 Orange'), joint box, splitter, customer, ONU MAC, IP..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="py-10 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Global ISP Fiber Infrastructure Search</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for <span className="font-semibold text-slate-600">"Orange Core 4"</span>, <span className="font-semibold text-slate-600">"JB-001"</span>, <span className="font-semibold text-slate-600">"SPL-01"</span>, or <span className="font-semibold text-slate-600">"Apex Robotics"</span>.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <p className="text-sm font-medium text-slate-600">No matching fiber assets found</p>
              <p className="text-xs text-slate-400 mt-1">Check the spelling or try searching by core number, color, or location.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Search Results ({results.length})</span>
                <span className="text-[10px] text-slate-400 lowercase">Click item to view or trace</span>
              </div>
              {results.slice(0, 30).map((item) => (
                <div
                  key={`${item.category}-${item.id}`}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group border border-transparent hover:border-slate-200"
                >
                  <div
                    onClick={() => {
                      onNavigate(item.section, item.targetId);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {item.colorHex ? (
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                      ) : (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          {item.category}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {item.title}
                      </span>
                      {item.status && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          item.status === 'Active' || item.status === 'Good'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'Fault' || item.status === 'Cut' || item.status === 'LOS'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                    {item.relationshipChain && (
                      <p className="text-[11px] text-blue-600 font-mono flex items-center gap-1 mt-1 truncate">
                        <GitBranch className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.relationshipChain}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                    {item.traceType && (
                      <button
                        onClick={() => {
                          onLaunchTrace(item.traceType, item.targetId);
                          onClose();
                        }}
                        className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        title="Trace full bidirectional fiber path"
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>Trace</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onNavigate(item.section, item.targetId);
                        onClose();
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                      title="View Details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Esc</kbd> to close</span>
            <span><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Ctrl+K</kbd> anywhere</span>
          </div>
          <span className="text-slate-500">OptiFiber Global Index</span>
        </div>
      </div>
    </div>
  );
};

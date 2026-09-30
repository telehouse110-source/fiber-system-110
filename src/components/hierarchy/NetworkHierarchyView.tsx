import React, { useState } from 'react';
import { 
  FolderTree, 
  MapPin, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Disc, 
  Boxes, 
  Split, 
  Users, 
  Server, 
  Route as RouteIcon,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Compass
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';

interface NetworkHierarchyViewProps {
  db: OptiFiberDatabase;
  onNavigateToAsset?: (section: string, id: string) => void;
}

export const NetworkHierarchyView: React.FC<NetworkHierarchyViewProps> = ({
  db,
  onNavigateToAsset,
}) => {
  const [search, setSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'zon-01': true,
    'ara-01': true,
    'ara-02': true,
    'dct-01': true,
    'rte-01': true,
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    (db.zones || []).forEach(z => { all[z.id] = true; });
    (db.areas || []).forEach(a => { all[a.id] = true; });
    (db.ducts || []).forEach(d => { all[d.id] = true; });
    (db.routes || []).forEach(r => { all[r.id] = true; });
    (db.jointBoxes || []).forEach(j => { all[j.id] = true; });
    (db.splitters || []).forEach(s => { all[s.id] = true; });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  11-Tier Network Infrastructure & Location Hierarchy
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold">
                  Inherited Context
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ZONE ➔ AREA ➔ ROAD ➔ DUCT ➔ ROUTE ➔ SEGMENT ➔ JOINT BOX ➔ SPLICE ➔ SPLITTER ➔ DISTRIBUTION ➔ CUSTOMER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Hierarchy Explanation Banner */}
        <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900 font-medium overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span>Automatic Inheritance Rule:</span>
          </div>
          <span className="text-indigo-700 text-[11px] truncate ml-2">
            All cables, closures, splitters, and drop lines automatically inherit zone & area boundaries from parent civil duct banks and road routes.
          </span>
        </div>
      </div>

      {/* Expandable Hierarchy Tree */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="space-y-4">
          {(db.zones || []).map(zone => {
            const isZoneExpanded = !!expandedNodes[zone.id];
            const zoneAreas = (db.areas || []).filter(a => a.zoneId === zone.id || a.zoneName === zone.name);
            const zoneRoutes = db.routes.filter(r => r.zone === zone.name);
            const zoneJbs = db.jointBoxes.filter(j => j.zone === zone.name);
            const zoneDucts = (db.ducts || []).filter(d => d.zone === zone.name);

            return (
              <div key={zone.id} className="border border-slate-200 rounded-xl overflow-hidden">
                {/* Level 1: ZONE Header */}
                <div 
                  onClick={() => toggleNode(zone.id)}
                  className="flex items-center justify-between p-3.5 bg-slate-100/70 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    {isZoneExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {zone.assetId}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{zone.name}</span>
                    <span className="text-xs text-slate-500">({zone.code})</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    {zoneAreas.length} Areas · {zoneDucts.length} Ducts · {zoneRoutes.length} Routes · {zoneJbs.length} JBs
                  </div>
                </div>

                {/* Level 2: AREAS inside Zone */}
                {isZoneExpanded && (
                  <div className="p-4 space-y-3 bg-white">
                    {zoneAreas.map(area => {
                      const isAreaExpanded = !!expandedNodes[area.id];
                      const areaRoads = (db.roads || []).filter(r => r.areaId === area.id || r.areaName === area.name);
                      const areaDucts = (db.ducts || []).filter(d => d.area === area.name);
                      const areaRoutes = db.routes.filter(r => r.area === area.name);
                      const areaJbs = db.jointBoxes.filter(j => j.area === area.name);

                      return (
                        <div key={area.id} className="border border-slate-200 rounded-lg overflow-hidden ml-4">
                          {/* AREA Node */}
                          <div 
                            onClick={() => toggleNode(area.id)}
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isAreaExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                                {area.assetId}
                              </span>
                              <span className="font-semibold text-slate-800 text-xs">{area.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {areaRoads.length} Roads · {areaDucts.length} Ducts · {areaRoutes.length} Routes
                            </span>
                          </div>

                          {/* Roads & Ducts inside Area */}
                          {isAreaExpanded && (
                            <div className="p-3 space-y-2 bg-slate-50/30 border-t border-slate-200">
                              {/* Roads */}
                              {areaRoads.map(road => (
                                <div key={road.id} className="ml-4 flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md text-xs">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-rose-500" />
                                    <span className="font-mono text-[10px] text-slate-400">{road.assetId}</span>
                                    <span className="font-medium text-slate-800">{road.name}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">Street Corridor</span>
                                </div>
                              ))}

                              {/* Ducts under this Area */}
                              {areaDucts.map(duct => {
                                const isDuctExpanded = !!expandedNodes[duct.id];
                                return (
                                  <div key={duct.id} className="ml-4 border border-slate-200 rounded-md overflow-hidden bg-white">
                                    <div 
                                      onClick={() => toggleNode(duct.id)}
                                      className="flex items-center justify-between p-2 bg-cyan-50/40 hover:bg-cyan-50 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        {isDuctExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        <Layers className="w-3.5 h-3.5 text-cyan-700" />
                                        <span className="font-mono text-[11px] font-bold text-cyan-800">{duct.assetId}</span>
                                        <span className="font-semibold text-slate-800 text-xs">{duct.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-cyan-700">
                                          {duct.occupiedWays}/{duct.totalDuctWays} Ways ({duct.lengthMeters}m)
                                        </span>
                                        {onNavigateToAsset && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); onNavigateToAsset('ducts', duct.id); }}
                                            className="text-blue-600 hover:underline text-[10px]"
                                          >
                                            View
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Fiber Cables & Segments inside Duct */}
                                    {isDuctExpanded && (
                                      <div className="p-2 space-y-1.5 bg-slate-50/50 border-t border-slate-100">
                                        {duct.assignedCableIds.map(cableId => {
                                          const cable = db.cables.find(c => c.id === cableId || c.cableId === cableId);
                                          const segments = (db.fiberSegments || []).filter(s => s.cableId === cable?.id || s.cableId === cableId);

                                          return (
                                            <div key={cableId} className="ml-4 p-2 bg-white border border-slate-200 rounded text-xs">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                                  <span className="font-bold text-slate-800">{cable?.cableId || cableId}</span>
                                                  <span className="text-[10px] text-slate-400 font-mono">({cable?.coreCount} Cores)</span>
                                                </div>
                                                {onNavigateToAsset && cable && (
                                                  <button
                                                    onClick={() => onNavigateToAsset('inventory', cable.id)}
                                                    className="text-blue-600 hover:underline text-[10px]"
                                                  >
                                                    View Cable
                                                  </button>
                                                )}
                                              </div>

                                              {/* Segments breakdown */}
                                              {segments.length > 0 && (
                                                <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1 pl-2">
                                                  {segments.map(seg => (
                                                    <div key={seg.id} className="flex items-center justify-between text-[11px] text-slate-600">
                                                      <span>{seg.name} ({seg.assetId})</span>
                                                      <span className="font-mono text-[10px] text-slate-400">{seg.lengthMeters}m · {seg.activeCores} Active</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Joint Boxes in Area */}
                              {areaJbs.map(jb => (
                                <div key={jb.id} className="ml-4 flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md text-xs">
                                  <div className="flex items-center gap-2">
                                    <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                                    <span className="font-mono text-[11px] font-bold text-indigo-700">{jb.jointBoxId}</span>
                                    <span className="font-medium text-slate-800">{jb.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-mono">{jb.type} Closure</span>
                                    {onNavigateToAsset && (
                                      <button
                                        onClick={() => onNavigateToAsset('jointBoxes', jb.id)}
                                        className="text-blue-600 hover:underline text-[10px]"
                                      >
                                        Splices
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

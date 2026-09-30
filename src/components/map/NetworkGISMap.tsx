import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Plus, 
  Route as RouteIcon, 
  Boxes, 
  Split, 
  Users, 
  AlertTriangle, 
  Check, 
  X, 
  Building2,
  GitBranch,
  Eye
} from 'lucide-react';
import { OptiFiberDatabase, FiberRoute, JointBox, OpticalSplitter, Customer, POP } from '../../types';
import { addRoute, addJointBox, addSplitter, addCustomer } from '../../services/storage';

interface NetworkGISMapProps {
  db: OptiFiberDatabase;
  onLaunchTrace: (type: any, id: string) => void;
  onNavigateToDetail: (section: string, id: string) => void;
}

export const NetworkGISMap: React.FC<NetworkGISMapProps> = ({
  db,
  onLaunchTrace,
  onNavigateToDetail,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const drawPolylineRef = useRef<L.Polyline | null>(null);

  // Layer filter state
  const [showRoutes, setShowRoutes] = useState(true);
  const [showJointBoxes, setShowJointBoxes] = useState(true);
  const [showSplitters, setShowSplitters] = useState(true);
  const [showPops, setShowPops] = useState(true);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showFaults, setShowFaults] = useState(true);

  // Interactive Map Drawing Mode
  const [isDrawRouteMode, setIsDrawRouteMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [newRouteName, setNewRouteName] = useState('New Fiber Route');
  const [newRouteCores, setNewRouteCores] = useState(24);

  // Quick Add Pin Mode
  const [addPinType, setAddPinType] = useState<'NONE' | 'JOINT_BOX' | 'SPLITTER' | 'CUSTOMER'>('NONE');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initialize Leaflet map centered around Metro POP
    const map = L.map(mapContainerRef.current, {
      center: [37.7850, -122.4080],
      zoom: 14,
      zoomControl: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | OptiFiber GIS',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Click handler on map
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      // Drawing route waypoints
      if (isDrawRouteMode) {
        setDrawnPoints(prev => [...prev, [lat, lng]]);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Draw Polyline
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (drawPolylineRef.current) {
      drawPolylineRef.current.remove();
      drawPolylineRef.current = null;
    }

    if (isDrawRouteMode && drawnPoints.length > 0) {
      const poly = L.polyline(drawnPoints, {
        color: '#2563EB',
        weight: 4,
        dashArray: '6, 6',
      }).addTo(mapInstanceRef.current);
      drawPolylineRef.current = poly;
    }
  }, [isDrawRouteMode, drawnPoints]);

  // Render Map Features (Polylines, Joint Boxes, Splitters, POPs, Customers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Fiber Routes (Polylines)
    if (showRoutes) {
      db.routes.forEach((route) => {
        if (!route.coordinates || route.coordinates.length < 2) return;
        const latlngs = route.coordinates.map(c => [c.lat, c.lng] as [number, number]);

        const polyline = L.polyline(latlngs, {
          color: route.status === 'Active' ? '#2563EB' : '#DC2626',
          weight: route.coreCount >= 48 ? 5 : 3.5,
          opacity: 0.85,
        });

        polyline.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <p class="font-bold text-slate-900">${route.routeName}</p>
            <p class="font-mono text-slate-500">${route.routeId} · ${route.coreCount} Cores (${route.fiberType})</p>
            <p class="text-slate-600 mt-1">Length: ${(route.cableLengthMeters / 1000).toFixed(2)} km</p>
            <p class="text-slate-500 text-[10px] mt-0.5">${route.startPoint} ➔ ${route.endPoint}</p>
          </div>
        `);

        group.addLayer(polyline);
      });
    }

    // 2. Core POPs
    if (showPops) {
      db.pops.forEach(pop => {
        const popIcon = L.divIcon({
          className: 'custom-pop-icon',
          html: `
            <div style="background-color: #0F172A; color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              POP
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([pop.latitude, pop.longitude], { icon: popIcon });
        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <p class="font-bold text-slate-900">${pop.name}</p>
            <p class="text-slate-500 font-mono text-[10px]">${pop.code} · ${pop.area}</p>
            <p class="text-slate-600 mt-1">${pop.address}</p>
            <p class="text-slate-500 text-[10px] mt-0.5">${pop.powerBackup}</p>
          </div>
        `);
        group.addLayer(marker);
      });
    }

    // 3. Joint Boxes
    if (showJointBoxes) {
      db.jointBoxes.forEach(jb => {
        const jbIcon = L.divIcon({
          className: 'custom-jb-icon',
          html: `
            <div style="background-color: #16A34A; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              JB
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([jb.latitude, jb.longitude], { icon: jbIcon });
        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <p class="font-bold text-slate-900">${jb.name}</p>
            <p class="font-mono text-slate-500 text-[10px]">${jb.jointBoxId} (${jb.type})</p>
            <p class="text-slate-600 mt-1">${jb.location}</p>
            <p class="text-emerald-700 text-[10px] font-semibold mt-0.5">Capacity: ${jb.maxSpliceCapacity} splices</p>
          </div>
        `);
        group.addLayer(marker);
      });
    }

    // 4. Splitters
    if (showSplitters) {
      db.splitters.forEach(spl => {
        if (!spl.latitude || !spl.longitude) return;
        const splIcon = L.divIcon({
          className: 'custom-spl-icon',
          html: `
            <div style="background-color: #EA580C; color: white; width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 9px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              SPL
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([spl.latitude, spl.longitude], { icon: splIcon });
        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <p class="font-bold text-slate-900">${spl.name || spl.splitterId}</p>
            <p class="font-mono text-slate-500 text-[10px]">${spl.splitRatio} PLC Splitter</p>
            <p class="text-slate-600 mt-1">Loss: ${spl.expectedLossDb} dB · ${spl.ports.length} Ports</p>
          </div>
        `);
        group.addLayer(marker);
      });
    }

    // 5. Customers
    if (showCustomers) {
      db.customers.forEach(cust => {
        if (!cust.latitude || !cust.longitude) return;
        const isLos = cust.status === 'LOS';
        const custIcon = L.divIcon({
          className: 'custom-cust-icon',
          html: `
            <div style="background-color: ${isLos ? '#DC2626' : '#2563EB'}; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 8px; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
              C
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([cust.latitude, cust.longitude], { icon: custIcon });
        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <p class="font-bold text-slate-900">${cust.name}</p>
            <p class="font-mono text-slate-500 text-[10px]">${cust.customerId} · ${cust.package}</p>
            <p class="text-slate-600 mt-1">Rx Power: ${cust.rxPowerDbm} dBm · ONU: ${cust.onuModel}</p>
          </div>
        `);
        group.addLayer(marker);
      });
    }

    // 6. Fault Markers
    if (showFaults) {
      db.tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').forEach(t => {
        // Place fault marker near associated route or first joint box
        const jb = t.jointBoxId ? db.jointBoxes.find(j => j.id === t.jointBoxId) : db.jointBoxes[0];
        if (jb) {
          const faultIcon = L.divIcon({
            className: 'custom-fault-icon',
            html: `
              <div style="background-color: #DC2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 0 8px #DC2626; animation: pulse 1.5s infinite;">
                !
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker([jb.latitude + 0.001, jb.longitude + 0.001], { icon: faultIcon });
          marker.bindPopup(`
            <div class="p-1 font-sans text-xs">
              <p class="font-bold text-rose-700">ALERT: ${t.problem}</p>
              <p class="font-mono text-slate-500 text-[10px]">${t.ticketId} (${t.priority} Priority)</p>
              <p class="text-slate-600 mt-1">${t.location}</p>
            </div>
          `);
          group.addLayer(marker);
        }
      });
    }
  }, [db, showRoutes, showJointBoxes, showSplitters, showPops, showCustomers, showFaults]);

  // Handle Save Drawn Route
  const handleSaveDrawnRoute = () => {
    if (drawnPoints.length < 2) return;
    const coords = drawnPoints.map((pt, i) => ({
      lat: pt[0],
      lng: pt[1],
      name: i === 0 ? 'Start Waypoint' : i === drawnPoints.length - 1 ? 'End Waypoint' : `Waypoint #${i}`,
      type: i === 0 ? ('start' as const) : i === drawnPoints.length - 1 ? ('end' as const) : ('waypoint' as const),
    }));

    // Approximate distance in meters
    let totalDist = 0;
    for (let i = 0; i < drawnPoints.length - 1; i++) {
      const lat1 = drawnPoints[i][0];
      const lon1 = drawnPoints[i][1];
      const lat2 = drawnPoints[i + 1][0];
      const lon2 = drawnPoints[i + 1][1];
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDist += 6371000 * c;
    }

    addRoute({
      routeName: newRouteName,
      routeId: `RTE-${Date.now().toString().slice(-4)}`,
      fiberType: 'G.652D',
      coreCount: newRouteCores,
      cableSizeMm: 8.5,
      startPoint: 'Drawn Point A',
      endPoint: 'Drawn Point B',
      intermediatePoints: [],
      popId: db.pops[0]?.id || '',
      area: 'Downtown Metro',
      zone: 'Zone North-A',
      roadStreet: 'GIS Geodesic Alignment',
      cableLengthMeters: Math.round(totalDist) || 1200,
      installationType: 'Aerial',
      installationDate: new Date().toISOString().split('T')[0],
      supplierId: db.suppliers[0]?.id || '',
      status: 'Active',
      maintenanceStatus: 'Normal',
      coordinates: coords,
      notes: 'Plotted directly on GIS interactive canvas',
      photos: [],
      documents: [],
    }, 'Plotted and created fiber route on GIS Map');

    setIsDrawRouteMode(false);
    setDrawnPoints([]);
  };

  return (
    <div className="space-y-4">
      {/* Map Control Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>OptiFiber Interactive GIS Network Topology Map</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real GPS geographic representation of routes, enclosures, splitters, subscriber drops and cable cuts
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isDrawRouteMode ? (
            <button
              onClick={() => {
                setIsDrawRouteMode(true);
                setDrawnPoints([]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <RouteIcon className="w-3.5 h-3.5" />
              <span>Draw Route on Map</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
              <span className="text-xs font-semibold text-blue-900">
                Click map to place waypoints ({drawnPoints.length} points)
              </span>
              <button
                onClick={handleSaveDrawnRoute}
                disabled={drawnPoints.length < 2}
                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Save Route</span>
              </button>
              <button
                onClick={() => {
                  setIsDrawRouteMode(false);
                  setDrawnPoints([]);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Layer Toggles Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 text-slate-400 font-semibold uppercase text-[10px] tracking-wider pl-1">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>GIS Layers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="w-2.5 h-1 bg-blue-600 rounded"></span>
            <span>Fiber Routes</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={showPops}
              onChange={(e) => setShowPops(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded bg-slate-900"></span>
            <span>Core POPs</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={showJointBoxes}
              onChange={(e) => setShowJointBoxes(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Joint Boxes</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={showSplitters}
              onChange={(e) => setShowSplitters(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded bg-amber-600"></span>
            <span>Splitters</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={showCustomers}
              onChange={(e) => setShowCustomers(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Subscribers</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={showFaults}
              onChange={(e) => setShowFaults(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span className="font-semibold text-rose-700">Open Cuts / Faults</span>
          </label>
        </div>
      </div>

      {/* Leaflet Map Frame */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative h-[650px]">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

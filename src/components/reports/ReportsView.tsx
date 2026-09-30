import React from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Route, 
  Disc, 
  Boxes, 
  Split, 
  Users, 
  Wrench, 
  Truck 
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';
import { 
  exportRoutesToCSV, 
  exportCablesToCSV, 
  exportSplicesToCSV, 
  exportCustomersToCSV, 
  exportTicketsToCSV 
} from '../../services/csvExport';

interface ReportsViewProps {
  db: OptiFiberDatabase;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ db }) => {
  const totalCores = db.cores.length;
  const activeCores = db.cores.filter(c => c.status === 'Active' || c.status === 'Used').length;
  const spareCores = db.cores.filter(c => c.status === 'Spare').length;
  const faultyCores = db.cores.filter(c => c.status === 'Fault' || c.status === 'Cut' || c.status === 'LOS').length;
  const utilizationPercent = totalCores > 0 ? Math.round((activeCores / totalCores) * 100) : 0;

  const totalFiberLengthKm = (db.cables.reduce((acc, c) => acc + (c.installedLengthMeters || 0), 0) / 1000).toFixed(2);
  const totalSubscribers = db.customers.length;
  const totalSplices = db.splices.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Infrastructure Reporting & Engineering Analytics</span>
          </h1>
          <p className="text-xs text-slate-500">
            Generate printable executive summaries, fiber saturation ratios, splitter usage and CSV data dumps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Quick CSV Export Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
          Download CSV Data Spreadsheets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => exportRoutesToCSV(db)}
            className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            <Route className="w-3.5 h-3.5 text-blue-600" />
            <span>Routes CSV</span>
          </button>
          <button
            onClick={() => exportCablesToCSV(db)}
            className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cables CSV</span>
          </button>
          <button
            onClick={() => exportSplicesToCSV(db)}
            className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            <Boxes className="w-3.5 h-3.5 text-indigo-600" />
            <span>Splices CSV</span>
          </button>
          <button
            onClick={() => exportCustomersToCSV(db)}
            className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Customers CSV</span>
          </button>
          <button
            onClick={() => exportTicketsToCSV(db)}
            className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>Tickets CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Core Utilization</span>
          <p className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">{utilizationPercent}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{activeCores} of {totalCores} Cores in Service</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Deployed Fiber</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {totalFiberLengthKm} <span className="text-xs font-normal text-slate-500">km</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{db.routes.length} Verified Physical Routes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Fiber Splices</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">{totalSplices}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {db.jointBoxes.length} Enclosures</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Subscriber Saturation</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{totalSubscribers}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Live Connected ONUs</p>
        </div>
      </div>

      {/* Route-by-Route Utilization Report Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Route-by-Route Fiber Capacity & Core Utilization Report
        </h3>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Route Identifier</th>
                <th className="py-2.5 px-3">Span Distance</th>
                <th className="py-2.5 px-3">Fiber Type</th>
                <th className="py-2.5 px-3">Total Cores</th>
                <th className="py-2.5 px-3">Active Cores</th>
                <th className="py-2.5 px-3">Spare Cores</th>
                <th className="py-2.5 px-3">Faulty Cores</th>
                <th className="py-2.5 px-3">Utilization Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {db.routes.map((route) => {
                const cables = db.cables.filter(c => c.routeId === route.id);
                const cableIds = cables.map(c => c.id);
                const routeCores = db.cores.filter(c => cableIds.includes(c.cableId));
                const active = routeCores.filter(c => c.status === 'Active' || c.status === 'Used').length;
                const spare = routeCores.filter(c => c.status === 'Spare').length;
                const fault = routeCores.filter(c => c.status === 'Fault' || c.status === 'Cut').length;
                const rate = route.coreCount > 0 ? Math.round((active / route.coreCount) * 100) : 0;

                return (
                  <tr key={route.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      {route.routeName} ({route.routeId})
                    </td>
                    <td className="py-2.5 px-3">
                      {(route.cableLengthMeters / 1000).toFixed(2)} km
                    </td>
                    <td className="py-2.5 px-3">
                      {route.fiberType}
                    </td>
                    <td className="py-2.5 px-3">
                      {route.coreCount}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">
                      {active}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {spare}
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 font-bold">
                      {fault}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div style={{ width: `${rate}%` }} className="h-full bg-blue-600" />
                        </div>
                        <span className="text-slate-800 font-bold">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

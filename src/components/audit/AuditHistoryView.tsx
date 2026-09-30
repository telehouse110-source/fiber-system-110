import React, { useState } from 'react';
import { History, Search, Filter, Clock, User, Shield, ArrowRight } from 'lucide-react';
import { OptiFiberDatabase } from '../../types';

interface AuditHistoryViewProps {
  db: OptiFiberDatabase;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({ db }) => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filteredLogs = db.auditLogs.filter(log => {
    const matchSearch = 
      log.entityName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.reason.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    return matchSearch && matchEntity;
  });

  const entityTypes = Array.from(new Set(db.auditLogs.map(l => l.entityType)));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <span>Network Configuration Audit & Change History Trail</span>
        </h1>
        <p className="text-xs text-slate-500">
          Immutable history of every fiber modification, core status change, fusion splice, device allocation and user action
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by user, action, entity name or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="ALL">All Entity Types</option>
          {entityTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Entity Type</th>
              <th className="py-3 px-4">Entity Subject</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Operator / Role</th>
              <th className="py-3 px-4">Change Delta</th>
              <th className="py-3 px-4">Authorized Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-3 px-4 font-mono text-slate-800">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                    {log.entityType}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900 truncate max-w-[200px]">
                  {log.entityName}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    log.action === 'Created' || log.action === 'Spliced' ? 'bg-emerald-50 text-emerald-700' :
                    log.action === 'Deleted' || log.action === 'Cut' ? 'bg-rose-50 text-rose-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-800">
                  <div>{log.user}</div>
                  <div className="text-[10px] text-slate-400">{log.userRole}</div>
                </td>
                <td className="py-3 px-4 font-mono text-[11px]">
                  {log.oldValue && log.newValue ? (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="line-through text-slate-400">{log.oldValue}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-900">{log.newValue}</span>
                    </div>
                  ) : log.newValue ? (
                    <span className="text-slate-800">{log.newValue}</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]">
                  {log.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

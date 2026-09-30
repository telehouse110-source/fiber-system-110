import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import { OptiFiberDatabase } from '../../types';
import { 
  exportDatabaseJSON, 
  importDatabaseJSON, 
  resetDatabase 
} from '../../services/storage';

interface BackupRestoreViewProps {
  db: OptiFiberDatabase;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ db }) => {
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseJSON(content);
      setImportStatus(res);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span>Local ISP Database Backup, Migration & Disaster Recovery</span>
        </h1>
        <p className="text-xs text-slate-500">
          Export full JSON databases, restore previous snapshots, migrate configurations, and manage local storage
        </p>
      </div>

      {/* Status banner */}
      {importStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
          importStatus.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {importStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
          <div>
            <p className="font-bold">{importStatus.success ? 'Database Restore Successful' : 'Restore Error'}</p>
            <p className="mt-0.5">{importStatus.message}</p>
          </div>
        </div>
      )}

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Full JSON Export */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Download Full Database Backup</h3>
              <p className="text-xs text-slate-500">Export complete relational tables as a portable JSON snapshot</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Includes all routes, {db.cables.length} cables, {db.cores.length} cores, {db.jointBoxes.length} joint boxes, {db.splices.length} splices, splitters, subscribers, and change history records.
          </p>

          <div className="pt-2">
            <button
              onClick={exportDatabaseJSON}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup (.JSON)</span>
            </button>
          </div>
        </div>

        {/* Card 2: JSON Restore */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Restore From Backup File</h3>
              <p className="text-xs text-slate-500">Upload and apply a previously exported OptiFiber JSON file</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Restores network state into the local browser and server database. Validates schema before applying.
          </p>

          <div className="pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="restore-upload-input"
            />
            <label
              htmlFor="restore-upload-input"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs text-center"
            >
              <Upload className="w-4 h-4" />
              <span>Select & Restore JSON File</span>
            </label>
          </div>
        </div>
      </div>

      {/* Database Diagnostic Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Current Local Storage Telemetry</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Last Synced: {new Date(db.lastUpdated).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-sans block text-[11px]">Database Schema</span>
            <span className="font-bold text-slate-900">Version {db.version}.0</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-sans block text-[11px]">Physical Cores</span>
            <span className="font-bold text-slate-900">{db.cores.length} Entries</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-sans block text-[11px]">Active Splices</span>
            <span className="font-bold text-slate-900">{db.splices.length} Recorded</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-sans block text-[11px]">Audit Trail</span>
            <span className="font-bold text-slate-900">{db.auditLogs.length} Events</span>
          </div>
        </div>

        {/* Reset Database to Initial Seed */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Reset to Initial Seed Infrastructure</h4>
            <p className="text-[11px] text-slate-500">Restore default demo routes, central POP, sample splices, and subscribers</p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
          >
            Reset Database
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Reset Database</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will reset the entire fiber network database to the initial factory seed dataset. All newly added routes, splices, and tickets will be replaced.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDatabase();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

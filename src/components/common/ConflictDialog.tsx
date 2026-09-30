import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { ConflictCheckResult } from '../../services/storage';

interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conflict: ConflictCheckResult;
  title?: string;
  confirmLabel?: string;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  conflict,
  title = 'Data Integrity & Relationship Conflict Check',
  confirmLabel = 'Proceed Anyway',
}) => {
  if (!isOpen) return null;

  const hasBlockers = conflict.blockers.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              hasBlockers ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {hasBlockers ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                {hasBlockers ? 'Action blocked to prevent corrupt topology' : 'Potential conflict detected'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {conflict.blockers.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
              <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Invalid Connection (Cannot Save):</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-700">
                {conflict.blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {conflict.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Warnings & Overlap Detected:</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
                {conflict.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-700 pt-1">
                If you proceed, existing connections may be disconnected or updated to reflect the new optical route.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Cancel
          </button>
          {!hasBlockers && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

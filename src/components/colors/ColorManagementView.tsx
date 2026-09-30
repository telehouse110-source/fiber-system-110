import React, { useState } from 'react';
import { Palette, Edit2, Check, RefreshCw, X, Shield, Info } from 'lucide-react';
import { OptiFiberDatabase, FiberColorConfig } from '../../types';
import { updateColor } from '../../services/storage';

interface ColorManagementViewProps {
  db: OptiFiberDatabase;
}

export const ColorManagementView: React.FC<ColorManagementViewProps> = ({ db }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHex, setEditHex] = useState('');

  const handleStartEdit = (col: FiberColorConfig) => {
    setEditingId(col.id);
    setEditName(col.name);
    setEditHex(col.hex);
  };

  const handleSave = (id: string) => {
    updateColor(id, { name: editName, hex: editHex });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-600" />
          <span>Fiber Color Code Standards & Custom Palette</span>
        </h1>
        <p className="text-xs text-slate-500">
          Configure the TIA-598-C / DIN VDE 0888 standard optical fiber buffer tube and individual core color coding system
        </p>
      </div>

      {/* Info Notice Box */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Standard telecom loose tube cables use this 12-color repeating sequence for both buffer tubes and inner cores. When you update a color code or hexadecimal value here, it automatically updates throughout all cable matrices, splice closures and bidirectional trace views.
        </p>
      </div>

      {/* 12-Color Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.colors.map((col) => {
          const isEditing = editingId === col.id;
          const assignedCoresCount = db.cores.filter(c => c.coreNumber % 12 === (col.coreNumber % 12)).length;

          return (
            <div
              key={col.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-xl border border-slate-300 shadow-xs shrink-0 flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: col.hex, color: col.textColor }}
                  >
                    #{col.coreNumber}
                  </span>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 w-28"
                      />
                    ) : (
                      <h3 className="text-sm font-bold text-slate-900">{col.name}</h3>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">Position #{col.coreNumber}</span>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => handleStartEdit(col)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Customize Color"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSave(col.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Color Hex & Preview */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-[11px]">HEX:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={editHex}
                        onChange={(e) => setEditHex(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={editHex}
                        onChange={(e) => setEditHex(e.target.value)}
                        className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 w-20"
                      />
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-slate-800">{col.hex}</span>
                  )}
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {assignedCoresCount} Cores in Net
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

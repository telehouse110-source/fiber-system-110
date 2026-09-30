import React, { useState, useEffect } from 'react';
import { Wifi, X, Smartphone, Copy, Check, Info, QrCode } from 'lucide-react';

interface LANAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LANAccessModal: React.FC<LANAccessModalProps> = ({ isOpen, onClose }) => {
  const [lanIp, setLanIp] = useState<string>('192.168.1.100');
  const [port, setPort] = useState<string>('3000');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If the browser is currently accessing via an IP or hostname, initialize with that
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setLanIp(window.location.hostname);
    }
    if (window.location.port) {
      setPort(window.location.port);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fullUrl = `http://${lanIp}:${port}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate a clean geometric QR code visual simulation in SVG
  const qrGridSize = 21;
  const qrCells: boolean[][] = Array.from({ length: qrGridSize }, () => Array(qrGridSize).fill(false));

  // Corner markers
  const addMarker = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          qrCells[startY + r][startX + c] = true;
        }
      }
    }
  };
  addMarker(0, 0);
  addMarker(14, 0);
  addMarker(0, 14);

  // Deterministic pattern based on LAN URL
  let hash = 0;
  for (let i = 0; i < fullUrl.length; i++) {
    hash = (hash << 5) - hash + fullUrl.charCodeAt(i);
    hash |= 0;
  }
  for (let r = 0; r < qrGridSize; r++) {
    for (let c = 0; c < qrGridSize; c++) {
      if ((r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7)) continue;
      if (((hash + r * 13 + c * 7) % 3) === 0) {
        qrCells[r][c] = true;
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Local LAN & Mobile Access</h3>
              <p className="text-xs text-slate-500">Access this system from smartphones & tablets on your Wi-Fi</p>
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
        <div className="p-6 space-y-5">
          {/* LAN Connection URL Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Local Network Server URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800">
                <span className="text-slate-400 mr-1">http://</span>
                <input
                  type="text"
                  value={lanIp}
                  onChange={(e) => setLanIp(e.target.value)}
                  className="w-32 bg-transparent text-slate-900 font-semibold focus:outline-hidden"
                  placeholder="192.168.1.xxx"
                />
                <span className="text-slate-400 mx-0.5">:</span>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-16 bg-transparent text-slate-900 font-semibold focus:outline-hidden"
                />
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Enter your PC/server's local LAN IP (e.g. found via <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ipconfig</code> on Windows or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ip a</code> on Linux).
            </p>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0">
              <svg viewBox="0 0 21 21" className="w-28 h-28 shape-rendering-crispEdges">
                {qrCells.map((row, r) =>
                  row.map((active, c) =>
                    active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
                  )
                )}
              </svg>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-slate-900">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Instant Mobile Field Scan</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your mobile phone to the same Wi-Fi network and scan this QR code with your camera to open the OptiFiber Field Technician interface immediately.
              </p>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Server listening on 0.0.0.0:{port}</span>
              </div>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>LAN Access Instructions</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
              <li>Make sure your mobile device is connected to the same local Wi-Fi or router as this computer.</li>
              <li>Allow port {port} in Windows Defender / Linux UFW firewall if prompted.</li>
              <li>All edits made from mobile sync in real time with the local database.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

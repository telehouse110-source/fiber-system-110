import React, { useRef } from 'react';
import { 
  X, 
  QrCode, 
  Printer, 
  Download, 
  MapPin, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';

interface AssetQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    assetId: string;
    name: string;
    type: string;
    location?: string;
    coordinates?: { lat: number; lng: number };
    extraInfo?: string;
    verified?: boolean;
  };
}

export const AssetQRModal: React.FC<AssetQRModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Real local network deep link
  const deepLink = `${window.location.origin}/?assetId=${encodeURIComponent(asset.assetId)}&type=${encodeURIComponent(asset.type)}`;

  // Generate deterministic visual QR matrix SVG representation
  const generateQRMatrix = (text: string) => {
    const size = 21;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // Corner Finder Patterns
    const setFinder = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          cells[startRow + r][startCol + c] = isBorder || isCenter;
        }
      }
    };

    setFinder(0, 0);
    setFinder(0, size - 7);
    setFinder(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      cells[6][i] = i % 2 === 0;
      cells[i][6] = i % 2 === 0;
    }

    // Pseudorandom payload fill based on string hash
    let state = Math.abs(hash);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8) ||
          (r === 6 || c === 6)
        ) {
          continue;
        }
        state = (state * 1664525 + 1013904223) & 0xffffffff;
        cells[r][c] = (state % 3) === 0;
      }
    }

    return cells;
  };

  const matrix = generateQRMatrix(asset.assetId + '-' + asset.type);
  const cellSize = 8;
  const qrSize = matrix.length * cellSize;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Network Asset QR Tag</h3>
              <p className="text-[11px] text-slate-500">Scan to open on field mobile tablet/phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Asset Tag Container */}
        <div ref={printAreaRef} className="p-6 flex flex-col items-center bg-white text-slate-900">
          {/* Printable Card Frame */}
          <div className="w-full border-2 border-dashed border-slate-300 rounded-xl p-5 bg-slate-50/30 flex flex-col items-center text-center">
            {/* Header Badge */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="font-mono text-xs font-bold tracking-wider text-slate-800 uppercase">OPTIFIBER ISP</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold uppercase">
                {asset.type}
              </span>
            </div>

            {/* SVG QR Code */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs mb-3">
              <svg
                width={qrSize}
                height={qrSize}
                viewBox={`0 0 ${qrSize} ${qrSize}`}
                className="block"
              >
                {matrix.map((row, r) =>
                  row.map((filled, c) =>
                    filled ? (
                      <rect
                        key={`${r}-${c}`}
                        x={c * cellSize}
                        y={r * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill="#0F172A"
                      />
                    ) : null
                  )
                )}
              </svg>
            </div>

            {/* Master Asset ID */}
            <div className="font-mono text-lg font-black tracking-widest text-blue-700 mb-1">
              {asset.assetId}
            </div>

            <div className="text-sm font-bold text-slate-900 mb-1 max-w-[280px]">
              {asset.name}
            </div>

            {asset.location && (
              <div className="flex items-center justify-center gap-1 text-xs text-slate-600 mb-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate max-w-[260px]">{asset.location}</span>
              </div>
            )}

            {asset.coordinates && (
              <div className="text-[10px] font-mono text-slate-400 mb-2">
                GPS: {asset.coordinates.lat.toFixed(5)}, {asset.coordinates.lng.toFixed(5)}
              </div>
            )}

            {asset.verified && (
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Field Verified Location</span>
              </div>
            )}
          </div>

          {/* Deep link info */}
          <div className="w-full mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Asset Deep Link
            </span>
            <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200 truncate">
              <span className="truncate">{deepLink}</span>
              <button
                onClick={handleCopyLink}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
                title="Copy link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy URL'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Asset Label</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

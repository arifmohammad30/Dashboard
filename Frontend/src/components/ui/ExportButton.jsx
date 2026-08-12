import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

/**
 * Reusable UI Export Button Component
 * Agnostic of endpoints — invokes the `onExport` prop passed by parent page/feature.
 */
export default function ExportButton({
  onExport,
  label = 'Export',
  loading: externalLoading = false,
  className = ''
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const handleClick = async (e) => {
    e.preventDefault();
    if (isLoading || !onExport) return;

    try {
      setInternalLoading(true);
      await onExport();
    } catch (err) {
      console.error("Export action error:", err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-stone-200 shadow-2xs rounded-xl text-xs cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 text-stone-500 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5 text-stone-500" />
      )}
      <span className="leading-none">{isLoading ? 'Exporting...' : label}</span>
    </button>
  );
}

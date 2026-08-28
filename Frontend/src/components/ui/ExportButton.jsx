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
      className={`inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 text-stone-700 font-bold border border-stone-200 shadow-2xs rounded-xl text-xs cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 text-stone-500 animate-spin shrink-0" />
      ) : (
        <Download className="w-3.5 h-3.5 text-stone-500 shrink-0" />
      )}
      <span className="leading-none">{isLoading ? 'Exporting...' : label}</span>
    </button>

  );
}

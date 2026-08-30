import React from 'react';
import { Trash2, Loader2, X } from 'lucide-react';

export default function DeleteModal({ isOpen, onClose, onConfirm, itemName, isDeleting, title = 'Delete Confirmation' }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in">
      <div 
        className="bg-white rounded-2xl border border-stone-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-[420px] overflow-hidden p-6 relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-40"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Alert Icon Badge */}
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
            <Trash2 className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              {itemName ? (
                <span className="font-bold text-slate-900 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/80 font-mono text-[11px]">
                  {itemName}
                </span>
              ) : (
                'this record'
              )}
              ? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer active:scale-95"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              'Delete Record'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

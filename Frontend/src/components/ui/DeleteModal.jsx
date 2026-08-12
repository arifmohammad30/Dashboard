import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';

export default function DeleteModal({ isOpen, onClose, onConfirm, itemName, isDeleting }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md transition-all duration-300">
      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-3xl w-full max-w-md overflow-hidden transform transition-all p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-rose-100/80 backdrop-blur-sm border border-rose-200 rounded-full mb-6 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)]">
          <Trash2 className="w-8 h-8 text-rose-500" />
        </div>
        <h3 className="text-xl font-extrabold text-center text-stone-800 mb-2">Delete Item</h3>
        <p className="text-center text-stone-500 text-sm mb-8">
          Are you sure you want to delete <span className="font-bold text-stone-800">{itemName}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-white/50 hover:bg-white/80 backdrop-blur-md border border-white/60 text-stone-600 font-bold rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-gradient-to-br from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center disabled:opacity-70 border border-rose-400/50"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

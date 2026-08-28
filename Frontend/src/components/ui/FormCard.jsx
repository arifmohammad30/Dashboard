import React from 'react';

export default function FormCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs relative transition-all duration-200 ${className}`}>
      {/* Card Header */}
      {title && (
        <div className="px-6 py-3.5 border-b border-stone-200/70 bg-gradient-to-r from-stone-50 via-slate-50/60 to-stone-50/30 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-orange-500 to-orange-600 inline-block shrink-0" />
            <div>
              <h2 className="text-[14px] font-extrabold text-slate-900 tracking-tight">{title}</h2>
              {subtitle && <p className="text-[11px] font-medium text-stone-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      
      {/* Card Body */}
      <div className="p-6 space-y-6 relative z-10">
        {children}
      </div>
    </div>
  );
}

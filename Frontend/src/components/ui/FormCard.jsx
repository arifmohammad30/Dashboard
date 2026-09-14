import React from 'react';

export default function FormCard({ title, subtitle, children, className = '', bodyClassName = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs relative transition-all duration-200 ${className}`}>
      {/* Card Header */}
      {title && (
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="w-1 h-3.5 rounded-full bg-[#4DA944] inline-block shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs font-normal text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Card Body with comfortable default space-y-3.5 spacing between form fields */}
      <div className={`p-5 relative z-10 space-y-3.5 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}

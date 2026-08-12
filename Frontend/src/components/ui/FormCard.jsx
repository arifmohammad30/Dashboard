import React from 'react';

export default function FormCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-[#F9FAFB] rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden relative transition-all duration-200 ${className}`}>
      {/* Card Header (Only rendered if title exists) */}
      {title && (
        <div className="px-6 py-4 border-b border-stone-200/70 bg-[#F1F5F9]/60 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-stone-800 tracking-tight">{title}</h2>
            {subtitle && <p className="text-[11px] font-normal text-stone-400 mt-0.5">{subtitle}</p>}
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

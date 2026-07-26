import React from 'react';

export default function FormCard({ title, children, className = '' }) {
  return (
    <div className={`neo-outset-30 rounded-[32px] overflow-hidden relative transition-all duration-300 ${className}`}>
      {/* Card Header */}
      <div className="px-8 py-6 border-b border-stone-200/50 relative z-10">
        <h2 className="text-base font-extrabold text-stone-800 tracking-wide">{title}</h2>
      </div>
      
      {/* Card Body */}
      <div className="p-8 space-y-8 relative z-10">
        {children}
      </div>
    </div>
  );
}

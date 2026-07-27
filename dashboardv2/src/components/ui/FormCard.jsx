import React from 'react';

export default function FormCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden relative transition-all duration-200 ${className}`}>
      {/* Card Header (Only rendered if title exists) */}
      {title && (
        <div className="px-6 py-4 border-b border-stone-200/60 bg-stone-50/50">
          <h2 className="text-sm font-extrabold text-stone-800 tracking-wide">{title}</h2>
        </div>
      )}
      
      {/* Card Body */}
      <div className="p-6 space-y-6 relative z-10">
        {children}
      </div>
    </div>
  );
}

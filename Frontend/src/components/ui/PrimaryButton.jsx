import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Reusable Primary Action Button Component shared across all list and form pages.
 */
export default function PrimaryButton({
  onClick,
  label = 'Add New',
  icon: Icon = Plus,
  type = 'button',
  disabled = false,
  className = ''
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 h-9 px-3.5 bg-orange-500 hover:bg-orange-600 border border-orange-600/30 text-white font-semibold rounded-xl text-xs shadow-2xs transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
      <span className="leading-none tracking-tight">{label}</span>
    </button>
  );
}

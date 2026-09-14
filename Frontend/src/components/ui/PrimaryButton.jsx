import React from 'react';
import { Plus, Loader2 } from 'lucide-react';

/**
 * Reusable Primary Action Button Component shared across all list and form pages.
 * Supports standard action triggers, form submissions, loading spinners, and edit mode labels.
 */
export default function PrimaryButton({
  onClick,
  label,
  icon: Icon = Plus,
  type = 'button',
  disabled = false,
  loading = false,
  isSubmitting = false,
  loadingText,
  isEditMode = false,
  editLabel = 'Save Changes',
  addLabel = 'Add',
  className = '',
  children
}) {
  const isLoading = loading || isSubmitting;
  
  // Resolve button label dynamically based on mode and state
  let resolvedLabel = label;
  if (!resolvedLabel) {
    if (isLoading && loadingText) {
      resolvedLabel = loadingText;
    } else if (isEditMode) {
      resolvedLabel = editLabel;
    } else {
      resolvedLabel = addLabel || 'Add New';
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-[#4DA944] hover:bg-[#43953b] border border-[#4DA944]/30 text-white font-semibold rounded-xl text-xs shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : Icon && !children ? (
        <Icon className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
      ) : null}
      
      {children ? children : <span className="leading-none tracking-tight">{resolvedLabel}</span>}
    </button>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ to, label, onClick, className = '' }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 text-stone-600 hover:text-stone-900 font-bold text-sm transition-colors cursor-pointer group overflow-visible ${className}`}
    >
      <ArrowLeft className="w-4.5 h-4.5 text-stone-500 group-hover:text-stone-900 group-hover:-translate-x-1 transition-transform duration-200 stroke-[2.25] shrink-0" />
      <span>{label}</span>
    </button>
  );
}

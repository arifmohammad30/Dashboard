import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function UnauthorizedPage({ permission, requiredPermission }) {
  const navigate = useNavigate();
  const missingPerm = permission || requiredPermission || 'Access Restricted';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-6 shadow-xs">
        <ShieldAlert className="w-8 h-8 stroke-[2]" />
      </div>

      <span className="text-xs font-black text-rose-600 uppercase tracking-widest bg-rose-100/60 px-3 py-1 rounded-full border border-rose-200/60 mb-3">
        403 - Access Forbidden
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Unauthorized Access
      </h1>

      <p className="text-sm text-stone-500 max-w-md mb-6 leading-relaxed">
        You do not have the required permission <code className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded font-mono text-xs border border-stone-200">{missingPerm}</code> to view this page or perform this action.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/analytics')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}

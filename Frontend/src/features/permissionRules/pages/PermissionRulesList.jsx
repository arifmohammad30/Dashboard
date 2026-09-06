import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PermissionRulesList() {
  return (
    <div className="flex flex-col gap-6 max-w-[1400px] w-full mx-auto pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Permission Rules
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Configure Role-Based Access Control (RBAC) rules and policies across modules.
          </p>
        </div>
      </div>

      {/* Blank / Dummy Card */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl p-16 flex flex-col items-center justify-center text-center min-h-[420px]">
        <div className="w-14 h-14 rounded-2xl bg-stone-100/80 border border-stone-200 flex items-center justify-center text-stone-400 mb-3 shadow-2xs">
          <ShieldCheck className="w-7 h-7 text-[#1EB8D4]" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Permission Rules</h3>
        <p className="text-xs text-stone-400 font-medium max-w-sm mt-1">
          Granular role permissions and access control rules will be managed here.
        </p>
      </div>
    </div>
  );
}

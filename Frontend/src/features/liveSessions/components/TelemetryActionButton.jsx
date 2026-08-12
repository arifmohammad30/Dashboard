import React from 'react';
import { Eye } from 'lucide-react';

export default function TelemetryActionButton({ session, onNavigateLogs }) {
  return (
    <button
      onClick={() => onNavigateLogs(session)}
      className="opacity-0 group-hover/row:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50/90 hover:bg-sky-100/90 text-sky-700 font-bold border border-sky-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer group text-[11px]"
    >
      <Eye className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
      <span>View Logs</span>
    </button>
  );
}

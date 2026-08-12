import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function ChargePointConfigTab({ cp, handleControlAction }) {
  return (
    <div>
      <button
        onClick={() => handleControlAction('Charger configuration fetched successfully.')}
        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
      >
        <RefreshCw strokeWidth={2.5} className="w-4 h-4 text-white" /> Fetch charger configuration
      </button>
    </div>
  );
}

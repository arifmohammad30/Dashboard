import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { getChargePointConfigurations } from '../api/chargePointService';

export default function ChargePointConfigTab({ cp, id, handleControlAction }) {
  const toast = useToast();
  const [fetching, setFetching] = useState(false);
  const targetId = cp?.id || id;

  const handleFetchConfig = async () => {
    setFetching(true);
    try {
      if (targetId) {
        await getChargePointConfigurations(targetId);
      }
      toast.success('Charger configuration fetched successfully', { code: 200 });
      if (handleControlAction) {
        handleControlAction('Charger configuration fetched successfully.');
      }
    } catch (err) {
      console.error('Failed to fetch charger configuration:', err);
      toast.error(err.message || 'Failed to fetch charger configuration', { code: 500 });
    } finally {
      setFetching(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleFetchConfig}
        disabled={fetching}
        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
      >
        <RefreshCw strokeWidth={2.5} className={`w-4 h-4 text-white ${fetching ? 'animate-spin' : ''}`} /> Fetch charger configuration
      </button>
    </div>
  );
}

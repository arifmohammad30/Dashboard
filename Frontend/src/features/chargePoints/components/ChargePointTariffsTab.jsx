import React from 'react';
import { Tag } from 'lucide-react';

export default function ChargePointTariffsTab({ cp }) {
  return (
    <div className="text-stone-500 text-center py-12">
      <Tag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
      <p className="font-bold text-sm">Assigned Tariff Profile: {cp.tariffProfiles || 'Standard Rate'}</p>
    </div>
  );
}

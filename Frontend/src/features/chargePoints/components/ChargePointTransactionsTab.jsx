import React from 'react';
import { Zap } from 'lucide-react';

export default function ChargePointTransactionsTab({ cp }) {
  return (
    <div className="text-stone-500 text-center py-12">
      <Zap className="w-10 h-10 text-stone-300 mx-auto mb-3" />
      <p className="font-bold text-sm">No active charge transactions for this point.</p>
    </div>
  );
}

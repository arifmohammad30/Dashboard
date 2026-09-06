import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, RotateCcw } from 'lucide-react';

// Reusable status badge mapping payment transaction states to colored indicators
export default function PaymentStatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();

  switch (normalized) {
    // Successful or captured payment
    case 'SUCCESS':
    case 'CAPTURED':
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1EB8D4]" />
          <span>Success</span>
        </span>
      );

    // Failed or errored payment
    case 'FAILED':
    case 'ERROR':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Failed</span>
        </span>
      );

    // Refunded or partially refunded transaction
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <RotateCcw className="w-3.5 h-3.5 text-sky-500" />
          <span>Refunded</span>
        </span>
      );

    // Pending or authorized payment
    case 'PENDING':
    case 'AUTHORIZED':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{status || 'Pending'}</span>
        </span>
      );
  }
}

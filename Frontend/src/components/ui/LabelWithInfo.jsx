import React from 'react';
import { HelpCircle } from 'lucide-react';

const LabelWithInfo = ({ label, required, info }) => (
  <div className="flex items-center gap-1.5 mb-1.5">
    <label className="text-sm font-medium text-stone-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {info && (
      <button type="button" className="text-stone-400 hover:text-stone-500 focus:outline-none" title={info}>
        <HelpCircle size={14} />
      </button>
    )}
  </div>
);

export default LabelWithInfo;

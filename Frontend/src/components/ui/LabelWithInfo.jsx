import React from 'react';
import { HelpCircle } from 'lucide-react';

const LabelWithInfo = ({ label, required, info, htmlFor }) => {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Tag htmlFor={htmlFor} className="text-sm font-medium text-stone-700 cursor-pointer">
        {label} {required && <span className="text-red-500">*</span>}
      </Tag>
      {info && (
        <button type="button" className="text-stone-400 hover:text-stone-500 focus:outline-none" title={info}>
          <HelpCircle size={14} />
        </button>
      )}
    </div>
  );
};

export default LabelWithInfo;

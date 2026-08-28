import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getConnectorText } from '../utils/formatters';

export const ConnectorBadgesCell = ({ connectors }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!connectors || !Array.isArray(connectors) || connectors.length === 0) {
    return <span className="text-stone-400 font-medium text-[12px]">-</span>;
  }

  if (connectors.length === 1) {
    return (
      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-stone-100 text-stone-700 border border-stone-200/80 whitespace-nowrap inline-block">
        {getConnectorText(connectors[0])}
      </span>
    );
  }

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors duration-150"
        title="Click to view all connectors"
      >
        <span>{connectors.length} Connectors</span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="absolute left-0 top-full mt-1.5 z-30 bg-white border border-stone-200 shadow-md rounded-xl p-2 flex flex-col gap-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
          {connectors.map((c, index) => (
            <span
              key={index}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-stone-50 text-stone-700 border border-stone-200/80 whitespace-nowrap text-left"
            >
              {getConnectorText(c)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectorBadgesCell;

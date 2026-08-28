import React, { useMemo } from 'react';
import { Clock, Info } from 'lucide-react';
import { generateTimelineSegments } from '../utils/timeUtils';

export default function DailyPreviewTimeline({ peakPeriods = [], offPeakPeriods = [] }) {
  const timelineData = useMemo(() => {
    return generateTimelineSegments(peakPeriods, offPeakPeriods, 'Mon');
  }, [peakPeriods, offPeakPeriods]);

  return (
    <div className="bg-white border border-indigo-200/90 rounded-2xl overflow-hidden shadow-2xs">
      <div className="bg-indigo-50/70 border-b border-indigo-200/80 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 stroke-[2.5]" /> Daily Pricing Preview
          </h2>
          <p className="text-xs text-indigo-700/90 font-medium mt-0.5">Normal pricing fills the gaps between Peak and Off-Peak periods.</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300/80">
          24-HOUR TIMELINE
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="p-5 border border-stone-200/90 rounded-2xl bg-stone-50/60 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-stone-800">
            <span className="font-extrabold text-stone-900">Monday – Friday</span>
            <span className="text-stone-500 font-medium text-[11px]">24-Hour Pricing Schedule</span>
          </div>

          <div className="relative w-full pt-1">
            {/* Hour Tick Markers */}
            <div className="relative h-5 w-full text-[10px] font-mono font-extrabold text-stone-500 mb-1 select-none">
              {timelineData.tickMarkers.map((t, idx) => (
                <span
                  key={idx}
                  className={`absolute ${t.pct === 0 ? 'left-0' : t.pct === 100 ? 'right-0' : '-translate-x-1/2'}`}
                  style={t.pct !== 0 && t.pct !== 100 ? { left: `${t.pct}%` } : undefined}
                >
                  {t.label}
                </span>
              ))}
            </div>

            {/* Segmented Timeline Bar */}
            <div className="h-11 border border-stone-300/80 rounded-xl overflow-hidden flex shadow-2xs">
              {timelineData.segments.map((seg, idx) => {
                let bgClass = "bg-emerald-200/90 text-emerald-950 border-emerald-300/80";
                if (seg.type === 'Peak') bgClass = "bg-rose-200/90 text-rose-950 border-rose-300/80";
                if (seg.type === 'Off-Peak') bgClass = "bg-sky-200/90 text-sky-950 border-sky-300/80";

                return (
                  <div
                    key={idx}
                    className={`${bgClass} flex items-center justify-center text-xs font-extrabold ${idx < timelineData.segments.length - 1 ? 'border-r' : ''}`}
                    style={{ width: seg.widthPct }}
                  >
                    {parseFloat(seg.widthPct) > 6 && seg.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold text-stone-700 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-200 border border-emerald-400"></span> Normal
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-rose-200 border border-rose-400"></span> Peak
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-sky-200 border border-sky-400"></span> Off-Peak
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-xl text-xs text-indigo-950 font-medium flex items-center gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span><strong>Pricing priority:</strong> Peak / Off-Peak period &rarr; Normal pricing fallback. If the current time matches a Peak or Off-Peak period, that period's rate applies; otherwise Normal pricing applies.</span>
        </div>
      </div>
    </div>
  );
}

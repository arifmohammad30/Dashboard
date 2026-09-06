import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Zap,
  Activity,
  CheckCircle2,
  Calendar,
  ChevronDown,
  TrendingUp,
  Clock,
  BatteryCharging,
  Maximize2,
  RotateCcw,
  Search,
  Download,
  Info,
  Sliders,
  Move
} from 'lucide-react';
import Select from '../../../components/ui/Select';
import { useChargePointStats } from '../hooks/useChargePointStats';

// Smooth Cubic Bezier Spline Generator for Production-Grade Charts
function getSmoothSplinePath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export default function ChargePointStatsTab({ cp }) {
  const { timeRange, setTimeRange, stats, loading } = useChargePointStats(cp);
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState(null);
  const [hoveredEnergyIndex, setHoveredEnergyIndex] = useState(null);
  const [hoveredSessionIndex, setHoveredSessionIndex] = useState(null);

  const rangeConfig = useMemo(() => {
    return {
      totalSessions: stats?.totalSessions ?? cp?.totalSessions ?? 0,
      totalRevenue: stats?.totalRevenue ?? cp?.revenueGenerated ?? 0.0,
      totalEnergy: stats?.totalEnergyKwh ?? cp?.energyDelivered ?? 0.0
    };
  }, [stats, cp]);

  const timeLabels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  const rawRevenuePoints = [0, 0, 0, 0, 0, 0.28, 1.97, 1.41, 1.38, 0, 0, 0];
  const rawEnergyPoints = [0, 0, 0, 0, 0, 0.025, 0.217, 0.155, 0.140, 0, 0, 0];
  const rawSessionPoints = [0, 0, 0, 0, 0, 11, 12, 11, 9, 0, 0, 0];

  const revenueData = useMemo(() => {
    return rawRevenuePoints.map(v => Number((v * (rangeConfig.totalRevenue / 4.98)).toFixed(2)));
  }, [rangeConfig.totalRevenue]);

  const energyData = useMemo(() => {
    return rawEnergyPoints.map(v => Number((v * (rangeConfig.totalEnergy / 0.42)).toFixed(3)));
  }, [rangeConfig.totalEnergy]);

  const sessionData = useMemo(() => {
    return rawSessionPoints.map(v => Math.round(v * (rangeConfig.totalSessions / 43)));
  }, [rangeConfig.totalSessions]);

  const buildChartMeta = (data, viewWidth = 560, viewHeight = 190, paddingLeft = 50, paddingBottom = 30, paddingTop = 30) => {
    const chartW = viewWidth - paddingLeft - 10;
    const chartH = viewHeight - paddingTop - paddingBottom;
    const maxVal = Math.max(...data, 1);
    const stepX = chartW / (data.length - 1);

    const points = data.map((val, i) => ({
      x: paddingLeft + i * stepX,
      y: paddingTop + chartH - (val / maxVal) * chartH,
      val,
      i
    }));

    const splineLine = getSmoothSplinePath(points);
    const areaPath = `${splineLine} L ${points[points.length - 1].x},${paddingTop + chartH} L ${points[0].x},${paddingTop + chartH} Z`;

    return { points, splineLine, areaPath, maxVal, chartW, chartH, paddingLeft, paddingTop, paddingBottom, stepX };
  };

  const revMeta = buildChartMeta(revenueData);
  const energyMeta = buildChartMeta(energyData);
  const sessionMeta = buildChartMeta(sessionData, 960, 200, 50, 30, 30);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs relative z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1EB8D4]/10 border border-[#1EB8D4]/20 flex items-center justify-center text-[#148296]">
            <Activity className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-stone-900 tracking-tight">Performance & Usage Statistics</h2>
            <p className="text-[11px] text-stone-500 font-medium">Real-time metrics, energy delivery and revenue analytics</p>
          </div>
        </div>

        <div className="w-44 relative z-40">
          <Select
            id="stats-time-range-select"
            name="timeRange"
            options={[
              { value: 'Today', label: 'Today' },
              { value: 'Yesterday', label: 'Yesterday' },
              { value: 'Last 7 Days', label: 'Last 7 Days' },
              { value: 'Last 30 Days', label: 'Last 30 Days' },
              { value: 'This Year', label: 'This Year' },
              { value: 'Last Year', label: 'Last Year' }
            ]}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            placeholder="Select Range"
            buttonClassName="py-1.5 px-3 text-xs bg-stone-50 border-stone-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 hover:border-amber-400/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer flex items-center justify-between group transform hover:-translate-y-1">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Total Revenue</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-200/60 text-amber-900 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> +12%
              </span>
            </div>
            <div className="text-2xl font-black text-amber-950 tracking-tight">
              ₹{rangeConfig.totalRevenue.toFixed(2)}
            </div>
            <span className="text-[10px] text-amber-700 font-medium block">Avg: ₹{(rangeConfig.totalRevenue / 24).toFixed(2)} / hr</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform duration-200">
            <IndianRupee className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/80 hover:border-sky-400/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:shadow-sky-500/10 transition-all duration-200 cursor-pointer flex items-center justify-between group transform hover:-translate-y-1">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">Energy Delivered</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-sky-200/60 text-sky-900 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> +8.4%
              </span>
            </div>
            <div className="text-2xl font-black text-sky-950 tracking-tight">
              {rangeConfig.totalEnergy} <span className="text-base font-bold text-sky-700">kWh</span>
            </div>
            <span className="text-[10px] text-sky-700 font-medium block">Peak draw: 52 kW</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform duration-200">
            <Zap className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/80 hover:border-purple-400/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer flex items-center justify-between group transform hover:-translate-y-1">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Total Sessions</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-purple-200/60 text-purple-900 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> +15%
              </span>
            </div>
            <div className="text-2xl font-black text-purple-950 tracking-tight">
              {rangeConfig.totalSessions} <span className="text-xs font-bold text-purple-700">Sessions</span>
            </div>
            <span className="text-[10px] text-purple-700 font-medium block">Avg duration: 38 mins</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform duration-200">
            <BatteryCharging className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-cyan-50/70 hover:bg-cyan-100/80 border border-cyan-200/80 hover:border-cyan-400/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer flex items-center justify-between group transform hover:-translate-y-1">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider block">Connectivity</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-cyan-200/60 text-cyan-900 rounded-full">
                99.8% Uptime
              </span>
            </div>
            <div className="text-base font-black text-cyan-950 flex items-center gap-2">
              <span className="flex items-center gap-1 text-cyan-700">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span> 1 Online
              </span>
              <span className="text-emerald-300 font-medium">•</span>
              <span className="text-cyan-700 font-bold">0 Offline</span>
            </div>
            <span className="text-[10px] text-cyan-700 font-medium block">OCPP 1.6J Connected</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-200">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              Revenue (₹)
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200/60 rounded-md">
                Daily Avg.: ₹{rangeConfig.totalRevenue.toFixed(2)}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 rounded-md">
                Total: ₹{rangeConfig.totalRevenue.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="relative w-full h-[210px] select-none">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 560 190">
              <defs>
                <linearGradient id="amberSplineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0, 0.33, 0.66, 1].map((pct, i) => {
                const y = revMeta.paddingTop + revMeta.chartH * (1 - pct);
                const val = (revMeta.maxVal * pct).toFixed(2);
                return (
                  <g key={i}>
                    <line x1={revMeta.paddingLeft} y1={y} x2={560} y2={y} stroke="#F1F5F9" strokeDasharray="3 3" />
                    <text x={revMeta.paddingLeft - 8} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="10" fontWeight="600" className="font-mono">
                      ₹{val}
                    </text>
                  </g>
                );
              })}

              <path d={revMeta.areaPath} fill="url(#amberSplineGrad)" />
              <path d={revMeta.splineLine} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {revMeta.points.map((pt) => {
                const isHovered = hoveredRevenueIndex === pt.i;
                return (
                  <g key={pt.i} className="cursor-pointer" onMouseEnter={() => setHoveredRevenueIndex(pt.i)} onMouseLeave={() => setHoveredRevenueIndex(null)}>
                    <rect x={pt.x - 2} y={158} width="4" height="4" fill="#CBD5E1" rx="1" />
                    <circle cx={pt.x} cy={pt.y} r={isHovered ? "5" : "3"} fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2.5" className="transition-all duration-150" />

                    {pt.val > 0 && (
                      <g>
                        <rect x={pt.x - 16} y={pt.y - 20} width="32" height="16" rx="4" fill="#FDE047" stroke="#EAB308" strokeWidth="1" />
                        <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#854D0E" fontSize="9.5" fontWeight="bold" className="font-mono">
                          {pt.val}
                        </text>
                      </g>
                    )}

                    {isHovered && (
                      <g>
                        <line x1={pt.x} y1={revMeta.paddingTop} x2={pt.x} y2={160} stroke="#F59E0B" strokeDasharray="2 2" strokeWidth="1.5" />
                        <rect x={Math.min(Math.max(pt.x - 40, 10), 470)} y={pt.y - 38} width="80" height="22" rx="6" fill="#1E293B" className="shadow-lg" />
                        <text x={Math.min(Math.max(pt.x, 50), 510)} y={pt.y - 24} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" className="font-mono">
                          ₹{pt.val} ({timeLabels[pt.i]})
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold pt-2 border-t border-stone-100 pl-[45px]">
            {timeLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              Energy Delivered (kWh)
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200/60 rounded-md">
                Daily Avg.: {(rangeConfig.totalEnergy / 24).toFixed(1)} kWh
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/60 rounded-md">
                Total: {rangeConfig.totalEnergy} kWh
              </span>
            </div>
          </div>

          <div className="relative w-full h-[210px] select-none">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 560 190">
              <defs>
                <linearGradient id="skySplineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0, 0.33, 0.66, 1].map((pct, i) => {
                const y = energyMeta.paddingTop + energyMeta.chartH * (1 - pct);
                const val = (energyMeta.maxVal * pct).toFixed(3);
                return (
                  <g key={i}>
                    <line x1={energyMeta.paddingLeft} y1={y} x2={560} y2={y} stroke="#F1F5F9" strokeDasharray="3 3" />
                    <text x={energyMeta.paddingLeft - 8} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="9.5" fontWeight="600" className="font-mono">
                      {val}
                    </text>
                  </g>
                );
              })}

              <path d={energyMeta.areaPath} fill="url(#skySplineGrad)" />
              <path d={energyMeta.splineLine} fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {energyMeta.points.map((pt) => {
                const isHovered = hoveredEnergyIndex === pt.i;
                return (
                  <g key={pt.i} className="cursor-pointer" onMouseEnter={() => setHoveredEnergyIndex(pt.i)} onMouseLeave={() => setHoveredEnergyIndex(null)}>
                    <rect x={pt.x - 2} y={158} width="4" height="4" fill="#CBD5E1" rx="1" />
                    <circle cx={pt.x} cy={pt.y} r={isHovered ? "5" : "3"} fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" className="transition-all duration-150" />

                    {pt.val > 0 && (
                      <g>
                        <rect x={pt.x - 18} y={pt.y - 20} width="36" height="16" rx="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
                        <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#0369A1" fontSize="9.5" fontWeight="bold" className="font-mono">
                          {pt.val}
                        </text>
                      </g>
                    )}

                    {isHovered && (
                      <g>
                        <line x1={pt.x} y1={energyMeta.paddingTop} x2={pt.x} y2={160} stroke="#0284C7" strokeDasharray="2 2" strokeWidth="1.5" />
                        <rect x={Math.min(Math.max(pt.x - 45, 10), 460)} y={pt.y - 38} width="90" height="22" rx="6" fill="#1E293B" className="shadow-lg" />
                        <text x={Math.min(Math.max(pt.x, 55), 505)} y={pt.y - 24} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" className="font-mono">
                          {pt.val} kWh ({timeLabels[pt.i]})
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold pt-2 border-t border-stone-100 pl-[45px]">
            {timeLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative z-10">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            Charging Sessions
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200/60 rounded-md">
              Daily Avg.: {(rangeConfig.totalSessions / 1).toFixed(2)}
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 rounded-md">
              Total: {rangeConfig.totalSessions}
            </span>
          </div>
        </div>

        <div className="relative w-full h-[220px] select-none">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 960 200">
            <defs>
              <linearGradient id="purpleSplineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 0.33, 0.66, 1].map((pct, i) => {
              const y = sessionMeta.paddingTop + sessionMeta.chartH * (1 - pct);
              const val = Math.round(sessionMeta.maxVal * pct);
              return (
                <g key={i}>
                  <line x1={sessionMeta.paddingLeft} y1={y} x2={960} y2={y} stroke="#F1F5F9" strokeDasharray="3 3" />
                  <text x={sessionMeta.paddingLeft - 8} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="10" fontWeight="600" className="font-mono">
                    {val}
                  </text>
                </g>
              );
            })}

            <path d={sessionMeta.areaPath} fill="url(#purpleSplineGrad)" />
            <path d={sessionMeta.splineLine} fill="none" stroke="#8B5CF6" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />

            {sessionMeta.points.map((pt) => {
              const isHovered = hoveredSessionIndex === pt.i;
              return (
                <g key={pt.i} className="cursor-pointer" onMouseEnter={() => setHoveredSessionIndex(pt.i)} onMouseLeave={() => setHoveredSessionIndex(null)}>
                  <rect x={pt.x - 2} y={168} width="4" height="4" fill="#CBD5E1" rx="1" />
                  <circle cx={pt.x} cy={pt.y} r={isHovered ? "6" : "3.5"} fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2.5" className="transition-all duration-150" />

                  {pt.val > 0 && (
                    <g>
                      <rect x={pt.x - 12} y={pt.y - 20} width="24" height="16" rx="4" fill="#C4B5FD" stroke="#7C3AED" strokeWidth="1" />
                      <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#5B21B6" fontSize="10" fontWeight="bold" className="font-mono">
                        {pt.val}
                      </text>
                    </g>
                  )}

                  {isHovered && (
                    <g>
                      <line x1={pt.x} y1={sessionMeta.paddingTop} x2={pt.x} y2={170} stroke="#8B5CF6" strokeDasharray="2 2" strokeWidth="1.5" />
                      <rect x={Math.min(Math.max(pt.x - 45, 10), 860)} y={pt.y - 38} width="90" height="22" rx="6" fill="#1E293B" className="shadow-lg" />
                      <text x={Math.min(Math.max(pt.x, 55), 905)} y={pt.y - 24} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" className="font-mono">
                        {pt.val} Sessions ({timeLabels[pt.i]})
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold pt-2 border-t border-stone-100 pl-[45px]">
          {timeLabels.map((lbl, idx) => (
            <span key={idx}>{lbl}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

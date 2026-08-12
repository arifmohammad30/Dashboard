import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Edit, QrCode, Power, Activity, Play } from 'lucide-react';
import { updateChargePoint } from '../api/chargePointService';

export default function ChargePointConnectorsTab({
  cp,
  id,
  connectorRows,
  openDropdownIds,
  toggleRowDropdown,
  connectorStatusMap,
  setConnectorStatusMap,
  setChargePoint,
  handleControlAction
}) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto pb-36 transform-gpu translate-z-0">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-stone-200">
          <tr className="bg-[#F8FAFC]">
            <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
              Actions
            </th>
            <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
              Connector ID
            </th>
            <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
              Connector Type
            </th>
            <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
              QR Code
            </th>
            <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
              Availability
            </th>
            <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
              Status
            </th>
            <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
              Error Code
            </th>
            <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
              Vendor Error Code
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
          {connectorRows.map((conn) => {
            const isExpanded = Boolean(openDropdownIds[conn.id]);
            return (
              <React.Fragment key={conn.id}>
                <tr className={`group transition-all duration-150 ${isExpanded
                  ? 'bg-sky-50/70 font-semibold'
                  : 'hover:bg-[#F8FAFF]'
                  }`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowDropdown(conn.id);
                        }}
                        className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isExpanded
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'text-stone-600 hover:text-slate-900 hover:bg-white/80'
                          }`}
                        title="Connector Actions"
                      >
                        <ChevronDown strokeWidth={2.5} className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/charge-points/${cp?.id || id}/connectors/${conn.id}/edit`, {
                            state: { conn, cpData: cp }
                          });
                        }}
                        className="p-1.5 text-stone-600 hover:text-orange-500 rounded-lg hover:bg-white/80 transition cursor-pointer"
                        title="Edit Connector"
                      >
                        <Edit strokeWidth={2.5} className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-stone-600 hover:text-purple-500 rounded-lg hover:bg-white/80 transition cursor-pointer" title="QR View">
                        <QrCode strokeWidth={2.5} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-bold text-stone-800 text-[13px]">{conn.id}</span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${conn.type === 'CCS2' ? 'bg-sky-50/90 text-sky-700 border-sky-200/80' :
                      conn.type === 'Type2' ? 'bg-purple-50/90 text-purple-700 border-purple-200/80' :
                        'bg-amber-50/90 text-amber-700 border-amber-200/80'
                      }`}>
                      {conn.type}
                    </span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-mono text-stone-600 text-[13px] font-medium">{conn.qrCode}</span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${conn.availability === 'Inoperative'
                      ? 'bg-red-50/90 text-red-700 border-red-200/60'
                      : 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conn.availability === 'Inoperative' ? 'bg-red-500' : 'bg-emerald-500'
                        }`} />
                      {conn.availability}
                    </span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${conn.status === 'Available' ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60' :
                      conn.status === 'Charging' ? 'bg-blue-50/90 text-blue-700 border-blue-200/60' :
                        conn.status === 'Preparing' ? 'bg-amber-50/90 text-amber-800 border-amber-200/60' :
                          'bg-red-50/90 text-red-700 border-red-200/60'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conn.status === 'Available' ? 'bg-emerald-500' :
                        conn.status === 'Charging' ? 'bg-blue-500 animate-pulse' :
                          conn.status === 'Preparing' ? 'bg-amber-500' :
                            'bg-red-500'
                        }`} />
                      {conn.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                      {conn.error}
                    </span>
                  </td>

                  <td className="px-4 py-4 rounded-r-2xl whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                      {conn.vendorError}
                    </span>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="animate-in fade-in slide-in-from-top-1 duration-150">
                    <td colSpan="8" className="px-4 pt-1 pb-3">
                      <div className="flex items-center gap-3 pl-1">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const isCurrentlyInoperative = conn.availability === 'Inoperative' || conn.status === 'Faulted';
                            const newStatus = isCurrentlyInoperative ? 'Available' : 'Faulted';
                            const isStageDisabled = cp.stage === 'Inactive' || cp.stage === 'Maintenance';
                            const newStage = isStageDisabled && isCurrentlyInoperative ? 'Active' : (cp.stage || 'Active');

                            setConnectorStatusMap(prev => ({ ...prev, [conn.id]: newStatus }));

                            const targetId = cp.id || id;
                            if (targetId) {
                              try {
                                const updated = await updateChargePoint(targetId, { status: newStatus, stage: newStage });
                                if (updated) {
                                  setChargePoint(prev => ({ ...prev, ...updated }));
                                }
                              } catch (err) {
                                console.error('Failed to update DB:', err);
                              }
                            }

                            handleControlAction(`Connector #${conn.id} availability updated to ${newStatus === 'Available' ? 'Operative' : 'Inoperative'}.`);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95 border ${(conn.availability === 'Inoperative' || conn.status === 'Faulted')
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/90 shadow-emerald-500/10'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/90 shadow-rose-500/10'
                            }`}
                        >
                          <Power strokeWidth={2.5} className="w-3.5 h-3.5" />
                          <span>{(conn.availability === 'Inoperative' || conn.status === 'Faulted') ? 'Change to Operative' : 'Change to Inoperative'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleControlAction(`Connector ${conn.id} status requested successfully.`);
                          }}
                          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                        >
                          <Activity strokeWidth={2.5} className="w-3.5 h-3.5" />
                          <span>Get Connector Status</span>
                        </button>

                        {conn.availability !== 'Inoperative' && conn.status !== 'Faulted' && conn.status !== 'Offline' && conn.status !== 'Unavailable' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleControlAction(`Remote Start Charging initiated for Connector #${conn.id}.`);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                          >
                            <Play strokeWidth={2.5} className="w-3.5 h-3.5 fill-current" />
                            <span>Start Charging</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

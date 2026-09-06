import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Edit, QrCode, Power, Play, Square, RefreshCw, PlugZap, Plus, X, Loader2 } from 'lucide-react';
import { useChargePointConnectors } from '../hooks/useChargePointConnectors';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';
import { addChargePointConnector } from '../api/chargePointService';
import { useToast } from '../../../context/ToastContext';

export default function ChargePointConnectorsTab({
  cp,
  id,
  onUpdate,
  handleControlAction
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    connectorRows,
    openDropdownIds,
    toggleRowDropdown,
    handleUpdateStatus,
    handleStartCharging,
    handleStopCharging,
    handleGetConnectorStatus,
    updatingId,
    startingId,
    stoppingId,
    checkingId
  } = useChargePointConnectors(cp, onUpdate);

  // Add Connector Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('Type2');
  const [addPower, setAddPower] = useState('22');
  const [addStatus, setAddStatus] = useState('Available');
  const [addingConnector, setAddingConnector] = useState(false);

  const handleAddConnectorSubmit = async (e) => {
    e.preventDefault();
    const cpTargetId = cp?.id || id;
    if (!cpTargetId) return;

    setAddingConnector(true);
    try {
      const res = await addChargePointConnector(cpTargetId, {
        type: addType,
        maxPower: parseFloat(addPower) || 22.0,
        status: addStatus
      });

      if (onUpdate && res?.chargePoint) {
        onUpdate(res.chargePoint);
      }

      toast.success(`Connector #${res?.connector?.connectorId || ''} added successfully!`, { code: 201 });
      setShowAddModal(false);
      setAddType('Type2');
      setAddPower('22');
      setAddStatus('Available');
    } catch (err) {
      console.error('Failed to add connector:', err);
      toast.error(err.message || 'Failed to add connector.', { code: 500 });
    } finally {
      setAddingConnector(false);
    }
  };

  return (
    <div className="overflow-x-auto pb-36 transform-gpu translate-z-0">
      {/* Top Action Toolbar with Add Connector Option */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Connectors</h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-stone-100 text-stone-600 border border-stone-200">
            {connectorRows.length}
          </span>
        </div>

        <PermissionGuard permission={PERMISSIONS.CHARGE_POINT_CONNECTORS_MANAGE}>
          <PrimaryButton 
            onClick={() => navigate(`/charge-points/${cp?.id || id}/connectors/new`, { state: { cpData: cp } })} 
            className="shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            <span>Add Connector</span>
          </PrimaryButton>
        </PermissionGuard>
      </div>

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
          {connectorRows.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-4 py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 mb-1">
                    <PlugZap className="w-6 h-6 text-[#1EB8D4]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-700">No connectors found for this charge point.</p>
                    <p className="text-xs text-stone-400 font-medium mt-0.5">Click below to attach a new connector outlet to this charge point.</p>
                  </div>

                  <PrimaryButton 
                    onClick={() => navigate(`/charge-points/${cp?.id || id}/connectors/new`, { state: { cpData: cp } })} 
                    className="mt-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                    <span>Add First Connector</span>
                  </PrimaryButton>
                </div>
              </td>
            </tr>
          ) : (
            connectorRows.map((conn) => {
              const isExpanded = Boolean(openDropdownIds[conn.id]);
              const isCharging = conn.status === 'Charging';

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
                          className="p-1.5 text-stone-600 hover:text-[#1EB8D4] rounded-lg hover:bg-white/80 transition cursor-pointer"
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
                        : 'bg-cyan-50/90 text-cyan-800 border-cyan-200/60'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conn.availability === 'Inoperative' ? 'bg-red-500' : 'bg-cyan-500'
                          }`} />
                        {conn.availability}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${conn.status === 'Available' ? 'bg-cyan-50/90 text-cyan-800 border-cyan-200/60' :
                        conn.status === 'Charging' ? 'bg-blue-50/90 text-blue-700 border-blue-200/60' :
                          conn.status === 'Preparing' ? 'bg-amber-50/90 text-amber-800 border-amber-200/60' :
                            'bg-red-50/90 text-red-700 border-red-200/60'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conn.status === 'Available' ? 'bg-cyan-500' :
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
                    <tr className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <td colSpan="8" className="px-4 py-2.5 bg-slate-50/50">
                        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/90 border border-slate-200/90 rounded-2xl shadow-2xs backdrop-blur-xs w-fit">
                          {/* Button 1: Start / Stop Charging */}
                          <PermissionGuard permission={PERMISSIONS.CHARGE_POINT_CONTROL}>
                            {isCharging ? (
                              <button
                                disabled={stoppingId === conn.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStopCharging(conn.id);
                                  if (handleControlAction) {
                                    handleControlAction(`Stop charging command sent to Connector #${conn.id}.`);
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 border border-amber-200/80 hover:border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                              >
                                <Square fill="currentColor" className="w-3.5 h-3.5 text-amber-600" />
                                <span>{stoppingId === conn.id ? 'Stopping...' : 'Stop Charging'}</span>
                              </button>
                            ) : (
                              <button
                                disabled={startingId === conn.id || conn.availability === 'Inoperative'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartCharging(conn.id);
                                  if (handleControlAction) {
                                    handleControlAction(`Start charging command sent to Connector #${conn.id}.`);
                                  }
                                }}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95 border ${conn.availability === 'Inoperative'
                                  ? 'bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed'
                                  : 'bg-cyan-50/90 hover:bg-cyan-100/90 text-cyan-800 border-cyan-200/80 hover:border-cyan-300 shadow-2xs hover:shadow-xs'
                                  }`}
                              >
                                <Play fill="currentColor" className="w-3.5 h-3.5 text-cyan-600" />
                                <span>{startingId === conn.id ? 'Starting...' : 'Start Charging'}</span>
                              </button>
                            )}
                          </PermissionGuard>

                          {/* Button 2: Change To Inoperative / Change To Operative */}
                          <PermissionGuard permission={PERMISSIONS.CHARGE_POINT_CONNECTORS_MANAGE}>
                            <button
                              disabled={updatingId === conn.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                const isCurrentlyInoperative = conn.availability === 'Inoperative' || conn.status === 'Faulted';
                                const newStatus = isCurrentlyInoperative ? 'Available' : 'Faulted';
                                handleUpdateStatus(conn.id, newStatus);
                                if (handleControlAction) {
                                  handleControlAction(`Connector #${conn.id} availability updated to ${newStatus === 'Available' ? 'Operative' : 'Inoperative'}.`);
                                }
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95 border ${(conn.availability === 'Inoperative' || conn.status === 'Faulted')
                                ? 'bg-cyan-50/90 text-cyan-800 border-cyan-200/80 hover:bg-cyan-100/90'
                                : 'bg-rose-50/90 text-rose-800 border-rose-200/80 hover:bg-rose-100/90'
                                }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>
                                {updatingId === conn.id
                                  ? 'Updating...'
                                  : (conn.availability === 'Inoperative' || conn.status === 'Faulted')
                                    ? 'Change to Operative'
                                    : 'Change to Inoperative'}
                              </span>
                            </button>
                          </PermissionGuard>

                          {/* Button 3: Get Connector Status */}
                          <button
                            disabled={checkingId === conn.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetConnectorStatus(conn.id);
                              if (handleControlAction) {
                                handleControlAction(`Queried status for Connector #${conn.id}.`);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-stone-50/80 hover:bg-stone-100 text-stone-700 hover:text-slate-900 border border-stone-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                          >
                            <RefreshCw strokeWidth={2.25} className={`w-3.5 h-3.5 text-stone-500 ${checkingId === conn.id ? 'animate-spin text-sky-600' : ''}`} />
                            <span>{checkingId === conn.id ? 'Fetching Status...' : 'Get Connector Status'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {/* Add Connector Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1EB8D4]/10 border border-[#1EB8D4]/20 flex items-center justify-center text-[#148296]">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Add New Connector</h3>
                  <p className="text-[11px] text-stone-500">Attach a new outlet to {cp?.name || 'Charge Point'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddConnectorSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Connector Type</label>
                <Select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value)}
                  options={['Type2', 'CCS2', 'GB/T', 'CHAdeMO', '15A Socket']}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Max Power Output (kW)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={addPower}
                  onChange={(e) => setAddPower(e.target.value)}
                  placeholder="22.0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Initial Status</label>
                <Select
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                  options={['Available', 'Faulted', 'Preparing']}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" disabled={addingConnector}>
                  {addingConnector ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                      <span>Add Connector</span>
                    </>
                  )}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

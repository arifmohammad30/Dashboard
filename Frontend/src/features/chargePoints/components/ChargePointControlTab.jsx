import React, { useState } from 'react';
import { RotateCcw, Cpu, Send, KeyRound, Zap } from 'lucide-react';
import Select from '../../../components/ui/Select';
import { useToast } from '../../../context/ToastContext';
import { updateChargePoint } from '../api/chargePointService';

export default function ChargePointControlTab({
  cp,
  id,
  setChargePoint,
  connectorIdOptions,
  handleControlAction
}) {
  const toast = useToast();
  const [firmwareUrl, setFirmwareUrl] = useState('');
  const [firmwareDate, setFirmwareDate] = useState('');

  const [localTagUpdateType, setLocalTagUpdateType] = useState('');
  const [localTagIdTags, setLocalTagIdTags] = useState('');

  const [triggerMessage, setTriggerMessage] = useState('');
  const [triggerConnectorId, setTriggerConnectorId] = useState('All');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-orange-500" /> Reset Charge Point
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleControlAction('Soft Reset command sent to charge point.')}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-600" /> Soft Reset
            </button>
            <button
              onClick={() => handleControlAction('Hard Reset command sent to charge point.')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Hard Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-500" /> Update Charge Point firmware
          </h3>
          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">Firmware URL <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="Paste firmware URL"
              value={firmwareUrl}
              onChange={(e) => setFirmwareUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">Scheduled date of firmware update</label>
            <input
              type="date"
              value={firmwareDate}
              onChange={(e) => setFirmwareDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={async () => {
              const newVersion = firmwareUrl.trim() || 'v2.1.0';
              setChargePoint(prev => ({ ...prev, firmwareVersion: newVersion }));

              const targetId = cp.id || id;
              if (targetId) {
                try {
                  await updateChargePoint(targetId, { firmwareVersion: newVersion });
                } catch (err) {
                  console.error("Failed to update firmware version in DB:", err);
                }
              }

              toast.success(`Firmware URL updated to "${newVersion}" for Charge Point #${targetId}`, { code: 200 });
              handleControlAction(`Firmware version updated to ${newVersion}. Notification sent.`);
            }}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" /> Update
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-500" /> Charge Point local ID Tag list management
          </h3>
          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">Update type <span className="text-rose-500">*</span></label>
            <Select
              options={[
                { value: 'Differential', label: 'Differential' },
                { value: 'Full', label: 'Full' }
              ]}
              value={localTagUpdateType}
              onChange={(e) => setLocalTagUpdateType(e.target.value)}
              placeholder="Select an Update Type"
              buttonClassName="py-2 px-3.5 text-xs bg-stone-50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">ID Tags</label>
            <Select
              options={[
                { value: 'TAG-001', label: 'TAG-001 (VIP Access)' },
                { value: 'TAG-002', label: 'TAG-002 (Fleet Access)' },
                { value: 'TAG-003', label: 'TAG-003 (Operator Key)' }
              ]}
              value={localTagIdTags}
              onChange={(e) => setLocalTagIdTags(e.target.value)}
              placeholder="Select ID Tags"
              buttonClassName="py-2 px-3.5 text-xs bg-stone-50"
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={() => handleControlAction('Local ID Tag list update message sent.')}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" /> Update
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Send trigger message to Charge Point
          </h3>
          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">Trigger message <span className="text-rose-500">*</span></label>
            <Select
              options={[
                { value: 'BootNotification', label: 'BootNotification' },
                { value: 'DiagnosticsStatusNotification', label: 'DiagnosticsStatusNotification' },
                { value: 'FirmwareStatusNotification', label: 'FirmwareStatusNotification' },
                { value: 'Heartbeat', label: 'Heartbeat' },
                { value: 'MeterValues', label: 'MeterValues' },
                { value: 'StatusNotification', label: 'StatusNotification' }
              ]}
              value={triggerMessage}
              onChange={(e) => setTriggerMessage(e.target.value)}
              placeholder="Select a trigger message"
              buttonClassName="py-2 px-3.5 text-xs bg-stone-50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">Connector Id <span className="text-rose-500">*</span></label>
            <Select
              options={connectorIdOptions}
              value={triggerConnectorId}
              onChange={(e) => setTriggerConnectorId(e.target.value)}
              placeholder="Select Connector Id"
              buttonClassName="py-2 px-3.5 text-xs bg-stone-50"
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={() => handleControlAction('Trigger message sent successfully.')}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

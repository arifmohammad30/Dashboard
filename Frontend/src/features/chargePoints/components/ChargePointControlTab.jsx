import React, { useState } from 'react';
import { RotateCcw, Cpu, Send, KeyRound, Zap, FileText, Database, Trash2 } from 'lucide-react';
import Select from '../../../components/ui/Select';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';
import { useToast } from '../../../context/ToastContext';
import {
  updateChargePoint,
  sendChargePointReset,
  sendChargePointFirmwareUpdate,
  updateChargePointLocalIdTags,
  sendChargePointTriggerMessage,
  getChargePointDiagnostics,
  sendChargePointDataTransfer,
  sendChargePointClearCache
} from '../api/chargePointService';

export default function ChargePointControlTab({
  cp,
  id,
  setChargePoint,
  connectorIdOptions,
  handleControlAction
}) {
  const toast = useToast();
  const targetId = cp?.id || id;

  // 1. Firmware Update State
  const [firmwareUrl, setFirmwareUrl] = useState('');
  const [firmwareDate, setFirmwareDate] = useState('');

  // 2. Local ID Tag List State
  const [localTagUpdateType, setLocalTagUpdateType] = useState('');
  const [localTagIdTags, setLocalTagIdTags] = useState('');

  // 3. Trigger Message State
  const [triggerMessage, setTriggerMessage] = useState('');
  const [triggerConnectorId, setTriggerConnectorId] = useState('All');

  // 4. Get Diagnostics State
  const [diagLocationUrl, setDiagLocationUrl] = useState('');
  const [diagRetries, setDiagRetries] = useState('');
  const [diagRetryInterval, setDiagRetryInterval] = useState('');
  const [diagDate, setDiagDate] = useState('');
  const [diagStartTime, setDiagStartTime] = useState('');
  const [diagStopTime, setDiagStopTime] = useState('');

  // 5. Data Transfer State
  const [dataVendorId, setDataVendorId] = useState('');
  const [dataMessageId, setDataMessageId] = useState('');
  const [dataPayload, setDataPayload] = useState('');

  const inputStyle = "w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs";

  // Handlers invoking endpoint requests
  const handleReset = async (resetType) => {
    try {
      if (targetId) {
        await sendChargePointReset(targetId, resetType);
      }
      toast.success(`${resetType} Reset command sent to Charge Point #${cp?.code || targetId}`, { code: 200 });
      handleControlAction(`${resetType} Reset command sent to charge point.`);
    } catch (err) {
      console.error(`Failed to send ${resetType} reset:`, err);
      toast.error(err.message || `Failed to send ${resetType} reset`, { code: 500 });
    }
  };

  const handleFirmwareUpdate = async () => {
    try {
      const newVersion = firmwareUrl.trim() || 'v2.1.0';
      if (setChargePoint) {
        setChargePoint(prev => ({ ...prev, firmwareVersion: newVersion }));
      }
      if (targetId) {
        await updateChargePoint(targetId, { firmwareVersion: newVersion });
        await sendChargePointFirmwareUpdate(targetId, { firmwareUrl: newVersion, firmwareDate });
      }
      toast.success(`Firmware update command dispatched (${newVersion})`, { code: 200 });
      handleControlAction(`Firmware version updated to ${newVersion}. Notification sent.`);
    } catch (err) {
      console.error("Failed to update firmware:", err);
      toast.error(err.message || "Failed to update firmware", { code: 500 });
    }
  };

  const handleLocalIdTagUpdate = async () => {
    try {
      if (targetId) {
        await updateChargePointLocalIdTags(targetId, {
          updateType: localTagUpdateType || 'Differential',
          idTags: localTagIdTags || 'TAG-001'
        });
      }
      toast.success(`Local ID Tag list update dispatched`, { code: 200 });
      handleControlAction('Local ID Tag list update message sent.');
    } catch (err) {
      console.error("Failed to update local ID tags:", err);
      toast.error(err.message || "Failed to update local ID tags", { code: 500 });
    }
  };

  const handleTriggerMessage = async () => {
    try {
      const msg = triggerMessage || 'BootNotification';
      if (targetId) {
        await sendChargePointTriggerMessage(targetId, {
          triggerMessage: msg,
          connectorId: triggerConnectorId
        });
      }
      toast.success(`Trigger message "${msg}" sent successfully`, { code: 200 });
      handleControlAction('Trigger message sent successfully.');
    } catch (err) {
      console.error("Failed to send trigger message:", err);
      toast.error(err.message || "Failed to send trigger message", { code: 500 });
    }
  };

  const handleGetDiagnostics = async () => {
    try {
      if (targetId) {
        await getChargePointDiagnostics(targetId, {
          locationUrl: diagLocationUrl,
          retries: diagRetries,
          retryInterval: diagRetryInterval,
          scheduledDate: diagDate,
          startTime: diagStartTime,
          stopTime: diagStopTime
        });
      }
      toast.success(`Diagnostics upload request dispatched`, { code: 200 });
      handleControlAction('Diagnostics report request initiated.');
    } catch (err) {
      console.error("Failed to request diagnostics:", err);
      toast.error(err.message || "Failed to request diagnostics", { code: 500 });
    }
  };

  const handleDataTransfer = async () => {
    try {
      if (targetId) {
        await sendChargePointDataTransfer(targetId, {
          vendorId: dataVendorId || 'Com.EVRE',
          messageId: dataMessageId,
          payload: dataPayload
        });
      }
      toast.success(`Data transfer message sent to Vendor ${dataVendorId || 'Default'}`, { code: 200 });
      handleControlAction('Data transfer message sent.');
    } catch (err) {
      console.error("Failed to send data transfer:", err);
      toast.error(err.message || "Failed to send data transfer message", { code: 500 });
    }
  };

  const handleClearCache = async () => {
    try {
      if (targetId) {
        await sendChargePointClearCache(targetId);
      }
      toast.success(`Clear Cache message sent to Charge Point #${cp?.code || targetId}`, { code: 200 });
      handleControlAction('Clear cache message sent to charge point.');
    } catch (err) {
      console.error("Failed to clear cache:", err);
      toast.error(err.message || "Failed to send clear cache command", { code: 500 });
    }
  };

  return (
    <PermissionGuard
      permission={PERMISSIONS.CHARGE_POINT_CONTROL}
      fallback={
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-stone-500 font-bold text-xs">
            You do not have permission to execute remote hardware control operations on this charge point.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
      {/* 1. Reset Charge Point */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#4DA944] stroke-[2.5]" /> Reset Charge Point
          </h3>
          <p className="text-xs text-stone-500 mb-5 font-medium">Issue a soft or hard reset to restart the charge point controller hardware.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleReset('Soft')}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-600" /> Soft Reset
            </button>
            <button
              onClick={() => handleReset('Hard')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Hard Reset
            </button>
          </div>
        </div>
      </div>

      {/* 2. Update Charge Point Firmware */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
        <div className="space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-500 stroke-[2.5]" /> Update Charge Point Firmware
          </h3>
          <div>
            <label htmlFor="firmwareUrl" className="text-xs font-bold text-stone-600 mb-1.5 block">Firmware URL <span className="text-rose-500">*</span></label>
            <input
              id="firmwareUrl"
              name="firmwareUrl"
              type="text"
              placeholder="Paste firmware download URL"
              value={firmwareUrl}
              onChange={(e) => setFirmwareUrl(e.target.value)}
              className={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="firmwareDate" className="text-xs font-bold text-stone-600 mb-1.5 block">Scheduled date of firmware update</label>
            <input
              id="firmwareDate"
              name="firmwareDate"
              type="date"
              value={firmwareDate}
              onChange={(e) => setFirmwareDate(e.target.value)}
              className={inputStyle}
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={handleFirmwareUpdate}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" /> Update
          </button>
        </div>
      </div>

      {/* 3. Charge Point Local ID Tag List Management */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
        <div className="space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-500 stroke-[2.5]" /> Local ID Tag List Management
          </h3>
          <div>
            <label htmlFor="localTagUpdateType" className="text-xs font-bold text-stone-600 mb-1.5 block">Update type <span className="text-rose-500">*</span></label>
            <Select
              id="localTagUpdateType"
              options={[
                { value: 'Differential', label: 'Differential' },
                { value: 'Full', label: 'Full' }
              ]}
              value={localTagUpdateType}
              onChange={(e) => setLocalTagUpdateType(e.target.value)}
              placeholder="Select an Update Type"
              buttonClassName="py-2 px-3.5 text-xs bg-stone-50 border-stone-200"
            />
          </div>
          <div>
            <label htmlFor="localTagIdTags" className="text-xs font-bold text-stone-600 mb-1.5 block">ID Tags</label>
            <Select
              id="localTagIdTags"
              options={[
                { value: 'TAG-001', label: 'TAG-001 (VIP Access)' },
                { value: 'TAG-002', label: 'TAG-002 (Fleet Access)' },
                { value: 'TAG-003', label: 'TAG-003 (Operator Key)' }
              ]}
              value={localTagIdTags}
              onChange={(e) => setLocalTagIdTags(e.target.value)}
              placeholder="Select ID Tags"
              buttonClassName="py-2 px-3.5 text-xs bg-stone-50 border-stone-200"
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={handleLocalIdTagUpdate}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" /> Update
          </button>
        </div>
      </div>

      {/* 4. Send Trigger Message */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
        <div className="space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 stroke-[2.5]" /> Send Trigger Message
          </h3>
          <div>
            <label htmlFor="triggerMessage" className="text-xs font-bold text-stone-600 mb-1.5 block">Trigger message <span className="text-rose-500">*</span></label>
            <Select
              id="triggerMessage"
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
              buttonClassName="py-2 px-3.5 text-xs bg-stone-50 border-stone-200"
            />
          </div>
          <div>
            <label htmlFor="triggerConnectorId" className="text-xs font-bold text-stone-600 mb-1.5 block">Connector Id <span className="text-rose-500">*</span></label>
            <Select
              id="triggerConnectorId"
              options={connectorIdOptions}
              value={triggerConnectorId}
              onChange={(e) => setTriggerConnectorId(e.target.value)}
              placeholder="Select Connector Id"
              buttonClassName="py-2 px-3.5 text-xs bg-stone-50 border-stone-200"
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={handleTriggerMessage}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>

      {/* 5. Get Diagnostics */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
        <div className="space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500 stroke-[2.5]" /> Get Diagnostics
          </h3>
          <div>
            <label htmlFor="diagLocationUrl" className="text-xs font-bold text-stone-600 mb-1.5 block">Location URL <span className="text-rose-500">*</span></label>
            <input
              id="diagLocationUrl"
              name="diagLocationUrl"
              type="text"
              placeholder="Enter destination upload URL"
              value={diagLocationUrl}
              onChange={(e) => setDiagLocationUrl(e.target.value)}
              className={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="diagRetries" className="text-xs font-bold text-stone-600 mb-1.5 block">Retries</label>
              <input
                id="diagRetries"
                name="diagRetries"
                type="number"
                placeholder="3"
                value={diagRetries}
                onChange={(e) => setDiagRetries(e.target.value)}
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="diagRetryInterval" className="text-xs font-bold text-stone-600 mb-1.5 block">Retry Interval (s)</label>
              <input
                id="diagRetryInterval"
                name="diagRetryInterval"
                type="number"
                placeholder="60"
                value={diagRetryInterval}
                onChange={(e) => setDiagRetryInterval(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="diagDate" className="text-[11px] font-bold text-stone-600 mb-1.5 block">Scheduled Date</label>
              <input
                id="diagDate"
                name="diagDate"
                type="date"
                value={diagDate}
                onChange={(e) => setDiagDate(e.target.value)}
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="diagStartTime" className="text-[11px] font-bold text-stone-600 mb-1.5 block">Start Time</label>
              <input
                id="diagStartTime"
                name="diagStartTime"
                type="time"
                value={diagStartTime}
                onChange={(e) => setDiagStartTime(e.target.value)}
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="diagStopTime" className="text-[11px] font-bold text-stone-600 mb-1.5 block">Stop Time</label>
              <input
                id="diagStopTime"
                name="diagStopTime"
                type="time"
                value={diagStopTime}
                onChange={(e) => setDiagStopTime(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={handleGetDiagnostics}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>

      {/* 6. Send Data Transfer Message */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
        <div className="space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500 stroke-[2.5]" /> Send Data Transfer Message
          </h3>
          <div>
            <label htmlFor="dataVendorId" className="text-xs font-bold text-stone-600 mb-1.5 block">Vendor ID <span className="text-rose-500">*</span></label>
            <input
              id="dataVendorId"
              name="dataVendorId"
              type="text"
              placeholder="Enter Vendor ID (e.g. Com.EVRE)"
              value={dataVendorId}
              onChange={(e) => setDataVendorId(e.target.value)}
              className={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="dataMessageId" className="text-xs font-bold text-stone-600 mb-1.5 block">Message ID</label>
            <input
              id="dataMessageId"
              name="dataMessageId"
              type="text"
              placeholder="Enter Message ID"
              value={dataMessageId}
              onChange={(e) => setDataMessageId(e.target.value)}
              className={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="dataPayload" className="text-xs font-bold text-stone-600 mb-1.5 block">Data Payload</label>
            <textarea
              id="dataPayload"
              name="dataPayload"
              rows={2}
              placeholder="Enter custom JSON / string payload"
              value={dataPayload}
              onChange={(e) => setDataPayload(e.target.value)}
              className={`${inputStyle} resize-none`}
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={handleDataTransfer}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>

      {/* 7. Send Clear Cache Message */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between col-span-1 lg:col-span-2 hover:border-stone-300 transition-all">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-3 border-b border-stone-200/80 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-500 stroke-[2.5]" /> Send Clear Cache Message
          </h3>
          <p className="text-xs text-stone-500 mb-4 font-medium">Clear the local authorization cache stored inside the charge point memory.</p>
          <div>
            <button
              onClick={handleClearCache}
              className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold rounded-xl text-xs shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-600" /> Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  </PermissionGuard>
);
}

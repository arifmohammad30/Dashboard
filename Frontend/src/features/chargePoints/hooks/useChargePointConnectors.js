import { useState, useMemo } from 'react';
import { updateChargePointConnector, startConnectorCharging, stopConnectorCharging, getConnectorStatus } from '../api/chargePointService';
import { useToast } from '../../../context/ToastContext';
import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useSocketRoom } from '../../../hooks/useSocketRoom';

export function useChargePointConnectors(cp, onUpdate) {
  const toast = useToast();
  const [openDropdownIds, setOpenDropdownIds] = useState({});
  const [connectorStatusMap, setConnectorStatusMap] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [startingId, setStartingId] = useState(null);
  const [stoppingId, setStoppingId] = useState(null);
  const [checkingId, setCheckingId] = useState(null);

  // Join targeted room chargepoint:<cp.id> with automatic unmount cleanup
  useSocketRoom(cp?.id ? `chargepoint:${cp.id}` : null);

  // Subscribe to real-time socket events delivered directly to this charge point room
  useSocketEvents({
    chargePointUpdated: (updatedCp) => {
      if (!updatedCp) return;
      if (onUpdate) onUpdate(updatedCp);
      if (updatedCp.connectors && Array.isArray(updatedCp.connectors)) {
        const newMap = {};
        updatedCp.connectors.forEach(c => {
          const cid = c.connectorId || c.id;
          if (cid && c.status) newMap[cid] = c.status;
        });
        setConnectorStatusMap(prev => ({ ...prev, ...newMap }));
      }
    },

    "session:created": (session) => {
      if (!session) return;
      const connId = session.connectorId || 1;
      setConnectorStatusMap(prev => ({ ...prev, [connId]: 'Charging' }));
    },

    "session:stopped": (session) => {
      if (!session) return;
      const connId = session.connectorId || 1;
      setConnectorStatusMap(prev => ({ ...prev, [connId]: 'Available' }));
    }
  });

  const toggleRowDropdown = (connId) => {
    setOpenDropdownIds(prev => ({
      ...prev,
      [connId]: !prev[connId]
    }));
  };

  const rawConnectors = useMemo(() => {
    if (!cp) return [];
    if (Array.isArray(cp.connectors)) {
      return cp.connectors;
    }
    if (typeof cp.connectors === 'string' && cp.connectors.trim() !== '') {
      try {
        const parsed = JSON.parse(cp.connectors);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [cp]);

  const connectorRows = useMemo(() => {
    return rawConnectors.map((c, index) => {
      const connId = c.connectorId || index + 1;
      const cStr = typeof c === 'string' ? c : (c?.type || c?.name || String(c || ''));
      const typeStr = cStr.includes('CCS2') ? 'CCS2' : cStr.includes('Type2') ? 'Type2' : (c?.type || '15A');
      const qrStr = `CQ${(cp?.code || 'XYZ').replace(/[^A-Z0-9]/gi, '')}${connId}1GYMY`.slice(0, 10).toUpperCase();

      const currentOverride = connectorStatusMap[connId];
      const isOffline = cp?.status === 'Offline';
      const isInoperative = currentOverride === 'Faulted' || (currentOverride === undefined && ((typeof c === 'object' && c?.status === 'Faulted') || cp?.status === 'Faulted' || isOffline));

      const currentAvailability = isInoperative ? 'Inoperative' : 'Operative';
      const currentStatus = isInoperative ? 'Faulted' : (currentOverride || (typeof c === 'object' ? c?.status : null) || 'Available');

      return {
        id: connId,
        type: typeStr,
        qrCode: qrStr,
        availability: currentAvailability,
        status: currentStatus,
        maxPower: c?.maxPower || 22.0,
        error: currentStatus === 'Faulted' ? 'OtherError' : 'NoError',
        vendorError: currentStatus === 'Faulted' ? 'EmergencyPressed' : 'None'
      };
    });
  }, [rawConnectors, connectorStatusMap, cp]);

  const handleUpdateStatus = async (connId, status) => {
    if (!cp?.id) return;
    setUpdatingId(connId);
    try {
      const updatedCp = await updateChargePointConnector(cp.id, connId, { status });
      if (onUpdate && updatedCp) {
        onUpdate(updatedCp);
      }
      setConnectorStatusMap(prev => ({ ...prev, [connId]: status }));
      toast.success(`Connector #${connId} status updated to ${status}`, { code: 200 });
    } catch (err) {
      console.error('Failed to update connector status:', err);
      toast.error(err.message || 'Failed to update connector status', { code: 500 });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStartCharging = async (connId) => {
    if (!cp?.id) return;
    setStartingId(connId);
    try {
      await startConnectorCharging(cp.id, connId);
      setConnectorStatusMap(prev => ({ ...prev, [connId]: 'Charging' }));
      toast.success(`Remote start charging sent for Connector #${connId}`, { code: 200 });
    } catch (err) {
      console.error('Failed to start charging:', err);
      toast.error(err.message || 'Failed to send remote start command', { code: 500 });
    } finally {
      setStartingId(null);
    }
  };

  const handleStopCharging = async (connId) => {
    if (!cp?.id) return;
    setStoppingId(connId);
    try {
      await stopConnectorCharging(cp.id, connId);
      setConnectorStatusMap(prev => ({ ...prev, [connId]: 'Available' }));
      toast.success(`Remote stop charging sent for Connector #${connId}`, { code: 200 });
    } catch (err) {
      console.error('Failed to stop charging:', err);
      toast.error(err.message || 'Failed to send remote stop command', { code: 500 });
    } finally {
      setStoppingId(null);
    }
  };

  const handleGetConnectorStatus = async (connId) => {
    if (!cp?.id) return;
    setCheckingId(connId);
    try {
      const res = await getConnectorStatus(cp.id, connId);
      if (res?.status) {
        setConnectorStatusMap(prev => ({ ...prev, [connId]: res.status }));
        toast.info(`Connector #${connId} status: ${res.status}`, { code: 200 });
      }
    } catch (err) {
      console.error('Failed to get connector status:', err);
      toast.error(err.message || 'Failed to check status', { code: 500 });
    } finally {
      setCheckingId(null);
    }
  };

  return {
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
  };
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ConnectorForm from '../components/ConnectorForm';
import { useToast } from '../../../context/ToastContext';
import { getChargePointById, updateChargePointConnector } from '../api/chargePointService';

/**
 * UpdateConnector Page
 * Allows operators to update configuration and power parameters of an existing connector.
 */
export default function UpdateConnector() {
  const navigate = useNavigate();
  const { id, connectorId } = useParams();
  const location = useLocation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpData, setCpData] = useState(location.state?.cpData || null);

  const initialCpCode = location.state?.cpData?.name || location.state?.cpData?.code || location.state?.conn?.chargePointCode || cpData?.name || cpData?.code || id || '';
  const initialConnType = location.state?.conn?.type || cpData?.type || 'CCS2';
  const initialConnId = connectorId || location.state?.conn?.id || '';
  const initialPowerRating = location.state?.conn?.powerRating || (location.state?.cpData?.totalCapacity ? String(location.state?.cpData?.totalCapacity) : '');

  const [formDefaults, setFormDefaults] = useState({
    chargePointCode: initialCpCode,
    type: initialConnType,
    connectorId: initialConnId,
    powerRating: initialPowerRating,
    maxCurrent: location.state?.conn?.maxCurrent || '',
    maxVoltage: location.state?.conn?.maxVoltage || '',
    powerType: location.state?.conn?.powerType || 'AC_1_PHASE',
    connectorFormat: location.state?.conn?.connectorFormat || 'CABLE'
  });

  // Fetch charge point details and populate connector form defaults
  useEffect(() => {
    let isMounted = true;
    const fetchCP = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await getChargePointById(id);
          if (res && isMounted) {
            setCpData(res);
            const cpNameCode = res.name || res.code || id;

            // Look up the specific connector if available in the charge point
            const matchedConn = Array.isArray(res.connectors)
              ? res.connectors.find(c => String(c.connectorId || c.id) === String(connectorId))
              : null;

            setFormDefaults(prev => ({
              ...prev,
              chargePointCode: cpNameCode,
              type: matchedConn?.type || prev.type || res.type || 'CCS2',
              connectorId: connectorId || prev.connectorId,
              powerRating: matchedConn?.maxPower ? String(matchedConn.maxPower) : (prev.powerRating || (res.totalCapacity ? String(res.totalCapacity) : '')),
              maxCurrent: matchedConn?.maxCurrent ? String(matchedConn.maxCurrent) : prev.maxCurrent,
              maxVoltage: matchedConn?.maxVoltage ? String(matchedConn.maxVoltage) : prev.maxVoltage,
              powerType: matchedConn?.powerType || prev.powerType,
              connectorFormat: matchedConn?.connectorFormat || prev.connectorFormat
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch charge point details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCP();
    return () => { isMounted = false; };
  }, [id, connectorId]);

  // Handle form submission and update connector
  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (id && (connectorId || data.connectorId)) {
        const targetConnectorId = connectorId || data.connectorId;
        const payload = {
          connectorId: parseInt(data.connectorId, 10) || parseInt(targetConnectorId, 10),
          type: data.type,
          maxPower: data.powerRating ? parseFloat(data.powerRating) : undefined,
          maxCurrent: data.maxCurrent ? parseFloat(data.maxCurrent) : undefined,
          maxVoltage: data.maxVoltage ? parseFloat(data.maxVoltage) : undefined,
          powerType: data.powerType,
          connectorFormat: data.connectorFormat
        };
        await updateChargePointConnector(id, targetConnectorId, payload);
      }
      toast.success(`Connector #${data.connectorId} updated successfully`, { code: 200 });
      navigate(`/charge-points/${id || ''}?tab=connectors`);
    } catch (err) {
      console.error('Failed to update connector:', err);
      toast.error('Failed to update connector', { code: 500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // URL to navigate back to the charge point connectors tab
  const backUrl = id ? `/charge-points/${id}?tab=connectors` : '/charge-points';

  return (
    <ConnectorForm
      isEditMode={true}
      defaultValues={formDefaults}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      loading={loading}
      backUrl={backUrl}
    />
  );
}

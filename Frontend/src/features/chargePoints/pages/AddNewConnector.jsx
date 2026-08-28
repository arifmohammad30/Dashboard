import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ConnectorForm from '../components/ConnectorForm';
import { useToast } from '../../../context/ToastContext';
import { getChargePointById, addChargePointConnector } from '../api/chargePointService';

export default function AddNewConnector() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpCode, setCpCode] = useState(location.state?.cpData?.code || location.state?.cpData?.name || id || '');

  useEffect(() => {
    let isMounted = true;
    const fetchCP = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await getChargePointById(id);
          if (res && isMounted) {
            setCpCode(res.code || res.name || id);
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
  }, [id]);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (!id) {
        toast.error('Invalid charge point identifier', { code: 400 });
        return;
      }

      const res = await addChargePointConnector(id, {
        connectorId: parseInt(data.connectorId) || 1,
        type: data.type,
        maxPower: parseFloat(data.powerRating) || 22.0,
        maxCurrent: data.maxCurrent ? parseFloat(data.maxCurrent) : undefined,
        maxVoltage: data.maxVoltage ? parseFloat(data.maxVoltage) : undefined,
        powerType: data.powerType,
        connectorFormat: data.connectorFormat,
        status: 'Available'
      });

      toast.success(`Connector #${res?.connector?.connectorId || data.connectorId} added successfully!`, { code: 201 });
      navigate(`/charge-points/${id}?tab=connectors`);
    } catch (err) {
      console.error('Failed to add connector:', err);
      toast.error(err.message || 'Failed to add connector.', { code: 500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const backUrl = id ? `/charge-points/${id}?tab=connectors` : '/charge-points';

  return (
    <ConnectorForm
      isEditMode={false}
      defaultValues={{
        chargePointCode: cpCode,
        type: '',
        connectorId: '',
        powerRating: '',
        maxCurrent: '',
        maxVoltage: '',
        powerType: '',
        connectorFormat: ''
      }}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      loading={loading}
      backUrl={backUrl}
    />
  );
}

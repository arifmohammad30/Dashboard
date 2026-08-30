import { useState, useEffect } from 'react';
import { assignChargePointTariff } from '../api/chargePointService';
import { apiClient } from '../../../lib/apiClient';
import { useToast } from '../../../context/ToastContext';

export function useChargePointTariff(cp, onUpdate) {
  const toast = useToast();
  const [tariffsCatalog, setTariffsCatalog] = useState([]);
  const [loadingTariffs, setLoadingTariffs] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeTariff = cp?.tariff || null;
  const activeTariffId = cp?.tariffId || activeTariff?.id || null;
  const activeTariffName = activeTariff?.name || cp?.tariffProfiles || 'No Tariff Assigned';

  useEffect(() => {
    let isMounted = true;
    setLoadingTariffs(true);
    apiClient('/tariffs')
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res?.data || []);
        setTariffsCatalog(list);
      })
      .catch(err => {
        console.error('[useChargePointTariff] Failed to load tariffs catalog:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingTariffs(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAssignTariff = async (tariffId) => {
    if (!cp?.id) return;
    setIsAssigning(true);
    try {
      const updatedCp = await assignChargePointTariff(cp.id, tariffId);
      if (onUpdate && updatedCp) {
        onUpdate(updatedCp);
      }
      toast.success("Tariff profile assigned successfully", { code: 200 });
      setIsModalOpen(false);
    } catch (err) {
      console.error('[useChargePointTariff] Failed to assign tariff:', err);
      toast.error(err.message || "Failed to assign tariff profile", { code: 500 });
    } finally {
      setIsAssigning(false);
    }
  };

  return {
    activeTariff,
    activeTariffId,
    activeTariffName,
    tariffsCatalog,
    loadingTariffs,
    isAssigning,
    isModalOpen,
    setIsModalOpen,
    handleAssignTariff
  };
}

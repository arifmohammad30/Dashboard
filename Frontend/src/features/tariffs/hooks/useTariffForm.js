import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { createTariff, updateTariff, getTariffById } from '../api/tariffService';
import { useToast } from '../../../context/ToastContext';
import { validatePricingConfig } from '../utils/tariffValidator';

export function useTariffForm({ isViewMode = false, isEditMode = false } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const tariffData = location.state?.tariff;

  const [tariffName, setTariffName] = useState(tariffData?.name || '');
  const [status, setStatus] = useState(tariffData?.status || 'Active');

  const [gstPercentage, setGstPercentage] = useState(tariffData?.gstPercentage ? tariffData.gstPercentage.replace(/[^0-9.]/g, '') : '');
  const [parkingFee, setParkingFee] = useState('');
  const [parkingGracePeriod, setParkingGracePeriod] = useState('');
  const [parkingChargeStarts, setParkingChargeStarts] = useState('After Charging Completes');
  const [enableParkingFee, setEnableParkingFee] = useState(false);

  const [normalSocRanges, setNormalSocRanges] = useState([]);
  const [normalEnergyPrice, setNormalEnergyPrice] = useState('');
  const [normalTimePrice, setNormalTimePrice] = useState('');

  const [peakPeriods, setPeakPeriods] = useState([]);
  const [offPeakPeriods, setOffPeakPeriods] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Instant real-time overlap validation computation
  const validationResult = useMemo(() => {
    const parseNum = (val) => (val !== '' && val !== null && val !== undefined ? parseFloat(val) : undefined);
    const pricingConfig = {
      gstPercentage: parseNum(gstPercentage),
      normalPricing: {
        energyPrice: parseNum(normalEnergyPrice),
        timePrice: parseNum(normalTimePrice),
        socRanges: normalSocRanges.map(s => ({
          id: s.id,
          from: parseInt(s.from, 10),
          to: parseInt(s.to, 10),
          price: parseNum(s.price)
        }))
      },
      peakPeriods: peakPeriods.map(p => ({
        ...p,
        energyPrice: parseNum(p.energyPrice),
        timePrice: parseNum(p.timePrice),
        socRanges: (p.socRanges || []).map(s => ({
          id: s.id,
          from: parseInt(s.from, 10),
          to: parseInt(s.to, 10),
          price: parseNum(s.price)
        }))
      })),
      offPeakPeriods: offPeakPeriods.map(p => ({
        ...p,
        energyPrice: parseNum(p.energyPrice),
        timePrice: parseNum(p.timePrice),
        socRanges: (p.socRanges || []).map(s => ({
          id: s.id,
          from: parseInt(s.from, 10),
          to: parseInt(s.to, 10),
          price: parseNum(s.price)
        }))
      })),
      parkingConfig: {
        enabled: enableParkingFee,
        feePerMin: parseNum(parkingFee),
        gracePeriodMins: parseNum(parkingGracePeriod)
      }
    };
    return validatePricingConfig(pricingConfig);
  }, [normalSocRanges, peakPeriods, offPeakPeriods, normalEnergyPrice, normalTimePrice, gstPercentage, enableParkingFee, parkingFee, parkingGracePeriod]);


  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getTariffById(id)
        .then(t => {
          if (t) {
            setTariffName(t.name || '');
            setStatus(t.status || 'Active');
            setGstPercentage(String(t.rawGstPercentage ?? (t.gstPercentage ? t.gstPercentage.replace(/[^0-9.]/g, '') : '')));

            const config = t.pricingConfig;
            if (config) {
              if (config.normalPricing) {
                setNormalEnergyPrice(String(config.normalPricing.energyPrice ?? ''));
                setNormalTimePrice(String(config.normalPricing.timePrice ?? ''));
                if (config.normalPricing.socRanges && config.normalPricing.socRanges.length > 0) {
                  setNormalSocRanges(config.normalPricing.socRanges.map(s => ({
                    id: s.id || `n_${Math.random()}`,
                    from: String(s.from ?? ''),
                    to: String(s.to ?? ''),
                    price: String(s.price ?? '')
                  })));
                }
              }
              if (config.peakPeriods && config.peakPeriods.length > 0) {
                setPeakPeriods(config.peakPeriods.map(p => ({
                  ...p,
                  energyPrice: String(p.energyPrice ?? ''),
                  timePrice: String(p.timePrice ?? ''),
                  socRanges: (p.socRanges || []).map(s => ({
                    id: s.id || `ps_${Math.random()}`,
                    from: String(s.from ?? ''),
                    to: String(s.to ?? ''),
                    price: String(s.price ?? '')
                  }))
                })));
              }
              if (config.offPeakPeriods && config.offPeakPeriods.length > 0) {
                setOffPeakPeriods(config.offPeakPeriods.map(p => ({
                  ...p,
                  energyPrice: String(p.energyPrice ?? ''),
                  timePrice: String(p.timePrice ?? ''),
                  socRanges: (p.socRanges || []).map(s => ({
                    id: s.id || `ops_${Math.random()}`,
                    from: String(s.from ?? ''),
                    to: String(s.to ?? ''),
                    price: String(s.price ?? '')
                  }))
                })));
              }
              if (config.parkingConfig) {
                setEnableParkingFee(Boolean(config.parkingConfig.enabled));
                setParkingFee(String(config.parkingConfig.feePerMin ?? ''));
                setParkingGracePeriod(String(config.parkingConfig.gracePeriodMins ?? ''));
                setParkingChargeStarts(config.parkingConfig.startCondition || 'After Charging Completes');
              }
            } else if (t.baseRate) {
              setNormalEnergyPrice(String(t.baseRate));
            }
          }
        })
        .catch(err => {
          console.error("Failed to load tariff details:", err);
          toast.error("Failed to load tariff structure", { code: 500 });
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const addNormalSocRange = () => {
    setNormalSocRanges(prev => {
      const initialFrom = prev.length === 0 ? '0' : '';
      return [...prev, { id: `n_${Date.now()}`, from: initialFrom, to: '', price: '' }];
    });
  };
  const updateNormalSocRange = (id, field, value) => {
    setNormalSocRanges(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const removeNormalSocRange = (id) => {
    setNormalSocRanges(prev => prev.filter(r => r.id !== id));
  };

  const addPeakPeriod = () => {
    const nextNum = peakPeriods.length + 1;
    setPeakPeriods(prev => [
      ...prev,
      {
        id: `peak_${Date.now()}`,
        title: `Peak Period ${nextNum}`,
        startTime: '',
        endTime: '',
        days: [],
        energyPrice: '',
        timePrice: '',
        socRanges: []
      }
    ]);
  };
  const removePeakPeriod = (periodId) => {
    setPeakPeriods(prev => prev.filter(p => p.id !== periodId));
  };
  const togglePeakDay = (periodId, day) => {
    setPeakPeriods(prev => prev.map(p => {
      if (p.id !== periodId) return p;
      const exists = p.days.includes(day);
      return { ...p, days: exists ? p.days.filter(d => d !== day) : [...p.days, day] };
    }));
  };
  const updatePeakPeriodField = (periodId, field, val) => {
    setPeakPeriods(prev => prev.map(p => p.id === periodId ? { ...p, [field]: val } : p));
  };
  const addPeakSocRange = (periodId) => {
    setPeakPeriods(prev => prev.map(p => {
      if (p.id !== periodId) return p;
      const initialFrom = (p.socRanges || []).length === 0 ? '0' : '';
      return { ...p, socRanges: [...(p.socRanges || []), { id: `ps_${Date.now()}`, from: initialFrom, to: '', price: '' }] };
    }));
  };
  const updatePeakSocRange = (periodId, socId, field, val) => {
    setPeakPeriods(prev => prev.map(p => p.id === periodId ? {
      ...p,
      socRanges: p.socRanges.map(s => s.id === socId ? { ...s, [field]: val } : s)
    } : p));
  };
  const removePeakSocRange = (periodId, socId) => {
    setPeakPeriods(prev => prev.map(p => p.id === periodId ? { ...p, socRanges: p.socRanges.filter(s => s.id !== socId) } : p));
  };

  // Handlers for Off-Peak Periods
  const addOffPeakPeriod = () => {
    const nextNum = offPeakPeriods.length + 1;
    setOffPeakPeriods(prev => [
      ...prev,
      {
        id: `offpeak_${Date.now()}`,
        title: `Off-Peak Period ${nextNum}`,
        startTime: '',
        endTime: '',
        days: [],
        energyPrice: '',
        timePrice: '',
        socRanges: []
      }
    ]);
  };
  const removeOffPeakPeriod = (periodId) => {
    setOffPeakPeriods(prev => prev.filter(p => p.id !== periodId));
  };
  const toggleOffPeakDay = (periodId, day) => {
    setOffPeakPeriods(prev => prev.map(p => {
      if (p.id !== periodId) return p;
      const exists = p.days.includes(day);
      return { ...p, days: exists ? p.days.filter(d => d !== day) : [...p.days, day] };
    }));
  };
  const updateOffPeakPeriodField = (periodId, field, val) => {
    setOffPeakPeriods(prev => prev.map(p => p.id === periodId ? { ...p, [field]: val } : p));
  };
  const addOffPeakSocRange = (periodId) => {
    setOffPeakPeriods(prev => prev.map(p => {
      if (p.id !== periodId) return p;
      const initialFrom = (p.socRanges || []).length === 0 ? '0' : '';
      return { ...p, socRanges: [...(p.socRanges || []), { id: `ops_${Date.now()}`, from: initialFrom, to: '', price: '' }] };
    }));
  };
  const updateOffPeakSocRange = (periodId, socId, field, val) => {
    setOffPeakPeriods(prev => prev.map(p => p.id === periodId ? {
      ...p,
      socRanges: p.socRanges.map(s => s.id === socId ? { ...s, [field]: val } : s)
    } : p));
  };
  const removeOffPeakSocRange = (periodId, socId) => {
    setOffPeakPeriods(prev => prev.map(p => p.id === periodId ? { ...p, socRanges: p.socRanges.filter(s => s.id !== socId) } : p));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!tariffName.trim()) {
      toast.error('Tariff Name is required', { code: 400 });
      return;
    }

    if (!validationResult.valid) {
      toast.error(validationResult.error, { title: 'Configuration Validation Error', code: 400 });
      return;
    }

    const pricingConfig = {
      normalPricing: {
        energyPrice: parseFloat(normalEnergyPrice) || 0,
        timePrice: parseFloat(normalTimePrice) || 0,
        socRanges: normalSocRanges.map(s => ({
          id: s.id,
          from: parseInt(s.from, 10),
          to: parseInt(s.to, 10),
          price: parseFloat(s.price) || 0
        }))
      },
      peakPeriods: peakPeriods.map(p => ({
        ...p,
        energyPrice: parseFloat(p.energyPrice) || 0,
        timePrice: parseFloat(p.timePrice) || 0,
        socRanges: (p.socRanges || []).map(s => ({
          id: s.id,
          from: parseInt(s.from, 10),
          to: parseInt(s.to, 10),
          price: parseFloat(s.price) || 0
        }))
      })),
      offPeakPeriods: offPeakPeriods.map(p => ({
        ...p,
        energyPrice: parseFloat(p.energyPrice) || 0,
        timePrice: parseFloat(p.timePrice) || 0,
        socRanges: (p.socRanges || []).map(s => ({
          id: s.id,
          from: parseInt(s.from, 10),
          to: parseInt(s.to, 10),
          price: parseFloat(s.price) || 0
        }))
      })),
      parkingConfig: {
        enabled: enableParkingFee,
        feePerMin: parseFloat(parkingFee) || 0,
        gracePeriodMins: parseInt(parkingGracePeriod, 10) || 0,
        startCondition: parkingChargeStarts
      }
    };

    setIsSubmitting(true);
    try {
      const payload = {
        name: tariffName.trim(),
        type: (peakPeriods.length > 0 || offPeakPeriods.length > 0) ? 'ToD' : 'Default',
        status,
        gstPercentage: parseFloat(gstPercentage) || 18,
        pricingConfig
      };

      if ((isEditMode || id) && id) {
        await updateTariff(id, payload);
        toast.success('Tariff updated successfully!', { code: 200 });
      } else {
        await createTariff(payload);
        toast.success('Tariff added successfully!', { code: 201 });
      }
      navigate('/tariffs');
    } catch (err) {
      console.error('Error saving tariff:', err);
      toast.error(err.message || 'Failed to save tariff structure', { code: err.statusCode || 500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    navigate,
    id,
    tariffName, setTariffName,
    status, setStatus,
    gstPercentage, setGstPercentage,
    parkingFee, setParkingFee,
    parkingGracePeriod, setParkingGracePeriod,
    parkingChargeStarts, setParkingChargeStarts,
    enableParkingFee, setEnableParkingFee,
    normalSocRanges, addNormalSocRange, updateNormalSocRange, removeNormalSocRange,
    normalEnergyPrice, setNormalEnergyPrice,
    normalTimePrice, setNormalTimePrice,
    peakPeriods, addPeakPeriod, removePeakPeriod, togglePeakDay, updatePeakPeriodField, addPeakSocRange, updatePeakSocRange, removePeakSocRange,
    offPeakPeriods, addOffPeakPeriod, removeOffPeakPeriod, toggleOffPeakDay, updateOffPeakPeriodField, addOffPeakSocRange, updateOffPeakSocRange, removeOffPeakSocRange,
    validationError: validationResult.valid ? null : validationResult.error,
    periodErrors: validationResult.periodErrors || {},
    socErrors: validationResult.socErrors || {},
    isSubmitting, isLoading, handleSubmit
  };
}

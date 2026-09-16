import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { createTariff, updateTariff, getTariffById } from '../api/tariffService';
import { useToast } from '../../../context/ToastContext';
import { validatePricingConfig } from '../utils/tariffValidator';

/**
 * Custom form hook for creating, editing, and viewing  tariffs.
 * Manages form state, nested pricing structures (Normal, Peak, Off-Peak, SOC tiers, Parking, GST),
 * real-time timeline overlap validation, and API submission.
 */
export function useTariffForm({ isViewMode = false, isEditMode = false } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const tariffData = location.state?.tariff;

  // 1. Basic Info States
  const [tariffName, setTariffName] = useState(tariffData?.name || '');
  const [status, setStatus] = useState(tariffData?.status || 'Active');

  // 2. GST & Parking States
  const [gstPercentage, setGstPercentage] = useState(tariffData?.gstPercentage ? tariffData.gstPercentage.replace(/[^0-9.]/g, '') : '');
  const [parkingFee, setParkingFee] = useState('');
  const [parkingGracePeriod, setParkingGracePeriod] = useState('');
  const [parkingChargeStarts, setParkingChargeStarts] = useState('After Charging Completes');
  const [enableParkingFee, setEnableParkingFee] = useState(false);

  // 3. Normal / Baseline Pricing States
  const [normalSocRanges, setNormalSocRanges] = useState([]);
  const [normalEnergyPrice, setNormalEnergyPrice] = useState('');
  const [normalTimePrice, setNormalTimePrice] = useState('');

  // 4. Special Periods (Peak & Off-Peak)
  const [peakPeriods, setPeakPeriods] = useState([]);
  const [offPeakPeriods, setOffPeakPeriods] = useState([]);

  // 5. Submission & Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Load tariff specification by ID with full error handling
  const loadTariffDetails = async (tariffId) => {
    if (!tariffId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const t = await getTariffById(tariffId);
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
                ...(s.id ? { id: s.id } : {}),
                from: String(s.from ?? ''),
                to: String(s.to ?? ''),
                price: String(s.price ?? '')
              })));
            }
          }
          if (config.peakPeriods && config.peakPeriods.length > 0) {
            setPeakPeriods(config.peakPeriods.map(p => ({
              ...p,
              ...(p.id ? { id: p.id } : {}),
              energyPrice: String(p.energyPrice ?? ''),
              timePrice: String(p.timePrice ?? ''),
              socRanges: (p.socRanges || []).map(s => ({
                ...(s.id ? { id: s.id } : {}),
                from: String(s.from ?? ''),
                to: String(s.to ?? ''),
                price: String(s.price ?? '')
              }))
            })));
          }
          if (config.offPeakPeriods && config.offPeakPeriods.length > 0) {
            setOffPeakPeriods(config.offPeakPeriods.map(p => ({
              ...p,
              ...(p.id ? { id: p.id } : {}),
              energyPrice: String(p.energyPrice ?? ''),
              timePrice: String(p.timePrice ?? ''),
              socRanges: (p.socRanges || []).map(s => ({
                ...(s.id ? { id: s.id } : {}),
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
    } catch (err) {
      console.error("Failed to load tariff details:", err);
      setFetchError(err);
      toast.error(err.message || "Failed to load tariff structure", {
        title: err.title || "Load Error",
        code: err.code || 500
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadTariffDetails(id);
    }
  }, [id]);

  // Handlers for Normal SOC Ranges
  const addNormalSocRange = () => {
    setNormalSocRanges(prev => {
      const initialFrom = prev.length === 0 ? '0' : '';
      return [...prev, { from: initialFrom, to: '', price: '' }];
    });
  };
  const updateNormalSocRange = (index, field, value) => {
    setNormalSocRanges(prev => prev.map((r, idx) => (idx === index ? { ...r, [field]: value } : r)));
  };
  const removeNormalSocRange = (index) => {
    setNormalSocRanges(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handlers for Peak Periods
  const addPeakPeriod = () => {
    const nextNum = peakPeriods.length + 1;
    setPeakPeriods(prev => [
      ...prev,
      {
        title: `Peak Period ${nextNum}`,
        startTime: '00:00',
        endTime: '00:00',
        days: [],
        energyPrice: '',
        timePrice: '',
        socRanges: []
      }
    ]);
  };
  const removePeakPeriod = (periodIndex) => {
    setPeakPeriods(prev => prev.filter((_, idx) => idx !== periodIndex));
  };
  const togglePeakDay = (periodIndex, day) => {
    setPeakPeriods(prev => prev.map((p, idx) => {
      if (idx !== periodIndex) return p;
      const exists = (p.days || []).includes(day);
      return { ...p, days: exists ? p.days.filter(d => d !== day) : [...(p.days || []), day] };
    }));
  };
  const updatePeakPeriodField = (periodIndex, field, val) => {
    setPeakPeriods(prev => prev.map((p, idx) => idx === periodIndex ? { ...p, [field]: val } : p));
  };
  const addPeakSocRange = (periodIndex) => {
    setPeakPeriods(prev => prev.map((p, idx) => {
      if (idx !== periodIndex) return p;
      const initialFrom = (p.socRanges || []).length === 0 ? '0' : '';
      return { ...p, socRanges: [...(p.socRanges || []), { from: initialFrom, to: '', price: '' }] };
    }));
  };
  const updatePeakSocRange = (periodIndex, socIndex, field, val) => {
    setPeakPeriods(prev => prev.map((p, pIdx) => pIdx === periodIndex ? {
      ...p,
      socRanges: (p.socRanges || []).map((s, sIdx) => sIdx === socIndex ? { ...s, [field]: val } : s)
    } : p));
  };
  const removePeakSocRange = (periodIndex, socIndex) => {
    setPeakPeriods(prev => prev.map((p, pIdx) => pIdx === periodIndex ? {
      ...p,
      socRanges: (p.socRanges || []).filter((_, sIdx) => sIdx !== socIndex)
    } : p));
  };

  // Handlers for Off-Peak Periods
  const addOffPeakPeriod = () => {
    const nextNum = offPeakPeriods.length + 1;
    setOffPeakPeriods(prev => [
      ...prev,
      {
        title: `Off-Peak Period ${nextNum}`,
        startTime: '00:00',
        endTime: '00:00',
        days: [],
        energyPrice: '',
        timePrice: '',
        socRanges: []
      }
    ]);
  };
  const removeOffPeakPeriod = (periodIndex) => {
    setOffPeakPeriods(prev => prev.filter((_, idx) => idx !== periodIndex));
  };
  const toggleOffPeakDay = (periodIndex, day) => {
    setOffPeakPeriods(prev => prev.map((p, idx) => {
      if (idx !== periodIndex) return p;
      const exists = (p.days || []).includes(day);
      return { ...p, days: exists ? p.days.filter(d => d !== day) : [...(p.days || []), day] };
    }));
  };
  const updateOffPeakPeriodField = (periodIndex, field, val) => {
    setOffPeakPeriods(prev => prev.map((p, idx) => idx === periodIndex ? { ...p, [field]: val } : p));
  };
  const addOffPeakSocRange = (periodIndex) => {
    setOffPeakPeriods(prev => prev.map((p, idx) => {
      if (idx !== periodIndex) return p;
      const initialFrom = (p.socRanges || []).length === 0 ? '0' : '';
      return { ...p, socRanges: [...(p.socRanges || []), { from: initialFrom, to: '', price: '' }] };
    }));
  };
  const updateOffPeakSocRange = (periodIndex, socIndex, field, val) => {
    setOffPeakPeriods(prev => prev.map((p, pIdx) => pIdx === periodIndex ? {
      ...p,
      socRanges: (p.socRanges || []).map((s, sIdx) => sIdx === socIndex ? { ...s, [field]: val } : s)
    } : p));
  };
  const removeOffPeakSocRange = (periodIndex, socIndex) => {
    setOffPeakPeriods(prev => prev.map((p, pIdx) => pIdx === periodIndex ? {
      ...p,
      socRanges: (p.socRanges || []).filter((_, sIdx) => sIdx !== socIndex)
    } : p));
  };

  // Real-time pricing overlap and boundary validation
  const validationResult = useMemo(() => {
    const parseNum = (val) => (val !== '' && val !== null && val !== undefined ? parseFloat(val) : undefined);
    const pricingConfig = {
      gstPercentage: parseNum(gstPercentage),
      normalPricing: {
        energyPrice: parseNum(normalEnergyPrice),
        timePrice: parseNum(normalTimePrice),
        socRanges: normalSocRanges.map(s => ({
          ...(s.id ? { id: s.id } : {}),
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
          ...(s.id ? { id: s.id } : {}),
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
          ...(s.id ? { id: s.id } : {}),
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

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!tariffName.trim()) {
      toast.error('Tariff Name is required', {
        title: 'Validation Error',
        code: 400
      });
      return;
    }

    if (normalEnergyPrice === '' || isNaN(parseFloat(normalEnergyPrice)) || parseFloat(normalEnergyPrice) < 0) {
      toast.error('Valid Normal Energy Price rate is required (>= 0)', {
        title: 'Validation Error',
        code: 400
      });
      return;
    }

    if (!validationResult.valid) {
      toast.error(validationResult.error, {
        title: 'Configuration Validation Error',
        code: 400
      });
      return;
    }

    const pricingConfig = {
      normalPricing: {
        energyPrice: parseFloat(normalEnergyPrice) || 0,
        timePrice: parseFloat(normalTimePrice) || 0,
        socRanges: normalSocRanges.map((s) => ({
          ...(s.id ? { id: s.id } : {}),
          from: parseInt(s.from, 10),
          to: parseInt(s.to, 10),
          price: parseFloat(s.price) || 0
        }))
      },
      peakPeriods: peakPeriods.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        title: p.title,
        startTime: p.startTime,
        endTime: p.endTime,
        days: p.days || [],
        energyPrice: parseFloat(p.energyPrice) || 0,
        timePrice: parseFloat(p.timePrice) || 0,
        socRanges: (p.socRanges || []).map((s) => ({
          ...(s.id ? { id: s.id } : {}),
          from: parseInt(s.from, 10),
          to: parseInt(s.to, 10),
          price: parseFloat(s.price) || 0
        }))
      })),
      offPeakPeriods: offPeakPeriods.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        title: p.title,
        startTime: p.startTime,
        endTime: p.endTime,
        days: p.days || [],
        energyPrice: parseFloat(p.energyPrice) || 0,
        timePrice: parseFloat(p.timePrice) || 0,
        socRanges: (p.socRanges || []).map((s) => ({
          ...(s.id ? { id: s.id } : {}),
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
        toast.success('Tariff updated successfully!', {
          title: 'Tariff Updated',
          code: 200
        });
      } else {
        await createTariff(payload);
        toast.success('Tariff added successfully!', {
          title: 'Tariff Created',
          code: 201
        });
      }
      navigate('/tariffs');
    } catch (err) {
      console.error('Error saving tariff:', err);
      toast.error(err.message || 'Failed to save tariff structure', {
        title: err.title || 'Save Error',
        code: err.code || 500
      });
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
    isSubmitting,
    isLoading,
    fetchError,
    reloadTariff: () => loadTariffDetails(id),
    handleSubmit
  };
}

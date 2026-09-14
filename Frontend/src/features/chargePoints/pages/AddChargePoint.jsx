import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import BackButton from '../../../components/ui/BackButton';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import LabelWithInfo from '../../../components/ui/LabelWithInfo';
import FormCard from '../../../components/ui/FormCard';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { createChargePoint, updateChargePoint, getChargePointById, getFilterOptions } from '../api/chargePointService';
import { useToast } from '../../../context/ToastContext';

// 1. Zod Form Validation Schemas

// Validation schema for individual charging method options (SoC, Units, Amount, Time)
const chargingMethodSchema = z.object({
  id: z.string(),
  label: z.string(),
  selected: z.boolean(),
  value: z.union([z.string(), z.number()]).optional(),
  placeholder: z.string(),
  unit: z.string(),
  isFirst: z.boolean()
}).refine(data => !data.selected || (data.value !== undefined && data.value !== null && String(data.value).trim() !== ''), {
  message: "Required when selected",
  path: ["value"]
}).refine(data => {
  if (!data.selected || data.value === undefined || data.value === null || String(data.value).trim() === '') return true;
  const num = Number(data.value);
  return !isNaN(num) && num >= 0;
}, {
  message: "Cannot be negative",
  path: ["value"]
});

// Main validation schema for Charge Point form fields
const chargePointSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  chargingStation: z.string().min(1, 'Charging Station is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  mode: z.string().min(1, 'Mode is required'),
  code: z.string().optional(),
  accessibility: z.string().min(1, 'Accessibility is required'),
  stage: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  exclusive: z.string().min(1, 'This field is required'),
  gracePeriod: z.string().refine(val => !val || Number(val) >= 0, { message: "Cannot be negative" }).optional(),
  tariffProfiles: z.string().min(1, 'Tariff Profile is required'),
  settlementProfile: z.string().optional(),
  chargingMethods: z.array(chargingMethodSchema)
});

// 2. Default Charging Method Choices
const defaultMethods = [
  { id: 'soc', label: 'SoC', selected: false, value: '', placeholder: 'Eg:100', unit: '%', isFirst: false },
  { id: 'units', label: 'Units', selected: false, value: '', placeholder: 'Eg: 3', unit: 'kWh', isFirst: false },
  { id: 'amount', label: 'Amount', selected: false, value: '', placeholder: 'Eg: 50', unit: '₹', isFirst: false },
  { id: 'time', label: 'Time', selected: false, value: '', placeholder: 'Eg: 20', unit: 'mins', isFirst: false },
];

// 3. Main Component: Add / Edit / View Charge Point Form
export default function AddNewChargePoint({ isViewMode = false, isEditMode = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const chargePointData = location.state?.chargePoint;

  // Component states
  const [loadingData, setLoadingData] = useState(false);
  const [activeChargePoint, setActiveChargePoint] = useState(chargePointData);
  const [stationOptions, setStationOptions] = useState([]);
  const [tariffOptions, setTariffOptions] = useState([]);

  // 4. Fetch Dynamic Dropdown Options (Charging Stations & Tariffs)
  useEffect(() => {
    getFilterOptions()
      .then(res => {
        if (res) {
          const stations = res.locations || (res.stations ? res.stations.map(s => s.name) : []);
          const tariffs = res.tariffNames || (res.tariffs ? res.tariffs.map(t => t.name) : []);
          setStationOptions(stations.filter(Boolean));
          setTariffOptions(tariffs.filter(Boolean));
        }
      })
      .catch(err => {
        console.error('Failed to load dropdown options:', err);
        setStationOptions([]);
        setTariffOptions([]);
      });
  }, []);

  // 5. Initialize React Hook Form with Zod Validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(chargePointSchema),
    defaultValues: (isViewMode || isEditMode) && chargePointData ? {
      ...chargePointData,
      chargingStation: typeof chargePointData.chargingStation === 'object' ? (chargePointData.chargingStation?.name || '') : (chargePointData.chargingStation || ''),
      tariffProfiles: typeof chargePointData.tariff === 'object' ? (chargePointData.tariff?.name || '') : (chargePointData.tariffProfiles || ''),
      gracePeriod: chargePointData.gracePeriod ? chargePointData.gracePeriod.toString() : '',
      type: chargePointData.type || '',
      chargingMethods: defaultMethods.map(defMethod => {
        const savedMethod = (chargePointData.chargingMethods || []).find(m => m.id === defMethod.id);
        const valueStr = savedMethod && savedMethod.value !== null && savedMethod.value !== undefined ? savedMethod.value.toString() : '';
        return savedMethod ? { ...defMethod, ...savedMethod, value: valueStr, selected: true } : defMethod;
      })
    } : {
      name: '',
      chargingStation: '',
      manufacturer: '',
      mode: '',
      code: '',
      accessibility: '',
      stage: '',
      type: '',
      exclusive: '',
      gracePeriod: '',
      tariffProfiles: '',
      settlementProfile: '',
      chargingMethods: defaultMethods
    }
  });

  // 6. Pre-fill Form When Editing or Viewing an Existing Charge Point
  useEffect(() => {
    if ((isViewMode || isEditMode) && id) {
      setLoadingData(true);
      getChargePointById(id)
        .then(data => {
          if (!data) return;
          setActiveChargePoint(data);
          reset({
            ...data,
            chargingStation: typeof data.chargingStation === 'object' ? (data.chargingStation?.name || '') : (data.chargingStation || ''),
            tariffProfiles: typeof data.tariff === 'object' ? (data.tariff?.name || '') : (data.tariffProfiles || ''),
            gracePeriod: data.gracePeriod ? data.gracePeriod.toString() : '',
            type: data.type || '',
            chargingMethods: defaultMethods.map(defMethod => {
              const savedMethod = (data.chargingMethods || []).find(m => m.id === defMethod.id);
              const valueStr = savedMethod && savedMethod.value !== null && savedMethod.value !== undefined ? savedMethod.value.toString() : '';
              return savedMethod ? { ...defMethod, ...savedMethod, value: valueStr, selected: true } : defMethod;
            })
          });
        })
        .catch(err => {
          console.error("Failed to fetch charge point:", err);
          toast.error("Failed to load charge point data.");
          navigate('/charge-points');
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [id, isViewMode, isEditMode, reset, navigate, toast]);

  // Watch charging methods state for interactive checkbox / radio toggle
  const chargingMethods = watch('chargingMethods');

  // Set selected charging method as primary / default option
  const handleFirstOptionChange = (index) => {
    chargingMethods.forEach((_, i) => setValue(`chargingMethods.${i}.isFirst`, false));
    setValue(`chargingMethods.${index}.isFirst`, true);
  };

  // 7. Form Submit Handler (Create / Update via REST API)
  const onSubmit = async (data) => {
    try {
      const activeMethods = (data.chargingMethods || [])
        .filter(m => m.selected)
        .map(({ id, value, isFirst }) => ({
          id,
          value: value ? Number(value) : null,
          isFirst: Boolean(isFirst)
        }));

      // Structure clean and meaningful payload
      const payload = {
        name: data.name,
        code: data.code || undefined,
        chargingStation: data.chargingStation,
        manufacturer: data.manufacturer,
        mode: data.mode,
        accessibility: data.accessibility,
        stage: data.stage || 'Active',
        type: data.type,
        exclusive: data.exclusive,
        gracePeriod: data.gracePeriod && String(data.gracePeriod).trim() !== '' ? parseInt(data.gracePeriod, 10) : 0,
        tariff: data.tariffProfiles || data.tariff,
        settlementProfile: data.settlementProfile || 'Standard Rate',
        chargingMethods: activeMethods
      };

      const targetId = activeChargePoint?.id || id;
      if (isEditMode && targetId) {
        await updateChargePoint(targetId, payload);
        toast.success('Charge point updated successfully!', { code: 200 });
      } else {
        await createChargePoint(payload);
        toast.success('Charge point added successfully!', { code: 201 });
      }

      navigate('/charge-points');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save charge point.', { code: 500 });
    }
  };

  // 8. Loading State Spinner
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#4DA944]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading charge point details...</p>
      </div>
    );
  }

  // 9. Main Form Render
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-[1200px] mx-auto pb-10 animate-in fade-in duration-200">
      {/* Top Header: Back Button & Action Controls */}
      <div className="flex items-center justify-between px-2">
        <div>
          <BackButton to="/charge-points" label="Back to Charge Points" />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (isViewMode) {
                navigate('/charge-points');
              } else {
                reset({
                  name: '',
                  chargingStation: '',
                  manufacturer: '',
                  mode: '',
                  code: '',
                  accessibility: '',
                  stage: '',
                  type: '',
                  exclusive: '',
                  gracePeriod: '',
                  tariffProfiles: '',
                  settlementProfile: '',
                  chargingMethods: defaultMethods
                });
              }
            }}
            className="px-4 py-2 text-sm bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium rounded-lg shadow-sm transition-colors duration-200 cursor-pointer"
          >
            {isViewMode ? 'Back' : 'Cancel'}
          </button>
          {!isViewMode && (
            <PrimaryButton
              type="submit"
              isSubmitting={isSubmitting}
              isEditMode={isEditMode}
              addLabel="Add"
              editLabel="Save Changes"
            />
          )}
        </div>
      </div>

      {/* Two-Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left Column: Basic Details */}
        <FormCard title="Basic Details">
          {/* Charge Point Name */}
          <div>
            <LabelWithInfo htmlFor="name" label="Name" required />
            <Input id="name" disabled={isViewMode} placeholder="" {...register('name')} error={errors.name} />
          </div>

          {/* Charging Station Dropdown */}
          <div>
            <LabelWithInfo htmlFor="chargingStation" label="Charging Station" required />
            <Select
              id="chargingStation"
              disabled={isViewMode}
              options={stationOptions}
              {...register('chargingStation')}
              error={errors.chargingStation}
            />
          </div>

          {/* Manufacturer / OEM */}
          <div>
            <LabelWithInfo htmlFor="manufacturer" label="Manufacturer / OEM" required />
            <Input id="manufacturer" disabled={isViewMode} placeholder="Search for OEMs" {...register('manufacturer')} error={errors.manufacturer} />
          </div>

          {/* Operating Mode */}
          <div>
            <LabelWithInfo htmlFor="mode" label="Mode" required info="Mode of operation" />
            <Select id="mode" disabled={isViewMode} options={['Public', 'Private']} {...register('mode')} error={errors.mode} />
          </div>

          {/* Charge Point Code */}
          <div>
            <LabelWithInfo htmlFor="code" label="Code" />
            <Input id="code" disabled={isViewMode} placeholder="ABC12345" {...register('code')} error={errors.code} />
          </div>

          {/* Accessibility */}
          <div>
            <LabelWithInfo htmlFor="accessibility" label="Accessibility" required />
            <Select id="accessibility" disabled={isViewMode} options={['Public', 'Restricted']} {...register('accessibility')} error={errors.accessibility} />
          </div>

          {/* Operational Stage */}
          <div>
            <LabelWithInfo htmlFor="stage" label="Stage" />
            <Select id="stage" disabled={isViewMode} options={['Active', 'Inactive']} {...register('stage')} error={errors.stage} />
          </div>

          {/* Hardware Charger Type */}
          <div>
            <LabelWithInfo htmlFor="type" label="Type" required info="Select Charger Type" />
            <Select id="type" disabled={isViewMode} options={['AC', 'DC', 'NA']} {...register('type')} error={errors.type} />
          </div>
        </FormCard>

        {/* Right Column: Other Details */}
        <FormCard title="Other Details">
          {/* Exclusivity */}
          <div>
            <LabelWithInfo htmlFor="exclusive" label="Is this charger exclusive?" required info="Mark if only for exclusive use." />
            <Select id="exclusive" disabled={isViewMode} options={['Exclusive', 'Shared']} {...register('exclusive')} error={errors.exclusive} />
          </div>

          {/* Supported Charging Methods Table */}
          <div>
            <LabelWithInfo label="Supported Charging Methods" info="Select all that apply." />

            <div className="mt-3">
              <div className="grid grid-cols-[60px_1fr_1.5fr_80px] gap-4 px-2 pb-2.5 mb-1 text-[10px] font-extrabold text-stone-500 tracking-wider uppercase border-b border-stone-200/60">
                <div className="text-center">Select</div>
                <div>Method</div>
                <div>Amount</div>
                <div className="text-center">Default</div>
              </div>

              <div className="flex flex-col gap-1.5">
                {chargingMethods.map((method, index) => (
                  <div key={method.id} className={`grid grid-cols-[60px_1fr_1.5fr_80px] gap-4 items-center px-2 py-2 rounded-xl transition-all duration-200 ${method.selected ? 'bg-stone-50/80 border border-stone-200/60' : 'hover:bg-stone-50/40 border border-transparent'}`}>
                    <div className="flex justify-center">
                      <label htmlFor={`method-selected-${index}`} className="relative flex items-center justify-center w-6 h-6 cursor-pointer">
                        <input
                          id={`method-selected-${index}`}
                          type="checkbox"
                          disabled={isViewMode}
                          {...register(`chargingMethods.${index}.selected`)}
                          className="peer sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md transition-all flex items-center justify-center text-transparent peer-checked:text-[#4DA944] peer-checked:border-[#4DA944] bg-white border border-stone-300 shadow-2xs ${isViewMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </label>
                    </div>
                    <div className="text-xs font-bold text-stone-800">{method.label}</div>
                    <div className="relative">
                      <input
                        id={`method-value-${index}`}
                        type="number"
                        min="0"
                        placeholder={method.placeholder}
                        aria-label={`${method.label} amount`}
                        {...register(`chargingMethods.${index}.value`)}
                        disabled={isViewMode || !method.selected}
                        className={`block w-full rounded-xl py-2 pr-10 pl-3 text-xs neo-form-input text-stone-800 outline-none transition-all duration-200 disabled:opacity-50 ${errors?.chargingMethods?.[index]?.value ? 'neo-form-error' : ''}`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-stone-400 font-bold text-xs">{method.unit}</span>
                      </div>
                      {errors?.chargingMethods?.[index]?.value && (
                        <div className="absolute -bottom-4 left-0 text-[10px] font-bold text-rose-500 whitespace-nowrap">
                          {errors.chargingMethods[index].value.message}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <label htmlFor={`method-default-${index}`} className="relative flex items-center justify-center w-6 h-6 cursor-pointer">
                        <input
                          id={`method-default-${index}`}
                          name="default_charging_method"
                          type="radio"
                          checked={method.isFirst}
                          onChange={() => handleFirstOptionChange(index)}
                          disabled={isViewMode || !method.selected}
                          className="peer sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full transition-all flex items-center justify-center bg-white border border-stone-300 shadow-2xs ${(!method.selected || isViewMode) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className={`w-2 h-2 rounded-full bg-[#4DA944] transition-all ${method.isFirst && method.selected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grace Period (minutes) */}
          <div>
            <LabelWithInfo htmlFor="gracePeriod" label="Grace Period" info="Time allowed before action" />
            <div className="relative mt-2">
              <input
                id="gracePeriod"
                type="number"
                min="0"
                placeholder="Eg: 5"
                disabled={isViewMode}
                {...register('gracePeriod')}
                className={`block w-full rounded-2xl border-0 py-3 pr-20 pl-5 sm:text-sm sm:leading-6 neo-form-input text-stone-800 outline-none transition-all duration-300 disabled:opacity-50 ${errors?.gracePeriod ? 'neo-form-error' : ''}`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                <span className="text-stone-500 font-bold sm:text-sm">minutes</span>
              </div>
              {errors?.gracePeriod && (
                <div className="text-xs font-bold text-pink-500 mt-2">
                  {errors.gracePeriod.message}
                </div>
              )}
            </div>
          </div>

          {/* Tariff Profile Dropdown */}
          <div>
            <LabelWithInfo htmlFor="tariffProfiles" label="Tariff Profiles" required />
            <Select
              id="tariffProfiles"
              disabled={isViewMode}
              options={tariffOptions}
              {...register('tariffProfiles')}
              error={errors.tariffProfiles}
            />
          </div>

          {/* Settlement Profile */}
          <div>
            <LabelWithInfo htmlFor="settlementProfile" label="Settlement Profile" />
            <Select id="settlementProfile" disabled={isViewMode} options={['Profile A', 'Profile B']} {...register('settlementProfile')} error={errors.settlementProfile} />
          </div>
        </FormCard>
      </div>
    </form>
  );
}

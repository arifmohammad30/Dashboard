import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import LabelWithInfo from '../../components/ui/LabelWithInfo';
import FormCard from '../../components/ui/FormCard';
import { createChargePoint, updateChargePoint, getChargePointById } from '../../services/chargePointService';
import { useToast } from '../../context/ToastContext';

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

const defaultMethods = [
  { id: 'soc', label: 'SoC', selected: false, value: '', placeholder: 'Eg:100', unit: '%', isFirst: false },
  { id: 'units', label: 'Units', selected: false, value: '', placeholder: 'Eg: 3', unit: 'kWh', isFirst: false },
  { id: 'amount', label: 'Amount', selected: false, value: '', placeholder: 'Eg: 50', unit: '\u20B9', isFirst: false },
  { id: 'time', label: 'Time', selected: false, value: '', placeholder: 'Eg: 20', unit: 'mins', isFirst: false },
];

export default function AddNewChargePoint({ isViewMode = false, isEditMode = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const chargePointData = location.state?.chargePoint;

  const [loadingData, setLoadingData] = useState(false);
  const [activeChargePoint, setActiveChargePoint] = useState(chargePointData);

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

  useEffect(() => {
    if ((isViewMode || isEditMode) && !chargePointData && id) {
      setLoadingData(true);
      getChargePointById(id)
        .then(data => {
          setActiveChargePoint(data);
          reset({
            ...data,
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
          alert("Failed to load charge point data.");
          navigate('/charge-points');
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [id, chargePointData, isViewMode, isEditMode, reset, navigate]);

  const chargingMethods = watch('chargingMethods');

  const handleFirstOptionChange = (index) => {
    chargingMethods.forEach((_, i) => setValue(`chargingMethods.${i}.isFirst`, false));
    setValue(`chargingMethods.${index}.isFirst`, true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        gracePeriod: data.gracePeriod && data.gracePeriod.trim() !== '' ? parseInt(data.gracePeriod, 10) : null,
        supportedChargingMethods: data.chargingMethods
          .filter(m => m.selected)
          .map(({ id, value, isFirst }) => ({
            id,
            value: value ? Number(value) : null,
            isFirst
          }))
      };
      delete payload.chargingMethods;

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

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-orange-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading charge point details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 max-w-[1200px] mx-auto pb-10">
      {/* Header */}
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
            className="px-4 py-2 text-sm bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium rounded-lg shadow-sm transition-colors duration-200"
          >
            {isViewMode ? 'Back' : 'Cancel'}
          </button>
          {!isViewMode && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isEditMode ? 'Save Changes' : 'Add'}
            </button>
          )}
        </div>
      </div>

      {/* Forms layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column */}
        <FormCard title="Basic Details">
          <div>
            <LabelWithInfo label="Name" required />
            <Input disabled={isViewMode} placeholder="" {...register('name')} error={errors.name} />
          </div>

          <div>
            <LabelWithInfo label="Charging Station" required />
            <Input disabled={isViewMode} placeholder="Search for a Charging Station" {...register('chargingStation')} error={errors.chargingStation} />
          </div>

          <div>
            <LabelWithInfo label="Manufacturer / OEM" required />
            <Input disabled={isViewMode} placeholder="Search for OEMs" {...register('manufacturer')} error={errors.manufacturer} />
          </div>

          <div>
            <LabelWithInfo label="Mode" required info="Mode of operation" />
            <Select disabled={isViewMode} options={['Public', 'Private']} {...register('mode')} error={errors.mode} />
          </div>

          <div>
            <LabelWithInfo label="Code" />
            <Input disabled={isViewMode} placeholder="ABC12345" {...register('code')} error={errors.code} />
          </div>

          <div>
            <LabelWithInfo label="Accessibility" required />
            <Select disabled={isViewMode} options={['Public', 'Restricted']} {...register('accessibility')} error={errors.accessibility} />
          </div>

          <div>
            <LabelWithInfo label="Stage" />
            <Select disabled={isViewMode} options={['Active', 'Inactive']} {...register('stage')} error={errors.stage} />
          </div>

          <div>
            <LabelWithInfo label="Type" required info="Select Charger Type" />
            <Select disabled={isViewMode} options={['AC', 'DC', 'NA']} {...register('type')} error={errors.type} />
          </div>
        </FormCard>

        {/* Right Column */}
        <FormCard title="Other Details">
          <div>
            <LabelWithInfo label="Is this charger exclusive?" required info="Mark if only for exclusive use." />
            <Select disabled={isViewMode} options={['Exclusive', 'Shared']} {...register('exclusive')} error={errors.exclusive} />
          </div>

          <div>
            <LabelWithInfo label="Supported Charging Methods" info="Select all that apply." />

            <div className="mt-4 bg-[var(--neo-bg-10)] shadow-[inset_5px_5px_10px_rgba(120,113,108,0.15),inset_-5px_-5px_10px_rgba(255,255,255,0.6)] rounded-3xl p-3 border border-white/50 backdrop-blur-xl">
              <div className="grid grid-cols-[60px_1fr_1.5fr_80px] gap-4 px-2 pb-3 mb-1 text-[10px] font-extrabold text-stone-500 tracking-wider uppercase border-b border-stone-200/50">
                <div className="text-center">Select</div>
                <div>Method</div>
                <div>Amount</div>
                <div className="text-center">Default</div>
              </div>

              <div className="flex flex-col gap-1">
                {chargingMethods.map((method, index) => (
                  <div key={method.id} className={`grid grid-cols-[60px_1fr_1.5fr_80px] gap-4 items-center px-2 py-2.5 rounded-2xl transition-all duration-300 ${method.selected ? 'bg-white/80 shadow-sm border border-white/80' : 'hover:bg-white/40 border border-transparent'}`}>
                    <div className="flex justify-center">
                      <label className="relative flex items-center justify-center w-6 h-6 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isViewMode}
                          {...register(`chargingMethods.${index}.selected`)}
                          className="peer sr-only"
                        />
                        <div className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center text-transparent peer-checked:text-rose-500 bg-white/60 border border-stone-300 shadow-sm ${isViewMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </label>
                    </div>
                    <div className="text-sm font-bold text-stone-700">{method.label}</div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder={method.placeholder}
                        {...register(`chargingMethods.${index}.value`)}
                        disabled={isViewMode || !method.selected}
                        className={`block w-full rounded-xl py-2.5 pr-12 pl-4 text-sm neo-form-input text-stone-800 outline-none transition-all duration-300 disabled:opacity-50 ${errors?.chargingMethods?.[index]?.value ? 'neo-form-error' : ''}`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-stone-500 font-bold sm:text-sm">{method.unit}</span>
                      </div>
                      {errors?.chargingMethods?.[index]?.value && (
                        <div className="absolute -bottom-4 left-0 text-[10px] font-bold text-pink-500 whitespace-nowrap">
                          {errors.chargingMethods[index].value.message}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <label className="relative flex items-center justify-center w-6 h-6 cursor-pointer">
                        <input
                          type="radio"
                          checked={method.isFirst}
                          onChange={() => handleFirstOptionChange(index)}
                          disabled={isViewMode || !method.selected}
                          className="peer sr-only"
                        />
                        <div className={`w-6 h-6 rounded-full transition-all flex items-center justify-center bg-white/60 border border-stone-300 shadow-sm ${(!method.selected || isViewMode) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className={`w-2.5 h-2.5 rounded-full bg-pink-500 transition-all ${method.isFirst && method.selected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <LabelWithInfo label="Grace Period" info="Time allowed before action" />
            <div className="relative mt-2">
              <input
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

          <div>
            <LabelWithInfo label="Tariff Profiles" required />
            <Input disabled={isViewMode} placeholder="" {...register('tariffProfiles')} error={errors.tariffProfiles} />
          </div>

          <div>
            <LabelWithInfo label="Settlement Profile" />
            <Select disabled={isViewMode} options={['Profile A', 'Profile B']} {...register('settlementProfile')} error={errors.settlementProfile} />
          </div>
        </FormCard>
      </div>
    </form>
  );
}

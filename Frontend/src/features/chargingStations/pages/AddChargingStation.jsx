import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import BackButton from '../../../components/ui/BackButton';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Plus, Loader2, Trash2, Clock } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import LabelWithInfo from '../../../components/ui/LabelWithInfo';
import FormCard from '../../../components/ui/FormCard';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { createChargingStation, updateChargingStation, getChargingStationById } from '../api/chargingStationService';
import { useToast } from '../../../context/ToastContext';

const codeRegex = /^[A-Za-z0-9_-]+$/;
const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm|AM|PM)$|^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/i;

const chargingStationSchema = z.object({
  name: z.string().trim().min(2, 'Station name must be at least 2 characters'),
  brand: z.string().trim().min(1, 'Brand / OEM selection is required'),
  mobilityType: z.string().min(1, 'Mobility Type selection is required'),
  code: z.string().trim().refine(val => !val || codeRegex.test(val), {
    message: 'Station code can only contain letters, numbers, dashes, and underscores'
  }).optional(),
  category: z.string().optional(),
  latitude: z.string().trim().min(1, 'Latitude coordinate is required').refine(val => {
    const num = Number(val);
    return !isNaN(num) && num >= -90 && num <= 90;
  }, {
    message: 'Latitude must be a valid coordinate between -90 and 90'
  }),
  longitude: z.string().trim().min(1, 'Longitude coordinate is required').refine(val => {
    const num = Number(val);
    return !isNaN(num) && num >= -180 && num <= 180;
  }, {
    message: 'Longitude must be a valid coordinate between -180 and 180'
  }),

  address: z.string().trim().min(4, 'Detailed street address must be at least 4 characters'),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  timeZone: z.string().optional(),
  elevation: z.string().refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: 'Elevation must be a non-negative number'
  }).optional(),

  gridPowerCapacity: z.string().refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), {
    message: 'Grid power capacity must be a positive number in kW'
  }).optional(),
  gridCurrentCapacity: z.string().refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), {
    message: 'Grid current capacity must be a positive number in A'
  }).optional(),
  gridPhases: z.string().optional(),
  energyMeters: z.string().optional(),

  stage: z.string().optional(),
  open247: z.boolean().optional(),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),

  contactNumbers: z.array(z.object({
    number: z.string().refine(val => !val || phoneRegex.test(val.trim()), {
      message: 'Invalid phone number format (e.g. +91 9876543210)'
    })
  })).optional(),
  amenities: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.open247) {
    if (!data.opensAt || data.opensAt.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Opening time is required when not 24×7',
        path: ['opensAt']
      });
    } else if (!timeRegex.test(data.opensAt.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Opening time must be valid format (e.g. 08:00 am or 08:00)',
        path: ['opensAt']
      });
    }

    if (!data.closesAt || data.closesAt.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Closing time is required when not 24×7',
        path: ['closesAt']
      });
    } else if (!timeRegex.test(data.closesAt.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Closing time must be valid format (e.g. 09:00 pm or 21:00)',
        path: ['closesAt']
      });
    }
  }
});

export default function AddChargingStation({ isViewMode = false, isEditMode = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const stationData = location.state?.station;

  const [loadingData, setLoadingData] = useState(false);
  const [activeStation, setActiveStation] = useState(stationData);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(chargingStationSchema),
    defaultValues: (isViewMode || isEditMode) && stationData ? {
      name: stationData.name || '',
      brand: stationData.brand || '',
      mobilityType: stationData.mobilityType || '',
      code: stationData.code || '',
      category: stationData.category || '',
      latitude: stationData.latitude !== undefined && stationData.latitude !== null ? String(stationData.latitude) : '',
      longitude: stationData.longitude !== undefined && stationData.longitude !== null ? String(stationData.longitude) : '',
      address: stationData.address || '',
      country: stationData.country || '',
      state: stationData.state || '',
      city: stationData.city || '',
      timeZone: stationData.timeZone || '',
      elevation: stationData.elevation !== undefined && stationData.elevation !== null ? String(stationData.elevation) : '',
      gridPowerCapacity: stationData.gridPowerCapacity ? String(stationData.gridPowerCapacity) : '',
      gridCurrentCapacity: stationData.gridCurrentCapacity ? String(stationData.gridCurrentCapacity) : '',
      gridPhases: stationData.gridPhases || '',
      energyMeters: stationData.energyMeters || '',
      stage: stationData.stage || '',
      open247: stationData.open247 ?? false,
      opensAt: stationData.opensAt || '',
      closesAt: stationData.closesAt || '',
      contactNumbers: stationData.contactNumbers && stationData.contactNumbers.length > 0
        ? stationData.contactNumbers.map(n => ({ number: n }))
        : [{ number: '' }],
      amenities: stationData.amenities || '',
    } : {
      name: '',
      brand: '',
      mobilityType: '',
      code: '',
      category: '',
      latitude: '',
      longitude: '',
      address: '',
      country: '',
      state: '',
      city: '',
      timeZone: '',
      elevation: '',
      gridPowerCapacity: '',
      gridCurrentCapacity: '',
      gridPhases: '',
      energyMeters: '',
      stage: '',
      open247: false,
      opensAt: '',
      closesAt: '',
      contactNumbers: [{ number: '' }],
      amenities: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contactNumbers'
  });

  const open247 = watch('open247');

  useEffect(() => {
    if ((isViewMode || isEditMode) && !stationData && id) {
      setLoadingData(true);
      getChargingStationById(id)
        .then(data => {
          setActiveStation(data);
          reset({
            name: data.name || '',
            brand: data.brand || '',
            mobilityType: data.mobilityType || '',
            code: data.code || '',
            category: data.category || '',
            latitude: data.latitude !== undefined && data.latitude !== null ? String(data.latitude) : '',
            longitude: data.longitude !== undefined && data.longitude !== null ? String(data.longitude) : '',
            address: data.address || '',
            country: data.country || '',
            state: data.state || '',
            city: data.city || '',
            timeZone: data.timeZone || '',
            elevation: data.elevation !== undefined && data.elevation !== null ? String(data.elevation) : '',
            gridPowerCapacity: data.gridPowerCapacity ? String(data.gridPowerCapacity) : '',
            gridCurrentCapacity: data.gridCurrentCapacity ? String(data.gridCurrentCapacity) : '',
            gridPhases: data.gridPhases || '',
            energyMeters: data.energyMeters || '',
            stage: data.stage || '',
            open247: data.open247 ?? false,
            opensAt: data.opensAt || '',
            closesAt: data.closesAt || '',
            contactNumbers: data.contactNumbers && data.contactNumbers.length > 0
              ? data.contactNumbers.map(n => ({ number: n }))
              : [{ number: '' }],
            amenities: data.amenities || '',
          });
        })
        .catch(err => {
          console.error("Failed to fetch charging station:", err);
          toast.error("Failed to load charging station data.");
          navigate('/charging-stations');
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [id, stationData, isViewMode, isEditMode, reset, navigate, toast]);

  const handleCancelClick = () => {
    if (isViewMode) {
      navigate('/charging-stations');
    } else {
      reset({
        name: '',
        brand: '',
        mobilityType: '',
        code: '',
        category: '',
        latitude: '',
        longitude: '',
        address: '',
        country: '',
        state: '',
        city: '',
        timeZone: '',
        elevation: '',
        gridPowerCapacity: '',
        gridCurrentCapacity: '',
        gridPhases: '',
        energyMeters: '',
        stage: '',
        open247: false,
        opensAt: '',
        closesAt: '',
        contactNumbers: [{ number: '' }],
        amenities: '',
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        contactNumbers: data.contactNumbers ? data.contactNumbers.map(c => c.number).filter(Boolean) : [],
        elevation: data.elevation ? Number(data.elevation) : 0,
        gridPowerCapacity: data.gridPowerCapacity ? Number(data.gridPowerCapacity) : null,
        gridCurrentCapacity: data.gridCurrentCapacity ? Number(data.gridCurrentCapacity) : null,
      };

      const targetId = activeStation?.id || id;
      if (isEditMode && targetId) {
        await updateChargingStation(targetId, payload);
        toast.success('Charging station updated successfully!', { code: 200 });
      } else {
        await createChargingStation(payload);
        toast.success('Charging station added successfully!', { code: 201 });
      }

      navigate('/charging-stations');
    } catch (error) {
      console.error('Error submitting station form:', error);
      toast.error('Failed to save charging station.', { code: 500 });
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#1EB8D4]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading charging station details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-[1280px] mx-auto pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-2">
        <div>
          <BackButton to="/charging-stations" label="Back to Charging Stations" />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCancelClick}
            className="h-9 px-4 inline-flex items-center justify-center text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-xl shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5">
          <FormCard title="Basic Details">
            <div>
              <LabelWithInfo htmlFor="name" label="Name" required info="Public Display Name of the Charging Station" />
              <Input id="name" disabled={isViewMode} placeholder="Lonavala Wax Museum" {...register('name')} error={errors.name} />
            </div>

            <div>
              <LabelWithInfo htmlFor="brand" label="Brand" required info="Select or specify manufacturing brand" />
              <Input id="brand" disabled={isViewMode} placeholder="Search for Brands" {...register('brand')} error={errors.brand} />
            </div>

            <div>
              <LabelWithInfo htmlFor="mobilityType" label="Mobility Type" required info="Operational mobility classification" />
              <Select
                id="mobilityType"
                disabled={isViewMode}
                placeholder="Select Mobility Type"
                options={['Stationary', 'Mobile', 'Portable']}
                {...register('mobilityType')}
                error={errors.mobilityType}
              />
            </div>

            <div>
              <LabelWithInfo htmlFor="code" label="Code" info="Unique internal site identifier code" />
              <Input id="code" disabled={isViewMode} placeholder="ABC12345" {...register('code')} error={errors.code} />
            </div>

            <div>
              <LabelWithInfo htmlFor="category" label="Charging Station Category" info="Functional environment classification" />
              <Select
                id="category"
                disabled={isViewMode}
                placeholder="Select Category"
                options={['Public Hub', 'Commercial', 'Residential', 'Highway Hub', 'Fleet Hub', 'Other']}
                {...register('category')}
                error={errors.category}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <LabelWithInfo htmlFor="latitude" label="Latitude" required info="GPS Latitude coordinate (-90 to 90)" />
                <Input id="latitude" type="number" step="any" disabled={isViewMode} placeholder="18.0986544" {...register('latitude')} error={errors.latitude} />
              </div>
              <div>
                <LabelWithInfo htmlFor="longitude" label="Longitude" required info="GPS Longitude coordinate (-180 to 180)" />
                <Input id="longitude" type="number" step="any" disabled={isViewMode} placeholder="72.9162627" {...register('longitude')} error={errors.longitude} />
              </div>
            </div>
          </FormCard>

          <FormCard title="Power supply details">
            <div>
              <LabelWithInfo htmlFor="gridPowerCapacity" label="Grid Connection Power Capacity (kW)" info="Maximum allowed power intake in kilowatts" />
              <Input id="gridPowerCapacity" type="number" step="any" min="0" disabled={isViewMode} placeholder="kW (e.g. 100)" {...register('gridPowerCapacity')} error={errors.gridPowerCapacity} />
            </div>

            <div>
              <LabelWithInfo htmlFor="gridCurrentCapacity" label="Grid Connection Current Capacity (A)" info="Maximum rated current capacity in amperes" />
              <Input id="gridCurrentCapacity" type="number" step="any" min="0" disabled={isViewMode} placeholder="A (e.g. 150)" {...register('gridCurrentCapacity')} error={errors.gridCurrentCapacity} />
            </div>

            <div>
              <LabelWithInfo htmlFor="gridPhases" label="Grid Connection Phases (1 or 3)" info="AC power phase configuration" />
              <Select
                id="gridPhases"
                disabled={isViewMode}
                placeholder="Select Phases"
                options={['3-Phase', '1-Phase']}
                {...register('gridPhases')}
                error={errors.gridPhases}
              />
            </div>

            <div>
              <LabelWithInfo htmlFor="energyMeters" label="Energy Meters" info="Linked utility grid energy meter identifiers" />
              <Input id="energyMeters" disabled={isViewMode} placeholder="Search for energy meters" {...register('energyMeters')} error={errors.energyMeters} />
            </div>
          </FormCard>

          <FormCard title="Other">
            <div>
              <LabelWithInfo htmlFor="contactNumber-0" label="Contact Numbers" info="On-site support or operator contact numbers" />
              <div className="flex flex-col gap-3 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Input
                        id={`contactNumber-${index}`}
                        autoComplete="tel"
                        disabled={isViewMode}
                        placeholder="+91 9876543210"
                        {...register(`contactNumbers.${index}.number`)}
                      />
                      {!isViewMode && fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition cursor-pointer shrink-0"
                          aria-label="Remove contact number"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {errors?.contactNumbers?.[index]?.number && (
                      <p className="text-[11px] font-bold text-rose-500 ml-1">
                        {errors.contactNumbers[index].number.message}
                      </p>
                    )}
                  </div>
                ))}

                {!isViewMode && (
                  <button
                    type="button"
                    onClick={() => append({ number: '' })}
                    className="self-start mt-1 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#1EB8D4] bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-2 group active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#1EB8D4] group-hover:scale-110 transition-transform" />
                    <span>Add New Contact Number</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <LabelWithInfo htmlFor="amenities" label="Amenities" info="Available facilities for drivers" />
              <Input id="amenities" disabled={isViewMode} placeholder="Cafe, Dining, Restroom, Wi-Fi" {...register('amenities')} error={errors.amenities} />
            </div>
          </FormCard>
        </div>

        <div className="flex flex-col gap-5">
          <FormCard title="Location Info">
            <div>
              <LabelWithInfo htmlFor="address" label="Address" required info="Complete street address of the site" />
              <Input id="address" autoComplete="street-address" disabled={isViewMode} placeholder="Tamil Nadu, Chennai" {...register('address')} error={errors.address} />
            </div>

            <div>
              <LabelWithInfo htmlFor="country" label="Country" info="Host country location" />
              <Select
                id="country"
                disabled={isViewMode}
                placeholder="Select Country"
                options={['India', 'United States', 'Germany', 'United Kingdom', 'Other']}
                {...register('country')}
                error={errors.country}
              />
            </div>

            <div>
              <LabelWithInfo htmlFor="state" label="State" info="Host state / province" />
              <Select
                id="state"
                disabled={isViewMode}
                placeholder="Select State"
                options={['Tamil Nadu', 'Maharashtra', 'Karnataka', 'Telangana', 'Delhi', 'Gujarat', 'Other']}
                {...register('state')}
                error={errors.state}
              />
            </div>

            <div>
              <LabelWithInfo htmlFor="city" label="City" info="Host municipality or city" />
              <Input id="city" autoComplete="address-level2" disabled={isViewMode} placeholder="Search for City" {...register('city')} error={errors.city} />
            </div>

            <div>
              <LabelWithInfo htmlFor="timeZone" label="Time Zone" info="Local timezone for billing and operating hours" />
              <Select
                id="timeZone"
                disabled={isViewMode}
                placeholder="Select Time Zone"
                options={['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London']}
                {...register('timeZone')}
                error={errors.timeZone}
              />
            </div>

            <div>
              <LabelWithInfo htmlFor="elevation" label="Elevation" info="Site elevation above sea level in meters" />
              <Input id="elevation" type="number" min="0" disabled={isViewMode} placeholder="0" {...register('elevation')} error={errors.elevation} />
            </div>
          </FormCard>

          <FormCard title="Availability">
            <div>
              <LabelWithInfo htmlFor="stage" label="Stage" info="Current deployment lifecycle stage" />
              <Select
                id="stage"
                disabled={isViewMode}
                placeholder="Select Stage"
                options={['Active', 'Inactive', 'Under Maintenance']}
                {...register('stage')}
                error={errors.stage}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label htmlFor="open247" className="relative flex items-center gap-3 cursor-pointer select-none">
                <input
                  id="open247"
                  name="open247"
                  type="checkbox"
                  disabled={isViewMode}
                  {...register('open247')}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-md border border-stone-300 peer-checked:bg-[#1EB8D4] peer-checked:border-[#1EB8D4] flex items-center justify-center text-white transition-all shadow-2xs">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-stone-700">Open 24×7</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <LabelWithInfo htmlFor="opensAt" label="Opens at" required={!open247} info="Daily station opening time" />
                <Input
                  id="opensAt"
                  type="time"
                  disabled={isViewMode || open247}
                  {...register('opensAt')}
                  error={errors.opensAt}
                />
              </div>

              <div>
                <LabelWithInfo htmlFor="closesAt" label="Closes at" required={!open247} info="Daily station closing time" />
                <Input
                  id="closesAt"
                  type="time"
                  disabled={isViewMode || open247}
                  {...register('closesAt')}
                  error={errors.closesAt}
                />
              </div>
            </div>
          </FormCard>
        </div>
      </div>
    </form>
  );
}

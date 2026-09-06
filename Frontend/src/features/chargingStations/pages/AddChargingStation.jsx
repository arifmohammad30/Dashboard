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

// ----------------------------------------------------------------------
// 1. Validation Regex Patterns
// ----------------------------------------------------------------------
// Station code: alphanumeric with hyphens and underscores
const codeRegex = /^[A-Za-z0-9_-]+$/;

// International / national phone format: optional '+' followed by digits, spaces, hyphens
const phoneRegex = /^\+?[0-9\s-]{7,15}$/;

// 12-hour (e.g., "08:00 am") or 24-hour (e.g., "08:00") time format
const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm|AM|PM)$|^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/i;

// ----------------------------------------------------------------------
// 2. Zod Form Validation Schema
// ----------------------------------------------------------------------
const chargingStationSchema = z.object({
  // Basic Details
  name: z.string().trim().min(2, 'Station name must be at least 2 characters'),
  brand: z.string().trim().min(1, 'Brand / OEM selection is required'),
  mobilityType: z.string().min(1, 'Mobility Type selection is required'),
  code: z.string().trim().refine(val => !val || codeRegex.test(val), {
    message: 'Station code can only contain letters, numbers, dashes, and underscores'
  }).optional(),
  category: z.string().optional(),

  // GPS Geolocation Coordinates
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

  // Location Details
  address: z.string().trim().min(4, 'Detailed street address must be at least 4 characters'),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  timeZone: z.string().optional(),
  elevation: z.string().refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: 'Elevation must be a non-negative number'
  }).optional(),

  // Power Supply & Grid Parameters
  gridPowerCapacity: z.string().refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), {
    message: 'Grid power capacity must be a positive number in kW'
  }).optional(),
  gridCurrentCapacity: z.string().refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), {
    message: 'Grid current capacity must be a positive number in A'
  }).optional(),
  gridPhases: z.string().optional(),
  energyMeters: z.string().optional(),

  // Operational Availability & Schedule
  stage: z.string().optional(),
  open247: z.boolean().optional(),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),

  // Operator Contacts & Amenities
  contactNumbers: z.array(z.object({
    number: z.string().refine(val => !val || phoneRegex.test(val.trim()), {
      message: 'Invalid phone number format (e.g. +91 9876543210)'
    })
  })).optional(),
  amenities: z.string().optional(),
}).superRefine((data, ctx) => {
  // Enforce mandatory opening and closing times when station is NOT open 24x7
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

// ----------------------------------------------------------------------
// 3. Helper: Map Raw Entity Data to Form Values
// ----------------------------------------------------------------------
const getInitialFormValues = (data) => ({
  name: data?.name || '',
  brand: data?.brand || '',
  mobilityType: data?.mobilityType || '',
  code: data?.code || '',
  category: data?.category || '',
  // Convert coordinates to string for input rendering, preserving null/empty
  latitude: data?.latitude !== undefined && data?.latitude !== null ? String(data.latitude) : '',
  longitude: data?.longitude !== undefined && data?.longitude !== null ? String(data.longitude) : '',
  address: data?.address || '',
  country: data?.country || '',
  state: data?.state || '',
  city: data?.city || '',
  timeZone: data?.timeZone || '',
  // Numeric string conversions with exact zero checks
  elevation: data?.elevation !== undefined && data?.elevation !== null ? String(data.elevation) : '',
  gridPowerCapacity: data?.gridPowerCapacity !== undefined && data?.gridPowerCapacity !== null ? String(data.gridPowerCapacity) : '',
  gridCurrentCapacity: data?.gridCurrentCapacity !== undefined && data?.gridCurrentCapacity !== null ? String(data.gridCurrentCapacity) : '',
  gridPhases: data?.gridPhases || '',
  energyMeters: data?.energyMeters || '',
  stage: data?.stage || '',
  open247: data?.open247 ?? false,
  opensAt: data?.opensAt || '',
  closesAt: data?.closesAt || '',
  // Normalize contact numbers array for useFieldArray
  contactNumbers: data?.contactNumbers && data.contactNumbers.length > 0
    ? (Array.isArray(data.contactNumbers) ? data.contactNumbers.map(n => (typeof n === 'string' ? { number: n } : { number: n.number || '' })) : [{ number: '' }])
    : [{ number: '' }],
  amenities: data?.amenities || '',
});

// ----------------------------------------------------------------------
// 4. Main Component: Add / Edit / View Charging Station
// ----------------------------------------------------------------------
export default function AddChargingStation({ isViewMode = false, isEditMode = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  // Authoritative entity ID from URL parameter
  const { id } = useParams();
  // Optional pre-fetched station state from navigation context
  const stationData = location.state?.station;

  // Track loading state for data-fetching on edit/view routes
  const [loadingData, setLoadingData] = useState((isViewMode || isEditMode) && !stationData && Boolean(id));
  const [activeStation, setActiveStation] = useState(stationData);

  // Initialize React Hook Form with Zod schema resolver
  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(chargingStationSchema),
    defaultValues: (isViewMode || isEditMode) && stationData ? getInitialFormValues(stationData) : {
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

  // Dynamic contact numbers list management
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contactNumbers'
  });

  // Watch 24x7 toggle to conditionally enable/disable opening hours fields
  const open247 = watch('open247');

  // --------------------------------------------------------------------
  // 5. Data Loading Lifecycle Hook
  // --------------------------------------------------------------------
  useEffect(() => {
    // Unconditionally fetch fresh entity data from backend when ID is present
    if ((isViewMode || isEditMode) && id) {
      setLoadingData(true);
      getChargingStationById(id)
        .then(data => {
          if (data) {
            setActiveStation(data);
            reset(getInitialFormValues(data));
          }
        })
        .catch(err => {
          console.error("Failed to fetch charging station by ID:", err);
          toast.error("Failed to load charging station data.");
          navigate('/charging-stations');
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [id, isViewMode, isEditMode, reset, navigate, toast]);

  // --------------------------------------------------------------------
  // 6. Navigation Actions
  // --------------------------------------------------------------------
  // Cancel button safely redirects back to stations list without clearing form state
  const handleCancelClick = () => {
    navigate('/charging-stations');
  };

  // --------------------------------------------------------------------
  // 7. Form Submission Handler
  // --------------------------------------------------------------------
  const onSubmit = async (data) => {
    try {
      // Transform form data to match the authoritative backend JSON contract
      const payload = {
        ...data,
        latitude: data.latitude !== '' && data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude !== '' && data.longitude != null ? Number(data.longitude) : null,
        contactNumbers: data.contactNumbers ? data.contactNumbers.map(c => c.number?.trim()).filter(Boolean) : [],
        elevation: data.elevation !== '' && data.elevation != null ? Number(data.elevation) : null,
        gridPowerCapacity: data.gridPowerCapacity !== '' && data.gridPowerCapacity != null ? Number(data.gridPowerCapacity) : null,
        gridCurrentCapacity: data.gridCurrentCapacity !== '' && data.gridCurrentCapacity != null ? Number(data.gridCurrentCapacity) : null,
      };

      // ID-based authoritative routing: update existing station or create new
      if (isEditMode && id) {
        await updateChargingStation(id, payload);
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

  // --------------------------------------------------------------------
  // 8. Render: Loading State Spinner
  // --------------------------------------------------------------------
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#1EB8D4]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading charging station details...</p>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // 9. Render: Form Structure
  // --------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-[1280px] mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header Bar with Back Button & Action Controls */}
      <div className="flex items-center justify-between px-2">
        <div>
          <BackButton to="/charging-stations" label="Back to Charging Stations" />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Cancel / Back Button */}
          <button
            type="button"
            onClick={handleCancelClick}
            className="h-9 px-4 inline-flex items-center justify-center text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-xl shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
          >
            {isViewMode ? 'Back' : 'Cancel'}
          </button>

          {/* Submit Button (Hidden in View Mode) */}
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

      {/* Main 2-Column Responsive Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* Left Column: Basic Details, Power Supply, & Other Details     */}

        <div className="flex flex-col gap-5">
          {/* Basic Details Card */}
          <FormCard title="Basic Details">
            {/* Station Name */}
            <div>
              <LabelWithInfo htmlFor="name" label="Name" required info="Public Display Name of the Charging Station" />
              <Input id="name" disabled={isViewMode} placeholder="Lonavala Wax Museum" {...register('name')} error={errors.name} />
            </div>

            {/* Manufacturing Brand */}
            <div>
              <LabelWithInfo htmlFor="brand" label="Brand" required info="Select or specify manufacturing brand" />
              <Input id="brand" disabled={isViewMode} placeholder="Search for Brands" {...register('brand')} error={errors.brand} />
            </div>

            {/* Operational Mobility Classification */}
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

            {/* Unique Station Code */}
            <div>
              <LabelWithInfo htmlFor="code" label="Code" info="Unique internal site identifier code" />
              <Input id="code" disabled={isViewMode} placeholder="ABC12345" {...register('code')} error={errors.code} />
            </div>

            {/* Functional Category Classification */}
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

            {/* GPS Latitude and Longitude */}
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

          {/* Power Supply Details Card */}
          <FormCard title="Power supply details">
            {/* Grid Connection Power Capacity (kW) */}
            <div>
              <LabelWithInfo htmlFor="gridPowerCapacity" label="Grid Connection Power Capacity (kW)" info="Maximum allowed power intake in kilowatts" />
              <Input id="gridPowerCapacity" type="number" step="any" min="0" disabled={isViewMode} placeholder="kW (e.g. 100)" {...register('gridPowerCapacity')} error={errors.gridPowerCapacity} />
            </div>

            {/* Grid Connection Current Capacity (A) */}
            <div>
              <LabelWithInfo htmlFor="gridCurrentCapacity" label="Grid Connection Current Capacity (A)" info="Maximum rated current capacity in amperes" />
              <Input id="gridCurrentCapacity" type="number" step="any" min="0" disabled={isViewMode} placeholder="A (e.g. 150)" {...register('gridCurrentCapacity')} error={errors.gridCurrentCapacity} />
            </div>

            {/* AC Power Phase Configuration */}
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

            {/* Utility Energy Meter Identifiers */}
            <div>
              <LabelWithInfo htmlFor="energyMeters" label="Energy Meters" info="Linked utility grid energy meter identifiers" />
              <Input id="energyMeters" disabled={isViewMode} placeholder="Search for energy meters" {...register('energyMeters')} error={errors.energyMeters} />
            </div>
          </FormCard>

          {/* Other Details Card: Contacts & Amenities */}
          <FormCard title="Other">
            {/* Dynamic Contact Numbers List */}
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
                      {/* Delete Contact Button */}
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
                    {/* Inline Phone Validation Error */}
                    {errors?.contactNumbers?.[index]?.number && (
                      <p className="text-[11px] font-bold text-rose-500 ml-1">
                        {errors.contactNumbers[index].number.message}
                      </p>
                    )}
                  </div>
                ))}

                {/* Add New Contact Row Button */}
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

            {/* Site Amenities (Free text / comma-separated) */}
            <div>
              <LabelWithInfo htmlFor="amenities" label="Amenities" info="Available facilities for drivers" />
              <Input id="amenities" disabled={isViewMode} placeholder="Cafe, Dining, Restroom, Wi-Fi" {...register('amenities')} error={errors.amenities} />
            </div>
          </FormCard>
        </div>


        {/* Right Column: Location Info & Operational Availability       */}

        <div className="flex flex-col gap-5">
          {/* Location Info Card */}
          <FormCard title="Location Info">
            {/* Street Address */}
            <div>
              <LabelWithInfo htmlFor="address" label="Address" required info="Complete street address of the site" />
              <Input id="address" autoComplete="street-address" disabled={isViewMode} placeholder="Tamil Nadu, Chennai" {...register('address')} error={errors.address} />
            </div>

            {/* Country Selector */}
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

            {/* State / Province Selector */}
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

            {/* City Input */}
            <div>
              <LabelWithInfo htmlFor="city" label="City" info="Host municipality or city" />
              <Input id="city" autoComplete="address-level2" disabled={isViewMode} placeholder="Search for City" {...register('city')} error={errors.city} />
            </div>

            {/* Time Zone Selector */}
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

            {/* Elevation (Meters above sea level) */}
            <div>
              <LabelWithInfo htmlFor="elevation" label="Elevation" info="Site elevation above sea level in meters" />
              <Input id="elevation" type="number" min="0" disabled={isViewMode} placeholder="0" {...register('elevation')} error={errors.elevation} />
            </div>
          </FormCard>

          {/* Availability & Operating Hours Card */}
          <FormCard title="Availability">
            {/* Deployment Stage */}
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

            {/* 24x7 Availability Checkbox */}
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

            {/* Daily Opening and Closing Time Pickers */}
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


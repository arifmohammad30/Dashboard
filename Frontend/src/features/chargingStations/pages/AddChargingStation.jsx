import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import BackButton from '../../../components/ui/BackButton';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import LabelWithInfo from '../../../components/ui/LabelWithInfo';
import FormCard from '../../../components/ui/FormCard';
import PrimaryButton from '../../../components/ui/PrimaryButton';

import {
  createChargingStation,
  updateChargingStation,
  getChargingStationById
} from '../api/chargingStationService';

import { useToast } from '../../../context/ToastContext';


// ============================================================
// Validation
// ============================================================

const codeRegex = /^[A-Za-z0-9_-]+$/;

const phoneRegex = /^\+?[0-9\s-]{7,15}$/;

const timeRegex =
  /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;


// ============================================================
// Zod Schema
// ============================================================

const chargingStationSchema = z
  .object({
    // Basic Details
    name: z
      .string()
      .trim()
      .min(2, 'Station name must be at least 2 characters'),

    brand: z
      .string()
      .trim()
      .min(1, 'Brand / OEM selection is required'),

    mobilityType: z
      .string()
      .min(1, 'Mobility Type selection is required'),

    code: z
      .string()
      .trim()
      .refine(
        (value) => !value || codeRegex.test(value),
        {
          message:
            'Station code can only contain letters, numbers, dashes, and underscores'
        }
      )
      .optional(),

    category: z.string().optional(),

    // GPS Coordinates
    latitude: z
      .string()
      .trim()
      .min(1, 'Latitude coordinate is required')
      .refine(
        (value) => {
          const number = Number(value);
          return (
            !Number.isNaN(number) &&
            number >= -90 &&
            number <= 90
          );
        },
        {
          message:
            'Latitude must be a valid coordinate between -90 and 90'
        }
      ),

    longitude: z
      .string()
      .trim()
      .min(1, 'Longitude coordinate is required')
      .refine(
        (value) => {
          const number = Number(value);
          return (
            !Number.isNaN(number) &&
            number >= -180 &&
            number <= 180
          );
        },
        {
          message:
            'Longitude must be a valid coordinate between -180 and 180'
        }
      ),

    // Location
    address: z
      .string()
      .trim()
      .min(4, 'Detailed street address must be at least 4 characters'),

    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    timeZone: z.string().optional(),

    elevation: z
      .string()
      .refine(
        (value) =>
          !value ||
          (!Number.isNaN(Number(value)) && Number(value) >= 0),
        {
          message: 'Elevation must be a non-negative number'
        }
      )
      .optional(),

    // Power Supply
    gridPowerCapacity: z
      .string()
      .refine(
        (value) =>
          !value ||
          (!Number.isNaN(Number(value)) && Number(value) > 0),
        {
          message:
            'Grid power capacity must be a positive number in kW'
        }
      )
      .optional(),

    gridCurrentCapacity: z
      .string()
      .refine(
        (value) =>
          !value ||
          (!Number.isNaN(Number(value)) && Number(value) > 0),
        {
          message:
            'Grid current capacity must be a positive number in A'
        }
      )
      .optional(),

    gridPhases: z.string().optional(),
    energyMeters: z.string().optional(),

    // Availability
    stage: z.string().optional(),

    open247: z.boolean().optional(),

    opensAt: z.string().optional(),
    closesAt: z.string().optional(),

    // Contacts
    contactNumbers: z
      .array(
        z.object({
          number: z.string().refine(
            (value) =>
              !value || phoneRegex.test(value.trim()),
            {
              message:
                'Invalid phone number format (e.g. +91 9876543210)'
            }
          )
        })
      )
      .optional(),

    amenities: z.string().optional()
  })
  .superRefine((data, ctx) => {
    // Opening hours are required only when the station
    // is not operating 24x7.
    if (!data.open247) {
      if (!data.opensAt?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Opening time is required when not 24×7',
          path: ['opensAt']
        });
      } else if (!timeRegex.test(data.opensAt.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Opening time must be in HH:mm format',
          path: ['opensAt']
        });
      }

      if (!data.closesAt?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Closing time is required when not 24×7',
          path: ['closesAt']
        });
      } else if (!timeRegex.test(data.closesAt.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Closing time must be in HH:mm format',
          path: ['closesAt']
        });
      }
    }
  });


// ============================================================
// Default Form Values
// ============================================================

const defaultFormValues = {
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

  contactNumbers: [
    {
      number: ''
    }
  ],

  amenities: ''
};


// ============================================================
// API Entity → Form Values
// ============================================================

const getInitialFormValues = (data) => ({
  name: data?.name ?? '',
  brand: data?.brand ?? '',
  mobilityType: data?.mobilityType ?? '',
  code: data?.code ?? '',
  category: data?.category ?? '',

  latitude:
    data?.latitude !== null && data?.latitude !== undefined
      ? String(data.latitude)
      : '',

  longitude:
    data?.longitude !== null && data?.longitude !== undefined
      ? String(data.longitude)
      : '',

  address: data?.address ?? '',
  country: data?.country ?? '',
  state: data?.state ?? '',
  city: data?.city ?? '',
  timeZone: data?.timeZone ?? '',

  elevation:
    data?.elevation !== null && data?.elevation !== undefined
      ? String(data.elevation)
      : '',

  gridPowerCapacity:
    data?.gridPowerCapacity !== null &&
      data?.gridPowerCapacity !== undefined
      ? String(data.gridPowerCapacity)
      : '',

  gridCurrentCapacity:
    data?.gridCurrentCapacity !== null &&
      data?.gridCurrentCapacity !== undefined
      ? String(data.gridCurrentCapacity)
      : '',

  gridPhases: data?.gridPhases ?? '',
  energyMeters: data?.energyMeters ?? '',
  stage: data?.stage ?? '',

  open247: data?.open247 ?? false,

  opensAt: data?.opensAt ?? '',
  closesAt: data?.closesAt ?? '',

  contactNumbers:
    Array.isArray(data?.contactNumbers) &&
      data.contactNumbers.length > 0
      ? data.contactNumbers.map((contact) => ({
        number:
          typeof contact === 'string'
            ? contact
            : contact?.number ?? ''
      }))
      : [{ number: '' }],

  amenities: data?.amenities ?? ''
});


// ============================================================
// Component
// ============================================================

export default function AddChargingStation({
  isViewMode = false,
  isEditMode = false
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const toast = useToast();

  // Optional station data passed from the list/detail page.
  // Backend remains authoritative because edit/view fetches by ID.
  const stationData = location.state?.station;

  const [loadingData, setLoadingData] = useState(
    Boolean((isViewMode || isEditMode) && id)
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm({
    resolver: zodResolver(chargingStationSchema),
    defaultValues:
      isViewMode || isEditMode
        ? stationData
          ? getInitialFormValues(stationData)
          : defaultFormValues
        : defaultFormValues
  });

  const {
    fields,
    append,
    remove
  } = useFieldArray({
    control,
    name: 'contactNumbers'
  });

  const open247 = watch('open247');


  // ==========================================================
  // Load Edit/View Data
  // ==========================================================

  useEffect(() => {
    if (!(isViewMode || isEditMode) || !id) {
      setLoadingData(false);
      return;
    }

    let isMounted = true;

    const loadStation = async () => {
      setLoadingData(true);

      try {
        const data = await getChargingStationById(id);

        if (!isMounted) {
          return;
        }

        if (!data) {
          toast.error('Charging station was not found.');
          navigate('/charging-stations', { replace: true });
          return;
        }

        reset(getInitialFormValues(data));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error(
          'Failed to fetch charging station by ID:',
          error
        );

        toast.error(
          error?.message ||
          'Failed to load charging station data.'
        );

        navigate('/charging-stations', {
          replace: true
        });
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    loadStation();

    return () => {
      isMounted = false;
    };
  }, [
    id,
    isViewMode,
    isEditMode,
    reset,
    navigate,
    toast
  ]);


  // ==========================================================
  // Cancel / Back
  // ==========================================================

  const handleCancelClick = () => {
    navigate('/charging-stations', {
      replace: true
    });
  };


  // ==========================================================
  // Submit
  // ==========================================================

  const onSubmit = async (data) => {
    console.log("data", data);
    try {
      const payload = {
        ...data,

        latitude:
          data.latitude !== ''
            ? Number(data.latitude)
            : null,

        longitude:
          data.longitude !== ''
            ? Number(data.longitude)
            : null,

        elevation:
          data.elevation !== ''
            ? Number(data.elevation)
            : null,

        gridPowerCapacity:
          data.gridPowerCapacity !== ''
            ? Number(data.gridPowerCapacity)
            : null,

        gridCurrentCapacity:
          data.gridCurrentCapacity !== ''
            ? Number(data.gridCurrentCapacity)
            : null,

        contactNumbers: Array.isArray(data.contactNumbers)
          ? data.contactNumbers
            .map((contact) => contact.number?.trim())
            .filter(Boolean)
          : [],

        // A 24x7 station does not need an operating schedule.
        opensAt: data.open247
          ? null
          : data.opensAt?.trim() || null,

        closesAt: data.open247
          ? null
          : data.closesAt?.trim() || null
      };

      if (isEditMode && id) {
        await updateChargingStation(id, payload);

        toast.success(
          'Charging station updated successfully!',
          { code: 200 }
        );
      } else {
        await createChargingStation(payload);

        toast.success(
          'Charging station added successfully!',
          { code: 201 }
        );
      }

      navigate('/charging-stations', {
        replace: true
      });
    } catch (error) {
      console.error(
        'Error submitting charging station form:',
        error
      );

      toast.error(
        error?.message ||
        'Failed to save charging station.'
      );
    }
  };


  // ==========================================================
  // Loading State
  // ==========================================================

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#4DA944] animate-spin mb-4" />

        <p className="text-sm font-bold text-stone-600">
          Loading charging station details...
        </p>
      </div>
    );
  }


  // ==========================================================
  // Form
  // ==========================================================

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 max-w-[1280px] mx-auto pb-12 animate-in fade-in duration-200"
    >

      {/* Header */}
      <div className="flex items-center justify-between px-2">

        <BackButton
          to="/charging-stations"
          label="Back to Charging Stations"
        />

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


      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ====================================================
            LEFT COLUMN
        ==================================================== */}

        <div className="flex flex-col gap-5">

          {/* Basic Details */}
          <FormCard title="Basic Details">

            <div>
              <LabelWithInfo
                htmlFor="name"
                label="Name"
                required
                info="Public Display Name of the Charging Station"
              />

              <Input
                id="name"
                disabled={isViewMode}
                placeholder="Lonavala Wax Museum"
                {...register('name')}
                error={errors.name}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="brand"
                label="Brand"
                required
                info="Select or specify manufacturing brand"
              />

              <Input
                id="brand"
                disabled={isViewMode}
                placeholder="Search for Brands"
                {...register('brand')}
                error={errors.brand}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="mobilityType"
                label="Mobility Type"
                required
                info="Operational mobility classification"
              />

              <Select
                id="mobilityType"
                disabled={isViewMode}
                placeholder="Select Mobility Type"
                options={[
                  'Stationary',
                  'Mobile',
                  'Portable'
                ]}
                {...register('mobilityType')}
                error={errors.mobilityType}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="code"
                label="Code"
                info="Unique internal site identifier code"
              />

              <Input
                id="code"
                disabled={isViewMode}
                placeholder="ABC12345"
                {...register('code')}
                error={errors.code}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="category"
                label="Charging Station Category"
              />

              <Select
                id="category"
                disabled={isViewMode}
                placeholder="Select Category"
                options={[
                  'Public Hub',
                  'Commercial',
                  'Residential',
                  'Highway Hub',
                  'Fleet Hub',
                  'Other'
                ]}
                {...register('category')}
                error={errors.category}
              />
            </div>


            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <LabelWithInfo
                  htmlFor="latitude"
                  label="Latitude"
                  required
                  info="GPS Latitude coordinate (-90 to 90)"
                />

                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  disabled={isViewMode}
                  placeholder="18.0986544"
                  {...register('latitude')}
                  error={errors.latitude}
                />
              </div>


              <div>
                <LabelWithInfo
                  htmlFor="longitude"
                  label="Longitude"
                  required
                  info="GPS Longitude coordinate (-180 to 180)"
                />

                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  disabled={isViewMode}
                  placeholder="72.9162627"
                  {...register('longitude')}
                  error={errors.longitude}
                />
              </div>

            </div>

          </FormCard>


          {/* Power Supply */}
          <FormCard title="Power supply details">

            <div>
              <LabelWithInfo
                htmlFor="gridPowerCapacity"
                label="Grid Connection Power Capacity (kW)"
                info="Maximum allowed power intake in kilowatts"
              />

              <Input
                id="gridPowerCapacity"
                type="number"
                step="any"
                min="0"
                disabled={isViewMode}
                placeholder="kW (e.g. 100)"
                {...register('gridPowerCapacity')}
                error={errors.gridPowerCapacity}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="gridCurrentCapacity"
                label="Grid Connection Current Capacity (A)"
                info="Maximum rated current capacity in amperes"
              />

              <Input
                id="gridCurrentCapacity"
                type="number"
                step="any"
                min="0"
                disabled={isViewMode}
                placeholder="A (e.g. 150)"
                {...register('gridCurrentCapacity')}
                error={errors.gridCurrentCapacity}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="gridPhases"
                label="Grid Connection Phases (1 or 3)"
                info="AC power phase configuration"
              />

              <Select
                id="gridPhases"
                disabled={isViewMode}
                placeholder="Select Phases"
                options={[
                  '3-Phase',
                  '1-Phase'
                ]}
                {...register('gridPhases')}
                error={errors.gridPhases}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="energyMeters"
                label="Energy Meters"
                info="Linked utility grid energy meter identifiers"
              />

              <Input
                id="energyMeters"
                disabled={isViewMode}
                placeholder="Search for energy meters"
                {...register('energyMeters')}
                error={errors.energyMeters}
              />
            </div>

          </FormCard>


          {/* Other */}
          <FormCard title="Other">

            <div>
              <LabelWithInfo
                htmlFor="contactNumber-0"
                label="Contact Numbers"
                info="On-site support or operator contact numbers"
              />

              <div className="flex flex-col gap-3 mt-2">

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-col gap-1"
                  >

                    <div className="flex items-center gap-2">

                      <Input
                        id={`contactNumber-${index}`}
                        autoComplete="tel"
                        disabled={isViewMode}
                        placeholder="+91 9876543210"
                        {...register(
                          `contactNumbers.${index}.number`
                        )}
                        error={
                          errors.contactNumbers?.[index]?.number
                        }
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

                  </div>
                ))}


                {!isViewMode && (
                  <button
                    type="button"
                    onClick={() => append({ number: '' })}
                    className="self-start mt-1 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#4DA944] bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-2 group active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#4DA944] group-hover:scale-110 transition-transform" />

                    <span>
                      Add New Contact Number
                    </span>
                  </button>
                )}

              </div>
            </div>


            <div>
              <LabelWithInfo
                htmlFor="amenities"
                label="Amenities"
                info="Available facilities for drivers"
              />

              <Input
                id="amenities"
                disabled={isViewMode}
                placeholder="Cafe, Dining, Restroom, Wi-Fi"
                {...register('amenities')}
                error={errors.amenities}
              />
            </div>

          </FormCard>

        </div>


        {/* ====================================================
            RIGHT COLUMN
        ==================================================== */}

        <div className="flex flex-col gap-5">

          {/* Location */}
          <FormCard title="Location Info">

            <div>
              <LabelWithInfo
                htmlFor="address"
                label="Address"
                required
                info="Complete street address of the site"
              />

              <Input
                id="address"
                autoComplete="street-address"
                disabled={isViewMode}
                placeholder="Tamil Nadu, Chennai"
                {...register('address')}
                error={errors.address}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="country"
                label="Country"
                info="Host country location"
              />

              <Select
                id="country"
                disabled={isViewMode}
                placeholder="Select Country"
                options={[
                  'India',
                  'United States',
                  'Germany',
                  'United Kingdom',
                  'Other'
                ]}
                {...register('country')}
                error={errors.country}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="state"
                label="State"
                info="Host state / province"
              />

              <Select
                id="state"
                disabled={isViewMode}
                placeholder="Select State"
                options={[
                  'Tamil Nadu',
                  'Maharashtra',
                  'Karnataka',
                  'Telangana',
                  'Delhi',
                  'Gujarat',
                  'Other'
                ]}
                {...register('state')}
                error={errors.state}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="city"
                label="City"
                info="Host municipality or city"
              />

              <Input
                id="city"
                autoComplete="address-level2"
                disabled={isViewMode}
                placeholder="Search for City"
                {...register('city')}
                error={errors.city}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="timeZone"
                label="Time Zone"
                info="Local timezone for billing and operating hours"
              />

              <Select
                id="timeZone"
                disabled={isViewMode}
                placeholder="Select Time Zone"
                options={[
                  'Asia/Kolkata',
                  'UTC',
                  'America/New_York',
                  'Europe/London'
                ]}
                {...register('timeZone')}
                error={errors.timeZone}
              />
            </div>


            <div>
              <LabelWithInfo
                htmlFor="elevation"
                label="Elevation"
                info="Site elevation above sea level in meters"
              />

              <Input
                id="elevation"
                type="number"
                min="0"
                disabled={isViewMode}
                placeholder="0"
                {...register('elevation')}
                error={errors.elevation}
              />
            </div>

          </FormCard>


          {/* Availability */}
          <FormCard title="Availability">

            <div>
              <LabelWithInfo
                htmlFor="stage"
                label="Stage"
                info="Current deployment lifecycle stage"
              />

              <Select
                id="stage"
                disabled={isViewMode}
                placeholder="Select Stage"
                options={[
                  'Active',
                  'Inactive',
                  'Under Maintenance'
                ]}
                {...register('stage')}
                error={errors.stage}
              />
            </div>


            {/* 24x7 */}
            <div className="flex items-center gap-3 pt-1">

              <label
                htmlFor="open247"
                className="relative flex items-center gap-3 cursor-pointer select-none"
              >

                <input
                  id="open247"
                  type="checkbox"
                  disabled={isViewMode}
                  {...register('open247')}
                  className="peer sr-only"
                />

                <div className="w-5 h-5 rounded-md border border-stone-300 peer-checked:bg-[#4DA944] peer-checked:border-[#4DA944] flex items-center justify-center text-white transition-all shadow-2xs">

                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>

                </div>

                <span className="text-sm font-semibold text-stone-700">
                  Open 24×7
                </span>

              </label>

            </div>


            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <LabelWithInfo
                  htmlFor="opensAt"
                  label="Opens at"
                  required={!open247}
                  info="Daily station opening time"
                />

                <Input
                  id="opensAt"
                  type="time"
                  disabled={isViewMode || open247}
                  {...register('opensAt')}
                  error={errors.opensAt}
                />
              </div>


              <div>
                <LabelWithInfo
                  htmlFor="closesAt"
                  label="Closes at"
                  required={!open247}
                  info="Daily station closing time"
                />

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
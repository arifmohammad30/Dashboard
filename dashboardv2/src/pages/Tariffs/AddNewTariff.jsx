import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Loader2, Users, Layers, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import LabelWithInfo from '../../components/ui/LabelWithInfo';
import FormCard from '../../components/ui/FormCard';
import { addTariff } from '../../services/tariffService';

const tariffSchema = z.object({
  type: z.string().min(1, 'Please select a Tariff Type'),
  applicableTo: z.string().min(1, 'Please select applicability'),
  name: z.string().min(1, 'Tariff Name is required').max(100, 'Name cannot exceed 100 characters'),
  costingType: z.string().min(1, 'Please select a Costing Type'),
  chargingFee: z.string()
    .min(1, 'Charging Fee is required')
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0, { message: 'Must be a valid positive fee' }),
  chargingFeeUnit: z.string().min(1, 'Please select a Fee Unit'),
  gstPercentage: z.string()
    .optional()
    .refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), { message: 'GST % must be between 0 and 100' }),
  idleFee: z.string()
    .optional()
    .refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), { message: 'Idle Fee must be a positive number' }),
  stateTax: z.string()
    .optional()
    .refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), { message: 'State Tax must be a positive number' }),
  weight: z.string()
    .min(1, 'Weight is required')
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0, { message: 'Weight must be a non-negative number' })
});

export default function AddNewTariff({ isViewMode = false, isEditMode = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const tariffData = location.state?.tariff;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(tariffSchema),
    defaultValues: (isViewMode || isEditMode) && tariffData ? {
      type: tariffData.type || '',
      applicableTo: tariffData.applicableTo || 'All Fleets',
      name: tariffData.name || '',
      costingType: tariffData.costingType || '',
      chargingFee: (tariffData.chargingFee || '').replace(/[^0-9.]/g, '') || '',
      chargingFeeUnit: 'kWh',
      gstPercentage: (tariffData.gstPercentage || '').replace(/[^0-9.]/g, '') || '',
      idleFee: (tariffData.idleFee || '').replace(/[^0-9.]/g, '') || '',
      stateTax: '0',
      weight: (tariffData.weight !== undefined ? tariffData.weight : '').toString()
    } : {
      type: '',
      applicableTo: 'All Fleets',
      name: '',
      costingType: '',
      chargingFee: '',
      chargingFeeUnit: '',
      gstPercentage: '',
      idleFee: '',
      stateTax: '',
      weight: ''
    }
  });

  const selectedApplicableTo = watch('applicableTo');

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        type: data.type,
        costingType: data.costingType,
        applicableTo: data.applicableTo,
        chargingFee: `₹ ${data.chargingFee} / ${data.chargingFeeUnit}`,
        parkingFee: 'NA',
        idleFee: data.idleFee ? `₹ ${data.idleFee} / min` : '₹0 / min',
        stateTax: data.stateTax ? `₹ ${data.stateTax}` : '₹0',
        weight: Number(data.weight) || 1,
        gstPercentage: data.gstPercentage ? `${data.gstPercentage} %` : '18 %'
      };

      await addTariff(payload);
      alert(isEditMode ? 'Tariff updated successfully!' : 'Tariff added successfully!');
      navigate('/tariffs');
    } catch (error) {
      console.error('Error saving tariff:', error);
      alert('Failed to save tariff.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-[1100px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <button
            type="button"
            onClick={() => navigate('/tariffs')}
            className="flex items-center gap-2 text-slate-900 hover:text-rose-600 transition-colors mb-2 font-bold text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tariffs
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isViewMode) {
                navigate('/tariffs');
              } else {
                reset();
              }
            }}
            className="px-4 py-2 text-sm bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium rounded-lg shadow-xs transition-colors duration-200 cursor-pointer"
          >
            {isViewMode ? 'Back' : 'Cancel'}
          </button>
          {!isViewMode && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-xs transition-colors duration-200 flex items-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isEditMode ? 'Save Changes' : 'Add'}
            </button>
          )}
        </div>
      </div>

      {/* 2 Column Clean Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <FormCard>
          <div>
            <LabelWithInfo label="Type" required info="Select Tariff Type" />
            <Select
              disabled={isViewMode}
              placeholder="Select Type"
              options={['Default', 'ToD']}
              {...register('type')}
              error={errors.type}
            />
          </div>

          {/* Unique Segmented Control for Applicable to */}
          <div>
            <LabelWithInfo label="Applicable to" required />
            <div className="grid grid-cols-2 gap-3 mt-1.5 p-1 bg-stone-100/70 border border-stone-200/80 rounded-2xl">
              <button
                type="button"
                disabled={isViewMode}
                onClick={() => setValue('applicableTo', 'All Fleets', { shouldValidate: true })}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  selectedApplicableTo === 'All Fleets'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                All Fleets
              </button>

              <button
                type="button"
                disabled={isViewMode}
                onClick={() => setValue('applicableTo', 'Selected Fleets', { shouldValidate: true })}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  selectedApplicableTo === 'Selected Fleets'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Selected Fleets
              </button>
            </div>
            {errors.applicableTo && (
              <p className="text-xs font-bold text-pink-500 mt-1.5">{errors.applicableTo.message}</p>
            )}
          </div>

          <div>
            <LabelWithInfo label="Name" required />
            <Input
              disabled={isViewMode}
              placeholder="e.g. Default (24×7)"
              {...register('name')}
              error={errors.name}
            />
          </div>

          <div>
            <LabelWithInfo label="Weight" required info="Priority weight for tariff resolution" />
            <Input
              disabled={isViewMode}
              placeholder="e.g. 1"
              {...register('weight')}
              error={errors.weight}
            />
          </div>
        </FormCard>

        {/* Right Column */}
        <FormCard>
          <div>
            <LabelWithInfo label="Costing Type" required />
            <Select
              disabled={isViewMode}
              placeholder="Select Costing Type"
              options={['Charging Only', 'Charging + Parking', 'Charging + Idle']}
              {...register('costingType')}
              error={errors.costingType}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <LabelWithInfo label="Charging Fee" required />
              <div className="relative flex items-center">
                <span className="absolute left-3 text-stone-400 font-bold text-sm">₹</span>
                <input
                  type="text"
                  disabled={isViewMode}
                  placeholder="10"
                  {...register('chargingFee')}
                  className={`w-full pl-7 pr-16 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-slate-800 transition ${
                    errors.chargingFee ? 'border-rose-400' : ''
                  }`}
                />
                <span className="absolute right-3 text-stone-400 text-xs font-medium pointer-events-none">per kWh</span>
              </div>
              {errors.chargingFee && (
                <p className="text-xs font-bold text-pink-500 mt-1.5">{errors.chargingFee.message}</p>
              )}
            </div>

            <div>
              <LabelWithInfo label="Charging Fee Unit" required />
              <Select
                disabled={isViewMode}
                placeholder="Select Unit"
                options={['kWh', 'Minute', 'Session']}
                {...register('chargingFeeUnit')}
                error={errors.chargingFeeUnit}
              />
            </div>
          </div>

          <div>
            <LabelWithInfo label="GST Percentage (Default GST is 18%)" />
            <Input
              disabled={isViewMode}
              placeholder="e.g. 18"
              {...register('gstPercentage')}
              error={errors.gstPercentage}
            />
          </div>

          <div>
            <LabelWithInfo label="Idle Fee" />
            <div className="relative flex items-center">
              <span className="absolute left-3 text-stone-400 font-bold text-sm">₹</span>
              <input
                type="text"
                disabled={isViewMode}
                placeholder="0"
                {...register('idleFee')}
                className={`w-full pl-7 pr-16 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-slate-800 transition ${
                  errors.idleFee ? 'border-rose-400' : ''
                }`}
              />
              <span className="absolute right-3 text-stone-400 text-xs font-medium pointer-events-none">per min</span>
            </div>
            {errors.idleFee && (
              <p className="text-xs font-bold text-pink-500 mt-1.5">{errors.idleFee.message}</p>
            )}
          </div>

          <div>
            <LabelWithInfo label="State Tax" />
            <div className="relative flex items-center">
              <span className="absolute left-3 text-stone-400 font-bold text-sm">₹</span>
              <input
                type="text"
                disabled={isViewMode}
                placeholder="0"
                {...register('stateTax')}
                className={`w-full pl-7 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-slate-800 transition ${
                  errors.stateTax ? 'border-rose-400' : ''
                }`}
              />
            </div>
            {errors.stateTax && (
              <p className="text-xs font-bold text-pink-500 mt-1.5">{errors.stateTax.message}</p>
            )}
          </div>
        </FormCard>
      </div>
    </form>
  );
}

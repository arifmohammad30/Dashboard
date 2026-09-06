import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { Loader2, Plus, Save } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import BackButton from '../../../components/ui/BackButton';
import FormCard from '../../../components/ui/FormCard';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import PrimaryButton from '../../../components/ui/PrimaryButton';

export const connectorSchema = z.object({
  chargePointCode: z.string().optional(),
  type: z.string().min(1, 'Connector Type is required'),
  connectorId: z.string()
    .min(1, 'Connector Id is required')
    .regex(/^\d+$/, 'Connector Id must contain only positive numbers'),
  powerRating: z.string()
    .optional()
    .refine(v => !v || /^\d+(\.\d+)?$/.test(v), { message: 'Power Rating must be a valid number' }),
  maxCurrent: z.string()
    .optional()
    .refine(v => !v || /^\d+(\.\d+)?$/.test(v), { message: 'Max Current must be a valid number' }),
  maxVoltage: z.string()
    .optional()
    .refine(v => !v || /^\d+(\.\d+)?$/.test(v), { message: 'Max Voltage must be a valid number' }),
  powerType: z.string().optional(),
  connectorFormat: z.string().optional()
});

export const CONNECTOR_TYPE_OPTIONS = ['Type2', 'CCS2', 'GB/T', 'CHAdeMO', '15A Socket', 'Type 1 (SAE J1772)', 'Tesla'];
export const POWER_TYPE_OPTIONS = ['AC_1_PHASE', 'AC_2_PHASE', 'AC_2_PHASE_SPLIT', 'AC_3_PHASE', 'DC', 'AC', 'DC_1_PHASE'];
export const CONNECTOR_FORMAT_OPTIONS = ['SOCKET', 'CABLE'];

const LabelWithInfo = ({ label, required, htmlFor }) => (
  <label htmlFor={htmlFor} className="text-xs font-bold text-stone-700 mb-1.5 block cursor-pointer">
    {label} {required && <span className="text-rose-500">*</span>}
  </label>
);

export default function ConnectorForm({
  isEditMode = false,
  defaultValues = {},
  onSubmit,
  isSubmitting = false,
  loading = false,
  backUrl = '/charge-points',
  backLabel = 'Back to Connectors'
}) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(connectorSchema),
    defaultValues: {
      chargePointCode: '',
      type: '',
      connectorId: '',
      powerRating: '',
      maxCurrent: '',
      maxVoltage: '',
      powerType: '',
      connectorFormat: '',
      ...defaultValues
    }
  });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset({
        chargePointCode: '',
        type: '',
        connectorId: '',
        powerRating: '',
        maxCurrent: '',
        maxVoltage: '',
        powerType: '',
        connectorFormat: '',
        ...defaultValues
      });
    }
  }, [defaultValues, reset]);

  const selectedType = useWatch({ control, name: 'type' });
  const selectedPowerType = useWatch({ control, name: 'powerType' });
  const selectedFormat = useWatch({ control, name: 'connectorFormat' });

  const sanitizeIntegerOnly = (e) => {
    e.target.value = e.target.value.replace(/[^\d]/g, '');
  };

  const sanitizeDecimalOnly = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header Navigation & Action Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <BackButton to={backUrl} label={backLabel} />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {isEditMode ? 'Update connector' : 'Add new connector'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="px-4 py-2 text-xs font-bold bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <PrimaryButton
            type="submit"
            isSubmitting={isSubmitting}
            loading={loading}
            isEditMode={isEditMode}
            addLabel="Add"
            editLabel="Update"
            loadingText={isEditMode ? 'Updating...' : 'Adding...'}
          />
        </div>
      </div>

      {/* 2-Column Responsive Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Basic Details */}
        <FormCard title="Basic Details">
          <div>
            <LabelWithInfo htmlFor="chargePointCode" label="Charge Point" required />
            <Input
              id="chargePointCode"
              disabled
              placeholder="Charge Point Code"
              {...register('chargePointCode')}
              className="bg-stone-100/80 font-mono text-stone-800 font-bold cursor-not-allowed"
            />
          </div>

          <div>
            <LabelWithInfo htmlFor="type" label="Connector Type" required />
            {isEditMode ? (
              <Input
                id="type"
                disabled
                placeholder="Connector Type"
                {...register('type')}
                className="bg-stone-100/80 font-mono text-stone-800 font-bold cursor-not-allowed"
              />
            ) : (
              <Select
                id="type"
                options={CONNECTOR_TYPE_OPTIONS}
                value={selectedType}
                onChange={(e) => setValue('type', e.target.value)}
                error={errors.type}
                placeholder="Search for Connector Type"
              />
            )}
          </div>

          <div>
            <LabelWithInfo htmlFor="connectorId" label="Connector Id" required />
            <Input
              id="connectorId"
              type="text"
              placeholder="1"
              onInput={sanitizeIntegerOnly}
              {...register('connectorId')}
              error={errors.connectorId}
            />
          </div>

          <div>
            <LabelWithInfo htmlFor="powerRating" label="Power Rating" />
            <Input
              id="powerRating"
              type="text"
              placeholder="20"
              suffix="kW"
              onInput={sanitizeDecimalOnly}
              {...register('powerRating')}
              error={errors.powerRating}
            />
          </div>
        </FormCard>

        {/* Card 2: OCPI Required Details */}
        <FormCard title="OCPI Required Details">
          <div>
            <LabelWithInfo htmlFor="maxCurrent" label="Maximum Output Current" />
            <Input
              id="maxCurrent"
              type="text"
              placeholder="20"
              suffix="A"
              onInput={sanitizeDecimalOnly}
              {...register('maxCurrent')}
              error={errors.maxCurrent}
            />
          </div>

          <div>
            <LabelWithInfo htmlFor="maxVoltage" label="Maximum Output Voltage" />
            <Input
              id="maxVoltage"
              type="text"
              placeholder="20"
              suffix="V"
              onInput={sanitizeDecimalOnly}
              {...register('maxVoltage')}
              error={errors.maxVoltage}
            />
          </div>

          <div>
            <LabelWithInfo htmlFor="powerType" label="Output Power Type" />
            <Select
              id="powerType"
              options={POWER_TYPE_OPTIONS}
              value={selectedPowerType}
              onChange={(e) => setValue('powerType', e.target.value)}
              error={errors.powerType}
              placeholder="Select Output Power Type"
            />
          </div>

          <div>
            <LabelWithInfo htmlFor="connectorFormat" label="Connector Format" />
            <Select
              id="connectorFormat"
              options={CONNECTOR_FORMAT_OPTIONS}
              value={selectedFormat}
              onChange={(e) => setValue('connectorFormat', e.target.value)}
              error={errors.connectorFormat}
              placeholder="Select Connector Format"
            />
          </div>
        </FormCard>
      </div>
    </form>
  );
}

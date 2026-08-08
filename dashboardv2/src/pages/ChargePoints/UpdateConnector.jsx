import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, Save } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import BackButton from '../../components/ui/BackButton';
import FormCard from '../../components/ui/FormCard';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { getChargePointById, updateChargePoint } from '../../services/chargePointService';

const connectorSchema = z.object({
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

const LabelWithInfo = ({ label, required }) => (
  <label className="text-xs font-bold text-stone-600 mb-1.5 block">
    {label} {required && <span className="text-rose-500">*</span>}
  </label>
);

export default function UpdateConnector() {
  const navigate = useNavigate();
  const { id, connectorId } = useParams();
  const location = useLocation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpData, setCpData] = useState(location.state?.cpData || null);

  const initialCpCode = location.state?.cpData?.name || location.state?.cpData?.code || location.state?.conn?.chargePointCode || cpData?.name || cpData?.code || id || '';
  const initialConnType = location.state?.conn?.type || cpData?.type || 'CCS2';
  const initialConnId = connectorId || location.state?.conn?.id || '';
  const initialPowerRating = location.state?.conn?.powerRating || (location.state?.cpData?.totalCapacity ? String(location.state?.cpData?.totalCapacity) : '');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(connectorSchema),
    defaultValues: {
      chargePointCode: initialCpCode,
      type: initialConnType,
      connectorId: initialConnId,
      powerRating: initialPowerRating,
      maxCurrent: location.state?.conn?.maxCurrent || '',
      maxVoltage: location.state?.conn?.maxVoltage || '',
      powerType: location.state?.conn?.powerType || (initialConnType === 'DC' ? 'DC' : 'AC 1 Phase'),
      connectorFormat: location.state?.conn?.connectorFormat || 'CABLE'
    }
  });

  useEffect(() => {
    let isMounted = true;
    const fetchCP = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await getChargePointById(id);
          if (res && isMounted) {
            setCpData(res);
            const cpNameCode = res.name || res.code || id;
            setValue('chargePointCode', cpNameCode);
            if (!location.state?.conn?.type && res.type) {
              setValue('type', res.type);
            }
            if (!location.state?.conn?.powerRating && res.totalCapacity) {
              setValue('powerRating', String(res.totalCapacity));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch charge point details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCP();
    return () => { isMounted = false; };
  }, [id, location.state, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (id) {
        await updateChargePoint(id, {
          connectorDetails: data
        });
      }
      toast.success(`Connector #${data.connectorId} updated successfully`, { code: 200 });
      navigate(`/charge-points/${id || ''}`);
    } catch (err) {
      console.error('Failed to update connector:', err);
      toast.error('Failed to update connector', { code: 500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sanitizeIntegerOnly = (e) => {
    e.target.value = e.target.value.replace(/[^\d]/g, '');
  };

  const sanitizeDecimalOnly = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
  };

  const backUrl = id ? `/charge-points/${id}` : '/charge-points';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-12">
      {/* Header with Standard Form Action Buttons */}
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <BackButton to={backUrl} label="Back to Charge Point" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Update connector
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="px-4 py-2 text-sm bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium rounded-lg shadow-sm transition-colors duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Update</span>
          </button>
        </div>
      </div>

      {/* Form Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Basic Details Card */}
        <FormCard title="Basic Details">
          <div>
            <LabelWithInfo label="Charge Point" required />
            <Input
              disabled
              placeholder="Charge Point Code"
              {...register('chargePointCode')}
              className="bg-stone-100/80 font-mono text-stone-800 font-bold cursor-not-allowed"
            />
          </div>

          <div>
            <LabelWithInfo label="Connector Type" required />
            <Input
              disabled
              placeholder="Connector Type"
              {...register('type')}
              className="bg-stone-100/80 font-mono text-stone-800 font-bold cursor-not-allowed"
            />
          </div>

          <div>
            <LabelWithInfo label="Connector Id" required />
            <Input
              type="text"
              placeholder="e.g. 1"
              onInput={sanitizeIntegerOnly}
              {...register('connectorId')}
              error={errors.connectorId}
            />
          </div>

          <div>
            <LabelWithInfo label="Power Rating" />
            <Input
              type="text"
              placeholder="Power rating in kW"
              suffix="kW"
              onInput={sanitizeDecimalOnly}
              {...register('powerRating')}
              error={errors.powerRating}
            />
          </div>
        </FormCard>

        {/* OCPI Required Details Card */}
        <FormCard title="OCPI Required Details">
          <div>
            <LabelWithInfo label="Maximum Output Current" />
            <Input
              type="text"
              placeholder="Max current in A"
              suffix="A"
              onInput={sanitizeDecimalOnly}
              {...register('maxCurrent')}
              error={errors.maxCurrent}
            />
          </div>

          <div>
            <LabelWithInfo label="Maximum Output Voltage" />
            <Input
              type="text"
              placeholder="Max voltage in V"
              suffix="V"
              onInput={sanitizeDecimalOnly}
              {...register('maxVoltage')}
              error={errors.maxVoltage}
            />
          </div>

          <div>
            <LabelWithInfo label="Output Power Type" />
            <Select {...register('powerType')} error={errors.powerType}>
              <option value="DC">DC</option>
              <option value="AC 1 Phase">AC 1 Phase</option>
              <option value="AC 3 Phase">AC 3 Phase</option>
            </Select>
          </div>

          <div>
            <LabelWithInfo label="Connector Format" />
            <Select {...register('connectorFormat')} error={errors.connectorFormat}>
              <option value="CABLE">CABLE</option>
              <option value="SOCKET">SOCKET</option>
            </Select>
          </div>
        </FormCard>
      </div>
    </form>
  );
}

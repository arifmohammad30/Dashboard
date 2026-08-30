import React from 'react';
import Input from '../../../components/ui/Input';
import LabelWithInfo from '../../../components/ui/LabelWithInfo';
import FormCard from '../../../components/ui/FormCard';

export default function FleetBasicDetailsCard({
  register,
  errors,
  isViewMode,
  accessCodeUsage,
  paymentType,
  setValue
}) {
  return (
    <FormCard title="Basic Details">
      <div>
        <LabelWithInfo label="Fleet Name" required info="Official operating name of the fleet" />
        <Input
          disabled={isViewMode}
          placeholder="e.g. EVRE FACTORY"
          {...register('name')}
          error={errors.name}
        />
      </div>

      <div>
        <LabelWithInfo label="Fleet Owner Name" required info="Primary contact person or fleet manager" />
        <Input
          disabled={isViewMode}
          placeholder="e.g. Rahul Sharma"
          {...register('ownerName')}
          error={errors.ownerName}
        />
      </div>

      <div>
        <LabelWithInfo label="Fleet Owner Email" required info="Primary email address for system invites and billing" />
        <Input
          type="email"
          disabled={isViewMode}
          placeholder="e.g. rahul@evre.in"
          {...register('ownerEmail')}
          error={errors.ownerEmail}
        />
        <p className="text-xs text-stone-400 font-medium mt-1">We will send them an invite email</p>
      </div>

      <div>
        <LabelWithInfo label="Access Code Usage" required info="Controls who can utilize the fleet access code for charging" />
        <div className="inline-flex p-1 bg-slate-50/90 rounded-2xl border border-stone-200/80 gap-1.5 mt-2">
          <button
            type="button"
            disabled={isViewMode}
            onClick={() => setValue('accessCodeUsage', 'Only Added Drivers')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-2 ${
              accessCodeUsage === 'Only Added Drivers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${accessCodeUsage === 'Only Added Drivers' ? 'bg-emerald-400' : 'bg-stone-300'}`} />
            <span>Only Added Drivers</span>
          </button>
          <button
            type="button"
            disabled={isViewMode}
            onClick={() => setValue('accessCodeUsage', 'Open To Everyone')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-2 ${
              accessCodeUsage === 'Open To Everyone'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${accessCodeUsage === 'Open To Everyone' ? 'bg-emerald-400' : 'bg-stone-300'}`} />
            <span>Open To Everyone</span>
          </button>
        </div>
        {errors.accessCodeUsage && (
          <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.accessCodeUsage.message}</p>
        )}
      </div>

      <div>
        <LabelWithInfo label="Payment Type" info="Prepaid or Postpaid fleet wallet settlement model" />
        <div className="inline-flex p-1 bg-slate-50/90 rounded-2xl border border-stone-200/80 gap-1.5 mt-2">
          <button
            type="button"
            disabled={isViewMode}
            onClick={() => setValue('paymentType', 'Prepaid')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-2 ${
              paymentType === 'Prepaid'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${paymentType === 'Prepaid' ? 'bg-[#4DA944]' : 'bg-stone-300'}`} />
            <span>Prepaid</span>
          </button>
          <button
            type="button"
            disabled={isViewMode}
            onClick={() => setValue('paymentType', 'Postpaid')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-2 ${
              paymentType === 'Postpaid'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${paymentType === 'Postpaid' ? 'bg-[#4DA944]' : 'bg-stone-300'}`} />
            <span>Postpaid</span>
          </button>
        </div>
      </div>

    </FormCard>
  );
}

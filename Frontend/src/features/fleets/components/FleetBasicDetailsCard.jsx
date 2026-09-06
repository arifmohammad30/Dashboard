import React from 'react';
import Input from '../../../components/ui/Input';
import LabelWithInfo from '../../../components/ui/LabelWithInfo';
import FormCard from '../../../components/ui/FormCard';
import SegmentedToggle from '../../../components/ui/SegmentedToggle';

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
        <LabelWithInfo htmlFor="name" label="Fleet Name" required info="Official operating name of the fleet" />
        <Input
          id="name"
          disabled={isViewMode}
          placeholder="e.g. EVRE FACTORY"
          {...register('name')}
          error={errors.name}
        />
      </div>

      <div>
        <LabelWithInfo htmlFor="ownerName" label="Fleet Owner Name" required info="Primary contact person or fleet manager" />
        <Input
          id="ownerName"
          autoComplete="name"
          disabled={isViewMode}
          placeholder="e.g. Rahul Sharma"
          {...register('ownerName')}
          error={errors.ownerName}
        />
      </div>

      <div>
        <LabelWithInfo htmlFor="ownerEmail" label="Fleet Owner Email" required info="Primary email address for system invites and billing" />
        <Input
          id="ownerEmail"
          type="email"
          autoComplete="email"
          disabled={isViewMode}
          placeholder="e.g. rahul@evre.in"
          {...register('ownerEmail')}
          error={errors.ownerEmail}
        />
        <p className="text-xs text-stone-400 font-medium mt-1">We will send them an invite email</p>
      </div>

      <div>
        <LabelWithInfo label="Access Code Usage" required info="Controls who can utilize the fleet access code for charging" />
        <div className="mt-2">
          <SegmentedToggle
            disabled={isViewMode}
            options={['Only Added Drivers', 'Open To Everyone']}
            value={accessCodeUsage}
            onChange={(val) => setValue('accessCodeUsage', val)}
          />
        </div>
        {errors.accessCodeUsage && (
          <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.accessCodeUsage.message}</p>
        )}
      </div>

      <div>
        <LabelWithInfo label="Payment Type" info="Prepaid or Postpaid fleet wallet settlement model" />
        <div className="mt-2">
          <SegmentedToggle
            disabled={isViewMode}
            options={['Prepaid', 'Postpaid']}
            value={paymentType}
            onChange={(val) => setValue('paymentType', val)}
          />
        </div>
      </div>

    </FormCard>
  );
}

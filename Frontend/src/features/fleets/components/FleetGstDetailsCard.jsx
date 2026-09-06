import React from 'react';
import Input from '../../../components/ui/Input';
import LabelWithInfo from '../../../components/ui/LabelWithInfo';
import FormCard from '../../../components/ui/FormCard';

export default function FleetGstDetailsCard({
  register,
  errors,
  isViewMode
}) {
  return (
    <FormCard title="GST Details">
      <div>
        <LabelWithInfo htmlFor="gstin" label="GSTIN" info="Goods and Services Tax Identification Number" />
        <Input
          id="gstin"
          disabled={isViewMode}
          placeholder="e.g. 27AAAAA0000A1Z5"
          {...register('gstin')}
          error={errors.gstin}
        />
      </div>

      <div>
        <LabelWithInfo htmlFor="companyName" label="Company Name" info="Registered legal entity name" />
        <Input
          id="companyName"
          autoComplete="organization"
          disabled={isViewMode}
          placeholder="e.g. EVRE Private Limited"
          {...register('companyName')}
          error={errors.companyName}
        />
      </div>

      <div>
        <LabelWithInfo htmlFor="companyEmail" label="Company Email" info="Billing or finance team contact email" />
        <Input
          id="companyEmail"
          type="email"
          autoComplete="email"
          disabled={isViewMode}
          placeholder="e.g. accounts@evre.in"
          {...register('companyEmail')}
          error={errors.companyEmail}
        />
      </div>

      <div>
        <LabelWithInfo htmlFor="companyPhone" label="Company Phone Number" info="Official contact telephone or mobile" />
        <Input
          id="companyPhone"
          autoComplete="tel"
          prefix="+91"
          disabled={isViewMode}
          placeholder="9876543210"
          {...register('companyPhone')}
          error={errors.companyPhone}
        />
      </div>
    </FormCard>
  );
}

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
        <LabelWithInfo label="GSTIN" info="Goods and Services Tax Identification Number" />
        <Input
          disabled={isViewMode}
          placeholder="e.g. 27AAAAA0000A1Z5"
          {...register('gstin')}
          error={errors.gstin}
        />
      </div>

      <div>
        <LabelWithInfo label="Company Name" info="Registered legal entity name" />
        <Input
          disabled={isViewMode}
          placeholder="e.g. EVRE Private Limited"
          {...register('companyName')}
          error={errors.companyName}
        />
      </div>

      <div>
        <LabelWithInfo label="Company Email" info="Billing or finance team contact email" />
        <Input
          type="email"
          disabled={isViewMode}
          placeholder="e.g. accounts@evre.in"
          {...register('companyEmail')}
          error={errors.companyEmail}
        />
      </div>

      <div>
        <LabelWithInfo label="Company Phone Number" info="Official contact telephone or mobile" />
        <Input
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

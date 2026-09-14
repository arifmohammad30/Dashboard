import React from 'react';
import BackButton from '../../../components/ui/BackButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { Plus, Loader2 } from 'lucide-react';
import { useFleetForm } from '../hooks/useFleetForm';
import FleetBasicDetailsCard from '../components/FleetBasicDetailsCard';
import FleetGstDetailsCard from '../components/FleetGstDetailsCard';

export default function AddNewFleet({ isViewMode = false, isEditMode = false }) {
  const {
    loadingData,
    register,
    handleSubmit,
    onSubmit,
    handleCancelClick,
    setValue,
    errors,
    isSubmitting,
    accessCodeUsage,
    paymentType
  } = useFleetForm({ isViewMode, isEditMode });

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#4DA944]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading fleet details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-[1280px] mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header Bar with Navigation & Actions */}
      <div className="flex items-center justify-between px-1">
        <div>
          <BackButton to="/fleets" label="Back to Fleets" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
            {isViewMode ? 'View Fleet Details' : isEditMode ? 'Edit Fleet' : 'Add new fleet'}
          </h1>
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

      {/* Form Content: 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <FleetBasicDetailsCard
          register={register}
          errors={errors}
          isViewMode={isViewMode}
          accessCodeUsage={accessCodeUsage}
          paymentType={paymentType}
          setValue={setValue}
        />

        <FleetGstDetailsCard
          register={register}
          errors={errors}
          isViewMode={isViewMode}
        />
      </div>
    </form>
  );
}

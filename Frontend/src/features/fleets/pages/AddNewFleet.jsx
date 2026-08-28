import React from 'react';
import BackButton from '../../../components/ui/BackButton';
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-orange-500">
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-4 py-2 text-xs font-bold bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl shadow-2xs transition-all duration-150 cursor-pointer active:scale-95"
          >
            {isViewMode ? 'Back' : 'Cancel'}
          </button>

          {!isViewMode && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-xs border border-orange-700/40 transition-all duration-150 flex items-center gap-2 disabled:opacity-70 cursor-pointer active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{isEditMode ? 'Save Changes' : 'Add'}</span>
            </button>
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

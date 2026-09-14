import React from 'react';
import BackButton from '../../../components/ui/BackButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTariffForm } from '../hooks/useTariffForm';

import TariffBasicInfoSection from '../components/TariffBasicInfoSection';
import NormalPricingSection from '../components/NormalPricingSection';
import SpecialPeriodSection from '../components/SpecialPeriodSection';
import GstParkingSection from '../components/GstParkingSection';
import DailyPreviewTimeline from '../components/DailyPreviewTimeline';

/**
 * Add / Edit / View Tariff Page Component
 * Serves as the main container page assembling all tariff configuration sections:
 * Basic Info, Normal Pricing, Peak Periods, Off-Peak Periods, GST/Parking, and Daily Preview Timeline.
 */
export default function AddNewTariff({ isViewMode = false, isEditMode = false }) {
  const form = useTariffForm({ isViewMode, isEditMode });

  if (form.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-xs font-bold text-stone-500">Loading tariff details...</p>
      </div>
    );
  }

  if (form.fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 max-w-lg mx-auto text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 shadow-2xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-stone-900 mb-1">
          {form.fetchError.isNetworkError
            ? 'Unable to connect to server'
            : form.fetchError.title || 'Failed to load tariff details'}
        </h2>
        <p className="text-xs text-stone-500 font-medium mb-6 leading-relaxed">
          {form.fetchError.message || 'We could not retrieve the configuration for this tariff. Please check your connection or verify the tariff ID.'}
        </p>
        <div className="flex items-center gap-3">
          <BackButton to="/tariffs" label="Back to Tariffs" />
          <button
            type="button"
            onClick={form.reloadTariff}
            className="h-9 px-4 inline-flex items-center justify-center text-xs font-bold bg-[#4DA944] hover:bg-[#30702a] text-white rounded-xl shadow-xs transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4.5 max-w-[1180px] mx-auto pb-24 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <BackButton to="/tariffs" label="Back to Tariffs" />
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-2">
            {isViewMode ? 'View Tariff' : isEditMode ? 'Edit Tariff' : 'Create Tariff'}
          </h1>
          <p className="text-xs text-stone-500 font-medium">Configure normal, peak, and off-peak charging prices.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => form.navigate('/tariffs')}
            className="h-9 px-4 inline-flex items-center justify-center text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-xl shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
          >
            {isViewMode ? 'Back' : 'Cancel'}
          </button>
          {!isViewMode && (
            <PrimaryButton
              type="button"
              onClick={form.handleSubmit}
              isSubmitting={form.isSubmitting}
              isEditMode={isEditMode}
              addLabel="Save Tariff"
              editLabel="Save Changes"
              className={form.validationError ? 'bg-rose-600 hover:bg-rose-700 border-rose-700/30' : ''}
            />
          )}
        </div>
      </div>

      {/* Real-time Overlap Validation Banner */}
      {form.validationError && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300/90 rounded-2xl flex items-center gap-3 text-rose-900 font-extrabold text-xs shadow-md animate-in fade-in zoom-in-95 duration-150">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="text-rose-950 uppercase tracking-wider block text-[10px] font-black">Configuration Error</span>
            <span>{form.validationError}</span>
          </div>
        </div>
      )}

      {/* Section 1: Basic Info */}
      <TariffBasicInfoSection
        tariffName={form.tariffName}
        setTariffName={form.setTariffName}
        status={form.status}
        setStatus={form.setStatus}
        isViewMode={isViewMode}
      />

      {/* Section 2: Normal Pricing */}
      <NormalPricingSection
        normalEnergyPrice={form.normalEnergyPrice}
        setNormalEnergyPrice={form.setNormalEnergyPrice}
        normalTimePrice={form.normalTimePrice}
        setNormalTimePrice={form.setNormalTimePrice}
        normalSocRanges={form.normalSocRanges}
        socErrors={form.socErrors}
        addNormalSocRange={form.addNormalSocRange}
        updateNormalSocRange={form.updateNormalSocRange}
        removeNormalSocRange={form.removeNormalSocRange}
        isViewMode={isViewMode}
      />

      {/* Section 3: Peak Pricing */}
      <SpecialPeriodSection
        type="Peak"
        periods={form.peakPeriods}
        periodErrors={form.periodErrors}
        socErrors={form.socErrors}
        onAddPeriod={form.addPeakPeriod}
        onRemovePeriod={form.removePeakPeriod}
        onToggleDay={form.togglePeakDay}
        onUpdatePeriodField={form.updatePeakPeriodField}
        onAddSocRange={form.addPeakSocRange}
        onUpdateSocRange={form.updatePeakSocRange}
        onRemoveSocRange={form.removePeakSocRange}
        isViewMode={isViewMode}
      />

      {/* Section 4: Off-Peak Pricing */}
      <SpecialPeriodSection
        type="Off-Peak"
        periods={form.offPeakPeriods}
        periodErrors={form.periodErrors}
        socErrors={form.socErrors}
        onAddPeriod={form.addOffPeakPeriod}
        onRemovePeriod={form.removeOffPeakPeriod}
        onToggleDay={form.toggleOffPeakDay}
        onUpdatePeriodField={form.updateOffPeakPeriodField}
        onAddSocRange={form.addOffPeakSocRange}
        onUpdateSocRange={form.updateOffPeakSocRange}
        onRemoveSocRange={form.removeOffPeakSocRange}
        isViewMode={isViewMode}
      />

      {/* Section 5: GST & Parking */}
      <GstParkingSection
        gstPercentage={form.gstPercentage}
        setGstPercentage={form.setGstPercentage}
        enableParkingFee={form.enableParkingFee}
        setEnableParkingFee={form.setEnableParkingFee}
        parkingFee={form.parkingFee}
        setParkingFee={form.setParkingFee}
        parkingGracePeriod={form.parkingGracePeriod}
        setParkingGracePeriod={form.setParkingGracePeriod}
        parkingChargeStarts={form.parkingChargeStarts}
        setParkingChargeStarts={form.setParkingChargeStarts}
        isViewMode={isViewMode}
      />

      {/* Section 6: Daily Preview Timeline */}
      <DailyPreviewTimeline
        peakPeriods={form.peakPeriods}
        offPeakPeriods={form.offPeakPeriods}
      />
    </div>
  );
}

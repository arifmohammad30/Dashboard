import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { Loader2, Plus, Save } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import BackButton from '../../../components/ui/BackButton';
import FormCard from '../../../components/ui/FormCard';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import AccessEntitySearchBox from '../components/AccessEntitySearchBox';
import { useToast } from '../../../context/ToastContext';
import { getDiscountById, createDiscount, updateDiscount } from '../api/discountService';

const discountSchema = z.object({
  name: z.string().min(1, 'Discount Name is required'),
  type: z.string().min(1, 'Discount Type is required'),
  status: z.string().min(1, 'Discount Status is required'),
  conditionType: z.string().optional(),
  appVariants: z.string().optional(),
  userAccess: z.string().optional(),
  fleetsAccess: z.string().optional(),
  chargingStationsAccess: z.string().optional(),
  chargePointsAccess: z.string().optional()
});

const DISCOUNT_TYPES = ['Percentage Discounts', 'Fixed Amount', 'Discounted Tariff Rates'];
const DISCOUNT_STATUSES = ['Active', 'Inactive'];
const CONDITION_TYPES = ['OR', 'AND'];

const LabelWithInfo = ({ label, required }) => (
  <label className="text-xs font-bold text-stone-700 mb-1.5 block">
    {label} {required && <span className="text-rose-500">*</span>}
  </label>
);

const FleetStyleSelectGroup = ({ options, currentValue, onChange }) => {
  return (
    <div className="inline-flex p-1 bg-slate-50/90 rounded-2xl border border-stone-200/80 gap-1.5 mt-1">
      {options.map((opt) => {
        const isSelected = currentValue === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-2 ${
              isSelected
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-stone-300'}`} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default function AddNewDiscount({ isEditMode = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected access control entity arrays
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedFleets, setSelectedFleets] = useState([]);
  const [selectedStations, setSelectedStations] = useState([]);
  const [selectedChargePoints, setSelectedChargePoints] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: '',
      type: 'Percentage Discounts',
      status: 'Active',
      conditionType: 'OR',
      appVariants: 'All',
      userAccess: 'All',
      fleetsAccess: 'All',
      chargingStationsAccess: 'All',
      chargePointsAccess: 'All'
    }
  });

  const selectedType = useWatch({ control, name: 'type' });
  const selectedStatus = useWatch({ control, name: 'status' });
  const selectedConditionType = useWatch({ control, name: 'conditionType' });
  const appVariantsMode = useWatch({ control, name: 'appVariants' });
  const userAccessMode = useWatch({ control, name: 'userAccess' });
  const fleetsAccessMode = useWatch({ control, name: 'fleetsAccess' });
  const stationsAccessMode = useWatch({ control, name: 'chargingStationsAccess' });
  const chargePointsAccessMode = useWatch({ control, name: 'chargePointsAccess' });

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      getDiscountById(id)
        .then((res) => {
          if (res) {
            reset({
              name: res.name || '',
              type: res.type || 'Percentage Discounts',
              status: res.status || 'Active',
              conditionType: res.conditionType || 'OR',
              appVariants: res.appVariants || 'All',
              userAccess: res.userAccess || 'All',
              fleetsAccess: res.fleetsAccess || 'All',
              chargingStationsAccess: res.chargingStationsAccess || 'All',
              chargePointsAccess: res.chargePointsAccess || 'All'
            });

            try { setSelectedUsers(typeof res.selectedUsers === 'string' ? JSON.parse(res.selectedUsers) : res.selectedUsers || []); } catch (e) {}
            try { setSelectedFleets(typeof res.selectedFleets === 'string' ? JSON.parse(res.selectedFleets) : res.selectedFleets || []); } catch (e) {}
            try { setSelectedStations(typeof res.selectedStations === 'string' ? JSON.parse(res.selectedStations) : res.selectedStations || []); } catch (e) {}
            try { setSelectedChargePoints(typeof res.selectedChargePoints === 'string' ? JSON.parse(res.selectedChargePoints) : res.selectedChargePoints || []); } catch (e) {}
          }
        })
        .catch((err) => {
          console.error('Failed to load discount:', err);
          toast.error('Failed to load discount details.', { code: 500 });
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, id, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        selectedUsers,
        selectedFleets,
        selectedStations,
        selectedChargePoints
      };

      if (isEditMode && id) {
        await updateDiscount(id, payload);
        toast.success(`Discount offer "${data.name}" updated successfully!`, { code: 200 });
      } else {
        await createDiscount(payload);
        toast.success(`Discount offer "${data.name}" created successfully!`, { code: 201 });
      }

      navigate('/discounts');
    } catch (err) {
      console.error('Failed to save discount offer:', err);
      toast.error(err.message || 'Failed to save discount offer.', { code: 500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header Navigation & Action Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <BackButton to="/discounts" label="Back to Discounts" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {isEditMode ? 'Edit Discount' : 'Add New Discount'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/discounts')}
            className="px-4 py-2 text-xs font-bold bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <PrimaryButton type="submit" disabled={isSubmitting || loading}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : isEditMode ? (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Update</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                <span>Add</span>
              </>
            )}
          </PrimaryButton>
        </div>
      </div>

      {/* 2-Card Layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* Card 1: Discount Details */}
        <FormCard title="Discount Details">
          <div>
            <LabelWithInfo label="Name" required />
            <Input
              type="text"
              placeholder="This is the unique name for the offer"
              {...register('name')}
              error={errors.name}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LabelWithInfo label="Type" required />
              <Select
                options={DISCOUNT_TYPES}
                value={selectedType}
                onChange={(e) => setValue('type', e.target.value)}
                error={errors.type}
              />
            </div>

            <div>
              <LabelWithInfo label="Discount Status" required />
              <Select
                options={DISCOUNT_STATUSES}
                value={selectedStatus}
                onChange={(e) => setValue('status', e.target.value)}
                error={errors.status}
              />
            </div>
          </div>
        </FormCard>

        {/* Card 2: Discount Access Controls */}
        <FormCard title="Discount Access Controls">
          <div>
            <LabelWithInfo label="Condition Type" />
            <Select
              options={CONDITION_TYPES}
              value={selectedConditionType}
              onChange={(e) => setValue('conditionType', e.target.value)}
              error={errors.conditionType}
            />
          </div>

          {/* App Variants Selecting Buttons inside a single container div */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <LabelWithInfo label="App Variants" />
            <div>
              <FleetStyleSelectGroup
                currentValue={appVariantsMode}
                onChange={(val) => setValue('appVariants', val)}
                options={[
                  { label: 'All App Variants', value: 'All' },
                  { label: 'Selected App Variants', value: 'Selected' }
                ]}
              />
            </div>
          </div>

          {/* User Access Selecting Buttons inside a single container div & Search Box */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <LabelWithInfo label="User Access" />
            <div>
              <FleetStyleSelectGroup
                currentValue={userAccessMode}
                onChange={(val) => setValue('userAccess', val)}
                options={[
                  { label: 'All Users', value: 'All' },
                  { label: 'Selected Users', value: 'Selected' }
                ]}
              />
            </div>

            {userAccessMode === 'Selected' && (
              <div className="mt-2.5">
                <AccessEntitySearchBox
                  category="users"
                  placeholder="Search users by name or email (Hit 'Enter' to add)..."
                  selectedItems={selectedUsers}
                  onChange={setSelectedUsers}
                />
              </div>
            )}
          </div>

          {/* Fleets Access Selecting Buttons inside a single container div & Search Box */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <LabelWithInfo label="Fleets Access" />
            <div>
              <FleetStyleSelectGroup
                currentValue={fleetsAccessMode}
                onChange={(val) => setValue('fleetsAccess', val)}
                options={[
                  { label: 'All Fleets', value: 'All' },
                  { label: 'Selected Fleets', value: 'Selected' }
                ]}
              />
            </div>

            {fleetsAccessMode === 'Selected' && (
              <div className="mt-2.5">
                <AccessEntitySearchBox
                  category="fleets"
                  placeholder="Search fleets by name or code (Hit 'Enter' to add)..."
                  selectedItems={selectedFleets}
                  onChange={setSelectedFleets}
                />
              </div>
            )}
          </div>

          {/* Charging Stations Access Selecting Buttons inside a single container div & Search Box */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <LabelWithInfo label="Charging Stations Access" />
            <div>
              <FleetStyleSelectGroup
                currentValue={stationsAccessMode}
                onChange={(val) => setValue('chargingStationsAccess', val)}
                options={[
                  { label: 'All Charging Stations', value: 'All' },
                  { label: 'Select Charging Stations', value: 'Selected' }
                ]}
              />
            </div>

            {stationsAccessMode === 'Selected' && (
              <div className="mt-2.5">
                <AccessEntitySearchBox
                  category="chargingStations"
                  placeholder="Search charging stations by name (Hit 'Enter' to add)..."
                  selectedItems={selectedStations}
                  onChange={setSelectedStations}
                />
              </div>
            )}
          </div>

          {/* Charge Points Access Selecting Buttons inside a single container div & Search Box */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <LabelWithInfo label="Charge Points Access" />
            <div>
              <FleetStyleSelectGroup
                currentValue={chargePointsAccessMode}
                onChange={(val) => setValue('chargePointsAccess', val)}
                options={[
                  { label: 'All Charge Points', value: 'All' },
                  { label: 'Select Charge Points', value: 'Selected' }
                ]}
              />
            </div>

            {chargePointsAccessMode === 'Selected' && (
              <div className="mt-2.5">
                <AccessEntitySearchBox
                  category="chargePoints"
                  placeholder="Search charge points by code or name (Hit 'Enter' to add)..."
                  selectedItems={selectedChargePoints}
                  onChange={setSelectedChargePoints}
                />
              </div>
            )}
          </div>
        </FormCard>
      </div>
    </form>
  );
}

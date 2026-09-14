import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import BackButton from '../../../components/ui/BackButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FormCard from '../../../components/ui/FormCard';
import { createTeamMember, updateTeamMember, getTeamMemberById } from '../api/teamMemberService';
import { useToast } from '../../../context/ToastContext';

const USER_TYPE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Team Member', label: 'Team Member' },
  { value: 'Operations Team', label: 'Operations Team' },
  { value: 'Service Team', label: 'Service Team' }
];

const teamMemberSchema = z.object({
  name: z.string().trim().min(2, "Team member's name is required (min 2 characters)"),
  email: z.string().trim().email('Please enter a valid email address'),
  userType: z.string().min(1, 'Please select a user type')
});

export default function AddTeamMember({ isEditMode = false, isViewMode = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [loadingData, setLoadingData] = useState(isEditMode || isViewMode);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: '',
      email: '',
      userType: ''
    }
  });

  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      setLoadingData(true);
      getTeamMemberById(id)
        .then((res) => {
          if (res?.data) {
            reset({
              name: res.data.name || '',
              email: res.data.email || '',
              userType: res.data.userType || ''
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load team member:', err);
          toast.error('Failed to load team member details');
        })
        .finally(() => setLoadingData(false));
    }
  }, [id, isEditMode, isViewMode, reset, toast]);

  const onSubmit = async (data) => {
    try {
      if (isEditMode && id) {
        await updateTeamMember(id, data);
        toast.success('Team member updated successfully');
      } else {
        await createTeamMember(data);
        toast.success('Team member added successfully! An invite email will be sent.');
      }
      navigate('/team-members');
    } catch (err) {
      console.error('Error saving team member:', err);
      toast.error(err.message || 'Failed to save team member');
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#4DA944] mb-3" />
        <p className="text-xs font-semibold text-stone-500">Loading team member details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header Navigation & Action Bar */}
      <div className="flex items-center justify-between px-1">
        <div>
          <BackButton to="/team-members" label="Back to Team Members" />
          {/* <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
            {isViewMode ? 'View team member' : isEditMode ? 'Edit team member' : 'Add team member'}
          </h1> */}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/team-members')}
            className="px-4 py-2 text-xs font-bold bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl shadow-2xs transition-colors cursor-pointer active:scale-95"
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
              loadingText={isEditMode ? 'Saving...' : 'Adding...'}
            />
          )}
        </div>
      </div>

      {/* Main Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <FormCard title="Basic Details">
          {/* Team Member's Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-xs font-bold text-slate-700">
              Team Member's name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="name"
              disabled={isViewMode}
              placeholder="John B. Goodenough"
              {...register('name')}
              error={errors.name}
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-bold text-slate-700">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isViewMode}
              placeholder="john@mycompany.com"
              {...register('email')}
              error={errors.email}
            />
            <p className="text-[11px] text-slate-400 font-medium pl-0.5">
              We will send them an invite email
            </p>
          </div>

          {/* User Type */}
          <div className="space-y-1.5">
            <label htmlFor="userType" className="block text-xs font-bold text-slate-700">
              User Type <span className="text-rose-500">*</span>
            </label>
            <Controller
              name="userType"
              control={control}
              render={({ field }) => (
                <Select
                  id="userType"
                  disabled={isViewMode}
                  options={USER_TYPE_OPTIONS}
                  placeholder="Select a user type"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  error={errors.userType}
                />
              )}
            />
          </div>
        </FormCard>
      </div>


    </form>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFleet, updateFleet, getFleetById } from '../api/fleetService';
import { useToast } from '../../../context/ToastContext';

export const fleetSchema = z.object({
  name: z.string().trim().min(2, 'Fleet Name must be at least 2 characters'),
  ownerName: z.string().trim().min(2, 'Fleet Owner Name is required'),
  ownerEmail: z.string().trim().email('Valid Fleet Owner Email is required'),
  accessCodeUsage: z.enum(['Only Added Drivers', 'Open To Everyone']),
  paymentType: z.enum(['Prepaid', 'Postpaid']),
  gstin: z.string().optional(),
  companyName: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
});

export function useFleetForm({ isViewMode = false, isEditMode = false } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const fleetData = location.state?.fleet;

  const [loadingData, setLoadingData] = useState(false);
  const [activeFleet, setActiveFleet] = useState(fleetData);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(fleetSchema),
    defaultValues: {
      name: fleetData?.name || '',
      ownerName: fleetData?.ownerName || '',
      ownerEmail: fleetData?.ownerEmail || '',
      accessCodeUsage: fleetData?.accessCodeUsage || 'Open To Everyone',
      paymentType: fleetData?.paymentType || 'Prepaid',
      gstin: fleetData?.gstin || '',
      companyName: fleetData?.companyName || '',
      companyEmail: fleetData?.companyEmail || '',
      companyPhone: fleetData?.companyPhone || '',
    }
  });

  const accessCodeUsage = watch('accessCodeUsage');
  const paymentType = watch('paymentType');

  useEffect(() => {
    if (id && !fleetData) {
      setLoadingData(true);
      getFleetById(id)
        .then((data) => {
          if (data) {
            setActiveFleet(data);
            reset({
              name: data.name || '',
              ownerName: data.ownerName || '',
              ownerEmail: data.ownerEmail || '',
              accessCodeUsage: data.accessCodeUsage || 'Open To Everyone',
              paymentType: data.paymentType || 'Prepaid',
              gstin: data.gstin || '',
              companyName: data.companyName || '',
              companyEmail: data.companyEmail || '',
              companyPhone: data.companyPhone || '',
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching fleet by ID:', err);
          toast.error('Failed to load fleet details.', { code: 500 });
        })
        .finally(() => setLoadingData(false));
    }
  }, [id, fleetData, reset]);

  const handleCancelClick = () => {
    navigate('/fleets');
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name.trim(),
        ownerName: data.ownerName.trim(),
        ownerEmail: data.ownerEmail.trim(),
        accessCodeUsage: data.accessCodeUsage,
        paymentType: data.paymentType,
        gstin: data.gstin ? data.gstin.trim() : null,
        companyName: data.companyName ? data.companyName.trim() : null,
        companyEmail: data.companyEmail ? data.companyEmail.trim() : null,
        companyPhone: data.companyPhone ? data.companyPhone.trim() : null,
        operatorCode: activeFleet?.operatorCode,
        driverCount: activeFleet?.driverCount || 0,
        availableWalletBalance: activeFleet?.availableWalletBalance || 0.0,
        status: activeFleet?.status || 'Active',
      };

      const targetId = activeFleet?.id || id;
      if (isEditMode && targetId) {
        await updateFleet(targetId, payload);
        toast.success('Fleet updated successfully!', { code: 200 });
      } else {
        await createFleet(payload);
        toast.success('Fleet created successfully!', { code: 201 });
      }

      navigate('/fleets');
    } catch (error) {
      console.error('Error saving fleet:', error);
      toast.error(error.message || 'Failed to save fleet.', { code: 500 });
    }
  };

  return {
    navigate,
    isViewMode,
    isEditMode,
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
  };
}

import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { Merchant, CreateMerchantPayload, UpdateMerchantPayload, UpdateMerchantAttributesPayload } from '../types/merchant';
import { useMerchantContext } from '../context/MerchantContext';

interface MerchantFormModalProps {
  isOpen: boolean;
  merchant?: Merchant;
  onClose: () => void;
  onSubmit: (data: CreateMerchantPayload | UpdateMerchantPayload | any) => Promise<void>;
  onDelete?: (merchant: Merchant) => void;
  loading?: boolean;
}

const MerchantFormModal: React.FC<MerchantFormModalProps> = ({
  isOpen,
  merchant,
  onClose,
  onSubmit,
  onDelete,
  loading = false,
}) => {
  const { clusters } = useMerchantContext();
  const [formData, setFormData] = useState<Partial<CreateMerchantPayload & { status: string; caption: string; website: string; timeZone: string; contactFirstName: string; contactLastName: string }>>({
    name: '',
    email: '',
    phone: '',
    cluster: clusters[0]?.id || '',
    address: '',
    city: '',
    state: '',
    country: '',
    taxId: '',
    status: 'active',
    userName: '',
    password: '',
    firstName: '',
    lastName: '',
    caption: '',
    website: '',
    timeZone: 'Asia/Calcutta',
    contactFirstName: '',
    contactLastName: '',
  });
  const [originalData, setOriginalData] = useState<Partial<CreateMerchantPayload & { status: string; caption: string; website: string; timeZone: string; contactFirstName: string; contactLastName: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (merchant) {
      const initialData = {
        name: merchant.name,
        email: merchant.email,
        phone: merchant.phone,
        cluster: merchant.cluster,
        address: merchant.address || '',
        city: merchant.city || '',
        state: merchant.state || '',
        country: merchant.country || '',
        taxId: merchant.taxId || '',
        status: merchant.status ? merchant.status.toLowerCase() : 'active',
        caption: merchant.caption || '',
        website: merchant.website || '',

        timeZone: merchant.timeZone || 'Asia/Calcutta',
        contactFirstName: merchant.contactFirstName || '',
        contactLastName: merchant.contactLastName || '',
      };
      setFormData(initialData);
      setOriginalData(initialData); // Store original data for comparison
    } else {
      const emptyData = {
        name: '',
        email: '',
        phone: '',
        cluster: clusters[0]?.id || '',
        address: '',
        city: '',
        state: '',
        country: '',
        taxId: '',
        status: 'active',
        userName: '',
        password: '',
        firstName: '',
        lastName: '',
        caption: '',
        website: '',

        timeZone: 'Asia/Calcutta',
        contactFirstName: '',
        contactLastName: '',
      };
      setFormData(emptyData);
      setOriginalData({});
    }
    setErrors({});
  }, [merchant, clusters, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!merchant) {
      if (!formData.firstName?.trim()) newErrors.firstName = 'First Name is required';
      if (!formData.lastName?.trim()) newErrors.lastName = 'Last Name is required';
      if (!formData.userName?.trim()) newErrors.userName = 'User Name is required';
      if (!formData.password?.trim()) newErrors.password = 'Password is required';
      if (!formData.cluster) newErrors.cluster = 'Cluster is required';
    } else {
      if (!formData.name?.trim()) newErrors.name = 'Name is required';
      if (!formData.phone?.trim()) newErrors.phone = 'Phone is required';
    }

    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.email?.includes('@')) newErrors.email = 'Invalid email format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Helper to check if a field has been modified
  const isFieldModified = (fieldName: string): boolean => {
    if (!merchant) return false; // New merchant, no modifications tracked
    return formData[fieldName as keyof typeof formData] !== originalData[fieldName as keyof typeof originalData];
  };

  // Helper to get input class with modification indicator
  const getInputClass = (fieldName: string, hasError: boolean = false): string => {
    const baseClass = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-genx-500 transition-all';
    const errorClass = hasError ? 'border-red-500' : 'border-gray-200';
    const modifiedClass = isFieldModified(fieldName) ? 'border-blue-400 bg-blue-50/30' : '';

    return `${baseClass} ${hasError ? errorClass : modifiedClass || errorClass}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (merchant) {
        // For updates, only send changed fields
        const changedFields: Partial<UpdateMerchantPayload> = {};

        // Compare each field with original data
        (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
          // Skip cluster field for updates
          if (key === 'cluster') return;

          const currentValue = formData[key];
          const originalValue = originalData[key];

          // Check if the value has changed
          if (currentValue !== originalValue) {
            // Only include non-empty values or if it was cleared intentionally
            if (currentValue !== '' || originalValue !== '') {
              (changedFields as any)[key] = currentValue;
            }
          }
        });

        // If no fields changed, show a message
        if (Object.keys(changedFields).length === 0) {
          console.log('No changes detected');
          onClose();
          return;
        }

        console.log('Sending only changed fields:', changedFields);
        await onSubmit(changedFields);
      } else {
        // For new merchants, send all data
        await onSubmit(formData as any);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-card-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-genx-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-genx-50 p-6">
          <h2 className="text-xl font-semibold text-genx-700">
            {merchant ? 'Edit Merchant' : 'Add New Merchant'}
          </h2>
          <button
            onClick={onClose}
            className="text-genx-700 hover:text-genx-900 p-2 rounded-md"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conditional Fields based on Create vs Edit */}
            {merchant ? (
              <>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className={getInputClass('name', !!errors.name)}
                    placeholder="Enter merchant name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className={getInputClass('phone', !!errors.phone)}
                    placeholder="+1-234-567-8900"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>


                {/* Contact First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact First Name
                  </label>
                  <input
                    type="text"
                    name="contactFirstName"
                    value={formData.contactFirstName || ''}
                    onChange={handleChange}
                    className={getInputClass('contactFirstName')}
                    placeholder="First Name"
                  />
                </div>

                {/* Contact Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Last Name
                  </label>
                  <input
                    type="text"
                    name="contactLastName"
                    value={formData.contactLastName || ''}
                    onChange={handleChange}
                    className={getInputClass('contactLastName')}
                    placeholder="Last Name"
                  />
                </div>
              </>
            ) : (
              <>
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    className={getInputClass('firstName', !!errors.firstName)}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    className={getInputClass('lastName', !!errors.lastName)}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>

                {/* User Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName || ''}
                    onChange={handleChange}
                    className={getInputClass('userName', !!errors.userName)}
                    placeholder="johndoe"
                  />
                  {errors.userName && <p className="mt-1 text-sm text-red-600">{errors.userName}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password || ''}
                    onChange={handleChange}
                    className={getInputClass('password', !!errors.password)}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
              </>
            )}

            {/* Email - Always shown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className={getInputClass('email', !!errors.email)}
                placeholder="merchant@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* New Fields: Caption, Website, Timezone - Only for Edit (or both) */}
            {merchant && (
              <>
                {/* Caption */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Caption / Headline
                  </label>
                  <input
                    type="text"
                    name="caption"
                    value={formData.caption || ''}
                    onChange={handleChange}
                    className={getInputClass('caption')}
                    placeholder="Today enterprises face an impossible challenge..."
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    className={getInputClass('website')}
                    placeholder="https://example.com"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    name="timeZone"
                    value={formData.timeZone || ''}
                    onChange={handleChange}
                    className={getInputClass('timeZone')}
                    placeholder="Asia/Calcutta"
                  />
                </div>

                {/* Location Fields - Show for edit mode */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 mt-2 pt-2 border-t border-gray-100">Location Information</h4>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    className={getInputClass('address')}
                    placeholder="Street address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    className={getInputClass('city')}
                    placeholder="City"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className={getInputClass('state')}
                    placeholder="State"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country || ''}
                    onChange={handleChange}
                    className={getInputClass('country')}
                    placeholder="Country"
                  />
                </div>

                {/* Tax ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId || ''}
                    onChange={handleChange}
                    className={getInputClass('taxId')}
                    placeholder="Tax ID"
                  />
                </div>
              </>
            )}

            {/* Cluster - Only show when creating new merchant */}
            {!merchant && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cluster <span className="text-red-600">*</span>
                </label>
                <select
                  name="cluster"
                  value={formData.cluster || ''}
                  onChange={handleChange}
                  className={getInputClass('cluster', !!errors.cluster)}
                >
                  <option value="">Select cluster</option>
                  {clusters.map(cluster => (
                    <option key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </option>
                  ))}
                </select>
                {errors.cluster && <p className="mt-1 text-sm text-red-600">{errors.cluster}</p>}
              </div>
            )}

            {/* Only show address and other details when creating a NEW merchant */}
            {!merchant && (
              <>
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    className={getInputClass('address')}
                    placeholder="Street address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    className={getInputClass('city')}
                    placeholder="City"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className={getInputClass('state')}
                    placeholder="State"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country || ''}
                    onChange={handleChange}
                    className={getInputClass('country')}
                    placeholder="Country"
                  />
                </div>

                {/* Tax ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId || ''}
                    onChange={handleChange}
                    className={getInputClass('taxId')}
                    placeholder="Tax ID"
                  />
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-genx-50">
            {merchant && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(merchant)}
                disabled={true}
                className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed flex items-center gap-2 mr-auto"
                title="Delete functionality is temporarily disabled"
              >
                <FiTrash2 size={16} />
                <span>Delete Merchant</span>
              </button>
            )}
            {merchant && Object.keys(formData).some(key => isFieldModified(key)) && (
              <div className="text-sm text-blue-600 flex items-center gap-2 flex-1">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                Changes detected
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-200 text-genx-700 rounded-lg hover:bg-genx-50 transition-colors ml-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-genx-500 text-white rounded-lg hover:opacity-95 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Saving...' : merchant ? 'Update Merchant' : 'Create Merchant'}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
};

export default MerchantFormModal;

import React, { useState, useEffect } from 'react';
import { FiX, FiPackage, FiSave, FiTrash2, FiArrowLeft, FiPlus, FiEye, FiEyeOff } from 'react-icons/fi';
import { AIArtifact } from '../types/merchant';
import merchantService from '../services/merchantService';

interface AIArtifactViewModalProps {
    artifact: AIArtifact | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
    onDelete?: () => void;
}

const AIArtifactViewModal: React.FC<AIArtifactViewModalProps> = ({ artifact, isOpen, onClose, onUpdate, onDelete }) => {
    const [formData, setFormData] = useState<Partial<AIArtifact>>({});
    const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });
    const [showToken, setShowToken] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (artifact && isOpen) {
            setFormData({ ...artifact });
        }
    }, [artifact, isOpen]);

    if (!isOpen || !artifact) return null;

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedInputChange = (parent: string, field: string, value: any) => {
        setFormData(prev => {
            const currentParent = (prev as any)[parent] || {};
            return {
                ...prev,
                [parent]: {
                    ...currentParent,
                    [field]: value
                }
            };
        });
    };

    const handleAuthValueChange = (field: string, value: any) => {
        setFormData(prev => {
            const currentAuth = prev.authentication || { type: 'TOKEN', value: { token: '' } };
            const currentVal = currentAuth.value || { token: '' };
            return {
                ...prev,
                authentication: {
                    ...currentAuth,
                    value: {
                        ...currentVal,
                        [field]: value
                    }
                }
            };
        });
    };

    const handleAddAttribute = () => {
        if (!newAttribute.key) return;
        const currentAttributes = formData.otherAttributes || [];
        const updatedAttributes = [...currentAttributes, { ...newAttribute }];
        handleInputChange('otherAttributes', updatedAttributes);
        setNewAttribute({ key: '', value: '' });
    };

    const handleRemoveAttribute = (index: number) => {
        const currentAttributes = formData.otherAttributes || [];
        const updatedAttributes = currentAttributes.filter((_, i) => i !== index);
        handleInputChange('otherAttributes', updatedAttributes);
    };

    const handleUpdate = async () => {
        if (!formData.name) {
            alert('Name is required');
            return;
        }
        setLoading(true);
        try {
            await merchantService.updateAIArtifact(artifact.merchantId || '', artifact.id, formData, artifact.cluster);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error updating artifact:', error);
            alert('Failed to update artifact');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this artifact?')) return;
        setLoading(true);
        try {
            await merchantService.deleteAIArtifact(artifact.id, artifact.cluster);
            if (onDelete) onDelete();
        } catch (error) {
            console.error('Error deleting artifact:', error);
            alert('Failed to delete artifact');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#f8fafc] rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-200">
                {/* Body - Main Content Section */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column - Main Form */}
                        <div className="flex-[2] space-y-6">
                            <div className="flex gap-6 items-start">
                                {/* Large Icon/Image Placeholder */}
                                <div className="w-24 h-24 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                                    {formData.icon?.url ? (
                                        <img src={formData.icon.url} alt="Artifact" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-1.5 h-12 bg-black mb-1"></div>
                                            <div className="w-1.5 h-12 bg-black"></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Enter name"
                                        />
                                    </div>

                                    {/* Access */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            Access
                                        </label>
                                        <select
                                            value={formData.access || 'Private'}
                                            onChange={(e) => handleInputChange('access', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
                                        >
                                            <option value="Private">Private</option>
                                            <option value="Public">Public</option>
                                            <option value="Restricted">Restricted</option>
                                        </select>
                                    </div>

                                    {/* Host */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            Host
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.host || ''}
                                            onChange={(e) => handleInputChange('host', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                                            placeholder="Enter host URL"
                                        />
                                    </div>

                                    {/* API Key / Token */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            API Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showToken ? "text" : "password"}
                                                value={formData.authentication?.value?.token || ''}
                                                onChange={(e) => handleAuthValueChange('token', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm pr-10 focus:outline-none focus:border-blue-500"
                                                placeholder="••••••••••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowToken(!showToken)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showToken ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status || 'Active'}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Other Attributes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 titlecase tracking-wide">
                                    Other Attributes
                                </label>
                                <div className="space-y-3">
                                    {formData.otherAttributes?.map((attr, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <input
                                                type="text"
                                                value={attr.key}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={attr.value}
                                                onChange={(e) => {
                                                    const updated = [...(formData.otherAttributes || [])];
                                                    updated[idx].value = e.target.value;
                                                    handleInputChange('otherAttributes', updated);
                                                }}
                                                className="flex-[2] px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:border-blue-500 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleRemoveAttribute(idx)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="text"
                                            placeholder="Enter key"
                                            value={newAttribute.key}
                                            onChange={(e) => setNewAttribute(prev => ({ ...prev, key: e.target.value }))}
                                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Enter value"
                                            value={newAttribute.value}
                                            onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                                            className="flex-[2] px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={handleAddAttribute}
                                            className="p-2.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 shadow-sm border border-gray-200"
                                        >
                                            <FiPlus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded text-sm font-bold flex items-center shadow-md hover:bg-[#1e40af] disabled:opacity-50"
                                >
                                    <FiSave className="mr-2" /> Update
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-[#f43f5e] text-white rounded text-sm font-bold flex items-center shadow-md hover:bg-[#e11d48] disabled:opacity-50"
                                >
                                    <FiTrash2 className="mr-2" /> Delete
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-[#1e3a8a] rounded text-sm font-bold flex items-center shadow-sm hover:bg-gray-50"
                                >
                                    <FiArrowLeft className="mr-2" /> Back
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Secondary Info */}
                        <div className="flex-1 space-y-6 lg:border-l lg:pl-8 border-gray-200">
                            {/* Business Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Business Type
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={formData.businessType || ''}
                                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                                        className="flex-grow px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
                                    >
                                        <option value="">Select Business Type</option>
                                        <option value="Enterprise">Enterprise </option>
                                        <option value="Retail">Retail</option>
                                        <option value="Auto Dealership">Auto Dealership</option>
                                        <option value="E-Commerce">E-Commerce</option>
                                        <option value="Healthcares">Healthcares</option>
                                        <option value="Realestate">Realestate</option>
                                        <option value="Telecom">Telecom</option>
                                    </select>
                                    <button className="px-3 py-2 bg-[#1e3a8a] text-white rounded text-xs font-bold shadow-sm">
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={5}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 resize-none"
                                    placeholder="Enter description"
                                />
                            </div>

                            {/* Documentation */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Documentation
                                </label>
                                <textarea
                                    value={formData.documentation || ''}
                                    onChange={(e) => handleInputChange('documentation', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 resize-none"
                                    placeholder="Enter Documentation"
                                />
                            </div>

                            {/* Category/Tags */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Category
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.category ? (
                                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium flex items-center">
                                            {formData.category}
                                            <button onClick={() => handleInputChange('category', null)} className="ml-1.5 text-gray-400 hover:text-gray-600">
                                                <FiX size={10} />
                                            </button>
                                        </span>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Enter category"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleInputChange('category', (e.target as HTMLInputElement).value);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIArtifactViewModal;

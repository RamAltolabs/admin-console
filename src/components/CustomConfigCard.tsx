import React, { useState, useEffect, useMemo } from 'react';
import { FiSettings, FiSearch, FiRefreshCw, FiEdit, FiInfo, FiChevronDown, FiCopy, FiCheck, FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface CustomConfigCardProps {
    merchantId: string;
    cluster?: string;
}

const CustomConfigCard: React.FC<CustomConfigCardProps> = ({ merchantId, cluster }) => {
    const [customConfig, setCustomConfig] = useState<any>(null);
    const [editedConfig, setEditedConfig] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [showAddRow, setShowAddRow] = useState(false);

    const fetchCustomConfig = async () => {
        setLoading(true);
        try {
            const response = await merchantService.getMerchantAttributes(merchantId, 0, 1, cluster);
            if (response.content && response.content.length > 0) {
                const merchantData = response.content[0];
                const config = merchantData.customConfig || merchantData.merchant?.customConfig || {};
                setCustomConfig(config);
                setEditedConfig(JSON.parse(JSON.stringify(config))); // Deep copy
            } else {
                setCustomConfig({});
                setEditedConfig({});
            }
        } catch (error) {
            setCustomConfig({});
            setEditedConfig({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchCustomConfig();
        }
    }, [merchantId, cluster]);

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing
            setEditedConfig(JSON.parse(JSON.stringify(customConfig)));
            setShowAddRow(false);
        }
        setIsEditing(!isEditing);
    };

    const handleValueChange = (key: string, value: string) => {
        setEditedConfig({
            ...editedConfig,
            [key]: value
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await merchantService.updateCustomConfig(merchantId, editedConfig, cluster);
            setCustomConfig(JSON.parse(JSON.stringify(editedConfig)));
            setIsEditing(false);
            setShowAddRow(false);
            // Optional: Show success toast
        } catch (error) {
            console.error('Failed to save config:', error);
            alert('Failed to save configuration. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAttribute = () => {
        if (!newKey.trim()) {
            alert('Please enter a key name.');
            return;
        }
        if (editedConfig[newKey]) {
            alert('Key already exists.');
            return;
        }
        setEditedConfig({
            ...editedConfig,
            [newKey]: newValue
        });
        setNewKey('');
        setNewValue('');
        setShowAddRow(false);
    };

    const handleDeleteAttribute = (key: string) => {
        if (window.confirm(`Are you sure you want to delete "${key}"?`)) {
            const newConfig = { ...editedConfig };
            delete newConfig[key];
            setEditedConfig(newConfig);
        }
    };

    const copyValue = (key: string, value: any) => {
        const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const filteredEntries = useMemo(() => {
        const data = isEditing ? editedConfig : customConfig;
        if (!data) return [];
        return Object.entries(data).filter(([key, value]) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return key.toLowerCase().includes(q) ||
                JSON.stringify(value).toLowerCase().includes(q);
        });
    }, [customConfig, editedConfig, isEditing, searchQuery]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="w-10 h-10 border-4 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-bold text-gray-400 titlecase tracking-widest">Loading configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-blue-900 tracking-tight">Cloud Configuration</h2>
                        <FiInfo size={14} className="text-gray-300 cursor-help" />
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button
                                onClick={handleEditToggle}
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <FiEdit size={14} />
                                Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {saving ? <FiRefreshCw className="animate-spin" size={14} /> : <FiSave size={14} />}
                                    Save
                                </button>
                                <button
                                    onClick={handleEditToggle}
                                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-200"
                                >
                                    <FiX size={14} />
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-2 text-gray-500 text-sm leading-relaxed max-w-5xl">
                    <FiSettings className="mt-1 flex-shrink-0 text-blue-900/40" size={16} />
                    <p className="text-xs font-medium text-gray-400 leading-relaxed">
                        Cloud Configuration is an advanced setting that enables users to define and manage customized configurations tailored to their account.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-gray-400 titlecase tracking-widest titlecase">Configuration Attributes</h3>
                    {isEditing && (
                        <button
                            onClick={() => setShowAddRow(true)}
                            className="text-[10px] flex items-center gap-1 text-blue-900 hover:text-blue-800 font-black titlecase tracking-widest"
                        >
                            <FiPlus size={14} />
                            Add Attribute
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* Search Bar */}
                    {!isEditing && (
                        <div className="mb-6 relative max-w-md">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search attributes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 transition-all shadow-sm"
                            />
                        </div>
                    )}

                    {/* Add New Row */}
                    {isEditing && showAddRow && (
                        <div className="mb-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-blue-900 titlecase tracking-widest mb-1.5">Key Name</label>
                                <input
                                    type="text"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    placeholder="e.g. api_base_url"
                                    className="w-full px-4 py-2.5 text-sm border border-blue-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 bg-white"
                                />
                            </div>
                            <div className="flex-[1.5]">
                                <label className="block text-[10px] font-black text-blue-900 titlecase tracking-widest mb-1.5">Value</label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="Value content"
                                    className="w-full px-4 py-2.5 text-sm border border-blue-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 bg-white"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleAddAttribute}
                                    className="px-6 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-md"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => setShowAddRow(false)}
                                    className="px-6 py-2.5 bg-white text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 border border-gray-200 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {!filteredEntries.length ? (
                        <div className="text-center py-20 text-gray-400">
                            <FiInfo size={40} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm">No configuration data found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                            {filteredEntries.map(([key, value]) => (
                                <div key={key} className="flex items-center gap-0 group relative">
                                    {/* Key Box */}
                                    <div className={`flex-1 min-w-0 bg-[#f1f3f5] rounded-l px-4 py-2.5 flex items-center justify-between border-r border-gray-200/50 shadow-sm ${!isEditing ? 'hover:bg-[#ebedf0]' : ''} transition-colors cursor-default`}>
                                        <span className="text-sm text-gray-600 truncate font-normal" title={key}>
                                            {key}
                                        </span>
                                        {!isEditing && <FiChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                                    </div>

                                    {/* Value Box */}
                                    <div className="flex-[1.5] min-w-0 bg-[#f8f9fa] rounded-r px-4 py-2.5 flex items-center justify-between shadow-sm relative border-l border-transparent focus-within:border-sky-300 transition-all">
                                        {!isEditing ? (
                                            <>
                                                <span className="text-sm text-gray-500 truncate font-normal w-full" title={String(value)}>
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                                <button
                                                    onClick={() => copyValue(key, value)}
                                                    className="ml-2 p-1.5 rounded bg-white text-gray-400 hover:text-sky-500 hover:shadow-sm opacity-0 group-hover:opacity-100 transition-all absolute right-2"
                                                >
                                                    {copiedKey === key ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} />}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center w-full gap-2">
                                                <input
                                                    type="text"
                                                    value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    onChange={(e) => handleValueChange(key, e.target.value)}
                                                    className="w-full bg-transparent border-none text-sm text-gray-700 focus:outline-none p-0"
                                                />
                                                <button
                                                    onClick={() => handleDeleteAttribute(key)}
                                                    className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Refresh */}
            <div className="flex justify-between items-center px-4">
                <div className="text-[10px] font-black text-gray-400 titlecase tracking-widest">
                    {isEditing ? "* Changes will be applied after clicking Save" : `Found ${filteredEntries.length} Attributes`}
                </div>
                <button
                    onClick={fetchCustomConfig}
                    className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-blue-900 transition-all titlecase tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200"
                >
                    <FiRefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Last Updated: {new Date().toLocaleTimeString()}
                </button>
            </div>
        </div>
    );
};

export default CustomConfigCard;

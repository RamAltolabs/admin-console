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
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-normal text-gray-700">Cloud Configuration</h2>
                        <div className="flex items-center gap-2 absolute right-6 md:static">
                            {!isEditing ? (
                                <button
                                    onClick={handleEditToggle}
                                    className="p-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded flex items-center gap-2 text-sm transition-colors"
                                >
                                    <FiEdit size={14} />
                                    Edit
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="p-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
                                    >
                                        {saving ? <FiRefreshCw className="animate-spin" size={14} /> : <FiSave size={14} />}
                                        Save
                                    </button>
                                    <button
                                        onClick={handleEditToggle}
                                        className="p-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded flex items-center gap-2 text-sm transition-colors"
                                    >
                                        <FiX size={14} />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-2 text-gray-400 text-sm leading-relaxed max-w-5xl text-justify">
                    <FiSettings className="mt-1 flex-shrink-0 text-amber-500" size={16} />
                    <p>
                        Cloud Configuration is an advanced user setting that enables users to intricately define and meticulously manage customized configurations tailored to their specific account.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/80 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-600">Attributes</h3>
                    {isEditing && (
                        <button
                            onClick={() => setShowAddRow(true)}
                            className="text-xs flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold uppercase"
                        >
                            <FiPlus size={14} />
                            Add New
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
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-100 rounded bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:bg-white transition-all"
                            />
                        </div>
                    )}

                    {/* Add New Row */}
                    {isEditing && showAddRow && (
                        <div className="mb-6 p-4 bg-sky-50 rounded-lg border border-sky-100 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-sky-600 uppercase mb-1">Key Name</label>
                                <input
                                    type="text"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    placeholder="e.g. api_base_url"
                                    className="w-full px-3 py-2 text-sm border border-sky-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                />
                            </div>
                            <div className="flex-[1.5]">
                                <label className="block text-[10px] font-bold text-sky-600 uppercase mb-1">Value</label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="Value content"
                                    className="w-full px-3 py-2 text-sm border border-sky-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleAddAttribute}
                                    className="px-4 py-2 bg-sky-500 text-white rounded text-sm font-bold hover:bg-sky-600"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => setShowAddRow(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-bold hover:bg-gray-300"
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
            <div className="flex justify-between items-center px-2">
                <div className="text-xs text-gray-400 italic">
                    {isEditing ? "* Changes will be applied after clicking Save" : ""}
                </div>
                <button
                    onClick={fetchCustomConfig}
                    className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-sky-500 transition-colors uppercase tracking-wider"
                >
                    <FiRefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Last Updated: {new Date().toLocaleTimeString()}
                </button>
            </div>
        </div>
    );
};

export default CustomConfigCard;

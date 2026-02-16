import React, { useState, useEffect, useMemo } from 'react';
import { FiSettings, FiSearch, FiRefreshCw, FiEdit, FiInfo, FiChevronDown, FiCopy, FiCheck, FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface CustomConfigCardProps {
    merchantId: string;
    cluster?: string;
}

const CustomConfigCard: React.FC<CustomConfigCardProps> = ({ merchantId, cluster }) => {
    const [customConfig, setCustomConfig] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [showAddRow, setShowAddRow] = useState<string | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [editItems, setEditItems] = useState<any[]>([]);

    // Helper: Convert object to stable list for editing
    const toEditItems = (obj: any): any[] => {
        return Object.entries(obj || {}).map(([k, v]) => {
            const id = `item-${k}`;
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                return { id, k, isGroup: true, children: toEditItems(v) };
            }
            if (Array.isArray(v)) {
                return { id, k, isGroup: false, v: JSON.stringify(v) };
            }
            // Better handling for null/undefined/booleans/numbers
            let val = v;
            if (val === null || val === undefined) val = '';
            else if (typeof val !== 'boolean' && typeof val !== 'number') val = String(val);
            return { id, k, isGroup: false, v: val };
        });
    };

    // Helper: Convert list back to object for saving
    const fromEditItems = (items: any[]): any => {
        const obj: any = {};
        items.forEach(item => {
            if (!item.k.trim()) return;
            if (item.isGroup) {
                obj[item.k] = fromEditItems(item.children || []);
            } else {
                let val = item.v;
                if (val === 'true' || val === true) val = true;
                else if (val === 'false' || val === false) val = false;
                else if (typeof val === 'string' && val.trim() !== '') {
                    // Try to parse as number
                    if (!isNaN(Number(val)) && !val.includes(' ') && val.length < 15) {
                        val = Number(val);
                    }
                    // Try to parse as JSON (for arrays/nested objects that were kept as strings)
                    else if (val.startsWith('[') || val.startsWith('{')) {
                        try {
                            const parsed = JSON.parse(val);
                            val = parsed;
                        } catch (e) { }
                    }
                }
                obj[item.k] = val;
            }
        });
        return obj;
    };

    const fetchCustomConfig = async () => {
        setLoading(true);
        try {
            const response = await merchantService.getMerchantAttributes(merchantId, 0, 1, cluster);
            if (response.content && response.content.length > 0) {
                const merchantData = response.content[0];
                const config = merchantData.customConfig || merchantData.merchant?.customConfig || {};
                setCustomConfig(config);
            } else {
                setCustomConfig({});
            }
        } catch (error) {
            setCustomConfig({});
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
        if (!isEditing) {
            setEditItems(toEditItems(customConfig));
        } else {
            setShowAddRow(null);
        }
        setIsEditing(!isEditing);
    };

    const updateItemInList = (items: any[], id: string, updates: any): any[] => {
        return items.map(item => {
            if (item.id === id) return { ...item, ...updates };
            if (item.isGroup && item.children) {
                return { ...item, children: updateItemInList(item.children, id, updates) };
            }
            return item;
        });
    };

    const deleteItemFromList = (items: any[], id: string): any[] => {
        return items
            .filter(item => item.id !== id)
            .map(item => {
                if (item.isGroup && item.children) {
                    return { ...item, children: deleteItemFromList(item.children, id) };
                }
                return item;
            });
    };

    const addItemToGroupList = (items: any[], parentId: string, newItem: any): any[] => {
        return items.map(item => {
            if (item.id === parentId) return { ...item, children: [...(item.children || []), newItem] };
            if (item.isGroup && item.children) {
                return { ...item, children: addItemToGroupList(item.children, parentId, newItem) };
            }
            return item;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalConfig = fromEditItems(editItems);
            await merchantService.updateCustomConfig(merchantId, finalConfig, cluster);
            setCustomConfig(finalConfig);
            setIsEditing(false);
            setShowAddRow(null);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save configuration.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAttribute = (parentId: string | null) => {
        if (!newKey.trim()) return;
        const newItem = { id: Math.random().toString(36).substr(2, 9), k: newKey, v: newValue, isGroup: false };

        if (parentId === 'root' || !parentId) {
            setEditItems(prev => [...prev, newItem]);
        } else {
            setEditItems(prev => addItemToGroupList(prev, parentId, newItem));
        }
        setNewKey(''); setNewValue(''); setShowAddRow(null);
    };

    const handleAddGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup = { id: Math.random().toString(36).substr(2, 9), k: newGroupName, isGroup: true, children: [] };
        setEditItems(prev => [...prev, newGroup]);
        setNewGroupName(''); setShowAddGroup(false);
    };

    const copyValue = (key: string, value: any) => {
        const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="w-10 h-10 border-4 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-bold text-gray-400 titlecase tracking-widest">Loading configuration...</p>
            </div>
        );
    }

    const renderAttributeRow = (item: any, fullPathKey: string) => (
        <div key={item.id} className="flex items-center gap-3 group">
            <div className="flex-1 flex items-center shadow-sm border border-gray-200 rounded-md overflow-hidden bg-white">
                <div className="w-[40%] bg-[#f8f9fa] border-r border-gray-200 px-4 py-2.5 text-sm text-gray-700 flex items-center justify-between shrink-0">
                    {isEditing ? (
                        <input
                            type="text"
                            value={item.k}
                            onChange={(e) => setEditItems(prev => updateItemInList(prev, item.id, { k: e.target.value }))}
                            className="bg-transparent border-none outline-none w-full text-gray-900 focus:ring-0 p-0 font-medium"
                            placeholder="Key"
                        />
                    ) : <span className="truncate font-medium text-gray-900">{item.k}</span>}
                    <FiChevronDown className="text-gray-400" size={12} />
                </div>
                <div className="flex-1 relative">
                    {isEditing ? (
                        <input
                            type="text"
                            value={String(item.v ?? '')}
                            onChange={(e) => setEditItems(prev => updateItemInList(prev, item.id, { v: e.target.value }))}
                            className="w-full border-none px-4 py-2.5 text-sm focus:ring-0 outline-none transition-all bg-white text-gray-800 font-medium"
                            placeholder="Value"
                        />
                    ) : (
                        <div className="w-full px-4 py-2.5 text-sm text-gray-500 bg-transparent flex items-center justify-between group/val">
                            <span className="truncate text-gray-800 font-medium">{String(item.v ?? '')}</span>
                            <button onClick={() => copyValue(fullPathKey, item.v)} className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all">
                                {copiedKey === fullPathKey ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {isEditing && (
                <button onClick={() => setEditItems(prev => deleteItemFromList(prev, item.id))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm shrink-0 bg-white">
                    <FiTrash2 size={12} />
                </button>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-blue-900 tracking-tight">Cloud Configuration</h2>
                        <FiInfo size={14} className="text-gray-300 cursor-help" />
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button onClick={handleEditToggle} className="px-6 py-2 bg-[#1a3a6d] text-white rounded-md text-xs font-bold hover:bg-[#152e56] transition-all flex items-center gap-2 shadow-sm">
                                <FiEdit size={14} /> Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#1a3a6d] text-white rounded-md text-xs font-bold hover:bg-[#152e56] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
                                    <FiCheck size={14} /> Save
                                </button>
                                <button onClick={handleEditToggle} className="px-6 py-2 bg-[#f87171] text-white rounded-md text-xs font-bold hover:bg-[#ef4444] transition-all flex items-center gap-2 shadow-sm">
                                    <FiX size={14} /> Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-start gap-2 text-gray-500 text-sm leading-relaxed max-w-5xl">
                    <FiSettings className="mt-1 flex-shrink-0 text-blue-900/40" size={16} />
                    <p className="text-xs font-medium text-gray-400 leading-relaxed">Cloud Configuration allows for custom key-value pairs and structured attribute groups.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="mb-6 relative max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="text" placeholder="Search attributes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 transition-all shadow-sm" />
                    </div>

                    {(() => {
                        const items = useMemo(() => {
                            if (isEditing) return editItems;
                            return toEditItems(customConfig);
                        }, [isEditing, editItems, customConfig]);

                        if (!items.length && !isEditing) return <div className="text-center py-20 text-gray-400"><p className="text-sm">No configuration data found.</p></div>;

                        const q = searchQuery.toLowerCase();
                        const filtered = items.filter(it => !searchQuery || it.k.toLowerCase().includes(q) || String(it.v).toLowerCase().includes(q) || (it.children && JSON.stringify(it.children).toLowerCase().includes(q)));

                        const renderAddRowUI = (parentId: string) => (
                            <div className="mb-6 p-5 bg-[#f0f7ff] rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-2">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-blue-900 titlecase tracking-widest mb-1.5">Key Name</label>
                                    <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. api_base_url" className="w-full px-4 py-2 text-sm border border-gray-200 rounded-md bg-white outline-none" />
                                </div>
                                <div className="flex-[1.5]">
                                    <label className="block text-[10px] font-bold text-blue-900 titlecase tracking-widest mb-1.5">Value</label>
                                    <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value content" className="w-full px-4 py-2 text-sm border border-gray-200 rounded-md bg-white outline-none" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button onClick={() => handleAddAttribute(parentId)} className="px-6 py-2 bg-[#1a3a6d] text-white rounded-md text-xs font-bold hover:bg-[#152e56]">Add</button>
                                    <button onClick={() => setShowAddRow(null)} className="px-6 py-2 bg-white text-gray-600 rounded-md text-xs font-bold border border-gray-200">Cancel</button>
                                </div>
                            </div>
                        );

                        const primitives = filtered.filter(it => !it.isGroup);
                        const groups = filtered.filter(it => it.isGroup);

                        return (
                            <div className="space-y-12">
                                {/* Top-level Attributes Grid */}
                                <div>
                                    <div className="bg-[#eaeff5] px-6 py-2 border border-gray-200 rounded-md mb-6 flex items-center justify-between">
                                        <h4 className="text-[11px] font-bold text-gray-600">Attributes</h4>
                                        {isEditing && (
                                            <button onClick={() => setShowAddRow('root')} className="bg-[#1a3a6d] text-white px-4 py-1.5 rounded-md text-[10px] font-bold">Add More Attributes</button>
                                        )}
                                    </div>
                                    {showAddRow === 'root' && renderAddRowUI('root')}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                                        {primitives.map(it => renderAttributeRow(it, it.k))}
                                    </div>
                                </div>

                                {/* Groups Sections */}
                                {groups.map(group => (
                                    <div key={group.id} className="animate-in fade-in slide-in-from-bottom-2">
                                        <div className="bg-[#eaeff5] px-6 py-2 border border-gray-200 rounded-md mb-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="px-4 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-500 flex items-center justify-between min-w-[200px]">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={group.k}
                                                            onChange={(e) => setEditItems(prev => updateItemInList(prev, group.id, { k: e.target.value }))}
                                                            className="bg-transparent border-none outline-none w-full text-gray-800 focus:ring-0 p-0 font-bold"
                                                        />
                                                    ) : <span className="font-bold">{group.k}</span>}
                                                    <FiChevronDown size={12} className="text-gray-400" />
                                                </div>
                                            </div>
                                            {isEditing && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowAddRow(group.id)} className="bg-[#1a3a6d] text-white px-4 py-1.5 rounded-md text-[10px] font-bold">Add More Attributes</button>
                                                    <button onClick={() => setEditItems(prev => deleteItemFromList(prev, group.id))} className="bg-[#f87171] text-white px-4 py-1.5 rounded-md text-[10px] font-bold">Remove Attribute Group</button>
                                                </div>
                                            )}
                                        </div>
                                        {showAddRow === group.id && renderAddRowUI(group.id)}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                                            {(group.children || []).map(child => renderAttributeRow(child, `${group.k}.${child.k}`))}
                                        </div>
                                    </div>
                                ))}

                                {isEditing && (
                                    <div className="pt-10 border-t border-gray-100 flex flex-col items-center gap-4 text-center">
                                        <p className="text-xs text-gray-400 font-medium max-w-lg">If you would like to add attribute list by group, you may create Group attribute by clicking the below button.</p>
                                        {showAddGroup ? (
                                            <div className="flex gap-2 items-center w-full max-w-md">
                                                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group Name..." className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-md outline-none" />
                                                <button onClick={handleAddGroup} className="px-4 py-2 bg-[#1a3a6d] text-white rounded-md text-xs font-bold">Create</button>
                                                <button onClick={() => setShowAddGroup(false)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-xs font-bold">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setShowAddGroup(true)} className="px-8 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
                                                <FiPlus /> Add Group Attribute
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>

            <div className="flex justify-between items-center px-4">
                <div className="text-[10px] font-black text-gray-400 tracking-widest titlecase">{isEditing ? "* Changes will be applied after clicking Save" : `Last Updated: ${new Date().toLocaleTimeString()}`}</div>
                <button onClick={fetchCustomConfig} className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-blue-900 transition-all titlecases tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                    <FiRefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh Data
                </button>
            </div>
        </div>
    );
};

export default CustomConfigCard;

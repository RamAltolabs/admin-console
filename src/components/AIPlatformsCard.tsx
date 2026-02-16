import React, { useState, useEffect } from 'react';
import {
    FiPlus, FiInfo, FiArrowLeft, FiEdit2, FiTrash2, FiAlertCircle
} from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface AIPlatformsCardProps {
    merchantId: string;
    cluster?: string;
}

const CATEGORY_METADATA: { [key: string]: { name: string, imagePath: string, description: string } } = {
    'Natural_Language': {
        name: 'Natural Language',
        imagePath: 'img/aiagents/NaturalLanguage.svg',
        description: 'AI NLP (Artificial Intelligence Natural Language Processing) is a branch of artificial intelligence that deals with analyzing, understanding, and generating human language.'
    },
    'Generative_AI': {
        name: 'Generative AI',
        imagePath: 'img/aiagents/generativeAI.svg',
        description: 'Generative AI is a type of Artificial Intelligence that focuses on the creation of new data or content, such as images, audio, or text, from scratch.'
    },
    'Computer_Vision': {
        name: 'Vision AI',
        imagePath: 'img/aiagents/ComputerVision.svg',
        description: 'AI computer vision is a field of artificial intelligence that uses algorithms to analyze and interpret images in order to detect objects, recognize patterns, and track movements.'
    },
    'Predictive_Analysis': {
        name: 'Predictive Analysis',
        imagePath: 'img/aiagents/PredictiveAnalysis.svg',
        description: 'AI predictive analysis is a process that uses machine learning algorithms to analyze data and make predictions about future outcomes.'
    },
    'Optical_Character_Recognition': {
        name: 'Optical Character Recognition',
        imagePath: 'img/aiagents/OpticalScan.svg',
        description: 'AI Optical Scan is a form of artificial intelligence technology that uses optical scanning and pattern recognition to identify objects, people, and text.'
    },
    'Translation_AI': {
        name: 'Translation AI',
        imagePath: 'img/aiagents/Translation.svg',
        description: 'AI translation is the use of artificial intelligence technology to assist in the translation of text from one language to another.'
    },
    'Speech_to_Text': {
        name: 'Speech to Text',
        imagePath: 'img/aiagents/SpeechtoText.svg',
        description: 'AI Speech to Text is a technology that uses artificial intelligence to convert spoken words into written text. It can be used for dictation and transcription.'
    },
    'Recommendation': {
        name: 'Recommendation',
        imagePath: 'img/aiagents/Recommendation.svg',
        description: 'AI recommendation is the use of artificial intelligence to provide tailored advice or product recommendations to users.'
    },
    'Classification': {
        name: 'Classification',
        imagePath: 'img/aiagents/Classification.svg',
        description: 'AI classification is a type of machine learning technique that uses algorithms to automatically classify data into predefined groups.'
    },
    'Other': {
        name: 'Other AI Platforms',
        imagePath: 'img/aiagents/ai-default.svg', // Fallback
        description: 'Other User configured AI platforms and services.'
    }
};

const AIPlatformsCard: React.FC<AIPlatformsCardProps> = ({ merchantId, cluster }) => {
    const [config, setConfig] = useState<any>(null);
    const [categorizedData, setCategorizedData] = useState<{ [key: string]: any[] }>({});
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'overview' | 'details' | 'add' | 'configure'>('overview');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    // Form state can be complex, using simple state for demonstration layout
    const [formData, setFormData] = useState<any>({});
    const [attributes, setAttributes] = useState<{ key: string, value: string }[]>([{ key: '', value: '' }]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const merchant = await merchantService.getMerchantById(merchantId, cluster);
            const aiConfigs = merchant?.aiConfigs || {};
            setConfig(aiConfigs);

            const newData: { [key: string]: any[] } = {};
            Object.entries(aiConfigs).forEach(([key, value]) => {
                const item = typeof value === 'object' && value !== null
                    ? { ...value, _originalKey: key }
                    : { value: value, _originalKey: key, type: 'Other' };

                const itemType = (item as any).type || 'Other';
                if (!newData[itemType]) {
                    newData[itemType] = [];
                }
                newData[itemType].push(item);
            });
            setCategorizedData(newData);
        } catch (error) {
            console.error('Failed to load AI Configs:', error);
            setNotification({ type: 'error', message: 'Failed to load AI configurations.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, [merchantId, cluster]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (loading) {
        return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div></div>;
    }

    const isEmpty = Object.keys(categorizedData).length === 0;

    const handleCardClick = (category: string) => {
        setSelectedCategory(category);
        if (view === 'add') {
            setView('configure');
            setIsEditing(false);
            setFormData({}); // Reset form
            setAttributes([{ key: '', value: '' }]);
        } else {
            setView('details');
        }
    };

    const handleBack = () => {
        if (view === 'configure') {
            setView('add');
        } else if (view === 'add') {
            setView('overview');
        } else {
            setView('overview');
            setSelectedCategory(null);
        }
    };

    const handleAddMode = () => {
        setIsEditing(false);
        setView('add');
    };

    const handleCancel = () => {
        setView('overview');
        setSelectedCategory(null);
    }

    const handleEdit = (item: any) => {
        setIsEditing(true);
        setSelectedCategory(item.type || 'Other');
        setFormData({
            ...item,
            apiKey: item.apiKey || item.workspaceId // Map either to apiKey field
        });
        setAttributes(item.attributes && Array.isArray(item.attributes) && item.attributes.length > 0
            ? [...item.attributes, { key: '', value: '' }]
            : [{ key: '', value: '' }]);
        setView('configure');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Normalize current configs to array
            let currentConfigs: any[] = [];
            if (Array.isArray(config)) {
                currentConfigs = config;
            } else if (typeof config === 'object' && config !== null) {
                currentConfigs = Object.values(config).filter(v => typeof v === 'object' && v !== null);
            }

            // Prepare the config item
            const newConfigItem: any = {
                ...formData,
                aiName: formData.aiName || '',
                status: formData.status || 'Active',
                type: selectedCategory || 'Other',
                attributes: attributes.filter(attr => attr.key.trim() !== ''),
                generativeAiId: formData.generativeAiId || '',
                aiId: formData.aiId || Math.floor(Math.random() * 10000000000000000).toString(),
            };

            // Add specific fields based on category
            const normalizedType = selectedCategory?.toLowerCase().replace(/[\s_]/g, '') || '';
            const metaKey = Object.keys(CATEGORY_METADATA).find(key => key.toLowerCase().replace(/[\s_]/g, '') === normalizedType) || selectedCategory;

            if (metaKey === 'Natural_Language') {
                newConfigItem.ai = formData.ai || 'WATSONAI';
                newConfigItem.username = formData.username || '';
                newConfigItem.password = formData.password || '';
                newConfigItem.workspaceId = formData.workspaceId || '';
                newConfigItem.sessionTimeout = formData.sessionTimeout || '1000';
            } else if (metaKey === 'Generative_AI') {
                newConfigItem.ai = formData.ai || 'OPENAI';
                // Some APIs use workspaceId for the key, some use apiKey. We'll set both for compatibility if needed.
                newConfigItem.workspaceId = formData.apiKey || formData.workspaceId || '';
                newConfigItem.apiKey = formData.apiKey || '';
            } else if (metaKey === 'Computer_Vision') {
                newConfigItem.apiKey = formData.apiKey || '';
                newConfigItem.model = formData.model || '';
            }

            let updatedConfigs: any[] = [];
            if (isEditing) {
                // Update existing item
                updatedConfigs = currentConfigs.map(item => item.aiId === newConfigItem.aiId ? newConfigItem : item);
            } else {
                // Append new item
                updatedConfigs = [...currentConfigs, newConfigItem];
            }

            const payload: any = {
                id: merchantId,
                aiConfigs: updatedConfigs
            };

            console.log(isEditing ? 'Updating' : 'Saving', 'AI Config with payload:', payload);
            await merchantService.updateMerchantAttributes(merchantId, payload, cluster);

            setNotification({ type: 'success', message: `AI Platform Configuration ${isEditing ? 'Updated' : 'Saved'} Successfully!` });

            // Refresh data gracefully
            await fetchConfig();
            setView('overview');
            setSelectedCategory(null);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save AI Platform:', error);
            setNotification({ type: 'error', message: 'Failed to save configuration. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (aiIdToDelete: string) => {
        if (!window.confirm('Are you sure you want to delete this AI configuration?')) return;

        setLoading(true);
        try {
            // Normalize current config to array
            let currentConfigs: any[] = [];
            if (Array.isArray(config)) {
                currentConfigs = config;
            } else if (typeof config === 'object' && config !== null) {
                currentConfigs = Object.values(config).filter(v => typeof v === 'object' && v !== null);
            }

            const updatedConfigs = currentConfigs.filter((item: any) => item.aiId !== aiIdToDelete);

            const payload: any = {
                id: merchantId,
                aiConfigs: updatedConfigs
            };

            console.log('Deleting AI Config with payload:', payload);
            await merchantService.updateMerchantAttributes(merchantId, payload, cluster);

            setNotification({ type: 'error', message: 'AI Platform Configuration Deleted Successfully.' });

            // Refresh data gracefully
            await fetchConfig();
        } catch (error) {
            console.error('Failed to delete AI Platform:', error);
            setNotification({ type: 'error', message: 'Failed to delete configuration. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const getCategoryInfo = (type: string) => {
        // Try direct match
        if (CATEGORY_METADATA[type]) return CATEGORY_METADATA[type];

        // Try finding a match ignoring case and underscores/spaces
        const normalizedType = type.toLowerCase().replace(/[\s_]/g, '');
        const match = Object.keys(CATEGORY_METADATA).find(key =>
            key.toLowerCase().replace(/[\s_]/g, '') === normalizedType
        );

        if (match) return CATEGORY_METADATA[match];

        return {
            name: type.replace(/_/g, ' '),
            imagePath: CATEGORY_METADATA['Other']?.imagePath || '',
            description: `Configuration for ${type.replace(/_/g, ' ')}`
        };
    };

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return '';
        const baseURL = 'https://it-inferno.neocloud.ai/';
        return `${baseURL}${imagePath}`;
    };

    const renderAttributeFields = () => (
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Add Attributes</label>
            {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" placeholder="Enter Key" className="flex-1 text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={attr.key} onChange={(e) => {
                        const newAttrs = [...attributes];
                        newAttrs[idx].key = e.target.value;
                        setAttributes(newAttrs);
                    }} />
                    <input type="text" placeholder="Enter Value" className="flex-1 text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={attr.value} onChange={(e) => {
                        const newAttrs = [...attributes];
                        newAttrs[idx].value = e.target.value;
                        setAttributes(newAttrs);
                    }} />
                    {idx === attributes.length - 1 && (
                        <button className="text-blue-900 hover:text-blue-700" onClick={() => setAttributes([...attributes, { key: '', value: '' }])}>
                            <FiPlus size={16} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );

    const renderConfigurationForm = () => {
        if (!selectedCategory) return null;

        // Determine category key for logic
        const normalizedType = selectedCategory.toLowerCase().replace(/[\s_]/g, '');
        const metaKey = Object.keys(CATEGORY_METADATA).find(key => key.toLowerCase().replace(/[\s_]/g, '') === normalizedType) || selectedCategory;

        const commonFields = (
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        placeholder="Enter Name"
                        className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.aiName || ''}
                        onChange={(e) => setFormData({ ...formData, aiName: e.target.value })}
                    />
                </div>
            </div>
        );

        let specificFields: JSX.Element | null = null;

        if (metaKey === 'Computer_Vision') {
            specificFields = (
                <>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">API Key</label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="Enter API Key"
                                className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                                value={formData.apiKey || ''}
                                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            />
                            <i className="absolute right-3 top-2.5 text-gray-400 cursor-pointer text-xs">👁️</i>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Model</label>
                        <select
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={formData.model || ''}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        >
                            <option value="">Select Model</option>
                            <option value="YOLOv8">YOLOv8</option>
                            <option value="ResNet">ResNet</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Status</label>
                        <select
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={formData.status || 'Active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </>
            );
        } else if (metaKey === 'Natural_Language') {
            specificFields = (
                <>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">AI Platform <span className="text-red-500">*</span></label>
                        <select
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={formData.ai || 'WATSONAI'}
                            onChange={(e) => setFormData({ ...formData, ai: e.target.value })}
                        >
                            <option value="WATSONAI">IBM Watson AI</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Session Timeout <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter Session Timeout"
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.sessionTimeout || ''}
                            onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Status</label>
                        <select
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={formData.status || 'Active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Username <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter Username"
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                            value={formData.username || ''}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="Enter Password"
                                className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 pr-8 bg-blue-50"
                                value={formData.password || ''}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <i className="absolute right-3 top-2.5 text-gray-400 cursor-pointer text-xs">👁️</i>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Workspace Id <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter Workspace Id"
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.workspaceId || ''}
                            onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Fallback</label>
                        <select className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option>Select Fallback</option>
                        </select>
                    </div>
                </>
            );
        } else if (metaKey === 'Generative_AI') {
            // Using the requested dropdown items
            specificFields = (
                <>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">AI Platform <span className="text-red-500">*</span></label>
                        <select
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={formData.ai || ''}
                            onChange={(e) => setFormData({ ...formData, ai: e.target.value })}
                        >
                            <option value="">Select AI Platform</option>
                            <option value="OpenAI">OpenAI</option>
                            <option value="Google Gemini AI">Google Gemini AI</option>
                            <option value="Meta Llama3">Meta Llama3</option>
                            <option value="Microsoft Azure OpenAI">Microsoft Azure OpenAI</option>
                            <option value="Amazon Bedrock">Amazon Bedrock</option>
                            <option value="Anthropic Claude AI">Anthropic Claude AI</option>
                            <option value="Perplexity AI">Perplexity AI</option>
                            <option value="Deepseek AI">Deepseek AI</option>
                            <option value="Mistral AI">Mistral AI</option>
                            <option value="IBM WatsonX">IBM WatsonX</option>
                            <option value="Cohere">Cohere</option>
                            <option value="Hugging Face">Hugging Face</option>
                            <option value="Eleven Labs">Eleven Labs</option>
                        </select>
                        {!formData.ai && <p className="text-[10px] text-red-500">Please select AI Platform</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">API Key <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter API Key"
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.apiKey || ''}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Status</label>
                        <select
                            className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={formData.status || 'Active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </>
            );
        } else if (metaKey === 'Predictive_Analysis') {
            specificFields = null; // Only name and attributes
        } else {
            specificFields = (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Status</label>
                    <select className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                </div>
            );
        }

        return (
            <div className="flex gap-8">
                {/* Left Side Icon */}
                <div className="w-48 flex-shrink-0 flex flex-col items-center pt-4">
                    {(() => {
                        const info = getCategoryInfo(selectedCategory);
                        const imageUrl = getImageUrl(info.imagePath);
                        return imageUrl ? (
                            <img src={imageUrl} alt={info.name} className="w-32 h-32 object-contain" />
                        ) : (
                            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        );
                    })()}
                </div>

                {/* Right Side Form */}
                <div className="flex-1 space-y-4 max-w-3xl">
                    {commonFields}
                    {specificFields}
                    {renderAttributeFields()}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {notification && (
                    <div className={`py-2 px-4 transition-all duration-500 animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2 ${notification.type === 'success' ? 'bg-green-50 text-green-700 border-b border-green-100' : 'bg-red-50 text-red-700 border-b border-red-100'
                        }`}>
                        {notification.type === 'success' ? <FiPlus size={14} className="rotate-45" /> : <FiAlertCircle size={14} />}
                        <span className="text-[10px] font-bold tracking-wider">{notification.message}</span>
                        <button onClick={() => setNotification(null)} className="ml-auto text-[10px] titlecase font-bold opacity-50 hover:opacity-100">Close</button>
                    </div>
                )}
                <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        {view === 'overview' ? (
                            <h3 className="text-sm font-bold text-blue-900 titlecase tracking-widest flex items-center gap-2">
                                AI Platforms
                                <FiInfo size={14} className="text-gray-400 cursor-help" title="Configure AI Platforms" />
                            </h3>
                        ) : view === 'add' ? (
                            <h3 className="text-sm font-bold text-blue-900 titlecase tracking-widest flex items-center gap-2">
                                <span className="text-blue-900">AI Platforms</span>
                                <span className="text-gray-400">»</span>
                                <span className="text-gray-500">(New)</span>
                                <FiInfo size={14} className="text-gray-400 cursor-help" />
                            </h3>
                        ) : view === 'configure' ? (
                            <h3 className="text-sm font-bold text-blue-900 titlecase tracking-widest flex items-center gap-2">
                                <span className="text-blue-900">AI Platforms</span>
                                <span className="text-gray-400">»</span>
                                <span className="text-gray-500">{selectedCategory ? getCategoryInfo(selectedCategory).name : ''} (New)</span>
                                <FiInfo size={14} className="text-gray-400 cursor-help" />
                            </h3>
                        ) : (
                            <h3 className="text-sm font-bold text-blue-900 titlecase tracking-widest flex items-center gap-2 cursor-pointer" onClick={handleBack}>
                                <span className="text-gray-500 hover:text-blue-900 transition-colors">AI Platforms</span>
                                <span className="text-gray-400">»</span>
                                <span>{selectedCategory ? getCategoryInfo(selectedCategory).name : selectedCategory}</span>
                                <FiInfo size={14} className="text-gray-400 cursor-help" />
                            </h3>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {view === 'overview' ? (
                            <button
                                onClick={handleAddMode}
                                className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                                <FiPlus size={12} /> Add
                            </button>
                        ) : view === 'add' ? (
                            <button
                                onClick={handleCancel}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                            >
                                <FiAlertCircle size={12} className="rotate-180" /> Cancel
                            </button>
                        ) : view === 'configure' ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                >
                                    <FiPlus size={12} /> Save
                                </button>
                                <button onClick={handleCancel} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm">
                                    <FiAlertCircle size={12} className="rotate-180" /> Cancel
                                </button>
                                <button onClick={handleBack} className="bg-white hover:bg-gray-50 text-blue-900 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-900 flex items-center gap-1 transition-colors">
                                    <FiArrowLeft size={12} /> Previous
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                    <FiPlus size={12} /> Add More
                                </button>
                                <button onClick={handleBack} className="bg-white hover:bg-gray-50 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 transition-colors">
                                    <FiArrowLeft size={12} /> Back
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {view === 'overview' ? (
                        isEmpty ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <FiAlertCircle size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-medium">No AI Platforms configuration found.</p>
                                <button
                                    onClick={handleAddMode}
                                    className="mt-4 text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                                >
                                    <FiPlus size={12} /> Add New Platform
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.keys(categorizedData).sort().map(type => {
                                    const info = getCategoryInfo(type);
                                    const count = categorizedData[type].length;
                                    const imageUrl = getImageUrl(info.imagePath);

                                    return (
                                        <div
                                            key={type}
                                            onClick={() => handleCardClick(type)}
                                            className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all hover:border-blue-200 group relative items-start"
                                        >
                                            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 overflow-hidden border border-blue-50">
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={info.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{info.name}</h4>
                                                    {count > 0 && (
                                                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ml-2 flex-shrink-0">
                                                            {count}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-4">
                                                    {info.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : view === 'add' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(CATEGORY_METADATA).map(([key, info]) => {
                                if (key === 'Other') return null; // Skip 'Other' for the add screen unless desired
                                const imageUrl = getImageUrl(info.imagePath);
                                return (
                                    <div
                                        key={key}
                                        onClick={() => handleCardClick(key)}
                                        className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all hover:border-blue-200 group relative items-start"
                                    >
                                        <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 overflow-hidden border border-blue-50">
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={info.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-bold text-gray-900 leading-tight">{info.name}</h4>
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-4">
                                                {info.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : view === 'configure' ? (
                        renderConfigurationForm()
                    ) : (
                        // Details View
                        (() => {
                            const items = (selectedCategory && categorizedData[selectedCategory]) || [];
                            const categoryInfo = selectedCategory ? getCategoryInfo(selectedCategory) : null;
                            const imageUrl = categoryInfo ? getImageUrl(categoryInfo.imagePath) : '';

                            if (items.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <FiAlertCircle size={48} className="mb-4 opacity-20" />
                                        <p className="text-sm font-medium mb-4">No configuration found for {categoryInfo?.name}.</p>
                                        <div className="flex gap-2">
                                            <button onClick={handleBack} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                                                Go Back
                                            </button>
                                            <button
                                                onClick={() => { setView('configure'); setFormData({}); setAttributes([{ key: '', value: '' }]); }}
                                                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors flex items-center gap-2"
                                            >
                                                <FiPlus size={12} /> Configure New
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map((item, index) => (
                                        <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6 hover:shadow-sm transition-shadow relative">
                                            {/* Action Icons */}
                                            <div className="absolute top-4 right-4 flex gap-3 text-gray-400">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="hover:text-blue-600 transition-colors"
                                                >
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.aiId)}
                                                    className="hover:text-red-500 transition-colors"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>

                                            {/* Top Icon/Image */}
                                            <div className="w-full h-32 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100 self-center p-4">
                                                <div className="flex flex-col items-center gap-2 p-2 text-center w-full h-full justify-center">
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={categoryInfo?.name} className="h-16 w-auto object-contain mb-2" />
                                                    ) : (
                                                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-400 mb-2">Img</div>
                                                    )}
                                                    <span className="text-[10px] font-bold text-cyan-800 titlecase tracking-widest break-words w-full truncate px-2">
                                                        {item._originalKey || item.name || 'AI Platform'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 py-1 space-y-3">
                                                {Object.entries(item).map(([key, value]) => {
                                                    // Skip internal keys, type, and complex objects
                                                    if (key.startsWith('_') || key === 'type' || (typeof value === 'object' && value !== null)) return null;
                                                    return (
                                                        <div key={key} className="flex items-center justify-between text-xs border-b border-gray-50 pb-1 last:border-0">
                                                            <span className="font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                            <span className="font-medium text-gray-900 truncate max-w-[50%] text-right" title={String(value)}>
                                                                {key.toLowerCase().includes('password') ? '******' : String(value)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIPlatformsCard;

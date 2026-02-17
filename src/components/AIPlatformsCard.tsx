import React, { useState, useEffect } from 'react';
import {
    FiPlus, FiInfo, FiArrowLeft, FiEdit2, FiTrash2, FiAlertCircle, FiEye, FiEyeOff
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
        description: 'Understand and generate human language for advanced communication and analysis.'
    },
    'Generative_AI': {
        name: 'Generative AI',
        imagePath: 'img/aiagents/generativeAI.svg',
        description: 'Focus on the creation of new data or content, such as images, audio, or text, from scratch.'
    },
    'Computer_Vision': {
        name: 'Computer Vision',
        imagePath: 'img/aiagents/ComputerVision.svg',
        description: 'Analyze and interpret images to detect objects, recognize patterns, and track movements.'
    },
    'Predictive_Analysis': {
        name: 'Predictive Analysis',
        imagePath: 'img/aiagents/PredictiveAnalysis.svg',
        description: 'Use machine learning algorithms to analyze data and make predictions about future outcomes.'
    },
    'Optical_Character_Recognition': {
        name: 'Optical Scan',
        imagePath: 'img/aiagents/OpticalScan.svg',
        description: 'Identify objects, people, and text using pattern recognition and high-speed scanning.'
    },
    'Translation_AI': {
        name: 'Translation AI',
        imagePath: 'img/aiagents/Translation.svg',
        description: 'Seamlessly translate text and audio between multiple languages in real-time.'
    },
    'Speech_to_Text': {
        name: 'Speech to Text',
        imagePath: 'img/aiagents/SpeechtoText.svg',
        description: 'Convert spoken words into high-accuracy written text for transcription and commands.'
    },
    'Recommendation': {
        name: 'Recommendation',
        imagePath: 'img/aiagents/Recommendation.svg',
        description: 'Provide tailored advice and product recommendations based on user behavior metrics.'
    },
    'Classification': {
        name: 'Classification',
        imagePath: 'img/aiagents/Classification.svg',
        description: 'Automatically classify data into predefined groups using advanced supervised learning.'
    },
    'Other': {
        name: 'Other AI Platforms',
        imagePath: 'img/aiagents/ai-default.svg',
        description: 'Custom AI configuration for enterprise needs.'
    }
};

const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    const baseURL = 'https://it-inferno.neocloud.ai/';
    // Handle leading slash if present in imagePath
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${baseURL}${cleanPath}`;
};

export function getAiAgentImg(name: string) {
    let iconPath = "";
    let agent = name && name.toLowerCase() !== "" ? name.toLowerCase().trim() : "";

    const iconList = [
        { name: "watsonai", path: "ibmwatson.png" },
        { name: "openai", path: "openai.svg" },
        { name: "googleai", path: "google-ai.svg" },
        { name: "llama3", path: "llama3.svg" },
        { name: "azureai", path: "azure-ai.svg" },
        { name: "bedrock", path: "bedrock.svg" },
        { name: "claudeai", path: "cloude-ai.svg" },
        { name: "mondeeai", path: "mondee-ai.svg" },
        { name: "solai", path: "solai.png" },
        { name: "alexa", path: "aws.png" },
        { name: "googlebardalpha", path: "google-bard-alpha.png" },
        { name: "vertexai", path: "google-vertex-ai.png" },
        { name: "visionai", path: "ComputerVision.svg" },
        { name: "perplexityai", path: "perplexity-ai.svg" },
        { name: "deepseekai", path: "deepseek-ai.svg" },
        { name: "mistralai", path: "mistral-ai.svg" },
        { name: "ibmwatsonx", path: "ibm-watson-x.svg" },
        { name: "huggingface", path: "hugging-face.svg" },
        { name: "cohere", path: "cohere.svg" },
        { name: "elevenlabs", path: "elevenlabs.svg" },
    ];

    const obj = iconList.find(i => agent === i.name);
    iconPath = obj ? obj.path : "";
    return iconPath ? `/img/aiagents/${iconPath}` : "";
}

const AIPlatformsCard: React.FC<AIPlatformsCardProps> = ({ merchantId, cluster }) => {
    const [config, setConfig] = useState<any>(null);
    const [categorizedData, setCategorizedData] = useState<{ [key: string]: any[] }>({});
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'overview' | 'details' | 'add' | 'configure'>('overview');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [attributes, setAttributes] = useState<{ key: string, value: string }[]>([{ key: '', value: '' }]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const merchant = await merchantService.getMerchantById(merchantId, cluster);
            const aiConfigs = merchant?.aiConfigs || [];
            setConfig(aiConfigs);

            const newData: { [key: string]: any[] } = {};
            if (Array.isArray(aiConfigs)) {
                aiConfigs.forEach((item: any) => {
                    const itemType = item.type || item.category || 'Other';
                    // Normalize type to match CATEGORY_METADATA keys strictly
                    const normalizedKey = Object.keys(CATEGORY_METADATA).find(k =>
                        k.toLowerCase() === itemType.toLowerCase() ||
                        k.replace(/_/g, '').toLowerCase() === itemType.replace(/[\s_]/g, '').toLowerCase() ||
                        CATEGORY_METADATA[k].name.toLowerCase() === itemType.toLowerCase()
                    ) || 'Other';

                    if (!newData[normalizedKey]) {
                        newData[normalizedKey] = [];
                    }
                    newData[normalizedKey].push(item);
                });
            }
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

    const handleCardClick = (categoryKey: string) => {
        setSelectedCategory(categoryKey);
        if (view === 'add') {
            setView('configure');
            setIsEditing(false);
            setFormData({
                aiName: CATEGORY_METADATA[categoryKey]?.name || '',
                status: 'Active',
                sessionTimeout: '1000'
            });
            setAttributes([{ key: '', value: '' }]);
        } else {
            setView('details');
        }
    };

    const handleBack = () => {
        if (view === 'configure') {
            if (isEditing) {
                setView('details');
            } else {
                setView('add');
            }
        } else if (view === 'details' || view === 'add') {
            setView('overview');
            setSelectedCategory(null);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setView('overview');
        setSelectedCategory(null);
        setIsEditing(false);
    }

    const handleEdit = (item: any) => {
        setIsEditing(true);
        const catKey = Object.keys(CATEGORY_METADATA).find(k =>
            CATEGORY_METADATA[k].name === item.type || k === item.type
        ) || 'Other';

        setSelectedCategory(catKey);
        setFormData({ ...item });
        setAttributes(item.attributes && Array.isArray(item.attributes) && item.attributes.length > 0
            ? [...item.attributes]
            : [{ key: '', value: '' }]);
        setView('configure');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let currentConfigs = Array.isArray(config) ? [...config] : [];

            const newConfigItem: any = {
                ...formData,
                type: CATEGORY_METADATA[selectedCategory!]?.name || selectedCategory,
                attributes: attributes.filter(attr => attr.key.trim() !== ''),
                aiId: formData.aiId || Math.floor(Math.random() * 1000000).toString(),
            };

            let updatedConfigs;
            if (isEditing) {
                updatedConfigs = currentConfigs.map(item => item.aiId === newConfigItem.aiId ? newConfigItem : item);
            } else {
                updatedConfigs = [newConfigItem, ...currentConfigs];
            }

            await merchantService.updateMerchantAttributes(merchantId, { id: merchantId, aiConfigs: updatedConfigs }, cluster);
            setNotification({ type: 'success', message: `AI Platform ${isEditing ? 'Updated' : 'Created'} Successfully!` });

            await fetchConfig();
            setView('overview');
            setSelectedCategory(null);
        } catch (error) {
            console.error('Failed to save AI Platform:', error);
            setNotification({ type: 'error', message: 'Failed to save configuration.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (aiId: string) => {
        if (!window.confirm('Delete this AI configuration?')) return;
        setLoading(true);
        try {
            const updatedConfigs = (config || []).filter((item: any) => item.aiId !== aiId);
            await merchantService.updateMerchantAttributes(merchantId, { id: merchantId, aiConfigs: updatedConfigs }, cluster);
            setNotification({ type: 'success', message: 'AI Platform Deleted.' });
            await fetchConfig();
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to delete platform.' });
        } finally {
            setLoading(false);
        }
    };

    const renderAttributeFields = () => (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 titlecase tracking-widest ml-1">Add Attributes</label>
                    <p className="text-[9px] text-gray-400 font-medium ml-1">Define custom parameters for this configuration</p>
                </div>
                <button
                    onClick={() => setAttributes([...attributes, { key: '', value: '' }])}
                    className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-900 rounded-xl hover:bg-blue-900 hover:text-white transition-all shadow-sm"
                    title="Add Attribute"
                >
                    <FiPlus size={16} />
                </button>
            </div>

            <div className="space-y-3">
                {attributes.map((attr, idx) => (
                    <div key={idx} className="flex gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Enter Key"
                                className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all shadow-sm bg-white"
                                value={attr.key}
                                onChange={(e) => {
                                    const newAttrs = [...attributes];
                                    newAttrs[idx].key = e.target.value;
                                    setAttributes(newAttrs);
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Enter Value"
                                className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all shadow-sm bg-white"
                                value={attr.value}
                                onChange={(e) => {
                                    const newAttrs = [...attributes];
                                    newAttrs[idx].value = e.target.value;
                                    setAttributes(newAttrs);
                                }}
                            />
                        </div>
                        <button
                            className="text-gray-300 hover:text-rose-600 p-3 transition-colors shrink-0"
                            onClick={() => {
                                const newAttrs = attributes.filter((_, i) => i !== idx);
                                setAttributes(newAttrs.length ? newAttrs : [{ key: '', value: '' }]);
                            }}
                        >
                            <FiTrash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderConfigurationForm = () => {
        const catInfo = CATEGORY_METADATA[selectedCategory!] || CATEGORY_METADATA['Other'];
        const isGenAI = selectedCategory === 'Generative_AI';

        // Resolve dynamic agent image if available
        const agentIconPath = formData.aiName ? getAiAgentImg(formData.aiName) : null;
        const displayImageUrl = agentIconPath ? getImageUrl(agentIconPath) : getImageUrl(catInfo.imagePath);

        return (
            <div className="flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Visual Identity */}
                <div className="md:w-1/4 flex flex-col items-center pt-0">
                    <div className="w-40 h-40 bg-gray-50 rounded-3xl flex items-center justify-center p-8 border border-gray-100 shadow-inner group overflow-hidden relative">
                        <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/5 transition-colors duration-500"></div>
                        <img
                            src={displayImageUrl}
                            alt={catInfo.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    <div className="mt-6 text-center">
                        <span className="px-3 py-1 bg-blue-50 text-blue-900 text-[10px] font-black titlecase tracking-widest rounded-full">
                            {catInfo.name}
                        </span>
                    </div>
                </div>

                {/* Integration Form */}
                <div className="flex-1 bg-white p-2">
                    <div className="grid grid-cols-1 gap-6">
                        {isGenAI ? (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 titlecase tracking-widest ml-1">AI Platform <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all bg-white shadow-sm"
                                    value={formData.aiName || ''}
                                    onChange={(e) => setFormData({ ...formData, aiName: e.target.value })}
                                >
                                    <option value="">Select AI Platform</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="googleai">Google Gemini AI</option>
                                    <option value="llama3">Meta (Llama 3)</option>
                                    <option value="azureai">Microsoft Azure Open AI</option>
                                    <option value="bedrock">Amazon Bedrock</option>
                                    <option value="claudeai">Anthropic Claude AI</option>
                                    <option value="perplexityai">Perplexity AI</option>
                                    <option value="solai">Purplegrids SOL AI</option>
                                </select>
                                {!formData.aiName && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1">Please select AI Platform</p>}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 titlecase tracking-widest ml-1">AI Agent Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. OpenAI GPT-4"
                                    className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all shadow-sm"
                                    value={formData.aiName || ''}
                                    onChange={(e) => setFormData({ ...formData, aiName: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 titlecase tracking-widest ml-1">Workspace Id <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter Workspace Id"
                                    className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all shadow-sm"
                                    value={formData.workspaceId || ''}
                                    onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 titlecase tracking-widest ml-1">Status</label>
                                <select
                                    className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all bg-white shadow-sm"
                                    value={formData.status || 'Active'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {!isGenAI && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 titlecase tracking-widest ml-1">Username / Client ID</label>
                                    <input
                                        type="text"
                                        className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all shadow-sm bg-gray-50/50"
                                        value={formData.username || ''}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 titlecase tracking-widest ml-1">Password / Secret</label>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all shadow-sm bg-gray-50/50"
                                            value={formData.password || ''}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-900 transition-colors"
                                        >
                                            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 titlecase tracking-widest ml-1">Session Timeout <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        placeholder="3600"
                                        className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 outline-none transition-all shadow-sm"
                                        value={formData.sessionTimeout || ''}
                                        onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    {renderAttributeFields()}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-3 animate-in fade-in duration-700">
            {/* Unified High-Fi Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {notification && (
                    <div className={`py-3 px-6 transition-all duration-500 animate-in slide-in-from-top-4 flex items-center justify-between gap-3 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}>
                        <div className="flex items-center gap-2">
                            <FiInfo size={16} />
                            <span className="text-[11px] font-black titlecase tracking-widest">{notification.message}</span>
                        </div>
                        <button onClick={() => setNotification(null)} className="text-[10px] font-black titlecase tracking-tighter opacity-50 hover:opacity-100">Dismiss</button>
                    </div>
                )}

                <div className="px-6 py-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/20">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-blue-900 tracking-tighter titlecase italic">
                                {view === 'configure' || view === 'details' ? (formData.type || CATEGORY_METADATA[selectedCategory!]?.name) : view === 'add' ? 'Select Platform' : 'AI Platforms'}
                            </h2>
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-black rounded-full titlecase tracking-tighter shadow-sm border border-blue-200/50">
                                {view === 'add' ? 'Gallery' : (view === 'configure' && !isEditing) ? 'New' : view === 'configure' ? (formData.aiName || 'Configuration') : view === 'details' ? 'Integration' : 'Hub'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium max-w-xl line-clamp-2 leading-relaxed">
                            Integrate your company with Artificial Intelligence Platforms, providing the power to configure AI engines that scale with your enterprise needs.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {view === 'overview' ? (
                            <button onClick={() => setView('add')} className="bg-blue-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-xs font-black titlecase tracking-widest flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-900/20 hover:scale-[1.02] active:scale-95">
                                <FiPlus size={14} /> Add Platform
                            </button>
                        ) : view === 'add' ? (
                            <button onClick={handleCancel} className="bg-white hover:bg-blue-50 text-blue-900 px-6 py-2.5 rounded-full text-xs font-black titlecase tracking-widest flex items-center gap-2 transition-all border border-blue-100 shadow-sm">
                                <FiArrowLeft size={14} /> Back
                            </button>
                        ) : view === 'configure' ? (
                            <div className="flex items-center gap-3">
                                <button onClick={handleSave} className="bg-blue-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-xs font-black titlecase tracking-widest flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-900/20 active:scale-95">
                                    Save
                                </button>
                                <button onClick={handleCancel} className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-6 py-2.5 rounded-full text-xs font-black titlecase tracking-widest flex items-center gap-2 transition-all border border-rose-100">
                                    Cancel
                                </button>
                                <button onClick={handleBack} className="bg-white hover:bg-blue-50 text-blue-900 px-6 py-2.5 rounded-full text-xs font-black titlecase tracking-widest flex items-center gap-2 transition-all border border-blue-100 shadow-sm">
                                    <FiArrowLeft size={14} /> Back
                                </button>
                            </div>
                        ) : view === 'details' ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setFormData({ type: CATEGORY_METADATA[selectedCategory!]?.name, status: 'Active' });
                                        setIsEditing(false);
                                        setAttributes([{ key: '', value: '' }]);
                                        setView('configure');
                                    }}
                                    className="bg-blue-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-xs font-black titlecase tracking-widest flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-900/20 hover:scale-[1.02] active:scale-95"
                                >
                                    <FiPlus size={14} /> Add Integration
                                </button>
                                <button onClick={handleBack} className="bg-white hover:bg-blue-50 text-blue-900 px-6 py-2.5 rounded-full text-xs font-black titlecase tracking-widest flex items-center gap-2 transition-all border border-blue-100 shadow-sm">
                                    <FiArrowLeft size={14} /> Back
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleBack} className="bg-white hover:bg-blue-50 text-blue-900 px-6 py-2.5 rounded-full text-xs font-black titlecase tracking-widest flex items-center gap-2 transition-all border border-blue-100 shadow-sm">
                                <FiArrowLeft size={14} /> Back
                            </button>
                        )}
                    </div>
                </div>

                <div className="px-6 py-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-blue-900/40 titlecase tracking-widest">Synchronizing Registry...</p>
                        </div>
                    ) : view === 'overview' ? (
                        Object.keys(categorizedData).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/30">
                                <div className="p-6 bg-white rounded-full shadow-sm mb-6">
                                    <FiAlertCircle size={40} className="text-gray-200" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 mb-1 leading-tight">No Active Integrations</h4>
                                <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                                    Your AI Platform registry is currently empty. Start by adding a new integration category to power your enterprise with AI.
                                </p>
                                <button
                                    onClick={() => setView('add')}
                                    className="px-6 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-black titlecase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                                >
                                    Initialize Platform
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.keys(categorizedData).sort().map(typeKey => {
                                    const meta = CATEGORY_METADATA[typeKey] || CATEGORY_METADATA['Other'];
                                    const itemsCount = categorizedData[typeKey].length;

                                    return (
                                        <div
                                            key={typeKey}
                                            onClick={() => handleCardClick(typeKey)}
                                            className="group bg-white rounded-3xl border border-gray-100 p-6 cursor-pointer hover:shadow-2xl hover:shadow-blue-900/10 transition-all hover:-translate-y-1 relative flex flex-col items-start gap-4 overflow-hidden border-b-4 hover:border-b-blue-900"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-100/50 transition-colors"></div>

                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-blue-900 group-hover:text-white transition-all duration-500 overflow-hidden relative shadow-inner">
                                                <img
                                                    src={getImageUrl(meta.imagePath)}
                                                    alt={meta.name}
                                                    className="w-full h-full object-contain p-3 group-hover:brightness-0 group-hover:invert transition-all scale-110"
                                                />
                                            </div>

                                            <div className="relative z-10 w-full">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-black text-gray-900 titlecase tracking-tighter italic">
                                                        {meta.name}
                                                    </h4>
                                                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                                                        {itemsCount}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-2">
                                                    {meta.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : view === 'add' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(CATEGORY_METADATA).map(([key, meta]) => {
                                return (
                                    <div
                                        key={key}
                                        onClick={() => handleCardClick(key)}
                                        className="group bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:border-blue-900/20 transition-all hover:scale-[1.02] flex items-center gap-4"
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-50 shrink-0 group-hover:scale-110 transition-transform">
                                            <img src={getImageUrl(meta.imagePath)} alt={meta.name} className="w-8 h-8 object-contain" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="text-xs font-black text-gray-900 titlecase tracking-tighter truncate">{meta.name}</h4>
                                            <p className="text-[9px] text-gray-400 font-medium truncate italic tracking-tighter mt-0.5">Initialize Configuration</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : view === 'configure' ? (
                        renderConfigurationForm()
                    ) : (
                        // Details / Records View
                        (() => {
                            const records = (selectedCategory && categorizedData[selectedCategory]) || [];
                            const meta = selectedCategory ? CATEGORY_METADATA[selectedCategory] : null;

                            return (
                                <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {records.map((record, index) => (
                                            <div key={index} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col gap-6 hover:shadow-lg transition-all relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-12 -mt-12 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                {/* Actions */}
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <button onClick={() => handleEdit(record)} className="p-2 bg-gray-50/80 hover:bg-blue-50 text-gray-400 hover:text-blue-900 rounded-lg transition-all border border-transparent hover:border-blue-100 backdrop-blur-sm">
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(record.aiId)} className="p-2 bg-gray-50/80 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-all border border-transparent hover:border-rose-100 backdrop-blur-sm">
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>

                                                {/* Identity Card */}
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center p-3 border border-gray-100 overflow-hidden shrink-0">
                                                        <img src={getImageUrl(meta?.imagePath || CATEGORY_METADATA['Other'].imagePath)} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <h5 className="text-xs font-black text-gray-900 titlecase tracking-tighter break-words">{record.aiName || 'Unnamed Agent'}</h5>
                                                        <span className={`inline-block px-2 py-0.5 mt-1 rounded-full text-[8px] font-black titlecase tracking-widest ${record.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                            }`}>
                                                            {record.status || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Meta Details */}
                                                <div className="space-y-3 py-2 border-t border-gray-50">
                                                    <div className="flex justify-between text-[10px] font-medium border-b border-gray-50/50 pb-2">
                                                        <span className="text-gray-400 titlecase tracking-tighter">Timeout</span>
                                                        <span className="text-gray-900 font-bold">{record.sessionTimeout || 'N/A'}s</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-medium border-b border-gray-50/50 pb-2">
                                                        <span className="text-gray-400 titlecase tracking-tighter">Username</span>
                                                        <span className="text-gray-900 font-bold truncate max-w-[120px]">{record.username || 'Not set'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-medium">
                                                        <span className="text-gray-400 titlecase tracking-tighter">Workspace</span>
                                                        <span className="text-gray-900 font-bold truncate max-w-[120px]">{record.workspaceId || 'Default'}</span>
                                                    </div>
                                                </div>

                                                {/* Attributes Badge Row */}
                                                {record.attributes && record.attributes.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-auto pt-2">
                                                        {record.attributes.slice(0, 3).map((attr: any, i: number) => (
                                                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-500 text-[8px] font-bold rounded-md titlecase tracking-tight" title={`${attr.key}: ${attr.value}`}>
                                                                {attr.key || 'Param'}
                                                            </span>
                                                        ))}
                                                        {record.attributes.length > 3 && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-900 text-[8px] font-bold rounded-md">+{record.attributes.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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

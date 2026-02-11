import React, { useState, useEffect } from 'react';
import {
    FiFileText, FiSearch, FiPlay, FiTrash2, FiSave, FiCopy,
    FiLayers, FiPlus, FiChevronDown, FiChevronRight, FiX, FiInfo,
    FiTerminal, FiCode, FiExternalLink, FiCpu, FiPlusCircle,
    FiAlertCircle, FiCheckCircle, FiZap
} from 'react-icons/fi';
import { Prompt } from '../types/merchant';
import merchantService from '../services/merchantService';

interface PromptLabProps {
    merchantId: string;
    cluster?: string;
}

const PromptLab: React.FC<PromptLabProps> = ({ merchantId, cluster }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [isNewPrompt, setIsNewPrompt] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Extraction': true,
        'Generation': true,
        'Classification': true,
        'Standard': true
    });

    // Form State
    const [formData, setFormData] = useState<Partial<Prompt>>({});
    const [activeParam, setActiveParam] = useState<string | null>(null);
    const [runResult, setRunResult] = useState<any>(null);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const response = await merchantService.getPrompts(merchantId, 0, 100, cluster);
            const fetchedPrompts = response.content || [];
            setPrompts(fetchedPrompts);

            // Select first prompt by default if none selected and not creating new
            if (fetchedPrompts.length > 0 && !selectedPrompt && !isNewPrompt) {
                handleSelectPrompt(fetchedPrompts[0]);
            }
        } catch (error) {
            console.error('Error fetching prompts:', error);
            setMessage({ type: 'error', text: 'Failed to load prompts' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchPrompts();
        }
    }, [merchantId]);

    const handleSelectPrompt = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
        setIsNewPrompt(false);
        setFormData({
            ...prompt,
            title: prompt.title,
            promptText: prompt.promptText,
            type: prompt.type,
            modelId: prompt.modelId,
            requestParams: prompt.requestParams || {}
        });
        setMessage(null);
        setRunResult(null);

        // Set first param as active if any
        const params = Object.keys(prompt.requestParams || {});
        if (params.length > 0) {
            setActiveParam(params[0]);
        } else {
            setActiveParam(null);
        }
    };

    const handleNewPrompt = () => {
        setSelectedPrompt(null);
        setIsNewPrompt(true);
        setFormData({
            title: '',
            promptText: '',
            type: 'Standard',
            modelId: 391,
            requestParams: {},
            media: []
        });
        setActiveParam(null);
        setMessage(null);
        setRunResult(null);
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleParamValueChange = (param: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            requestParams: {
                ...(prev.requestParams || {}),
                [param]: value
            }
        }));
    };

    const handleAddParam = () => {
        const paramName = prompt('Enter parameter name (e.g., userQuery):');
        if (paramName && paramName.trim()) {
            handleParamValueChange(paramName.trim(), '');
            setActiveParam(paramName.trim());
        }
    };

    const handleRemoveParam = (param: string) => {
        const newParams = { ...formData.requestParams };
        delete newParams[param];
        setFormData(prev => ({ ...prev, requestParams: newParams }));
        if (activeParam === param) setActiveParam(null);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.promptText) {
            setMessage({ type: 'error', text: 'Title and Description are required' });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const payload = {
                merchantId: merchantId,
                modelId: formData.modelId || 391,
                promptDescription: formData.promptText,
                promptTitle: formData.title,
                promptType: formData.type || 'Standard',
                media: formData.media || [],
                requestParams: formData.requestParams || {}
            };

            if (isNewPrompt) {
                await merchantService.createPrompt(payload, cluster);
                setMessage({ type: 'success', text: 'Prompt created successfully' });
            } else if (selectedPrompt) {
                await merchantService.updatePrompt(merchantId, selectedPrompt.id, payload, cluster);
                setMessage({ type: 'success', text: 'Prompt updated successfully' });
            }

            fetchPrompts(); // Refresh list
        } catch (error) {
            console.error('Error saving prompt:', error);
            setMessage({ type: 'error', text: `Failed to ${isNewPrompt ? 'create' : 'update'} prompt` });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPrompt) return;
        if (!window.confirm(`Are you sure you want to delete prompt #${selectedPrompt.id}?`)) return;

        setLoading(true);
        try {
            await merchantService.deletePrompt(merchantId, selectedPrompt.id, cluster);
            setMessage({ type: 'success', text: 'Prompt deleted successfully' });
            setSelectedPrompt(null);
            fetchPrompts();
        } catch (error) {
            console.error('Error deleting prompt:', error);
            setMessage({ type: 'error', text: 'Failed to delete prompt' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCurl = () => {
        if (!selectedPrompt) return;

        const baseURL = cluster?.toLowerCase() === 'app6e' ? 'https://api6e.neocloud.ai/' : 'https://api6a.neocloud.ai/';
        const curl = `curl --location '${baseURL}model-service/api/v1/promptlab/executePrompt' \\
    --header 'Content-Type: application/json' \\
    --data '{
   "merchantId": "${merchantId}",
   "promptId": ${selectedPrompt.id},
   "promptTitle": "${formData.title || selectedPrompt.title}",
   "requestParams": ${JSON.stringify(formData.requestParams, null, 6)}
}'`;

        navigator.clipboard.writeText(curl);
        setMessage({ type: 'success', text: 'Dynamic cURL copied to clipboard!' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleClone = () => {
        if (!selectedPrompt && !isNewPrompt) return;

        const originalTitle = formData.title || selectedPrompt?.title || 'Untitled';
        const clonedData = {
            ...formData,
            title: `Copy of ${originalTitle}`,
        };

        setSelectedPrompt(null);
        setIsNewPrompt(true);
        setFormData(clonedData);
        setRunResult(null);
        setMessage({ type: 'success', text: `Cloned "${originalTitle}". You are now editing the copy.` });
    };

    const handleRun = async () => {
        if (!formData.promptText) return;

        setRunning(true);
        setRunResult(null);
        try {
            // Replace variables in promptText if any
            let finalPrompt = formData.promptText || '';
            const params = formData.requestParams || {};
            Object.entries(params).forEach(([key, value]) => {
                finalPrompt = finalPrompt.replace(new RegExp(`\\$${key}`, 'g'), String(value));
            });

            const response = await merchantService.runPrompt(merchantId, finalPrompt, formData.modelId || 391, cluster);
            setRunResult(response);
        } catch (error) {
            console.error('Error running prompt:', error);
            setRunResult({ error: 'Failed to get response' });
        } finally {
            setRunning(false);
        }
    };

    const handleExecute = async () => {
        if (!selectedPrompt) return;

        setRunning(true);
        setRunResult(null);
        try {
            const response = await merchantService.executePrompt(
                merchantId,
                selectedPrompt.id,
                formData.title || selectedPrompt.title || '',
                formData.requestParams || {},
                cluster
            );
            setRunResult(response);
        } catch (error) {
            console.error('Error executing prompt:', error);
            setRunResult({ error: 'Failed to execute prompt' });
        } finally {
            setRunning(false);
        }
    };

    const filteredPrompts = prompts.filter(p => {
        const term = searchQuery.toLowerCase();
        return (
            (p.title?.toLowerCase().includes(term)) ||
            (p.promptText?.toLowerCase().includes(term)) ||
            (p.id?.toString().includes(term))
        );
    });

    const promptsByCategory = filteredPrompts.reduce((acc, p) => {
        const cat = p.type || 'Standard';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {} as Record<string, Prompt[]>);

    return (
        <div className="flex h-full min-h-[600px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Left Sidebar: Navigation */}
            <div className="w-72 border-r border-gray-200 flex flex-col bg-[#fcfdfe]">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FiFileText className="text-blue-600" />
                            <h2 className="text-base font-bold text-gray-800">Prompt Lab</h2>
                        </div>
                        <FiInfo className="text-gray-400 cursor-help hover:text-blue-500 transition-colors" size={14} />
                    </div>

                    <div className="relative group">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search prompts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {Object.entries(promptsByCategory).map(([category, catPrompts]) => (
                        <div key={category} className="mb-2">
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-2 hover:bg-white hover:shadow-sm rounded-md transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded transition-colors ${expandedCategories[category] ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {expandedCategories[category] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600 transition-colors uppercase tracking-[0.15em]">{category}</span>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors ${expandedCategories[category] ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                                    {catPrompts.length}
                                </span>
                            </button>

                            {expandedCategories[category] && (
                                <div className="mt-1 space-y-1 ml-4">
                                    {catPrompts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelectPrompt(p)}
                                            className={`w-full text-left p-3 rounded-xl transition-all group border-2 ${selectedPrompt?.id === p.id
                                                ? 'bg-white border-blue-500 shadow-md ring-4 ring-blue-50'
                                                : 'border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${selectedPrompt?.id === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    #{p.id}
                                                </span>
                                                <p className={`text-xs font-bold truncate ${selectedPrompt?.id === p.id ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'}`}>
                                                    {p.title || 'Untitled'}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed italic border-l-2 border-gray-100 pl-2 ml-1">
                                                {p.promptText}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle Section: Workspace */}
            <div className="flex-1 flex flex-col bg-white">
                {(selectedPrompt || isNewPrompt) ? (
                    <>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <FiCode size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        {isNewPrompt ? 'Create New Prompt' : `Prompt #${selectedPrompt?.id}`}
                                        <FiInfo className="text-gray-300 cursor-help" size={14} />
                                    </h3>
                                    {!isNewPrompt && (
                                        <p className="text-[10px] text-gray-400 font-mono tracking-tighter">ID: {selectedPrompt?.id} • TYPE: {formData.type}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {!isNewPrompt && (
                                    <>
                                        <button
                                            onClick={handleCopyCurl}
                                            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-700 transition-colors"
                                        >
                                            <FiCopy size={14} /> Copy cURL
                                        </button>
                                        <button
                                            onClick={handleClone}
                                            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-700 transition-colors"
                                        >
                                            <FiLayers size={14} /> Clone
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleNewPrompt}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all"
                                >
                                    <FiPlus size={14} /> New
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                            {message && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {message.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                                    <p className="text-sm font-medium">{message.text}</p>
                                </div>
                            )}

                            <div className="prose prose-sm max-w-none">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">System Prompt Instructions</label>
                                <textarea
                                    value={formData.promptText || ''}
                                    onChange={(e) => handleInputChange('promptText', e.target.value)}
                                    rows={12}
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono leading-relaxed"
                                    placeholder="Enter system prompt instructions with $params..."
                                />
                            </div>

                            {/* Action Buttons Container - Moved from Footer */}
                            <div className="mt-8 flex items-center justify-between pb-8 border-b border-gray-100">
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleRun}
                                        disabled={running || !formData.promptText}
                                        className="flex items-center gap-2 px-8 py-2.5 bg-gray-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-gray-700 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        {running && !selectedPrompt ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FiPlay size={16} />}
                                        Run Raw
                                    </button>
                                    {!isNewPrompt && (
                                        <button
                                            onClick={handleExecute}
                                            disabled={running}
                                            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                                        >
                                            {running && selectedPrompt ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FiZap size={16} />}
                                            Execute API
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    {!isNewPrompt && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                                        >
                                            <FiTrash2 size={16} /> Delete
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-8 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-blue-500 hover:text-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                                    >
                                        {loading ? <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" /> : <FiSave size={16} />}
                                        {isNewPrompt ? 'Create' : 'Update'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-12 space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <FiTerminal className="text-blue-500" /> Response Section
                                    </h4>
                                    <div className="h-[1px] flex-1 bg-gray-100 ml-4"></div>
                                </div>

                                {runResult ? (
                                    <div className="bg-[#0f172a] rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2">
                                            <button onClick={() => setRunResult(null)} className="text-gray-500 hover:text-white transition-colors">
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <FiCpu className="text-emerald-400" />
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Model Inference Execution</span>
                                        </div>
                                        <pre className="text-emerald-50 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                                            {JSON.stringify(runResult, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 min-h-[300px] flex items-center justify-center border-dashed group hover:bg-white transition-colors">
                                        <div className="text-center group-hover:scale-105 transition-transform">
                                            <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
                                                {running ? <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" /> : <FiPlay size={24} />}
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">{running ? 'AI is processing...' : 'Response will appear here after execution'}</p>
                                            <p className="text-xs text-gray-300 mt-1">Configure parameters on the right to start</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Empty space for better scrolling if needed */}
                        <div className="h-12"></div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
                        <div className="w-20 h-20 bg-white border border-gray-200 rounded-3xl flex items-center justify-center text-gray-300 mb-6 shadow-xl shadow-gray-200/50">
                            <FiLayers size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Select a prompt to begin</h3>
                        <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">Choose from your existing prompts to view, edit, and test in the lab.</p>
                        <button
                            onClick={handleNewPrompt}
                            className="mt-6 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all"
                        >
                            <FiPlusCircle size={16} /> Create New Prompt
                        </button>
                    </div>
                )}
            </div>

            {/* Right Sidebar: Configuration */}
            {(selectedPrompt || isNewPrompt) && (
                <div className="w-80 border-l border-gray-200 flex flex-col bg-white">
                    <div className="p-6 border-b border-gray-200 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="space-y-8">
                            {/* Basic Config */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Prompt Configuration</h4>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                                        Prompt Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                                        placeholder="e.g. appointment_booking"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                                        Prompt Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type || ''}
                                        onChange={(e) => handleInputChange('type', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="Extraction">Extraction</option>
                                        <option value="Generation">Generation</option>
                                        <option value="Classification">Classification</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                                        Model <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FiLayers className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={14} />
                                        <select
                                            value={formData.modelId || ''}
                                            onChange={(e) => handleInputChange('modelId', e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 appearance-none"
                                        >
                                            <option value={391}>TeleperformancePublicLLM (391)</option>
                                            <option value={400}>GPT-4o (400)</option>
                                            <option value={500}>Claude-3.5-Sonnet (500)</option>
                                        </select>
                                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Params Section */}
                            <div className="space-y-4 border-t border-gray-100 pt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Parameters</h4>
                                    <button
                                        onClick={handleAddParam}
                                        className="text-[11px] font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                    >
                                        <FiPlus size={12} /> New
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {Object.keys(formData.requestParams || {}).map(param => (
                                        <button
                                            key={param}
                                            onClick={() => setActiveParam(param)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${activeParam === param ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'}`}
                                        >
                                            {param}
                                            <FiX
                                                size={10}
                                                className="ml-1 text-gray-400 hover:text-red-500 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveParam(param);
                                                }}
                                            />
                                        </button>
                                    ))}
                                    {Object.keys(formData.requestParams || {}).length === 0 && (
                                        <p className="text-xs text-gray-400 italic">No parameters defined</p>
                                    )}
                                </div>

                                {activeParam && (
                                    <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 animate-in zoom-in-95 duration-200">
                                        <label className="text-xs font-bold text-blue-700 flex items-center gap-2">
                                            {activeParam} Value
                                        </label>
                                        <textarea
                                            value={formData.requestParams?.[activeParam] || ''}
                                            onChange={(e) => handleParamValueChange(activeParam, e.target.value)}
                                            rows={10}
                                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 leading-relaxed shadow-inner"
                                            placeholder={`Enter value for ${activeParam}...`}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-center gap-2">
                        <FiExternalLink className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-400">View Documentation</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptLab;

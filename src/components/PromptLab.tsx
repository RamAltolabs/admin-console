import React, { useState, useEffect } from 'react';
import {
    FiFileText, FiSearch, FiPlay, FiTrash2, FiSave, FiCopy,
    FiLayers, FiPlus, FiChevronDown, FiChevronRight, FiX,
    FiTerminal, FiCode, FiCpu, FiPlusCircle,
    FiAlertCircle, FiCheckCircle, FiZap, FiEdit2, FiCheck
} from 'react-icons/fi';
import { Prompt } from '../types/merchant';
import merchantService from '../services/merchantService';

interface PromptLabProps {
    merchantId: string;
    cluster?: string;
}

const PromptLab: React.FC<PromptLabProps> = ({ merchantId, cluster }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [activeTab] = useState<'prompts'>('prompts');
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

    const [formData, setFormData] = useState<Partial<Prompt>>({});
    const [activeParam, setActiveParam] = useState<string | null>(null);
    const [editingParam, setEditingParam] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [runResult, setRunResult] = useState<any>(null);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const response = await merchantService.getPrompts(merchantId, 0, 100, cluster);
            const fetchedPrompts = response.content || [];
            setPrompts(fetchedPrompts);
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
    }, [merchantId, cluster]);

    const handleSelectPrompt = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
        setIsNewPrompt(false);
        setFormData({
            ...prompt,
            title: prompt.title,
            promptText: prompt.promptText,
            type: prompt.type,
            modelId: prompt.modelId,
            requestParams: prompt.requestParams || {},
            knowledgeBaseId: prompt.knowledgeBaseId
        });
        setMessage(null);
        setRunResult(null);
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
            media: [],
            knowledgeBaseId: undefined
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
        if (editingParam === param) setEditingParam(null);
    };

    const handleStartRename = (e: React.MouseEvent, param: string) => {
        e.stopPropagation();
        setEditingParam(param);
        setRenameValue(param);
    };

    const handleRenameConfirm = (e: React.FormEvent | React.MouseEvent, oldName: string) => {
        if (e) e.stopPropagation();
        if (!renameValue || renameValue.trim() === '' || renameValue === oldName) {
            setEditingParam(null);
            return;
        }

        const trimmedNewName = renameValue.trim();
        setFormData(prev => {
            const newParams = { ...prev.requestParams };
            const value = newParams[oldName];
            delete newParams[oldName];
            newParams[trimmedNewName] = value;
            return { ...prev, requestParams: newParams };
        });

        if (activeParam === oldName) setActiveParam(trimmedNewName);
        setEditingParam(null);
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
                requestParams: formData.requestParams || {},
                knowledgeBaseId: formData.knowledgeBaseId
            };

            if (isNewPrompt) {
                await merchantService.createPrompt(payload, cluster);
                setMessage({ type: 'success', text: 'Prompt created successfully' });
            } else if (selectedPrompt) {
                await merchantService.updatePrompt(merchantId, selectedPrompt.id, payload, cluster);
                setMessage({ type: 'success', text: 'Prompt updated successfully' });
            }

            fetchPrompts();
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
        const clusterId = cluster?.toLowerCase();
        const baseURLMap: Record<string, string | undefined> = {
            app6: process.env.REACT_APP_APP6A_BASE_URL,
            app6a: process.env.REACT_APP_APP6A_BASE_URL,
            app6e: process.env.REACT_APP_APP6E_BASE_URL,
            app30a: process.env.REACT_APP_APP30A_BASE_URL,
            app30b: process.env.REACT_APP_APP30B_BASE_URL,
            'it-app': process.env.REACT_APP_IT_APP_BASE_URL,
        };
        const configuredBaseURL = baseURLMap[clusterId || 'it-app'] || process.env.REACT_APP_IT_APP_BASE_URL;
        if (!configuredBaseURL) {
            setMessage({ type: 'error', text: 'Missing cluster base URL configuration in env.' });
            return;
        }
        const baseURL = configuredBaseURL.endsWith('/') ? configuredBaseURL : `${configuredBaseURL}/`;
        const curl = `curl --location '${baseURL}model-service/api/v1/promptlab/executePrompt' \\
    --header 'Content-Type: application/json' \\
    --data '{
   "merchantId": "${merchantId}",
   "promptId": ${selectedPrompt.id},
   "promptTitle": "${formData.title || selectedPrompt.title}",
   "requestParams": ${JSON.stringify(formData.requestParams, null, 6)}
}'`;
        navigator.clipboard.writeText(curl);
        setMessage({ type: 'success', text: 'cURL copied to clipboard!' });
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
        setMessage({ type: 'success', text: `Cloned "${originalTitle}"` });
    };

    const handleRun = async () => {
        if (!formData.promptText) return;
        setRunning(true);
        setRunResult(null);
        try {
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
        <div className="h-full flex flex-col bg-[#fdfdfd] animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-900 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20">
                            <FiTerminal className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-blue-900 tracking-tight">Prompt Lab</h1>
                            {/* <p className="text-xs font-bold text-gray-400 titlecase tracking-widest mt-0.5">Prompt Engineering & Automation Hub</p> */}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-blue-700 titlecase tracking-wider">Live Sandbox</span>
                        </div> */}
                        <button
                            onClick={handleNewPrompt}
                            className="px-4 py-1.5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 hover:shadow-blue-900/20 transition-all shadow-lg flex items-center gap-2 active:scale-95 border border-white/10"
                        >
                            <FiPlusCircle size={12} className="text-blue-200" />
                            Create Prompt
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-80 bg-white border-r border-gray-100 flex flex-col">


                    <div className="p-4 bg-white">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder={`Filter ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-900/5 focus:bg-white focus:border-blue-900 transition-all"
                            />
                            <FiSearch className="absolute left-3 top-2 text-gray-400 group-focus-within:text-blue-900" size={12} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Prompts List */}
                        {activeTab === 'prompts' && Object.entries(promptsByCategory).map(([category, catPrompts]) => (
                            <div key={category} className="border-b border-gray-50">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white group"
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedCategories[category] ? <FiChevronDown size={12} className="text-blue-900" /> : <FiChevronRight size={12} className="text-gray-400" />}
                                        <span className="text-[9px] font-black titlecase tracking-[0.15em] text-gray-400 group-hover:text-blue-900">{category}</span>
                                    </div>
                                    <span className="text-[9px] bg-gray-100 text-gray-500 font-black px-1.5 py-0.5 rounded-full">{catPrompts.length}</span>
                                </button>

                                {expandedCategories[category] && (
                                    <div className="space-y-0.5 pb-2">
                                        {catPrompts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelectPrompt(p)}
                                                className={`w-full text-left px-8 py-2 transition-all relative group ${selectedPrompt?.id === p.id
                                                    ? 'bg-blue-50 text-blue-900'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-900'
                                                    }`}
                                            >
                                                {selectedPrompt?.id === p.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-900" />}
                                                <div className="text-[12px] font-bold truncate">{p.title || 'Untitled'}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-black text-gray-300">#{p.id}</span>
                                                    <span className="text-[9px] text-gray-400 truncate opacity-70">{p.promptText?.substring(0, 25)}...</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}




                    </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex flex-col bg-[#f8fafc]">
                    {(selectedPrompt || isNewPrompt) ? (
                        <>
                            {/* Toolbar */}
                            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200">
                                        <span className="text-[9px] font-black text-gray-500 titlecase tracking-widest">
                                            {isNewPrompt ? 'Draft' : `ID: ${selectedPrompt?.id}`}
                                        </span>
                                    </div>
                                    <h2 className="text-sm font-black text-blue-900 truncate max-w-md">
                                        {formData.title || 'Untitled Prompt'}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isNewPrompt && (
                                        <>
                                            <button onClick={handleCopyCurl} className="p-2.5 text-gray-400 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100" title="Copy cURL">
                                                <FiCopy size={16} />
                                            </button>
                                            <button onClick={handleClone} className="p-2.5 text-gray-400 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100" title="Clone">
                                                <FiLayers size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Editor Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                                <div className="max-w-6xl mx-auto space-y-5">
                                    {message && (
                                        <div className={`p-2.5 rounded-lg flex items-center gap-2.5 border shadow-sm animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                                            }`}>
                                            {message.type === 'success' ? <FiCheckCircle size={12} className="text-green-500" /> : <FiAlertCircle size={12} className="text-red-500" />}
                                            <span className="text-[10px] font-bold titlecase tracking-tight">{message.text}</span>
                                        </div>
                                    )}

                                    <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                                        <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span className="text-[9px] font-black text-gray-400 titlecase tracking-[0.2em]">Prompt Definition</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400">
                                                <span className="flex items-center gap-1"><FiCode size={10} /> Markdown</span>
                                                <span className="flex items-center gap-1"><FiTerminal size={10} /> UTF-8</span>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <textarea
                                                value={formData.promptText || ''}
                                                onChange={(e) => handleInputChange('promptText', e.target.value)}
                                                rows={10}
                                                className="w-full p-5 bg-white text-blue-900 text-xs font-mono leading-relaxed focus:outline-none placeholder:text-gray-200 resize-none"
                                                placeholder="Write your prompt here..."
                                            />
                                            <div className="absolute right-4 bottom-4 px-3 py-1 bg-blue-900/5 text-blue-900 rounded-full text-[10px] font-black titlecase">
                                                {formData.promptText?.length || 0} Characters
                                            </div>
                                        </div>

                                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={handleRun}
                                                    disabled={running || !formData.promptText}
                                                    className="px-3.5 py-1.5 bg-blue-900 text-white rounded-lg text-[8px] font-black titlecase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    {running && !selectedPrompt ? <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiPlay size={10} />}
                                                    Debug Run
                                                </button>
                                                {!isNewPrompt && (
                                                    <button
                                                        onClick={handleExecute}
                                                        disabled={running}
                                                        className="px-3.5 py-1.5 bg-blue-900 text-white rounded-lg text-[8px] font-black titlecase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {running && selectedPrompt ? <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiZap size={10} />}
                                                        Run API
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {!isNewPrompt && (
                                                    <button onClick={handleDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <FiTrash2 size={10} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleSave}
                                                    className="px-3.5 py-1.5 bg-white border border-blue-900 text-blue-900 rounded-lg text-[8px] font-black titlecase tracking-widest hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-1.5"
                                                >
                                                    {loading ? <div className="w-2 h-2 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" /> : <FiSave size={10} />}
                                                    {isNewPrompt ? 'Deploy' : 'Update'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Response Hub */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <FiTerminal className="text-blue-900" size={16} />
                                            </div>
                                            <h3 className="text-sm font-black text-blue-900 titlecase tracking-widest">Execution Output</h3>
                                        </div>

                                        {runResult ? (
                                            <div className="bg-blue-900 rounded-2xl p-6 relative shadow-2xl border border-white/5 group">
                                                <button onClick={() => setRunResult(null)} className="absolute top-4 right-4 p-1.5 text-gray-600 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                                    <FiX size={14} />
                                                </button>
                                                <pre className="text-blue-400 text-[11px] font-mono whitespace-pre-wrap overflow-auto max-h-[400px] leading-relaxed custom-scrollbar selection:bg-blue-500/30">
                                                    {typeof runResult === 'string' ? runResult : JSON.stringify(runResult, null, 2)}
                                                </pre>
                                            </div>
                                        ) : (
                                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                                                {running ? (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-12 h-12 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin" />
                                                        <span className="text-xs font-black text-blue-900 titlecase tracking-widest animate-pulse">Analyzing Vectors & Generating Response...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-4 grayscale opacity-40">
                                                        <FiPlay size={48} className="text-gray-300" />
                                                        <p className="text-xs font-black text-gray-400 titlecase tracking-widest">Ready for Debugging</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-20">
                            <div className="text-center max-w-sm">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl shadow-blue-900/5 flex items-center justify-center mx-auto mb-8 border border-gray-100 border-b-4">
                                    <FiCode size={40} className="text-blue-900" />
                                </div>
                                <h3 className="text-lg font-black text-blue-900 mb-2 tracking-tight">System Ready</h3>
                                <p className="text-[11px] text-gray-500 font-medium mb-6 leading-relaxed">
                                    Select an automated prompt template or intent to begin refinement. You can also create a custom logic bridge.
                                </p>
                                <button onClick={handleNewPrompt} className="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-2 mx-auto active:scale-95 border border-white/10">
                                    <FiPlusCircle size={14} className="text-blue-200" />
                                    Initialize Prompt
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Config */}
                {(selectedPrompt || isNewPrompt) && (
                    <div className="w-[240px] bg-white border-l border-gray-100 flex flex-col shadow-xl">
                        <div className="p-3.5 overflow-y-auto custom-scrollbar">


                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 titlecase tracking-widest mb-1 block">Prompt Title</label>
                                    <input
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/5 focus:bg-white focus:border-blue-900 transition-all font-sans"
                                        placeholder="Internal Name"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 titlecase tracking-widest mb-1 block">Type</label>
                                        <select
                                            value={formData.type || ''}
                                            onChange={(e) => handleInputChange('type', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-bold text-blue-900 focus:outline-none focus:border-blue-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%231E3A8A%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_0.5rem_center] bg-no-repeat transition-all"
                                        >
                                            <option value="Standard">Standard API</option>
                                            <option value="Extraction">NER Extraction</option>
                                            <option value="Generation">Dynamic Gen</option>
                                            <option value="Classification">Router Logic</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 titlecase tracking-widest mb-1 block">Model</label>
                                        <select
                                            value={formData.modelId || ''}
                                            onChange={(e) => handleInputChange('modelId', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900/10 focus:border-blue-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%231E3A8A%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_0.5rem_center] bg-no-repeat transition-all"
                                        >
                                            <option value={391}>TP PUBLIC (391)</option>
                                            <option value={400}>O1 PREVIEW (400)</option>
                                            <option value={500}>CLAUDE 3.5 (500)</option>
                                        </select>
                                    </div>

                                </div>

                                <div className="pt-6 border-t border-gray-100 mt-2">
                                    <div className="flex items-center justify-between mb-4 titlecase">
                                        <h4 className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Params</h4>
                                        <button onClick={handleAddParam} className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-[8px] font-black hover:bg-blue-100 transition-all border border-blue-100 uppercase">
                                            + ADD
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {Object.keys(formData.requestParams || {}).map(param => (
                                            <div key={param} className="space-y-1.5">
                                                <div className={`w-full px-3 py-1.5 rounded-lg text-[9px] font-black titlecase tracking-wider flex items-center justify-between transition-all cursor-pointer border group/item ${activeParam === param ? 'bg-blue-900 text-white border-blue-900 shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'
                                                    }`}
                                                    onClick={() => setActiveParam(param)}
                                                >
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <FiPlay size={10} className={activeParam === param ? 'text-blue-300' : 'text-gray-300'} />
                                                        {editingParam === param ? (
                                                            <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    value={renameValue}
                                                                    onChange={e => setRenameValue(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && handleRenameConfirm(null as any, param)}
                                                                    onBlur={e => handleRenameConfirm(null as any, param)}
                                                                    className={`border-none focus:ring-1 rounded px-1 py-0.5 w-full outline-none text-xs font-bold ${activeParam === param
                                                                        ? 'bg-white/10 text-white focus:ring-white/30'
                                                                        : 'bg-gray-100 text-blue-900 focus:ring-blue-900/20'
                                                                        }`}
                                                                />
                                                                <button onClick={e => handleRenameConfirm(e, param)}>
                                                                    <FiCheck size={12} className="text-green-400" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 group-hover/item:text-blue-900">
                                                                <span className={activeParam === param ? 'text-white' : ''}>{param}</span>
                                                                <FiEdit2
                                                                    size={10}
                                                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity text-blue-400 hover:text-blue-600"
                                                                    onClick={e => handleStartRename(e, param)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <FiX
                                                        size={14}
                                                        className={activeParam === param ? 'text-white/50 hover:text-white' : 'text-gray-300 hover:text-red-500'}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveParam(param);
                                                        }}
                                                    />
                                                </div>
                                                {activeParam === param && (
                                                    <textarea
                                                        value={formData.requestParams?.[activeParam] || ''}
                                                        onChange={(e) => handleParamValueChange(activeParam, e.target.value)}
                                                        rows={4}
                                                        className="w-full px-3 py-2 bg-white border border-blue-900/10 rounded-lg text-[10px] font-bold text-blue-900 focus:outline-none focus:border-blue-900 transition-all shadow-inner"
                                                        placeholder={`Injection value for $${activeParam}...`}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        {Object.keys(formData.requestParams || {}).length === 0 && (
                                            <div className="py-10 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                                <p className="text-[9px] font-black text-gray-300 title-case tracking-widest font-mono">Zero Parameters Defined</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptLab;

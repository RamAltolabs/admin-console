import React, { useState, useEffect } from 'react';
import {
    FiFileText, FiSearch, FiPlay, FiTrash2, FiSave, FiCopy,
    FiLayers, FiPlus, FiChevronDown, FiChevronRight, FiX,
    FiTerminal, FiCode, FiCpu, FiPlusCircle,
    FiAlertCircle, FiCheckCircle, FiZap
} from 'react-icons/fi';
import { Prompt, KnowledgeBase, Ontology, Intent } from '../types/merchant';
import merchantService from '../services/merchantService';

interface PromptLabProps {
    merchantId: string;
    cluster?: string;
}

const PromptLab: React.FC<PromptLabProps> = ({ merchantId, cluster }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [ontologies, setOntologies] = useState<Ontology[]>([]);
    const [intents, setIntents] = useState<Intent[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'prompts' | 'intents' | 'ontologies' | 'documents'>('prompts');
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

    const fetchKnowledgeBases = async () => {
        try {
            const response = await merchantService.getKnowledgeBases(merchantId, 0, 100, cluster);
            setKnowledgeBases(response.content || []);
        } catch (error) {
            console.error('Error fetching knowledge bases:', error);
        }
    };

    const fetchOntologies = async () => {
        try {
            const response: any = await merchantService.getOntologies(merchantId, cluster);
            // Handling array response directly or inside a property
            let data: any[] = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response && Array.isArray(response.entity)) {
                data = response.entity;
            } else if (response && Array.isArray(response.data)) {
                data = response.data;
            }
            setOntologies(data);
        } catch (error) {
            console.error('Error fetching ontologies:', error);
        }
    };

    const fetchIntents = async () => {
        try {
            const response = await merchantService.getIntents(merchantId, cluster);
            // Handling array response directly or inside a property
            const data = Array.isArray(response) ? response : (response.data || []);
            setIntents(data);
        } catch (error) {
            console.error('Error fetching intents:', error);
        }
    };


    const fetchDocuments = async () => {
        try {
            const response = await merchantService.getDocuments(merchantId, 0, 50, cluster);
            // Handle response structure (it matches the curl output structure likely)
            // Assuming response has content or data
            const data = Array.isArray(response) ? response : (response.content || response.data || []);
            if (Array.isArray(data)) {
                setDocuments(data);
            } else if (response.knowledgeBaseDocuments) {
                setDocuments(response.knowledgeBaseDocuments);
            } else {
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchPrompts();
            fetchKnowledgeBases();
            fetchOntologies();
            fetchIntents();
            fetchDocuments();
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
        <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                            <FiFileText className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Prompt Lab</h1>
                            <p className="text-sm text-gray-500">Manage AI prompts</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNewPrompt}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <FiPlus size={16} />
                        New Prompt
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                    {/* Tabs */}
                    <div className="p-2 border-b border-gray-200 bg-gray-50">
                        <div className="flex bg-gray-200/50 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('prompts')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'prompts' ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-500 hover:text-blue-900 hover:bg-gray-100'}`}
                            >
                                Prompts
                            </button>
                            <button
                                onClick={() => setActiveTab('intents')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'intents' ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-500 hover:text-blue-900 hover:bg-gray-100'}`}
                            >
                                Intents
                            </button>
                            <button
                                onClick={() => setActiveTab('ontologies')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'ontologies' ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-500 hover:text-blue-900 hover:bg-gray-100'}`}
                            >
                                Ontology
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'documents' ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-500 hover:text-blue-900 hover:bg-gray-100'}`}
                            >
                                Docs
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white focus:border-blue-900 transition-all"
                            />
                            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {/* Prompts List */}
                        {activeTab === 'prompts' && Object.entries(promptsByCategory).map(([category, catPrompts]) => (
                            <div key={category} className="border-b border-gray-100">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white group"
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedCategories[category] ? <FiChevronDown size={14} className="text-gray-400 group-hover:text-blue-900" /> : <FiChevronRight size={14} className="text-gray-400 group-hover:text-blue-900" />}
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-900">{category}</span>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-900">{catPrompts.length}</span>
                                </button>

                                {expandedCategories[category] && (
                                    <div className="bg-gray-50">
                                        {catPrompts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelectPrompt(p)}
                                                className={`w-full text-left px-8 py-2.5 border-l-2 text-sm transition-all ${selectedPrompt?.id === p.id
                                                    ? 'bg-blue-50 border-blue-900 text-blue-900 font-medium'
                                                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                            >
                                                <div className="truncate">{p.title || 'Untitled'}</div>
                                                <div className="text-xs text-gray-400 truncate mt-0.5 font-normal">{p.id}</div>
                                                <div className="text-xs text-gray-400 truncate mt-1 opacity-70 font-normal">{p.promptText || 'No description'}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Intents List */}
                        {activeTab === 'intents' && (
                            <div className="bg-white">
                                {intents.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">No intents found.</div>
                                ) : (
                                    intents.filter(i => !searchQuery || i.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(intent => (
                                        <div key={intent.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="text-sm font-medium text-gray-800">{intent.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">{intent.description || 'No description'}</div>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                                                    {(intent.utterances?.length || 0) + ' utterances'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Ontologies List */}
                        {activeTab === 'ontologies' && (
                            <div className="bg-white">
                                {ontologies.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">No ontologies found.</div>
                                ) : (
                                    ontologies.filter(o => !searchQuery || o.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(ontology => (
                                        <div key={ontology.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="text-sm font-medium text-gray-800">{ontology.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">{ontology.description || 'No description'}</div>
                                            <div className="text-xs text-gray-400 mt-1">ID: {ontology.id}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Documents List */}
                        {activeTab === 'documents' && (
                            <div className="bg-white">
                                {documents.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">No documents found.</div>
                                ) : (
                                    documents.filter(d => !searchQuery || d.documentName?.toLowerCase().includes(searchQuery.toLowerCase())).map(doc => (
                                        <div key={doc.id || doc.documentId} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="text-sm font-medium text-gray-800">{doc.documentName || doc.name || 'Untitled Document'}</div>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs text-gray-500">{doc.documentType || 'Unknown Type'}</span>
                                                {doc.status && <span className="text-xs bg-green-50 text-green-600 px-1.5 rounded">{doc.status}</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex flex-col bg-white shadow-sm">
                    {(selectedPrompt || isNewPrompt) ? (
                        <>
                            {/* Toolbar */}
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center gap-2">
                                    <FiCode className="text-gray-600" size={18} />
                                    <span className="font-medium text-gray-900">
                                        {isNewPrompt ? 'New Prompt' : `Prompt #${selectedPrompt?.id}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isNewPrompt && (
                                        <>
                                            <button onClick={handleCopyCurl} className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors" title="Copy cURL">
                                                <FiCopy size={16} />
                                            </button>
                                            <button onClick={handleClone} className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors" title="Clone">
                                                <FiLayers size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                <div className="p-6 max-w-5xl">
                                    {message && (
                                        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                            }`}>
                                            {message.type === 'success' ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                                            <span className="text-sm">{message.text}</span>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Text</label>
                                            <textarea
                                                value={formData.promptText || ''}
                                                onChange={(e) => handleInputChange('promptText', e.target.value)}
                                                rows={12}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all"
                                                placeholder="Enter your prompt with $parameters..."
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={handleRun}
                                                disabled={running || !formData.promptText}
                                                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                            >
                                                {running && !selectedPrompt ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiPlay size={14} />}
                                                Run
                                            </button>
                                            {!isNewPrompt && (
                                                <button
                                                    onClick={handleExecute}
                                                    disabled={running}
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                                >
                                                    {running && selectedPrompt ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiZap size={14} />}
                                                    Execute
                                                </button>
                                            )}
                                            <div className="flex-1"></div>
                                            {!isNewPrompt && (
                                                <button onClick={handleDelete} disabled={loading} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 hover:border-red-300 disabled:opacity-50 transition-all">
                                                    Delete
                                                </button>
                                            )}
                                            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 shadow-sm hover:shadow transition-all flex items-center gap-2">
                                                {loading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <FiSave size={14} />}
                                                {isNewPrompt ? 'Create' : 'Save'}
                                            </button>
                                        </div>

                                        {/* Response */}
                                        <div className="pt-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FiTerminal size={16} />
                                                <h3 className="text-sm font-medium text-gray-900">Response</h3>
                                            </div>
                                            {runResult ? (
                                                <div className="bg-gray-900 rounded-xl p-5 relative shadow-lg">
                                                    <button onClick={() => setRunResult(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white">
                                                        <FiX size={16} />
                                                    </button>
                                                    <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
                                                        {JSON.stringify(runResult, null, 2)}
                                                    </pre>
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
                                                    <div className="text-gray-400 mb-2">
                                                        {running ? <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /> : <FiPlay size={32} className="mx-auto" />}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{running ? 'Processing...' : 'Run prompt to see results'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                                    <FiLayers size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Prompt Selected</h3>
                                <p className="text-sm text-gray-500 mb-4">Select a prompt from the list or create a new one</p>
                                <button onClick={handleNewPrompt} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2">
                                    <FiPlusCircle size={16} />
                                    Create New Prompt
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                {(selectedPrompt || isNewPrompt) && (
                    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-sm">
                        <div className="p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Configuration</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all"
                                        placeholder="Prompt title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type || ''}
                                        onChange={(e) => handleInputChange('type', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all"
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="Extraction">Extraction</option>
                                        <option value="Generation">Generation</option>
                                        <option value="Classification">Classification</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                                    <select
                                        value={formData.modelId || ''}
                                        onChange={(e) => handleInputChange('modelId', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all"
                                    >
                                        <option value={391}>TeleperformancePublicLLM (391)</option>
                                        <option value={400}>GPT-4o (400)</option>
                                        <option value={500}>Claude-3.5-Sonnet (500)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Knowledge Base</label>
                                    <select
                                        value={formData.knowledgeBaseId || ''}
                                        onChange={(e) => handleInputChange('knowledgeBaseId', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all"
                                    >
                                        <option value="">None</option>
                                        {knowledgeBases.map(kb => (
                                            <option key={kb.knowledgeBaseId} value={kb.knowledgeBaseId}>
                                                {kb.knowledgeBaseName} ({kb.knowledgeBaseId})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-semibold text-gray-900">Parameters</h4>
                                        <button onClick={handleAddParam} className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                            + Add
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {Object.keys(formData.requestParams || {}).map(param => (
                                            <div key={param}>
                                                <button
                                                    onClick={() => setActiveParam(param)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all ${activeParam === param ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                                                        }`}
                                                >
                                                    <span className="font-medium">{param}</span>
                                                    <FiX
                                                        size={14}
                                                        className="text-gray-400 hover:text-red-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveParam(param);
                                                        }}
                                                    />
                                                </button>
                                                {activeParam === param && (
                                                    <textarea
                                                        value={formData.requestParams?.[activeParam] || ''}
                                                        onChange={(e) => handleParamValueChange(activeParam, e.target.value)}
                                                        rows={6}
                                                        className="w-full mt-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all font-mono"
                                                        placeholder={`Value for ${activeParam}...`}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        {Object.keys(formData.requestParams || {}).length === 0 && (
                                            <p className="text-xs text-gray-500 text-center py-4">No parameters</p>
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

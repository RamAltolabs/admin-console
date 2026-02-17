import React, { useState, useEffect } from 'react';
import {
    FiServer, FiRefreshCw, FiPlus, FiTerminal, FiDatabase,
    FiFileText, FiMoreHorizontal, FiInfo, FiEdit2, FiTrash2,
    FiPlayCircle, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
    FiColumns, FiCpu, FiGlobe, FiDatabase as FiDb, FiArrowLeft, FiBook, FiExternalLink, FiFolder, FiEye
} from 'react-icons/fi';
import merchantService from '../services/merchantService';
import CreateKBModal from './CreateKBModal';
import CreateModelModal from './CreateModelModal';
import CreateDocumentModal from './CreateDocumentModal';
import EditKnowledgeBaseModal from './EditKnowledgeBaseModal';

interface AIModelCardProps {
    merchantId: string;
    cluster?: string;
    initialTab?: string;
}

type ViewState = 'models' | 'kbs' | 'docs';

const AIModelCard: React.FC<AIModelCardProps> = ({ merchantId, cluster, initialTab = 'Private Model' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [viewState, setViewState] = useState<ViewState>('models');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]); // Generic for models, KBs, or Docs
    const [modelsList, setModelsList] = useState<any[]>([]); // To persist models for the modal
    const [pageIndex, setPageIndex] = useState(0);
    const [pageCount, setPageCount] = useState(50);
    const [totalElements, setTotalElements] = useState(0);

    // Drill-down selection state
    const [selectedModel, setSelectedModel] = useState<any>(null);
    const [selectedKB, setSelectedKB] = useState<any>(null);
    const [kbList, setKbList] = useState<any[]>([]); // To persist KBs for the modal

    // Modal state
    const [isKBModalOpen, setIsKBModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isEditKBModalOpen, setIsEditKBModalOpen] = useState(false);
    const [editingKB, setEditingKB] = useState<any>(null);

    const tabs = [
        'Model Management', 'Private Model', 'ML Models',
        'Knowledge Base', 'Documents'
    ];

    const LLM_PROVIDERS = [
        'OPENAI', 'GOOGLEAI', 'LLAMA3', 'AZUREAI', 'BEDROCK', 'CLAUDEAI',
        'PERPLEXITYAI', 'DEEPSEEKAI', 'MISTRALAI', 'IBMWATSONX', 'COHERE',
        'HUGGINGFACE', 'ELEVENLABS', 'VISIONAI'
    ];

    const ML_PROVIDERS = ['MONDEEAI', 'WATSONAI'];

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return dateStr;
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (viewState === 'models') {
                let modelType = activeTab === 'Private Model' ? 'PRIVATE_LLM' :
                    activeTab === 'Model Management' ? 'PUBLIC_LLM' : undefined;

                const providers = (activeTab === 'ML Models') ? ML_PROVIDERS : LLM_PROVIDERS;

                const response = await merchantService.getModelDetails(
                    merchantId,
                    providers,
                    modelType,
                    pageIndex,
                    pageCount,
                    cluster
                );

                if (response && typeof response === 'object') {
                    const modelList = response.models || response.content || response.data || [];
                    setData(Array.isArray(modelList) ? modelList : []);
                    setModelsList(Array.isArray(modelList) ? modelList : []);
                    setTotalElements(response.totalElements || (Array.isArray(modelList) ? modelList.length : 0));
                } else if (Array.isArray(response)) {
                    setData(response);
                    setModelsList(response);
                    setTotalElements(response.length);
                }
            } else if (viewState === 'kbs' && selectedModel) {
                // Try specialized endpoint first, fallback to filtering all KBs
                let kbListRes: any[] = [];
                try {
                    const modelId = selectedModel.modelId || selectedModel.id;
                    const response = await merchantService.getKnowledgeBasesByModel(modelId, cluster);
                    kbListRes = Array.isArray(response) ? response : (response.content || response.data || []);
                } catch (e) {
                    console.warn('Specialized KB endpoint failed, falling back to full list filtering');
                }

                if (kbListRes.length === 0) {
                    const fullKBs = await merchantService.getKnowledgeBases(merchantId, 0, 1000, cluster);
                    const allKBs = fullKBs.content || [];
                    setKbList(allKBs);
                    const modelIdValue = String(selectedModel.modelId || selectedModel.id);
                    kbListRes = allKBs.filter((kb: any) =>
                        String(kb.modelId) === modelIdValue ||
                        String(kb.id) === modelIdValue ||
                        kb.modelName === selectedModel.modelName
                    );
                } else {
                    setKbList(kbListRes);
                }

                setData(kbListRes);
                setTotalElements(kbListRes.length);
            } else if (viewState === 'docs' && selectedKB) {
                console.log('Fetching documents for KB:', selectedKB);
                // Try specialized endpoint first, fallback to filtering all docs
                let docList: any[] = [];
                try {
                    const kbId = selectedKB.knowledgeBaseId || selectedKB.id;
                    const response = await merchantService.getDocumentsByKB(kbId, cluster);
                    docList = Array.isArray(response) ? response : (response.content || response.data || []);
                } catch (e) {
                    console.warn('Specialized Docs endpoint failed, falling back to full list filtering');
                }

                if (docList.length === 0) {
                    const fullDocs = await merchantService.getDocuments(merchantId, 0, 1000, cluster);
                    const allDocs = fullDocs.documents || fullDocs.content || fullDocs.data || [];
                    const kbIdValue = String(selectedKB.knowledgeBaseId || selectedKB.id || '');
                    const kbNameValue = (selectedKB.knowledgeBaseName || selectedKB.name || '').toLowerCase();

                    console.log(`Filtering ${allDocs.length} docs for KB ID: ${kbIdValue}, Name: ${kbNameValue}`);

                    docList = allDocs.filter((doc: any) => {
                        const dKbId = String(doc.knowledgeBaseId || doc.kbId || doc.id || '');
                        const dKbName = (doc.knowledgeBaseName || doc.name || '').toLowerCase();

                        const idMatch = kbIdValue && dKbId === kbIdValue;
                        const nameMatch = kbNameValue && dKbName === kbNameValue;

                        return idMatch || nameMatch;
                    });

                    console.log(`Match found: ${docList.length} documents`);
                }
                setData(docList);
                setTotalElements(docList.length);
            }
        } catch (error) {
            console.error(`Error fetching ${viewState}: `, error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchData();
        }
    }, [merchantId, activeTab, viewState, pageIndex, selectedModel, selectedKB]);

    const handleModelClick = (model: any) => {
        console.log('Navigating to KBs for model:', model);
        setSelectedModel(model);
        setViewState('kbs');
        setPageIndex(0);
    };

    const handleKBClick = (kb: any) => {
        console.log('Navigating to Docs for KB:', kb);
        setSelectedKB(kb);
        setViewState('docs');
        setPageIndex(0);
    };

    const handleBack = () => {
        if (viewState === 'docs') {
            setViewState('kbs');
        } else if (viewState === 'kbs') {
            setViewState('models');
        }
    };

    const handleTrainModel = async (model: any) => {
        try {
            await merchantService.trainAIModel(merchantId, model.modelId, cluster);
            alert('Training started successfully!');
            fetchData();
        } catch (error) {
            alert('Failed to start training.');
        }
    };

    const handleDeleteModel = async (model: any) => {
        if (!window.confirm(`Are you sure you want to delete ${model.modelName || 'this model'}?`)) return;
        try {
            await merchantService.deleteAIModel(model.modelId, merchantId, cluster);
            alert('Model deleted.');
            fetchData();
        } catch (error) {
            alert('Failed to delete model.');
        }
    };

    const handleCreateModel = () => {
        setIsModelModalOpen(true);
    };

    const handleAddKB = () => {
        setIsKBModalOpen(true);
    };

    const handleAddDocument = async () => {
        if (kbList.length === 0) {
            try {
                const fullKBs = await merchantService.getKnowledgeBases(merchantId, 0, 1000, cluster);
                const allKBs = fullKBs.content || [];
                setKbList(allKBs);
            } catch (error) {
                console.error('Error fetching KBs for modal:', error);
            }
        }
        setIsDocModalOpen(true);
    };

    const handleEditKB = (kb: any) => {
        setEditingKB(kb);
        setIsEditKBModalOpen(true);
    };

    const handleDeleteKB = async (kb: any) => {
        if (!kb.id) {
            alert('Cannot delete: Knowledge Base ID is missing');
            return;
        }

        const kbName = kb.knowledgeBaseName || kb.name || 'this knowledge base';
        const confirmed = window.confirm(`Are you sure you want to delete "${kbName}"? This action cannot be undone.`);

        if (!confirmed) return;

        try {
            setLoading(true);
            await merchantService.deleteKnowledgeBase(merchantId, kb.id, cluster);

            // Refresh the list after successful deletion
            await fetchData();

            alert(`Successfully deleted "${kbName}"`);
        } catch (error) {
            console.error('Error deleting knowledge base:', error);
            alert(`Failed to delete "${kbName}". Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSuccess = () => {
        fetchData();
    };

    const renderHeaderTitle = () => {
        if (viewState === 'docs') {
            return (
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        Documents <FiInfo className="ml-2 text-gray-400 cursor-help" size={14} title="Manage knowledge base documents" />
                    </h3>
                </div>
            );
        }
        if (viewState === 'kbs') {
            return (
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        Knowledge Bases <FiInfo className="ml-2 text-gray-400 cursor-help" size={14} title="Manage model knowledge bases" />
                    </h3>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">{activeTab === 'Model Management' ? 'Public Models' : activeTab === 'Private Model' ? 'GenAI Models' : 'ML Models'}</h2>
                <FiInfo className="text-gray-400 cursor-help" size={14} />
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 p-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#1a365d] tracking-tight flex items-center gap-2">
                        <FiCpu className="text-blue-600" /> Model Management
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Configure and manage your Generative AI and ML Model ecosystem.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    {['Model Management', 'ML Models', 'Private Model'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setViewState('models');
                                setPageIndex(0);
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab
                                ? 'bg-[#1a365d] text-white shadow-md'
                                : 'text-gray-500 hover:text-[#1a365d] hover:bg-gray-50'
                                }`}
                        >
                            {tab === 'Model Management' ? 'Generative AI' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden min-h-[600px] flex flex-col relative">
                {/* Status Bar / Breadcrumbs */}
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-1">
                        {renderHeaderTitle()}
                    </div>

                    <div className="flex items-center gap-3">
                        {viewState === 'models' && (
                            <button
                                onClick={handleCreateModel}
                                className="px-4 py-2 rounded-lg text-xs font-bold transition-all bg-[#1a365d] text-white shadow-md flex items-center gap-2 active:scale-95"
                            >
                                <FiPlus size={14} /> Create New Model
                            </button>
                        )}
                        {viewState === 'kbs' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleAddKB}
                                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all bg-blue-900 text-white shadow-md flex items-center gap-2 active:scale-95"
                                >
                                    <FiPlus size={14} /> Add Knowledge Base
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <FiArrowLeft size={14} /> Back
                                </button>
                            </div>
                        )}
                        {viewState === 'docs' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleAddDocument}
                                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all bg-blue-900 text-white shadow-md flex items-center gap-2 active:scale-95"
                                >
                                    <FiPlus size={14} /> Add Document
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <FiArrowLeft size={14} /> Back
                                </button>
                            </div>
                        )}
                        <button
                            onClick={fetchData}
                            className={`p-2 bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm ${loading ? 'opacity-50' : ''}`}
                            title="Refresh Data"
                        >
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto relative">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-[#f8fafc] border-b border-gray-200 sticky top-0 z-10">
                            {viewState === 'models' ? (
                                <tr>
                                    <th className="w-24 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider">Action</th>
                                    <th className="w-64 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Model Name</th>
                                    <th className="w-28 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100 text-center">KB</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Training Status</th>
                                    <th className="w-32 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100 text-center">Training</th>
                                    <th className="w-36 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">AI Platform</th>
                                    <th className="w-36 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Created By</th>
                                    <th className="w-56 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Created Date</th>
                                </tr>
                            ) : viewState === 'kbs' ? (
                                <tr>
                                    <th className="w-24 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider">Action</th>
                                    <th className="w-64 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Knowledge Base</th>
                                    <th className="w-28 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100 text-center">Documents</th>
                                    <th className="w-64 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Description</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Model</th>
                                    <th className="w-36 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Created By</th>
                                    <th className="w-48 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Created Date</th>
                                    <th className="w-48 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Updated Date</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Training Status</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="w-24 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider">Action</th>
                                    <th className="w-64 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Document</th>
                                    <th className="w-80 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100 italic">URI</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Document Type</th>
                                    <th className="w-32 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100 text-center">File Type</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Knowledge Base</th>
                                    <th className="w-56 px-4 py-3 text-[10px] font-bold text-gray-500 titlecase tracking-wider border-l border-gray-100">Created Date</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-gray-50">
                                        <td colSpan={8} className="px-4 py-4">
                                            <div className="h-4 bg-gray-50 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : data.length > 0 ? (
                                data.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all group">
                                        {viewState !== 'kbs' && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {viewState === 'models' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleModelClick(item); }}
                                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="View Knowledge Bases"
                                                        >
                                                            <FiDatabase size={14} />
                                                        </button>
                                                    )}
                                                    <>
                                                        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                            <FiEdit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (viewState === 'models') handleDeleteModel(item);
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </>
                                                </div>
                                            </td>
                                        )}

                                        {viewState === 'models' && (
                                            <>
                                                <td
                                                    className="px-6 py-4 text-sm font-bold text-blue-900 border-l border-gray-50 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                                    title={item.modelName}
                                                    onClick={() => handleModelClick(item)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {item.modelName || item.identifier || 'Unnamed Model'}
                                                        {item.modelType === 'PRIVATE_LLM' && (
                                                            <span className="bg-blue-900 text-white text-[8px] px-1 rounded uppercase tracking-tighter">Private</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center border-l border-gray-50">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleModelClick(item); }}
                                                        className="inline-flex p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm hover:bg-blue-100 transition-all active:scale-95"
                                                        title="View Knowledge Bases"
                                                    >
                                                        <FiDb size={16} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-xs font-bold border-l border-gray-50 px-6">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider ${!item.aiTrainingStatus || item.aiTrainingStatus === 'NA'
                                                        ? 'bg-gray-100 text-gray-500'
                                                        : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${!item.aiTrainingStatus || item.aiTrainingStatus === 'NA' ? 'bg-gray-400' : 'bg-green-500'
                                                            }`} />
                                                        {item.aiTrainingStatus || 'Ready'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center border-l border-gray-50 px-6">
                                                    {item.modelType === 'PUBLIC_LLM' ? (
                                                        <span className="text-[10px] text-gray-400 font-medium italic">Standard Model</span>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTrainModel(item);
                                                            }}
                                                            className="px-4 py-1.5 bg-[#1a365d] text-white text-[10px] font-black titlecase rounded-lg hover:bg-blue-900 transition-all shadow-md active:scale-95"
                                                        >
                                                            {item.actionLabel || item.buttonText || item.action || 'Train'}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-xs text-gray-700 border-l border-gray-50 font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                                                            <FiGlobe className="text-gray-400" size={12} />
                                                        </div>
                                                        {item.aiSystems?.[0]?.ai || item.provider || 'OpenAI'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-gray-600 border-l border-gray-50 font-medium truncate">
                                                    {item.createdBy || 'System'}
                                                </td>
                                                <td className="px-4 py-4 text-[11px] text-gray-500 border-l border-gray-50 tabular-nums font-medium">
                                                    {formatDate(item.createdDate || item.createdAt)}
                                                </td>
                                            </>
                                        )}

                                        {viewState === 'kbs' && (
                                            <>
                                                <td className="px-4 py-4 border-l border-gray-50">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditKB(item); }}
                                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteKB(item); }}
                                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-blue-900 border-l border-gray-50 truncate">
                                                    {item.knowledgeBaseName || item.name || 'Untitled KB'}
                                                </td>
                                                <td className="px-4 py-4 text-center border-l border-gray-50">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleKBClick(item); }}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors group"
                                                        title={`View ${item.documentCount || 0} documents`}
                                                    >
                                                        <FiFolder size={18} className="group-hover:scale-110 transition-transform" />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-gray-600 border-l border-gray-50">
                                                    {item.knowledgeBaseDesc || item.description || 'This knowledge is used for...'}
                                                </td>
                                                <td className="px-4 py-4 text-xs font-semibold text-gray-700 border-l border-gray-50">
                                                    {item.model || 'NOC_Public_LLM'}
                                                </td>
                                                <td className="px-4 py-4 text-xs text-gray-600 border-l border-gray-50">
                                                    {item.createdBy || 'meiyaps noc'}
                                                </td>
                                                <td className="px-4 py-4 text-[11px] text-gray-500 border-l border-gray-50 tabular-nums font-medium">
                                                    {item.createdDate ? new Date(item.createdDate).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 text-[11px] text-gray-500 border-l border-gray-50 tabular-nums font-medium">
                                                    {(item.updatedDate || item.modifiedDate) ? new Date(item.updatedDate || item.modifiedDate).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 border-l border-gray-50">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${!item.aiTrainingStatus || item.aiTrainingStatus === 'NA' || item.aiTrainingStatus === 'Not Trained'
                                                        ? 'bg-gray-100 text-gray-500'
                                                        : item.aiTrainingStatus === 'Trained' || item.aiTrainingStatus === 'Ready'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${!item.aiTrainingStatus || item.aiTrainingStatus === 'NA' || item.aiTrainingStatus === 'Not Trained'
                                                            ? 'bg-gray-400'
                                                            : item.aiTrainingStatus === 'Trained' || item.aiTrainingStatus === 'Ready'
                                                                ? 'bg-green-500'
                                                                : 'bg-blue-500'
                                                            }`} />
                                                        {item.aiTrainingStatus || 'Not Trained'}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {viewState === 'docs' && (
                                            <>
                                                <td className="px-6 py-4 text-sm font-bold text-blue-600 hover:underline cursor-pointer border-l border-gray-50 truncate" title={item.documentName || item.name}>
                                                    {item.documentName || item.name || 'Document'}
                                                </td>
                                                <td className="px-4 py-4 text-xs italic text-blue-500 border-l border-gray-50 truncate font-medium">
                                                    {item.documentParams?.docLocation || item.uri ? (
                                                        <a
                                                            href={item.documentParams?.docLocation || item.uri}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 hover:underline underline-offset-2"
                                                        >
                                                            {item.documentParams?.docLocation || item.uri}
                                                            <FiExternalLink size={10} />
                                                        </a>
                                                    ) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 text-xs font-bold text-gray-700 border-l border-gray-50">
                                                    {item.documentType || 'Document'}
                                                </td>
                                                <td className="px-4 py-4 text-xs font-black text-gray-900 border-l border-gray-50 text-center uppercase tracking-tighter">
                                                    {item.documentParams?.docType || item.fileType || 'PDF'}
                                                </td>
                                                <td className="px-4 py-4 text-xs font-bold text-gray-500 border-l border-gray-50">
                                                    {item.knowledgeBaseName || selectedKB?.knowledgeBaseName || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 text-[11px] text-gray-500 border-l border-gray-50 tabular-nums font-medium">
                                                    {formatDate(item.createdDate || item.uploadedDate || item.modifiedDate)}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-50 rounded-full">
                                                <FiServer size={32} className="text-gray-300" />
                                            </div>
                                            <p className="text-sm text-gray-400 italic font-medium">No results discovered in this view.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Right Columns tab sidebar - Only for Models view */}
                    {viewState === 'models' && (
                        <div className="absolute right-0 top-0 h-full w-6 bg-gray-50 border-l border-gray-100 flex flex-col items-center py-4 gap-2 z-20">
                            <span className="[writing-mode:vertical-lr] text-[10px] font-bold text-gray-400 flex items-center gap-1 titlecase tracking-widest">
                                <FiColumns className="rotate-90" /> Columns
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between mt-auto">
                    <div className="text-[10px] font-bold text-gray-500 titlecase tracking-widest">
                        {totalElements > 0 ? (
                            `${pageIndex * pageCount + 1} to ${Math.min((pageIndex + 1) * pageCount, totalElements)} of ${totalElements} `
                        ) : '0 to 0 of 0'}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPageIndex(0)}
                                disabled={pageIndex === 0}
                                className="p-1.5 text-gray-400 hover:text-[#1a365d] disabled:opacity-30 transition-colors"
                            >
                                <FiChevronsLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                                disabled={pageIndex === 0}
                                className="p-1.5 text-gray-400 hover:text-[#1a365d] disabled:opacity-30 transition-colors"
                            >
                                <FiChevronLeft size={16} />
                            </button>
                            <div className="flex items-center gap-1.5 mx-2">
                                <span className="text-[10px] font-bold text-gray-400 titlecase">Page</span>
                                <span className="bg-white px-2 py-0.5 border border-gray-200 rounded text-[10px] font-bold text-[#1a365d] shadow-sm">
                                    {pageIndex + 1}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 titlecase">of</span>
                                <span className="text-[10px] font-bold text-gray-600">{Math.ceil(totalElements / pageCount) || 1}</span>
                            </div>
                            <button
                                onClick={() => setPageIndex(p => p + 1)}
                                disabled={(pageIndex + 1) * pageCount >= totalElements}
                                className="p-1.5 text-gray-400 hover:text-[#1a365d] disabled:opacity-30 transition-colors"
                            >
                                <FiChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => setPageIndex(Math.max(0, Math.ceil(totalElements / pageCount) - 1))}
                                disabled={(pageIndex + 1) * pageCount >= totalElements}
                                className="p-1.5 text-gray-400 hover:text-[#1a365d] disabled:opacity-30 transition-colors"
                            >
                                <FiChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Create KB Modal */}
            <CreateKBModal
                isOpen={isKBModalOpen}
                onClose={() => setIsKBModalOpen(false)}
                merchantId={merchantId}
                cluster={cluster}
                models={modelsList}
                onSuccess={fetchData}
                preSelectedModelId={selectedModel?.modelId || selectedModel?.id}
            />
            {/* Create Document Modal */}
            <CreateDocumentModal
                isOpen={isDocModalOpen}
                onClose={() => setIsDocModalOpen(false)}
                merchantId={merchantId}
                cluster={cluster}
                knowledgeBases={kbList}
                onSuccess={fetchData}
                preSelectedKBId={selectedKB?.knowledgeBaseId || selectedKB?.id}
            />
            {/* Create Model Modal */}
            <CreateModelModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                merchantId={merchantId}
                cluster={cluster}
                modelType={activeTab === 'Private Model' ? 'PRIVATE_LLM' : 'PUBLIC_LLM'}
                onSuccess={fetchData}
            />
            {/* Edit KB Modal */}
            <EditKnowledgeBaseModal
                isOpen={isEditKBModalOpen}
                onClose={() => setIsEditKBModalOpen(false)}
                kb={editingKB}
                merchantId={merchantId}
                cluster={cluster}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
};

export default AIModelCard;

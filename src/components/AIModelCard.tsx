import React, { useState, useEffect } from 'react';
import {
    FiServer, FiRefreshCw, FiPlus, FiTerminal, FiDatabase,
    FiFileText, FiMoreHorizontal, FiInfo, FiEdit2, FiTrash2,
    FiPlayCircle, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
    FiColumns, FiCpu, FiGlobe, FiDatabase as FiDb, FiArrowLeft, FiBook
} from 'react-icons/fi';
import merchantService from '../services/merchantService';
import CreateKBModal from './CreateKBModal';
import CreateModelModal from './CreateModelModal';

interface AIModelCardProps {
    merchantId: string;
    cluster?: string;
    initialTab?: string;
}

type ViewState = 'models' | 'kbs' | 'docs';

const AIModelCard: React.FC<AIModelCardProps> = ({ merchantId, cluster, initialTab = 'Private LLM' }) => {
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

    // Modal state
    const [isKBModalOpen, setIsKBModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);

    const tabs = [
        'Model Management', 'Private LLM', 'ML Models',
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
                let modelType = activeTab === 'Private LLM' ? 'PRIVATE_LLM' :
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
            } else if (viewState === 'kbs') {
                const response = await merchantService.getKnowledgeBasesByModel(selectedModel.modelId, cluster);
                const kbList = Array.isArray(response) ? response : (response.content || response.data || []);
                setData(kbList);
                setTotalElements(kbList.length);
            } else if (viewState === 'docs') {
                const response = await merchantService.getDocumentsByKB(selectedKB.id || selectedKB.knowledgeBaseId, cluster);
                const docList = Array.isArray(response) ? response : (response.content || response.data || []);
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
    }, [merchantId, activeTab, viewState, pageIndex]);

    const handleModelClick = (model: any) => {
        setSelectedModel(model);
        setViewState('kbs');
        setPageIndex(0);
    };

    const handleKBClick = (kb: any) => {
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

    const renderHeaderTitle = () => {
        if (viewState === 'docs') {
            return (
                <div className="flex items-center gap-2">
                    <button onClick={handleBack} className="p-1 hover:bg-gray-100 rounded-full transition-all">
                        <FiArrowLeft size={18} className="text-[#1a365d]" />
                    </button>
                    <span className="text-gray-400 font-medium">Model</span>
                    <FiChevronRight size={14} className="text-gray-300" />
                    <span className="text-gray-400 font-medium truncate max-w-[100px]">{selectedModel?.modelName}</span>
                    <FiChevronRight size={14} className="text-gray-300" />
                    <span className="text-gray-400 font-medium">KBs</span>
                    <FiChevronRight size={14} className="text-gray-300" />
                    <span className="text-gray-800 font-bold">{selectedKB?.knowledgeBaseName || 'Documents'}</span>
                </div>
            );
        }
        if (viewState === 'kbs') {
            return (
                <div className="flex items-center gap-2">
                    <button onClick={handleBack} className="p-1 hover:bg-gray-100 rounded-full transition-all">
                        <FiArrowLeft size={18} className="text-[#1a365d]" />
                    </button>
                    <span className="text-gray-400 font-medium">Model</span>
                    <FiChevronRight size={14} className="text-gray-300" />
                    <span className="text-gray-800 font-bold">{selectedModel?.modelName || 'Knowledge Bases'}</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">{activeTab}</h2>
                <FiInfo className="text-gray-400 cursor-help" size={14} />
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Main Content Area */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[550px] flex flex-col relative transition-all duration-300">
                {/* Header Section */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30 border-b border-gray-100">
                    {renderHeaderTitle()}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddKB}
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                        >
                            <FiPlus size={16} /> Add Knowledge Base
                        </button>
                        <button
                            onClick={handleCreateModel}
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                        >
                            <FiPlus size={16} /> Create Model
                        </button>
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto relative">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-[#f8fafc] border-b border-gray-200 sticky top-0 z-10">
                            {viewState === 'models' ? (
                                <tr>
                                    <th className="w-24 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="w-64 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Model Name</th>
                                    <th className="w-28 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100 text-center">KB</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Training Status</th>
                                    <th className="w-32 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100 text-center">Training</th>
                                    <th className="w-36 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">AI Platform</th>
                                    <th className="w-36 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Created By</th>
                                    <th className="w-56 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Created Date</th>
                                </tr>
                            ) : viewState === 'kbs' ? (
                                <tr>
                                    <th className="w-24 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="w-full px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Knowledge Base Name</th>
                                    <th className="w-32 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100 text-center">Docs</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Category</th>
                                    <th className="w-56 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Updated Date</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="w-24 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="w-full px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Document Name</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Type</th>
                                    <th className="w-40 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Size</th>
                                    <th className="w-56 px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100">Uploaded Date</th>
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
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => viewState === 'models' ? handleDeleteModel(item) : null}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>

                                        {viewState === 'models' && (
                                            <>
                                                <td
                                                    className="px-4 py-3 text-xs font-bold text-indigo-700 border-l border-gray-50 truncate cursor-pointer hover:underline"
                                                    title={item.modelName}
                                                    onClick={() => handleModelClick(item)}
                                                >
                                                    {item.modelName || item.identifier || 'Unnamed Model'}
                                                </td>
                                                <td className="px-4 py-3 text-center border-l border-gray-50">
                                                    <button
                                                        onClick={() => handleModelClick(item)}
                                                        className="inline-flex p-1.5 bg-blue-50 text-blue-500 rounded-lg border border-blue-100 shadow-sm hover:bg-blue-100 transition-all"
                                                    >
                                                        <FiDb size={14} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold text-gray-600 border-l border-gray-50">
                                                    <span className={`uppercase tracking - tight inline - flex items - center px - 2 py - 0.5 rounded ${item.aiTrainingStatus === 'NA' ? 'text-gray-400' : 'text-blue-600 bg-blue-50'} `}>
                                                        {item.aiTrainingStatus || 'NA'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center border-l border-gray-50">
                                                    {item.modelType === 'PUBLIC_LLM' ? (
                                                        <span className="text-[10px] text-gray-400 italic">No Training</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleTrainModel(item)}
                                                            className="px-3 py-1 bg-[#1a365d] text-white text-[10px] font-bold rounded hover:bg-[#152c4d] transition-all shadow-sm active:scale-95"
                                                        >
                                                            Start Training
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-700 border-l border-gray-50 font-medium">
                                                    {item.aiSystems?.[0]?.ai || item.provider || 'OpenAI'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-700 border-l border-gray-50 font-medium truncate">
                                                    {item.createdBy || 'EHS llm'}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-gray-500 border-l border-gray-50 tabular-nums font-medium">
                                                    {formatDate(item.createdDate || item.createdAt)}
                                                </td>
                                            </>
                                        )}

                                        {viewState === 'kbs' && (
                                            <>
                                                <td
                                                    className="px-4 py-3 text-xs font-bold text-indigo-700 border-l border-gray-50 truncate cursor-pointer hover:underline"
                                                    onClick={() => handleKBClick(item)}
                                                >
                                                    {item.knowledgeBaseName || item.name || 'Unnamed KB'}
                                                </td>
                                                <td className="px-4 py-3 text-center border-l border-gray-50">
                                                    <button
                                                        onClick={() => handleKBClick(item)}
                                                        className="inline-flex p-1.5 bg-indigo-50 text-indigo-500 rounded-lg border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-all"
                                                    >
                                                        <FiFileText size={14} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-medium text-gray-600 border-l border-gray-50">
                                                    {item.category || item.type || 'General'}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-gray-500 border-l border-gray-50 tabular-nums font-medium">
                                                    {formatDate(item.updatedDate || item.modifiedDate)}
                                                </td>
                                            </>
                                        )}

                                        {viewState === 'docs' && (
                                            <>
                                                <td className="px-4 py-3 text-xs font-bold text-gray-700 border-l border-gray-50 truncate">
                                                    {item.documentName || item.fileName || 'Document.pdf'}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-medium text-gray-600 border-l border-gray-50 uppercase">
                                                    {item.type || 'PDF'}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-medium text-gray-600 border-l border-gray-50">
                                                    {item.size || '1.2 MB'}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-gray-500 border-l border-gray-50 tabular-nums font-medium">
                                                    {formatDate(item.uploadedDate || item.createdDate)}
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
                            <span className="[writing-mode:vertical-lr] text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                                <FiColumns className="rotate-90" /> Columns
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between mt-auto">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
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
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Page</span>
                                <span className="bg-white px-2 py-0.5 border border-gray-200 rounded text-[10px] font-bold text-[#1a365d] shadow-sm">
                                    {pageIndex + 1}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">of</span>
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
            />
            {/* Create Model Modal */}
            <CreateModelModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                merchantId={merchantId}
                cluster={cluster}
                modelType={activeTab === 'Private LLM' ? 'PRIVATE_LLM' : 'PUBLIC_LLM'}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default AIModelCard;

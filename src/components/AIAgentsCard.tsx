import React, { useState, useEffect } from 'react';
import { FiLayers, FiRefreshCw, FiUser, FiHash, FiBook, FiClock, FiEye, FiEdit2, FiSearch, FiFilter, FiTrash2, FiInfo, FiZap } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import AIAgentViewModal from './AIAgentViewModal';
import AIAgentFormModal from './AIAgentFormModal';

interface AIAgentsCardProps {
    merchantId: string;
    cluster?: string;
}

const AIAgentsCard: React.FC<AIAgentsCardProps> = ({ merchantId, cluster }) => {
    const [aiAgents, setAIAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Filtering state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const agents = await merchantService.getAIAgents(merchantId, cluster);
            setAIAgents(Array.isArray(agents) ? agents : []);
        } catch (error) {
            console.error('Error fetching AI agents:', error);
            setError('Failed to load AI agents records from the API.');
            setAIAgents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchData();
        }
    }, [merchantId]);

    const handleViewDetails = (agent: any) => {
        setSelectedAgent(agent);
        setIsViewModalOpen(true);
    };

    const handleEditAgent = (agent: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedAgent(agent);
        setIsEditModalOpen(true);
    };

    const handleUpdateAgent = async (payload: any) => {
        try {
            await merchantService.updateAIAgent(payload, cluster);
            await fetchData();
        } catch (error) {
            console.error('Failed to update agent:', error);
            throw error;
        }
    };

    const handleDeleteAgent = async (agent: any, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete AI Agent "${agent.identifier || agent.agentName}"?`)) {
            return;
        }

        setActionLoading(agent.id);
        setError(null);
        setSuccessMessage(null);

        try {
            await merchantService.deleteAIAgent(agent.id, cluster);
            setSuccessMessage(`AI Agent "${agent.identifier || agent.agentName}" deleted successfully`);
            await fetchData();
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            console.error('Failed to delete AI agent:', err);
            setError('Failed to delete AI agent');
        } finally {
            setActionLoading(null);
        }
    };

    // Filter Logic
    const filteredAgents = aiAgents.filter(agent => {
        const matchesSearch = (agent.identifier || agent.agentName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || agent.status?.toUpperCase() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Action Notifications */}
            {error && (
                <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <FiInfo size={16} />
                    </div>
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="p-4 bg-green-50 border-b border-green-100 text-green-600 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <FiZap size={16} className="text-green-600" />
                    </div>
                    {successMessage}
                </div>
            )}

            {/* Header with Filters */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <FiLayers className="text-blue-900" size={16} />
                    <h3 className="font-bold text-gray-800 text-sm">AI Agents</h3>
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-black rounded-md titlecase tracking-wider">
                        {filteredAgents.length} Agents
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative group flex-1 md:flex-none">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-48 outline-none"
                        />
                    </div>

                    {/* Filter Button Style */}
                    <div className="relative">
                        <button
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FiFilter size={14} />
                            {statusFilter === 'ALL' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase()}
                        </button>
                        {showFilters && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="text-[10px] font-black text-gray-400 titlecase tracking-widest mb-2 px-1">Filter by Status</div>
                                <div className="space-y-1">
                                    {['ALL', 'ACTIVE'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setShowFilters(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${statusFilter === status
                                                ? 'bg-blue-50 text-blue-900'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status === 'ALL' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="p-6 min-h-[200px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2 text-sm text-gray-500 font-medium">Loading AI agents...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAgents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAgents.map((agent, index) => {
                                    const agentTitle = agent.identifier || agent.agentName || 'AI Agent';
                                    const agentImg = (agent.agentImage && agent.agentImage[0]) || agent.image;
                                    const isActive = agent.status?.toUpperCase() === 'ACTIVE';

                                    return (
                                        <div key={agent.id || index} className="standard-tile relative group min-h-[105px] !p-3 !border-gray-200 !border-opacity-100 shadow-sm hover:shadow-md transition-all duration-300">
                                            {/* Circular Avatar with Status Indicator */}
                                            <div className="relative flex-shrink-0">
                                                <div className="standard-tile-avatar group-hover:scale-105 transition-transform overflow-hidden !w-12 !h-12">
                                                    {agentImg ? (
                                                        <img src={agentImg} alt={agentTitle} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FiUser size={20} />
                                                    )}
                                                </div>
                                                {/* Status Badge on Avatar */}
                                                <div className="absolute -top-1 -right-1">
                                                    <span className={`block w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-all ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} title={agent.status || 'Unknown'}></span>
                                                </div>
                                            </div>

                                            {/* Agent Details - Filled */}
                                            <div className="flex-grow min-w-0 pr-8">
                                                <h4 className="font-bold text-gray-800 text-sm truncate mb-0.5 leading-tight titlecase" title={agentTitle}>
                                                    {agentTitle}
                                                </h4>
                                                <div className="space-y-0.5 text-[10px]">
                                                    <p className="flex items-center gap-1.5">
                                                        <span className="text-gray-400 font-black titlecase tracking-widest">Persona:</span>
                                                        <span className="text-gray-500 font-bold truncate block max-w-[150px]">
                                                            {agent.persona || 'General Assistant'}
                                                        </span>
                                                    </p>
                                                    <p className="flex items-center gap-1.5">
                                                        <span className="text-gray-400 font-black titlecase tracking-widest">Lang:</span>
                                                        <span className="text-gray-500 font-bold">
                                                            {agent.language || 'en-US'}
                                                        </span>
                                                    </p>
                                                    {(agent.primaryKnowledgeBaseName || agent.knowledge || agent.knowledgeBaseName) && (
                                                        <p className="flex items-center gap-1.5 text-blue-900 mt-0.5 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50 w-fit">
                                                            <span className="text-blue-400 font-black titlecase tracking-widest bg-transparent px-0 py-0">KB:</span>
                                                            <span className="font-bold truncate block max-w-[140px]">
                                                                {agent.primaryKnowledgeBaseName || agent.knowledge || agent.knowledgeBaseName}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions Group - Fixed Bottom Right */}
                                            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 transition-all duration-300">
                                                {actionLoading === agent.id ? (
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                                                        <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleViewDetails(agent)}
                                                            className="tile-btn-view h-8 w-8 !px-0"
                                                            title="View Details"
                                                        >
                                                            <FiEye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleEditAgent(agent, e)}
                                                            className="tile-btn-edit h-8 w-8"
                                                            title="Edit Agent"
                                                        >
                                                            <FiEdit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteAgent(agent, e)}
                                                            className="tile-btn-delete h-8 w-8"
                                                            title="Delete Agent"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <FiFilter size={32} className="text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">
                                    {aiAgents.length > 0 ? "No agents match your current filters." : "No AI agents discovered for this merchant."}
                                </p>
                                {aiAgents.length > 0 && (
                                    <button
                                        onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                                        className="mt-4 text-[10px] font-bold text-indigo-600 titlecase tracking-widest hover:text-indigo-800 transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AIAgentViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                agent={selectedAgent}
            />

            <AIAgentFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdateAgent}
                agent={selectedAgent}
            />
        </div>
    );
};

export default AIAgentsCard;

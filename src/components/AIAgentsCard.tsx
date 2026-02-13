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

    const fetchData = async () => {
        setLoading(true);
        try {
            const agents = await merchantService.getAIAgents(merchantId, cluster);
            setAIAgents(Array.isArray(agents) ? agents : []);
        } catch (error) {
            console.error('Error fetching AI agents:', error);
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
                    <FiLayers className="text-indigo-600" />
                    <h3 className="font-bold text-gray-800">AI Agents</h3>
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                        {filteredAgents.length}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative group">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all w-48"
                        />
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="relative">
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer min-w-[120px]"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active Only</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>

                    <button
                        onClick={fetchData}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all border border-transparent hover:border-gray-100 shadow-sm hover:shadow-md"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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
                                        <div key={agent.id || index} className="standard-tile relative group min-h-[105px] !p-3">
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
                                                <h4 className="font-bold text-gray-800 text-[15px] truncate mb-0.5 leading-tight" title={agentTitle}>
                                                    {agentTitle}
                                                </h4>
                                                <div className="space-y-0.5 text-[11px]">
                                                    <p className="flex items-center gap-1.5">
                                                        <span className="text-gray-400 font-medium">Persona:</span>
                                                        <span className="text-gray-500 font-bold truncate block max-w-[150px]">
                                                            {agent.persona || 'General Assistant'}
                                                        </span>
                                                    </p>
                                                    <p className="flex items-center gap-1.5">
                                                        <span className="text-gray-400 font-medium">Lang:</span>
                                                        <span className="text-gray-500 font-bold">
                                                            {agent.language || 'en-US'}
                                                        </span>
                                                    </p>
                                                    {agent.primaryKnowledgeBaseName && (
                                                        <p className="flex items-center gap-1.5 text-indigo-600 mt-0.5">
                                                            <span className="text-indigo-400 font-medium">KB:</span>
                                                            <span className="font-bold truncate block max-w-[140px]">
                                                                {agent.primaryKnowledgeBaseName}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions Group - Ultra Compact */}
                                            <div className="absolute bottom-2 right-2.5 flex flex-col items-center gap-1.5 opacity-100">
                                                {actionLoading === agent.id ? (
                                                    <div className="p-0.5 border border-indigo-100 bg-white rounded flex items-center justify-center">
                                                        <div className="w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleViewDetails(agent)}
                                                            className="tile-btn-view"
                                                            title="View Details"
                                                        >
                                                            <FiEye size={10} />
                                                            <span className="hidden group-hover:block ml-1 text-[7px]">View</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleEditAgent(agent, e)}
                                                            className="tile-btn-edit"
                                                            title="Edit Agent"
                                                        >
                                                            <FiEdit2 size={10} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteAgent(agent, e)}
                                                            className="tile-btn-delete"
                                                            title="Delete Agent"
                                                        >
                                                            <FiTrash2 size={10} />
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
                                <p className="text-sm text-gray-500 font-medium italic">
                                    {aiAgents.length > 0 ? "No agents match your current filters." : "No AI agents discovered for this merchant."}
                                </p>
                                {aiAgents.length > 0 && (
                                    <button
                                        onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                                        className="mt-4 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
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

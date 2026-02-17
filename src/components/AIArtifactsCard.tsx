import React, { useState, useEffect } from 'react';
import {
    FiPackage, FiSearch, FiEye, FiActivity, FiCalendar,
    FiCpu, FiDatabase, FiShare2, FiArrowLeft, FiPlus,
    FiLayers, FiShoppingBag, FiCreditCard, FiSettings, FiGrid, FiArrowRight,
    FiRefreshCw
} from 'react-icons/fi';
import { AIArtifact } from '../types/merchant';
import merchantService from '../services/merchantService';
import AIArtifactViewModal from './AIArtifactViewModal';

interface AIArtifactsCardProps {
    merchantId: string;
    cluster?: string;
}

type Category = 'all' | 'models' | 'bots' | 'dataSources' | 'payments' | 'eCommerce' | 'integration' | 'service' | 'channel';

const AIArtifactsCard: React.FC<AIArtifactsCardProps> = ({ merchantId, cluster }) => {
    const [artifacts, setArtifacts] = useState<AIArtifact[]>([]);
    const [bots, setBots] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<Category>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArtifact, setSelectedArtifact] = useState<AIArtifact | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Parallel fetch for all data types if needed, though primarily artifacts
            const [artifactsData, botsData, modelsData] = await Promise.all([
                merchantService.getAIArtifactsList(merchantId, cluster),
                merchantService.getAIAgents(merchantId, cluster).catch(() => []),
                merchantService.getModelDetails(merchantId, ['OPENAI', 'GOOGLEAI'], undefined, 0, 10, cluster).catch(() => ({ models: [] }))
            ]);

            setArtifacts(Array.isArray(artifactsData) ? artifactsData : []);
            setBots(Array.isArray(botsData) ? botsData : []);

            // Extract models array from response
            const modelsArray = modelsData.models || modelsData.content || modelsData.data || (Array.isArray(modelsData) ? modelsData : []);
            setModels(modelsArray);

        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load some AI assets. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imagePath: string | undefined | null) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        const baseURL = 'https://it-inferno.neocloud.ai/';
        return `${baseURL}${imagePath}`;
    };

    useEffect(() => {
        if (merchantId) {
            fetchData();
        }
    }, [merchantId, cluster]);

    const handleViewArtifact = (artifact: AIArtifact) => {
        setSelectedArtifact(artifact);
        setIsModalOpen(true);
    };

    const handleRefresh = () => {
        fetchData();
        setIsModalOpen(false);
    };

    const filterByCategory = (cat: string) => {
        return artifacts.filter(a => (a.type || '').toLowerCase() === cat.toLowerCase());
    };

    const filteredArtifacts = artifacts.filter(item => {
        const matchesSearch = !searchQuery ||
            (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase()));

        if (activeCategory === 'all') return matchesSearch;
        return matchesSearch && (item.type || '').toLowerCase() === activeCategory.toLowerCase();
    });

    const categories = [
        { id: 'dataSources', label: 'Data Sources', icon: FiDatabase, color: 'blue' },
        { id: 'payments', label: 'Payments', icon: FiCreditCard, color: 'emerald' },
        { id: 'eCommerce', label: 'eCommerce', icon: FiShoppingBag, color: 'purple' },
        { id: 'integration', label: 'Integration', icon: FiShare2, color: 'orange' },
        { id: 'service', label: 'Service', icon: FiSettings, color: 'rose' },
        { id: 'channel', label: 'Channel', icon: FiGrid, color: 'indigo' },
    ];

    if (loading && artifacts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-900 font-bold">Initializing AI Artifactory...</p>
                <p className="text-gray-400 text-xs mt-1">Loading ML Models, Data Sources & Accelerators</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-in fade-in duration-500">
            {/* Scrollable Content Area */}
            <div className="p-6 space-y-8 overflow-y-auto max-h-[90vh] bg-gray-50/10">
                {activeCategory === 'all' ? (
                    <>
                        {/* Hero Section - Compact Branded Core */}
                        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-900 rounded-2xl px-6 py-5 text-white shadow-lg relative overflow-hidden group border border-white/5 mb-2">
                            {/* Integrated Refresh Action */}
                            <button
                                onClick={fetchData}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md border border-white/10 transition-all z-20 group/ref"
                                title="Refresh Repository"
                            >
                                <FiRefreshCw size={16} className={`${loading ? 'animate-spin text-blue-300' : 'text-blue-100'}`} />
                            </button>

                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>

                            <div className="relative z-10 flex items-center gap-6">
                                <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shrink-0 group-hover:scale-105 transition-transform duration-500">
                                    <FiCpu size={26} className="text-blue-200" />
                                </div>
                                <div className="max-w-3xl">
                                    <div className="flex flex-col mb-2">
                                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-[0.25em] opacity-80 mb-0.5">Asset Repository & Marketplace</p>
                                        <h1 className="text-2xl font-black tracking-tighter titlecase italic leading-none">AI Artifactory</h1>
                                    </div>
                                    <p className="text-blue-100/90 text-[11.5px] leading-tight font-medium max-w-2xl">
                                        Accelerate transformation with our <span className="text-white font-bold underline decoration-blue-400/40 underline-offset-4">Curated Repository</span> of ML Models, Bots, and Integrations for Enterprise AI.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Hero Grid Section - Matching App Alignment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Models Hub */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-900/30 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-[200px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FiCpu size={80} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-blue-50 text-blue-900 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-all transform group-hover:rotate-12">
                                            <FiCpu size={20} />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg tracking-tight">Models</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold leading-normal">
                                        Master Hub for LLMs & Custom Models. Track lineage and deployment across clusters.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('models')}
                                    className="flex items-center gap-2 text-blue-900 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all"
                                >
                                    Browse Models <FiArrowRight />
                                </button>
                            </div>

                            {/* Bots Hub */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-purple-900/30 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-[200px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FiActivity size={80} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-purple-50 text-purple-900 rounded-xl group-hover:bg-purple-900 group-hover:text-white transition-all transform group-hover:-rotate-12">
                                            <FiActivity size={20} />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg tracking-tight">Agents</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold leading-normal">
                                        Intelligent autonomous agents & virtual assistants for customer workflow automation.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('bots')}
                                    className="flex items-center gap-2 text-purple-900 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all"
                                >
                                    Scale Agents <FiArrowRight />
                                </button>
                            </div>

                            {/* Data Sources Hub */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-emerald-900/30 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-[200px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FiDatabase size={80} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl group-hover:bg-emerald-900 group-hover:text-white transition-all transform group-hover:scale-110">
                                            <FiDatabase size={20} />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg tracking-tight">Knowledge</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold leading-normal">
                                        Inbound data intelligence. Connect training sets for supervised learning.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('dataSources')}
                                    className="flex items-center gap-2 text-emerald-900 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all"
                                >
                                    Explore Data <FiArrowRight />
                                </button>
                            </div>

                            {/* Integration Hub */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-orange-900/30 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-[200px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FiShare2 size={80} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-orange-50 text-orange-900 rounded-xl group-hover:bg-orange-900 group-hover:text-white transition-all transform group-hover:-translate-y-1">
                                            <FiShare2 size={20} />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg tracking-tight">Connect</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold leading-normal">
                                        Seamless technology orchestration. Unified data exchange & event-driven architecture.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('integration')}
                                    className="flex items-center gap-2 text-orange-900 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all"
                                >
                                    View Logic <FiArrowRight />
                                </button>
                            </div>
                        </div>

                        {/* Sectioned Listings - Standard Grid */}
                        <div className="space-y-12 pb-6">
                            {/* Models Section */}
                            {models.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3 uppercase">
                                            <FiCpu className="text-blue-900" /> Managed Models
                                        </h2>
                                        <button onClick={() => setActiveCategory('models')} className="text-blue-900 font-black text-[10px] uppercase tracking-widest hover:underline">View Repository</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {models.slice(0, 4).map((m, i) => (
                                            <ArtifactCard key={i} name={m.modelName || m.identifier} type="Model" description={m.provider || 'Enterprise Model'} status="Active" iconUrl={getImageUrl(m.image || m.modelImage)} onClick={() => { }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bots Section */}
                            {bots.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3 uppercase">
                                            <FiActivity className="text-purple-900" /> Active Agents
                                        </h2>
                                        <button onClick={() => setActiveCategory('bots')} className="text-purple-900 font-black text-[10px] uppercase tracking-widest hover:underline">View Fleet</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {bots.slice(0, 4).map((b, i) => (
                                            <ArtifactCard key={i} name={b.identifier || b.name} type="Chatbot" description={b.persona || b.goal} status={b.status} iconUrl={getImageUrl(b.image || (b.agentImage && b.agentImage[0]))} onClick={() => { }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Categorized Artifacts Section */}
                            {categories.map(cat => {
                                const items = filterByCategory(cat.id);
                                if (items.length === 0) return null;
                                return (
                                    <div key={cat.id} className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 bg-${cat.color}-100 text-${cat.color}-900 rounded-lg shadow-sm`}>
                                                    <cat.icon size={16} />
                                                </div>
                                                <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">{cat.label}</h2>
                                            </div>
                                            <button onClick={() => setActiveCategory(cat.id as Category)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-black transition-all">All {items.length} Assets</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {items.slice(0, 4).map((item, i) => (
                                                <ArtifactCard key={i} name={item.name} type={item.type} description={item.description} status={item.status} iconUrl={getImageUrl(item.icon?.url || (item as any).imagePath)} onClick={() => handleViewArtifact(item)} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        {/* Filtered View Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-blue-900 transition-all shadow-sm shrink-0"
                                    title="Back to Hub"
                                >
                                    <FiArrowLeft size={18} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">
                                        {activeCategory === 'bots' ? 'Agents Collection' :
                                            activeCategory === 'models' ? 'Models Repository' :
                                                categories.find(c => c.id === activeCategory)?.label || 'Asset Library'}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 text-blue-900/40">
                                        Artifactory Library / {activeCategory}
                                    </p>
                                </div>
                            </div>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeCategory}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80 shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Filtered Items Grid - Standard Spacing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {activeCategory === 'bots' ? (
                                bots.filter(b => !searchQuery || (b.identifier || '').toLowerCase().includes(searchQuery.toLowerCase())).map((b, i) => (
                                    <ArtifactCard key={i} name={b.identifier || b.name} type="Chatbot" description={b.persona || b.goal} status={b.status} iconUrl={getImageUrl(b.image || (b.agentImage && b.agentImage[0]))} onClick={() => { }} isLarge />
                                ))
                            ) : activeCategory === 'models' ? (
                                models.filter(m => !searchQuery || (m.modelName || '').toLowerCase().includes(searchQuery.toLowerCase())).map((m, i) => (
                                    <ArtifactCard key={i} name={m.modelName} type="Model" description={m.provider || 'AI Model'} status="Active" iconUrl={getImageUrl(m.image || m.modelImage)} onClick={() => { }} isLarge />
                                ))
                            ) : (
                                filteredArtifacts.map((artifact) => (
                                    <ArtifactCard
                                        key={artifact.id}
                                        name={artifact.name}
                                        type={artifact.type}
                                        description={artifact.description}
                                        status={artifact.status}
                                        iconUrl={getImageUrl(artifact.icon?.url || (artifact as any).imagePath)}
                                        onClick={() => handleViewArtifact(artifact)}
                                        isLarge
                                    />
                                ))
                            )}
                        </div>

                        {filteredArtifacts.length === 0 && !loading && activeCategory !== 'bots' && activeCategory !== 'models' && (
                            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                                <FiLayers size={48} className="text-gray-300 mb-4" />
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No assets discovered in this category</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AIArtifactViewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                artifact={selectedArtifact}
                onUpdate={handleRefresh}
                onDelete={handleRefresh}
            />
        </div>
    );
};

interface ArtifactCardProps {
    name: string;
    type: string;
    description?: string;
    status?: string;
    iconUrl?: string;
    onClick: () => void;
    isLarge?: boolean;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ name, type, description, status, iconUrl, onClick, isLarge }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col group ${isLarge ? 'h-full' : 'h-[180px]'}`}
    >
        <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0 group-hover:scale-110 transition-transform">
                {iconUrl ? (
                    <img src={iconUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <FiPackage className="text-gray-300" size={24} />
                )}
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className="font-black text-[14px] text-gray-900 truncate leading-tight mb-1 group-hover:text-blue-900 transition-colors">
                        {name || 'Untitled'}
                    </h4>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{type}</span>
                    {status && (
                        <span className={`w-1.5 h-1.5 rounded-full ${status.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    )}
                </div>
            </div>
        </div>
        <p className={`text-[11px] text-gray-500 overflow-hidden leading-relaxed ${isLarge ? 'line-clamp-4' : 'line-clamp-2'}`}>
            {description || 'No description available for this artifact.'}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-300 group-hover:text-blue-900/40 transition-colors uppercase tracking-widest">Details</span>
            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-all">
                <FiEye size={12} />
            </div>
        </div>
    </div>
);

export default AIArtifactsCard;

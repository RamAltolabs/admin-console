import React, { useState, useEffect } from 'react';
import {
    FiPackage, FiSearch, FiActivity, FiCalendar,
    FiCpu, FiDatabase, FiShare2, FiArrowLeft, FiPlus,
    FiLayers, FiShoppingBag, FiCreditCard, FiSettings, FiGrid, FiArrowRight, FiSliders,
    FiRefreshCw
} from 'react-icons/fi';
import { AIArtifact } from '../types/merchant';
import merchantService from '../services/merchantService';
import AIArtifactViewModal from './AIArtifactViewModal';
import BotDetailsModal from './BotDetailsModal';

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
    const [selectedBot, setSelectedBot] = useState<any | null>(null);
    const [showBotDetailsModal, setShowBotDetailsModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getClusterImageBaseURL = (clusterId?: string): string => {
        const id = String(clusterId || 'it-app').toLowerCase();
        const itImageBase = process.env.REACT_APP_IT_APP_IMAGE_BASE_URL || process.env.IT_IMAGE_BASE_URL;
        const app6aImageBase = process.env.REACT_APP_APP6A_IMAGE_BASE_URL || process.env.APP6A_IMAGE_BASE_URL;
        const app6eImageBase = process.env.REACT_APP_APP6E_IMAGE_BASE_URL || process.env.APP6E_IMAGE_BASE_URL;
        const app30aImageBase = process.env.REACT_APP_APP30A_IMAGE_BASE_URL || process.env.APP30A_IMAGE_BASE_URL;
        const app30bImageBase = process.env.REACT_APP_APP30B_IMAGE_BASE_URL || process.env.APP30B_IMAGE_BASE_URL;

        const map: Record<string, string | undefined> = {
            app6: app6aImageBase,
            app6a: app6aImageBase,
            app6e: app6eImageBase,
            app30a: app30aImageBase,
            app30b: app30bImageBase,
            'it-app': itImageBase,
        };

        return (map[id] || itImageBase || process.env.REACT_APP_PORTAL_BASE_URL || '').replace(/\/+$/, '');
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Parallel fetch for all data types if needed, though primarily artifacts
            const [artifactsData, botsData, modelsData] = await Promise.all([
                merchantService.getAIArtifactsList(merchantId, cluster),
                merchantService.getBotsFromStoreByGrpNme('Public', 'Enterprise', cluster).catch(() => []),
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
        const baseURL = getClusterImageBaseURL(cluster);
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return baseURL ? `${baseURL}${cleanPath}` : cleanPath;
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

    const handleViewBotDetails = (bot: any) => {
        setSelectedBot({
            ...bot,
            botTemplateName: bot?.botTemplateName || bot?.title || bot?.botName || bot?.name || bot?.identifier || 'Bot'
        });
        setShowBotDetailsModal(true);
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

    const getBotDisplayName = (bot: any) =>
        bot?.title || bot?.botName || bot?.name || bot?.identifier || 'Bot';
    const getBotDescription = (bot: any) =>
        bot?.description || bot?.features || bot?.goal || bot?.persona || '';
    const getBotImage = (bot: any) =>
        bot?.botImage1 || bot?.botImage2 || bot?.image || (Array.isArray(bot?.agentImage) ? bot.agentImage[0] : '');
    const getBotCategory = (bot: any) =>
        bot?.category || bot?.groupName || 'Enterprise';
    const getBotCreatedBy = (bot: any) =>
        bot?.createdBy || bot?.owner || 'PG Admin';
    const getBotDate = (bot: any) => {
        const raw = bot?.createdDate || bot?.modifiedDate || '';
        if (!raw) return '';
        const dt = new Date(raw);
        return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };
    const DEFAULT_BOT_IMAGE_URL = 'https://live-inferno.neocloud.ai/img/chatbot-template.png';

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
            <div className="p-2 md:p-4 space-y-4 overflow-y-auto max-h-[90vh] bg-[#eef2f7]">
                {activeCategory === 'all' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[150px_1fr] gap-3 items-start">
                        <aside className="space-y-2 self-start lg:sticky lg:top-2">
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <h3 className="text-3xl font-black text-[#08275c] mb-3 flex items-center gap-2">
                                    <FiSliders size={16} />
                                    Categories
                                </h3>
                                <div className="space-y-1.5">
                                    {[
                                        { id: 'models', label: 'Models' },
                                        { id: 'bots', label: 'Bots' },
                                        { id: 'dataSources', label: 'Data Sources' },
                                        { id: 'payments', label: 'Payments' },
                                        { id: 'eCommerce', label: 'eCommerce' },
                                        { id: 'integration', label: 'Integration' },
                                        { id: 'service', label: 'Services' },
                                        { id: 'channel', label: 'Channel' }
                                    ].map((cat) => (
                                        <label key={cat.id} className="flex items-center gap-2 text-xs text-gray-700 px-1 py-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-3.5 w-3.5 rounded border-gray-300"
                                                checked={activeCategory === cat.id}
                                                onChange={() => setActiveCategory(cat.id as Category)}
                                            />
                                            <span>{cat.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-2.5">
                                <h3 className="text-xs font-black text-[#1a2c63] titlecase tracking-wide mb-2">Filter By</h3>
                                <div className="space-y-1 text-xs text-gray-600">
                                    <label className="flex items-center gap-2"><input type="radio" name="ai-filter" defaultChecked /> All</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="ai-filter" /> Installed</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="ai-filter" /> Popularity</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="ai-filter" /> Recommended</label>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-2.5">
                                <h3 className="text-xs font-black text-[#1a2c63] titlecase tracking-wide mb-2">Filter By Price</h3>
                                <div className="space-y-1 text-xs text-gray-600">
                                    <label className="flex items-center gap-2"><input type="radio" name="ai-price" defaultChecked /> All</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="ai-price" /> Free</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="ai-price" /> Paid</label>
                                </div>
                            </div>
                        </aside>

                        <div className="space-y-4">
                        {/* Hero Section - Compact Branded Core */}
                        <div className="bg-gradient-to-r from-[#dbe9ff] via-[#cfddf3] to-[#b8cae8] rounded-lg px-6 py-5 text-[#0f295f] shadow-sm relative overflow-hidden border border-[#c7d6ee] mb-2">
                            {/* Integrated Refresh Action */}
                            <button
                                onClick={fetchData}
                                className="absolute top-4 right-4 p-2 bg-white/40 hover:bg-white/60 rounded-lg border border-white/60 transition-all z-20"
                                title="Refresh Repository"
                            >
                                <FiRefreshCw size={16} className={`${loading ? 'animate-spin text-blue-700' : 'text-blue-700'}`} />
                            </button>

                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                            <div className="relative z-10 flex items-center gap-6">
                                <div className="p-3 bg-white/60 rounded-xl border border-white/70 shadow-sm shrink-0">
                                    <FiCpu size={26} className="text-blue-700" />
                                </div>
                                <div className="max-w-3xl">
                                    <div className="flex flex-col mb-2">
                                        <p className="text-[9px] font-black text-blue-700 titlecase tracking-[0.25em] opacity-80 mb-0.5">Asset Repository & Marketplace</p>
                                        <h1 className="text-2xl font-black tracking-tighter titlecase leading-none">AI Artifactory</h1>
                                    </div>
                                    <p className="text-[#1a3d7a] text-[11.5px] leading-tight font-medium max-w-2xl">
                                        Accelerate transformation with our <span className="text-blue-800 font-bold underline decoration-blue-500/40 underline-offset-4">Curated Repository</span> of ML Models, Bots, and Integrations for Enterprise AI.
                                    </p>
                                </div>
                            </div>
                        </div>

                            {/* Top Category Blocks */}
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
                                        Centralized hub for managing and versioning ML models for production.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('models')}
                                    className="flex items-center gap-2 text-blue-900 font-black text-[10px] titlecase tracking-widest hover:gap-3 transition-all"
                                >
                                    View Models <FiArrowRight />
                                </button>
                            </div>

                            {/* Bots */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-purple-900/30 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-[200px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FiActivity size={80} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-purple-50 text-purple-900 rounded-xl group-hover:bg-purple-900 group-hover:text-white transition-all transform group-hover:-rotate-12">
                                            <FiActivity size={20} />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg tracking-tight">Bots</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold leading-normal">
                                        Bots employ AI to create intelligent chatbots and virtual assistants.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('bots')}
                                    className="flex items-center gap-2 text-purple-900 font-black text-[10px] titlecase tracking-widest hover:gap-3 transition-all"
                                >
                                    View Bots <FiArrowRight />
                                </button>
                            </div>

                            {/* Data Source */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-emerald-900/30 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-[200px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FiDatabase size={80} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl group-hover:bg-emerald-900 group-hover:text-white transition-all transform group-hover:scale-110">
                                            <FiDatabase size={20} />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg tracking-tight">Data Source</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold leading-normal">
                                        Inbound integration data sources are essential for AI systems to learn and predict.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('dataSources')}
                                    className="flex items-center gap-2 text-emerald-900 font-black text-[10px] titlecase tracking-widest hover:gap-3 transition-all"
                                >
                                    View Data Source <FiArrowRight />
                                </button>
                            </div>

                            {/* Integration */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-orange-900/30 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-[200px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FiShare2 size={80} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-orange-50 text-orange-900 rounded-xl group-hover:bg-orange-900 group-hover:text-white transition-all transform group-hover:-translate-y-1">
                                            <FiShare2 size={20} />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg tracking-tight">Integration</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold leading-normal">
                                        Integration harmonizes technologies and enables seamless data exchange.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('integration')}
                                    className="flex items-center gap-2 text-orange-900 font-black text-[10px] titlecase tracking-widest hover:gap-3 transition-all"
                                >
                                    View Integration <FiArrowRight />
                                </button>
                            </div>
                        </div>

                        {/* Sectioned Listings - Standard Grid */}
                        <div className="space-y-12 pb-6">
                            {/* Models Section */}
                            {models.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3 titlecase">
                                            <FiCpu className="text-blue-900" /> Managed Models
                                        </h2>
                                        <button onClick={() => setActiveCategory('models')} className="text-blue-900 font-black text-[10px] titlecase tracking-widest hover:underline">View Repository</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {models.slice(0, 4).map((m, i) => (
                                            <ArtifactCard key={i} name={m.modelName || m.identifier} type="Model" description={m.provider || 'Enterprise Model'} status="Active" iconUrl={getImageUrl(m.image || m.modelImage)} onClick={() => { }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bots Section */}
                            {bots.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3 titlecase">
                                            <FiActivity className="text-purple-900" /> Bots
                                        </h2>
                                        <button onClick={() => setActiveCategory('bots')} className="text-purple-900 font-black text-[10px] titlecase tracking-widest hover:underline">View Fleet</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {bots.slice(0, 4).map((b, i) => (
                                            <BotStoreCard
                                                key={i}
                                                name={getBotDisplayName(b)}
                                                description={getBotDescription(b)}
                                                status={b.status}
                                                iconUrl={getImageUrl(getBotImage(b)) || DEFAULT_BOT_IMAGE_URL}
                                                category={getBotCategory(b)}
                                                createdBy={getBotCreatedBy(b)}
                                                dateLabel={getBotDate(b)}
                                                onViewDetails={() => handleViewBotDetails(b)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight titlecase">Bots</h2>
                                    <div className="h-24 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 text-xs font-bold">
                                        No records found
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
                                                <h2 className="text-lg font-black text-gray-900 tracking-tight titlecase flex items-center gap-2">
                                                    {cat.label}
                                                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-blue-500 text-white text-[10px] font-black">
                                                        {items.length}
                                                    </span>
                                                </h2>
                                            </div>
                                            <button onClick={() => setActiveCategory(cat.id as Category)} className="text-blue-700 font-black text-[10px] titlecase tracking-widest hover:text-blue-900 transition-all">View All</button>
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
                    </div>
                    </div>
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
                                    <h2 className="text-xl font-black text-gray-900 titlecase tracking-tighter">
                                        {activeCategory === 'bots' ? 'Bots' :
                                            activeCategory === 'models' ? 'Models Repository' :
                                                categories.find(c => c.id === activeCategory)?.label || 'Asset Library'}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-black titlecase tracking-[0.2em] mt-1 text-blue-900/40">
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
                                bots.filter(b => {
                                    if (!searchQuery) return true;
                                    const q = searchQuery.toLowerCase();
                                    return getBotDisplayName(b).toLowerCase().includes(q) ||
                                        String(b?.botName || '').toLowerCase().includes(q) ||
                                        String(b?.createdBy || '').toLowerCase().includes(q);
                                }).map((b, i) => (
                                    <BotStoreCard
                                        key={i}
                                        name={getBotDisplayName(b)}
                                        description={getBotDescription(b)}
                                        status={b.status}
                                        iconUrl={getImageUrl(getBotImage(b)) || DEFAULT_BOT_IMAGE_URL}
                                        category={getBotCategory(b)}
                                        createdBy={getBotCreatedBy(b)}
                                        dateLabel={getBotDate(b)}
                                        onViewDetails={() => handleViewBotDetails(b)}
                                    />
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
                                <p className="text-sm font-black text-gray-400 titlecase tracking-widest">No assets discovered in this category</p>
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
            {showBotDetailsModal && (
                <BotDetailsModal
                    bot={selectedBot}
                    onClose={() => setShowBotDetailsModal(false)}
                />
            )}
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
                    <span className="text-[9px] font-black text-blue-400 titlecase tracking-widest">{type}</span>
                    {status && (
                        <span className={`w-1.5 h-1.5 rounded-full ${status.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    )}
                </div>
            </div>
        </div>
        <p className={`text-[11px] text-gray-500 overflow-hidden leading-relaxed ${isLarge ? 'line-clamp-4' : 'line-clamp-2'}`}>
            {description || 'No description available for this artifact.'}
        </p>
    </div>
);

interface BotStoreCardProps {
    name: string;
    description?: string;
    status?: string;
    iconUrl?: string;
    category?: string;
    createdBy?: string;
    dateLabel?: string;
    onViewDetails: () => void;
}

const BotStoreCard: React.FC<BotStoreCardProps> = ({
    name,
    description,
    status,
    iconUrl,
    category,
    createdBy,
    dateLabel,
    onViewDetails
}) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-3 flex gap-3 min-h-[148px]">
            <img
                src={iconUrl}
                alt={name}
                className="w-[92px] h-[92px] object-cover rounded bg-[#d9ecf8] border border-[#c6ddef] shrink-0"
            />
            <div className="min-w-0 flex-1">
                <h4 className="text-[13px] font-bold text-gray-900 leading-tight truncate">{name}</h4>
                <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{description || 'No description available.'}</p>
                {dateLabel && <p className="text-[11px] text-gray-500 mt-0.5">{dateLabel}</p>}
                <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] bg-gray-100 rounded text-gray-800">{category || 'Enterprise'}</span>
                    {status && (
                        <span className={`w-2 h-2 rounded-full ${status.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    )}
                </div>
                <p className="text-[11px] text-gray-600 mt-2">
                    Created By <span className="text-blue-600 font-bold">{createdBy || 'PG Admin'}</span>
                </p>
            </div>
        </div>
        <button
            onClick={onViewDetails}
            className="w-full px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-left text-[13px] font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-100"
        >
            <span>View Details</span>
            <FiArrowRight size={16} />
        </button>
    </div>
);

export default AIArtifactsCard;



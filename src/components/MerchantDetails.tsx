import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiHash, FiActivity, FiMapPin, FiGlobe, FiCalendar, FiClock, FiShield, FiFileText, FiBook, FiUsers, FiPackage, FiRadio, FiLayout, FiUserCheck, FiEdit2, FiServer, FiLayers, FiZap, FiTerminal, FiSettings, FiMessageSquare, FiBarChart2, FiGrid, FiShoppingCart, FiTag, FiSend, FiLock, FiCpu, FiPlay, FiBox, FiFolder } from 'react-icons/fi';
import { Merchant, CreateMerchantPayload, UpdateMerchantPayload, UpdateMerchantAttributesPayload } from '../types/merchant';
import merchantService from '../services/merchantService';
import MerchantFormModal from './MerchantFormModal';
import DepartmentsCard from './DepartmentsCard';
import AgentiAICard from './AgentiAICard';
import PagesCard from './PagesCard';
import UsersCard from './UsersCard';
import ContactsCard from './ContactsCard';
import AnalyticsCard from './AnalyticsCard';
import MerchantAnalytics from './MerchantAnalytics';
import PromptLab from './PromptLab';
import KnowledgeBasesCard from './KnowledgeBasesCard';

import CustomConfigCard from './CustomConfigCard';
import AIArtifactsCard from './AIArtifactsCard';
import ChannelsCard from './ChannelsCard';
import EngagementsCard from './EngagementsCard';
import AIModelCard from './AIModelCard';
import AIAgentsCard from './AIAgentsCard';
import AgentiAILogs from './AgentiAILogs';
import RecentVisitorsCard from './RecentVisitorsCard';
import OnlineVisitorsCard from './OnlineVisitorsCard';
import VisitHistoryCard from './VisitHistoryCard';
import ProductsCard from './ProductsCard';
import OrdersCard from './OrdersCard';
import CampaignsCard from './CampaignsCard';

const MerchantDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const clusterParam = queryParams.get('cluster') || undefined;

    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState<string>('analytics');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Top-Level Tab State
    const [mainTab, setMainTab] = useState<'details' | 'overview' | 'analytics' | 'general' | 'ai-suite' | 'model-studio' | 'communication' | 'system'>('details');

    // Visitor Sub-Tab State
    const [visitorSubTab, setVisitorSubTab] = useState<'recent' | 'online' | 'history'>('online');

    // Visitor Sections Configuration
    const visitorSections = [
        { id: 'online' as const, label: 'Live Visitors', icon: FiGlobe },
        { id: 'recent' as const, label: 'Recent Visitors', icon: FiClock },
        { id: 'history' as const, label: 'Visit History', icon: FiCalendar }
    ];

    const managementSections = [
        {
            id: 'general',
            title: 'General',
            items: [
                { id: 'users', label: 'Users', icon: FiUserCheck },
                { id: 'departments', label: 'Departments', icon: FiUsers },
                { id: 'contacts', label: 'Contacts', icon: FiUser },
            ]
        },
        {
            id: 'ai-suite',
            title: 'AI Suite',
            items: [
                { id: 'agenti-ai', label: 'Agentic AI', icon: FiZap },
                { id: 'ai-agents', label: 'AI Agents', icon: FiLayers },
                { id: 'prompts', label: 'Prompts', icon: FiFileText },
                { id: 'knowledge', label: 'Knowledge Base', icon: FiBook },
                { id: 'artifacts', label: 'AI Artifacts', icon: FiPackage },
            ]
        },
        {
            id: 'model-studio',
            title: 'Model Studio',
            items: [
                { id: 'model-mgmt', label: 'Model Management', icon: FiCpu },
                { id: 'private-llm', label: 'Private LLM', icon: FiLock },
                { id: 'studio-prompts', label: 'Prompts', icon: FiFileText },
                { id: 'ml-models', label: 'ML Models', icon: FiActivity },
                { id: 'studio-knowledge', label: 'Knowledge Base', icon: FiBook },
                { id: 'documents', label: 'Documents', icon: FiFolder },
                { id: 'ontologies', label: 'Ontologies', icon: FiLayers },
            ]
        },
        {
            id: 'communication',
            title: 'Communication',
            items: [
                { id: 'engagements', label: 'Engagements', icon: FiActivity },
                { id: 'channels', label: 'Channels', icon: FiRadio },
                { id: 'products', label: 'Products', icon: FiShoppingCart },
                { id: 'orders', label: 'Orders', icon: FiTag },
                { id: 'campaigns', label: 'Campaigns', icon: FiSend },
            ]
        },
        {
            id: 'system',
            title: 'System',
            items: [
                { id: 'config', label: 'Custom Config', icon: FiSettings },
                { id: 'pages', label: 'Pages', icon: FiLayout },
                { id: 'console-logs', label: 'Console Logs', icon: FiTerminal },
            ]
        }
    ];

    const activeSection = managementSections.flatMap(s => s.items).find(i => i.id === activeTab);

    useEffect(() => {
        const fetchMerchantDetails = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await merchantService.getMerchantById(id, clusterParam);

                if (!data) {
                    throw new Error('Merchant not found');
                }

                setMerchant(data);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching merchant details:', err);
                setError(err.message || 'Failed to load merchant details');
            } finally {
                setLoading(false);
            }
        };

        fetchMerchantDetails();
    }, [id]);

    const handleEditMerchant = async (data: any) => {
        if (!id || !merchant) return;
        setIsUpdating(true);
        try {
            // Construct the updateMerchantAttributes payload
            const attributesPayload: UpdateMerchantAttributesPayload = {
                id: id,
                merchantName: data.name || merchant.name,
                type: merchant.businessType || 'Enterprise',
                address: {
                    email_addresses: [data.email || merchant.email],
                    phone_numbers: [data.phone || merchant.phone]
                },
                contacts: [
                    {
                        first_name: data.contactFirstName || merchant.contactFirstName || '',
                        last_name: data.contactLastName || merchant.contactLastName || ''
                    }
                ],
                timeZone: data.timeZone || merchant.timeZone || 'Asia/Calcutta',
                other_params: {
                    caption: data.caption || merchant.caption || '',
                    workinghours: [],
                    website: data.website || merchant.website || '',
                    location: merchant.city || ''
                }
            };

            console.log('[handleEditMerchant] Data from form:', data);
            console.log('[handleEditMerchant] Constructed payload:', attributesPayload);

            const updated = await merchantService.updateMerchantAttributes(id, attributesPayload, clusterParam);
            setMerchant(updated);
            setIsEditModalOpen(false);
        } catch (err: any) {
            console.error('Failed to update merchant attributes:', err);
            alert('Failed to update merchant details: ' + (err.message || 'Unknown error'));
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-genx-500"></div>
                <span className="ml-3 text-gray-600">Loading details...</span>
            </div>
        );
    }

    if (error || !merchant) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Error! </strong>
                    <span className="block sm:inline">{error || 'Merchant not found'}</span>
                </div>
                <button
                    onClick={() => navigate('/merchants')}
                    className="mt-4 flex items-center text-genx-600 hover:text-genx-800 transition"
                >
                    <FiArrowLeft className="mr-2" /> Back to Merchants
                </button>
            </div>
        );
    }

    const DetailItem: React.FC<{ icon: any; label: string; value: string | undefined; color?: string }> = ({
        icon: Icon, label, value, color = "text-gray-500"
    }) => (
        <div className="flex items-start space-x-1.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`mt-0.5 ${color}`}>
                <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full relative bg-gray-50">
            {/* Main Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 pb-16">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/merchants')}
                        className="flex items-center text-gray-500 hover:text-genx-600 transition font-medium"
                    >
                        <FiArrowLeft className="mr-2" /> Back to Merchants
                    </button>
                    <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${merchant.status === 'active' ? 'bg-green-100 text-green-700' :
                            merchant.status === 'inactive' ? 'bg-red-100 text-red-700' :
                                merchant.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            {merchant.status || 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-card p-3 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/30">
                                {merchant.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{merchant.name}</h1>
                                <p className="text-gray-500 flex items-center mt-1">
                                    <FiHash className="mr-1" /> {merchant.id}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Top Level Tabs */}
                    <div className="flex flex-wrap gap-1 bg-gray-50/50 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setMainTab('details')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${mainTab === 'details'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                }`}
                        >
                            <FiUser className="mr-2" size={16} />
                            Merchant Info
                        </button>
                        <button
                            onClick={() => setMainTab('overview')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${mainTab === 'overview'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                }`}
                        >
                            <FiUsers className="mr-2" size={16} />
                            Visitor Info
                        </button>
                        <button
                            onClick={() => setMainTab('analytics')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${mainTab === 'analytics'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                }`}
                        >
                            <FiBarChart2 className="mr-2" size={16} />
                            Analytics
                        </button>

                        {/* Dynamic Management Tabs */}
                        {managementSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setMainTab(section.id as any);
                                    if (section.items.length > 0) {
                                        setActiveTab(section.items[0].id);
                                    }
                                }}
                                className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${mainTab === section.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                    }`}
                            >
                                {section.id !== 'general' && section.id !== 'system' && (
                                    <div className="mr-2">
                                        {section.id === 'ai-suite' && <FiZap size={16} />}
                                        {section.id === 'model-studio' && <FiCpu size={16} />}
                                        {section.id === 'communication' && <FiMessageSquare size={16} />}
                                    </div>
                                )}
                                {section.id === 'general' && <FiGrid className="mr-2" size={16} />}
                                {section.id === 'system' && <FiSettings className="mr-2" size={16} />}
                                {section.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-3">
                    {mainTab === 'details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Merchant Info & Location - Combined */}
                            <div className="space-y-2.5 lg:col-span-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h3 className="text-base font-bold text-gray-800 flex items-center">
                                        <div className="p-1 bg-genx-50 rounded-lg mr-1.5 text-genx-600">
                                            <FiFileText size={16} />
                                        </div>
                                        Merchant Details
                                    </h3>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="p-1 px-2 text-xs font-bold text-genx-600 hover:bg-genx-50 rounded-lg transition-all flex items-center gap-1 border border-genx-100 shadow-sm"
                                    >
                                        <FiEdit2 size={10} /> Edit
                                    </button>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Merchant Info Section */}
                                    <div className="p-2.5 border-b border-gray-100">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Contact Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                            <DetailItem icon={FiUser} label="Primary Contact" value={`${merchant.contactFirstName || ''} ${merchant.contactLastName || ''}`} color="text-genx-500" />
                                            <DetailItem icon={FiMail} label="Email Address" value={merchant.email} color="text-genx-500" />
                                            <DetailItem icon={FiPhone} label="Phone Number" value={merchant.phone} color="text-genx-500" />
                                            <DetailItem icon={FiClock} label="Timezone" value={merchant.timeZone} color="text-genx-500" />
                                        </div>
                                    </div>

                                    {/* Business Info */}
                                    <div className="p-2.5 border-b border-gray-100">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Business Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                            <DetailItem icon={FiFileText} label="Caption" value={merchant.caption} color="text-genx-500" />
                                            <DetailItem icon={FiGlobe} label="Website" value={merchant.website} color="text-genx-500" />
                                        </div>
                                    </div>

                                    {/* Location Section */}
                                    <div className="p-2.5">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Location</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                            <DetailItem icon={FiMapPin} label="Address" value={merchant.address} color="text-genx-500" />
                                            <DetailItem icon={FiGlobe} label="Region / Cluster" value={merchant.cluster} color="text-genx-500" />
                                            <DetailItem icon={FiMapPin} label="City / State" value={`${merchant.city || ''}${merchant.city && merchant.state ? ', ' : ''}${merchant.state || ''}`} color="text-genx-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-2.5">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center">
                                    <div className="p-1 bg-genx-50 rounded-lg mr-1.5 text-genx-600">
                                        <FiActivity size={16} />
                                    </div>
                                    Metadata
                                </h3>
                                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 shadow-sm">
                                    <DetailItem icon={FiShield} label="Tax ID" value={merchant.taxId} color="text-genx-500" />
                                    <DetailItem icon={FiCalendar} label="Created On" value={new Date(merchant.createdAt).toLocaleDateString()} color="text-genx-500" />
                                    <DetailItem icon={FiClock} label="Last Updated" value={new Date(merchant.updatedAt).toLocaleDateString()} color="text-genx-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {mainTab === 'overview' && (
                        <div className="flex gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Visitor Sidebar */}
                            <div className="w-56 shrink-0">
                                <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1 shadow-sm">
                                    {visitorSections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setVisitorSubTab(section.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left ${visitorSubTab === section.id
                                                ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 font-medium'
                                                }`}
                                        >
                                            <section.icon size={18} />
                                            <span className="text-sm">{section.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visitor Content Area */}
                            <div className="flex-1 min-w-0">
                                {visitorSubTab === 'recent' && (
                                    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                                        <RecentVisitorsCard merchantId={merchant.id} cluster={merchant.cluster} />
                                    </div>
                                )}

                                {visitorSubTab === 'online' && (
                                    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                                        <OnlineVisitorsCard merchantId={merchant.id} cluster={merchant.cluster} />
                                    </div>
                                )}

                                {visitorSubTab === 'history' && (
                                    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                                        <VisitHistoryCard merchantId={merchant.id} cluster={merchant.cluster} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {mainTab === 'analytics' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                            <MerchantAnalytics merchantId={merchant.id} cluster={merchant.cluster} />
                        </div>
                    )}

                    {/* Management Categories Rendering */}
                    {managementSections.map((section) => {
                        if (mainTab !== section.id) return null;

                        return (
                            <div key={section.id} className="flex gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Management Sidebar */}
                                <div className="w-56 shrink-0">
                                    <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1 shadow-sm">
                                        <div className="px-4 py-2 mb-2">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{section.title}</h3>
                                        </div>
                                        {section.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left ${activeTab === item.id
                                                    ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-50 font-medium'
                                                    }`}
                                            >
                                                <item.icon size={18} />
                                                <span className="text-sm">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Management Content Area */}
                                <div className="flex-1 min-w-0">
                                    {/* Dynamic Header */}
                                    {activeSection && (
                                        <div className="mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                    <activeSection.icon className="text-blue-600" size={20} />
                                                </div>
                                                <h2 className="text-lg font-bold text-gray-800">{activeSection.label}</h2>
                                            </div>
                                        </div>
                                    )}

                                    {/* Content for each tab */}
                                    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                                        {activeTab === 'users' && <UsersCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'departments' && <DepartmentsCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'contacts' && <ContactsCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'agenti-ai' && <AgentiAICard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'ai-agents' && <AIAgentsCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'prompts' && <PromptLab merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'knowledge' && <KnowledgeBasesCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'artifacts' && <AIArtifactsCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'engagements' && <EngagementsCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'channels' && <ChannelsCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'products' && <ProductsCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'orders' && <OrdersCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'campaigns' && <CampaignsCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'visit-history' && <VisitHistoryCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'config' && <CustomConfigCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'pages' && <PagesCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'console-logs' && <AgentiAILogs merchantId={merchant.id} cluster={merchant.cluster} />}

                                        {/* Model Studio Placeholders */}
                                        {activeTab === 'model-mgmt' && <AIModelCard merchantId={merchant.id} cluster={merchant.cluster} initialTab="Model Management" />}
                                        {activeTab === 'private-llm' && <AIModelCard merchantId={merchant.id} cluster={merchant.cluster} initialTab="Private LLM" />}
                                        {activeTab === 'studio-prompts' && <PromptLab merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'ml-models' && <AIModelCard merchantId={merchant.id} cluster={merchant.cluster} initialTab="ML Models" />}
                                        {activeTab === 'studio-knowledge' && <KnowledgeBasesCard merchantId={merchant.id} cluster={merchant.cluster} />}
                                        {activeTab === 'documents' && (
                                            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                                <FiFolder size={48} className="mx-auto text-gray-300 mb-4" />
                                                <h3 className="text-lg font-bold text-gray-800">Documents</h3>
                                                <p className="text-gray-500">Manage vector store documents and source files.</p>
                                            </div>
                                        )}
                                        {activeTab === 'ontologies' && (
                                            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                                <FiLayers size={48} className="mx-auto text-gray-300 mb-4" />
                                                <h3 className="text-lg font-bold text-gray-800">Ontologies</h3>
                                                <p className="text-gray-500">Define knowledge graphs and relational schemas.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Merchant Edit Modal */}
            <MerchantFormModal
                isOpen={isEditModalOpen}
                merchant={merchant}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditMerchant}
                loading={isUpdating}
            />
        </div >
    );
};

export default MerchantDetails;

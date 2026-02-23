import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiHome, FiPieChart, FiShoppingBag, FiSettings, FiDatabase, FiGlobe, FiServer, FiCpu, FiTerminal, FiChevronRight, FiUsers, FiLayers, FiFileText, FiBarChart2, FiActivity, FiUserCheck, FiUser, FiZap, FiPackage, FiLock, FiBook, FiFolder, FiRadio, FiShoppingCart, FiTag, FiCreditCard, FiSend, FiLayout, FiMonitor, FiRotateCcw, FiChevronDown, FiBell, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import { useMerchantContext } from '../context/MerchantContext';

interface SearchResult {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
    category: string;
    clusterId?: string;
    description?: string;
}

const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const { clusters, merchants, selectedCluster, setSelectedCluster, viewMode, setViewMode } = useMerchantContext();
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getClusterIcon = (id: string) => {
        switch (id.toLowerCase()) {
            case 'it-app': return <FiServer size={14} />;
            case 'app6a': return <FiGlobe size={14} />;
            case 'app30a': return <FiDatabase size={14} />;
            case 'app30b': return <FiCpu size={14} />;
            case 'app6e': return <FiTerminal size={14} />;
            default: return <FiDatabase size={14} />;
        }
    };

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const term = query.toLowerCase();
        const allPossible: SearchResult[] = [];

        // 1. TOP LEVEL MENUS
        const mainMenus = [
            { id: 'm-home', label: 'Home', path: '/', icon: <FiHome />, category: 'Main Menu', description: 'Application landing page' },
            { id: 'm-dash', label: 'Dashboard', path: '/', icon: <FiPieChart />, category: 'Main Menu', description: 'System overview and analytics' },
            { id: 'm-merc', label: 'Merchants', path: '/merchants', icon: <FiShoppingBag />, category: 'Main Menu', description: 'Manage all business accounts' },
            { id: 'm-sett', label: 'Settings', path: '/settings', icon: <FiSettings />, category: 'Main Menu', description: 'System configuration' },
            { id: 'm-gcp', label: 'Google Cloud Console Dashboard', path: '/google-cloud-console', icon: <FiActivity />, category: 'Main Menu', description: 'Live cloud monitoring, alerts and notifications' },
        ];
        allPossible.push(...mainMenus.map(m => ({ ...m, icon: React.cloneElement(m.icon as React.ReactElement, { size: 14 }) })));

        // 2. SUB MENUS (Clusters)
        clusters.forEach(cluster => {
            allPossible.push({
                id: `c-dash-${cluster.id}`,
                label: `Dashboard > ${cluster.name}`,
                path: '/',
                icon: getClusterIcon(cluster.id),
                category: 'Sub Menus',
                clusterId: cluster.id,
                description: `View analytics for ${cluster.name} node`
            });
            allPossible.push({
                id: `c-merc-${cluster.id}`,
                label: `Merchants > ${cluster.name}`,
                path: '/merchants',
                icon: getClusterIcon(cluster.id),
                category: 'Sub Menus',
                clusterId: cluster.id,
                description: `Browse merchants in ${cluster.name}`
            });
        });

        // 3. SUB-SUB MENUS (Dashboard Analytics Tabs)
        const dashboardTabs = [
            { id: 'ss-dash-vis', label: 'Dashboard > Analytics > Visitors', path: '/#visitors-table', icon: <FiUsers />, description: 'Live and recent visitor tracking' },
            { id: 'ss-dash-eng', label: 'Dashboard > Analytics > Engagement', path: '/#engagement-stats', icon: <FiActivity />, description: 'User interaction metrics' },
            { id: 'ss-dash-con', label: 'Dashboard > Analytics > Conversations', path: '/#recent-merchants', icon: <FiBarChart2 />, description: 'Chat and Support analytics' },
        ];
        allPossible.push(...dashboardTabs.map(t => ({ ...t, category: 'Sub-Sub Menus', icon: React.cloneElement(t.icon as React.ReactElement, { size: 14 }) })));

        // 4. MERCHANT MANAGEMENT SECTIONS (Hierarchical)
        const managementSections = [
            {
                cat: 'General', items: [
                    { id: 'users', label: 'Users', icon: <FiUserCheck /> },
                    { id: 'departments', label: 'Departments', icon: <FiUsers /> },
                    { id: 'contacts', label: 'Customers', icon: <FiUser /> },
                ]
            },
            {
                cat: 'AI Suite', items: [
                    { id: 'agenti-ai', label: 'Agentic AI', icon: <FiZap /> },
                    { id: 'ai-agents', label: 'AI Agents', icon: <FiLayers /> },
                    { id: 'artifacts', label: 'AI Artifacts', icon: <FiPackage /> },
                ]
            },
            {
                cat: 'Model Studio', items: [
                    { id: 'model-mgmt', label: 'Model Management', icon: <FiCpu /> },
                    { id: 'private-llm', label: 'Private Model', icon: <FiLock /> },
                    { id: 'studio-prompts', label: 'Prompts', icon: <FiFileText /> },
                    { id: 'studio-knowledge', label: 'Knowledge Base', icon: <FiBook /> },
                    { id: 'documents', label: 'Documents', icon: <FiFolder /> },
                    { id: 'ontologies', label: 'Ontologies', icon: <FiLayers /> },
                ]
            },
            {
                cat: 'Communication', items: [
                    { id: 'engagements', label: 'Engagements', icon: <FiActivity /> },
                    { id: 'channels', label: 'Channels', icon: <FiRadio /> },
                    { id: 'products', label: 'Products', icon: <FiShoppingCart /> },
                    { id: 'orders', label: 'Orders', icon: <FiTag /> },
                    { id: 'payments', label: 'Payments', icon: <FiCreditCard /> },
                    { id: 'campaigns', label: 'Campaigns', icon: <FiSend /> },
                ]
            },
            {
                cat: 'System', items: [
                    { id: 'config', label: 'Custom Config', icon: <FiSettings /> },
                    { id: 'pages', label: 'Pages', icon: <FiLayout /> },
                    { id: 'console-logs', label: 'Console Logs', icon: <FiTerminal /> },
                ]
            }
        ];

        managementSections.forEach(section => {
            section.items.forEach(item => {
                allPossible.push({
                    id: `ss-merc-${item.id}`,
                    label: `Merchants > ${section.cat} > ${item.label}`,
                    path: `/merchants?tab=${item.id}`,
                    icon: React.cloneElement(item.icon as React.ReactElement, { size: 14 }),
                    category: 'Features',
                    description: `Access ${item.label} tools`
                });
            });
        });

        // 5. SETTINGS SUB MENUS
        const settingsTabs = [
            { id: 's-site', label: 'Settings > Site Identity', path: '/settings?tab=identity', icon: <FiGlobe />, description: 'Configure branding and site titles' },
            { id: 's-visuals', label: 'Settings > Visual Interface', path: '/settings?tab=visuals', icon: <FiMonitor />, description: 'Change themes and appearance' },
            { id: 's-profile', label: 'Settings > My Profile', path: '/settings?tab=profile', icon: <FiUser />, description: 'Manage your personal account' },
            { id: 's-notifications', label: 'Settings > Notifications', path: '/settings?tab=notifications', icon: <FiBell />, description: 'Configure alert channels and delivery modes' },
            { id: 's-security', label: 'Settings > Security', path: '/settings?tab=security', icon: <FiLock />, description: 'Control session timeout and security actions' },
        ];
        allPossible.push(...settingsTabs.map(t => ({ ...t, category: 'Sub Menus', icon: React.cloneElement(t.icon as React.ReactElement, { size: 14 }) })));

        const gcpTabs = [
            { id: 'gcp-api', label: 'Google Cloud > API Monitoring', path: '/google-cloud-console', icon: <FiServer />, description: 'Track API health, latency, and error rates' },
            { id: 'gcp-alerts', label: 'Google Cloud > Alerts', path: '/google-cloud-console', icon: <FiAlertCircle />, description: 'View critical and active monitoring alerts' },
            { id: 'gcp-notifications', label: 'Google Cloud > Notifications', path: '/google-cloud-console', icon: <FiBell />, description: 'Review operational notification feed' },
            { id: 'gcp-live', label: 'Google Cloud > Live Tracking', path: '/google-cloud-console', icon: <FiTrendingUp />, description: 'Observe live events and service activity' },
        ];
        allPossible.push(...gcpTabs.map(t => ({ ...t, category: 'Sub Menus', icon: React.cloneElement(t.icon as React.ReactElement, { size: 14 }) })));

        // 6. SEARCH ENTITIES (Specific Merchants)
        merchants
            .filter(m => m.name.toLowerCase().includes(term) || m.id.toLowerCase().includes(term))
            .slice(0, 8)
            .forEach(m => {
                allPossible.push({
                    id: `ent-merc-${m.id}`,
                    label: m.name,
                    path: `/merchants/${m.id}`,
                    icon: <FiShoppingBag size={14} />,
                    category: 'Business Accounts',
                    clusterId: m.cluster,
                    description: `ID: ${m.id} | Cluster: ${m.cluster}`
                });
            });

        const filtered = allPossible.filter(item =>
            item.label.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
        );

        setResults(filtered.slice(0, 15)); // Limit for UI
    }, [query, clusters, merchants]);

    const handleSelect = (result: SearchResult) => {
        if (result.id === 'm-home') {
            setSelectedCluster('');
            setViewMode('cluster');
        } else if (result.id === 'm-dash' || result.id === 'global-overview' || result.id === 'm-dash-overall') {
            setSelectedCluster('');
            setViewMode('overall');
        } else if (result.clusterId) {
            setSelectedCluster(result.clusterId);
            setViewMode('cluster');
        } else if (result.category === 'Features' || result.category === 'Sub-Sub Menus') {
            // These are deep features. If we don't have a cluster, we stay in 'cluster' mode to trigger the selection flow
            if (!selectedCluster && viewMode === 'overall') {
                setViewMode('cluster');
            }
        }

        navigate(result.path);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div className="relative flex-1 max-w-2xl mx-2 md:mx-6" ref={searchRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className={`transition-colors duration-200 ${isOpen ? 'text-primary-main' : 'text-neutral-text-muted group-hover:text-primary-main'}`} size={18} />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-neutral-bg/50 border-neutral-border text-sm placeholder-neutral-text-muted transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main focus:bg-white ${isOpen ? 'shadow-lg border-primary-main ring-2 ring-primary-main/10' : 'hover:border-neutral-border-hover hover:bg-neutral-bg/80'}`}
                    placeholder="Search for ANYTHING (menus, merchants, features...)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setResults([]); }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-text-muted hover:text-primary-main transition-all group/clear"
                        title="Clear search"
                    >
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-bg group-hover/clear:bg-primary-main/10 transition-colors border border-transparent group-hover/clear:border-primary-main/20">
                            <FiRotateCcw size={12} className="group-hover/clear:rotate-[-90deg] transition-transform duration-300" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Reset</span>
                        </div>
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (query.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-neutral-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.length > 0 ? (
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Grouped Results */}
                            {Array.from(new Set(results.map(r => r.category))).map(category => (
                                <div key={category} className="border-b border-neutral-border last:border-0">
                                    <div className="bg-neutral-bg/30 px-4 py-2">
                                        <span className="text-[10px] font-bold text-neutral-text-muted uppercase tracking-[0.2em]">{category}</span>
                                    </div>
                                    <div className="py-1">
                                        {results.filter(r => r.category === category).map(result => (
                                            <button
                                                key={result.id}
                                                onClick={() => handleSelect(result)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-bg group transition-all duration-200"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-neutral-bg flex items-center justify-center text-neutral-text-muted group-hover:bg-primary-main group-hover:text-white transition-all shadow-sm">
                                                    {result.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[13px] font-bold text-neutral-text-main group-hover:text-primary-main transition-colors flex items-center gap-2">
                                                        {result.label}
                                                        <FiChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0 transition-transform" />
                                                    </div>
                                                    {result.description && (
                                                        <div className="text-[10px] text-neutral-text-muted mt-0.5 font-medium tracking-tight leading-normal whitespace-normal break-words">
                                                            {result.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[9px] font-black text-neutral-text-muted group-hover:text-primary-main/50 transition-colors bg-neutral-bg px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                    {result.category}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-neutral-bg rounded-2xl flex items-center justify-center mx-auto mb-4 grayscale opacity-20">
                                <FiSearch size={32} />
                            </div>
                            <h3 className="text-[13px] font-bold text-neutral-text-main mb-1">No matches found</h3>
                            <p className="text-[11px] text-neutral-text-muted font-medium">Try searching for other menus, clusters, or merchants</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;

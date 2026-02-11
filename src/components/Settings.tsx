import React, { useState } from 'react';
import { FiGlobe, FiMonitor, FiSave, FiCheck, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'identity' | 'visuals' | 'profile'>('identity');
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);

    // Initial saved states for comparison
    const [savedSettings, setSavedSettings] = useState({
        siteTitle: 'Altolabs Admin Console',
        tagline: 'Enterprise Intelligence & Operational Excellence',
        theme: 'System'
    });

    // Form states (Local only for demo purposes)
    const [siteTitle, setSiteTitle] = useState(savedSettings.siteTitle);
    const [tagline, setTagline] = useState(savedSettings.tagline);
    const [theme, setTheme] = useState(savedSettings.theme);

    // Dynamic dirty check
    const hasChanges =
        siteTitle !== savedSettings.siteTitle ||
        tagline !== savedSettings.tagline ||
        theme !== savedSettings.theme;

    // Apply theme to document
    React.useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'Dark') {
            root.classList.add('dark');
        } else if (theme === 'Light') {
            root.classList.remove('dark');
        } else {
            // System
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', isDark);
        }
    }, [theme]);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setSavedSettings({ siteTitle, tagline, theme });
            setIsSaving(false);
            setShowSavedMsg(true);
            setTimeout(() => setShowSavedMsg(false), 3000);
        }, 1200);
    };

    const tabs = [
        { id: 'identity', label: 'Site Identity', icon: <FiGlobe /> },
        { id: 'visuals', label: 'Visual Interface', icon: <FiMonitor /> },
        { id: 'profile', label: 'My Profile', icon: <FiUser /> },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Header - Simplified Action Bar Only */}
            <div className="flex justify-end pt-4 pb-2 border-b border-neutral-border/50">
                <button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isSaving
                        ? 'bg-neutral-bg text-neutral-text-muted cursor-not-allowed opacity-50'
                        : !hasChanges
                            ? 'bg-[#f4f5f7] text-neutral-text-muted cursor-not-allowed border border-neutral-border/40'
                            : 'bg-[#172b4d] text-white shadow-lg shadow-black/10 hover:shadow-xl hover:bg-black active:scale-95'
                        }`}
                >
                    {isSaving ? (
                        <>
                            <div className="w-3 h-3 border-2 border-neutral-text-muted/30 border-t-neutral-text-muted rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : showSavedMsg ? (
                        <>
                            <FiCheck className="text-white" />
                            Configuration Applied
                        </>
                    ) : (
                        <>
                            <FiSave className={!hasChanges ? 'opacity-40' : ''} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {/* Unified Container */}
            <div className="bg-white dark:bg-neutral-card rounded-[32px] border border-neutral-border/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">

                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-3 p-8 bg-neutral-bg/20 dark:bg-black/10 relative">
                        {/* Meeting Point Fading Shadow */}
                        <div className="absolute top-0 right-0 w-[40px] h-full bg-gradient-to-l from-white/20 dark:from-black/10 to-transparent pointer-events-none"></div>

                        <div className="space-y-2 relative z-10">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-[#172b4d] text-white shadow-lg shadow-black/10'
                                        : 'text-neutral-text-muted hover:text-neutral-text-main hover:bg-neutral-bg/50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`text-lg transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-neutral-text-muted/40'}`}>
                                        {tab.icon}
                                    </span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9 p-10 relative">
                        {/* Vertical Meeting Line (Fading) */}
                        <div className="absolute left-0 top-10 bottom-10 w-[1px] bg-gradient-to-b from-transparent via-neutral-border/40 dark:via-white/5 to-transparent"></div>

                        <div className="relative z-10 h-full">
                            {activeTab === 'identity' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-neutral-text-main uppercase tracking-widest">Branding Identity</h3>
                                        <p className="text-[11px] font-bold text-neutral-text-muted leading-relaxed uppercase opacity-60">System-wide labels and descriptors.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-neutral-text-muted uppercase tracking-[0.2em] ml-1">Site Official Title</label>
                                            <input
                                                type="text"
                                                value={siteTitle}
                                                onChange={(e) => setSiteTitle(e.target.value)}
                                                className="w-full px-5 py-4 bg-[#f9fafb] dark:bg-white/5 border border-neutral-border/40 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-primary-main/5 focus:border-primary-main/60 transition-all placeholder:text-neutral-text-muted/30 dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-neutral-text-muted uppercase tracking-[0.2em] ml-1">Tagline / Subtitle</label>
                                            <input
                                                type="text"
                                                value={tagline}
                                                onChange={(e) => setTagline(e.target.value)}
                                                className="w-full px-5 py-4 bg-[#f9fafb] dark:bg-white/5 border border-neutral-border/40 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-primary-main/5 focus:border-primary-main/60 transition-all placeholder:text-neutral-text-muted/30 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'visuals' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-neutral-text-main uppercase tracking-widest">Interface Appearance</h3>
                                        <p className="text-[11px] font-bold text-neutral-text-muted leading-relaxed uppercase opacity-60">System styling and visual behavior.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-neutral-text-muted uppercase tracking-[0.2em] ml-1">Base Environment Theme</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['Light', 'Dark', 'System'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setTheme(opt)}
                                                        className={`px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${theme === opt
                                                            ? 'bg-[#172b4d] text-white border-[#172b4d] shadow-lg shadow-black/10'
                                                            : 'bg-[#f4f5f7] dark:bg-white/5 text-neutral-text-muted border-neutral-border/40 hover:bg-neutral-bg animate-in'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 rounded-[24px]">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                                    <FiMonitor size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest">Theme Sync Active</h4>
                                                    <p className="text-[10px] font-bold text-blue-800/60 dark:text-blue-400/60 leading-relaxed uppercase">The interface will automatically adapt to your selection in real-time. System theme follows your OS preference.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-neutral-text-main uppercase tracking-widest">User Profile</h3>
                                        <p className="text-[11px] font-bold text-neutral-text-muted leading-relaxed uppercase opacity-60">Personal account information.</p>
                                    </div>

                                    <div className="flex flex-col items-center p-8 bg-neutral-bg/20 dark:bg-white/5 rounded-[32px] border border-neutral-border/40">
                                        <div className="mb-6 relative">
                                            {user?.picture ? (
                                                <img
                                                    src={user.picture}
                                                    alt="Profile"
                                                    referrerPolicy="no-referrer"
                                                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (nextSibling) nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-24 h-24 rounded-full bg-[#172b4d] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg"
                                                style={{ display: user?.picture ? 'none' : 'flex' }}
                                            >
                                                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-black text-neutral-text-main mb-1">{user?.firstName} {user?.lastName}</h2>
                                        <p className="text-sm font-medium text-neutral-text-muted mb-6">{user?.email}</p>

                                        <div className="w-full max-w-md grid grid-cols-1 gap-4">
                                            <div className="p-4 bg-white dark:bg-black/20 rounded-xl border border-neutral-border/40 flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-widest text-neutral-text-muted">Full Name</span>
                                                <span className="text-sm font-bold text-neutral-text-main">{user?.firstName} {user?.lastName}</span>
                                            </div>

                                            <div className="p-4 bg-white dark:bg-black/20 rounded-xl border border-neutral-border/40 flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-widest text-neutral-text-muted">Email Address</span>
                                                <span className="text-sm font-bold text-neutral-text-main">{user?.email}</span>
                                            </div>

                                            <div className="p-4 bg-white dark:bg-black/20 rounded-xl border border-neutral-border/40 flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-widest text-neutral-text-muted">Username</span>
                                                <span className="text-sm font-bold text-neutral-text-main">{user?.username}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

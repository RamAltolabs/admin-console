import React, { useState, useEffect, useMemo } from 'react';
import { FiGlobe, FiMonitor, FiSave, FiCheck, FiUser, FiBell, FiShield, FiLogOut, FiRotateCcw } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type SettingsTab = 'identity' | 'visuals' | 'profile' | 'notifications' | 'security';
type ThemeMode = 'Light' | 'Dark' | 'System';

interface AppSettingsState {
    siteTitle: string;
    tagline: string;
    theme: ThemeMode;
    notifyEmail: boolean;
    notifyBrowser: boolean;
    notifyMerchantOps: boolean;
    notifySecurity: boolean;
    sessionTimeoutMinutes: number;
}

const SETTINGS_STORAGE_KEY = 'admin_console_settings';
const DEFAULT_SETTINGS: AppSettingsState = {
    siteTitle: 'Altolabs Admin Console',
    tagline: 'Enterprise Intelligence & Operational Excellence',
    theme: 'System',
    notifyEmail: true,
    notifyBrowser: true,
    notifyMerchantOps: true,
    notifySecurity: true,
    sessionTimeoutMinutes: 20
};

const VALID_TABS: SettingsTab[] = ['identity', 'visuals', 'profile', 'notifications', 'security'];

const getTabFromQuery = (queryTab: string | null): SettingsTab => {
    if (queryTab && VALID_TABS.includes(queryTab as SettingsTab)) {
        return queryTab as SettingsTab;
    }
    return 'identity';
};

const getStoredSettings = (): AppSettingsState => {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(raw);
        const themeValue: ThemeMode = ['Light', 'Dark', 'System'].includes(parsed?.theme) ? parsed.theme : 'System';
        return {
            siteTitle: typeof parsed?.siteTitle === 'string' ? parsed.siteTitle : DEFAULT_SETTINGS.siteTitle,
            tagline: typeof parsed?.tagline === 'string' ? parsed.tagline : DEFAULT_SETTINGS.tagline,
            theme: themeValue,
            notifyEmail: typeof parsed?.notifyEmail === 'boolean' ? parsed.notifyEmail : DEFAULT_SETTINGS.notifyEmail,
            notifyBrowser: typeof parsed?.notifyBrowser === 'boolean' ? parsed.notifyBrowser : DEFAULT_SETTINGS.notifyBrowser,
            notifyMerchantOps: typeof parsed?.notifyMerchantOps === 'boolean' ? parsed.notifyMerchantOps : DEFAULT_SETTINGS.notifyMerchantOps,
            notifySecurity: typeof parsed?.notifySecurity === 'boolean' ? parsed.notifySecurity : DEFAULT_SETTINGS.notifySecurity,
            sessionTimeoutMinutes: typeof parsed?.sessionTimeoutMinutes === 'number' ? Math.max(5, Math.min(120, parsed.sessionTimeoutMinutes)) : DEFAULT_SETTINGS.sessionTimeoutMinutes
        };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

const Settings: React.FC = () => {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<SettingsTab>(() => getTabFromQuery(searchParams.get('tab')));
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);
    const [savedSettings, setSavedSettings] = useState<AppSettingsState>(() => getStoredSettings());
    const [draftSettings, setDraftSettings] = useState<AppSettingsState>(() => getStoredSettings());

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        const validTab = getTabFromQuery(queryTab);
        if (queryTab !== validTab) {
            setSearchParams({ tab: validTab }, { replace: true });
        }
        setActiveTab(validTab);
    }, [searchParams, setSearchParams]);

    const hasChanges = useMemo(
        () => JSON.stringify(draftSettings) !== JSON.stringify(savedSettings),
        [draftSettings, savedSettings]
    );

    useEffect(() => {
        const root = window.document.documentElement;
        if (draftSettings.theme === 'Dark') {
            root.classList.add('dark');
        } else if (draftSettings.theme === 'Light') {
            root.classList.remove('dark');
        } else {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', isDark);
        }
    }, [draftSettings.theme]);

    useEffect(() => {
        window.document.title = `${draftSettings.siteTitle || 'Admin Portal'} | Settings`;
    }, [draftSettings.siteTitle]);

    const setTab = (tab: SettingsTab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(draftSettings));
            window.dispatchEvent(new Event('app-settings-updated'));
            setSavedSettings(draftSettings);
            setIsSaving(false);
            setShowSavedMsg(true);
            setTimeout(() => setShowSavedMsg(false), 3000);
        }, 500);
    };

    const handleReset = () => {
        setDraftSettings(savedSettings);
    };

    const tabs = [
        { id: 'identity', label: 'Site Identity', icon: <FiGlobe /> },
        { id: 'visuals', label: 'Visual Interface', icon: <FiMonitor /> },
        { id: 'profile', label: 'My Profile', icon: <FiUser /> },
        { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
        { id: 'security', label: 'Security', icon: <FiShield /> },
    ];

    const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
        <button
            onClick={() => onChange(!checked)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${checked
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-white dark:bg-black/20 border-neutral-border/40 text-neutral-text-secondary'
                }`}
        >
            <span className="text-xs font-bold tracking-wide">{label}</span>
            <span className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5 left-[1px]' : 'translate-x-0 left-[1px]'}`} />
            </span>
        </button>
    );

    return (
        <div className="p-3 md:p-5 lg:p-6 mx-auto space-y-4 pb-12 animate-in fade-in duration-700">
            <div className="flex justify-end gap-2 pb-2 border-b border-neutral-border/30">
                <button
                    onClick={handleReset}
                    disabled={isSaving || !hasChanges}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[10px] titlecase tracking-widest border border-neutral-border/30 bg-white hover:bg-neutral-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiRotateCcw />
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-[10px] titlecase tracking-widest transition-all ${isSaving
                        ? 'bg-neutral-bg text-neutral-text-muted cursor-not-allowed opacity-50'
                        : !hasChanges
                            ? 'bg-[#f4f5f7] text-neutral-text-muted cursor-not-allowed border border-neutral-border/20'
                            : 'bg-[#172b4d] text-white shadow-md hover:bg-black active:scale-95'
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

            <div className="bg-white dark:bg-neutral-card rounded-2xl border border-neutral-border/40 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
                    <div className="lg:col-span-3 p-5 bg-neutral-bg/20 dark:bg-black/10 relative">
                        <div className="absolute top-0 right-0 w-[20px] h-full bg-gradient-to-l from-white/10 dark:from-black/10 to-transparent pointer-events-none"></div>

                        <div className="space-y-1 relative z-10">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTab(tab.id as SettingsTab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold titlecase tracking-[0.15em] transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-[#172b4d] text-white shadow-md'
                                        : 'text-neutral-text-secondary hover:text-primary-main hover:bg-white/50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`text-base transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-neutral-text-muted/40'}`}>
                                        {tab.icon}
                                    </span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-9 p-6 relative">
                        <div className="absolute left-0 top-6 bottom-6 w-[1px] bg-gradient-to-b from-transparent via-neutral-border/20 dark:via-white/5 to-transparent"></div>

                        <div className="relative z-10 h-full">
                            {activeTab === 'identity' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-0.5">
                                        <h3 className="text-sm font-bold text-neutral-text-main titlecase tracking-widest">Branding Identity</h3>
                                        <p className="text-[10px] font-bold text-neutral-text-muted titlecase opacity-60">System-wide labels and descriptors.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-neutral-text-muted titlecase tracking-[0.15em] ml-1">Site Official Title</label>
                                            <input
                                                type="text"
                                                value={draftSettings.siteTitle}
                                                onChange={(e) => setDraftSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
                                                className="w-full px-4 py-3 bg-[#f9fafb] dark:bg-white/5 border border-neutral-border/40 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-main/10 focus:border-primary-main/60 transition-all placeholder:text-neutral-text-muted/30 dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-neutral-text-muted titlecase tracking-[0.15em] ml-1">Tagline / Subtitle</label>
                                            <input
                                                type="text"
                                                value={draftSettings.tagline}
                                                onChange={(e) => setDraftSettings(prev => ({ ...prev, tagline: e.target.value }))}
                                                className="w-full px-4 py-3 bg-[#f9fafb] dark:bg-white/5 border border-neutral-border/40 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-main/10 focus:border-primary-main/60 transition-all placeholder:text-neutral-text-muted/30 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'visuals' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-0.5">
                                        <h3 className="text-sm font-bold text-neutral-text-main titlecase tracking-widest">Interface Appearance</h3>
                                        <p className="text-[10px] font-bold text-neutral-text-muted titlecase opacity-60">System styling and visual behavior.</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-bold text-neutral-text-muted titlecase tracking-[0.15em] ml-1">Base Environment Theme</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['Light', 'Dark', 'System'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setDraftSettings(prev => ({ ...prev, theme: opt as ThemeMode }))}
                                                        className={`px-4 py-3 rounded-xl text-[10px] font-bold titlecase tracking-widest transition-all border ${draftSettings.theme === opt
                                                            ? 'bg-[#172b4d] text-white border-[#172b4d] shadow-md'
                                                            : 'bg-[#f4f5f7] dark:bg-white/5 text-neutral-text-muted border-neutral-border/40 hover:bg-neutral-bg'
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
                                                    <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 titlecase tracking-widest">Theme Sync Active</h4>
                                                    <p className="text-[10px] font-bold text-blue-800/60 dark:text-blue-400/60 leading-relaxed titlecase">The interface will automatically adapt to your selection in real-time. System theme follows your OS preference.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-neutral-text-main titlecase tracking-widest">User Profile</h3>
                                        <p className="text-[11px] font-bold text-neutral-text-muted leading-relaxed titlecase opacity-60">Personal account information.</p>
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
                                                <span className="text-xs font-black titlecase tracking-widest text-neutral-text-muted">Full Name</span>
                                                <span className="text-sm font-bold text-neutral-text-main">{user?.firstName} {user?.lastName}</span>
                                            </div>

                                            <div className="p-4 bg-white dark:bg-black/20 rounded-xl border border-neutral-border/40 flex items-center justify-between">
                                                <span className="text-xs font-black titlecase tracking-widest text-neutral-text-muted">Email Address</span>
                                                <span className="text-sm font-bold text-neutral-text-main">{user?.email}</span>
                                            </div>

                                            <div className="p-4 bg-white dark:bg-black/20 rounded-xl border border-neutral-border/40 flex items-center justify-between">
                                                <span className="text-xs font-black titlecase tracking-widest text-neutral-text-muted">Username</span>
                                                <span className="text-sm font-bold text-neutral-text-main">{user?.username}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-neutral-text-main titlecase tracking-widest">Notifications</h3>
                                        <p className="text-[11px] font-bold text-neutral-text-muted leading-relaxed titlecase opacity-60">Configure how you receive operational alerts.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Toggle label="Email Notifications" checked={draftSettings.notifyEmail} onChange={(value) => setDraftSettings(prev => ({ ...prev, notifyEmail: value }))} />
                                        <Toggle label="Browser Notifications" checked={draftSettings.notifyBrowser} onChange={(value) => setDraftSettings(prev => ({ ...prev, notifyBrowser: value }))} />
                                        <Toggle label="Merchant Ops Alerts" checked={draftSettings.notifyMerchantOps} onChange={(value) => setDraftSettings(prev => ({ ...prev, notifyMerchantOps: value }))} />
                                        <Toggle label="Security Alerts" checked={draftSettings.notifySecurity} onChange={(value) => setDraftSettings(prev => ({ ...prev, notifySecurity: value }))} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-neutral-text-main titlecase tracking-widest">Security Controls</h3>
                                        <p className="text-[11px] font-bold text-neutral-text-muted leading-relaxed titlecase opacity-60">Manage session behavior and account access actions.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-neutral-text-muted titlecase tracking-[0.15em] ml-1">Session Timeout (Minutes)</label>
                                            <input
                                                type="number"
                                                min={5}
                                                max={120}
                                                step={1}
                                                value={draftSettings.sessionTimeoutMinutes}
                                                onChange={(e) => {
                                                    const next = Number(e.target.value);
                                                    setDraftSettings(prev => ({ ...prev, sessionTimeoutMinutes: isNaN(next) ? 5 : Math.max(5, Math.min(120, next)) }));
                                                }}
                                                className="w-full px-4 py-3 bg-[#f9fafb] dark:bg-white/5 border border-neutral-border/40 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-main/10 focus:border-primary-main/60 transition-all placeholder:text-neutral-text-muted/30 dark:text-white"
                                            />
                                        </div>
                                        <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-xs font-black text-red-700 tracking-wider">Active Session</h4>
                                                <p className="text-[11px] font-semibold text-red-600/90 mt-2">Immediately sign out from the current session.</p>
                                            </div>
                                            <button
                                                onClick={logout}
                                                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-[10px] font-black tracking-widest hover:bg-red-700 transition-colors"
                                            >
                                                <FiLogOut />
                                                Sign Out Now
                                            </button>
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

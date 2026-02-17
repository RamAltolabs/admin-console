import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiCheck, FiLayout, FiMaximize, FiMinimize, FiSettings, FiMessageSquare, FiEdit2, FiCpu, FiAlertCircle } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import { Merchant, Engagement } from '../types/merchant';

interface BotSettingsCardProps {
    merchantId: string;
    cluster?: string;
}

interface BotSettings {
    // Appearance
    widgetColor: string;
    widgetSize: 'small' | 'medium' | 'large' | 'copilot';

    // Behavior (Toggles)
    widgetLoadChatHistory: boolean;
    widgetDisplayAgentName: boolean;
    widgetClearContextOnStart: boolean;
    widgetDisableBranding: boolean;
    widgetEnableScreenCapture: boolean;
    widgetDisableMobileProact: boolean;
    widgetEnableMobileMic: boolean;
    widgetDisableWebMic: boolean;
    widgetShowMobileCloseButton: boolean;
    widgetDisableAttachment: boolean;
    widgetDisableAnimation: boolean;
    widgetTrackLocation: boolean;

    // Engagement
    internalChatId: string | null;
}

const defaultSettings: BotSettings = {
    widgetColor: '#3B82F6',
    widgetSize: 'medium',
    widgetLoadChatHistory: true,
    widgetDisplayAgentName: true,
    widgetClearContextOnStart: true,
    widgetDisableBranding: false,
    widgetEnableScreenCapture: false,
    widgetDisableMobileProact: false,
    widgetEnableMobileMic: false,
    widgetDisableWebMic: false,
    widgetShowMobileCloseButton: false,
    widgetDisableAttachment: false,
    widgetDisableAnimation: false,
    widgetTrackLocation: false,
    internalChatId: null
};

const BotSettingsCard: React.FC<BotSettingsCardProps> = ({ merchantId, cluster }) => {
    const [settings, setSettings] = useState<BotSettings>(defaultSettings);
    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // (Defining fetchSettings inside useEffect or outside? In step 199 I defined it inside useEffect again? No, let's look at the file.)
    // In step 199 I moved fetch logic into useEffect.
    // I need to be able to re-fetch on Cancel. So I should extract it.

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const [merchantData, engagementListResponse] = await Promise.all([
                merchantService.getMerchantById(merchantId, cluster),
                merchantService.getEngagementList(merchantId, cluster)
            ]);

            if (merchantData) {
                const mergedSettings = { ...defaultSettings };
                const source = merchantData.settings || (merchantData as any).customConfig;

                if (source) {
                    Object.keys(defaultSettings).forEach(key => {
                        if (source[key] !== undefined) {
                            (mergedSettings as any)[key] = source[key];
                        }
                    });
                }
                setSettings(mergedSettings);
            }

            // Handle engagement list response which might be a direct array or wrapped
            let engagementList: any[] = [];
            if (Array.isArray(engagementListResponse)) {
                engagementList = engagementListResponse;
            } else if (engagementListResponse && Array.isArray((engagementListResponse as any).data)) {
                engagementList = (engagementListResponse as any).data;
            } else if (engagementListResponse && Array.isArray((engagementListResponse as any).content)) {
                engagementList = (engagementListResponse as any).content;
            } else if (engagementListResponse && Array.isArray((engagementListResponse as any).engagements)) {
                engagementList = (engagementListResponse as any).engagements;
            }

            // Filter for only chatbot/website type on website channel
            const botEngagements = engagementList.filter((e: any) => {
                const type = (e.engagementType || e.type || '').toLowerCase();
                const channel = (e.channelName || e.channel?.name || '').toLowerCase();
                const isWebsiteType = type === 'chatbot' || type === 'website';
                const isWebsiteChannel = channel === 'website' || channel === 'web';
                return isWebsiteType && isWebsiteChannel;
            });

            setEngagements(botEngagements);
        } catch (error) {
            console.error('Failed to load bot settings data:', error);
            setMessage({ type: 'error', text: 'Failed to load configuration' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchSettings();
        }
    }, [merchantId, cluster]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = {
                settings: settings,
                id: merchantId
            };
            await merchantService.updateMerchantAttributes(merchantId, payload as any, cluster);
            setMessage({ type: 'success', text: 'Bot Settings saved successfully' });
            setIsEditing(false); // Exit edit mode
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save bot settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchSettings(); // Revert changes
    };

    // Components
    const TogglePill: React.FC<{
        label: string;
        checked: boolean;
        onChange: (val: boolean) => void;
    }> = ({ label, checked, onChange }) => (
        <div
            onClick={() => isEditing && onChange(!checked)}
            className={`
                relative flex items-center p-3 rounded-lg transition-all duration-200 border
                ${isEditing ? 'cursor-pointer hover:border-gray-200' : 'cursor-default opacity-80'}
                ${checked
                    ? 'bg-blue-100/50 border-blue-200 shadow-sm'
                    : 'bg-white border-gray-100'
                }
            `}
        >
            {/* Toggle Switch */}
            <div className={`
                relative w-10 h-5 rounded-full transition-colors duration-200 mr-3 shrink-0
                ${checked ? 'bg-blue-900' : 'bg-gray-200'}
                ${!isEditing && !checked ? 'bg-gray-100' : ''}
            `}>
                <div className={`
                    absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `} />
            </div>

            <span className={`text-xs user-select-none font-bold tracking-wide ${checked ? 'text-blue-900' : 'text-gray-500'}`}>
                {label}
            </span>
        </div>
    );

    const SizeOption: React.FC<{
        size: BotSettings['widgetSize'];
        label: string;
        current: BotSettings['widgetSize'];
    }> = ({ size, label, current }) => {
        const isSelected = current === size;
        return (
            <button
                onClick={() => isEditing && setSettings(s => ({ ...s, widgetSize: size }))}
                disabled={!isEditing}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 w-32 relative group
                    ${isSelected
                        ? 'border-blue-900 bg-blue-50/30'
                        : 'border-gray-100 bg-white'
                    }
                    ${isEditing ? 'hover:border-gray-200 cursor-pointer' : 'cursor-default opacity-80'}
                `}
            >
                {/* Visual Placeholder */}
                <div className="relative w-16 h-12 bg-gray-50 rounded border border-gray-100 flex items-center justify-center overflow-hidden">
                    {/* Mock Browser UI */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gray-100 border-b border-gray-200" />

                    {/* Bot Dot */}
                    <div className={`
                        absolute rounded-t-sm shadow-sm transition-all
                        ${isSelected ? 'bg-blue-900' : 'bg-yellow-400'}
                        ${!isSelected && !isEditing ? 'bg-gray-300' : ''} 
                    `}
                        style={{
                            width: size === 'small' ? 6 : size === 'medium' ? 8 : size === 'large' ? 10 : 8,
                            height: size === 'copilot' ? '80%' : (size === 'small' ? 8 : size === 'medium' ? 12 : size === 'large' ? 16 : 20),
                            bottom: 2,
                            right: size === 'copilot' ? 0 : 2,
                            top: size === 'copilot' ? 4 : 'auto',
                        }}
                    />
                </div>

                <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-gray-400'}`}>
                    {label}
                </span>

                {isSelected && (
                    <div className="absolute top-2 right-2 text-blue-900">
                        <div className="bg-blue-900 text-white rounded-full p-0.5">
                            <FiCheck size={10} />
                        </div>
                    </div>
                )}
            </button>
        );
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header Actions */}
            <div className="flex justify-end gap-3 pb-2 min-h-[40px]">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-full text-xs font-bold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" /> : <FiSave size={14} />}
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-6 py-2 bg-white text-gray-600 border border-gray-200 rounded-full text-xs font-bold hover:bg-gray-50 transition-all shadow-sm hover:shadow"
                        >
                            <FiX size={14} />
                            Cancel
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-full text-xs font-bold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg"
                    >
                        <FiEdit2 size={14} />
                        Edit Settings
                    </button>
                )}
            </div>

            {message && (
                <div className={`
                    fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300
                    ${message.type === 'success'
                        ? 'bg-white border-green-100 text-green-800 shadow-green-900/5'
                        : 'bg-white border-red-100 text-red-800 shadow-red-900/5'}
                `}>
                    <div className={`p-1.5 rounded-full ${message.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {message.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
                    </div>
                    <span className="text-sm font-bold">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                        <FiX size={14} />
                    </button>
                </div>
            )}

            {/* Appearance Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                    <FiEdit2 className="text-blue-900" size={14} />
                    <h3 className="text-xs font-bold text-gray-900 titlecase tracking-widest">Appearance</h3>
                </div>

                <div className="p-6 space-y-8">
                    {/* Bot Color */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 titlecase tracking-widest mb-3">Bot Color</label>
                        <div className="flex items-center gap-4">
                            <div className={`relative group ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                                <div
                                    className="w-12 h-12 rounded-lg shadow-sm border border-gray-200 transition-transform active:scale-95"
                                    style={{ backgroundColor: settings.widgetColor }}
                                />
                                <input
                                    type="color"
                                    value={settings.widgetColor}
                                    disabled={!isEditing}
                                    onChange={(e) => setSettings(s => ({ ...s, widgetColor: e.target.value }))}
                                    className={`absolute inset-0 w-full h-full opacity-0 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                                />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-700 font-mono mb-0.5">{settings.widgetColor}</div>
                                {isEditing && <div className="text-xs text-gray-400">Click the swatch to change</div>}
                            </div>
                        </div>
                    </div>

                    {/* Bot Size */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 titlecase tracking-widest mb-3">Bot Size</label>
                        <div className="flex flex-wrap gap-4">
                            <SizeOption size="small" label="Small" current={settings.widgetSize} />
                            <SizeOption size="medium" label="Medium" current={settings.widgetSize} />
                            <SizeOption size="large" label="Large" current={settings.widgetSize} />
                            <SizeOption size="copilot" label="Copilot" current={settings.widgetSize} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Behavior Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                    <FiSettings className="text-blue-900" size={14} />
                    <h3 className="text-xs font-bold text-gray-900 titlecase tracking-widest">Behavior</h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        <TogglePill label="Load Chat History" checked={settings.widgetLoadChatHistory} onChange={(v) => setSettings(s => ({ ...s, widgetLoadChatHistory: v }))} />
                        <TogglePill label="Display Agent Name" checked={settings.widgetDisplayAgentName} onChange={(v) => setSettings(s => ({ ...s, widgetDisplayAgentName: v }))} />
                        <TogglePill label="Clear Context On Start" checked={settings.widgetClearContextOnStart} onChange={(v) => setSettings(s => ({ ...s, widgetClearContextOnStart: v }))} />

                        <TogglePill label="Disable Branding" checked={settings.widgetDisableBranding} onChange={(v) => setSettings(s => ({ ...s, widgetDisableBranding: v }))} />
                        <TogglePill label="Enable Screen Capture" checked={settings.widgetEnableScreenCapture} onChange={(v) => setSettings(s => ({ ...s, widgetEnableScreenCapture: v }))} />
                        <TogglePill label="Disable Mobile Proact" checked={settings.widgetDisableMobileProact} onChange={(v) => setSettings(s => ({ ...s, widgetDisableMobileProact: v }))} />

                        <TogglePill label="Enable Mobile Mic" checked={settings.widgetEnableMobileMic} onChange={(v) => setSettings(s => ({ ...s, widgetEnableMobileMic: v }))} />
                        <TogglePill label="Disable Web Mic" checked={settings.widgetDisableWebMic} onChange={(v) => setSettings(s => ({ ...s, widgetDisableWebMic: v }))} />
                        <TogglePill label="Show Mobile Close Button" checked={settings.widgetShowMobileCloseButton} onChange={(v) => setSettings(s => ({ ...s, widgetShowMobileCloseButton: v }))} />

                        <TogglePill label="Disable Attachment" checked={settings.widgetDisableAttachment} onChange={(v) => setSettings(s => ({ ...s, widgetDisableAttachment: v }))} />
                        <TogglePill label="Disable Animation" checked={settings.widgetDisableAnimation} onChange={(v) => setSettings(s => ({ ...s, widgetDisableAnimation: v }))} />
                        <TogglePill label="Allow Location Tracking" checked={settings.widgetTrackLocation} onChange={(v) => setSettings(s => ({ ...s, widgetTrackLocation: v }))} />
                    </div>
                </div>
            </div>

            {/* Agent Chatbot Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                    <FiMessageSquare className="text-gray-900" size={14} />
                    <h3 className="text-xs font-bold text-gray-900 titlecase tracking-widest">Agent Chatbot</h3>
                </div>

                <div className="p-6">
                    <label className="block text-[10px] font-bold text-gray-400 titlecase tracking-widest mb-3">Chatbot Engagement</label>
                    <div className="relative">
                        <select
                            value={settings.internalChatId || ''}
                            onChange={(e) => setSettings(s => ({ ...s, internalChatId: e.target.value || null }))}
                            disabled={!isEditing}
                            className={`w-full appearance-none bg-white border border-blue-900/20 text-blue-900 text-xs font-bold rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-shadow 
                                ${isEditing ? 'cursor-pointer hover:border-blue-900/40' : 'cursor-default opacity-80 bg-gray-50 text-gray-500'}
                            `}
                        >
                            <option value="">Select an engagement...</option>
                            {engagements.map(engagement => {
                                const agentName = engagement.aiAgentName || engagement.aiAgent?.name;
                                return (
                                    <option key={engagement.id} value={engagement.id}>
                                        {engagement.engagementName || engagement.name || `Engagement ${engagement.id}`}
                                        {agentName ? ` (${agentName})` : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <div className={`absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none ${isEditing ? 'text-blue-900' : 'text-gray-400'}`}>
                            <FiCheck className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotSettingsCard;

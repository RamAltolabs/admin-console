import React, { useState, useEffect } from 'react';
import {
    FaWhatsapp, FaFacebookMessenger, FaFacebook, FaTwitter, FaInstagram, FaTelegram,
    FaSkype, FaGoogle, FaGooglePlay, FaMobileAlt, FaRobot, FaComments, FaWeixin, FaViber,
    FaTrash, FaEdit, FaChevronDown, FaChevronUp, FaEye, FaEyeSlash, FaCheck, FaTimes
} from 'react-icons/fa';
import { BsChatDots, BsTelephoneFill, BsEnvelopeFill } from 'react-icons/bs';
import { SiAmazonalexa, SiMicrosoftteams } from 'react-icons/si';
import { MdRateReview } from 'react-icons/md';
import { FiPhoneCall, FiMail, FiGlobe, FiPlus } from 'react-icons/fi';
import merchantService from '../services/merchantService';

/**
 * ChannelsCard Component
 * Manages channel configurations and provides a catalog for connecting new platforms.
 */

// --- STYLING ---
const STYLES = `
  .channel-list .box {
    background: #fff;
    border: 1px solid #eee;
    padding: 20px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  .channel-list .box:hover {
    box-shadow: 0 8px 16px rgba(0,0,0,0.05);
    transform: translateY(-2px);
  }
  .channel-list .img-box {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .channel-list .img-box img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .channel-list .title {
    font-weight: 700;
    color: #333;
    font-size: 14px;
    margin-bottom: 4px;
    text-align: center;
  }
  .channel-list .desc {
    font-size: 10px;
    color: #999;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  .switch-handle {
    transition: transform 0.2s ease;
  }
`;

const IMAGE_BASE_URL = 'https://it-inferno.neocloud.ai';

const ICON_MAP: any = {
    'facebook': FaFacebookMessenger, 'fb': FaFacebookMessenger, 'facebook comments': FaFacebook,
    'web': FiGlobe, 'email': FiMail, 'whatsapp': FaWhatsapp, 'whatsapp business': FaWhatsapp,
    'sms': BsChatDots, 'twitter': FaTwitter, 'instagram': FaInstagram, 'instagram messenger': FaFacebookMessenger,
    'instagram comments': FaComments, 'telegram': FaTelegram, 'wechat': FaWeixin, 'skype': FaSkype,
    'google business': FaGoogle, 'google business review': MdRateReview, 'google play store review': FaGooglePlay,
    'alexa': SiAmazonalexa, 'voice': FiPhoneCall, 'teams': SiMicrosoftteams, 'mobileapp': FaMobileAlt, 'viber': FaViber
};

// --- HELPERS ---
const getChannelImageUrl = (item: any, name: string) => {
    const searchName = name.toLowerCase().trim();
    let path = '';

    const mapping: any = {
        'fb': 'facebook-messenger.png',
        'facebook messenger': 'facebook-messenger.png',
        'facebook comments': 'facebook-comments.svg',
        'web': 'web.svg',
        'campaign': 'email.png',
        'email': 'email.png',
        'whatsapp business': 'whatsapp.svg',
        'sms': 'sms.png',
        'twitter': 'twitter.svg',
        'instagram': 'instagram.png',
        'instagram messenger': 'insta-messenger.svg',
        'instagram comments': 'instagram-comments.svg',
        'telegram': 'telegram.png',
        'wechat': 'wechat.svg',
        'skype': 'skype.svg',
        'imessage': 'imessage.svg',
        'google business': 'google-business.png',
        'google business review': 'google-business-review.svg',
        'google play store review': 'google-play-store-review.svg',
        'livechat': 'livechat.png',
        'alexa': 'alexa.png',
        'snapchat': 'snapchat.png',
        'cortana': 'cortana.png',
        'google assistant': 'google-assistant.png',
        'voice': 'phone.svg',
        'temi robot': 'temi-robot.svg',
        'pepper robot': 'pepper-robot.svg',
        'cruzr robot': 'cruzr-robot.svg',
        'bella robot': 'bella-bot.svg',
        'ketty robot': 'ketty-bot.svg',
        'pudu robot': 'pudu-bot.svg',
        'keenon robot': 'keenon-robotics.svg',
        'teams': 'teams.svg',
        'mobileapp': 'mobileapp.svg'
    };

    for (const key in mapping) {
        if (searchName.includes(key)) {
            path = `/img/channel/${mapping[key]}`;
            break;
        }
    }

    if (!path) {
        const val = item?.imagePath || item?.logo || item?.image;
        if (val) {
            if (val.startsWith('http')) return val;
            path = val.startsWith('/') ? val : `/${val}`;
        } else {
            path = `/img/channel/${searchName.replace(/\s+/g, '-')}.png`;
        }
    }

    return `${IMAGE_BASE_URL}${path}`;
};

const ChannelLogo = ({ src, alt, icon: Icon, className = "h-12 w-12" }: any) => {
    const [imgError, setImgError] = useState(false);
    if (imgError || !src) {
        return (
            <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 text-blue-900 shadow-sm shrink-0`}>
                {Icon ? <Icon size={24} /> : <BsChatDots size={24} />}
            </div>
        );
    }
    return (
        <div className={`${className} flex items-center justify-center overflow-hidden shrink-0`}>
            <img src={src} alt={alt} className="w-full h-full object-contain" onError={() => setImgError(true)} />
        </div>
    );
};

const decodeProvider = (p: string) => {
    if (!p) return '';
    if (p === 'Z3Vwc2h1cGlv') return 'Gupshup.io';
    if (p === 'gupshup') return 'Gupshup';
    try {
        if (!p.includes(' ') && p.length > 8) {
            const d = atob(p);
            return d.toLowerCase().includes('gupshup') ? 'Gupshup.io' : d;
        }
    } catch { return p; }
    return p;
};

// --- SUB-COMPONENTS ---
const InputRow = ({ label, field, type = 'text', required = false, placeholder = '', disabled = false, formState, onChange }: any) => {
    const [show, setShow] = useState(false);
    return (
        <div className="flex flex-col md:flex-row md:items-center">
            <label className="block text-sm font-semibold text-gray-500 mb-1 md:mb-0 md:w-1/3 md:text-right md:pr-8">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="relative md:w-2/3">
                <input
                    type={type === 'password' && !show ? 'password' : 'text'}
                    className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
                    value={String(formState[field] ?? '')}
                    onChange={e => onChange(field, e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                />
                {type === 'password' && !disabled && <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 transition-colors">{show ? <FaEyeSlash size={16} /> : <FaEye size={16} />}</button>}
            </div>
        </div>
    );
};

const SelectRow = ({ label, field, options, required = false, formState, onChange }: any) => (
    <div className="flex flex-col md:flex-row md:items-center">
        <label className="block text-sm font-semibold text-gray-500 mb-1 md:mb-0 md:w-1/3 md:text-right md:pr-8">{label} {required && <span className="text-red-500">*</span>}</label>
        <div className="relative md:w-2/3">
            <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm appearance-none bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer transition-all" value={formState[field] || ''} onChange={e => onChange(field, e.target.value)} required={required}>
                <option value="">Select {label}</option>
                {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <FaChevronDown className="absolute right-4 top-4 text-gray-400 text-[10px] pointer-events-none" />
        </div>
    </div>
);

const GridInput = ({ label, field, type = 'text', required = false, placeholder = '', disabled = false, formState, onChange }: any) => {
    const [show, setShow] = useState(false);
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <div className="relative">
                <input
                    type={type === 'password' && !show ? 'password' : 'text'}
                    className={`w-full border border-gray-200 rounded-md px-4 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all ${disabled ? 'bg-[#f5f5f5] text-gray-500' : 'bg-white text-gray-800'}`}
                    value={String(formState[field] ?? '')}
                    onChange={e => onChange(field, e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                />
                {type === 'password' && !disabled && (
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                        {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                )}
            </div>
        </div>
    );
};

const ChannelConfigForm: React.FC<any> = ({ config, tab, viewMode, onSave, onCancel, loading }) => {
    const isWhatsApp = String(tab?.channelId) === '9';
    const isVoice = String(tab?.channelId) === '51';
    const isEmail = String(tab?.channelId) === '53';
    const isSkype = String(tab?.channelName).toLowerCase().includes('skype');
    const isTeams = String(tab?.channelId) === '69';

    const [formState, setFormState] = useState(() => {
        const s = { ...(config || {}) };
        if (isWhatsApp && !s.phoneNumber) s.phoneNumber = s.phone_number || s.mobileNumber || s.mobile_number || s.phone || '';
        if (isVoice && !s.phoneNumber) s.phoneNumber = s.phone_number || s.mobileNumber || s.mobile_number || s.phone || '';
        return s;
    });
    const [advanceOpen, setAdvanceOpen] = useState(false);

    const handleChange = (field: string, val: string) => setFormState((p: any) => ({ ...p, [field]: val }));

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <style>{STYLES}</style>
            {!isTeams && (
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <div className="flex items-center gap-4">
                        <ChannelLogo src={tab?.imageSrc} alt={tab?.channelName} icon={tab?.icon} className="h-14 w-14" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{viewMode === 'add' ? 'Add' : 'Edit'} {tab?.channelName} Screen</h2>
                            <p className="text-xs text-gray-400">Configure your channel-specific settings</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onSave(formState)} className="bg-blue-900 text-white px-6 py-2 rounded font-bold shadow-md hover:bg-blue-800 transition-all flex items-center gap-2 text-sm"><FaCheck /> {loading ? 'Saving...' : 'Submit'}</button>
                        <button onClick={onCancel} className="bg-red-500 text-white px-6 py-2 rounded font-bold shadow-md hover:bg-red-400 transition-all flex items-center gap-2 text-sm"><FaTimes /> Cancel</button>
                    </div>
                </div>
            )}
            <div className="max-w-4xl space-y-6">
                {isSkype && (
                    <>
                        <InputRow label="Microsoft App ID" field="microsoftAppId" formState={formState} onChange={handleChange} required />
                        <InputRow label="Microsoft App Password" field="microsoftAppPassword" formState={formState} onChange={handleChange} type="password" required />
                        {viewMode === 'edit' && <InputRow label="Request URL" field="webhook_URL" formState={formState} onChange={handleChange} required />}
                    </>
                )}
                {isVoice && (<><InputRow label="Account SID" field="accountSID" formState={formState} onChange={handleChange} required /><InputRow label="Account Token" field="accountToken" formState={formState} onChange={handleChange} type="password" required /><InputRow label="Phone Number" field="phoneNumber" formState={formState} onChange={handleChange} required /><SelectRow label="Provider" field="provider" formState={formState} onChange={handleChange} options={[{ value: 'twilio', label: 'Twilio' }]} required /></>)}
                {isEmail && (<><InputRow label="Username" field="username" formState={formState} onChange={handleChange} required /><InputRow label="App Password" field="apppassword" formState={formState} onChange={handleChange} type="password" required /><InputRow label="Protocol" field="protocol" formState={formState} onChange={handleChange} required /><InputRow label="Host" field="host" formState={formState} onChange={handleChange} required /></>)}
                {isWhatsApp && (
                    <div className="space-y-6">
                        <InputRow label="Phone Number" field="phoneNumber" formState={formState} onChange={handleChange} required placeholder="e.g. 14155552671" />
                        <SelectRow label="Provider" field="provider" formState={formState} onChange={handleChange} required options={[{ value: 'Z3Vwc2h1cGlv', label: 'Gupshup.io' }, { value: 'gupshup', label: 'Gupshup' }, { value: 'Inaipi', label: 'Inaipi' }, { value: 'twilio', label: 'Twilio' }]} />

                        {/* Provider Specific Fields */}
                        {formState.provider === 'Z3Vwc2h1cGlv' && (
                            <>
                                <InputRow label="Join String" field="joinString" formState={formState} onChange={handleChange} />
                                <InputRow label="API Key" field="apiKey" formState={formState} onChange={handleChange} type="password" required />
                                <InputRow label="App Name" field="appname" formState={formState} onChange={handleChange} required />
                            </>
                        )}
                        {(formState.provider === 'gupshup' || (!formState.provider && viewMode === 'edit')) && (
                            <>
                                <InputRow label="App Name" field="appname" formState={formState} onChange={handleChange} required placeholder="Enter App Name" />
                                <InputRow label="HSM Account" field="hsmAccount" formState={formState} onChange={handleChange} required />
                                <InputRow label="HSM Account Password" field="hsmPassword" formState={formState} onChange={handleChange} type="password" required />
                            </>
                        )}
                        {formState.provider === 'twilio' && (
                            <>
                                <InputRow label="Account SID" field="accountSID" formState={formState} onChange={handleChange} required />
                                <InputRow label="Auth Token" field="authToken" formState={formState} onChange={handleChange} type="password" required />
                            </>
                        )}

                        {/* Webhook Fields - Only in Edit mode for all providers */}
                        {viewMode === 'edit' && (
                            <>
                                <InputRow label="Webhook ID" field="webhook_ID" formState={formState} onChange={handleChange} disabled />
                                <InputRow label="Webhook URL" field="webhook_URL" formState={formState} onChange={handleChange} disabled />
                            </>
                        )}

                        <div className="pt-4 mt-10 border-t">
                            <div className="flex justify-between items-center cursor-pointer py-3 px-2 hover:bg-gray-50 rounded-lg group" onClick={() => setAdvanceOpen(!advanceOpen)}>
                                <span className="text-gray-700 font-bold text-sm group-hover:text-blue-900 transition-colors">Advance Options</span>
                                {advanceOpen ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                            </div>
                            {advanceOpen && (
                                <div className="mt-4 p-6 bg-gray-50 border border-gray-100 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                                    <InputRow label="Daily Limit" field="dailyLimit" formState={formState} onChange={handleChange} placeholder="1000" />
                                    <InputRow label="Rate Limit" field="rateLimit" formState={formState} onChange={handleChange} placeholder="200" />
                                    <InputRow label="Rate Limit Interval (Minutes)" field="rateLimitInterval" formState={formState} onChange={handleChange} placeholder="2" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {isTeams && (
                    <div className="space-y-12">
                        {/* Header Section */}
                        <div className="flex items-center gap-10">
                            <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                                <img src={tab?.imageSrc} alt="" className="w-full h-full object-contain" />
                            </div>
                            <h2 className="text-4xl font-medium text-gray-800">Teams</h2>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            <GridInput label="Name" field="name" formState={formState} onChange={handleChange} required placeholder="Enter Name" />
                            <GridInput label="Tenant Id" field="tenantId" formState={formState} onChange={handleChange} required placeholder="Enter Tenant Id" />
                            <GridInput label="Client Id" field="clientId" formState={formState} onChange={handleChange} required placeholder="Enter Client Id" />
                            <GridInput label="Client Secret" field="clientSecret" formState={formState} onChange={handleChange} type="password" required placeholder="Enter Client Secret" />
                            <GridInput label="Scope" field="scope" formState={formState} onChange={handleChange} required placeholder="Enter Scope" />
                            {viewMode === 'edit' && <GridInput label="Webhook ID" field="webhook_ID" formState={formState} onChange={handleChange} disabled />}
                            {viewMode === 'edit' && <GridInput label="Webhook URL" field="webhook_URL" formState={formState} onChange={handleChange} disabled />}
                        </div>

                        {/* Footer Section */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => onSave(formState)}
                                className="bg-[#1a3a6d] text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-[#152e56] transition-all shadow-sm"
                            >
                                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px]">
                                    <FaCheck size={8} />
                                </div>
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={onCancel}
                                className="bg-[#f87171] text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-[#ef4444] transition-all shadow-sm"
                            >
                                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px]">
                                    <FaTimes size={8} />
                                </div>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MANAGE VIEW ---
const ManageChannelsView = ({ channels, activeIds, onToggle }: any) => (
    <div className="container channel-list animate-in fade-in zoom-in-95 duration-500">
        <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tighter">Connect Platforms</h3>

        <div className="bg-white border border-blue-100 rounded-2xl p-6 mb-8 flex items-center gap-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="w-20 h-20 shrink-0 bg-blue-900 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
                <img src={`${IMAGE_BASE_URL}/img/channel/image.png`} alt="Info" className="w-12 h-12 object-contain brightness-0 invert" onError={e => e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/471/471664.png"} />
            </div>
            <div className="relative z-10 max-w-3xl">
                <p className="text-base font-medium text-gray-600 leading-relaxed italic pr-4">
                    "Connect your engagements to multiple platforms instantly. Enable the channels below and proceed to their respective tabs for detailed configuration."
                </p>
                <div className="mt-3 flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-100"></span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {channels.map((item: any, i: number) => {
                const cId = item.channelId || item.id;
                const active = activeIds.includes(String(cId));
                const name = item.channelName || '';
                return (
                    <div key={i} className="box group">
                        <div className="img-box overflow-hidden">
                            <ChannelLogo
                                src={getChannelImageUrl(item, name)}
                                alt={name}
                                icon={ICON_MAP[name.toLowerCase()] || ICON_MAP[Object.keys(ICON_MAP).find(k => name.toLowerCase().includes(k)) || '']}
                                className="w-full h-full"
                            />
                        </div>
                        <div className="title truncate w-full px-2" title={name}>{name}</div>
                        <div className="desc">{item.channelCategory || 'PLATFORM'}</div>

                        <label className="relative inline-flex items-center cursor-pointer mt-auto">
                            <input type="checkbox" className="sr-only peer" checked={active} onChange={e => onToggle(cId, item, e.target.checked)} />
                            <div className="w-12 h-6 bg-gray-100 rounded-full peer peer-checked:bg-blue-900 after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6 shadow-inner ring-1 ring-gray-900/5 group-hover:ring-blue-900/20"></div>
                        </label>
                    </div>
                );
            })}
        </div>
    </div>
);

// --- MAIN EXPORTED COMPONENT ---
const ChannelsManager: React.FC<any> = ({ merchantId, cluster }) => {
    const [channelConfig, setChannelConfig] = useState<any[]>([]);
    const [availableChannels, setAvailableChannels] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('channel');
    const [tabList, setTabList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
    const [current, setCurrent] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const chanRes = await merchantService.getMerchantChannels(merchantId, 0, 100, cluster);
            const catalog = Array.isArray(chanRes) ? chanRes : (chanRes?.content || []);
            setAvailableChannels(catalog);

            const attrRes = await merchantService.getMerchantAttributes(merchantId, 0, 100, cluster, true);
            let configs: any[] = [];
            const r = attrRes as any;
            const raw = r?.content?.[0]?.merchant?.channelConfig || r?.merchant?.channelConfig || (Array.isArray(r) ? r : null);
            if (raw) configs = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [raw];

            setChannelConfig(configs);
            processTabList(configs, catalog);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const processTabList = (configs: any[], catalog: any[]) => {
        const tabs: any[] = [];
        configs.forEach(c => {
            if (!tabs.find(x => String(x.channelId) === String(c.channelId))) {
                const item = catalog.find(x => String(x.channelId || x.id) === String(c.channelId));
                let name = item?.channelName || c.name || `Channel ${c.channelId}`;
                if (String(c.channelId) === '9' && (name === 'WhatsApp' || name === 'WhatsApp Business')) name = "WhatsApp Business";
                let Icon = BsChatDots;
                for (const key in ICON_MAP) if (name.toLowerCase().includes(key)) Icon = ICON_MAP[key];
                tabs.push({ channelId: c.channelId, channelName: name, icon: Icon, imageSrc: getChannelImageUrl(item, name), configList: configs.filter(x => String(x.channelId) === String(c.channelId)) });
            }
        });
        setTabList(tabs);
    };

    useEffect(() => { if (merchantId) fetchData(); }, [merchantId, cluster]);

    const handleToggle = (id: string) => { setActiveTab(id); setViewMode('list'); };

    const saveChanges = async (newConfigs: any[]) => {
        try {
            await merchantService.updateMerchantAttributes(merchantId, { channelConfig: newConfigs, id: merchantId } as any, cluster);
            fetchData();
        } catch { }
    };

    if (loading && !tabList.length) return <div className="p-20 text-center"><div className="w-12 h-12 border-4 border-blue-900/20 border-t-blue-900 rounded-full animate-spin mx-auto mb-6"></div><p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Syncing Channels...</p></div>;

    return (
        <div className="flex flex-col overflow-hidden relative">
            <style>{STYLES}</style>

            {/* Title Section */}
            <div className="px-8 pt-6 pb-2 flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1a3a6d]">Channels</h1>
                <div className="w-4 h-4 rounded-full border border-[#1a3a6d] flex items-center justify-center text-[10px] text-[#1a3a6d] font-bold">i</div>
            </div>

            {/* Tabs Section */}
            <div className="px-8 py-4 flex gap-4 text-[13px] font-bold">
                <button
                    onClick={() => handleToggle('channel')}
                    className={`px-4 py-2 rounded-md transition-all ${activeTab === 'channel' ? 'bg-[#1a3a6d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Manage Channels
                </button>
                {tabList.map(t => (
                    <button
                        key={t.channelId}
                        onClick={() => handleToggle(String(t.channelId))}
                        className={`px-4 py-2 rounded-md transition-all ${activeTab === String(t.channelId) ? 'bg-[#1a3a6d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t.channelName}
                    </button>
                ))}
            </div>

            <div className="p-4 flex-1">
                {activeTab === 'channel'
                    ? <div className="max-w-[1400px] mx-auto w-full"><ManageChannelsView channels={availableChannels} activeIds={tabList.map(t => t.channelId)} onToggle={async (id: any, item: any, checked: boolean) => {
                        let cfgs = [...channelConfig];
                        if (checked) cfgs.push({ channelId: id, name: item.channelName, status: 'Active', createdDate: new Date().toISOString() });
                        else { if (!window.confirm("Are you sure you want to disable this channel? Existing configurations will be hidden.")) return; cfgs = cfgs.filter(c => String(c.channelId) !== String(id)); }
                        await saveChanges(cfgs);
                    }} /></div>
                    : (viewMode === 'list'
                        ? (
                            <div className="bg-[#f0f2f5] rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-in fade-in duration-300">
                                {/* Header Bar */}
                                <div className="bg-[#eaeff5] px-6 py-3 flex justify-between items-center border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#25d366] shadow-sm">
                                            {React.createElement(tabList.find(t => String(t.channelId) === activeTab)?.icon || BsChatDots, { size: 18 })}
                                        </div>
                                        <h2 className="text-sm font-bold text-gray-800">{tabList.find(t => String(t.channelId) === activeTab)?.channelName} Pages</h2>
                                    </div>
                                    <button onClick={() => { setCurrent({}); setViewMode('add'); }} className="bg-[#1a3a6d] text-white px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#152e56] transition-all">
                                        <FiPlus size={14} /> Add More
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(tabList.find(t => String(t.channelId) === activeTab)?.configList || []).map((cfg: any, i: number) => {
                                            const channelId = String(cfg.channelId);
                                            const isEmail = channelId === '53';
                                            const isVoice = channelId === '51';
                                            const isWhatsApp = channelId === '9';
                                            const isTeams = channelId === '69';

                                            return (
                                                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-6 relative group">
                                                    {/* Actions */}
                                                    <div className="absolute top-4 right-4 flex gap-3">
                                                        <button onClick={() => { setCurrent(cfg); setViewMode('edit'); }} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                            <FaEdit size={16} />
                                                        </button>
                                                        <button onClick={async () => { if (window.confirm("Delete this configuration?")) await saveChanges(channelConfig.filter(x => x.id !== cfg.id)); }} className="text-gray-400 hover:text-red-500 transition-colors">
                                                            <FaTrash size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Large Icon */}
                                                    <div className="w-24 h-24 flex items-center justify-center bg-transparent shrink-0">
                                                        <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-gray-50 shadow-sm">
                                                            <img src={tabList.find(t => String(t.channelId) === activeTab)?.imageSrc} alt="" className="w-16 h-16 object-contain" />
                                                        </div>
                                                    </div>

                                                    {/* Details List */}
                                                    <div className="flex-1 space-y-1 pt-1 text-[#666]">
                                                        {isVoice && (
                                                            <>
                                                                <div className="text-[13px]"><span className="font-semibold">Account SID:</span> {cfg.accountSID || 'N/A'}</div>
                                                                <div className="text-[13px]"><span className="font-semibold">Provider:</span> {decodeProvider(cfg.provider) || 'N/A'}</div>
                                                            </>
                                                        )}
                                                        {isWhatsApp && (
                                                            <>
                                                                <div className="text-[13px]"><span className="font-semibold">Phone Number :</span> {cfg.phoneNumber || cfg.phone_number || cfg.mobileNumber || cfg.mobile_number || cfg.phone || 'N/A'}</div>
                                                                <div className="text-[13px]"><span className="font-semibold">Provider :</span> {decodeProvider(cfg.provider) || 'N/A'}</div>
                                                            </>
                                                        )}
                                                        {isEmail && (
                                                            <>
                                                                <div className="text-[13px]"><span className="font-semibold">Username :</span> {cfg.username || 'N/A'}</div>
                                                                <div className="text-[13px]"><span className="font-semibold">Host :</span> {cfg.host || 'N/A'}</div>
                                                            </>
                                                        )}

                                                        {isTeams && (
                                                            <>
                                                                <div className="text-[13px]"><span className="font-semibold">Client ID :</span> {cfg.clientId || 'N/A'}</div>
                                                                <div className="text-[13px]"><span className="font-semibold">Tenant ID :</span> {cfg.tenantId || 'N/A'}</div>
                                                            </>
                                                        )}

                                                        <div className="text-[13px]"><span className="font-semibold">Created By:</span> {cfg.createdBy || 'meiyaps noc'}</div>
                                                        <div className="text-[13px]"><span className="font-semibold">Created Date:</span> {cfg.createdDate ? new Date(cfg.createdDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : 'Aug 29, 2025 7:28 PM'}</div>

                                                        {(isWhatsApp || isEmail || isTeams) && (
                                                            <>
                                                                <div className="text-[13px]"><span className="font-semibold">Webhook ID:</span> {cfg.webhook_ID || '3065236979996886'}</div>
                                                                <div className="text-[13px] break-all"><span className="font-semibold">Webhook URL:</span> <span className="text-blue-500 underline cursor-pointer">{cfg.webhook_URL || `https://api.neocloud.ai/cbk/v3/whatsapp/${cfg.id}`}</span></div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                        : <ChannelConfigForm config={current} tab={tabList.find(t => String(t.channelId) === activeTab)} viewMode={viewMode} onSave={async (data: any) => {
                            const isEdit = viewMode === 'edit';
                            const payload = { ...data, channelId: Number(activeTab), id: isEdit ? current.id : Math.random().toString(36).substr(2, 9), createdDate: isEdit ? current.createdDate : new Date().toISOString() };
                            let final = [...channelConfig];
                            if (isEdit) { const idx = final.findIndex(x => x.id === current.id); if (idx !== -1) final[idx] = payload; } else final.push(payload);
                            setLoading(true); await saveChanges(final); setViewMode('list'); setLoading(false);
                        }} onCancel={() => setViewMode('list')} loading={loading} />)}
            </div>
        </div>
    );
};

export default ChannelsManager;

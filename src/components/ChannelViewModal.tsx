import React from 'react';
import { FiX, FiRadio, FiCpu, FiCalendar, FiSmartphone, FiGlobe, FiInfo } from 'react-icons/fi';

interface ChannelViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: any;
}

const ChannelViewModal: React.FC<ChannelViewModalProps> = ({ isOpen, onClose, channel }) => {
    if (!isOpen || !channel) return null;

    // Helper to format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return dateStr;
        }
    };

    // Helper to get provider-specific fields
    const getProviderFields = () => {
        const provider = (channel.provider || '').toLowerCase();
        const name = (channel.name || '').toLowerCase();
        const fields: { label: string, value: string }[] = [];

        // WhatsApp specific
        if (provider.includes('whatsapp') || name.includes('whatsapp')) {
            if (channel.phoneNumber) fields.push({ label: 'Phone Number', value: channel.phoneNumber });
            if (channel.createdBy) fields.push({ label: 'Created By', value: channel.createdBy });
            if (channel.channelMerchantId) fields.push({ label: 'Channel Merchant ID', value: channel.channelMerchantId });
            if (channel.namespace) fields.push({ label: 'Namespace', value: channel.namespace });
            if (channel.elementName) fields.push({ label: 'Element Name', value: channel.elementName });
        }
        // Facebook specific
        else if (provider.includes('facebook') || name.includes('facebook') || name.includes('messenger')) {
            if (channel.pageID) fields.push({ label: 'Page ID', value: channel.pageID });
            if (channel.pageName) fields.push({ label: 'Page Name', value: channel.pageName });
            if (channel.appID) fields.push({ label: 'App ID', value: channel.appID });
        }
        // Instagram specific
        else if (provider.includes('instagram') || name.includes('instagram')) {
            if (channel.instagramAccountID) fields.push({ label: 'Account ID', value: channel.instagramAccountID });
            if (channel.username) fields.push({ label: 'Username', value: channel.username });
        }
        // Twilio specific
        else if (provider.includes('twilio') || name.includes('sms')) {
            if (channel.accountSid) fields.push({ label: 'Account SID', value: channel.accountSid });
            if (channel.phoneNumber) fields.push({ label: 'Twilio Number', value: channel.phoneNumber });
        }
        // Email specific
        else if (provider.includes('email') || name.includes('email')) {
            if (channel.emailAddress) fields.push({ label: 'Email', value: channel.emailAddress });
            if (channel.smtpServer) fields.push({ label: 'SMTP Server', value: channel.smtpServer });
            if (channel.port) fields.push({ label: 'Port', value: channel.port });
        }
        // Avaya specific
        else if (provider.includes('avaya') || name.includes('voice')) {
            if (channel.extension) fields.push({ label: 'Extension', value: channel.extension });
            if (channel.phoneNumber) fields.push({ label: 'Phone Number', value: channel.phoneNumber });
            if (channel.serverAddress) fields.push({ label: 'Server', value: channel.serverAddress });
        }
        // Web specific
        else if (provider.includes('web') || name.includes('web') || name.includes('chat')) {
            if (channel.url || channel.domain) fields.push({ label: 'Domain/URL', value: channel.url || channel.domain });
        }
        // Alexa specific
        else if (provider.includes('alexa') || name.includes('alexa')) {
            if (channel.skillName) fields.push({ label: 'Skill Name', value: channel.skillName });
            if (channel.skillId) fields.push({ label: 'Skill ID', value: channel.skillId });
            if (channel.invocationName) fields.push({ label: 'Invocation Name', value: channel.invocationName });
        }

        return fields;
    };

    const providerFields = getProviderFields();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mr-4">
                            <FiRadio className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                {channel.name || 'Channel Details'}
                            </h2>
                            <div className="flex items-center mt-1 space-x-4">
                                <span className="flex items-center text-xs font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                                    <FiCpu className="mr-1" /> {channel.provider || 'Unknown'}
                                </span>
                                {channel.createdDate && (
                                    <span className="flex items-center text-xs text-gray-500 font-medium">
                                        <FiCalendar className="mr-1" /> {formatDate(channel.createdDate)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Summary View */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                                <FiInfo className="mr-2 text-indigo-500" /> Basic Configuration
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Channel ID</span>
                                    <span className="text-gray-900 text-sm font-semibold">{channel.id || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Provider</span>
                                    <span className="text-gray-900 text-sm font-semibold uppercase">{channel.provider || 'N/A'}</span>
                                </div>

                                {providerFields.length > 0 ? (
                                    providerFields.map((field, idx) => (
                                        <div key={idx} className={`flex justify-between py-2 ${idx < providerFields.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                            <span className="text-gray-500 text-sm">{field.label}</span>
                                            <span className="text-gray-900 text-sm font-semibold">{field.value}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-500 text-sm">Identifier</span>
                                        <span className="text-gray-900 text-sm font-semibold">{channel.phoneNumber || channel.name || 'N/A'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connection View */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                                <FiGlobe className="mr-2 text-green-500" /> Connection Details
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Webhook URL</label>
                                <div className="bg-gray-50 p-2 rounded-lg break-all text-xs font-mono text-indigo-600 border border-gray-100">
                                    {channel.webhook_URL || channel.webhookUrl || 'No Webhook Configured'}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {channel.voice_enabled && (
                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-md flex items-center">
                                            Voice Enabled
                                        </span>
                                    )}
                                    {channel.srtp_enabled && (
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md flex items-center">
                                            SRTP Secured
                                        </span>
                                    )}
                                    {channel.status && (
                                        <span className={`px-2 py-1 ${channel.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} text-[10px] font-bold rounded-md flex items-center`}>
                                            {channel.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Raw JSON View */}
                    <div className="bg-gray-900 rounded-2xl p-6 shadow-inner relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-widest flex items-center">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                                Raw Configuration JSON
                            </h3>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Read-Only</span>
                        </div>
                        <pre className="text-green-400 font-mono text-xs overflow-x-auto leading-relaxed custom-scrollbar">
                            {JSON.stringify(channel, null, 4)}
                        </pre>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-gray-100 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChannelViewModal;

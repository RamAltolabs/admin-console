import React, { useState, useEffect } from 'react';
import { FiRadio, FiSearch, FiPhoneCall, FiMessageSquare, FiMessageCircle, FiPlayCircle, FiStar, FiMapPin, FiMic, FiInstagram, FiFacebook, FiSend, FiTwitter, FiMail, FiVideo, FiZap, FiGlobe, FiUsers, FiLinkedin, FiSlack, FiEye } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import ChannelViewModal from './ChannelViewModal';

interface ChannelsCardProps {
    merchantId: string;
    cluster?: string;
}

const ChannelsCard: React.FC<ChannelsCardProps> = ({ merchantId, cluster }) => {
    const [channels, setChannels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchChannels = async (pageIdx: number) => {
        setLoading(true);
        try {
            const response = await merchantService.getMerchantChannels(merchantId, pageIdx, 100, cluster);
            setChannels(response.content || []);
            setTotalPages(response.totalPages || 0);
            setPage(pageIdx);
        } catch (error) {
            console.error('Error fetching channels:', error);
            setChannels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchChannels(0);
        }
    }, [merchantId]);

    const handleViewChannel = (channel: any) => {
        setSelectedChannel(channel);
        setIsModalOpen(true);
    };

    const getChannelIcon = (channel: any) => {
        const provider = (channel.provider || '').toLowerCase();
        const name = (channel.name || '').toLowerCase();

        if (provider.includes('avaya') || name.includes('voice')) return <FiPhoneCall size={24} className="text-blue-600" />;
        if (provider.includes('twilio') || name.includes('sms')) return <FiMessageSquare size={24} className="text-red-500" />;
        if (provider.includes('whatsapp') || name.includes('whatsapp')) return <FiMessageCircle size={24} className="text-green-500" />;
        if (provider.includes('googleplaystorereview') || name.includes('googleplaystore') || name.includes('playstore')) return <FiPlayCircle size={24} className="text-emerald-500" />;
        if (name.includes('googlebusinessreview') || (name.includes('googlebusiness') && name.includes('review'))) return <FiStar size={24} className="text-amber-500" />;
        if (provider.includes('googlebusiness') || name.includes('googlebusiness')) return <FiMapPin size={24} className="text-blue-600" />;
        if (name.includes('review') || name.includes('rating')) return <FiStar size={24} className="text-amber-500" />;
        if (provider.includes('alexa') || name.includes('alexa')) return <FiMic size={24} className="text-blue-500" />;
        if (provider.includes('instagram') || name.includes('instagram')) return <FiInstagram size={24} className="text-pink-600" />;
        if (provider.includes('facebook') || name.includes('facebook') || name.includes('messenger') || provider.includes('fb ') || name.includes('fb ') || provider === 'fb' || name === 'fb') return <FiFacebook size={24} className="text-blue-700" />;
        if (provider.includes('telegram') || name.includes('telegram')) return <FiSend size={24} className="text-sky-500" />;
        if (provider.includes('twitter') || name.includes('twitter') || name.includes(' X ')) return <FiTwitter size={24} className="text-gray-900" />;
        if (provider.includes('email') || name.includes('email')) return <FiMail size={24} className="text-indigo-500" />;
        if (provider.includes('video') || name.includes('video')) return <FiVideo size={24} className="text-purple-500" />;
        if (provider.includes('zapier') || name.includes('zapier')) return <FiZap size={24} className="text-orange-500" />;
        if (provider.includes('web') || name.includes('web')) return <FiGlobe size={24} className="text-emerald-500" />;
        if (provider.includes('teams') || name.includes('teams')) return <FiUsers size={24} className="text-indigo-600" />;
        if (name.includes('chat')) return <FiMessageSquare size={24} className="text-teal-500" />;
        if (provider.includes('linkedin') || name.includes('linkedin')) return <FiLinkedin size={24} className="text-blue-800" />;
        if (provider.includes('slack') || name.includes('slack')) return <FiSlack size={24} className="text-purple-600" />;

        return <FiRadio size={24} className="text-indigo-600" />;
    };

    const getChannelBg = (channel: any) => {
        const provider = (channel.provider || '').toLowerCase();
        const name = (channel.name || '').toLowerCase();

        // Simplified Logic: check a few common ones
        if (provider.includes('sms')) return 'bg-red-50';
        if (provider.includes('whatsapp')) return 'bg-green-50';
        if (provider.includes('facebook')) return 'bg-blue-50';

        return 'bg-gray-50';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <FiRadio className="mr-2 text-genx-500" /> Communication Channels
                </h3>
            </div>

            <div className="p-6 bg-gray-50/50 min-h-[200px]">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-genx-500"></div>
                        <span className="ml-3 text-gray-600 font-medium">Loading channels...</span>
                    </div>
                ) : channels.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 italic">No channels configured.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {channels.map((channel, idx) => (
                            <div key={idx} className={`rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col ${getChannelBg(channel)}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        {getChannelIcon(channel)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900">{channel.name || 'Unnamed Channel'}</h4>
                                        <p className="text-xs text-gray-500 font-medium uppercase">{channel.provider || 'Unknown Provider'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-200/50">
                                    <button
                                        onClick={() => handleViewChannel(channel)}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center ml-auto"
                                    >
                                        <FiEye className="mr-1" /> Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ChannelViewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                channel={selectedChannel}
            />
        </div>
    );
};

export default ChannelsCard;

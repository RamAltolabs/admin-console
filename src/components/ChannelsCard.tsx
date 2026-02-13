import React, { useState, useEffect } from 'react';
import { FiRadio, FiSearch, FiPhoneCall, FiMessageSquare, FiMessageCircle, FiPlayCircle, FiStar, FiMapPin, FiMic, FiInstagram, FiFacebook, FiSend, FiTwitter, FiMail, FiVideo, FiZap, FiGlobe, FiUsers, FiLinkedin, FiSlack, FiEye, FiGrid } from 'react-icons/fi';
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
        const title = (channel.channelName || channel.displayOption || channel.name || '').toLowerCase();
        const category = (channel.channelCategory || '').toLowerCase();

        if (title.includes('voice') || title.includes('avaya') || title.includes('phone')) return <FiPhoneCall size={24} className="text-blue-600" />;
        if (title.includes('sms')) return <FiMessageSquare size={24} className="text-red-500" />;
        if (title.includes('whatsapp')) return <FiMessageCircle size={24} className="text-green-500" />;
        if (title.includes('google play') || title.includes('play store')) return <FiPlayCircle size={24} className="text-emerald-500" />;
        if (title.includes('google business review') || title.includes('rating')) return <FiStar size={24} className="text-amber-500" />;
        if (title.includes('google business')) return <FiMapPin size={24} className="text-blue-600" />;
        if (title.includes('alexa')) return <FiMic size={24} className="text-blue-500" />;
        if (title.includes('instagram')) return <FiInstagram size={24} className="text-pink-600" />;
        if (title.includes('facebook') || title.includes('fb') || title.includes('messenger')) return <FiFacebook size={24} className="text-blue-700" />;
        if (title.includes('telegram')) return <FiSend size={24} className="text-sky-500" />;
        if (title.includes('twitter') || title.includes(' x ')) return <FiTwitter size={24} className="text-gray-900" />;
        if (title.includes('email')) return <FiMail size={24} className="text-indigo-500" />;
        if (title.includes('video') || title.includes('youtube')) return <FiVideo size={24} className="text-red-600" />;
        if (title.includes('zapier')) return <FiZap size={24} className="text-orange-500" />;
        if (title.includes('web') || title.includes('site')) return <FiGlobe size={24} className="text-emerald-500" />;
        if (title.includes('teams')) return <FiUsers size={24} className="text-indigo-600" />;
        if (title.includes('chat')) return <FiMessageSquare size={24} className="text-teal-500" />;
        if (title.includes('linkedin')) return <FiLinkedin size={24} className="text-blue-800" />;
        if (title.includes('slack')) return <FiSlack size={24} className="text-purple-600" />;
        if (title.includes('viber')) return <FiPhoneCall size={24} className="text-purple-500" />;
        if (title.includes('snapchat')) return <FiSend size={24} className="text-yellow-400" />;
        if (title.includes('pinterest')) return <FiGrid size={24} className="text-red-600" />;
        if (title.includes('tiktok')) return <FiVideo size={24} className="text-black" />;

        return <FiRadio size={24} className="text-indigo-600" />;
    };

    const getChannelBg = (channel: any) => {
        const title = (channel.channelName || channel.displayOption || channel.name || '').toLowerCase();

        // Simplified Logic: check a few common ones
        if (title.includes('sms') || title.includes('youtube') || title.includes('pinterest')) return 'bg-red-50';
        if (title.includes('whatsapp') || title.includes('web')) return 'bg-green-50';
        if (title.includes('facebook') || title.includes('linkedin') || title.includes('twitter') || title.includes('teams')) return 'bg-blue-50';
        if (title.includes('instagram')) return 'bg-pink-50';
        if (title.includes('snapchat') || title.includes('star')) return 'bg-yellow-50';
        if (title.includes('slack') || title.includes('viber')) return 'bg-purple-50';

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
                            <div key={idx} className={`standard-tile flex-col items-start ${getChannelBg(channel)}`}>
                                <div className="flex items-center gap-3 w-full">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        {React.cloneElement(getChannelIcon(channel) as React.ReactElement, { size: 16 })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-neutral-text-main truncate">{channel.channelName || channel.displayOption || channel.name || 'Unnamed Channel'}</h4>
                                        <p className="text-[10px] text-neutral-text-muted font-bold uppercase tracking-wider">{channel.channelCategory || channel.provider || 'Unknown Category'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end w-full mt-2 pt-2 border-t border-neutral-border/30">
                                    <button
                                        onClick={() => handleViewChannel(channel)}
                                        className="tile-btn-view"
                                    >
                                        <FiEye className="mr-1" />  View Details                                    </button>
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

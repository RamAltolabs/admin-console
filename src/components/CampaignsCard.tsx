import React, { useState, useEffect } from 'react';
import { FiSend, FiRefreshCw, FiSearch, FiFilter, FiEye, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiInfo, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import merchantService from '../services/merchantService';

interface CampaignsCardProps {
    merchantId: string;
    cluster?: string;
}

const CampaignsCard: React.FC<CampaignsCardProps> = ({ merchantId, cluster }) => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pageIndex, setPageIndex] = useState(0);
    const [isViewing, setIsViewing] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const pageSize = 10;

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const response = await merchantService.getCampaigns(merchantId, cluster);
            setCampaigns(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchCampaigns();
        }
    }, [merchantId, cluster]);

    const handleView = (camp: any) => {
        setSelectedCampaign(camp);
        setIsViewing(true);
    };

    const handleBack = () => {
        setIsViewing(false);
        setSelectedCampaign(null);
    };

    const filteredCampaigns = campaigns.filter((camp: any) => {
        const matchesStatus = statusFilter === 'all' || (camp.status || '').toLowerCase() === statusFilter.toLowerCase();

        if (!searchQuery) return matchesStatus;
        const query = searchQuery.toLowerCase();

        const name = (camp.broadCastName || '').toLowerCase();
        const creator = (camp.createBy || '').toLowerCase();
        const desc = (camp.description || '').toLowerCase();
        const id = (camp.id || '').toLowerCase();

        return matchesStatus && (name.includes(query) || id.includes(query) || creator.includes(query) || desc.includes(query));
    });

    const totalPages = Math.ceil(filteredCampaigns.length / pageSize);
    const paginatedCampaigns = filteredCampaigns.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    if (isViewing) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                {/* Header Section for View Mode */}
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Broadcast</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <FiSend className="text-blue-400" size={14} />
                            <span>Broadcasts are personalized messages delivered to visitors through multiple channels.</span>
                        </p>
                    </div>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                        <FiChevronLeft size={16} />
                        BACK
                    </button>
                </div>

                <div className="p-8 flex flex-col lg:flex-row gap-12">
                    {/* Form Side */}
                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Broadcast Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                readOnly
                                value={selectedCampaign?.broadCastName || ''}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Description</label>
                            <input
                                type="text"
                                readOnly
                                value={selectedCampaign?.description || ''}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Target Channels <span className="text-red-500">*</span></label>
                            <select disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none cursor-not-allowed">
                                <option>{selectedCampaign?.channels?.[0]?.channelType || 'WhatsApp'}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Broadcast Type</label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="radio" checked={selectedCampaign?.message?.messageType !== 'templateMessage'} readOnly className="w-4 h-4 text-blue-500" />
                                    Session Message
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="radio" checked={selectedCampaign?.message?.messageType === 'templateMessage'} readOnly className="w-4 h-4 text-blue-500" />
                                    Template Message
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Template</label>
                            <select disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none cursor-not-allowed">
                                <option>Select Template</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Header</label>
                            <input type="text" readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none" />
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                            <label className="text-sm font-medium text-gray-600 mt-2">Message</label>
                            <textarea
                                readOnly
                                value={selectedCampaign?.message?.template || ''}
                                rows={5}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none resize-none leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Footer</label>
                            <input type="text" readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none" />
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Image URL</label>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    readOnly
                                    value={selectedCampaign?.message?.mediaUrl || ''}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none"
                                />
                                {selectedCampaign?.message?.mediaUrl && (
                                    <div className="w-20 h-20 rounded border border-gray-200 overflow-hidden bg-white p-1">
                                        <img src={selectedCampaign.message.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Target Segment</label>
                            <select disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none cursor-not-allowed">
                                <option>Select Target Segment</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                            <label className="text-sm font-medium text-gray-600 mt-1">Upload Segment</label>
                            <div className="text-xs text-blue-600 font-medium break-all underline cursor-pointer">
                                {selectedCampaign?.recipients?.fileDetails?.[0]?.fileName || 'No file uploaded'}
                            </div>
                        </div>

                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <label className="text-sm font-medium text-gray-600">Schedule <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                readOnly
                                value={String(selectedCampaign?.status || '').toUpperCase()}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="w-full lg:w-[400px]">
                        <div className="bg-gray-100 rounded-2xl p-6 border border-gray-200 h-full">
                            <div className="flex items-center gap-2 mb-4 text-gray-700">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                    <FaWhatsapp className="text-[#25D366]" size={18} />
                                </div>
                                <span className="font-bold text-sm tracking-tight">Preview</span>
                            </div>

                            <div className="relative">
                                {/* WhatsApp Style Bubble */}
                                <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-[320px] mx-auto border border-gray-100">
                                    {selectedCampaign?.message?.mediaUrl && (
                                        <div className="w-full aspect-[4/3] bg-gray-50 overflow-hidden">
                                            <img
                                                src={selectedCampaign.message.mediaUrl}
                                                alt="Broadcast Asset"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4 space-y-2">
                                        <p className="text-[13px] text-gray-800 leading-normal whitespace-pre-wrap font-sans">
                                            {selectedCampaign?.message?.template}
                                        </p>
                                        <div className="flex justify-end items-center gap-1 mt-1">
                                            <span className="text-[10px] text-gray-400">04:39 PM</span>
                                            <div className="flex text-blue-400 scale-75">
                                                <FiCheckCircle size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header Section from Screenshot */}
            <div className="p-6 border-b border-gray-50 text-left">
                <h2 className="text-xl font-bold text-gray-900">Broadcast</h2>
                <p className="text-sm text-gray-500 flex items-start gap-2 mt-2">
                    <FiSend className="mt-1 text-blue-400 shrink-0" size={14} />
                    <span>Broadcasts are personalized messages delivered to visitors through multiple channels. Easily create and send a new broadcast to engage with visitors using the 'Create Broadcast' feature.</span>
                </p>
            </div>

            {/* Filters bar */}
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1 max-w-sm">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search by name, creator or description..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="appearance-none pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-gray-600 font-medium cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                        </select>
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    </div>
                </div>

                <button
                    onClick={fetchCampaigns}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg transition-all"
                    title="Refresh Data"
                >
                    <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-24">Action</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-500 group">
                                <div className="flex items-center gap-1.5">
                                    Broadcast Name
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-500 group">
                                <div className="flex items-center gap-1.5">
                                    Created By
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-500 group">
                                <div className="flex items-center gap-1.5">
                                    Created Date
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-500 group">
                                <div className="flex items-center gap-1.5">
                                    Description
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-500 group">
                                <div className="flex items-center gap-1.5">
                                    Status
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                                        <span className="text-sm font-medium text-gray-400">Loading broadcasts...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedCampaigns.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-gray-400">
                                    <FiSend size={40} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No records found</p>
                                </td>
                            </tr>
                        ) : (
                            paginatedCampaigns.map((camp: any) => (
                                <tr key={camp.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleView(camp)}
                                            className="tile-btn-view"
                                            title="View Details"
                                        >
                                            <FiEye size={14} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleView(camp)}
                                            className="text-sm font-medium text-blue-500 hover:underline text-left"
                                        >
                                            {camp.broadCastName}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                        {camp.createBy}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {camp.createdDate}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">
                                        {camp.description || '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-bold text-gray-700 tracking-wider">
                                            {String(camp.status).toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination bar from Screenshot */}
            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white text-sm">
                <div className="text-gray-600 font-bold">
                    {filteredCampaigns.length > 0 ? (
                        <span>{pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filteredCampaigns.length)} of {filteredCampaigns.length}</span>
                    ) : '0 to 0 of 0'}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPageIndex(0)}
                            disabled={pageIndex === 0}
                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                        >
                            <FiChevronsLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
                            disabled={pageIndex === 0}
                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                        >
                            <FiChevronLeft size={18} />
                        </button>
                        <span className="mx-2 px-3 py-1 bg-gray-50 rounded text-gray-600 font-bold">
                            Page <span className="text-gray-900">{pageIndex + 1}</span> of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPageIndex(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={pageIndex >= totalPages - 1}
                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                        >
                            <FiChevronRight size={18} />
                        </button>
                        <button
                            onClick={() => setPageIndex(totalPages - 1)}
                            disabled={pageIndex >= totalPages - 1}
                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                        >
                            <FiChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignsCard;

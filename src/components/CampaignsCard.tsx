import React, { useState, useEffect } from 'react';
import { FiSend, FiRefreshCw, FiSearch, FiFilter, FiEye, FiArrowLeft, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiInfo, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
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
    const [showFilters, setShowFilters] = useState(false);
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
            {isViewing ? (
                <>
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
                            className="bg-[#1a3a6d] text-white px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#152e56] transition-all shadow-sm group"
                        >
                            <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back
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
                </>
            ) : (
                <>
                    {/* Header Section from Screenshot */}
                    <div className="p-6 border-b border-gray-50 text-left">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Broadcast</h2>
                        <p className="text-sm text-gray-500 flex items-start gap-2 mt-2 leading-relaxed">
                            <FiSend className="mt-1 text-blue-900 shrink-0" size={14} />
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
                                <button
                                    className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <FiFilter size={16} />
                                    {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase()}
                                </button>
                                {showFilters && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                                        <div className="text-xs font-bold text-gray-500 titlecase mb-3">Filter by Status</div>
                                        <div className="space-y-2">
                                            {['all', 'completed', 'processing', 'failed'].map(status => (
                                                <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors">
                                                    <input
                                                        type="radio"
                                                        name="statusFilter"
                                                        value={status}
                                                        checked={statusFilter === status}
                                                        onChange={(e) => {
                                                            setStatusFilter(e.target.value);
                                                            setPageIndex(0);
                                                        }}
                                                        className="text-blue-900 focus:ring-blue-900 h-4 w-4"
                                                    />
                                                    <span className="text-sm text-gray-700 titlecase font-bold">
                                                        {status === 'all' ? 'All Status' : status}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-gray-100 px-2 py-1 rounded">
                                {filteredCampaigns.length} Results
                            </span>
                            <button
                                onClick={fetchCampaigns}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                                title="Refresh Data"
                            >
                                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 titlecase tracking-wider w-24">Action</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 titlecase tracking-wider cursor-pointer hover:text-blue-900 group">
                                        <div className="flex items-center gap-1.5">
                                            Broadcast Name
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 titlecase tracking-wider cursor-pointer hover:text-blue-900 group">
                                        <div className="flex items-center gap-1.5">
                                            Created By
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 titlecase tracking-wider cursor-pointer hover:text-blue-900 group">
                                        <div className="flex items-center gap-1.5">
                                            Created Date
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 titlecase tracking-wider cursor-pointer hover:text-blue-900 group">
                                        <div className="flex items-center gap-1.5">
                                            Description
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 titlecase tracking-wider cursor-pointer hover:text-blue-900 group">
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
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 border-4 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                                                <p className="text-xs font-bold text-gray-400 titlecase tracking-widest">Loading broadcasts...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedCampaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-gray-400">
                                            <div className="flex flex-col items-center py-10">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                                    <FiSend className="text-gray-300" size={28} />
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-600 mb-1">No Broadcasts Found</h4>
                                                <p className="text-xs text-gray-400">No records match your current filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCampaigns.map((camp: any) => (
                                        <tr key={camp.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleView(camp)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-blue-900 hover:text-white transition-all shadow-sm border border-gray-100"
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
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                            Page {pageIndex + 1} of {totalPages || 1}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPageIndex(0)}
                                disabled={pageIndex === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <FiChevronsLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
                                disabled={pageIndex === 0}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPageIndex(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={pageIndex >= totalPages - 1}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setPageIndex(totalPages - 1)}
                                disabled={pageIndex >= totalPages - 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <FiChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CampaignsCard;

import React, { useState, useEffect } from 'react';
import { FiTag, FiSearch } from 'react-icons/fi';
import { MerchantAttribute } from '../types/merchant';
import merchantService from '../services/merchantService';

interface MerchantAttributesCardProps {
    merchantId: string;
    cluster?: string;
}

const MerchantAttributesCard: React.FC<MerchantAttributesCardProps> = ({ merchantId, cluster }) => {
    const [attributes, setAttributes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAttributes = async () => {
        setLoading(true);
        try {
            // Note: getMerchantAttributes returns a PageResponse but currently logic puts all in content
            const response = await merchantService.getMerchantAttributes(merchantId, 0, 100, cluster);
            setAttributes(response.content || []);
        } catch (error) {
            console.error('Error fetching attributes:', error);
            setAttributes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchAttributes();
        }
    }, [merchantId]);

    const filteredAttributes = attributes.filter(item => {
        if (!searchQuery) return true;
        const term = searchQuery.toLowerCase();
        // Item might be Key-Value pair or Object
        const key = item.key || item.name || '';
        const value = item.value || item.description || '';
        return (
            key.toLowerCase().includes(term) ||
            String(value).toLowerCase().includes(term)
        );
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <FiTag className="mr-2 text-genx-500" /> Merchant Attributes
                </h3>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search attributes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-50/50 min-h-[200px]">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-genx-500"></div>
                        <span className="ml-3 text-gray-600 font-medium">Loading attributes...</span>
                    </div>
                ) : filteredAttributes.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 italic">No attributes found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAttributes.map((attr, idx) => (
                            <div key={idx} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    {attr.key || attr.name || 'Unknown Key'}
                                </span>
                                <span className="text-sm font-medium text-gray-900 break-words">
                                    {String(attr.value || attr.description || 'N/A')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MerchantAttributesCard;

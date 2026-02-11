import React, { useState, useEffect } from 'react';
import { FiShoppingCart, FiRefreshCw, FiPackage, FiSearch, FiDollarSign, FiTag, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface ProductsCardProps {
    merchantId: string;
    cluster?: string;
}

const ProductsCard: React.FC<ProductsCardProps> = ({ merchantId, cluster }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [includeInactive, setIncludeInactive] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await merchantService.getProducts(merchantId, cluster, false, includeInactive);
            // Handle various response shapes
            const items = Array.isArray(response) ? response :
                response?.products || response?.content || response?.data || response?.items || [];
            setProducts(Array.isArray(items) ? items : []);
        } catch (error) {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [merchantId, cluster, includeInactive]);

    const filteredProducts = products.filter((product: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const name = (product.name || product.productName || product.title || '').toLowerCase();
        const category = (product.category || product.categoryName || '').toLowerCase();
        const sku = (product.sku || product.productId || '').toLowerCase();
        return name.includes(query) || category.includes(query) || sku.includes(query);
    });

    const getPrice = (product: any) => {
        const price = product.price || product.unitPrice || product.amount || product.cost || 0;
        if (typeof price === 'number') return `$${price.toFixed(2)}`;
        if (typeof price === 'string') return price.startsWith('$') ? price : `$${price}`;
        return 'N/A';
    };

    const getStatus = (product: any) => {
        if (product.active === true || product.status === 'active' || product.status === 'Active') return 'Active';
        if (product.active === false || product.status === 'inactive' || product.status === 'Inactive') return 'Inactive';
        if (product.available === true) return 'Available';
        if (product.available === false) return 'Unavailable';
        return product.status || 'Unknown';
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:w-72">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-500 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeInactive}
                            onChange={(e) => setIncludeInactive(e.target.checked)}
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500/20"
                        />
                        Show Inactive
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={fetchProducts}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mb-4"></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading products...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                            <FiShoppingCart className="text-gray-300" size={28} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-600 mb-1">No Products Found</h4>
                        <p className="text-xs text-gray-400 max-w-[240px]">
                            {searchQuery ? 'No products match your search query.' : 'No products have been added for this merchant yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Product</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Category</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Price</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts.map((product: any, index: number) => {
                                    const status = getStatus(product);
                                    const isActive = status === 'Active' || status === 'Available';

                                    return (
                                        <tr key={product.id || product.productId || index} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                                                        <FiPackage size={14} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">
                                                            {product.name || product.productName || product.title || 'Unnamed Product'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium">
                                                            {product.sku || product.productId || product.id || ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {product.category || product.categoryName || product.type || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-gray-800">
                                                    {getPrice(product)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${isActive
                                                        ? 'bg-green-50 text-green-600'
                                                        : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {isActive ? <FiCheckCircle size={10} /> : <FiXCircle size={10} />}
                                                    {status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsCard;

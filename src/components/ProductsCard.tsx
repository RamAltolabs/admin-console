import React, { useState, useEffect } from 'react';
import { FiShoppingCart, FiRefreshCw, FiPackage, FiSearch, FiDollarSign, FiTag, FiCheckCircle, FiXCircle, FiExternalLink, FiEye, FiX } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface ProductsCardProps {
    merchantId: string;
    cluster?: string;
}

const ProductsCard: React.FC<ProductsCardProps> = ({ merchantId, cluster }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Active'); // Default to Active
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Optimization: If filter is only 'Active', we can request fewer items.
            // Otherwise, fetch everything and filter client-side.
            const fetchAll = statusFilter !== 'Active';

            const response = await merchantService.getProducts(merchantId, cluster, fetchAll, fetchAll);

            // Handle various response shapes
            const items = Array.isArray(response) ? response :
                response?.products || response?.content || response?.data || response?.items || [];

            setProducts(Array.isArray(items) ? items : []);
        } catch (error) {
            console.error("Failed to fetch products", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [merchantId, cluster, statusFilter]);

    const getPrice = (product: any) => {
        const price = product.price || product.unitPrice || product.amount || product.cost || 0;
        if (typeof price === 'number') return `$${price.toFixed(2)}`;
        if (typeof price === 'string') return price.startsWith('$') ? price : `$${price}`;
        return 'N/A';
    };

    const getStatus = (product: any) => {
        // Prioritize explicit inactive status
        if (product.active === false || product.status === 'inactive' || product.status === 'Inactive') return 'Inactive';
        if (product.available === false) return 'Unavailable';

        // Then check for positive status
        if (product.active === true || product.status === 'active' || product.status === 'Active') return 'Active';
        if (product.available === true) return 'Available';

        return product.status || 'Unknown';
    };

    const filteredProducts = products.filter((product: any) => {
        // Search Filter
        const query = searchQuery.toLowerCase();
        const name = (product.name || product.productName || product.title || '').toLowerCase();
        const category = (product.category || product.categoryName || '').toLowerCase();
        const sku = (product.sku || product.productId || '').toLowerCase();
        const matchesSearch = !searchQuery || name.includes(query) || category.includes(query) || sku.includes(query);

        // Status Filter
        if (!matchesSearch) return false;
        if (statusFilter === 'All') return true;

        const status = getStatus(product);
        return status === statusFilter;
    });

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
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 text-xs font-bold uppercase tracking-wider border border-gray-200 rounded-lg bg-gray-50 hover:bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Available">Available</option>
                            <option value="Unavailable">Unavailable</option>
                        </select>
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-6">
                        {filteredProducts.map((product: any, index: number) => {
                            const status = getStatus(product);
                            const isActive = status === 'Active' || status === 'Available';

                            // Updated extraction logic based on sample response
                            const productUrl = product.attributes?.URL || product.url || product.productUrl || product.link;
                            const imageUrl = product.image?.thumbnail1 || product.image || product.imageUrl || product.img || product.thumbnail;

                            // Use subCategory if available for more detail
                            const displayCategory = product.subCategory || product.category || product.categoryName || product.type || 'Uncategorized';

                            return (
                                <div key={product.id || product.productId || index} className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col overflow-hidden">
                                    {/* Product Image Area */}
                                    <div className="aspect-square bg-gray-50 relative overflow-hidden p-6 flex items-center justify-center">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={product.name}
                                                className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500 will-change-transform"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    // Fallback to Icon if image loads fails
                                                    const parent = (e.target as HTMLImageElement).parentElement;
                                                    if (parent) {
                                                        const iconContainer = document.createElement('div');
                                                        iconContainer.innerHTML = '<svg stroke="currentColor" fill="none" class="text-gray-300" stroke-width="2" viewBox="0 0 24 24" height="42" width="42" xmlns="http://www.w3.org/2000/svg"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
                                                        parent.appendChild(iconContainer.firstChild as Node);
                                                        parent.classList.add('flex', 'items-center', 'justify-center');
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center text-gray-300">
                                                <FiPackage size={42} strokeWidth={1.5} />
                                            </div>
                                        )}

                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md shadow-sm border ${isActive
                                                ? 'bg-white/80 text-emerald-600 border-emerald-100'
                                                : 'bg-white/80 text-gray-500 border-gray-100'
                                                }`}>
                                                {isActive ? <FiCheckCircle size={10} className="mr-1.5" /> : <FiXCircle size={10} className="mr-1.5" />}
                                                {status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-3 flex flex-col flex-1">
                                        <div className="mb-2">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5 line-clamp-1" title={displayCategory}>
                                                {displayCategory}
                                            </p>
                                            <h3 className="font-bold text-gray-900 line-clamp-2 min-h-[1.25rem]" title={product.name || product.productName}>
                                                {product.name || product.productName || product.title || 'Unnamed Product'}
                                            </h3>
                                        </div>

                                        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400 font-medium">Price</span>
                                                <span className="text-lg font-black text-gray-900 tracking-tight">
                                                    {getPrice(product)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setEditForm(JSON.parse(JSON.stringify(product))); // Deep copy
                                                        setIsEditing(false);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View/Edit Details"
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (productUrl) {
                                                            window.open(productUrl, '_blank');
                                                        } else {
                                                            alert('Product URL not available');
                                                        }
                                                    }}
                                                    // Enable if URL exists
                                                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold ${productUrl
                                                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                                        : 'text-gray-400 bg-gray-50 cursor-not-allowed opacity-50'
                                                        }`}
                                                    disabled={!productUrl}
                                                    title={productUrl ? "View Product Page" : "No URL Available"}
                                                >
                                                    <FiExternalLink size={14} />
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 truncate pr-4">
                                {isEditing ? 'Edit Product' : (selectedProduct.name || selectedProduct.productName || 'Product Details')}
                            </h3>
                            <button
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setIsEditing(false);
                                    setEditForm(null);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                                        <input
                                            type="text"
                                            value={editForm?.name || ''}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                            <input
                                                type="text"
                                                value={editForm?.category || ''}
                                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sub Category</label>
                                            <input
                                                type="text"
                                                value={editForm?.subCategory || ''}
                                                onChange={(e) => setEditForm({ ...editForm, subCategory: e.target.value })}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price</label>
                                            <input
                                                type="number"
                                                value={editForm?.price || 0}
                                                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center pt-6">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm?.available || false}
                                                    onChange={(e) => setEditForm({ ...editForm, available: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                Available
                                            </label>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer ml-6">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm?.active || false}
                                                    onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                        <textarea
                                            value={editForm?.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows={4}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={editForm?.image && typeof editForm.image === 'object' ? (editForm.image.thumbnail1 || '') : (editForm?.image || '')}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setEditForm((prev: any) => ({
                                                    ...prev,
                                                    image: prev.image && typeof prev.image === 'object' ? { ...prev.image, thumbnail1: newVal } : newVal
                                                }));
                                            }}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product URL</label>
                                        <input
                                            type="text"
                                            value={editForm?.attributes?.URL || editForm?.url || ''}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setEditForm((prev: any) => ({
                                                    ...prev,
                                                    attributes: { ...prev.attributes, URL: newVal },
                                                    url: newVal
                                                }));
                                            }}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-6 mb-8">
                                    {/* Image */}
                                    <div className="w-full md:w-1/3 shrink-0">
                                        <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 p-4">
                                            {(selectedProduct.image?.thumbnail1 || selectedProduct.image || selectedProduct.imageUrl) ? (
                                                <img
                                                    src={selectedProduct.image?.thumbnail1 || selectedProduct.image || selectedProduct.imageUrl}
                                                    alt={selectedProduct.name}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            ) : (
                                                <FiPackage size={48} className="text-gray-300" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Core Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${(selectedProduct.active || selectedProduct.available)
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-gray-50 text-gray-500 border-gray-100'
                                                }`}>
                                                {(selectedProduct.active || selectedProduct.available) ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 uppercase">
                                                {selectedProduct.category || selectedProduct.subCategory || 'No Category'}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Price</p>
                                            <p className="text-2xl font-black text-gray-900">{getPrice(selectedProduct)}</p>
                                        </div>

                                        {selectedProduct.description && (
                                            <div>
                                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                    {selectedProduct.description}
                                                </p>
                                            </div>
                                        )}

                                        {/* Attributes / Details Mode */}
                                        {/* Attributes / Details */}
                                        {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && !isEditing && (
                                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                                <h4 className="text-sm font-bold text-gray-900 pb-2">Additional Details</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(selectedProduct.attributes).map(([key, value]) => {
                                                        if (key === 'URL' || key === 'LongDescription' || typeof value === 'object') return null; // Skip redundant or complex fields
                                                        return (
                                                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{key}</p>
                                                                <p className="text-sm font-medium text-gray-700 break-words">{String(value)}</p>
                                                            </div>
                                                        );
                                                    })}
                                                    {/* Handle LongDescription separately if needed */}
                                                    {selectedProduct.attributes.LongDescription && (
                                                        <div className="col-span-1 md:col-span-2 bg-gray-50 rounded-lg p-3">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Bio</p>
                                                            <p className="text-sm font-medium text-gray-700 break-words leading-relaxed">{selectedProduct.attributes.LongDescription}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await merchantService.updateProduct(merchantId, editForm, cluster);
                                                alert('Product updated successfully!');
                                                setIsEditing(false);
                                                setSelectedProduct(null);
                                                fetchProducts(); // Refresh list
                                            } catch (error) {
                                                console.error("Update failed", error);
                                                alert('Failed to update product');
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                                    >
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-white border border-gray-200 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-sm text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
                                    >
                                        Close
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsCard;

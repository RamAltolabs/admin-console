import React, { useState, useEffect } from 'react';
import { FiLayers, FiSearch, FiEdit2, FiTrash2, FiPlus, FiFilter, FiColumns, FiInfo, FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface OntologiesCardProps {
    merchantId: string;
    cluster?: string;
}

const OntologiesCard: React.FC<OntologiesCardProps> = ({ merchantId, cluster }) => {
    const [ontologies, setOntologies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentOntology, setCurrentOntology] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        synonyms: '',
        validationType: 'TEXT',
        validationText: '',
        mandatory: false,
        dataSourceType: '',
        dataSource: ''
    });

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState({
        action: true,
        ontology: true,
        synonyms: true,
        dataSourceType: true,
        dataSource: true,
        createdBy: true,
        createdDate: true,
        training: true
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filterDataSourceType, setFilterDataSourceType] = useState('');

    const fetchOntologies = async () => {
        setLoading(true);
        try {
            const response: any = await merchantService.getOntologies(merchantId, cluster);

            // Handle different response structures
            let data: any[] = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response && Array.isArray(response.entity)) {
                data = response.entity;
            } else if (response && Array.isArray(response.data)) {
                data = response.data;
            } else if (response && Array.isArray(response.content)) {
                data = response.content;
            }

            setOntologies(data);
        } catch (error) {
            console.error('Error fetching ontologies:', error);
            setOntologies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchOntologies();
        }
    }, [merchantId, cluster]);

    const handleCreateNew = () => {
        setEditMode(false);
        setCurrentOntology(null);
        setFormData({
            name: '',
            description: '',
            synonyms: '',
            validationType: 'TEXT',
            validationText: '',
            mandatory: false,
            dataSourceType: '',
            dataSource: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (ontology: any) => {
        setEditMode(true);
        setCurrentOntology(ontology);
        setFormData({
            name: ontology.name || '',
            description: ontology.description || '',
            synonyms: Array.isArray(ontology.synonyms) ? ontology.synonyms.join(', ') : '',
            validationType: ontology.validationType || 'TEXT',
            validationText: ontology.validationText || '',
            mandatory: ontology.mandatory || false,
            dataSourceType: ontology.dataSourceType || '',
            dataSource: ontology.dataSource || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (ontology: any) => {
        // Use entityId (numeric) if available, otherwise fallback to id (mongo string)
        // The API call uses path param, which the user curl suggests is numeric "12482" which corresponds to "entityId"
        const idToDelete = ontology.entityId || ontology.id;

        if (!window.confirm(`Are you sure you want to delete the ontology "${ontology.name}"?`)) {
            return;
        }

        try {
            await merchantService.deleteOntology(idToDelete, merchantId, cluster);
            fetchOntologies();
        } catch (error) {
            console.error('Failed to delete ontology:', error);
            alert('Failed to delete ontology. See console for details.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Name is required');
            return;
        }

        setFormLoading(true);
        try {
            // Construct payload
            const payload = {
                merchantId: merchantId,
                type: 'ontology',
                name: formData.name,
                description: formData.description,
                validationType: formData.validationType,
                validationText: formData.validationText,
                mandatory: formData.mandatory,
                dataSourceType: formData.dataSourceType || null,
                dataSource: formData.dataSource || "",
                entries: [], // Empty for now as per curl
                aiEntity: null,
                synonyms: formData.synonyms ? formData.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [],
                status: 'Active',
                // If editing, merge existing fields to preserve them
                ...(editMode && currentOntology ? {
                    id: currentOntology.id, // Mongo ID often needed for updates
                    entityId: currentOntology.entityId,
                    createdBy: currentOntology.createdBy,
                    createdDate: currentOntology.createdDate
                } : {
                    // New creation defaults could go here if not handled by backend
                })
            };

            await merchantService.createOrUpdateOntology(payload, cluster);
            setIsModalOpen(false);
            fetchOntologies();
        } catch (error) {
            console.error('Failed to save ontology:', error);
            alert('Failed to save ontology. See console for details.');
            setFormLoading(false); // Make sure to stop loading on error!
        } finally {
            if (!editMode) {
                // Reset form if just created? Ideally modal closes anyway.
            }
            // setFormLoading(false) is handled in try block success path roughly via close or fetch
            setFormLoading(false);
        }
    };

    const toggleColumn = (key: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredOntologies = ontologies.filter(item => {
        let matches = true;

        // Search Query
        if (searchQuery) {
            const term = searchQuery.toLowerCase();
            const name = item.name || item.title || item.label || item.ontologyName || '';
            matches = matches && name.toLowerCase().includes(term);
        }

        // Filter by DataSourceType
        if (filterDataSourceType) {
            const dsType = item.dataSourceType || '';
            matches = matches && dsType.toLowerCase().includes(filterDataSourceType.toLowerCase());
        }

        return matches;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full relative" onClick={() => {
            if (showColumnSelector) setShowColumnSelector(false);
            // if (showFilters) setShowFilters(false);
        }}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white z-20 relative">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        Ontology <FiInfo className="ml-2 text-gray-400" size={14} title="Manage entity definitions and synonyms" />
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search ontologies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                    >
                        <FiPlus size={16} />
                        Create Ontology
                    </button>

                    <div className="relative">
                        <button
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                            title="Columns"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowColumnSelector(!showColumnSelector);
                                setShowFilters(false);
                            }}
                        >
                            <FiColumns size={16} />
                        </button>
                        {/* Column Selector Popover */}
                        {showColumnSelector && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2" onClick={e => e.stopPropagation()}>
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">Visible Columns</div>
                                <div className="space-y-1">
                                    {Object.entries(visibleColumns).map(([key, isVisible]) => (
                                        <div key={key} className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer" onClick={() => toggleColumn(key as any)}>
                                            <input
                                                type="checkbox"
                                                checked={isVisible}
                                                onChange={() => { }}
                                                className="mr-2 h-3 w-3 text-blue-600 rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                            title="Filters"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFilters(!showFilters);
                                setShowColumnSelector(false);
                            }}
                        >
                            <FiFilter size={16} />
                            Filters
                        </button>
                        {/* Filter Popover */}
                        {showFilters && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4" onClick={e => e.stopPropagation()}>
                                <div className="text-xs font-bold text-gray-500 uppercase mb-3">Filters</div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Data Source Type</label>
                                        <input
                                            type="text"
                                            value={filterDataSourceType}
                                            onChange={(e) => setFilterDataSourceType(e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                            placeholder="Filter by Type"
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={() => {
                                                setFilterDataSourceType('');
                                                setShowFilters(false);
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-auto bg-gray-50/50 p-4">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredOntologies.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No ontologies found. Create one to get started.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    {visibleColumns.action && <th className="px-4 py-3 w-[80px]">Action</th>}
                                    {visibleColumns.ontology && <th className="px-4 py-3">Ontology</th>}
                                    {visibleColumns.synonyms && <th className="px-4 py-3">Synonyms</th>}
                                    {visibleColumns.dataSourceType && <th className="px-4 py-3">Data Source Type</th>}
                                    {visibleColumns.dataSource && <th className="px-4 py-3">Data Source</th>}
                                    {visibleColumns.createdBy && <th className="px-4 py-3">Created By</th>}
                                    {visibleColumns.createdDate && <th className="px-4 py-3">Created Date</th>}
                                    {visibleColumns.training && <th className="px-4 py-3 text-right">Training</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOntologies.map((ontology, idx) => (
                                    <tr key={ontology.id || idx} className="hover:bg-blue-50/30 transition-colors">
                                        {visibleColumns.action && (
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(ontology)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(ontology)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.ontology && <td className="px-4 py-3 font-medium text-gray-900">{ontology.name}</td>}
                                        {visibleColumns.synonyms && (
                                            <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={Array.isArray(ontology.synonyms) ? ontology.synonyms.join(', ') : ''}>
                                                {Array.isArray(ontology.synonyms) && ontology.synonyms.length > 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {ontology.synonyms[0]} {ontology.synonyms.length > 1 && `+${ontology.synonyms.length - 1}`}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        )}
                                        {visibleColumns.dataSourceType && <td className="px-4 py-3 text-gray-500">{ontology.dataSourceType || '-'}</td>}
                                        {visibleColumns.dataSource && <td className="px-4 py-3 text-gray-500">{ontology.dataSource || '-'}</td>}
                                        {visibleColumns.createdBy && <td className="px-4 py-3 text-gray-500">{ontology.createdBy || '-'}</td>}
                                        {visibleColumns.createdDate && (
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {ontology.createdDate ? new Date(ontology.createdDate).toLocaleString() : '-'}
                                            </td>
                                        )}
                                        {visibleColumns.training && (
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${ontology.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {ontology.status || 'Draft'}
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                        <span>{filteredOntologies.length} of {ontologies.length} ontologies</span>
                        <div className="flex gap-1">
                            {/* Pagination placeholder as per screenshot style */}
                            <button className="px-2 py-1 rounded hover:bg-gray-200" disabled>&lt;</button>
                            <span className="px-2 py-1">Page 1 of 1</span>
                            <button className="px-2 py-1 rounded hover:bg-gray-200" disabled>&gt;</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editMode ? 'Edit Ontology' : 'Create Ontology'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. userName"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Describe the entity..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Validation Type</label>
                                    <select
                                        value={formData.validationType}
                                        onChange={(e) => setFormData({ ...formData, validationType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="TEXT">TEXT</option>
                                        <option value="NUMBER">NUMBER</option>
                                        <option value="DATE">DATE</option>
                                        <option value="REGEX">REGEX</option>
                                        <option value="LIST">LIST</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Validation Text</label>
                                    <input
                                        type="text"
                                        value={formData.validationText}
                                        onChange={(e) => setFormData({ ...formData, validationText: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Validation rule or message"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Synonyms (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.synonyms}
                                        onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. user_name, login, handle"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="mandatory"
                                        checked={formData.mandatory}
                                        onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="mandatory" className="text-sm text-gray-700 font-medium">Mandatory</label>
                                </div>

                                <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {formLoading && <FiRefreshCw className="animate-spin" />}
                                        {editMode ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OntologiesCard;

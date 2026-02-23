import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiInfo, FiPlus, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import { useAuth } from '../context/AuthContext';

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    merchantId: string;
    cluster?: string;
    knowledgeBases: any[];
    onSuccess: () => void;
    preSelectedKBId?: string;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
    isOpen,
    onClose,
    merchantId,
    cluster,
    knowledgeBases,
    onSuccess,
    preSelectedKBId
}) => {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [isDocumentExpanded, setIsDocumentExpanded] = useState(true);

    const [formData, setFormData] = useState<any>({
        knowledgeBaseId: '',
        documentName: '',
        documentType: 'Website',
        documentSubType: 'PDF',
        url: '',
        depth: 1,
        rateLimit: '2',
        promptModel: '',
        prompt: '',
        scheduleFrequency: 'Now',
        status: 'Active',
        uploadMethod: 'Upload'
    });

    useEffect(() => {
        if (isOpen) {
            if (preSelectedKBId) {
                setFormData(prev => ({ ...prev, knowledgeBaseId: preSelectedKBId }));
            }
        }
    }, [isOpen, preSelectedKBId]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.documentName || !formData.knowledgeBaseId || !formData.url) {
            alert('Please fill in all required fields (Document Name, Knowledge Base, and URL).');
            return;
        }

        const documentCreatedBy = user?.username || user?.email;
        if (!documentCreatedBy) {
            alert('Unable to identify current user. Please log in again.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                merchantId,
                knowledgeBaseId: formData.knowledgeBaseId,
                status: formData.status,
                documentName: formData.documentName,
                documentType: formData.documentType,
                description: `Crawl Depth: ${formData.depth}, Rate Limit: ${formData.rateLimit}`,
                dataSource: "Document",
                documentParams: {
                    docType: "URL",
                    docLocation: formData.url,
                    depth: formData.depth,
                    rateLimit: formData.rateLimit,
                    promptModel: formData.promptModel,
                    prompt: formData.prompt
                },
                scheduler: {
                    startDate: new Date().toISOString(),
                    scheduleFrequency: formData.scheduleFrequency
                },
                documentCreatedBy
            };

            await merchantService.addDocument(payload, cluster);
            alert('Document created successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating document:', error);
            alert('Failed to create document.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-[#2d3748]">Add Documents</h1>
                    <FiInfo className="text-[#3182ce] cursor-help" size={14} />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-[#1e3a8a] text-white px-5 py-1.5 rounded text-sm font-semibold flex items-center gap-1.5 transition-all hover:bg-blue-900 active:scale-95 disabled:opacity-50"
                    >
                        <FiCheckCircle size={14} /> Submit
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-[#f87171] text-white px-5 py-1.5 rounded text-sm font-semibold flex items-center gap-1.5 transition-all hover:bg-red-500 active:scale-95"
                    >
                        <FiX size={14} /> Cancel
                    </button>
                </div>
            </div>

            <div className="max-w-[95%] mx-auto py-6 space-y-3">
                {/* Knowledge Base Field */}
                <div className="grid grid-cols-12 items-center">
                    <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">
                        Knowledge Base <span className="text-red-500">*</span>
                    </label>
                    <div className="col-span-6 relative group">
                        <select
                            value={formData.knowledgeBaseId}
                            onChange={(e) => setFormData({ ...formData, knowledgeBaseId: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-[13px] appearance-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all pr-12 text-gray-700 font-medium"
                            required
                        >
                            <option value="">Select Knowledge Base</option>
                            {knowledgeBases.map(kb => (
                                <option key={kb.id || kb.knowledgeBaseId} value={kb.id || kb.knowledgeBaseId}>
                                    {kb.knowledgeBaseName || kb.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-300 pointer-events-none">
                            <FiX size={14} className="cursor-pointer hover:text-gray-500 pointer-events-auto" onClick={() => setFormData({ ...formData, knowledgeBaseId: '' })} />
                            <div className="w-[1px] h-4 bg-gray-200"></div>
                            <FiChevronDown size={14} />
                        </div>
                    </div>
                </div>

                {/* Document List Header */}
                <div className="pt-4 pb-1 border-b border-gray-100">
                    <h2 className="text-[13px] font-bold text-gray-800">Document List</h2>
                </div>

                {/* Document Section */}
                <div className="relative border border-gray-100 rounded shadow-sm mt-4">
                    <div className="absolute right-3 top-2.5">
                        <button
                            className="p-1 bg-white border border-gray-200 rounded text-gray-400 hover:bg-gray-50 flex items-center justify-center h-6 w-6"
                            onClick={() => setIsDocumentExpanded(!isDocumentExpanded)}
                        >
                            {isDocumentExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                        </button>
                    </div>

                    <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-gray-50">
                        <span className="text-[12px] font-medium text-gray-500">Document</span>
                    </div>

                    {isDocumentExpanded && (
                        <div className="p-8 space-y-4 bg-white">
                            {/* Document Name */}
                            <div className="grid grid-cols-12 items-center">
                                <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">Document <span className="text-red-500">*</span></label>
                                <div className="col-span-6">
                                    <input
                                        type="text"
                                        placeholder="Enter Document"
                                        value={formData.documentName}
                                        onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300 text-gray-700 font-medium"
                                    />
                                </div>
                            </div>

                            {/* Document Type */}
                            <div className="grid grid-cols-12 items-center">
                                <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">Document Type</label>
                                <div className="col-span-6 relative group">
                                    <select
                                        value={formData.documentType}
                                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                        className={`w-full px-3 py-2 bg-white border ${formData.documentType === 'Website' ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200'} rounded text-[13px] appearance-none outline-none transition-all pr-12 text-gray-700 font-medium`}
                                    >
                                        <option value="Website">Website</option>
                                        <option value="Document">Document</option>
                                        <option value="API">API</option>
                                        <option value="GenAI">Gen AI</option>
                                        <option value="Entity">Entity</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 pointer-events-none">
                                        <FiX size={14} className="cursor-pointer hover:text-gray-500 pointer-events-auto" />
                                        <div className="w-[1px] h-4 bg-gray-200"></div>
                                        <FiChevronDown size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Document SubType - Only for Document type */}
                            {formData.documentType === 'Document' && (
                                <div className="grid grid-cols-12 items-center">
                                    <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">Type</label>
                                    <div className="col-span-6 relative group">
                                        <select
                                            value={formData.documentSubType}
                                            onChange={(e) => setFormData({ ...formData, documentSubType: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] appearance-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all pr-12 text-gray-700 font-medium"
                                        >
                                            <option value="PDF">Text</option>
                                            <option value="Word">Image</option>
                                            <option value="Excel">Doc</option>
                                            <option value="Text">PDF</option>
                                            <option value="Text">Video</option>
                                            <option value="Text">Audio</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 pointer-events-none">
                                            <FiX size={14} className="cursor-pointer hover:text-gray-500 pointer-events-auto" />
                                            <div className="w-[1px] h-4 bg-gray-200"></div>
                                            <FiChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* URL - Only for Website type */}
                            {formData.documentType === 'Website' && (
                                <>
                                    <div className="grid grid-cols-12 items-center">
                                        <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">URL</label>
                                        <div className="col-span-6">
                                            <input
                                                type="text"
                                                placeholder="Enter URL"
                                                value={formData.url}
                                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300 text-gray-700 font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Depth */}
                                    <div className="grid grid-cols-12 items-center">
                                        <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">Depth</label>
                                        <div className="col-span-6 flex items-center gap-4">
                                            <div className="relative flex-1 flex justify-between items-center h-6">
                                                <div className="absolute left-0 right-0 h-[2px] bg-[#e2e8f0] top-1/2 -translate-y-1/2"></div>
                                                <div
                                                    className="absolute h-[2px] bg-[#3182ce] top-1/2 -translate-y-1/2 left-0"
                                                    style={{ width: `${(formData.depth - 1) * 11.111}%` }}
                                                ></div>
                                                {[...Array(10)].map((_, i) => (
                                                    <div key={i} className={`w-[8px] h-[8px] border-[2px] ${formData.depth > i ? 'bg-[#3182ce] border-[#3182ce]' : 'bg-white border-[#e2e8f0]'} rounded-full z-10 relative shadow-sm`}></div>
                                                ))}
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={formData.depth}
                                                    onChange={(e) => setFormData({ ...formData, depth: parseInt(e.target.value) })}
                                                    className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-20 h-full opacity-0"
                                                />
                                                <div className="absolute -bottom-5 left-0 text-[11px] font-bold text-gray-400">1</div>
                                                <div className="absolute -bottom-5 right-0 text-[11px] font-bold text-gray-400">10</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border border-[#cbd5e0] flex items-center justify-center bg-white shadow-sm shrink-0">
                                                <span className="text-[13px] font-bold text-[#3182ce]">{formData.depth}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rate Limit */}
                                    <div className="grid grid-cols-12 items-center pt-4">
                                        <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">Rate Limit</label>
                                        <div className="col-span-6 relative group">
                                            <select
                                                value={formData.rateLimit}
                                                onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] appearance-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all pr-8 text-gray-700 font-medium"
                                            >
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="5">5</option>
                                                <option value="10">10</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-300 pointer-events-none">
                                                <div className="w-[1px] h-4 bg-gray-200"></div>
                                                <FiChevronDown size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* URI - For Document type */}
                            {formData.documentType === 'Document' && (
                                <div className="grid grid-cols-12 items-start">
                                    <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4 pt-2">URI</label>
                                    <div className="col-span-6 space-y-3">
                                        <div className="flex gap-2 border-b border-gray-200 pb-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, uploadMethod: 'Upload' })}
                                                className={`px-3 py-1 text-[13px] font-semibold transition-all ${formData.uploadMethod === 'Upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                                            >
                                                Upload
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, uploadMethod: 'ImportURL' })}
                                                className={`px-3 py-1 text-[13px] font-semibold transition-all ${formData.uploadMethod === 'ImportURL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                                            >
                                                Import from URL
                                            </button>
                                        </div>

                                        {formData.uploadMethod === 'Upload' ? (
                                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf"
                                                    id="fileUpload"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setFormData({ ...formData, selectedFile: file });
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor="fileUpload"
                                                    className="px-4 py-2 bg-white border border-gray-300 rounded text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Browse
                                                </label>
                                                {formData.selectedFile && (
                                                    <p className="mt-2 text-[12px] text-gray-600">{formData.selectedFile.name}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="Enter URL"
                                                value={formData.url}
                                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300 text-gray-700 font-medium"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Not Available - For API, GenAI, Entity types */}
                            {(formData.documentType === 'API' || formData.documentType === 'GenAI' || formData.documentType === 'Entity') && (
                                <div className="grid grid-cols-12 items-center">
                                    <div className="col-span-12 text-center py-8">
                                        <p className="text-gray-400 text-sm font-medium">Not Available</p>
                                    </div>
                                </div>
                            )}

                            {/* Prompt Model */}
                            <div className="grid grid-cols-12 items-center">
                                <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">Prompt Model</label>
                                <div className="col-span-6 relative group">
                                    <select
                                        value={formData.promptModel}
                                        onChange={(e) => setFormData({ ...formData, promptModel: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] appearance-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all pr-8 text-gray-700 font-medium"
                                    >
                                        <option value="">Select Prompt Model</option>
                                        <option value="gpt-4">gpt-4</option>
                                        <option value="gpt-3.5">gpt-3.5</option>
                                        <option value="claude-3">claude-3</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-300 pointer-events-none">
                                        <div className="w-[1px] h-4 bg-gray-200"></div>
                                        <FiChevronDown size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Prompt */}
                            <div className="grid grid-cols-12 items-start">
                                <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4 pt-2">Prompt</label>
                                <div className="col-span-6 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Enter Prompt"
                                        value={formData.prompt}
                                        onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300 text-gray-700 font-medium"
                                    />
                                    <button className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
                                        <FiPlus className="p-0.5 bg-gray-100 rounded-full text-gray-500" size={14} /> Add More
                                    </button>
                                </div>
                            </div>

                            {/* Schedule Frequency */}
                            <div className="grid grid-cols-12 items-center pt-2">
                                <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">Schedule Frequency</label>
                                <div className="col-span-6 relative group">
                                    <select
                                        value={formData.scheduleFrequency}
                                        onChange={(e) => setFormData({ ...formData, scheduleFrequency: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] appearance-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all pr-8 text-gray-700 font-medium"
                                    >
                                        <option value="Now">Now</option>
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-300 pointer-events-none">
                                        <div className="w-[1px] h-4 bg-gray-200"></div>
                                        <FiChevronDown size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="grid grid-cols-12 items-center">
                                <label className="col-span-2 text-[13px] text-gray-500 text-right pr-4">Status</label>
                                <div className="col-span-6 relative group">
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] appearance-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all pr-8 text-gray-700 font-medium"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-300 pointer-events-none">
                                        <div className="w-[1px] h-4 bg-gray-200"></div>
                                        <FiChevronDown size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Left Button */}
                <div className="pt-6">
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-1.5 bg-white border border-[#3182ce] text-[#3182ce] rounded text-[11px] font-bold uppercase tracking-tight hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
                    >
                        ADD DOCUMENT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDocumentModal;


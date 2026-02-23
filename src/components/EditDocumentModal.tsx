import React, { useState, useEffect } from 'react';
import { FiX, FiFileText, FiRefreshCw } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import { useAuth } from '../context/AuthContext';

interface EditDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: any;
    merchantId: string;
    cluster?: string;
    onUpdate: () => void;
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
    isOpen,
    onClose,
    document,
    merchantId,
    cluster,
    onUpdate
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        documentName: '',
        documentType: 'Document',
        type: 'PDF',
        description: '',
        status: 'Active',
        scheduleFrequency: 'Now'
    });

    useEffect(() => {
        if (document) {
            setFormData({
                documentName: document.documentName || '',
                documentType: document.documentType || 'Document',
                type: document.documentParams?.docType || 'PDF',
                description: document.description || '',
                status: document.status || 'Active',
                scheduleFrequency: document.scheduler?.scheduleFrequency || 'Now',
            });
        }
    }, [document]);

    if (!isOpen || !document) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!window.confirm("Are you sure you want to update this document?")) {
            return;
        }

        const documentCreatedBy = user?.username || user?.email;
        if (!documentCreatedBy) {
            alert('Unable to identify current user. Please log in again.');
            return;
        }

        setLoading(true);

        try {
            // Construct payload matching the curl request
            const payload = {
                status: formData.status,
                documentName: formData.documentName,
                documentType: formData.documentType,
                description: formData.description,
                dataSource: document.dataSource || "Document",
                documentParams: {
                    docType: formData.type,
                    docLocation: document.documentParams?.docLocation || ""
                },
                scheduler: {
                    startDate: document.scheduler?.startDate || "",
                    scheduleFrequency: formData.scheduleFrequency
                },
                documentCreatedBy
            };

            await merchantService.updateDocument(
                merchantId,
                document.knowledgeBaseId,
                document.documentId,
                payload,
                cluster
            );

            alert("Document updated successfully!");
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to update document:', error);
            alert('Failed to update document');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                        Edit Documents <span className="text-gray-400 font-normal text-sm"><FiFileText className="inline" /></span>
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
                    <div className="space-y-6 max-w-3xl mx-auto">

                        {/* Knowledge Base (Read Only) */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-sm font-medium text-gray-500 text-right">Knowledge Base <span className="text-red-500">*</span></label>
                            <div className="col-span-9">
                                <div className="text-gray-700 font-medium">{document.knowledgeBaseName}</div>
                            </div>
                        </div>

                        {/* Document Name */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-sm font-medium text-gray-500 text-right">Document <span className="text-red-500">*</span></label>
                            <div className="col-span-9">
                                <input
                                    type="text"
                                    required
                                    value={formData.documentName}
                                    onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Document Type */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-sm font-medium text-gray-500 text-right">Document Type</label>
                            <div className="col-span-9 relative">
                                <select
                                    value={formData.documentType}
                                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm appearance-none bg-white"
                                >
                                    <option value="Document">Document</option>
                                    <option value="FAQ">FAQ</option>
                                    <option value="Manual">Manual</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                            </div>
                        </div>

                        {/* File Type */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-sm font-medium text-gray-500 text-right">Type</label>
                            <div className="col-span-9 relative">
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm appearance-none bg-white"
                                >
                                    <option value="PDF">PDF</option>
                                    <option value="DOCX">DOCX</option>
                                    <option value="TXT">TXT</option>
                                    <option value="HTML">HTML</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                            </div>
                        </div>

                        {/* URI / File Display */}
                        <div className="grid grid-cols-12 gap-4 items-start">
                            <label className="col-span-3 text-sm font-bold text-blue-500 text-right pt-2">URI</label>
                            <div className="col-span-9">
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 flex flex-col items-center justify-center gap-2 h-24 w-24">
                                    {/* Simple icon representation */}
                                    <div className="bg-white border-2 border-gray-800 rounded p-1 w-10 h-10 flex flex-col gap-1 items-center justify-center">
                                        <div className="w-6 h-0.5 bg-gray-800"></div>
                                        <div className="w-6 h-0.5 bg-gray-800"></div>
                                        <div className="w-6 h-0.5 bg-gray-800"></div>
                                    </div>
                                </div>
                                <div className="mt-1 text-xs text-blue-500 break-all">
                                    {document.documentParams?.docLocation}
                                </div>
                            </div>
                        </div>

                        {/* Prompt Model (Mock) */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-sm font-medium text-gray-500 text-right">Prompt Model</label>
                            <div className="col-span-9 relative">
                                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm appearance-none bg-white text-gray-500">
                                    <option>Select Prompt Model</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                            </div>
                        </div>

                        {/* Prompt (Mock) */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-sm font-medium text-gray-500 text-right">Prompt</label>
                            <div className="col-span-9">
                                <input
                                    type="text"
                                    placeholder="Enter Prompt"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                                />

                            </div>
                        </div>

                        {/* Schedule Frequency */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-sm font-medium text-gray-500 text-right">Schedule Frequency</label>
                            <div className="col-span-9 relative">
                                <select
                                    value={formData.scheduleFrequency}
                                    onChange={(e) => setFormData({ ...formData, scheduleFrequency: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm appearance-none bg-white"
                                >
                                    <option value="Now">Now</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-sm font-medium text-gray-500 text-right">Status</label>
                            <div className="col-span-9 relative">
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm appearance-none bg-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                            </div>
                        </div>

                    </div>
                </form>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 z-10">
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-900 font-medium flex items-center gap-2 disabled:opacity-50 text-sm shadow-sm transition-all"
                    >
                        {loading && <FiRefreshCw className="animate-spin" />}
                        Submit
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-white bg-red-400 rounded-lg hover:bg-red-500 font-medium text-sm shadow-sm transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditDocumentModal;


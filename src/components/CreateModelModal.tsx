import React, { useState } from 'react';
import { FiX, FiInfo, FiCheckCircle } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface CreateModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    merchantId: string;
    cluster?: string;
    modelType: 'PUBLIC_LLM' | 'PRIVATE_LLM';
    onSuccess: () => void;
}

const CreateModelModal: React.FC<CreateModelModalProps> = ({
    isOpen, onClose, merchantId, cluster, modelType, onSuccess
}) => {
    const [submitting, setSubmitting] = useState(false);

    // Form state based on image
    const [modelName, setModelName] = useState('');
    const [description, setDescription] = useState('');
    const [version, setVersion] = useState('1.0');
    const [status, setStatus] = useState('Active');
    const [aiPlatform, setAiPlatform] = useState('OPENAI'); // Simplified for now
    const [isDefault, setIsDefault] = useState(false);

    // Hyperparameters
    const [foundationModel, setFoundationModel] = useState('');
    const [temperature, setTemperature] = useState(0.5);
    const [tokenLength, setTokenLength] = useState(1024);
    const [topK, setTopK] = useState(21);
    const [topP, setTopP] = useState(0.7);

    const foundationModels = [
        'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo',
        'claude-3-5-sonnet-20240620', 'claude-3-opus-20240229',
        'gemini-1.5-pro', 'gemini-1.5-flash'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modelName || !foundationModel) {
            alert('Please fill in required fields.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                merchantId,
                createdBy: "meiyaps noc", // Example value from user
                status: status,
                modelName: modelName,
                description: description,
                modelType: modelType,
                modelVersion: version,
                default: isDefault,
                aiSystems: [
                    {
                        ai: aiPlatform,
                        aiId: "8087206686282152", // Hardcoded example from user curl
                        workspaceId: "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"
                    }
                ],
                modelParams: {
                    foundationModel,
                    temperature: String(temperature),
                    tokenLength,
                    topk: String(topK),
                    topp: String(topP)
                }
            };

            await merchantService.createAIModel(payload, cluster);
            alert('Model created successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating model:', error);
            alert('Failed to create model.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-800">Create Model Management</h2>
                        <FiInfo size={16} className="text-gray-400 cursor-help" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <FiCheckCircle /> {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                        >
                            <FiX /> Cancel
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
                    {/* Basic Info */}
                    <div className="space-y-4 max-w-3xl">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-bold text-gray-600 text-right">
                                Model Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="col-span-3">
                                <input
                                    type="text"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all"
                                    placeholder="Test"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-bold text-gray-600 text-right">
                                Description <span className="text-rose-500">*</span>
                            </label>
                            <div className="col-span-3">
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all"
                                    placeholder="Test"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-bold text-gray-600 text-right">
                                Version <span className="text-rose-500">*</span>
                            </label>
                            <div className="col-span-3">
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    className="w-full px-4 py-2 bg-blue-50/50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all"
                                    placeholder="1.0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-bold text-gray-600 text-right">
                                Status
                            </label>
                            <div className="col-span-3 pb-2">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-bold text-gray-600 text-right">
                                AI Platform <span className="text-rose-500">*</span>
                            </label>
                            <div className="col-span-3">
                                <select
                                    value={aiPlatform}
                                    onChange={(e) => setAiPlatform(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                                    required
                                >
                                    <option value="OPENAI">OPENAI_ProjectId_sk-pro</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-bold text-gray-600 text-right">
                                Default Model
                            </label>
                            <div className="col-span-3">
                                <input
                                    type="checkbox"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hyperparameters Section */}
                    <div className="pt-8 border-t border-gray-100">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Hyperparameters</h3>
                            <p className="text-xs text-gray-400">Hyperparameters are external configuration variables that data scientists use to manage machine learning model training.</p>
                        </div>

                        <div className="space-y-6 max-w-3xl">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-bold text-gray-600 text-right">
                                    Foundation Model <span className="text-rose-500">*</span>
                                </label>
                                <div className="col-span-3">
                                    <select
                                        value={foundationModel}
                                        onChange={(e) => setFoundationModel(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white font-medium"
                                        required
                                    >
                                        <option value="">Select Foundation Model</option>
                                        {foundationModels.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Temperature Slider */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-bold text-gray-600 text-right flex items-center justify-end gap-1">
                                    Temperature <FiInfo size={14} className="text-gray-400" />
                                </label>
                                <div className="col-span-3 flex items-center gap-4 group">
                                    <span className="text-[10px] font-bold text-gray-400">0.1</span>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.1"
                                        value={temperature}
                                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                        className="flex-grow h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                                    />
                                    <span className="text-[10px] font-bold text-gray-400">1.0</span>
                                    <div className="w-10 h-8 flex items-center justify-center border border-gray-200 rounded bg-gray-50 text-xs font-bold text-gray-700">
                                        {temperature}
                                    </div>
                                </div>
                            </div>

                            {/* Token Length */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-bold text-gray-600 text-right flex items-center justify-end gap-1">
                                    Token Length <FiInfo size={14} className="text-gray-400" />
                                </label>
                                <div className="col-span-3">
                                    <select
                                        value={tokenLength}
                                        onChange={(e) => setTokenLength(parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white font-medium"
                                    >
                                        <option value={512}>512</option>
                                        <option value={1024}>1024</option>
                                        <option value={2048}>2048</option>
                                        <option value={4096}>4096</option>
                                    </select>
                                </div>
                            </div>

                            {/* Top-K Slider */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-bold text-gray-600 text-right flex items-center justify-end gap-1">
                                    Top-K <FiInfo size={14} className="text-gray-400" />
                                </label>
                                <div className="col-span-3 flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-gray-400">1</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="40"
                                        step="1"
                                        value={topK}
                                        onChange={(e) => setTopK(parseInt(e.target.value))}
                                        className="flex-grow h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                                    />
                                    <span className="text-[10px] font-bold text-gray-400">40</span>
                                    <div className="w-10 h-8 flex items-center justify-center border border-gray-200 rounded bg-gray-50 text-xs font-bold text-gray-700">
                                        {topK}
                                    </div>
                                </div>
                            </div>

                            {/* Top-P Slider */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-bold text-gray-600 text-right flex items-center justify-end gap-1">
                                    Top-P <FiInfo size={14} className="text-gray-400" />
                                </label>
                                <div className="col-span-3 flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-gray-400">0.1</span>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="0.9"
                                        step="0.1"
                                        value={topP}
                                        onChange={(e) => setTopP(parseFloat(e.target.value))}
                                        className="flex-grow h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                                    />
                                    <span className="text-[10px] font-bold text-gray-400">0.9</span>
                                    <div className="w-10 h-8 flex items-center justify-center border border-gray-200 rounded bg-gray-50 text-xs font-bold text-gray-700">
                                        {topP}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateModelModal;

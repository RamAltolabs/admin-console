import React, { useEffect, useMemo, useState } from 'react';
import { FiX, FiInfo, FiCheckCircle, FiPlus, FiMinus } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import { useAuth } from '../context/AuthContext';

interface CreateModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    merchantId: string;
    cluster?: string;
    modelType: 'PUBLIC_LLM' | 'PRIVATE_LLM' | 'NLP';
    onSuccess: () => void;
    editModel?: any;
}

const CreateModelModal: React.FC<CreateModelModalProps> = ({
    isOpen, onClose, merchantId, cluster, modelType, onSuccess, editModel
}) => {
    const isMlModel = modelType === 'NLP';
    const isEditMode = !!(editModel && (editModel.modelId || editModel.id));
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [loadingPlatforms, setLoadingPlatforms] = useState(false);
    const [platformError, setPlatformError] = useState<string | null>(null);
    const [platformConfigs, setPlatformConfigs] = useState<any[]>([]);
    const [selectedPlatformId, setSelectedPlatformId] = useState('');

    // Form state based on image
    const [modelName, setModelName] = useState('');
    const [description, setDescription] = useState('');
    const [version, setVersion] = useState('1.0');
    const [status, setStatus] = useState('Active');
    const [aiPlatform, setAiPlatform] = useState(''); // Resolved from selected merchant AI platform
    const [isDefault, setIsDefault] = useState(false);

    // Hyperparameters
    const [foundationModel, setFoundationModel] = useState('');
    const [temperature, setTemperature] = useState(0.5);
    const [tokenLength, setTokenLength] = useState(1024);
    const [topK, setTopK] = useState(21);
    const [topP, setTopP] = useState(0.7);
    const [activeMlTab, setActiveMlTab] = useState<'model' | 'feature' | 'hyper'>('model');
    const [mlModelSubType, setMlModelSubType] = useState('Recommendation');
    const [featureDefinitions, setFeatureDefinitions] = useState<Array<{ key: string; description: string }>>([{ key: '', description: '' }]);
    const [mlHyperParams, setMlHyperParams] = useState({
        numberOfClusters: '',
        initializationMethod: '',
        maxIterations: '',
        distanceMetric: '',
        featureScaling: ''
    });

    const foundationModels = [
        'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo',
        'claude-3-5-sonnet-20240620', 'claude-3-opus-20240229',
        'gemini-1.5-pro', 'gemini-1.5-flash'
    ];
    const featureKeyOptionsByMlType: Record<string, string[]> = {
        recomendation: ['userId', 'itemId', 'rating', 'timestamp', 'category'],
        naturallanguage: ['text', 'language', 'intent', 'entity', 'context'],
        classification: ['label', 'classWeight', 'featureVector', 'source', 'confidence'],
        predection: ['target', 'windowSize', 'trend', 'seasonality', 'signalStrength'],
        regression: ['targetValue', 'independentVariable', 'residual', 'coefficient', 'variance'],
        clustering: ['featureVector', 'centroid', 'clusterLabel', 'distanceScore', 'normalizedValue']
    };

    const normalizeAiName = (value: string) =>
        String(value || '')
            .trim()
            .replace(/[\s_-]+/g, '')
            .toUpperCase();

    const normalizeCategory = (value: string) =>
        String(value || '')
            .trim()
            .replace(/[\s_-]+/g, '')
            .toLowerCase();

    const parseAiConfigs = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const platformOptions = useMemo(() => {
        const isGenerativeModel = modelType === 'PUBLIC_LLM' || modelType === 'PRIVATE_LLM';
        const selectedMlType = normalizeCategory(mlModelSubType);
        const mlTypeAliases: Record<string, string[]> = {
            recomendation: ['recomendation', 'recommendation'],
            naturallanguage: ['naturallanguage', 'nlp', 'language'],
            classification: ['classification'],
            predection: ['predection', 'prediction', 'predictiveanalysis'],
            regression: ['regression'],
            clustering: ['clustering', 'cluster']
        };
        const expectedMlKeys = mlTypeAliases[selectedMlType] || [];

        const items = platformConfigs
            .filter((cfg: any) => {
                const rawType = cfg?.type || cfg?.category || cfg?.modelType || '';
                const normalizedType = normalizeCategory(rawType);

                if (isGenerativeModel) {
                    // Generative AI tabs should list only Generative AI platform records.
                    return normalizedType.includes('generativeai') || normalizedType === 'generative';
                }

                // ML Models should list based on selected model type.
                if (!expectedMlKeys.length) return false;
                return expectedMlKeys.some((key) => normalizedType.includes(key));
            })
            .map((cfg: any, idx: number) => {
                const aiNameRaw = cfg.aiName || cfg.ai || '';
                const aiName = normalizeAiName(aiNameRaw);
                const optionId = String(cfg.aiId || cfg.id || `${aiName || 'AI'}-${idx}`);
                return {
                    id: optionId,
                    label: cfg.aiName || cfg.ai || aiName || `AI Platform ${idx + 1}`,
                    normalizedAi: aiName,
                    config: cfg
                };
            })
            .filter((item) => !!item.normalizedAi);

        const seen = new Set<string>();
        return items.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }, [platformConfigs, modelType, mlModelSubType]);

    useEffect(() => {
        const loadPlatforms = async () => {
            if (!isOpen || !merchantId) return;
            setLoadingPlatforms(true);
            setPlatformError(null);
            try {
                const merchant = await merchantService.getMerchantById(merchantId, cluster);
                const configs = parseAiConfigs(merchant?.aiConfigs);
                setPlatformConfigs(configs);
            } catch (error) {
                setPlatformConfigs([]);
                setPlatformError('Failed to load AI Platform configurations.');
            } finally {
                setLoadingPlatforms(false);
            }
        };
        loadPlatforms();
    }, [isOpen, merchantId, cluster]);

    useEffect(() => {
        if (!isOpen) return;

        if (isEditMode) {
            const model = editModel || {};
            const modelParams = model.modelParams || {};
            const hyper = modelParams.hyperparameters || modelParams || {};
            const modelFeatures = Array.isArray(model.features)
                ? model.features
                : (Array.isArray(modelParams.featureDefinitions) ? modelParams.featureDefinitions : []);

            setModelName(model.modelName || '');
            setDescription(model.description || '');
            setVersion(model.modelVersion || '1.0');
            setStatus(model.status || 'Active');
            setIsDefault(!!model.default);

            setFoundationModel(modelParams.foundationModel || '');
            setTemperature(Number(modelParams.temperature ?? 0.5));
            setTokenLength(Number(modelParams.tokenLength ?? 1024));
            setTopK(Number(modelParams.topk ?? 21));
            setTopP(Number(modelParams.topp ?? 0.7));

            if (isMlModel) {
                setMlModelSubType(modelParams.modelSubType || model.modelSubType || 'Recommendation');
                setFeatureDefinitions(
                    modelFeatures.length > 0
                        ? modelFeatures.map((f: any) => ({
                            key: f.key || f.name || '',
                            description: f.value || f.description || ''
                        }))
                        : [{ key: '', description: '' }]
                );
                setMlHyperParams({
                    numberOfClusters: String(hyper.numberOfClusters ?? hyper.clusters ?? ''),
                    initializationMethod: String(hyper.initializationMethod ?? hyper.initMethod ?? ''),
                    maxIterations: String(hyper.maxIterations ?? ''),
                    distanceMetric: String(hyper.distanceMetric ?? ''),
                    featureScaling: String(hyper.featureScaling ?? '')
                });
            }
        } else {
            setModelName('');
            setDescription('');
            setVersion('1.0');
            setStatus('Active');
            setIsDefault(false);
            setFoundationModel('');
            setTemperature(0.5);
            setTokenLength(1024);
            setTopK(21);
            setTopP(0.7);
            setActiveMlTab('model');
            setMlModelSubType('Recommendation');
            setFeatureDefinitions([{ key: '', description: '' }]);
            setMlHyperParams({
                numberOfClusters: '',
                initializationMethod: '',
                maxIterations: '',
                distanceMetric: '',
                featureScaling: ''
            });
        }
    }, [isOpen, isEditMode, editModel, isMlModel]);

    useEffect(() => {
        if (platformOptions.length === 0) {
            setSelectedPlatformId('');
            setAiPlatform('');
            return;
        }
        const editAi = normalizeAiName(editModel?.aiSystems?.[0]?.ai || '');
        const existing = platformOptions.find((p) => p.id === selectedPlatformId)
            || (isEditMode && editAi ? platformOptions.find((p) => p.normalizedAi === editAi) : undefined)
            || platformOptions[0];
        setSelectedPlatformId(existing.id);
        setAiPlatform(existing.normalizedAi);
    }, [platformOptions, selectedPlatformId, isEditMode, editModel]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modelName || (!isMlModel && !foundationModel)) {
            alert('Please fill in required fields.');
            return;
        }

        const createdBy = user?.username || user?.email || editModel?.createdBy;
        if (!createdBy) {
            alert('Unable to identify current user. Please log in again.');
            return;
        }

        const selectedPlatform = platformOptions.find((p) => p.id === selectedPlatformId);
        if (!selectedPlatform) {
            alert('Please select a configured AI Platform.');
            return;
        }

        const selectedConfig = selectedPlatform.config || {};
        const aiId = selectedConfig.aiId || process.env.REACT_APP_DEFAULT_AI_SYSTEM_ID;
        const workspaceId = selectedConfig.workspaceId || process.env.REACT_APP_DEFAULT_WORKSPACE_ID;
        if (!aiId || !workspaceId) {
            alert('Selected AI Platform is missing aiId/workspaceId. Please configure it in AI Platforms first.');
            return;
        }

        // Use merchant-configured AI identifier for API payload.
        // Do not over-normalize, since backend can expect exact values like OPENAI/AZURE_OPEN_AI.
        const aiForPayload =
            String(selectedConfig.ai || selectedConfig.aiName || selectedPlatform.label || selectedPlatform.normalizedAi || aiPlatform || '')
                .trim();
        if (!aiForPayload) {
            alert('Selected AI Platform is missing AI name.');
            return;
        }

        const extraAiSystemFields: Record<string, any> = {};
        ['username', 'password', 'sessionTimeout', 'status'].forEach((key) => {
            if (selectedConfig[key] !== undefined && selectedConfig[key] !== null && selectedConfig[key] !== '') {
                extraAiSystemFields[key] = selectedConfig[key];
            }
        });
        if (Array.isArray(selectedConfig.attributes) && selectedConfig.attributes.length > 0) {
            extraAiSystemFields.attributes = selectedConfig.attributes;
        }

        setSubmitting(true);
        try {
            let kbCreationWarning = false;

            const buildAutoKbName = () => {
                const safeModelName = String(modelName || '')
                    .trim()
                    .replace(/\s+/g, '_');
                const safeVersion = String(version || '').trim();
                return `KB_${safeModelName}${safeVersion ? `_${safeVersion}` : ''}`;
            };

            const extractCreatedModelId = (response: any): string | number | undefined => {
                if (!response) return undefined;
                if (response.modelId !== undefined && response.modelId !== null) return response.modelId;
                if (response.id !== undefined && response.id !== null) return response.id;

                const data = response.data;
                if (data && typeof data === 'object') {
                    if (data.modelId !== undefined && data.modelId !== null) return data.modelId;
                    if (data.id !== undefined && data.id !== null) return data.id;
                }

                const result = response.result;
                if (result && typeof result === 'object') {
                    if (result.modelId !== undefined && result.modelId !== null) return result.modelId;
                    if (result.id !== undefined && result.id !== null) return result.id;
                }

                return undefined;
            };

            const payload = {
                merchantId,
                createdBy,
                status: status,
                modelName: modelName,
                description: description,
                modelType: modelType,
                modelVersion: version,
                ...(!isMlModel ? { default: isDefault } : {}),
                aiSystems: [
                    {
                        ai: aiForPayload,
                        aiId,
                        workspaceId,
                        ...extraAiSystemFields
                    }
                ],
                modelParams: isMlModel
                    ? {
                        modelSubType: mlModelSubType,
                        featureDefinitions: featureDefinitions.filter((f) => f.key.trim()).map((f) => ({
                            key: f.key,
                            value: f.description
                        })),
                        hyperparameters: {
                            numberOfClusters: mlHyperParams.numberOfClusters,
                            initializationMethod: mlHyperParams.initializationMethod,
                            maxIterations: mlHyperParams.maxIterations,
                            distanceMetric: mlHyperParams.distanceMetric,
                            featureScaling: mlHyperParams.featureScaling
                        }
                    }
                    : {
                        foundationModel,
                        temperature: String(temperature),
                        tokenLength,
                        topk: String(topK),
                        topp: String(topP)
                    }
            };

            if (isEditMode) {
                const modelId = editModel?.modelId || editModel?.id;
                if (!modelId) {
                    alert('Unable to update: modelId is missing.');
                    return;
                }

                const nowIso = new Date().toISOString();
                const mlFeatures = featureDefinitions
                    .filter((f) => f.key.trim())
                    .map((f) => ({
                        key: f.key,
                        value: f.description
                    }));

                const updatePayload = {
                    merchantId,
                    modelId,
                    modelName,
                    modelVersion: version,
                    modelType,
                    framework: editModel?.framework ?? null,
                    modelParams: isMlModel
                        ? {
                            modelSubType: mlModelSubType,
                            clusters: mlHyperParams.numberOfClusters,
                            initMethod: mlHyperParams.initializationMethod,
                            maxIterations: mlHyperParams.maxIterations,
                            distanceMetric: mlHyperParams.distanceMetric,
                            featureScaling: mlHyperParams.featureScaling
                        }
                        : {
                            foundationModel,
                            temperature: String(temperature),
                            tokenLength,
                            topk: String(topK),
                            topp: String(topP)
                        },
                    features: isMlModel ? mlFeatures : [],
                    aiSystems: [
                        {
                            ai: aiForPayload,
                            aiId,
                            workspaceId,
                            ...extraAiSystemFields
                        }
                    ],
                    createdBy: editModel?.createdBy || createdBy,
                    createdDate: editModel?.createdDate || nowIso,
                    modifiedDate: nowIso,
                    status,
                    description,
                    aiTrainingStatus: editModel?.aiTrainingStatus || 'NOT STARTED',
                    appId: editModel?.appId ?? null,
                    correlationId: editModel?.correlationId ?? null,
                    featureEngineering: editModel?.featureEngineering ?? null,
                    default: !isMlModel ? isDefault : false,
                    deleted: !!editModel?.deleted
                };

                console.log('[CreateModelModal] update model payload:', updatePayload);
                await merchantService.updateAIModel(merchantId, modelId, updatePayload, cluster);
                alert('Model has been updated successfully.');
                onSuccess();
                onClose();
                return;
            }

            console.log('[CreateModelModal] create model payload:', payload);
            const createModelResponse = await merchantService.createAIModel(payload, cluster);

            if (modelType === 'PUBLIC_LLM') {
                const createdModelId = extractCreatedModelId(createModelResponse);
                if (createdModelId !== undefined && createdModelId !== null && String(createdModelId).trim() !== '') {
                    const kbPayload = {
                        merchantId,
                        knowledgeBaseName: buildAutoKbName(),
                        knowledgeBaseDesc: description,
                        status,
                        modelId: createdModelId,
                        createdBy
                    };
                    try {
                        await merchantService.addKnowledgeBase(kbPayload, cluster);
                    } catch (kbError) {
                        console.error('[CreateModelModal] Auto KB creation failed after model creation:', kbError);
                        kbCreationWarning = true;
                    }
                } else {
                    console.warn('[CreateModelModal] Model created but modelId not found in response; skipped auto KB creation.', createModelResponse);
                }
            }

            alert(kbCreationWarning
                ? 'Model has been created successfully, but Knowledge Base creation failed.'
                : 'Model has been created successfully.'
            );
            onSuccess();
            onClose();
        } catch (error) {
            console.error(isEditMode ? 'Error updating model:' : 'Error creating model:', error);
            const apiMessage =
                (error as any)?.response?.data?.message ||
                (error as any)?.response?.data?.error ||
                (error as any)?.message ||
                (isEditMode ? 'Failed to update model.' : 'Failed to create model.');
            alert(String(apiMessage));
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
                        <h2 className="text-xl font-bold text-gray-800">
                            {isEditMode ? 'Edit Model' : (isMlModel ? 'Create ML Model' : 'Create Model Management')}
                        </h2>
                        <FiInfo
                            size={16}
                            className="text-gray-400 cursor-help"
                            title="Create, train, and optimize machine learning models seamlessly in our ML Models section. Choose from various model types like regression, classification, or clustering, and attach them to your datasets effortlessly. Customize training parameters, track progress, and fine-tune models for superior performance. Evaluate model accuracy using validation datasets before deploying them for real-world applications."
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-blue-900 hover:bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <FiCheckCircle /> {submitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update' : 'Submit')}
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
                    {isMlModel && (
                        <div className="border-b border-gray-200">
                            <div className="flex items-center gap-6 text-sm">
                                {[
                                    { id: 'model' as const, label: 'Model Definition' },
                                    { id: 'feature' as const, label: 'Feature Definition' },
                                    { id: 'hyper' as const, label: 'Hyperparameters' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveMlTab(tab.id)}
                                        className={`pb-2.5 border-b-2 font-semibold transition-colors ${activeMlTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-blue-600'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Basic Info */}
                    {(!isMlModel || activeMlTab === 'model') && (
                        <div className="space-y-4 max-w-3xl">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-bold text-gray-600 text-right">
                                Model Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="col-span-3">
                                <input
                                    type="text"
                                    value={modelName}
                                    onChange={(e) => {
                                        if (!isEditMode) {
                                            setModelName(e.target.value);
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all"
                                    placeholder="Test"
                                    required
                                    disabled={isEditMode}
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

                        {isMlModel && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-bold text-gray-600 text-right">
                                    Model Type
                                </label>
                                <div className="col-span-3 pb-2">
                                    <select
                                        value={mlModelSubType}
                                        onChange={(e) => setMlModelSubType(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                                    >
                                        <option value="Recommendation">Recommendation</option>
                                        <option value="Natural Language">Natural Language</option>
                                        <option value="Classification">Classification</option>
                                        <option value="Prediction">Prediction</option>
                                        <option value="Regression">Regression</option>
                                        <option value="Clustering">Clustering</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-bold text-gray-600 text-right">
                                AI Platform <span className="text-rose-500">*</span>
                            </label>
                            <div className="col-span-3">
                                <select
                                    value={selectedPlatformId}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        setSelectedPlatformId(id);
                                        const option = platformOptions.find((p) => p.id === id);
                                        setAiPlatform(option?.normalizedAi || '');
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                                    disabled={loadingPlatforms || platformOptions.length === 0}
                                    required
                                >
                                    {loadingPlatforms && <option value="">Loading AI Platforms...</option>}
                                    {!loadingPlatforms && platformOptions.length === 0 && (
                                        <option value="">No options</option>
                                    )}
                                    {platformOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {platformError && (
                                    <p className="text-xs text-red-600 mt-1">{platformError}</p>
                                )}
                                {!platformError && !loadingPlatforms && platformOptions.length === 0 && (
                                    <p className="text-xs text-amber-700 mt-1">
                                        {modelType === 'NLP'
                                            ? `No options for selected model type (${mlModelSubType}).`
                                            : 'Configure a Generative AI Platform in AI Platforms before creating models.'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!isMlModel && (
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
                        )}
                        </div>
                    )}

                    {isMlModel && activeMlTab === 'feature' && (
                        <div className="max-w-6xl space-y-5 pt-2">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Feature</label>
                                </div>
                                <div className="col-span-8">
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Description</label>
                                </div>
                            </div>

                            {featureDefinitions.map((feature, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-3">
                                        <select
                                            value={feature.key}
                                            onChange={(e) => {
                                                const next = [...featureDefinitions];
                                                next[idx] = { ...next[idx], key: e.target.value };
                                                setFeatureDefinitions(next);
                                            }}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm bg-white outline-none"
                                        >
                                            <option value="">Select key</option>
                                            {(featureKeyOptionsByMlType[normalizeCategory(mlModelSubType)] || []).map((k) => (
                                                <option key={k} value={k}>{k}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-8">
                                        <input
                                            type="text"
                                            value={feature.description}
                                            onChange={(e) => {
                                                const next = [...featureDefinitions];
                                                next[idx] = { ...next[idx], description: e.target.value };
                                                setFeatureDefinitions(next);
                                            }}
                                            placeholder="Enter value"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        {idx === featureDefinitions.length - 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => setFeatureDefinitions((prev) => [...prev, { key: '', description: '' }])}
                                                className="w-7 h-7 rounded-full border border-gray-400 text-blue-800 hover:bg-blue-50 flex items-center justify-center"
                                                title="Add Feature"
                                            >
                                                <FiPlus size={14} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setFeatureDefinitions((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                                                className="w-7 h-7 rounded-full border border-gray-400 text-red-600 hover:bg-red-50 flex items-center justify-center"
                                                title="Remove Feature"
                                            >
                                                <FiMinus size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Hyperparameters Section */}
                    {(!isMlModel || activeMlTab === 'hyper') && (
                        <div className={`${isMlModel ? 'pt-2' : 'pt-8 border-t border-gray-100'}`}>
                        {!isMlModel && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Hyperparameters</h3>
                            <p className="text-xs text-gray-400">Hyperparameters are external configuration variables that data scientists use to manage machine learning model training.</p>
                        </div>
                        )}

                        <div className={`space-y-6 ${isMlModel ? 'max-w-4xl' : 'max-w-3xl'}`}>
                            {!isMlModel && (
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
                            )}

                            {/* Temperature Slider */}
                            {!isMlModel && (
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
                            )}

                            {/* Token Length */}
                            {!isMlModel && (
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
                            )}

                            {/* Top-K Slider */}
                            {!isMlModel && (
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
                            )}

                            {/* Top-P Slider */}
                            {!isMlModel && (
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
                            )}

                            {isMlModel && (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-6">
                                        <label className="text-sm font-medium text-gray-600 text-right">Number of Clusters (k)</label>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={mlHyperParams.numberOfClusters}
                                                onChange={(e) => setMlHyperParams((p) => ({ ...p, numberOfClusters: e.target.value }))}
                                                placeholder="Enter Number of Clusters (k)"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-6">
                                        <label className="text-sm font-medium text-gray-600 text-right">Initialization Method</label>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={mlHyperParams.initializationMethod}
                                                onChange={(e) => setMlHyperParams((p) => ({ ...p, initializationMethod: e.target.value }))}
                                                placeholder="Enter Initialization Method"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-6">
                                        <label className="text-sm font-medium text-gray-600 text-right">Max Iterations</label>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={mlHyperParams.maxIterations}
                                                onChange={(e) => setMlHyperParams((p) => ({ ...p, maxIterations: e.target.value }))}
                                                placeholder="Enter Max Iterations"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-6">
                                        <label className="text-sm font-medium text-gray-600 text-right">Distance Metric</label>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={mlHyperParams.distanceMetric}
                                                onChange={(e) => setMlHyperParams((p) => ({ ...p, distanceMetric: e.target.value }))}
                                                placeholder="Enter Distance Metric"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-6">
                                        <label className="text-sm font-medium text-gray-600 text-right">Feature Scaling</label>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={mlHyperParams.featureScaling}
                                                onChange={(e) => setMlHyperParams((p) => ({ ...p, featureScaling: e.target.value }))}
                                                placeholder="Enter Feature Scaling"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CreateModelModal;

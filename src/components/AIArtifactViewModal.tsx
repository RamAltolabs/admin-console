import React, { useState, useEffect } from 'react';
import { FiX, FiPackage, FiSave, FiTrash2, FiArrowLeft, FiPlus, FiEye, FiEyeOff, FiEdit2, FiPlay } from 'react-icons/fi';
import { AIArtifact } from '../types/merchant';
import merchantService from '../services/merchantService';

interface AIArtifactViewModalProps {
    artifact: AIArtifact | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
    onDelete?: () => void;
}

const AIArtifactViewModal: React.FC<AIArtifactViewModalProps> = ({ artifact, isOpen, onClose, onUpdate, onDelete }) => {
    type ApiKv = { key: string; value: string };
    type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    type ApiTab = 'params' | 'authorization' | 'headers' | 'environment';

    const [formData, setFormData] = useState<Partial<AIArtifact>>({});
    const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });
    const [showToken, setShowToken] = useState(false);
    const [loading, setLoading] = useState(false);
    const [artifactApis, setArtifactApis] = useState<any[]>([]);
    const [apiLoading, setApiLoading] = useState(false);
    const [activeApiTab, setActiveApiTab] = useState<ApiTab>('params');
    const [responseMode, setResponseMode] = useState<'pretty' | 'raw'>('pretty');
    const [apiTestLoading, setApiTestLoading] = useState(false);
    const [apiTestResponse, setApiTestResponse] = useState<string>('');
    const [apiForm, setApiForm] = useState<any>({
        id: '',
        name: '',
        status: 'Active',
        description: '',
        method: 'GET',
        endpoint: '',
        body: '',
        params: [{ key: '', value: '' }] as ApiKv[],
        authorization: [{ key: 'Authorization', value: '' }] as ApiKv[],
        headers: [{ key: 'Content-Type', value: 'application/json' }] as ApiKv[],
        environment: [{ key: '', value: '' }] as ApiKv[]
    });

    useEffect(() => {
        if (artifact && isOpen) {
            setFormData({ ...artifact });
            loadArtifactApis(artifact);
        }
    }, [artifact, isOpen]);

    if (!isOpen || !artifact) return null;

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const loadArtifactApis = async (currentArtifact: AIArtifact) => {
        if (!currentArtifact?.id) return;
        setApiLoading(true);
        try {
            const apis = await merchantService.getIntegrationApisById(currentArtifact.id, currentArtifact.cluster);
            setArtifactApis(Array.isArray(apis) ? apis : []);
        } catch (error) {
            console.error('Failed to fetch integration APIs:', error);
            setArtifactApis([]);
        } finally {
            setApiLoading(false);
        }
    };

    const resetApiForm = () => {
        setApiForm({
            id: '',
            name: '',
            status: 'Active',
            description: '',
            method: 'GET',
            endpoint: '',
            body: '',
            params: [{ key: '', value: '' }],
            authorization: [{ key: 'Authorization', value: '' }],
            headers: [{ key: 'Content-Type', value: 'application/json' }],
            environment: [{ key: '', value: '' }]
        });
        setApiTestResponse('');
    };

    const mapApiToForm = (api: any) => {
        const mapKvArray = (val: any): ApiKv[] => {
            if (Array.isArray(val)) {
                return val.map((x: any) => ({ key: String(x?.key || ''), value: String(x?.value || '') }));
            }
            if (val && typeof val === 'object') {
                return Object.keys(val).map(k => ({ key: k, value: String(val[k] ?? '') }));
            }
            return [{ key: '', value: '' }];
        };

        return {
            id: api.id || api.apiId || '',
            name: api.name || api.apiName || '',
            method: api.method || 'GET',
            endpoint: api.path || api.urlPath || api.endpoint || '',
            status: api.status || 'Active',
            description: api.description || '',
            body: (() => {
                const bodyValue = api.body ?? api.requestBody ?? api.payload ?? '';
                if (typeof bodyValue === 'string') return bodyValue;
                if (bodyValue && typeof bodyValue === 'object') return JSON.stringify(bodyValue, null, 2);
                return '';
            })(),
            params: mapKvArray(api.params),
            authorization: mapKvArray(api.authorization),
            headers: mapKvArray(api.headers),
            environment: mapKvArray(api.environment)
        };
    };

    const handleEditApi = (api: any) => {
        setApiForm(mapApiToForm(api));
        setApiTestResponse('');
        setActiveApiTab('params');
    };

    const updateApiKv = (group: ApiTab, index: number, field: 'key' | 'value', value: string) => {
        setApiForm((prev: any) => {
            const existing: ApiKv[] = Array.isArray(prev[group]) ? [...prev[group]] : [{ key: '', value: '' }];
            existing[index] = { ...existing[index], [field]: value };
            return { ...prev, [group]: existing };
        });
    };

    const addApiKv = (group: ApiTab) => {
        setApiForm((prev: any) => {
            const existing: ApiKv[] = Array.isArray(prev[group]) ? [...prev[group]] : [];
            return { ...prev, [group]: [...existing, { key: '', value: '' }] };
        });
    };

    const compactKv = (items: ApiKv[]): ApiKv[] => {
        return (items || []).filter(x => (x.key || '').trim() || (x.value || '').trim());
    };

    const handleSaveApi = async () => {
        if (!artifact?.id || !apiForm.name || !apiForm.endpoint) {
            alert('API Name and Endpoint are required');
            return;
        }

        setApiLoading(true);
        try {
            const payload = {
                artifactId: artifact.id,
                merchantId: artifact.merchantId,
                name: apiForm.name,
                apiName: apiForm.name,
                method: apiForm.method,
                path: apiForm.endpoint,
                endpoint: apiForm.endpoint,
                body: apiForm.body,
                requestBody: apiForm.body,
                status: apiForm.status,
                description: apiForm.description,
                params: compactKv(apiForm.params),
                authorization: compactKv(apiForm.authorization),
                headers: compactKv(apiForm.headers),
                environment: compactKv(apiForm.environment)
            };

            if (apiForm.id) {
                await merchantService.updateArtifactApi(apiForm.id, payload, artifact.cluster);
            } else {
                await merchantService.createNewArtifactApi(payload, artifact.cluster);
            }

            await loadArtifactApis(artifact);
            resetApiForm();
        } catch (error) {
            console.error('Failed to save integration API:', error);
            alert('Failed to save API');
        } finally {
            setApiLoading(false);
        }
    };

    const handleTestApi = async (targetForm?: any) => {
        const formToTest = targetForm || apiForm;
        if (!formToTest.endpoint) {
            alert('Endpoint is required to test');
            return;
        }

        setApiTestLoading(true);
        setApiTestResponse('');
        try {
            const host = String(formData.host || '').replace(/\/+$/, '');
            const envMap = (compactKv(apiForm.environment) as ApiKv[]).reduce((acc: Record<string, string>, x: ApiKv) => {
                acc[x.key] = x.value;
                return acc;
            }, {});
            let endpoint = String(formToTest.endpoint || '');

            // Support placeholders like {{HOST}} and {{VAR}}
            endpoint = endpoint.replace(/\{\{HOST\}\}/g, host || '');
            endpoint = endpoint.replace(/\{\{([^}]+)\}\}/g, (_m: string, key: string) => envMap[key] ?? '');

            const query = compactKv(formToTest.params).filter((x: ApiKv) => x.key);
            const qs = new URLSearchParams();
            query.forEach((x: ApiKv) => qs.append(x.key, x.value));

            const finalUrl = `${endpoint}${qs.toString() ? `${endpoint.includes('?') ? '&' : '?'}${qs.toString()}` : ''}`;
            const headers: Record<string, string> = {};
            compactKv(formToTest.headers).forEach((x: ApiKv) => {
                if (x.key) headers[x.key] = x.value;
            });
            compactKv(formToTest.authorization).forEach((x: ApiKv) => {
                if (x.key) headers[x.key] = x.value;
            });

            let resolvedBody = String(formToTest.body || '').trim();
            if (resolvedBody) {
                resolvedBody = resolvedBody.replace(/\{\{HOST\}\}/g, host || '');
                resolvedBody = resolvedBody.replace(/\{\{([^}]+)\}\}/g, (_m: string, key: string) => envMap[key] ?? '');
            }

            const method = String(formToTest.method || 'GET').toUpperCase();
            const canSendBody = method !== 'GET';
            const requestInit: RequestInit = {
                method,
                headers
            };

            if (canSendBody && resolvedBody) {
                requestInit.body = resolvedBody;
            }

            const response = await fetch(finalUrl, requestInit);
            const text = await response.text();
            let parsed: any = text;
            try {
                parsed = JSON.parse(text);
            } catch {
                // keep text
            }

            const out = {
                status: response.status,
                ok: response.ok,
                url: finalUrl,
                method: method,
                headers,
                requestBody: canSendBody ? (resolvedBody || null) : null,
                body: parsed
            };
            setApiTestResponse(JSON.stringify(out, null, 2));
        } catch (error: any) {
            setApiTestResponse(JSON.stringify({ error: true, message: error?.message || 'API test failed' }, null, 2));
        } finally {
            setApiTestLoading(false);
        }
    };

    const handleDeleteApi = async (apiId: string | number) => {
        if (!window.confirm('Are you sure you want to delete this API?')) return;
        if (!artifact?.id) return;
        setApiLoading(true);
        try {
            await merchantService.deleteArtifactApi(apiId, artifact.cluster);
            await loadArtifactApis(artifact);
            if (String(apiForm.id) === String(apiId)) {
                resetApiForm();
            }
        } catch (error) {
            console.error('Failed to delete integration API:', error);
            alert('Failed to delete API');
        } finally {
            setApiLoading(false);
        }
    };

    const handleNestedInputChange = (parent: string, field: string, value: any) => {
        setFormData(prev => {
            const currentParent = (prev as any)[parent] || {};
            return {
                ...prev,
                [parent]: {
                    ...currentParent,
                    [field]: value
                }
            };
        });
    };

    const handleAuthValueChange = (field: string, value: any) => {
        setFormData(prev => {
            const currentAuth = prev.authentication || { type: 'TOKEN', value: { token: '' } };
            const currentVal = currentAuth.value || { token: '' };
            return {
                ...prev,
                authentication: {
                    ...currentAuth,
                    value: {
                        ...currentVal,
                        [field]: value
                    }
                }
            };
        });
    };

    const handleAddAttribute = () => {
        if (!newAttribute.key) return;
        const currentAttributes = formData.otherAttributes || [];
        const updatedAttributes = [...currentAttributes, { ...newAttribute }];
        handleInputChange('otherAttributes', updatedAttributes);
        setNewAttribute({ key: '', value: '' });
    };

    const handleRemoveAttribute = (index: number) => {
        const currentAttributes = formData.otherAttributes || [];
        const updatedAttributes = currentAttributes.filter((_, i) => i !== index);
        handleInputChange('otherAttributes', updatedAttributes);
    };

    const handleUpdate = async () => {
        if (!formData.name) {
            alert('Name is required');
            return;
        }
        setLoading(true);
        try {
            const normalizeAccess = (value?: string) => {
                const input = String(value || '').trim().toUpperCase();
                if (!input) return 'PRIVATE';
                if (input === 'PUBLIC' || input === 'PRIVATE' || input === 'RESTRICTED') return input;
                if (input === 'PRIVATE') return 'PRIVATE';
                if (input === 'PUBLIC') return 'PUBLIC';
                return 'PRIVATE';
            };

            const currentToken = String(formData.authentication?.value?.token || '').trim();
            const currentAuthType = String(formData.authentication?.type || 'api_key').trim().toLowerCase();

            const payload = {
                name: formData.name || artifact.name || '',
                icon: formData.icon || artifact.icon || null,
                description: formData.description || '',
                providerDomain: formData.providerDomain ?? null,
                tags: Array.isArray(formData.tags) ? formData.tags : [],
                type: formData.type || artifact.type || 'integration',
                category: formData.category ?? '',
                documentation: formData.documentation ?? '',
                notes: Array.isArray(formData.notes) ? formData.notes : [],
                host: formData.host ?? '',
                authentication: {
                    type: currentAuthType || 'api_key',
                    value: {
                        token: currentToken,
                        pathToCertificate: String(formData.authentication?.value?.pathToCertificate || ''),
                        certPassword: String(formData.authentication?.value?.certPassword || '')
                    }
                },
                status: formData.status || 'Active',
                otherAttributes: Array.isArray(formData.otherAttributes) ? formData.otherAttributes : [],
                access: normalizeAccess(formData.access || artifact.access),
                merchantId: String(formData.merchantId || artifact.merchantId || ''),
                createdBy: String(formData.createdBy || artifact.createdBy || ''),
                createdDate: String(formData.createdDate || artifact.createdDate || ''),
                modifiedDate: String(formData.modifiedDate || ''),
                modifiedBy: String(formData.modifiedBy || ''),
                ownerMerchantId: String(formData.ownerMerchantId || artifact.ownerMerchantId || '')
            };

            await merchantService.updateAIArtifact(artifact.merchantId || '', artifact.id, payload, artifact.cluster);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error updating artifact:', error);
            alert('Failed to update artifact');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this artifact?')) return;
        setLoading(true);
        try {
            await merchantService.deleteAIArtifact(artifact.id, artifact.cluster, artifact.merchantId || '');
            if (onDelete) onDelete();
        } catch (error) {
            console.error('Error deleting artifact:', error);
            alert('Failed to delete artifact');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#f8fafc] rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-200">
                {/* Body - Main Content Section */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column - Main Form */}
                        <div className="flex-[2] space-y-6">
                            <div className="flex gap-6 items-start">
                                {/* Large Icon/Image Placeholder */}
                                <div className="w-24 h-24 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                                    {formData.icon?.url ? (
                                        <img src={formData.icon.url} alt="Artifact" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-1.5 h-12 bg-black mb-1"></div>
                                            <div className="w-1.5 h-12 bg-black"></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Enter name"
                                        />
                                    </div>

                                    {/* Access */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            Access
                                        </label>
                                        <select
                                            value={formData.access || 'Private'}
                                            onChange={(e) => handleInputChange('access', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
                                        >
                                            <option value="Private">Private</option>
                                            <option value="Public">Public</option>
                                            <option value="Restricted">Restricted</option>
                                        </select>
                                    </div>

                                    {/* Host */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            Host
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.host || ''}
                                            onChange={(e) => handleInputChange('host', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                                            placeholder="Enter host URL"
                                        />
                                    </div>

                                    {/* API Key / Token */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            API Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showToken ? "text" : "password"}
                                                value={formData.authentication?.value?.token || ''}
                                                onChange={(e) => handleAuthValueChange('token', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm pr-10 focus:outline-none focus:border-blue-500"
                                                placeholder="••••••••••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowToken(!showToken)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showToken ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 titlecase tracking-wide">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status || 'Active'}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Other Attributes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 titlecase tracking-wide">
                                    Other Attributes
                                </label>
                                <div className="space-y-3">
                                    {formData.otherAttributes?.map((attr, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <input
                                                type="text"
                                                value={attr.key}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={attr.value}
                                                onChange={(e) => {
                                                    const updated = [...(formData.otherAttributes || [])];
                                                    updated[idx].value = e.target.value;
                                                    handleInputChange('otherAttributes', updated);
                                                }}
                                                className="flex-[2] px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:border-blue-500 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleRemoveAttribute(idx)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="text"
                                            placeholder="Enter key"
                                            value={newAttribute.key}
                                            onChange={(e) => setNewAttribute(prev => ({ ...prev, key: e.target.value }))}
                                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Enter value"
                                            value={newAttribute.value}
                                            onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                                            className="flex-[2] px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={handleAddAttribute}
                                            className="p-2.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 shadow-sm border border-gray-200"
                                        >
                                            <FiPlus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded text-sm font-bold flex items-center shadow-md hover:bg-[#1e40af] disabled:opacity-50"
                                >
                                    <FiSave className="mr-2" /> Update
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-[#f43f5e] text-white rounded text-sm font-bold flex items-center shadow-md hover:bg-[#e11d48] disabled:opacity-50"
                                >
                                    <FiTrash2 className="mr-2" /> Delete
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-[#1e3a8a] rounded text-sm font-bold flex items-center shadow-sm hover:bg-gray-50"
                                >
                                    <FiArrowLeft className="mr-2" /> Back
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Secondary Info */}
                        <div className="flex-1 space-y-6 lg:border-l lg:pl-8 border-gray-200">
                            {/* Business Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Business Type
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={formData.businessType || ''}
                                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                                        className="flex-grow px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
                                    >
                                        <option value="">Select Business Type</option>
                                        <option value="Enterprise">Enterprise </option>
                                        <option value="Retail">Retail</option>
                                        <option value="Auto Dealership">Auto Dealership</option>
                                        <option value="E-Commerce">E-Commerce</option>
                                        <option value="Healthcares">Healthcares</option>
                                        <option value="Realestate">Realestate</option>
                                        <option value="Telecom">Telecom</option>
                                    </select>
                                    <button className="px-3 py-2 bg-[#1e3a8a] text-white rounded text-xs font-bold shadow-sm">
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={5}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 resize-none"
                                    placeholder="Enter description"
                                />
                            </div>

                            {/* Documentation */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Documentation
                                </label>
                                <textarea
                                    value={formData.documentation || ''}
                                    onChange={(e) => handleInputChange('documentation', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 resize-none"
                                    placeholder="Enter Documentation"
                                />
                            </div>

                            {/* Category/Tags */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Category
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.category ? (
                                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium flex items-center">
                                            {formData.category}
                                            <button onClick={() => handleInputChange('category', null)} className="ml-1.5 text-gray-400 hover:text-gray-600">
                                                <FiX size={10} />
                                            </button>
                                        </span>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Enter category"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleInputChange('category', (e.target as HTMLInputElement).value);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* APIs & Documents */}
                    <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-2xl font-semibold text-[#0f295f]">APIs &amp; Documents</h4>
                            <button
                                onClick={resetApiForm}
                                className="px-4 py-2 bg-[#1e3a8a] text-white rounded text-sm font-bold hover:bg-[#1d4ed8]"
                            >
                                + Add API
                            </button>
                        </div>

                        <div className="space-y-2 mb-4">
                            {apiLoading ? (
                                <p className="text-xs text-gray-500">Loading APIs...</p>
                            ) : artifactApis.length === 0 ? (
                                <p className="text-xs text-gray-500">No APIs configured.</p>
                            ) : (
                                artifactApis.map((api, idx) => {
                                    const apiId = api.id || api.apiId || idx;
                                    const apiName = api.name || api.apiName || 'Unnamed API';
                                    const apiMethod = (api.method || 'GET').toUpperCase();
                                    const apiPath = api.path || api.urlPath || api.endpoint || '';
                                    return (
                                        <div key={apiId} className="p-3 border border-gray-200 rounded bg-[#f8fafc] flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-[#0f295f]">{apiName}</p>
                                                <p className="text-xs text-gray-700 mt-1">
                                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold mr-2">{apiMethod}</span>
                                                    <span className="font-medium">{apiPath}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleTestApi(mapApiToForm(api))} className="tile-btn-view h-7 w-7" title="Test API">
                                                    <FiPlay size={12} />
                                                </button>
                                                <button onClick={() => handleEditApi(api)} className="tile-btn-edit h-7 w-7" title="Edit API">
                                                    <FiEdit2 size={12} />
                                                </button>
                                                <button onClick={() => handleDeleteApi(apiId)} className="tile-btn-delete h-7 w-7" title="Delete API">
                                                    <FiTrash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-[#f9fbff]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={apiForm.name}
                                        onChange={(e) => setApiForm((prev: any) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter API name"
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                    <select
                                        value={apiForm.status}
                                        onChange={(e) => setApiForm((prev: any) => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                                <textarea
                                    value={apiForm.description}
                                    onChange={(e) => setApiForm((prev: any) => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500 resize-none"
                                    placeholder="Enter description"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as ApiMethod[]).map((method) => (
                                    <label key={method} className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="api-method"
                                            checked={apiForm.method === method}
                                            onChange={() => setApiForm((prev: any) => ({ ...prev, method }))}
                                        />
                                        {method}
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={apiForm.endpoint}
                                    onChange={(e) => setApiForm((prev: any) => ({ ...prev, endpoint: e.target.value }))}
                                    placeholder="{{HOST}}/v2/voices?page_size=100"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={handleTestApi}
                                    disabled={apiTestLoading}
                                    className="px-5 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
                                >
                                    {apiTestLoading ? 'Testing...' : 'Test'}
                                </button>
                            </div>

                            {apiForm.method !== 'GET' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Body</label>
                                    <textarea
                                        value={apiForm.body}
                                        onChange={(e) => setApiForm((prev: any) => ({ ...prev, body: e.target.value }))}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:border-blue-500"
                                        placeholder='{"key":"value"}'
                                    />
                                </div>
                            )}

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="flex gap-1 border-b border-gray-200 px-2 py-1 bg-gray-50">
                                    {(['params', 'authorization', 'headers', 'environment'] as ApiTab[]).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveApiTab(tab)}
                                            className={`px-3 py-1 text-xs font-semibold rounded ${activeApiTab === tab ? 'bg-white text-blue-900 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-2 space-y-2">
                                    {(apiForm[activeApiTab] || []).map((item: ApiKv, idx: number) => (
                                        <div key={`${activeApiTab}-${idx}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                            <input
                                                type="text"
                                                value={item.key}
                                                onChange={(e) => updateApiKv(activeApiTab, idx, 'key', e.target.value)}
                                                placeholder="Key"
                                                className="px-2 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500"
                                            />
                                            <input
                                                type="text"
                                                value={item.value}
                                                onChange={(e) => updateApiKv(activeApiTab, idx, 'value', e.target.value)}
                                                placeholder="Value"
                                                className="px-2 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => addApiKv(activeApiTab)}
                                                className="px-2 py-2 bg-gray-100 border border-gray-200 rounded text-xs font-bold hover:bg-gray-200"
                                                title="Add row"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Response</label>
                                <div className="flex items-center gap-4 text-xs mb-1.5">
                                    <label className="inline-flex items-center gap-1">
                                        <input type="radio" checked={responseMode === 'pretty'} onChange={() => setResponseMode('pretty')} />
                                        Pretty
                                    </label>
                                    <label className="inline-flex items-center gap-1">
                                        <input type="radio" checked={responseMode === 'raw'} onChange={() => setResponseMode('raw')} />
                                        Raw
                                    </label>
                                </div>
                                <textarea
                                    value={responseMode === 'pretty'
                                        ? (() => {
                                            try {
                                                return apiTestResponse ? JSON.stringify(JSON.parse(apiTestResponse), null, 2) : '';
                                            } catch {
                                                return apiTestResponse;
                                            }
                                        })()
                                        : apiTestResponse}
                                    readOnly
                                    rows={8}
                                    className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono bg-gray-50"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSaveApi}
                                    disabled={apiLoading}
                                    className="px-4 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
                                >
                                    {apiForm.id ? 'Update API' : 'Add API'}
                                </button>
                                {apiForm.id && (
                                    <button
                                        onClick={resetApiForm}
                                        className="px-3 py-2 bg-white border border-gray-200 rounded text-xs font-bold text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIArtifactViewModal;

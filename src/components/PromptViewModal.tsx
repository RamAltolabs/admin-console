import React, { useState, useEffect } from 'react';
import { FiX, FiFileText, FiCalendar, FiTag, FiSave, FiEdit2, FiInfo } from 'react-icons/fi';
import { Prompt } from '../types/merchant';
import merchantService from '../services/merchantService';

interface PromptViewModalProps {
  isOpen: boolean;
  prompt: Prompt | null;
  onClose: () => void;
  onUpdate?: () => void;
}

const PromptViewModal: React.FC<PromptViewModalProps> = ({ isOpen, prompt, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<Partial<Prompt>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (prompt && isOpen) {
      setFormData({ ...prompt });
      setIsEditing(false);
      setMessage(null);
    }
  }, [prompt, isOpen]);

  if (!isOpen) return null;
  if (!prompt) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!formData.title || !formData.promptText) {
      setMessage({ type: 'error', text: 'Title and Description are required' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        merchantId: prompt.merchantId,
        modelId: formData.modelId || prompt.modelId,
        promptDescription: formData.promptText,
        promptTitle: formData.title,
        promptType: formData.type || prompt.type,
        media: formData.media || [],
        requestParams: formData.requestParams || {}
      };

      await merchantService.updatePrompt(prompt.merchantId, prompt.id, payload, prompt.cluster);
      setMessage({ type: 'success', text: 'Prompt updated successfully' });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating prompt:', error);
      setMessage({ type: 'error', text: 'Failed to update prompt' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1e3a8a] text-white p-6 rounded-t-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <FiFileText size={24} />
            <h2 className="text-xl font-semibold">Prompt Preview & Edit</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-sm font-medium"
              >
                <FiEdit2 size={16} /> Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-md transition-colors"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <FiInfo size={18} />
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all font-medium text-gray-800"
                placeholder="Enter prompt title"
              />
            ) : (
              <div className="bg-[#f8fafc] border border-gray-100 rounded-lg p-4">
                <p className="text-lg font-bold text-[#1e3a8a]">{formData.title || 'Untitled'}</p>
              </div>
            )}
          </div>

          {/* Prompt Description */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prompt Description</label>
            {isEditing ? (
              <textarea
                value={formData.promptText || ''}
                onChange={(e) => handleInputChange('promptText', e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all text-gray-800 font-mono text-sm leading-relaxed"
                placeholder="Enter system prompt instructions..."
              />
            ) : (
              <div className="bg-[#f8fafc] border border-gray-100 rounded-lg p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{formData.promptText}</p>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prompt Type</label>
              {isEditing ? (
                <select
                  value={formData.type || ''}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all text-sm font-medium"
                >
                  <option value="Generation">Generation</option>
                  <option value="Extraction">Extraction</option>
                  <option value="Classification">Classification</option>
                  <option value="Standard">Standard</option>
                </select>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiTag className="text-blue-600" size={16} />
                    <span className="text-sm font-bold text-blue-900">{formData.type || 'Standard'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Model ID */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Model ID</label>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-center gap-2 font-mono text-xs font-bold text-purple-700">
                <FiTag className="text-purple-600" size={16} />
                {formData.modelId || 'Default'}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <FiTag className="text-green-600" size={16} />
              <label className="text-sm font-semibold text-green-900">Status</label>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${prompt.status?.toLowerCase() === 'active'
              ? 'bg-green-100 text-green-700'
              : prompt.status?.toLowerCase() === 'deleted'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
              }`}>
              {prompt.status || 'N/A'}
            </span>
          </div>

          {/* Merchant ID */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <FiTag className="text-amber-600" size={16} />
              <label className="text-sm font-semibold text-amber-900">Merchant ID</label>
            </div>
            <p className="text-amber-700 font-medium">{prompt.merchantId}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Created Date */}
          {prompt.createdAt && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <FiCalendar className="text-gray-600" size={16} />
                <label className="text-sm font-semibold text-gray-700">Created</label>
              </div>
              <p className="text-gray-600 text-sm">{formatDate(prompt.createdAt)}</p>
            </div>
          )}

          {/* Updated Date */}
          {prompt.updatedAt && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <FiCalendar className="text-gray-600" size={16} />
                <label className="text-sm font-semibold text-gray-700">Last Modified</label>
              </div>
              <p className="text-gray-600 text-sm">{formatDate(prompt.updatedAt)}</p>
            </div>
          )}
        </div>

        {/* Merchant Info */}
        {prompt.merchantInfo && (
          <div className="bg-gradient-to-r from-genx-50 to-blue-50 border border-genx-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-genx-700 mb-3">Merchant Information</label>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {prompt.merchantInfo.merchantName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-800">{prompt.merchantInfo.merchantName}</span>
                </div>
              )}
              {prompt.merchantInfo.type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-800">{prompt.merchantInfo.type}</span>
                </div>
              )}
              {prompt.merchantInfo.currency && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-medium text-gray-800">{prompt.merchantInfo.currency}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-6 bg-white rounded-b-2xl flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e40af] transition-all font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <FiSave size={18} />}
              Update Prompt
            </button>
            <button
              onClick={() => {
                setFormData({ ...prompt });
                setIsEditing(false);
                setMessage(null);
              }}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-bold disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-bold"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default PromptViewModal;

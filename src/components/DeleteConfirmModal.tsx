import React from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  merchantName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  merchantName,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-card-lg max-w-sm w-full border border-genx-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-genx-50 p-6">
          <h2 className="text-lg font-semibold text-genx-700">
            Delete Merchant
          </h2>
          <button
            onClick={onCancel}
            className="text-genx-700 hover:text-genx-900 p-2 rounded-md"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-shrink-0">
              <FiAlertCircle className="text-red-600" size={24} />
            </div>
            <div className='text-center'>
              <p className="text-gray-900 font-medium text-lg">
                Are you sure you want to delete <strong>{merchantName}</strong>?
              </p>
              <p className="text-gray-600 text-sm mt-4">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-genx-50 p-6 pt-0">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-200 text-genx-700 rounded-lg hover:bg-genx-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:opacity-95 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

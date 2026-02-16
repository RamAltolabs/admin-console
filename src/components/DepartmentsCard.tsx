import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiRefreshCw } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface DepartmentsCardProps {
    merchantId: string;
    cluster?: string;
}

interface Department {
    id: string;
    name: string;
    description?: string;
    status?: string;
    userCount?: number;
}

const DepartmentsCard: React.FC<DepartmentsCardProps> = ({ merchantId, cluster }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDepartments = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const data = await merchantService.getDepartmentByMerchant(merchantId, cluster, forceRefresh);
            setDepartments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchDepartments();
        }
    }, [merchantId, cluster]);

    if (loading && departments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-genx-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-genx-200 overflow-hidden">
            <div className="p-6 border-b border-genx-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <FiUsers size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Departments</h3>
                        <p className="text-sm text-gray-500">Manage organizational units</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchDepartments(true)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw size={18} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <FiPlus size={16} />
                        <span className="text-sm font-medium">Add Dept</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {departments.length > 0 ? (
                    departments.map((dept, index) => (
                        <div key={dept.id || index} className="standard-tile group relative">
                            <div className="standard-tile-avatar">
                                <span className="text-primary-main">{dept.name?.charAt(0) || 'D'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-neutral-text-main text-sm truncate">{dept.name || 'Unnamed Department'}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold titlecase tracking-wider ${dept.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {dept.status || 'Active'}
                                    </span>
                                    {dept.userCount !== undefined && (
                                        <span className="text-[10px] text-neutral-text-muted font-bold flex items-center gap-1">
                                            <FiUsers size={10} /> {dept.userCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-100 transition-all shrink-0">
                                <button className="tile-btn-edit h-7 w-7">
                                    <FiEdit2 size={12} />
                                </button>
                                <button className="tile-btn-delete h-7 w-7">
                                    <FiTrash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center">
                        <div className="inline-flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full mb-3 text-gray-400">
                            <FiUsers size={24} />
                        </div>
                        <p className="text-gray-500 font-medium">No departments found</p>
                        <p className="text-sm text-gray-400 mt-1">Get started by adding a new department</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentsCard;

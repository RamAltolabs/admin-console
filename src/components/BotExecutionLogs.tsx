import React, { useState, useEffect } from 'react';
import { FiList, FiClock, FiActivity, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface BotExecutionLogsProps {
    merchantId: string;
    cluster?: string;
}

const BotExecutionLogs: React.FC<BotExecutionLogsProps> = ({ merchantId, cluster }) => {
    const [logType, setLogType] = useState<'flow' | 'chat'>('flow');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize] = useState(20);

    const fetchLogs = async (pageNum: number, type: 'flow' | 'chat') => {
        setLoading(true);
        try {
            let data;
            if (type === 'flow') {
                data = await merchantService.getFlowBotExecution(merchantId, pageNum, pageSize, cluster);
            } else {
                data = await merchantService.getChatBotExecution(merchantId, pageNum, pageSize, cluster);
            }
            // Assuming response and mapping it appropriately
            const content = (data && data.content) || (Array.isArray(data) ? data : []);
            setLogs(content);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchLogs(0, logType);
        }
    }, [merchantId, logType]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <FiList className="text-blue-600" />
                    <h3 className="font-bold text-gray-800">Execution Logs</h3>
                </div>
                <div className="flex bg-gray-200 p-1 rounded-lg">
                    <button
                        onClick={() => setLogType('flow')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${logType === 'flow' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Workflow Console Logs
                    </button>
                    <button
                        onClick={() => setLogType('chat')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${logType === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Agent Chatbots Logs
                    </button>
                </div>
            </div>

            <div className="p-0 overflow-x-auto min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-500 font-medium">Fetching {logType} logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <FiActivity className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500 text-sm">No {logType} execution logs found.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Execution ID</th>
                                <th className="px-6 py-3">Bot</th>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map((log, index) => (
                                <tr key={log.id || index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-blue-600">
                                        {log.executionId || log.id || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{log.botName || log.botId || 'Default Bot'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        <div className="flex items-center gap-1">
                                            <FiClock size={12} />
                                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold titlecase ${log.status?.toLowerCase() === 'completed' || log.status?.toLowerCase() === 'success'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {log.status || 'Success'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <button
                    onClick={() => fetchLogs(page, logType)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                    title="Refresh"
                >
                    <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page === 0 || loading}
                        onClick={() => fetchLogs(page - 1, logType)}
                        className="p-1 border border-gray-200 rounded hover:bg-white disabled:opacity-50"
                    >
                        <FiChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-medium text-gray-600">Page {page + 1}</span>
                    <button
                        disabled={logs.length < pageSize || loading}
                        onClick={() => fetchLogs(page + 1, logType)}
                        className="p-1 border border-gray-200 rounded hover:bg-white disabled:opacity-50"
                    >
                        <FiChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BotExecutionLogs;

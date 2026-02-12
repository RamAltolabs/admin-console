import React, { useState, useEffect } from 'react';
import { FiClock, FiActivity, FiRefreshCw, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp, FiCpu, FiZap, FiSearch, FiFilter } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface AgentiAILogsProps {
    merchantId: string;
    cluster?: string;
}

const AgentiAILogs: React.FC<AgentiAILogsProps> = ({ merchantId, cluster }) => {
    const [logType, setLogType] = useState<'workflow' | 'agent'>('workflow');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize] = useState(20);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const fetchLogs = async (pageNum: number, type: 'workflow' | 'agent') => {
        setLoading(true);
        try {
            let data;
            if (type === 'workflow') {
                data = await merchantService.getFlowBotExecution(merchantId, pageNum, pageSize, cluster);
                // Handle flowbot response structure
                const content = data?.flowBotExecutionStats || data?.content || (Array.isArray(data) ? data : []);
                setLogs(content);
            } else {
                data = await merchantService.getChatBotExecution(merchantId, pageNum, pageSize, cluster);
                // Handle chatbot response structure
                const content = data?.chatBotExecutionStats || data?.content || (Array.isArray(data) ? data : []);
                setLogs(content);
            }
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

    const toggleExpand = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const formatJSON = (jsonString: any) => {
        if (!jsonString) return 'N/A';

        // If it's already an object, just stringify it
        if (typeof jsonString === 'object') {
            try {
                return JSON.stringify(jsonString, null, 2);
            } catch (e) {
                return 'Invalid Object';
            }
        }

        // If it's a string, try to parse and pretty print
        try {
            const obj = JSON.parse(jsonString);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return jsonString;
        }
    };

    const getWorkflowRequestParams = (botRequest: string) => {
        try {
            const parsed = JSON.parse(botRequest);
            // Check if requestParams is a string inside the parsed object
            if (parsed.requestParams && typeof parsed.requestParams === 'string') {
                return parsed.requestParams;
            }
            return parsed.requestParams || parsed;
        } catch (e) {
            return botRequest;
        }
    };

    const renderPayloadPreview = (payload: any, type: 'workflow' | 'agent') => {
        if (!payload) return <span className="text-gray-400 italic font-normal">Empty</span>;

        let displayStr = '';
        try {
            // First, if it's a string, try to parse it as JSON
            let data = payload;
            if (typeof payload === 'string' && (payload.trim().startsWith('{') || payload.trim().startsWith('['))) {
                try {
                    data = JSON.parse(payload);
                } catch (e) {
                    // Not valid JSON, stick with string
                }
            }

            // If it's an object (either originally or parsed)
            if (typeof data === 'object' && data !== null) {
                // For workflows, try to find requestParams
                if (type === 'workflow' && data.requestParams) {
                    const params = typeof data.requestParams === 'string' ? data.requestParams : JSON.stringify(data.requestParams);
                    displayStr = params;
                } else {
                    // Just stringify the object but keep it compact
                    displayStr = JSON.stringify(data);
                }
            } else {
                displayStr = String(data);
            }
        } catch (e) {
            displayStr = String(payload);
        }

        // Clean up the string for display (remove extra quotes if it's a stringified string)
        if (displayStr.startsWith('"') && displayStr.endsWith('"')) {
            displayStr = displayStr.substring(1, displayStr.length - 1);
        }

        return (
            <div className="font-mono text-[11px] text-gray-500 truncate max-w-xs group-hover:text-gray-700 transition-colors" title={displayStr}>
                {displayStr}
            </div>
        );
    };

    const formatTimestamp = (timestamp: string | undefined) => {
        if (!timestamp) return '-';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp; // Return raw string if invalid date
            return (
                <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{date.toLocaleDateString()}</span>
                    <span className="text-gray-500 text-xs">{date.toLocaleTimeString()}</span>
                </div>
            );
        } catch (e) {
            return timestamp;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-genx-200 overflow-hidden mt-6">
            <div className="p-6 border-b border-genx-100 flex flex-col gap-4 bg-gray-50/50">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${logType === 'agent' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                            {logType === 'agent' ? <FiCpu size={20} /> : <FiZap size={20} />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {logType === 'agent' ? 'Agent Chatbots Logs' : 'Agent Flowbots Logs'}
                            </h3>
                            <p className="text-sm text-gray-500">Real-time execution logs.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white border border-gray-200 rounded-lg flex p-1 shadow-sm">
                            <button
                                onClick={() => setLogType('workflow')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${logType === 'workflow' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <FiZap size={14} />
                                Flowbots
                            </button>
                            <button
                                onClick={() => setLogType('agent')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${logType === 'agent' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <FiCpu size={14} />
                                Chatbots
                            </button>
                        </div>
                        <button
                            onClick={() => fetchLogs(page, logType)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                            title="Refresh Logs"
                        >
                            <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search logs by ID, Name or Payload..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                        <FiFilter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                {loading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500 animate-pulse">Loading execution logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <FiActivity size={32} className="text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-600">No logs found</p>
                        <p className="text-sm mt-1 text-gray-400">Try adjusting filters or refreshing</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-3 w-10"></th>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">{logType === 'agent' ? 'Name' : 'Bot Name'}</th>
                                {logType === 'agent' && <th className="px-6 py-3">Message</th>}
                                <th className="px-6 py-3">Request Payload</th>
                                {logType === 'agent' && <th className="px-6 py-3">Response Payload</th>}
                                <th className="px-6 py-3 text-right">Execution Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {logs.map((log, index) => {
                                // Debug: log the full structure of the first item to help understand the API shape
                                if (index === 0) {
                                    console.log('[AgentiAILogs] Sample log entry keys:', Object.keys(log));
                                    console.log('[AgentiAILogs] Sample log entry:', JSON.stringify(log).substring(0, 500));
                                }

                                const id = log.id || log.executionId || log.correlationId || index.toString();
                                const isExpanded = expandedRow === id;
                                const timestamp = log.timestamp || log.createdDate || log.createdAt || log.startTime || log.createDate || log.executionDate;
                                const name = log.botName || log.name || log.engagementName || log.flowName || log.agentName || 'Unknown Bot';

                                // Robust message extraction
                                const message = log.message || log.botMessage || log.appMessage || log.userInput || log.text || log.content ||
                                    (log.botRequest && typeof log.botRequest === 'object' ? (log.botRequest.message || log.botRequest.text) : null) ||
                                    (log.botResponse && typeof log.botResponse === 'object' ? (log.botResponse.message || log.botResponse.text || log.botResponse.summary) : null) ||
                                    (log.response && typeof log.response === 'object' ? (log.response.message || log.response.text) : null);

                                // Robust request payload extraction: try many possible field names
                                const requestPayload = log.botRequest || log.request || log.payload || log.requestParams ||
                                    log.input || log.requestPayload || log.requestBody || log.req || log.params || log.inputPayload;

                                // Robust response payload extraction
                                const responsePayload = logType === 'workflow'
                                    ? (log.nodeStats || log.botResponse || log.response || log.result || log.output || log.responsePayload)
                                    : (log.response || log.botResponse || log.appOutput || log.output || log.result || log.responsePayload || log.res);

                                const execTime = log.botExecutionTime || log.executionTime || log.duration || log.timeTaken || log.elapsedTime || 0;

                                // If no specific payload fields found, show the full log object (excluding common metadata fields)
                                const getFullLogFallback = () => {
                                    const excludeKeys = ['id', 'executionId', 'correlationId', 'timestamp', 'createdDate', 'createdAt',
                                        'startTime', 'botName', 'name', 'botId', 'merchantId', 'botExecutionTime', 'executionTime', 'duration'];
                                    const filtered: any = {};
                                    Object.entries(log).forEach(([k, v]) => {
                                        if (!excludeKeys.includes(k) && v !== null && v !== undefined && v !== '') {
                                            filtered[k] = v;
                                        }
                                    });
                                    return Object.keys(filtered).length > 0 ? filtered : log;
                                };

                                return (
                                    <React.Fragment key={id}>
                                        <tr
                                            className={`hover:bg-blue-50/50 transition-colors cursor-pointer border-l-4 ${isExpanded ? 'bg-blue-50/30 border-l-blue-500' : 'border-l-transparent'}`}
                                            onClick={() => toggleExpand(id)}
                                        >
                                            <td className="px-6 py-4 text-gray-400">
                                                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatTimestamp(timestamp)}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {name}
                                                {log.botId && <span className="block text-xs text-gray-400 font-mono mt-0.5">{log.botId}</span>}
                                            </td>
                                            {logType === 'agent' && (
                                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={message}>
                                                    {message || <span className="text-gray-300 italic">No message</span>}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500 max-w-xs truncate">
                                                {renderPayloadPreview(requestPayload, logType)}
                                            </td>
                                            {logType === 'agent' && (
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500 max-w-xs truncate">
                                                    {renderPayloadPreview(responsePayload, 'agent')}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${execTime > 1000
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : execTime > 500
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                        : 'bg-green-50 text-green-700 border-green-100'
                                                    }`}>
                                                    {execTime} ms
                                                </span>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan={logType === 'agent' ? 7 : 5} className="px-6 py-4 border-b border-gray-100">
                                                    <div className="bg-white border border-gray-200 rounded-lg p-0 shadow-sm overflow-hidden animate-fadeIn">
                                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detailed Execution Data</h5>
                                                            <span className="text-xs font-mono text-gray-400">ID: {id}</span>
                                                        </div>
                                                        <div className="p-4 space-y-4">
                                                            {/* Request & Response side by side */}
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                <div className="flex flex-col h-full">
                                                                    <h6 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                                        Request / Input
                                                                    </h6>
                                                                    <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden relative group">
                                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigator.clipboard.writeText(formatJSON(requestPayload || getFullLogFallback()));
                                                                                }}
                                                                                className="text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded"
                                                                            >
                                                                                Copy
                                                                            </button>
                                                                        </div>
                                                                        <pre className="p-3 text-gray-300 text-xs font-mono overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent whitespace-pre-wrap break-all">
                                                                            {requestPayload ? formatJSON(requestPayload) : <span className="text-gray-500 italic">No specific request payload found</span>}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col h-full">
                                                                    <h6 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                                        {logType === 'agent' ? 'Response / Output' : 'Node Execution Stats'}
                                                                    </h6>
                                                                    <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden relative group">
                                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigator.clipboard.writeText(formatJSON(responsePayload || getFullLogFallback()));
                                                                                }}
                                                                                className="text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded"
                                                                            >
                                                                                Copy
                                                                            </button>
                                                                        </div>
                                                                        <pre className="p-3 text-gray-300 text-xs font-mono overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent whitespace-pre-wrap break-all">
                                                                            {responsePayload ? formatJSON(responsePayload) : <span className="text-gray-500 italic">No specific response payload found</span>}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Full Log Entry - always shown as a last resort */}
                                                            {(!requestPayload && !responsePayload) && (
                                                                <div className="flex flex-col">
                                                                    <h6 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                                        Full Log Entry
                                                                    </h6>
                                                                    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden relative group">
                                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigator.clipboard.writeText(formatJSON(log));
                                                                                }}
                                                                                className="text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded"
                                                                            >
                                                                                Copy
                                                                            </button>
                                                                        </div>
                                                                        <pre className="p-3 text-gray-300 text-xs font-mono overflow-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent whitespace-pre-wrap break-all">
                                                                            {formatJSON(log)}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-4 border-t border-genx-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows per page:</span>
                    <select className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:border-blue-500">
                        <option>20</option>
                        <option>50</option>
                        <option>100</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page === 0 || loading}
                        onClick={() => fetchLogs(page - 1, logType)}
                        className="p-1 px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-xs font-medium text-gray-600 transition-colors shadow-sm"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-medium text-gray-600 px-2">Page {page + 1}</span>
                    <button
                        disabled={logs.length < pageSize || loading}
                        onClick={() => fetchLogs(page + 1, logType)}
                        className="p-1 px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-xs font-medium text-gray-600 transition-colors shadow-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentiAILogs;

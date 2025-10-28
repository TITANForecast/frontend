"use client";

import { useState, useEffect } from 'react';
import { ImportLog } from '@/lib/types/admin';
import { authenticatedFetch } from '@/lib/utils/api';

interface DealerImportLogsProps {
  dealerId: string;
  getAuthToken: () => Promise<string | null>;
}

export default function DealerImportLogs({ dealerId, getAuthToken }: DealerImportLogsProps) {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    fileType: '',
    status: '',
    daysBack: '14',
  });

  useEffect(() => {
    fetchLogs();
  }, [dealerId, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (filters.fileType) params.append('fileType', filters.fileType);
      if (filters.status) params.append('status', filters.status);
      params.append('daysBack', filters.daysBack);

      const response = await authenticatedFetch(
        `/api/admin/dealers/${dealerId}/import-logs?${params.toString()}`,
        getAuthToken
      );

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'success') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
          Success
        </span>
      );
    } else if (statusLower === 'failed') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
          Failed
        </span>
      );
    } else if (statusLower === 'partial') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
          Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
        {status}
      </span>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            File Type
          </label>
          <select
            className="form-select w-full"
            value={filters.fileType}
            onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="SV">SV - Service</option>
            <option value="PTINV">PTINV - Parts Inventory</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            className="form-select w-full"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PARTIAL">Partial</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time Period
          </label>
          <select
            className="form-select w-full"
            value={filters.daysBack}
            onChange={(e) => setFilters({ ...filters, daysBack: e.target.value })}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading logs...</div>
        </div>
      )}

      {/* Logs Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    File Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No import logs found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id.toString()} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {log.fileType || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <div className="space-y-1">
                          {log.totalRecords !== null && (
                            <div>Total: {log.totalRecords}</div>
                          )}
                          {log.newRecords !== null && log.newRecords > 0 && (
                            <div className="text-green-600 dark:text-green-400">New: {log.newRecords}</div>
                          )}
                          {log.updatedRecords !== null && log.updatedRecords > 0 && (
                            <div className="text-blue-600 dark:text-blue-400">Updated: {log.updatedRecords}</div>
                          )}
                          {log.failedRecords !== null && log.failedRecords > 0 && (
                            <div className="text-red-600 dark:text-red-400">Failed: {log.failedRecords}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDuration(log.elapsedSeconds)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {log.errorMessage ? (
                          <div className="max-w-md">
                            <div className="text-red-600 dark:text-red-400 font-medium mb-1">Error:</div>
                            <div className="text-xs">{log.errorMessage}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && logs.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {logs.length} log{logs.length !== 1 ? 's' : ''} from the last {filters.daysBack} days
        </div>
      )}
    </div>
  );
}


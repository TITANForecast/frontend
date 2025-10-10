"use client";

import { useState } from 'react';
import { DealerExtended } from '@/lib/types/admin';

interface DealerListTableProps {
  dealers: DealerExtended[];
  onEdit: (dealer: DealerExtended) => void;
  onDelete: (dealerId: string) => void;
}

export default function DealerListTable({ dealers, onEdit, onDelete }: DealerListTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (dealerId: string) => {
    if (deleteConfirm === dealerId) {
      onDelete(dealerId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(dealerId);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getStatusBadge = (dealer: DealerExtended) => {
    if (!dealer.isActive) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Inactive</span>;
    }
    if (!dealer.apiConfig) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">No API Config</span>;
    }
    if (!dealer.apiConfig.isActive) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">API Inactive</span>;
    }
    if (dealer.apiConfig.lastError) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">Sync Error</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">Active</span>;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Dealer Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                API Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dealers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No dealers found. Create your first dealer to get started.
                </td>
              </tr>
            ) : (
              dealers.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {dealer.name}
                    </div>
                    {dealer.apiConfig && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Code: {dealer.apiConfig.dealerShortCode}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {dealer.city && dealer.state ? `${dealer.city}, ${dealer.state}` : '-'}
                    </div>
                    {dealer.zip && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{dealer.zip}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {dealer.contactEmail || '-'}
                    </div>
                    {dealer.contactPhone && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {dealer.contactPhone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {dealer.apiConfig ? (
                      <div>
                        {dealer.apiConfig.lastSuccess && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last sync: {new Date(dealer.apiConfig.lastSuccess).toLocaleDateString()}
                          </div>
                        )}
                        {dealer.apiConfig.lastError && (
                          <div className="text-xs text-red-600 dark:text-red-400 truncate max-w-xs" title={dealer.apiConfig.lastError}>
                            {dealer.apiConfig.lastError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(dealer)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(dealer)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(dealer.id)}
                      className={`${
                        deleteConfirm === dealer.id
                          ? 'text-red-600 dark:text-red-400 font-semibold'
                          : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                      }`}
                    >
                      {deleteConfirm === dealer.id ? 'Confirm?' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


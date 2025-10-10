"use client";

import { useState } from 'react';
import { UserExtended } from '@/lib/types/admin';
import { UserRole } from '@/lib/types/auth';

interface UserListTableProps {
  users: UserExtended[];
  onEdit: (user: UserExtended) => void;
  onDelete: (userId: string) => void;
}

export default function UserListTable({ users, onEdit, onDelete }: UserListTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (userId: string) => {
    if (deleteConfirm === userId) {
      onDelete(userId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(userId);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const badges = {
      [UserRole.SUPER_ADMIN]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      [UserRole.MULTI_DEALER]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      [UserRole.USER]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    };

    const labels = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.MULTI_DEALER]: 'Multi-Dealer',
      [UserRole.USER]: 'User',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Dealer Access
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
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No users found. Create your first user to get started.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {user.role === UserRole.SUPER_ADMIN ? (
                        <span className="text-gray-500 dark:text-gray-400 italic">All dealers</span>
                      ) : user.dealers.length === 0 ? (
                        <span className="text-gray-500 dark:text-gray-400">No access</span>
                      ) : user.dealers.length === 1 ? (
                        user.dealers[0].name
                      ) : (
                        <div className="flex flex-col">
                          <span>{user.dealers[0].name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{user.dealers.length - 1} more
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user.id)}
                      className={`${
                        deleteConfirm === user.id
                          ? 'text-red-600 dark:text-red-400 font-semibold'
                          : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                      }`}
                    >
                      {deleteConfirm === user.id ? 'Confirm?' : 'Delete'}
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


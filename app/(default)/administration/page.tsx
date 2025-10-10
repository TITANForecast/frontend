"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider-multitenancy';
import { UserRole } from '@/lib/types/auth';
import { DealerExtended, UserExtended } from '@/lib/types/admin';
import DealerListTable from '@/components/admin/dealer-list-table';
import DealerFormModal from '@/components/admin/dealer-form-modal';
import UserListTable from '@/components/admin/user-list-table';
import UserFormModal from '@/components/admin/user-form-modal';
import SyncStatusDashboard from '@/components/admin/sync-status-dashboard';

type ActiveTab = 'dashboard' | 'dealers' | 'users';

export default function AdministrationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dealers, setDealers] = useState<DealerExtended[]>([]);
  const [users, setUsers] = useState<UserExtended[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<DealerExtended | undefined>();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserExtended | undefined>();

  // Check if user is super admin
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealersRes, usersRes] = await Promise.all([
        fetch('/api/admin/dealers'),
        fetch('/api/admin/users'),
      ]);

      if (dealersRes.ok) {
        const dealersData = await dealersRes.json();
        setDealers(dealersData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDealer = () => {
    setSelectedDealer(undefined);
    setDealerModalOpen(true);
  };

  const handleEditDealer = (dealer: DealerExtended) => {
    setSelectedDealer(dealer);
    setDealerModalOpen(true);
  };

  const handleDeleteDealer = async (dealerId: string) => {
    try {
      const response = await fetch(`/api/admin/dealers/${dealerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert(`Failed to delete dealer: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting dealer:', error);
      alert('Failed to delete dealer');
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setUserModalOpen(true);
  };

  const handleEditUser = (user: UserExtended) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert(`Failed to delete user: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Show unauthorized message for non-super-admins
  if (!isSuperAdmin) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Access Restricted
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  This page is only accessible to Super Administrators. Please contact your system administrator if you need access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          Administration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage dealers, users, and system configuration
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('dealers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dealers'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Dealers
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {dealers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Users
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {users.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      )}

      {/* Dashboard Tab */}
      {!loading && activeTab === 'dashboard' && (
        <div>
          <SyncStatusDashboard />
        </div>
      )}

      {/* Dealers Tab */}
      {!loading && activeTab === 'dealers' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Dealer Management
            </h2>
            <button
              onClick={handleCreateDealer}
              className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <svg
                className="fill-current shrink-0 mr-2"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
              </svg>
              <span>Create Dealer</span>
            </button>
          </div>
          <DealerListTable
            dealers={dealers}
            onEdit={handleEditDealer}
            onDelete={handleDeleteDealer}
          />
        </div>
      )}

      {/* Users Tab */}
      {!loading && activeTab === 'users' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              User Management
            </h2>
            <button
              onClick={handleCreateUser}
              className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <svg
                className="fill-current shrink-0 mr-2"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
              </svg>
              <span>Create User</span>
            </button>
          </div>
          <UserListTable
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        </div>
      )}

      {/* Modals */}
      <DealerFormModal
        isOpen={dealerModalOpen}
        setIsOpen={setDealerModalOpen}
        dealer={selectedDealer}
        onSave={fetchData}
      />

      <UserFormModal
        isOpen={userModalOpen}
        setIsOpen={setUserModalOpen}
        user={selectedUser}
        dealers={dealers}
        onSave={fetchData}
      />
    </div>
  );
}


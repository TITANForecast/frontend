"use client";

import { useState, useEffect } from 'react';
import ModalBlank from '@/components/modal-blank';
import { UserExtended, UserInput, DealerExtended } from '@/lib/types/admin';
import { UserRole } from '@/lib/types/auth';
import { authenticatedFetch } from '@/lib/utils/api';

interface UserFormModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  user?: UserExtended;
  dealers: DealerExtended[];
  onSave: () => void;
  getAuthToken: () => Promise<string | null>;
}

export default function UserFormModal({
  isOpen,
  setIsOpen,
  user,
  dealers,
  onSave,
  getAuthToken,
}: UserFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userForm, setUserForm] = useState<UserInput>({
    email: '',
    name: '',
    password: '',
    role: UserRole.USER,
    defaultDealerId: '',
    isActive: true,
    dealerIds: [],
  });

  useEffect(() => {
    if (user) {
      setUserForm({
        email: user.email,
        name: user.name,
        password: '', // Don't populate password for existing users
        role: user.role,
        defaultDealerId: user.defaultDealerId,
        isActive: user.isActive,
        dealerIds: user.dealers.map(d => d.id),
      });
    } else {
      // Reset form for new user
      setUserForm({
        email: '',
        name: '',
        password: '',
        role: UserRole.USER,
        defaultDealerId: dealers.length > 0 ? dealers[0].id : '',
        isActive: true,
        dealerIds: dealers.length > 0 ? [dealers[0].id] : [],
      });
    }
  }, [user, dealers]);

  const handleSaveUser = async () => {
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!userForm.email || !userForm.name || !userForm.defaultDealerId) {
        throw new Error('Please fill in all required fields');
      }

      if (!user && !userForm.password) {
        throw new Error('Password is required for new users');
      }

      // Ensure default dealer is in dealer list
      if (!userForm.dealerIds?.includes(userForm.defaultDealerId)) {
        setUserForm({
          ...userForm,
          dealerIds: [...(userForm.dealerIds || []), userForm.defaultDealerId],
        });
      }

      const response = await authenticatedFetch(
        user ? `/api/admin/users/${user.id}` : '/api/admin/users',
        getAuthToken,
        {
          method: user ? 'PATCH' : 'POST',
          body: JSON.stringify(userForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user');
      }

      onSave();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDealerToggle = (dealerId: string) => {
    const currentDealerIds = userForm.dealerIds || [];
    if (currentDealerIds.includes(dealerId)) {
      // Don't allow removing if it's the default dealer
      if (dealerId === userForm.defaultDealerId) {
        setError('Cannot remove default dealer from access list');
        return;
      }
      setUserForm({
        ...userForm,
        dealerIds: currentDealerIds.filter(id => id !== dealerId),
      });
    } else {
      setUserForm({
        ...userForm,
        dealerIds: [...currentDealerIds, dealerId],
      });
    }
  };

  return (
    <ModalBlank isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              className="form-input w-full"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              className="form-input w-full"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                className="form-input w-full"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                User will receive an email to set their password in production
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role *
            </label>
            <select
              className="form-select w-full"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
            >
              <option value={UserRole.USER}>User</option>
              <option value={UserRole.MULTI_DEALER}>Multi-Dealer</option>
              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {userForm.role === UserRole.SUPER_ADMIN && 'Full access to all dealers and admin panel'}
              {userForm.role === UserRole.MULTI_DEALER && 'Access to multiple assigned dealers'}
              {userForm.role === UserRole.USER && 'Access to single assigned dealer only'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Dealer *
            </label>
            <select
              className="form-select w-full"
              value={userForm.defaultDealerId}
              onChange={(e) => {
                const newDefaultId = e.target.value;
                setUserForm({
                  ...userForm,
                  defaultDealerId: newDefaultId,
                  dealerIds: (userForm.dealerIds || []).includes(newDefaultId)
                    ? userForm.dealerIds
                    : [...(userForm.dealerIds || []), newDefaultId],
                });
              }}
            >
              <option value="">Select a dealer</option>
              {dealers.map(dealer => (
                <option key={dealer.id} value={dealer.id}>
                  {dealer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dealer Access
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-3">
              {dealers.map(dealer => (
                <div key={dealer.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`dealer-${dealer.id}`}
                    className="form-checkbox"
                    checked={userForm.dealerIds?.includes(dealer.id) || false}
                    onChange={() => handleDealerToggle(dealer.id)}
                    disabled={dealer.id === userForm.defaultDealerId}
                  />
                  <label
                    htmlFor={`dealer-${dealer.id}`}
                    className={`ml-2 text-sm ${
                      dealer.id === userForm.defaultDealerId
                        ? 'text-gray-900 dark:text-gray-100 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {dealer.name}
                    {dealer.id === userForm.defaultDealerId && ' (Default)'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="user-active"
              className="form-checkbox"
              checked={userForm.isActive}
              onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
            />
            <label htmlFor="user-active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
            onClick={handleSaveUser}
            disabled={loading || !userForm.email || !userForm.name}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </ModalBlank>
  );
}


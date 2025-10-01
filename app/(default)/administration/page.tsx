"use client";

import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/types/auth';
import { useAuth } from '@/components/auth-provider-multitenancy';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

interface UserWithDealers {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  defaultDealerId: string;
  dealers: { id: string; name: string; }[];
  isActive: boolean;
  createdAt: string;
}

interface Dealer {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  isActive: boolean;
}

export default function AdministrationPage() {
  const { user, token, hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithDealers[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateDealerModal, setShowCreateDealerModal] = useState(false);

  // Form state for new user
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: UserRole.USER,
    defaultDealerId: '',
    dealerIds: [] as string[],
  });

  // Form state for new dealer
  const [newDealer, setNewDealer] = useState({
    name: '',
    address: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    // Check if user is super admin
    if (!hasRole([UserRole.SUPER_ADMIN])) {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [hasRole, router, token]);

  const loadData = async () => {
    if (!token) return;

    try {
      // Load users
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
      }

      // Load dealers
      const dealersResponse = await fetch('/api/admin/dealers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (dealersResponse.ok) {
        const dealersData = await dealersResponse.json();
        setDealers(dealersData.dealers);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('User created successfully!');
        setShowCreateUserModal(false);
        setNewUser({
          email: '',
          name: '',
          password: '',
          role: UserRole.USER,
          defaultDealerId: '',
          dealerIds: [],
        });
        loadData();
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  };

  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    try {
      const response = await fetch('/api/admin/dealers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newDealer),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Dealer created successfully!');
        setShowCreateDealerModal(false);
        setNewDealer({
          name: '',
          address: '',
          phone: '',
          city: '',
          state: '',
          zip: '',
        });
        loadData();
      } else {
        alert(data.message || 'Failed to create dealer');
      }
    } catch (error) {
      console.error('Failed to create dealer:', error);
      alert('Failed to create dealer');
    }
  };

  const toggleDealerSelection = (dealerId: string) => {
    setNewUser(prev => ({
      ...prev,
      dealerIds: prev.dealerIds.includes(dealerId)
        ? prev.dealerIds.filter(id => id !== dealerId)
        : [...prev.dealerIds, dealerId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Administration</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage users, dealerships, and system settings
        </p>
      </div>

      {/* Dealers Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dealerships</h2>
          <button
            onClick={() => setShowCreateDealerModal(true)}
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            <Plus size={16} className="mr-2" />
            Add Dealer
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700/60">
          <div className="overflow-x-auto">
            <table className="table-auto w-full dark:text-gray-300">
              <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700/60">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-200 dark:divide-gray-700/60">
                {dealers.map((dealer) => (
                  <tr key={dealer.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Building2 size={16} className="text-gray-400 mr-2" />
                        <span className="font-medium text-gray-800 dark:text-gray-100">{dealer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {dealer.city && dealer.state ? `${dealer.city}, ${dealer.state}` : '-'}
                    </td>
                    <td className="px-4 py-3">{dealer.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${dealer.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {dealer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">User Management</h2>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            <Plus size={16} className="mr-2" />
            Add User
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700/60">
          <div className="overflow-x-auto">
            <table className="table-auto w-full dark:text-gray-300">
              <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700/60">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Dealerships</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-200 dark:divide-gray-700/60">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{user.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-700 dark:text-gray-300">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 dark:text-gray-400">
                        {user.dealers.length} dealer{user.dealers.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="form-select w-full"
                  required
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.MULTI_DEALER}>Multi-Dealer</option>
                  <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign Dealerships
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {dealers.map((dealer) => (
                    <label key={dealer.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUser.dealerIds.includes(dealer.id)}
                        onChange={() => toggleDealerSelection(dealer.id)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{dealer.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {newUser.dealerIds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Dealership
                  </label>
                  <select
                    value={newUser.defaultDealerId}
                    onChange={(e) => setNewUser({ ...newUser, defaultDealerId: e.target.value })}
                    className="form-select w-full"
                    required
                  >
                    <option value="">Select default dealer</option>
                    {dealers
                      .filter((d) => newUser.dealerIds.includes(d.id))
                      .map((dealer) => (
                        <option key={dealer.id} value={dealer.id}>
                          {dealer.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="btn bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-violet-500 hover:bg-violet-600 text-white"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Dealer Modal */}
      {showCreateDealerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Create New Dealer</h2>
            <form onSubmit={handleCreateDealer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dealer Name *
                </label>
                <input
                  type="text"
                  value={newDealer.name}
                  onChange={(e) => setNewDealer({ ...newDealer, name: e.target.value })}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newDealer.address}
                  onChange={(e) => setNewDealer({ ...newDealer, address: e.target.value })}
                  className="form-input w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newDealer.city}
                    onChange={(e) => setNewDealer({ ...newDealer, city: e.target.value })}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={newDealer.state}
                    onChange={(e) => setNewDealer({ ...newDealer, state: e.target.value })}
                    className="form-input w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={newDealer.zip}
                    onChange={(e) => setNewDealer({ ...newDealer, zip: e.target.value })}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newDealer.phone}
                    onChange={(e) => setNewDealer({ ...newDealer, phone: e.target.value })}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateDealerModal(false)}
                  className="btn bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-violet-500 hover:bg-violet-600 text-white"
                >
                  Create Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

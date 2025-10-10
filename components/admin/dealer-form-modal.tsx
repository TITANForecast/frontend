"use client";

import { useState, useEffect } from 'react';
import ModalBlank from '@/components/modal-blank';
import { DealerExtended, DealerInput, DealerApiConfigInput } from '@/lib/types/admin';

interface DealerFormModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  dealer?: DealerExtended;
  onSave: () => void;
}

export default function DealerFormModal({
  isOpen,
  setIsOpen,
  dealer,
  onSave,
}: DealerFormModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'api'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dealer info form state
  const [dealerForm, setDealerForm] = useState<DealerInput>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
  });

  // API config form state
  const [apiForm, setApiForm] = useState<DealerApiConfigInput>({
    dealerShortCode: '',
    programId: '',
    subscriptionKey: '',
    xUserEmail: '',
    deliveryEndpoint: 'https://authenticom.azure-api.net/dv-delivery/v1/delivery',
    jwtTokenUrl: 'https://authenticom.azure-api.net/dv-delivery/v1/token',
    fileTypeCode: 'SV',
    compareDateDefault: 1,
    isActive: true,
  });

  useEffect(() => {
    if (dealer) {
      setDealerForm({
        name: dealer.name,
        address: dealer.address || '',
        city: dealer.city || '',
        state: dealer.state || '',
        zip: dealer.zip || '',
        contactEmail: dealer.contactEmail || '',
        contactPhone: dealer.contactPhone || '',
        isActive: dealer.isActive,
      });

      if (dealer.apiConfig) {
        setApiForm({
          dealerShortCode: dealer.apiConfig.dealerShortCode,
          programId: dealer.apiConfig.programId,
          subscriptionKey: dealer.apiConfig.subscriptionKey,
          xUserEmail: dealer.apiConfig.xUserEmail,
          deliveryEndpoint: dealer.apiConfig.deliveryEndpoint,
          jwtTokenUrl: dealer.apiConfig.jwtTokenUrl,
          fileTypeCode: dealer.apiConfig.fileTypeCode,
          compareDateDefault: dealer.apiConfig.compareDateDefault,
          isActive: dealer.apiConfig.isActive,
        });
      }
    } else {
      // Reset form for new dealer
      setDealerForm({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        contactEmail: '',
        contactPhone: '',
        isActive: true,
      });
      setApiForm({
        dealerShortCode: '',
        programId: '',
        subscriptionKey: '',
        xUserEmail: '',
        deliveryEndpoint: 'https://authenticom.azure-api.net/dv-delivery/v1/delivery',
        jwtTokenUrl: 'https://authenticom.azure-api.net/dv-delivery/v1/token',
        fileTypeCode: 'SV',
        compareDateDefault: 1,
        isActive: true,
      });
    }
  }, [dealer]);

  const handleSaveDealer = async () => {
    setLoading(true);
    setError('');

    try {
      // Save dealer info
      const dealerResponse = await fetch(
        dealer ? `/api/admin/dealers/${dealer.id}` : '/api/admin/dealers',
        {
          method: dealer ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dealerForm),
        }
      );

      if (!dealerResponse.ok) {
        const errorData = await dealerResponse.json();
        throw new Error(errorData.error || 'Failed to save dealer');
      }

      const savedDealer = await dealerResponse.json();

      // Save API config if on API tab and dealer is saved
      if (activeTab === 'api' && savedDealer.id) {
        const configResponse = await fetch(`/api/admin/dealers/${savedDealer.id}/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiForm),
        });

        if (!configResponse.ok) {
          const errorData = await configResponse.json();
          throw new Error(errorData.error || 'Failed to save API config');
        }
      }

      onSave();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBlank isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {dealer ? 'Edit Dealer' : 'Create New Dealer'}
          </h2>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8">
            <button
              className={`py-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'info'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('info')}
            >
              Dealer Info
            </button>
            {dealer && (
              <button
                className={`py-2 px-1 font-medium text-sm border-b-2 ${
                  activeTab === 'api'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
                onClick={() => setActiveTab('api')}
              >
                API Configuration
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        {/* Dealer Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dealer Name *
              </label>
              <input
                type="text"
                className="form-input w-full"
                value={dealerForm.name}
                onChange={(e) => setDealerForm({ ...dealerForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                className="form-input w-full"
                value={dealerForm.address}
                onChange={(e) => setDealerForm({ ...dealerForm, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={dealerForm.city}
                  onChange={(e) => setDealerForm({ ...dealerForm, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={dealerForm.state}
                  onChange={(e) => setDealerForm({ ...dealerForm, state: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                className="form-input w-full"
                value={dealerForm.zip}
                onChange={(e) => setDealerForm({ ...dealerForm, zip: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                className="form-input w-full"
                value={dealerForm.contactEmail}
                onChange={(e) => setDealerForm({ ...dealerForm, contactEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                className="form-input w-full"
                value={dealerForm.contactPhone}
                onChange={(e) => setDealerForm({ ...dealerForm, contactPhone: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="dealer-active"
                className="form-checkbox"
                checked={dealerForm.isActive}
                onChange={(e) => setDealerForm({ ...dealerForm, isActive: e.target.checked })}
              />
              <label htmlFor="dealer-active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </div>
        )}

        {/* API Configuration Tab */}
        {activeTab === 'api' && dealer && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dealer Short Code *
              </label>
              <input
                type="text"
                className="form-input w-full"
                value={apiForm.dealerShortCode}
                onChange={(e) => setApiForm({ ...apiForm, dealerShortCode: e.target.value })}
                placeholder="e.g., TM001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Program ID *
              </label>
              <input
                type="text"
                className="form-input w-full"
                value={apiForm.programId}
                onChange={(e) => setApiForm({ ...apiForm, programId: e.target.value })}
                placeholder="Vendor program ID from Authenticom"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subscription Key *
              </label>
              <input
                type="password"
                className="form-input w-full"
                value={apiForm.subscriptionKey}
                onChange={(e) => setApiForm({ ...apiForm, subscriptionKey: e.target.value })}
                placeholder="Ocp-Apim-Subscription-Key"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API User Email *
              </label>
              <input
                type="email"
                className="form-input w-full"
                value={apiForm.xUserEmail}
                onChange={(e) => setApiForm({ ...apiForm, xUserEmail: e.target.value })}
                placeholder="Registered API user email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Endpoint
              </label>
              <input
                type="url"
                className="form-input w-full"
                value={apiForm.deliveryEndpoint}
                onChange={(e) => setApiForm({ ...apiForm, deliveryEndpoint: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                JWT Token URL
              </label>
              <input
                type="url"
                className="form-input w-full"
                value={apiForm.jwtTokenUrl}
                onChange={(e) => setApiForm({ ...apiForm, jwtTokenUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File Type Code
              </label>
              <input
                type="text"
                className="form-input w-full bg-gray-100 dark:bg-gray-700"
                value={apiForm.fileTypeCode}
                readOnly
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fixed to &quot;SV&quot; for Service data
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Compare Date Default (Days)
              </label>
              <input
                type="number"
                className="form-input w-full"
                value={apiForm.compareDateDefault}
                onChange={(e) => setApiForm({ ...apiForm, compareDateDefault: parseInt(e.target.value) })}
                min="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Days to subtract from current date for nightly updates
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="api-active"
                className="form-checkbox"
                checked={apiForm.isActive}
                onChange={(e) => setApiForm({ ...apiForm, isActive: e.target.checked })}
              />
              <label htmlFor="api-active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </div>
        )}

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
            onClick={handleSaveDealer}
            disabled={loading || !dealerForm.name}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </ModalBlank>
  );
}


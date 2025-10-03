'use client'

import { Fragment } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { Building2, Check } from 'lucide-react'
import { useAuth } from './auth-provider-multitenancy'

export default function DealerDropdown({ align }: { align?: 'left' | 'right' }) {
  const { user, currentDealer, switchDealer } = useAuth();

  if (!user || !user.dealers || user.dealers.length <= 1) {
    // Don't show dropdown if user has only one dealer
    return currentDealer ? (
      <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Building2 size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentDealer.name}
        </span>
      </div>
    ) : null;
  }

  const handleSwitchDealer = async (dealerId: string) => {
    if (dealerId === currentDealer?.id) return;
    
    try {
      await switchDealer(dealerId);
    } catch (error: any) {
      console.error('Failed to switch dealer:', error);
      alert(error.message || 'Failed to switch dealer');
    }
  };

  return (
    <Menu as="div" className="relative inline-flex">
      <MenuButton className="inline-flex justify-center items-center group px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <Building2 size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
          {currentDealer?.name || 'Select Dealer'}
        </span>
        <svg className="w-3 h-3 shrink-0 fill-current text-gray-400 dark:text-gray-500" viewBox="0 0 12 12">
          <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
        </svg>
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <MenuItems
          className={`origin-top-right z-10 absolute top-full min-w-[14rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="pt-0.5 pb-2 px-3 mb-1 border-b border-gray-200 dark:border-gray-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
              Switch Dealership
            </div>
          </div>
          {user.dealers.map((dealer) => (
            <MenuItem key={dealer.id}>
              {({ active }) => (
                <button
                  onClick={() => handleSwitchDealer(dealer.id)}
                  className={`w-full text-left flex items-center justify-between py-2 px-3 text-sm ${
                    active ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                  } ${
                    currentDealer?.id === dealer.id
                      ? 'text-violet-500 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{dealer.name}</span>
                    {dealer.city && dealer.state && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {dealer.city}, {dealer.state}
                      </span>
                    )}
                  </div>
                  {currentDealer?.id === dealer.id && (
                    <Check size={16} className="text-violet-500" />
                  )}
                </button>
              )}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  )
}

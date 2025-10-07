"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider-multitenancy";
import { ChevronDownIcon } from "lucide-react";

export default function DealerDropdown() {
  const { user, currentDealer, switchDealer } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !currentDealer) {
    return null;
  }

  const handleDealerSwitch = async (dealerId: string) => {
    try {
      await switchDealer(dealerId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch dealer:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>{currentDealer.name}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {user.dealers.map((dealer) => (
              <button
                key={dealer.id}
                onClick={() => handleDealerSwitch(dealer.id)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  dealer.id === currentDealer.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="font-medium">{dealer.name}</div>
                {dealer.address && (
                  <div className="text-xs text-gray-500">{dealer.address}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AccountImage from "/public/images/user-avatar-80.png";
import { useAuth } from "@/components/auth-provider-multitenancy";

export default function AccountPanel() {
  const [sync, setSync] = useState<boolean>(false);
  const { user, updateDefaultDealer } = useAuth();
  const [selectedDealerId, setSelectedDealerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (user?.defaultDealerId) {
      setSelectedDealerId(user.defaultDealerId);
    }
  }, [user]);

  const handleSaveDefaultDealer = async () => {
    if (!selectedDealerId || selectedDealerId === user?.defaultDealerId) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateDefaultDealer(selectedDealerId);
      setSaveMessage({
        type: "success",
        message: "Default dealership updated successfully!",
      });

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update default dealer:", error);
      setSaveMessage({
        type: "error",
        message: "Failed to update default dealership. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grow">
      {/* Panel body */}
      <div className="p-6 space-y-6">
        <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-5">
          My Account
        </h2>
        {/* Picture */}
        <section>
          <div className="flex items-center">
            <div className="mr-4">
              <Image
                className="w-20 h-20 rounded-full"
                src={AccountImage}
                width={80}
                height={80}
                alt="User upload"
              />
            </div>
            <button className="btn-sm dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">
              Change
            </button>
          </div>
        </section>
        {/* Default Dealership */}
        {user && user.dealers && user.dealers.length > 1 && (
          <section>
            <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">
              Default Dealership
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select your default dealership. This will be the dealership you
              see when you first log in.
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[250px]">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="default-dealer"
                >
                  Dealership
                </label>
                <select
                  id="default-dealer"
                  className="form-select w-full"
                  value={selectedDealerId}
                  onChange={(e) => setSelectedDealerId(e.target.value)}
                  disabled={isSaving}
                >
                  {user.dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.name}{" "}
                      {dealer.city && dealer.state
                        ? `- ${dealer.city}, ${dealer.state}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveDefaultDealer}
                disabled={isSaving || selectedDealerId === user.defaultDealerId}
                className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Default"}
              </button>
            </div>
            {saveMessage && (
              <div
                className={`mt-2 text-sm ${
                  saveMessage.type === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {saveMessage.message}
              </div>
            )}
          </section>
        )}
        {/* Business Profile */}
        <section>
          <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">
            Business Profile
          </h2>
          <div className="text-sm">
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
            officia deserunt mollit.
          </div>
          <div className="sm:flex sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-5">
            <div className="sm:w-1/3">
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Business Name
              </label>
              <input id="name" className="form-input w-full" type="text" />
            </div>
            <div className="sm:w-1/3">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="business-id"
              >
                Business ID
              </label>
              <input
                id="business-id"
                className="form-input w-full"
                type="text"
              />
            </div>
            <div className="sm:w-1/3">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="location"
              >
                Location
              </label>
              <input id="location" className="form-input w-full" type="text" />
            </div>
          </div>
        </section>
        {/* Email */}
        <section>
          <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">
            Email
          </h2>
          <div className="text-sm">
            Excepteur sint occaecat cupidatat non proident sunt in culpa qui
            officia.
          </div>
          <div className="flex flex-wrap mt-5">
            <div className="mr-2">
              <label className="sr-only" htmlFor="email">
                Business email
              </label>
              <input id="email" className="form-input" type="email" />
            </div>
            <button className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">
              Change
            </button>
          </div>
        </section>
        {/* Password */}
        <section>
          <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">
            Password
          </h2>
          <div className="text-sm">
            You can set a permanent password if you don't want to use temporary
            login codes.
          </div>
          <div className="mt-5">
            <button className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">
              Set New Password
            </button>
          </div>
        </section>
        {/* Smart Sync */}
        <section>
          <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">
            Smart Sync update for Mac
          </h2>
          <div className="text-sm">
            With this update, online-only files will no longer appear to take up
            hard drive space.
          </div>
          <div className="flex items-center mt-5">
            <div className="form-switch">
              <input
                type="checkbox"
                id="toggle"
                className="sr-only"
                checked={sync}
                onChange={() => setSync(!sync)}
              />
              <label htmlFor="toggle">
                <span className="bg-white shadow-sm" aria-hidden="true"></span>
                <span className="sr-only">Enable smart sync</span>
              </label>
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500 italic ml-2">
              {sync ? "On" : "Off"}
            </div>
          </div>
        </section>
      </div>
      {/* Panel footer */}
      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex self-end">
            <button className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">
              Cancel
            </button>
            <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-3">
              Save Changes
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

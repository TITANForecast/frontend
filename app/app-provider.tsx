"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
  useEffect,
} from "react";
import { initializeAgChartsLicense } from "@/lib/ag-charts-license";

interface ContextProps {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarExpanded: boolean;
  setSidebarExpanded: Dispatch<SetStateAction<boolean>>;
  agChartsLicenseLoaded: boolean;
}

const AppContext = createContext<ContextProps>({
  sidebarOpen: false,
  setSidebarOpen: (): boolean => false,
  sidebarExpanded: false,
  setSidebarExpanded: (): boolean => false,
  agChartsLicenseLoaded: false,
});

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [agChartsLicenseLoaded, setAgChartsLicenseLoaded] =
    useState<boolean>(false);

  // Initialize AG Charts license once when the platform loads
  useEffect(() => {
    initializeAgChartsLicense()
      .then(() => {
        setAgChartsLicenseLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load AG Charts license:", error);
        // Still set to true to allow charts to render (they'll work without enterprise features)
        setAgChartsLicenseLoaded(true);
      });
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        sidebarExpanded,
        setSidebarExpanded,
        agChartsLicenseLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppProvider = () => useContext(AppContext);

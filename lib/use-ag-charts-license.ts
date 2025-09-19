import { useAppProvider } from "@/app/app-provider";
import React from "react";

/**
 * Hook to check if AG Charts license is loaded
 * @returns boolean indicating if the license is loaded
 */
export const useAgChartsLicense = (): boolean => {
  const { agChartsLicenseLoaded } = useAppProvider();
  return agChartsLicenseLoaded;
};

/**
 * Hook that provides loading state for AG Charts components
 * @returns object with license loaded state and loading component
 */
export const useAgChartsLoading = () => {
  const isLicenseLoaded = useAgChartsLicense();

  const LoadingComponent = ({
    height = "350px",
    message = "Loading chart...",
  }: {
    height?: string;
    message?: string;
  }) => {
    return React.createElement(
      "div",
      {
        className:
          "flex items-center justify-center text-gray-500 dark:text-gray-400",
        style: { height },
      },
      React.createElement(
        "div",
        {
          className: "text-center",
        },
        React.createElement("div", {
          className:
            "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2",
        }),
        React.createElement(
          "p",
          {
            className: "text-sm",
          },
          message
        )
      )
    );
  };

  return {
    isLicenseLoaded,
    LoadingComponent,
  };
};

import { AgCharts } from "ag-charts-community";
import { LicenseManager } from "ag-charts-enterprise";

// Set the AG Charts Enterprise license key as one continuous string
const LICENSE_KEY =
  "Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-103747}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{TITAN_FORECAST}_is_granted_a_{Single_Application}_Developer_License_for_the_application_{TITAN_FORECAST}_only_for_{1}_Front-End_JavaScript_developer___All_Front-End_JavaScript_developers_working_on_{TITAN_FORECAST}_need_to_be_licensed___{TITAN_FORECAST}_has_been_granted_a_Deployment_License_Add-on_for_{1}_Production_Environment___This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{18_September_2026}____[v3]_[0102]_MTc4OTY4NjAwMDAwMA==11992e5f5480b47172d3e5be05ac6a02";

// Track if license has been initialized to prevent multiple initializations
let isLicenseInitialized = false;
let licensePromise: Promise<void> | null = null;

export const initializeAgChartsLicense = (): Promise<void> => {
  // Return existing promise if already initialized or initializing
  if (licensePromise) {
    return licensePromise;
  }

  // Only initialize once
  if (isLicenseInitialized) {
    return Promise.resolve();
  }

  licensePromise = new Promise((resolve, reject) => {
    try {
      LicenseManager.setLicenseKey(LICENSE_KEY);
      isLicenseInitialized = true;
      console.log("AG Charts Enterprise license set successfully");
      resolve();
    } catch (error) {
      console.error("Failed to set AG Charts license:", error);
      reject(error);
    }
  });

  return licensePromise;
};

export const isAgChartsLicenseLoaded = (): boolean => {
  return isLicenseInitialized;
};

export { AgCharts };

// Database types for administration

import { UserRole } from './auth';

export interface DealerApiConfig {
  id: string;
  dealerId: string;
  dealerShortCode: string;
  programId: string;
  subscriptionKey: string; // Encrypted
  xUserEmail: string;
  deliveryEndpoint: string;
  jwtTokenUrl: string;
  fileTypeCode: string; // Fixed to "SV" for Service
  compareDateDefault: number; // Days to subtract from current date
  lastSuccess: Date | null;
  lastError: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealerApiConfigInput {
  dealerShortCode: string;
  programId: string;
  subscriptionKey: string;
  xUserEmail: string;
  deliveryEndpoint?: string;
  jwtTokenUrl?: string;
  fileTypeCode?: string;
  compareDateDefault?: number;
  isActive?: boolean;
}

export interface UserDealer {
  userId: string;
  dealerId: string;
  createdAt: Date;
}

export interface DealerExtended {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  apiConfig?: DealerApiConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealerInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export interface UserExtended {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  defaultDealerId: string;
  isActive: boolean;
  dealers: DealerExtended[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  defaultDealerId: string;
  isActive?: boolean;
  dealerIds?: string[];
}

export interface SyncStatus {
  dealerId: string;
  dealerName: string;
  lastSync: Date | null;
  lastSuccess: Date | null;
  lastError: string | null;
  status: 'success' | 'error' | 'pending' | 'never_run';
  isActive: boolean;
}

export interface AdminStats {
  totalDealers: number;
  activeDealers: number;
  totalUsers: number;
  activeUsers: number;
  lastSyncTimestamp: Date | null;
  syncErrors: number;
}


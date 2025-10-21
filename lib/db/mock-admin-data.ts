/**
 * Mock database for development
 * In production, replace with actual database calls (PostgreSQL, MySQL, etc.)
 */

import { DealerExtended, DealerApiConfig, UserExtended, SyncStatus, AdminStats } from '@/lib/types/admin';
import { UserRole } from '@/lib/types/auth';

// Mock data storage
let mockDealers: DealerExtended[] = [
  {
    id: 'dealer-1',
    name: 'Titan Motors',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    contactEmail: 'contact@titanmotors.com',
    contactPhone: '555-0123',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    apiConfig: {
      id: 'config-1',
      dealerId: 'dealer-1',
      rooftopId: 'TM001',
      programId: 'PROG-123',
      subscriptionKey: 'encrypted_key_123',
      xUserEmail: 'api@titanmotors.com',
      deliveryEndpoint: 'https://authenticom.azure-api.net/dv-delivery/v1/delivery',
      jwtTokenUrl: 'https://authenticom.azure-api.net/dv-delivery/v1/token',
      fileTypeCodes: ['SV'],
      compareDateDefault: 1,
      lastSuccess: new Date('2024-10-07'),
      lastError: null,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-10-07'),
    },
  },
  {
    id: 'dealer-2',
    name: 'AutoPro Dealership',
    address: '456 Oak Ave',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    contactEmail: 'info@autopro.com',
    contactPhone: '555-0456',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

let mockUsers: UserExtended[] = [
  {
    id: 'user-1',
    email: 'admin@titan.com',
    name: 'Admin User',
    role: UserRole.SUPER_ADMIN,
    defaultDealerId: 'dealer-1',
    isActive: true,
    dealers: mockDealers,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    email: 'manager@titanmotors.com',
    name: 'Manager User',
    role: UserRole.MULTI_DEALER,
    defaultDealerId: 'dealer-1',
    isActive: true,
    dealers: [mockDealers[0]],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

let mockUserDealers: { userId: string; dealerId: string }[] = [
  { userId: 'user-1', dealerId: 'dealer-1' },
  { userId: 'user-1', dealerId: 'dealer-2' },
  { userId: 'user-2', dealerId: 'dealer-1' },
];

// Dealer operations
export const mockDb = {
  dealers: {
    findAll: async (): Promise<DealerExtended[]> => {
      return [...mockDealers];
    },

    findById: async (id: string): Promise<DealerExtended | null> => {
      return mockDealers.find(d => d.id === id) || null;
    },

    create: async (data: Omit<DealerExtended, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealerExtended> => {
      const newDealer: DealerExtended = {
        ...data,
        id: `dealer-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDealers.push(newDealer);
      return newDealer;
    },

    update: async (id: string, data: Partial<DealerExtended>): Promise<DealerExtended | null> => {
      const index = mockDealers.findIndex(d => d.id === id);
      if (index === -1) return null;

      mockDealers[index] = {
        ...mockDealers[index],
        ...data,
        updatedAt: new Date(),
      };
      return mockDealers[index];
    },

    delete: async (id: string): Promise<boolean> => {
      const index = mockDealers.findIndex(d => d.id === id);
      if (index === -1) return false;
      mockDealers.splice(index, 1);
      return true;
    },
  },

  apiConfigs: {
    findByDealerId: async (dealerId: string): Promise<DealerApiConfig | null> => {
      const dealer = mockDealers.find(d => d.id === dealerId);
      return dealer?.apiConfig || null;
    },

    create: async (data: Omit<DealerApiConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealerApiConfig> => {
      const newConfig: DealerApiConfig = {
        ...data,
        id: `config-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update dealer with config
      const dealerIndex = mockDealers.findIndex(d => d.id === data.dealerId);
      if (dealerIndex !== -1) {
        mockDealers[dealerIndex].apiConfig = newConfig;
      }

      return newConfig;
    },

    update: async (id: string, data: Partial<DealerApiConfig>): Promise<DealerApiConfig | null> => {
      const dealer = mockDealers.find(d => d.apiConfig?.id === id);
      if (!dealer || !dealer.apiConfig) return null;

      dealer.apiConfig = {
        ...dealer.apiConfig,
        ...data,
        updatedAt: new Date(),
      };
      return dealer.apiConfig;
    },

    delete: async (id: string): Promise<boolean> => {
      const dealer = mockDealers.find(d => d.apiConfig?.id === id);
      if (!dealer) return false;
      dealer.apiConfig = undefined;
      return true;
    },
  },

  users: {
    findAll: async (): Promise<UserExtended[]> => {
      // Populate dealers for each user
      return mockUsers.map(user => ({
        ...user,
        dealers: mockDealers.filter(dealer =>
          mockUserDealers.some(ud => ud.userId === user.id && ud.dealerId === dealer.id)
        ),
      }));
    },

    findById: async (id: string): Promise<UserExtended | null> => {
      const user = mockUsers.find(u => u.id === id);
      if (!user) return null;

      return {
        ...user,
        dealers: mockDealers.filter(dealer =>
          mockUserDealers.some(ud => ud.userId === user.id && ud.dealerId === dealer.id)
        ),
      };
    },

    create: async (data: Omit<UserExtended, 'id' | 'createdAt' | 'updatedAt' | 'dealers'>): Promise<UserExtended> => {
      const newUser: UserExtended = {
        ...data,
        id: `user-${Date.now()}`,
        dealers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);
      return newUser;
    },

    update: async (id: string, data: Partial<UserExtended>): Promise<UserExtended | null> => {
      const index = mockUsers.findIndex(u => u.id === id);
      if (index === -1) return null;

      mockUsers[index] = {
        ...mockUsers[index],
        ...data,
        updatedAt: new Date(),
      };
      return mockUsers[index];
    },

    delete: async (id: string): Promise<boolean> => {
      const index = mockUsers.findIndex(u => u.id === id);
      if (index === -1) return false;
      mockUsers.splice(index, 1);
      // Remove user-dealer associations
      mockUserDealers = mockUserDealers.filter(ud => ud.userId !== id);
      return true;
    },
  },

  userDealers: {
    addUserDealer: async (userId: string, dealerId: string): Promise<void> => {
      if (!mockUserDealers.some(ud => ud.userId === userId && ud.dealerId === dealerId)) {
        mockUserDealers.push({ userId, dealerId });
      }
    },

    removeUserDealer: async (userId: string, dealerId: string): Promise<void> => {
      mockUserDealers = mockUserDealers.filter(
        ud => !(ud.userId === userId && ud.dealerId === dealerId)
      );
    },

    setUserDealers: async (userId: string, dealerIds: string[]): Promise<void> => {
      // Remove all existing associations
      mockUserDealers = mockUserDealers.filter(ud => ud.userId !== userId);
      // Add new associations
      dealerIds.forEach(dealerId => {
        mockUserDealers.push({ userId, dealerId });
      });
    },

    getUserDealers: async (userId: string): Promise<string[]> => {
      return mockUserDealers.filter(ud => ud.userId === userId).map(ud => ud.dealerId);
    },
  },

  stats: {
    getAdminStats: async (): Promise<AdminStats> => {
      const activeDealers = mockDealers.filter(d => d.isActive);
      const activeUsers = mockUsers.filter(u => u.isActive);
      const lastSyncs = mockDealers
        .map(d => d.apiConfig?.lastSuccess)
        .filter(d => d != null) as Date[];
      const syncErrors = mockDealers.filter(d => d.apiConfig?.lastError != null).length;

      return {
        totalDealers: mockDealers.length,
        activeDealers: activeDealers.length,
        totalUsers: mockUsers.length,
        activeUsers: activeUsers.length,
        lastSyncTimestamp: lastSyncs.length > 0 ? new Date(Math.max(...lastSyncs.map(d => d.getTime()))) : null,
        syncErrors,
      };
    },

    getSyncStatus: async (): Promise<SyncStatus[]> => {
      return mockDealers.map(dealer => {
        const config = dealer.apiConfig;
        let status: SyncStatus['status'] = 'never_run';

        if (config) {
          if (config.lastError) {
            status = 'error';
          } else if (config.lastSuccess) {
            status = 'success';
          } else {
            status = 'pending';
          }
        }

        return {
          dealerId: dealer.id,
          dealerName: dealer.name,
          lastSync: config?.lastSuccess || config?.updatedAt || null,
          lastSuccess: config?.lastSuccess || null,
          lastError: config?.lastError || null,
          status,
          isActive: dealer.isActive && (config?.isActive ?? false),
        };
      });
    },
  },
};


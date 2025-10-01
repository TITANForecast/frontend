/**
 * Mock Database Implementation
 * 
 * This is a temporary in-memory database for development and testing.
 * Replace with actual database implementation (PostgreSQL, MySQL, etc.) for production.
 */

import bcrypt from 'bcryptjs';
import { Dealer, User, UserDealer, UserRole } from '@/lib/types/auth';

// In-memory storage
const dealers = new Map<string, Dealer>();
const users = new Map<string, User>();
const userDealers = new Map<string, UserDealer>();

// Initialize with sample data
export function initializeMockData() {
  // Create sample dealers
  const dealer1: Dealer = {
    id: 'dealer-1',
    name: 'Downtown Auto Group',
    address: '123 Main St',
    phone: '(555) 123-4567',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dealer2: Dealer = {
    id: 'dealer-2',
    name: 'Northside Motors',
    address: '456 Oak Ave',
    phone: '(555) 234-5678',
    city: 'Boston',
    state: 'MA',
    zip: '02108',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dealer3: Dealer = {
    id: 'dealer-3',
    name: 'Westside Dealership',
    address: '789 Elm St',
    phone: '(555) 345-6789',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90001',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dealers.set(dealer1.id, dealer1);
  dealers.set(dealer2.id, dealer2);
  dealers.set(dealer3.id, dealer3);

  // Create sample users (passwords are hashed - all use 'password123' for testing)
  const passwordHash = bcrypt.hashSync('Password123!@#', 10);

  const superAdmin: User = {
    id: 'user-1',
    email: 'talk2mwalter@gmail.com',
    name: 'Michael Walters',
    passwordHash,
    defaultDealerId: dealer1.id,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const multiDealerUser: User = {
    id: 'user-2',
    email: 'multidealer@example.com',
    name: 'Multi Dealer Manager',
    passwordHash,
    defaultDealerId: dealer1.id,
    role: UserRole.MULTI_DEALER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const regularUser: User = {
    id: 'user-3',
    email: 'user@example.com',
    name: 'Regular User',
    passwordHash,
    defaultDealerId: dealer2.id,
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.set(superAdmin.id, superAdmin);
  users.set(multiDealerUser.id, multiDealerUser);
  users.set(regularUser.id, regularUser);

  // Create user-dealer associations
  // Super admin has access to all dealers
  const ud1: UserDealer = {
    id: 'ud-1',
    userId: superAdmin.id,
    dealerId: dealer1.id,
    assignedAt: new Date(),
  };
  const ud2: UserDealer = {
    id: 'ud-2',
    userId: superAdmin.id,
    dealerId: dealer2.id,
    assignedAt: new Date(),
  };
  const ud3: UserDealer = {
    id: 'ud-3',
    userId: superAdmin.id,
    dealerId: dealer3.id,
    assignedAt: new Date(),
  };

  // Multi-dealer user has access to two dealers
  const ud4: UserDealer = {
    id: 'ud-4',
    userId: multiDealerUser.id,
    dealerId: dealer1.id,
    assignedAt: new Date(),
  };
  const ud5: UserDealer = {
    id: 'ud-5',
    userId: multiDealerUser.id,
    dealerId: dealer2.id,
    assignedAt: new Date(),
  };

  // Regular user has access to one dealer
  const ud6: UserDealer = {
    id: 'ud-6',
    userId: regularUser.id,
    dealerId: dealer2.id,
    assignedAt: new Date(),
  };

  userDealers.set(ud1.id, ud1);
  userDealers.set(ud2.id, ud2);
  userDealers.set(ud3.id, ud3);
  userDealers.set(ud4.id, ud4);
  userDealers.set(ud5.id, ud5);
  userDealers.set(ud6.id, ud6);
}

// Initialize data on module load
initializeMockData();

// Database operations
export const db = {
  // Dealer operations
  dealers: {
    findAll: async (): Promise<Dealer[]> => {
      return Array.from(dealers.values()).filter(d => d.isActive);
    },
    
    findById: async (id: string): Promise<Dealer | null> => {
      return dealers.get(id) || null;
    },
    
    create: async (dealer: Omit<Dealer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dealer> => {
      const newDealer: Dealer = {
        ...dealer,
        id: `dealer-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dealers.set(newDealer.id, newDealer);
      return newDealer;
    },
    
    update: async (id: string, updates: Partial<Dealer>): Promise<Dealer | null> => {
      const dealer = dealers.get(id);
      if (!dealer) return null;
      
      const updated = { ...dealer, ...updates, updatedAt: new Date() };
      dealers.set(id, updated);
      return updated;
    },
  },

  // User operations
  users: {
    findAll: async (): Promise<User[]> => {
      return Array.from(users.values());
    },
    
    findById: async (id: string): Promise<User | null> => {
      return users.get(id) || null;
    },
    
    findByEmail: async (email: string): Promise<User | null> => {
      return Array.from(users.values()).find(u => u.email === email) || null;
    },
    
    create: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
      const newUser: User = {
        ...user,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.set(newUser.id, newUser);
      return newUser;
    },
    
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      const user = users.get(id);
      if (!user) return null;
      
      const updated = { ...user, ...updates, updatedAt: new Date() };
      users.set(id, updated);
      return updated;
    },
  },

  // UserDealer operations
  userDealers: {
    findByUserId: async (userId: string): Promise<UserDealer[]> => {
      return Array.from(userDealers.values()).filter(ud => ud.userId === userId);
    },
    
    findByDealerId: async (dealerId: string): Promise<UserDealer[]> => {
      return Array.from(userDealers.values()).filter(ud => ud.dealerId === dealerId);
    },
    
    create: async (userDealer: Omit<UserDealer, 'id' | 'assignedAt'>): Promise<UserDealer> => {
      const newUserDealer: UserDealer = {
        ...userDealer,
        id: `ud-${Date.now()}`,
        assignedAt: new Date(),
      };
      userDealers.set(newUserDealer.id, newUserDealer);
      return newUserDealer;
    },
    
    delete: async (userId: string, dealerId: string): Promise<boolean> => {
      const entry = Array.from(userDealers.entries()).find(
        ([_, ud]) => ud.userId === userId && ud.dealerId === dealerId
      );
      
      if (entry) {
        userDealers.delete(entry[0]);
        return true;
      }
      return false;
    },
    
    getUserDealers: async (userId: string): Promise<Dealer[]> => {
      const userDealerLinks = await db.userDealers.findByUserId(userId);
      const dealerIds = userDealerLinks.map(ud => ud.dealerId);
      const dealerList: Dealer[] = [];
      
      for (const dealerId of dealerIds) {
        const dealer = await db.dealers.findById(dealerId);
        if (dealer) {
          dealerList.push(dealer);
        }
      }
      
      return dealerList;
    },
  },
};

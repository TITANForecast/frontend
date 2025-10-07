export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MULTI_DEALER = 'MULTI_DEALER', 
  USER = 'USER'
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  defaultDealerId: string;
  isActive: boolean;
  dealers: Dealer[];
}

export interface Dealer {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  isActive: boolean;
}

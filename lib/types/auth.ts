// Authentication and Authorization Types

export enum UserRole {
  USER = 'user',
  MULTI_DEALER = 'multi_dealer',
  SUPER_ADMIN = 'super_admin',
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
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  defaultDealerId: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDealer {
  id: string;
  userId: string;
  dealerId: string;
  assignedAt: Date;
}

// Frontend-safe user type (without password)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  defaultDealerId: string;
  role: UserRole;
  dealers: Dealer[];
  isActive: boolean;
}

// Session data stored in JWT
export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  currentDealerId: string;
  defaultDealerId: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
}

export interface SwitchDealerRequest {
  dealerId: string;
}

export interface SwitchDealerResponse {
  success: boolean;
  token?: string;
  message?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignupResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

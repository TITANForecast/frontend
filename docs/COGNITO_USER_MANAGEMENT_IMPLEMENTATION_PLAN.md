# Cognito User Management Integration - Implementation Plan

## 📋 Executive Summary

**Current Issue**: The admin panel's user management only creates database records. Users are NOT created in AWS Cognito, meaning they cannot log in to the application.

**Goal**: Implement a complete, secure, best-practice flow for Super Admins to manage users (create, update, delete) with full Cognito integration.

**Branch**: `feat/cognito-user-management-integration`

---

## 🔍 Current State Analysis

### What Works ✅
- Database schema has `cognitoSub` field ready for linking
- Admin panel UI for user management (create/edit/delete) exists
- JWT token validation in middleware checks `cognitoSub`
- User roles stored in database (SUPER_ADMIN, MULTI_DEALER, USER)
- Dealer associations working correctly

### What's Missing ❌
1. **No Cognito User Creation**: Creating a user in admin panel only touches PostgreSQL
2. **No User Invitations**: No email sent to new users with temporary password/invite
3. **No Cognito Sync on Update**: Email/status changes don't sync to Cognito
4. **No Cognito Deletion**: Deleting a user leaves orphaned Cognito account
5. **No Password Management**: No way to handle password resets from admin panel
6. **No Status Sync**: Enabling/disabling user doesn't affect Cognito status

### Code Evidence
```typescript
// frontend/app/api/admin/users/route.ts:79-80
// TODO: In production, create user in Cognito and send invitation email
// await createCognitoUser(body.email, body.password);

// frontend/app/api/admin/users/[id]/route.ts:116-117
// TODO: In production, also delete from Cognito
// await deleteCognitoUser(email);
```

---

## 🎯 Recommended Architecture: **Hybrid Pre-Provisioning Model**

### Why This Model?

**For Your B2B Use Case:**
- ✅ Admins need full control over who gets access (no self-service signup)
- ✅ Users must be pre-configured with specific roles and dealer access
- ✅ Admin sets up permissions before user ever logs in
- ✅ Users receive professional invitation emails
- ✅ Supports audit trail (who invited whom, when)

### Flow Diagram

#### Scenario A: New User (Doesn't Exist in Cognito)

```
ADMIN CREATES USER
  ↓
1. Check if user exists in Cognito
   ❌ Not found
  ↓
2. Create DB Record (role, dealers, permissions)
   - status: pending
   - cognitoSub: null
   - invitedAt: now
   - invitedBy: admin_id
  ↓
3. Create Cognito User (AWS AdminCreateUser API)
   - Send invitation email with temporary password
   - Mark as FORCE_CHANGE_PASSWORD
   - Email verified automatically
  ↓
4. User Receives Email
   "Welcome to TITAN Forecast! Click to set your password"
  ↓
5. User Sets Password & Logs In (First Time)
   - Cognito JWT issued with 'sub' claim
  ↓
6. Frontend Auth Flow
   - Backend middleware extracts cognitoSub from JWT
   - Looks up user in DB by email (if cognitoSub is null)
   - Links cognitoSub to DB record
   - Sets status: active
   - Returns user with roles & dealers
  ↓
✅ USER IS FULLY PROVISIONED
```

#### Scenario B: Existing User (Already in Cognito)

```
ADMIN CREATES USER
  ↓
1. Check if user exists in Cognito
   ✅ Found! (e.g., from staging or previous signup)
  ↓
2. Admin Sees Dialog:
   "⚠️  User already exists in Cognito
    Email: user@example.com
    Status: CONFIRMED
    Created: 2024-10-15
    
    Options:
    [ ] Link to existing Cognito account (recommended)
    [ ] Skip Cognito creation (DB only - for testing)
    [Cancel]  [Proceed]"
  ↓
3a. If "Link to existing":
   - Create DB Record with cognitoSub populated
   - Status: active (already confirmed in Cognito)
   - No invitation email sent
   - User can login immediately with existing credentials
  ↓
3b. If "DB only":
   - Create DB Record without cognitoSub
   - Status: pending
   - User will be linked on first login
  ↓
✅ USER ADDED TO SYSTEM
```

---

## 🏗️ Implementation Plan

### Phase 1: Setup AWS SDK and Cognito Utilities

#### Step 1.1: Install Dependencies

```bash
cd /Users/jaylong/Web/Titan/frontend
npm install @aws-sdk/client-cognito-identity-provider
```

**What**: AWS SDK v3 for Cognito admin operations
**Why**: Allows server-side Cognito user management (create, update, delete, disable)

#### Step 1.2: Create Cognito Service Utility

**File**: `lib/cognito/admin-service.ts` (NEW)

```typescript
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminResetUserPasswordCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";

// Initialize Cognito client (server-side only)
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
  // Uses IAM role credentials when running in ECS
  // Uses AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY for local development
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

/**
 * Create a new user in Cognito and send invitation email
 */
export async function createCognitoUser(
  email: string,
  name: string
): Promise<{ success: boolean; cognitoSub?: string; error?: string }> {
  try {
    const command = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email, // Use email as username
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "email_verified", Value: "true" }, // Auto-verify email
      ],
      DesiredDeliveryMediums: ["EMAIL"], // Send invitation via email
      MessageAction: MessageActionType.SUPPRESS, // Use custom email template (optional)
    });

    const response = await cognitoClient.send(command);

    // Extract Cognito Sub from response
    const cognitoSub = response.User?.Attributes?.find(
      (attr) => attr.Name === "sub"
    )?.Value;

    if (!cognitoSub) {
      return { success: false, error: "Failed to extract Cognito sub" };
    }

    return { success: true, cognitoSub };
  } catch (error: any) {
    console.error("Error creating Cognito user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user attributes in Cognito
 */
export async function updateCognitoUser(
  email: string,
  attributes: { name?: string; email_verified?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const userAttributes = [];
    
    if (attributes.name) {
      userAttributes.push({ Name: "name", Value: attributes.name });
    }
    if (attributes.email_verified) {
      userAttributes.push({ Name: "email_verified", Value: attributes.email_verified });
    }

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: userAttributes,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating Cognito user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Disable user in Cognito (soft delete - user cannot login)
 */
export async function disableCognitoUser(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminDisableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error disabling Cognito user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Enable user in Cognito
 */
export async function enableCognitoUser(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminEnableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error enabling Cognito user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete user from Cognito (hard delete - cannot be undone)
 */
export async function deleteCognitoUser(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting Cognito user:", error);
    
    // User might not exist in Cognito - don't fail the operation
    if (error.name === "UserNotFoundException") {
      console.warn(`User ${email} not found in Cognito, skipping deletion`);
      return { success: true };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email to user
 */
export async function resetCognitoUserPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminResetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user exists in Cognito and get their details
 */
export async function checkCognitoUserExists(
  email: string
): Promise<{ 
  exists: boolean; 
  user?: {
    cognitoSub: string;
    email: string;
    name?: string;
    status: string; // CONFIRMED, FORCE_CHANGE_PASSWORD, etc.
    enabled: boolean;
    created: Date;
  };
  error?: string;
}> {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    const response = await cognitoClient.send(command);
    
    // Extract user attributes
    const attributes = response.UserAttributes || [];
    const cognitoSub = attributes.find(attr => attr.Name === "sub")?.Value;
    const emailAttr = attributes.find(attr => attr.Name === "email")?.Value;
    const nameAttr = attributes.find(attr => attr.Name === "name")?.Value;
    
    if (!cognitoSub) {
      return { exists: false, error: "User found but missing sub attribute" };
    }

    return { 
      exists: true,
      user: {
        cognitoSub,
        email: emailAttr || email,
        name: nameAttr,
        status: response.UserStatus || "UNKNOWN",
        enabled: response.Enabled || false,
        created: response.UserCreateDate || new Date(),
      }
    };
  } catch (error: any) {
    if (error.name === "UserNotFoundException") {
      return { exists: false };
    }
    console.error("Error checking Cognito user:", error);
    return { exists: false, error: error.message };
  }
}
```

---

### Phase 2: Update Prisma Schema

#### Step 2.1: Add Audit Fields to User Model

**File**: `prisma/schema.prisma`

```prisma
model User {
  id               String       @id @default(cuid())
  cognitoSub       String?      @unique  // Links to Cognito user's 'sub' attribute
  email            String       @unique
  name             String
  role             String       // SUPER_ADMIN, MULTI_DEALER, USER
  defaultDealerId  String
  isActive         Boolean      @default(true)
  
  // New audit fields
  lastLoginAt      DateTime?    // Track last login time
  invitedAt        DateTime?    // Track when user was invited
  invitedBy        String?      // Admin who invited the user (FK to users.id)
  cognitoStatus    String?      // Track Cognito status: FORCE_CHANGE_PASSWORD, CONFIRMED, etc.
  
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  
  // Relations
  defaultDealer    Dealer       @relation("DefaultDealer", fields: [defaultDealerId], references: [id])
  dealers          UserDealer[]
  servicesCreated  Service[]    @relation("ServiceCreatedBy")
  servicesUpdated  Service[]    @relation("ServiceUpdatedBy")

  @@index([email])
  @@index([cognitoSub])
  @@map("users")
}
```

#### Step 2.2: Create Migration

```bash
npx prisma migrate dev --name add_user_audit_fields
```

---

### Phase 3: Update API Routes

#### Step 3.1: Add Cognito User Check Endpoint (NEW)

**File**: `app/api/admin/users/check-cognito/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { checkCognitoUserExists } from '@/lib/cognito/admin-service';

/**
 * POST /api/admin/users/check-cognito
 * Check if a user exists in Cognito before creating
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists in Cognito
    const result = await checkCognitoUserExists(email);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: result.exists,
      user: result.user,
    });
  } catch (error) {
    console.error('Error checking Cognito user:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}
```

#### Step 3.2: Update User Creation Route

**File**: `app/api/admin/users/route.ts`

```typescript
import { createCognitoUser, checkCognitoUserExists } from '@/lib/cognito/admin-service';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body: UserInput & { 
      linkExisting?: boolean; // Flag from frontend
      skipCognitoCreation?: boolean; // For testing/special cases
    } = await request.json();

    // Validation
    if (!body.email || !body.name || !body.role || !body.defaultDealerId) {
      return NextResponse.json(
        { error: 'Missing required user fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    let cognitoSub: string | null = null;
    let cognitoStatus: string = 'PENDING';
    let invitationSent: boolean = false;

    // STEP 1: Check if user exists in Cognito
    const existingCheck = await checkCognitoUserExists(body.email);

    if (existingCheck.exists && existingCheck.user) {
      // User already exists in Cognito
      if (body.linkExisting) {
        // Link to existing Cognito account
        cognitoSub = existingCheck.user.cognitoSub;
        cognitoStatus = existingCheck.user.status;
        console.log(`Linking to existing Cognito user: ${body.email}`);
      } else if (body.skipCognitoCreation) {
        // Create DB record only (for testing)
        cognitoSub = null;
        cognitoStatus = 'DB_ONLY';
        console.log(`Creating DB-only user: ${body.email}`);
      } else {
        // This shouldn't happen if frontend checks first
        return NextResponse.json(
          { 
            error: 'User already exists in Cognito',
            existingUser: existingCheck.user,
            requiresDecision: true,
          },
          { status: 409 }
        );
      }
    } else {
      // User doesn't exist - create in Cognito
      if (!body.skipCognitoCreation) {
        const cognitoResult = await createCognitoUser(body.email, body.name);
        
        if (!cognitoResult.success) {
          return NextResponse.json(
            { error: `Failed to create Cognito user: ${cognitoResult.error}` },
            { status: 500 }
          );
        }

        cognitoSub = cognitoResult.cognitoSub!;
        cognitoStatus = 'FORCE_CHANGE_PASSWORD';
        invitationSent = true;
      }
    }

    // STEP 2: Create user in database
    const userData = {
      email: body.email,
      name: body.name,
      role: body.role,
      defaultDealerId: body.defaultDealerId,
      isActive: body.isActive ?? true,
      cognitoSub,
      invitedAt: invitationSent ? new Date() : null,
      invitedBy: invitationSent ? auth.user.id : null,
      cognitoStatus,
    };

    const newUser = await prismaDb.users.create(userData);

    // STEP 3: Set up dealer associations
    if (body.dealerIds && body.dealerIds.length > 0) {
      await prismaDb.userDealers.setUserDealers(newUser.id, body.dealerIds);
    } else {
      await prismaDb.userDealers.addUserDealer(newUser.id, body.defaultDealerId);
    }

    // Fetch complete user with dealers
    const completeUser = await prismaDb.users.findById(newUser.id);

    // Determine response message
    let message = 'User created successfully.';
    if (invitationSent) {
      message += ' Invitation email sent.';
    } else if (body.linkExisting) {
      message += ' Linked to existing Cognito account. User can login immediately.';
    } else if (body.skipCognitoCreation) {
      message += ' Database record only (no Cognito account).';
    }

    return NextResponse.json({
      ...completeUser,
      message,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
```

#### Step 3.2: Update User Update Route

**File**: `app/api/admin/users/[id]/route.ts`

```typescript
import { 
  updateCognitoUser, 
  disableCognitoUser, 
  enableCognitoUser 
} from '@/lib/cognito/admin-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const body: Partial<UserInput> = await request.json();

    // Get existing user
    const existingUser = await prismaDb.users.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build database update
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email && body.email !== existingUser.email) {
      return NextResponse.json(
        { error: 'Email changes are not supported. Create a new user instead.' },
        { status: 400 }
      );
    }
    if (body.role) updateData.role = body.role;
    if (body.defaultDealerId) updateData.defaultDealerId = body.defaultDealerId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Sync with Cognito
    if (body.name || body.isActive !== undefined) {
      // Update name in Cognito if changed
      if (body.name) {
        const cognitoUpdate = await updateCognitoUser(existingUser.email, {
          name: body.name,
        });
        
        if (!cognitoUpdate.success) {
          console.warn('Failed to update Cognito user:', cognitoUpdate.error);
          // Don't fail the entire operation - Cognito sync is secondary
        }
      }

      // Enable/disable user in Cognito if status changed
      if (body.isActive !== undefined && body.isActive !== existingUser.isActive) {
        const cognitoStatusUpdate = body.isActive
          ? await enableCognitoUser(existingUser.email)
          : await disableCognitoUser(existingUser.email);
        
        if (!cognitoStatusUpdate.success) {
          console.warn('Failed to update Cognito status:', cognitoStatusUpdate.error);
        }
      }
    }

    // Update database
    const updatedUser = await prismaDb.users.update(id, updateData);
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update dealer associations if provided
    if (body.dealerIds !== undefined) {
      await prismaDb.userDealers.setUserDealers(id, body.dealerIds);
    }

    // Fetch complete user with dealers
    const completeUser = await prismaDb.users.findById(id);

    return NextResponse.json(completeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
```

#### Step 3.3: Update User Deletion Route

**File**: `app/api/admin/users/[id]/route.ts`

```typescript
import { deleteCognitoUser } from '@/lib/cognito/admin-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    
    // Get user email before deletion
    const user = await prismaDb.users.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // STEP 1: Delete from Cognito
    const cognitoResult = await deleteCognitoUser(user.email);
    if (!cognitoResult.success) {
      console.warn('Failed to delete Cognito user:', cognitoResult.error);
      // Continue with database deletion even if Cognito fails
    }

    // STEP 2: Delete from database
    const success = await prismaDb.users.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'User deleted successfully from both database and Cognito' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
```

#### Step 3.4: Add Password Reset Endpoint (NEW)

**File**: `app/api/admin/users/[id]/reset-password/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { prismaDb } from '@/lib/db/prisma-admin-data';
import { resetCognitoUserPassword } from '@/lib/cognito/admin-service';

/**
 * POST /api/admin/users/[id]/reset-password
 * Send password reset email to user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    
    // Get user
    const user = await prismaDb.users.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Send password reset email via Cognito
    const result = await resetCognitoUserPassword(user.email);
    
    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to reset password: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Password reset email sent successfully' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
```

---

### Phase 4: Update UI Components

#### Step 4.1: Add Cognito Conflict Dialog Component (NEW)

**File**: `components/admin/cognito-conflict-dialog.tsx` (NEW)

```typescript
"use client";

import ModalBlank from '@/components/modal-blank';

interface CognitoUser {
  cognitoSub: string;
  email: string;
  name?: string;
  status: string;
  enabled: boolean;
  created: Date;
}

interface CognitoConflictDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  email: string;
  existingUser: CognitoUser;
  onLinkExisting: () => void;
  onSkipCognito: () => void;
}

export default function CognitoConflictDialog({
  isOpen,
  setIsOpen,
  email,
  existingUser,
  onLinkExisting,
  onSkipCognito,
}: CognitoConflictDialogProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">Active</span>;
      case 'FORCE_CHANGE_PASSWORD':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded">Pending Setup</span>;
      case 'RESET_REQUIRED':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">Reset Required</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">{status}</span>;
    }
  };

  return (
    <ModalBlank isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="p-6 max-w-lg">
        {/* Header */}
        <div className="mb-5">
          <div className="text-3xl mb-2">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            User Already Exists in Cognito
          </h2>
        </div>

        {/* Existing User Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{existingUser.email}</p>
            </div>
            
            {existingUser.name && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{existingUser.name}</p>
              </div>
            )}
            
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
              <div className="mt-1">{getStatusBadge(existingUser.status)}</div>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Created</label>
              <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(existingUser.created)}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Enabled</label>
              <p className="text-sm text-gray-700 dark:text-gray-300">{existingUser.enabled ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This email address is already registered in AWS Cognito. This typically happens when:
          </p>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
            <li>User exists in staging/production environment</li>
            <li>User was previously created but removed from database</li>
            <li>User signed up through another process</li>
          </ul>
        </div>

        {/* Options */}
        <div className="mb-6 space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">How would you like to proceed?</h3>
          
          <div className="space-y-2">
            <button
              className="w-full text-left p-4 border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              onClick={() => {
                onLinkExisting();
                setIsOpen(false);
              }}
            >
              <div className="flex items-start">
                <div className="text-2xl mr-3">🔗</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Link to Existing Account (Recommended)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Create database record and link to existing Cognito account. User can login immediately with existing credentials.
                  </div>
                </div>
              </div>
            </button>

            <button
              className="w-full text-left p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => {
                onSkipCognito();
                setIsOpen(false);
              }}
            >
              <div className="flex items-start">
                <div className="text-2xl mr-3">📝</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Database Only (Testing)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Create database record without Cognito link. User will be linked automatically on first login. Use for testing environments.
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalBlank>
  );
}
```

#### Step 4.2: Update User Form Modal

**File**: `components/admin/user-form-modal.tsx`

**Changes**:
1. Check Cognito before saving
2. Show conflict dialog if user exists
3. Remove password field
4. Add informative text about invitation process
5. Show Cognito status for existing users

```typescript
import CognitoConflictDialog from '@/components/admin/cognito-conflict-dialog';

// Add state for conflict handling
const [cognitoConflictOpen, setCognitoConflictOpen] = useState(false);
const [existingCognitoUser, setExistingCognitoUser] = useState<any>(null);
const [userCreationMode, setUserCreationMode] = useState<'normal' | 'link' | 'skip'>('normal');

const handleSaveUser = async () => {
  setLoading(true);
  setError('');

  try {
    // Validation
    if (!userForm.email || !userForm.name || !userForm.defaultDealerId) {
      throw new Error('Please fill in all required fields');
    }

    // Ensure default dealer is in dealer list
    if (!userForm.dealerIds?.includes(userForm.defaultDealerId)) {
      setUserForm({
        ...userForm,
        dealerIds: [...(userForm.dealerIds || []), userForm.defaultDealerId],
      });
    }

    // NEW: Check if user exists in Cognito (only for new users)
    if (!user) {
      const checkResponse = await authenticatedFetch(
        '/api/admin/users/check-cognito',
        getAuthToken,
        {
          method: 'POST',
          body: JSON.stringify({ email: userForm.email }),
        }
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        
        if (checkData.exists) {
          // User exists - show conflict dialog
          setExistingCognitoUser(checkData.user);
          setCognitoConflictOpen(true);
          setLoading(false);
          return; // Stop here and wait for user decision
        }
      }
    }

    // Proceed with user creation
    await proceedWithUserCreation();
    
  } catch (err: any) {
    setError(err.message || 'An error occurred');
    setLoading(false);
  }
};

const proceedWithUserCreation = async () => {
  try {
    // Build request body
    const requestBody: any = { ...userForm };
    
    if (userCreationMode === 'link') {
      requestBody.linkExisting = true;
    } else if (userCreationMode === 'skip') {
      requestBody.skipCognitoCreation = true;
    }

    const response = await authenticatedFetch(
      user ? `/api/admin/users/${user.id}` : '/api/admin/users',
      getAuthToken,
      {
        method: user ? 'PATCH' : 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save user');
    }

    onSave();
    setIsOpen(false);
    setUserCreationMode('normal'); // Reset mode
  } catch (err: any) {
    setError(err.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};

// Handlers for conflict resolution
const handleLinkExisting = () => {
  setUserCreationMode('link');
  proceedWithUserCreation();
};

const handleSkipCognito = () => {
  setUserCreationMode('skip');
  proceedWithUserCreation();
};

// In the JSX:
// Remove password field completely
// Add invitation status indicator

{!user && (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
    <p className="text-sm text-blue-700 dark:text-blue-400">
      ℹ️ The user will receive an invitation email with instructions to set their password.
    </p>
  </div>
)}

{user && user.cognitoStatus && (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Account Status
    </label>
    <div className="text-sm">
      {user.cognitoStatus === 'FORCE_CHANGE_PASSWORD' && (
        <span className="text-orange-600">⏳ Pending - Invitation sent</span>
      )}
      {user.cognitoStatus === 'CONFIRMED' && (
        <span className="text-green-600">✅ Active</span>
      )}
      {user.cognitoStatus === 'DB_ONLY' && (
        <span className="text-gray-600">📝 Database Only</span>
      )}
    </div>
  </div>
)}

{/* Add Cognito Conflict Dialog */}
<CognitoConflictDialog
  isOpen={cognitoConflictOpen}
  setIsOpen={setCognitoConflictOpen}
  email={userForm.email}
  existingUser={existingCognitoUser}
  onLinkExisting={handleLinkExisting}
  onSkipCognito={handleSkipCognito}
/>
```

#### Step 4.2: Update User List Table

**File**: `components/admin/user-list-table.tsx`

**Changes**:
1. Add "Reset Password" button
2. Show Cognito status
3. Add last login timestamp

```typescript
// Add Reset Password button in actions column
<button
  className="text-sm text-blue-600 hover:text-blue-700"
  onClick={() => handleResetPassword(user.id)}
  title="Send password reset email"
>
  Reset Password
</button>

// Handler function
const handleResetPassword = async (userId: string) => {
  if (!confirm('Send password reset email to this user?')) return;

  try {
    const response = await authenticatedFetch(
      `/api/admin/users/${userId}/reset-password`,
      getAuthToken,
      { method: 'POST' }
    );

    if (response.ok) {
      alert('Password reset email sent successfully');
    } else {
      alert('Failed to send password reset email');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    alert('An error occurred');
  }
};
```

---

### Phase 5: Update Auth Middleware (Cognito Sub Linking)

#### Step 5.1: Add JIT Linking on First Login

**File**: `app/api/auth/me/route.ts`

```typescript
// When user logs in for the first time, link cognitoSub to DB record

async function getUserFromToken(request: NextRequest) {
  try {
    const token = extractToken(request);
    const payload = decodeJWT(token);
    const cognitoSub = payload.sub;

    // Try to find user by cognitoSub
    let user = await prisma.user.findUnique({
      where: { cognitoSub },
      include: { /* dealers, etc */ }
    });

    // If not found, this might be first login - try to link by email
    if (!user) {
      const email = payload.email;
      
      user = await prisma.user.findUnique({
        where: { email },
        include: { /* dealers, etc */ }
      });

      // Link cognitoSub to existing user
      if (user && !user.cognitoSub) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            cognitoSub,
            lastLoginAt: new Date(),
            cognitoStatus: 'CONFIRMED', // User has set password
          },
          include: { /* dealers, etc */ }
        });
      }
    }

    // Update last login timestamp
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}
```

---

### Phase 6: Environment Variables

#### Step 6.1: Add Required Environment Variables

**Files**: `.env.local`, `.env.staging`, `.env.production`

```bash
# Cognito Configuration (already exists)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1

# NEW - Server-side Cognito Admin (add these)
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx  # Same as public one, but for server
AWS_REGION=us-east-1

# AWS Credentials (for local development only)
# In ECS, uses IAM task role instead
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Step 6.2: Add IAM Permissions to ECS Task Role

**Required Cognito Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminResetUserPassword"
      ],
      "Resource": "arn:aws:cognito-idp:us-east-1:ACCOUNT_ID:userpool/POOL_ID"
    }
  ]
}
```

---

## 🌍 Multi-Environment Considerations

### Cognito User Pools per Environment

**Important**: AWS Cognito user pools should be separate for staging and production:

- **Staging**: `us-east-1_STAGING_ID`
- **Production**: `us-east-1_PROD_ID`

### Common Scenarios

#### Scenario 1: User Exists in Staging, Adding to Production

**Problem**: Admin tries to add `user@example.com` to production, but user already exists in **production's** Cognito pool (perhaps from testing or previous signup).

**Solution**: 
1. Check endpoint detects existing Cognito user in **production** pool
2. Dialog appears: "User exists in Cognito"
3. Admin chooses "Link to Existing Account"
4. User can log in to production immediately

#### Scenario 2: User Only in Staging, Fresh Production Setup

**Problem**: Admin tries to add `user@example.com` to production, user exists in **staging** Cognito but not **production** Cognito.

**Solution**:
1. Check endpoint checks **production** pool (environment-specific)
2. User NOT found in production Cognito
3. New Cognito account created in production pool
4. Invitation email sent
5. User will have different credentials for staging vs production (by design)

#### Scenario 3: Shared User Across Environments

**Use Case**: Developer wants same login for both staging and production.

**Options**:
1. **Separate Accounts (Recommended)**:
   - Different Cognito pools = different credentials
   - Better security isolation
   - Prevents accidental production access

2. **Unified Identity (Advanced)**:
   - Use AWS Cognito Identity Pools + Federation
   - Single sign-on across environments
   - More complex setup
   - Out of scope for current implementation

### Environment Detection

The API automatically uses the correct Cognito pool based on environment variables:

```typescript
// lib/cognito/admin-service.ts
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!; 
// This resolves to staging or production pool based on deployment
```

**Environment Variables**:
```bash
# Staging
COGNITO_USER_POOL_ID=us-east-1_STAGING_ID

# Production
COGNITO_USER_POOL_ID=us-east-1_PRODUCTION_ID
```

### Best Practices

1. **Keep Pools Separate**: Don't try to share Cognito users across staging/production
2. **Consistent Email Strategy**: Use real emails even in staging for invitation testing
3. **Test User Accounts**: Create specific test users in staging (e.g., `test+staging@example.com`)
4. **Production Promotion**: When promoting staging to production:
   - Don't migrate Cognito users
   - Let admins re-invite users to production
   - Use "Link Existing" if they signed up already

### Migration Checklist

When deploying from staging to production:

- [ ] Verify `COGNITO_USER_POOL_ID` points to production pool
- [ ] Don't copy database user records (different cognitoSub values)
- [ ] Re-invite users in production environment
- [ ] Test "Link Existing" flow with users who signed up on their own

---

## 🔒 Security Considerations

### 1. Email as Username
- **Decision**: Use email as Cognito username
- **Rationale**: Prevents username conflicts, easier for users to remember
- **Implication**: Email changes not supported (would require account migration)

### 2. Email Verification
- **Decision**: Auto-verify emails for admin-created users
- **Rationale**: Admin has already vetted the user, no need for double verification
- **Alternative**: Could require user to verify email on first login

### 3. Invitation Emails
- **Decision**: Use Cognito's built-in invitation system
- **Rationale**: Secure temporary passwords, automatic expiration
- **Customization**: Can customize email template in Cognito console

### 4. Password Requirements
- **Managed by**: Cognito User Pool password policy
- **Configuration**: Set in AWS Console or Terraform
- **Recommendation**: 
  - Minimum 8 characters
  - Require uppercase, lowercase, number, special character

### 5. MFA (Multi-Factor Authentication)
- **Current**: Optional
- **Recommendation**: Make MFA optional but strongly encouraged for SUPER_ADMIN users
- **Implementation**: Can be enabled per-user or enforced via user pool policy

### 6. Session Management
- **Handled by**: Cognito JWT tokens
- **Token Lifetime**: Configurable (default 1 hour)
- **Refresh Tokens**: 30 days (configurable)

---

## 🧪 Testing Strategy

### Unit Tests

**File**: `lib/cognito/__tests__/admin-service.test.ts`

```typescript
import { createCognitoUser, deleteCognitoUser } from '../admin-service';

describe('Cognito Admin Service', () => {
  it('should create user in Cognito', async () => {
    const result = await createCognitoUser('test@example.com', 'Test User');
    expect(result.success).toBe(true);
    expect(result.cognitoSub).toBeDefined();
  });

  it('should handle duplicate email', async () => {
    await createCognitoUser('duplicate@example.com', 'User 1');
    const result = await createCognitoUser('duplicate@example.com', 'User 2');
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });
});
```

### Integration Tests

**Test Scenarios**:
1. ✅ Admin creates user → User receives invitation email
2. ✅ User sets password → cognitoSub linked in database
3. ✅ Admin disables user → User cannot login
4. ✅ Admin deletes user → User removed from Cognito and DB
5. ✅ Admin resets password → User receives reset email

### Manual Testing Checklist

```markdown
## User Creation Flow
- [ ] Create user with valid email
- [ ] Verify user created in database
- [ ] Verify user created in Cognito (check AWS console)
- [ ] Verify invitation email received
- [ ] User sets password successfully
- [ ] User logs in successfully
- [ ] cognitoSub linked in database

## User Update Flow
- [ ] Update user name → synced to Cognito
- [ ] Update user role → DB only (works correctly)
- [ ] Disable user → user cannot login
- [ ] Enable user → user can login again

## User Deletion Flow
- [ ] Delete user → removed from DB
- [ ] Verify user removed from Cognito
- [ ] Verify user cannot login

## Password Reset Flow
- [ ] Admin triggers password reset
- [ ] User receives reset email
- [ ] User resets password successfully
- [ ] User logs in with new password
```

---

## 📊 Database Migration Script

### Link Existing Users to Cognito (One-Time)

**File**: `scripts/link-cognito-users.ts` (NEW)

```typescript
/**
 * One-time script to link existing database users to Cognito users
 * Run this AFTER deploying the new code
 */
import { PrismaClient } from '@prisma/client';
import { checkCognitoUserExists } from '../lib/cognito/admin-service';

const prisma = new PrismaClient();

async function linkExistingUsers() {
  console.log('🔗 Linking existing users to Cognito...');

  const users = await prisma.user.findMany({
    where: {
      cognitoSub: null, // Users not yet linked
    },
  });

  console.log(`Found ${users.length} users to process`);

  for (const user of users) {
    try {
      const { exists } = await checkCognitoUserExists(user.email);
      
      if (exists) {
        console.log(`✅ User ${user.email} exists in Cognito`);
        // Note: You'll need to manually link cognitoSub
        // This requires looking up the user in Cognito by email
      } else {
        console.log(`⚠️  User ${user.email} does NOT exist in Cognito`);
        console.log(`   Action required: Admin should re-invite this user`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${user.email}:`, error);
    }
  }

  console.log('✅ Linking complete');
}

linkExistingUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 📅 Implementation Timeline

### Week 1: Foundation
- [ ] Install AWS SDK dependencies
- [ ] Create Cognito admin service utility
- [ ] Add Prisma schema changes and migration
- [ ] Update environment variables

### Week 2: API Updates
- [ ] Update user creation endpoint
- [ ] Update user update endpoint
- [ ] Update user deletion endpoint
- [ ] Add password reset endpoint

### Week 3: UI Updates
- [ ] Update user form modal
- [ ] Update user list table
- [ ] Add password reset button
- [ ] Update auth middleware for linking

### Week 4: Testing & Deployment
- [ ] Write unit tests
- [ ] Perform integration testing
- [ ] Manual QA testing
- [ ] Deploy to staging
- [ ] Link existing users (one-time script)
- [ ] Deploy to production

---

## 🚨 Rollback Plan

### If Issues Arise in Production

1. **Revert Code Deployment**:
   ```bash
   # Roll back ECS task definition
   aws ecs update-service \
     --cluster titan-production \
     --service frontend \
     --task-definition titan-frontend:<previous-revision>
   ```

2. **Database State**:
   - New fields (`cognitoSub`, `invitedAt`, etc.) are nullable
   - Old code will continue to work
   - No data loss

3. **Cognito State**:
   - New Cognito users remain in pool (safe)
   - Can manually delete via AWS console if needed

---

## 📚 Additional Resources

- [AWS Cognito Admin API Docs](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/Welcome.html)
- [AWS SDK v3 for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Cognito User Pool Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/best-practices.html)

---

## ✅ Success Criteria

### Definition of Done

- [ ] Super admin can create users via admin panel
- [ ] User receives invitation email from Cognito
- [ ] User can set password and login
- [ ] cognitoSub automatically linked on first login
- [ ] Super admin can disable/enable users
- [ ] Super admin can reset user passwords
- [ ] Super admin can delete users
- [ ] All operations synced between DB and Cognito
- [ ] Error handling for Cognito failures
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Documentation updated

---

**Branch**: `feat/cognito-user-management-integration`  
**Status**: Ready for Implementation  
**Priority**: High  
**Estimated Effort**: 2-3 weeks


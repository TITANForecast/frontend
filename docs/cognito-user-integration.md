# Cognito User Integration Architecture

## Overview

This document outlines the integration strategy between AWS Cognito (authentication) and our PostgreSQL User table (authorization and business logic).

## Architecture Principles

### Separation of Concerns

**AWS Cognito** handles:
- User authentication (login/logout)
- Password management
- MFA enforcement
- Session management
- JWT token generation

**PostgreSQL User Table** handles:
- Authorization (roles, permissions)
- Business logic (dealer associations)
- Application-specific user data
- Multi-tenancy relationships

## Data Model

### Cognito User Pool
```
- sub (UUID) - Unique identifier
- email (verified)
- email_verified (boolean)
- name
- custom:role (optional custom attribute)
```

### Database User Table
```prisma
model User {
  id               String       @id @default(cuid())
  cognitoSub       String?      @unique  // Link to Cognito
  email            String       @unique
  name             String
  role             String       // SUPER_ADMIN, MULTI_DEALER, USER
  defaultDealerId  String
  isActive         Boolean      @default(true)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  
  // Relations
  defaultDealer    Dealer       @relation("DefaultDealer", fields: [defaultDealerId], references: [id])
  dealers          UserDealer[]
}
```

## Integration Strategies

### Option 1: Just-In-Time (JIT) Provisioning (Recommended)

**Flow:**
1. User signs up in Cognito (or is created by admin)
2. User logs in for the first time
3. Frontend receives Cognito JWT token
4. Frontend calls backend API with JWT
5. Backend validates JWT and checks if user exists in DB
6. If not exists: Create user record using email/sub from JWT
7. Return user data with roles and permissions

**Pros:**
- Simple implementation
- No sync jobs needed
- Users automatically provisioned on first login
- Works with both self-service and admin-created users

**Cons:**
- Slight delay on first login
- Need default role/dealer assignment logic
- Admin might want to pre-configure users before first login

### Option 2: Pre-Provisioning

**Flow:**
1. Admin creates user in database first (with email, role, dealers)
2. Admin invites user via Cognito (or user signs up)
3. On login, backend matches Cognito user to DB user via email
4. Link Cognito sub to database record

**Pros:**
- Full control over user setup before access
- Can assign roles/dealers before first login
- Better for enterprise scenarios

**Cons:**
- More complex admin workflow
- Need user invitation system
- Risk of orphaned records if user never logs in

### Option 3: Hybrid (Recommended for Your Use Case)

**Flow:**
1. Admin pre-creates users in DB with role/dealer setup
2. Mark as `isActive: false` and `cognitoSub: null`
3. Admin invites user via Cognito
4. On first login:
   - Match user by email
   - Link cognitoSub
   - Set isActive: true
5. For self-service signups:
   - Create DB record with default role (USER)
   - Assign to a "pending" or "default" dealer
   - Admin can modify later

**Pros:**
- Supports both admin-invited and self-service users
- Pre-configuration for invited users
- Flexibility for different onboarding flows

**Cons:**
- Most complex to implement
- Need clear business rules for default assignments

## Implementation Details

### Schema Changes Needed

```prisma
model User {
  id               String       @id @default(cuid())
  cognitoSub       String?      @unique  // ADD THIS - Links to Cognito user
  email            String       @unique
  name             String
  role             String
  defaultDealerId  String
  isActive         Boolean      @default(true)
  lastLoginAt      DateTime?    // ADD THIS - Track user activity
  invitedAt        DateTime?    // ADD THIS - Track when invited
  invitedBy        String?      // ADD THIS - Admin who invited
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  
  defaultDealer    Dealer       @relation("DefaultDealer", fields: [defaultDealerId], references: [id])
  dealers          UserDealer[]
}
```

### Backend API Endpoints

```typescript
// POST /api/auth/sync-user
// Called after Cognito authentication
async function syncUser(cognitoToken: string) {
  // 1. Verify JWT token
  const decodedToken = await verifyJWT(cognitoToken);
  const { sub, email, name } = decodedToken;
  
  // 2. Find or create user
  let user = await prisma.user.findUnique({
    where: { cognitoSub: sub }
  });
  
  if (!user) {
    // Try to find by email (for pre-provisioned users)
    user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      // Link existing user to Cognito
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          cognitoSub: sub,
          isActive: true,
          lastLoginAt: new Date()
        }
      });
    } else {
      // Create new user (self-service signup)
      user = await prisma.user.create({
        data: {
          cognitoSub: sub,
          email,
          name,
          role: 'USER', // Default role
          defaultDealerId: await getDefaultDealerId(), // Business logic
          isActive: true,
          lastLoginAt: new Date()
        }
      });
    }
  } else {
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
  }
  
  // 3. Load user with permissions
  return await getUserWithPermissions(user.id);
}
```

### Frontend Flow

```typescript
// After Cognito login
const session = await Auth.currentSession();
const idToken = session.getIdToken().getJwtToken();

// Sync with backend
const response = await fetch('/api/auth/sync-user', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});

const userData = await response.json();
// userData includes: role, dealers, permissions

// Store in context for authorization checks
setUser(userData);
```

## Authorization Flow

### On Every Request

1. Frontend sends Cognito JWT token
2. Backend validates token (authentication ✓)
3. Backend looks up user in DB by cognitoSub
4. Backend checks user role and dealer associations (authorization ✓)
5. Backend applies business logic based on user permissions

### Example: Role-Based Access

```typescript
function checkAccess(user: User, action: string, dealerId?: string) {
  // Super admin can do anything
  if (user.role === 'SUPER_ADMIN') return true;
  
  // Multi-dealer users can access their assigned dealers
  if (user.role === 'MULTI_DEALER') {
    if (!dealerId) return false;
    return user.dealers.some(d => d.dealerId === dealerId);
  }
  
  // Regular users can only access their default dealer
  if (user.role === 'USER') {
    return dealerId === user.defaultDealerId;
  }
  
  return false;
}
```

## User Lifecycle Management

### User Creation (Admin)

```typescript
// 1. Create user in database
const dbUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    role: 'USER',
    defaultDealerId: 'dealer-123',
    isActive: false, // Not active until first login
    invitedAt: new Date(),
    invitedBy: currentAdminId
  }
});

// 2. Create user in Cognito and send invitation
await cognito.adminCreateUser({
  UserPoolId: COGNITO_USER_POOL_ID,
  Username: dbUser.email,
  UserAttributes: [
    { Name: 'email', Value: dbUser.email },
    { Name: 'name', Value: dbUser.name },
    { Name: 'email_verified', Value: 'true' }
  ],
  DesiredDeliveryMediums: ['EMAIL']
});
```

### User Update

```typescript
// Update in database only
// Cognito attributes are managed separately or not at all
await prisma.user.update({
  where: { id: userId },
  data: {
    role: 'MULTI_DEALER',
    dealers: {
      create: [
        { dealerId: 'dealer-456' }
      ]
    }
  }
});
```

### User Deactivation

```typescript
// 1. Deactivate in database
await prisma.user.update({
  where: { id: userId },
  data: { isActive: false }
});

// 2. Disable in Cognito
await cognito.adminDisableUser({
  UserPoolId: COGNITO_USER_POOL_ID,
  Username: user.email
});
```

## Edge Cases & Considerations

### 1. Email Changes
- **Challenge**: Cognito uses email as username
- **Solution**: Don't allow email changes, or handle as account migration
- **Recommendation**: Make email immutable

### 2. Deleted Cognito Users
- **Challenge**: User deleted in Cognito but exists in DB
- **Solution**: Soft delete in DB when Cognito user not found
- **Implementation**: Handle Cognito UserNotFoundException

### 3. Orphaned Database Users
- **Challenge**: User created in DB but never logs in
- **Solution**: Periodic cleanup job for old uninvited users
- **Implementation**: Delete users with `isActive: false` and `lastLoginAt: null` after 30 days

### 4. Self-Service Signup Control
- **Challenge**: Don't want random users signing up
- **Options**:
  - Disable self-service signup in Cognito
  - Only allow signup with invitation code
  - Auto-approve but assign minimal permissions
- **Recommendation**: Admin-only user creation for your B2B use case

### 5. Role Changes
- **Challenge**: Cognito JWT caches role claims
- **Solution**: Store roles in DB only, not in Cognito custom attributes
- **Result**: Role changes take effect immediately (checked on each request)

## Migration Strategy

### Phase 1: Add cognitoSub Column
```sql
ALTER TABLE users ADD COLUMN cognito_sub VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
```

### Phase 2: Link Existing Users
```typescript
// One-time script to link existing users
const users = await prisma.user.findMany();

for (const user of users) {
  try {
    const cognitoUser = await cognito.adminGetUser({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: user.email
    });
    
    const sub = cognitoUser.UserAttributes.find(
      attr => attr.Name === 'sub'
    )?.Value;
    
    if (sub) {
      await prisma.user.update({
        where: { id: user.id },
        data: { cognitoSub: sub }
      });
    }
  } catch (error) {
    console.log(`User ${user.email} not found in Cognito`);
  }
}
```

### Phase 3: Enforce cognitoSub
```prisma
cognitoSub String @unique // Make required after migration
```

## Security Considerations

1. **Always verify JWT on backend** - Never trust frontend
2. **Use cognitoSub as primary link** - Email can theoretically change
3. **Check isActive on every request** - Deactivated users shouldn't access
4. **Log user actions** - Audit trail for security
5. **Rate limit sync endpoint** - Prevent abuse
6. **Validate dealer associations** - Prevent privilege escalation

## Recommended Approach

For your multi-tenant dealer management system, I recommend:

✅ **Option 3 (Hybrid)** with these specifics:
- Admin-only user creation in Cognito
- Pre-provision users in DB with roles and dealer assignments
- Link on first login via email → cognitoSub
- Disable self-service signup
- Store all business logic (roles, dealers) in PostgreSQL
- Use Cognito purely for authentication

This gives you:
- Full control over user onboarding
- Proper dealer/role setup before access
- Clean separation of auth vs authz
- Flexibility for future growth

## Next Steps

1. Add `cognitoSub` column to User table
2. Implement `/api/auth/sync-user` endpoint
3. Update frontend to call sync after Cognito login
4. Create admin UI for user invitation
5. Implement authorization middleware
6. Test edge cases (deleted users, role changes, etc.)


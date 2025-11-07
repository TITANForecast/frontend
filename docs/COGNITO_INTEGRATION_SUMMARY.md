# Cognito User Management Integration - Quick Summary

## 🎯 Problem

Currently, when a Super Admin creates a user in the admin panel at https://app-staging.titanforecast.com/administration/, the user is **only created in PostgreSQL**, not in AWS Cognito. This means:

❌ User cannot log in (no Cognito account)  
❌ No invitation email sent  
❌ Admin must manually create Cognito user  
❌ Deleting users leaves orphaned Cognito accounts

## ✅ Solution

Implement **Hybrid Pre-Provisioning Model** with full Cognito integration.

### Flow

#### Scenario A: New User (Doesn't Exist in Cognito)
```
ADMIN CREATES USER
  ↓
1️⃣ Check Cognito ❌ Not found
2️⃣ Create in Database (role, dealers, permissions)
3️⃣ Create in Cognito (AWS AdminCreateUser)
4️⃣ Send invitation email (Cognito handles)
  ↓
USER RECEIVES EMAIL & SETS PASSWORD
  ↓
5️⃣ User logs in (Cognito JWT issued)
6️⃣ Backend links cognitoSub to DB record
  ↓
✅ FULLY PROVISIONED
```

#### Scenario B: Existing User (Already in Cognito)
```
ADMIN CREATES USER
  ↓
1️⃣ Check Cognito ✅ Found!
2️⃣ Show Dialog:
    "User exists in Cognito
     Link existing or DB-only?"
  ↓
3️⃣ Admin Chooses:
    A. Link → Create DB with cognitoSub
    B. DB-only → Create without link
  ↓
✅ USER ADDED (can login immediately if linked)
```

## 📦 What Gets Built

### New Files
- `lib/cognito/admin-service.ts` - Cognito SDK wrapper (create, update, delete, disable, reset password, **check if exists**)
- `app/api/admin/users/check-cognito/route.ts` - **Check if user exists in Cognito before creation**
- `app/api/admin/users/[id]/reset-password/route.ts` - Password reset endpoint
- `components/admin/cognito-conflict-dialog.tsx` - **Dialog for handling existing Cognito users**
- `scripts/link-cognito-users.ts` - One-time migration script

### Updated Files
- `prisma/schema.prisma` - Add `cognitoSub`, `invitedAt`, `invitedBy`, `lastLoginAt`, `cognitoStatus`
- `app/api/admin/users/route.ts` - Call Cognito on user creation
- `app/api/admin/users/[id]/route.ts` - Sync updates/deletes with Cognito
- `app/api/auth/me/route.ts` - Link cognitoSub on first login
- `components/admin/user-form-modal.tsx` - Remove password field, show invitation status
- `components/admin/user-list-table.tsx` - Add "Reset Password" button

### New Dependencies
```bash
npm install @aws-sdk/client-cognito-identity-provider
```

### New Environment Variables
```bash
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx  # Local dev only
AWS_SECRET_ACCESS_KEY=xxx  # Local dev only
```

### IAM Permissions Required (ECS Task Role)
```
cognito-idp:AdminCreateUser
cognito-idp:AdminDeleteUser
cognito-idp:AdminDisableUser
cognito-idp:AdminEnableUser
cognito-idp:AdminGetUser
cognito-idp:AdminUpdateUserAttributes
cognito-idp:AdminResetUserPassword
```

## 🌍 Staging vs Production

**Key Point**: Each environment has its own Cognito user pool.

- **Staging**: `us-east-1_STAGING_ID`
- **Production**: `us-east-1_PRODUCTION_ID`

**What This Means**:
- User in staging ≠ User in production (different pools)
- When adding user to production, check **production** pool only
- "Link Existing" works for users who already signed up in that environment
- Prevents accidental cross-environment access

**Common Scenario**: User exists in staging but not in production:
- Admin adds to production → Checked against production pool → Not found → New invite sent ✅

---

## 🎨 UI Changes

### Before
- Admin enters: email, name, **password**, role, dealers
- User created only in database
- No email sent
- User cannot login

### After
- Admin enters: email, name, role, dealers (**no password**)
- User created in **both** database and Cognito
- **Invitation email sent automatically**
- User clicks link, sets password, can login
- Admin can see user status: "Pending Invitation" or "Active"
- Admin can click "Reset Password" to resend invitation

## 🔒 Security Improvements

✅ Centralized password management (Cognito)  
✅ Secure invitation flow (temporary passwords)  
✅ Auto-expire invitations (24 hours default)  
✅ Password policy enforcement (Cognito)  
✅ No plaintext passwords in database  
✅ Proper account lifecycle management

## ⏱️ Timeline

**Week 1**: Setup (SDK, schema, env vars)  
**Week 2**: API routes (create, update, delete, reset)  
**Week 3**: UI updates (remove password field, add reset button)  
**Week 4**: Testing & deployment

## 📋 Testing Checklist

- [ ] Create user → invitation email received
- [ ] User sets password → can login
- [ ] Update user → synced to Cognito
- [ ] Disable user → cannot login
- [ ] Enable user → can login again
- [ ] Reset password → reset email sent
- [ ] Delete user → removed from both DB and Cognito

## 🚀 Deployment Steps

1. Deploy code to staging
2. Run Prisma migration
3. Add IAM permissions to ECS task role
4. Set environment variables
5. Test full flow
6. Run one-time script to link existing users
7. Deploy to production

## 📖 Full Documentation

See: `COGNITO_USER_MANAGEMENT_IMPLEMENTATION_PLAN.md`

---

**Branch**: `feat/cognito-user-management-integration`  
**Status**: Planning Complete, Ready for Implementation


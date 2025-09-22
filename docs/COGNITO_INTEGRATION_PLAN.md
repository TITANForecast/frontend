# Cognito Integration Implementation Plan

## Overview

This document outlines the implementation plan for integrating AWS Cognito authentication into the TITAN frontend while preserving our beautiful custom UI. This implementation follows the minimal viable approach established in the infrastructure documentation and addresses the requirements outlined in [Issue #11](https://github.com/TITANForecast/frontend/issues/11).

> **📋 Infrastructure Details**: For complete information about the Cognito service configuration, deployment, and management, see the **[Infrastructure Repository](https://github.com/TITANForecast/infrastructure)** and related issues:
> - [Cognito Implementation](https://github.com/TITANForecast/infrastructure/issues/21)
> - [SES Email Setup](https://github.com/TITANForecast/infrastructure/issues/25)
> - [Email Templates](https://github.com/TITANForecast/infrastructure/issues/26)

## Current State Analysis

### Existing Authentication Implementation

**Current Auth Flow:**
- **AuthProvider** (`components/auth-provider.tsx`): Uses localStorage with hardcoded credentials (`titan`/`forecast`)
- **LoginForm** (`components/login-form.tsx`): Beautiful custom UI with username/password fields
- **SignIn Page** (`app/(auth)/signin/page.tsx`): Static form with email/password fields (non-functional)
- **SignUp Page** (`app/(auth)/signup/page.tsx`): Static form with email, name, role, password (non-functional)

**Current Authentication Logic:**
```typescript
// Simple credential check in LoginForm
if (username === "titan" && password === "forecast") {
  localStorage.setItem("titan-auth", "true");
  setIsAuthenticated(true);
  router.push("/dashboard");
}
```

### Infrastructure Status

**✅ Cognito Resources Deployed:**
- **User Pool**: `us-east-1_elJqujwjE` (titan-users)
- **User Pool Client**: `56n4j0cr37ngirgq5a5918c48h` (titan-web-client)
- **Environment**: sandbox
- **Features**: Email verification, password reset, JWT tokens, OAuth code flow

**Environment Variables Available:**
```bash
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_elJqujwjE
NEXT_PUBLIC_COGNITO_CLIENT_ID=56n4j0cr37ngirgq5a5918c48h
```

## Implementation Strategy

### Approach: Custom UI with Cognito SDK

We will implement the **Custom UI with Cognito SDK** approach as outlined in the infrastructure documentation. This approach:

- ✅ **Preserves our beautiful, branded auth pages**
- ✅ **Seamless user experience** - no redirects away from our app
- ✅ **Full control over UX** and branding
- ✅ **Easy to implement** with AWS Amplify SDK
- ✅ **Professional authentication** with enterprise-grade security

### Phase 1: Core Authentication (This Implementation)

**Goal:** Replace hardcoded authentication with real Cognito authentication while preserving all existing UI/UX.

**Scope:**
- [ ] Install and configure AWS Amplify SDK
- [ ] Update AuthProvider to use Cognito instead of localStorage
- [ ] Make LoginForm functional with Cognito authentication
- [ ] Make SignIn page functional with Cognito authentication
- [ ] Make SignUp page functional with email verification flow
- [ ] Add password reset functionality
- [ ] Preserve all existing styling and branding
- [ ] Maintain current user experience and flow

**Out of Scope (Future Phases):**
- ❌ Social login (Google, GitHub, Microsoft)
- ❌ Enterprise SSO options
- ❌ MFA management
- ❌ Custom domain for authentication

## Technical Implementation Plan

### Step 1: Dependencies and Configuration

**Install AWS Amplify SDK:**
```bash
npm install aws-amplify
```

**Create Amplify Configuration:**
```typescript
// lib/amplify.ts
import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH',
  }
};

Amplify.configure(amplifyConfig);
```

**Environment Variables Setup:**
```bash
# .env.local
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_elJqujwjE
NEXT_PUBLIC_COGNITO_CLIENT_ID=56n4j0cr37ngirgq5a5918c48h
```

### Step 2: AuthProvider Enhancement

**Current AuthProvider Interface:**
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}
```

**Enhanced AuthProvider Interface:**
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  confirmSignup: (email: string, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}
```

**Key Changes:**
- Replace localStorage with Cognito session management
- Add user object with Cognito user data
- Add async methods for authentication operations
- Add email verification and password reset methods
- Maintain existing redirect logic

### Step 3: LoginForm Integration

**Current LoginForm:**
- Uses username/password fields
- Hardcoded credential check
- Beautiful custom styling

**Updated LoginForm:**
- Change username field to email field
- Replace hardcoded check with Cognito authentication
- Add proper error handling
- Maintain all existing styling
- Add loading states

**Key Changes:**
```typescript
// Before
if (username === "titan" && password === "forecast") {
  login();
}

// After
try {
  await login(email, password);
} catch (error) {
  setError(error.message);
}
```

### Step 4: SignIn Page Integration

**Current SignIn Page:**
- Static form with email/password fields
- Non-functional submit button
- Beautiful styling and layout

**Updated SignIn Page:**
- Make form functional with Cognito authentication
- Add form state management
- Add error handling and loading states
- Maintain all existing styling
- Add "Forgot Password" functionality

### Step 5: SignUp Page Integration

**Current SignUp Page:**
- Static form with email, name, role, password fields
- Non-functional submit button
- Beautiful styling and layout

**Updated SignUp Page:**
- Make form functional with Cognito signup
- Add email verification flow
- Add form state management
- Add error handling and loading states
- Maintain all existing styling
- Handle role selection (store as custom attribute)

**Email Verification Flow:**
1. User submits signup form
2. Cognito sends verification email
3. User receives email and clicks verification link
4. User is redirected back to app
5. App checks verification status and logs user in

### Step 6: Password Reset Integration

**Implementation:**
- Add "Forgot Password" functionality to SignIn page
- Use Cognito's built-in password reset flow
- Maintain custom UI for password reset form
- Handle password reset confirmation

## Implementation Details

### Authentication Flow

**Sign Up Flow:**
1. User visits `/signup` page (beautiful branded page)
2. User fills out form (email, name, password, role)
3. User clicks "Sign Up" button
4. **Behind the scenes**: AWS Amplify calls Cognito to create user
5. **Behind the scenes**: Cognito sends verification email
6. User receives email and clicks verification link
7. **Behind the scenes**: Cognito verifies email
8. User is redirected back to app
9. **Behind the scenes**: App checks verification status
10. User is logged in and redirected to dashboard

**Sign In Flow:**
1. User visits `/signin` page (beautiful branded page)
2. User enters email/password in form
3. User clicks "Sign In" button
4. **Behind the scenes**: AWS Amplify calls Cognito to authenticate
5. **Behind the scenes**: Cognito validates credentials and returns JWT tokens
6. **Behind the scenes**: App stores tokens and updates auth state
7. User is logged in and redirected to dashboard

**Password Reset Flow:**
1. User clicks "Forgot Password?" on signin page
2. **Behind the scenes**: AWS Amplify calls Cognito to initiate password reset
3. **Behind the scenes**: Cognito sends reset email
4. User receives email and clicks reset link
5. **Behind the scenes**: Cognito handles password reset
6. User is redirected back to app, logged in

### Error Handling

**Authentication Errors:**
- Invalid credentials
- User not found
- Account not verified
- Password reset errors
- Network errors

**Error Display:**
- Use existing error styling from LoginForm
- Display user-friendly error messages
- Maintain consistent error handling across all forms

### Loading States

**Loading Indicators:**
- Use existing loading spinner from LoginForm
- Add loading states to all form submissions
- Disable form inputs during loading
- Show appropriate loading messages

### Session Management

**Token Storage:**
- AWS Amplify handles JWT token storage automatically
- Tokens are stored securely in browser storage
- Automatic token refresh handled by Amplify
- Session persistence across page refreshes

**User Data:**
- Store user information from Cognito tokens
- Include email, name, and custom attributes
- Update user data when profile changes

## Testing Strategy

### Unit Tests
- [ ] AuthProvider authentication methods
- [ ] Form validation and error handling
- [ ] Session management and persistence

### Integration Tests
- [ ] End-to-end signup flow
- [ ] End-to-end signin flow
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Protected route access
- [ ] Logout functionality

### Manual Testing
- [ ] User registration with email verification
- [ ] User login and session persistence
- [ ] Password reset functionality
- [ ] Error handling for invalid credentials
- [ ] Error handling for invalid verification codes
- [ ] UI/UX preservation across all forms
- [ ] Responsive design on different screen sizes

## Migration Strategy

### Backward Compatibility
- Maintain existing AuthProvider interface during transition
- Ensure existing components continue to work
- Gradual migration of authentication methods

### Rollback Plan
- Keep hardcoded authentication as fallback option
- Environment variable to switch between authentication methods
- Quick rollback capability if issues arise

## Security Considerations

### Built-in Security (Cognito)
- ✅ **Password Hashing**: AWS handles securely
- ✅ **JWT Security**: Industry-standard implementation
- ✅ **HTTPS Only**: All communications encrypted
- ✅ **Token Rotation**: Automatic refresh token rotation
- ✅ **Account Lockout**: Built-in brute force protection

### Additional Security
- ✅ **Input Validation**: Client-side validation for all forms
- ✅ **Error Handling**: Secure error messages (no sensitive data)
- ✅ **Session Management**: Proper token storage and cleanup

## Performance Considerations

### Bundle Size
- AWS Amplify SDK adds ~200KB to bundle
- Tree-shaking to include only necessary modules
- Lazy loading of authentication components if needed

### Network Performance
- JWT tokens reduce server round trips
- Automatic token refresh minimizes re-authentication
- Efficient session management

## Future Enhancement Path

### Phase 2: Social Login (Future)
- Add social login buttons below existing forms
- Keep email/password as primary option
- Users can choose their preferred authentication method

### Phase 3: Enterprise Features (Future)
- Add enterprise SSO options
- Add MFA management in user profile
- Add custom domain for authentication

### Phase 4: Advanced Features (Future)
- Add user profile management
- Add account settings
- Add audit logging and analytics

## Implementation Timeline

### Day 1: Setup and Configuration
- [ ] Install AWS Amplify SDK
- [ ] Create Amplify configuration
- [ ] Set up environment variables
- [ ] Test basic Amplify connection

### Day 2: AuthProvider Enhancement
- [ ] Update AuthProvider interface
- [ ] Implement Cognito authentication methods
- [ ] Add session management
- [ ] Test authentication flow

### Day 3: Form Integration
- [ ] Update LoginForm with Cognito integration
- [ ] Make SignIn page functional
- [ ] Make SignUp page functional
- [ ] Add email verification flow

### Day 4: Password Reset and Polish
- [ ] Implement password reset functionality
- [ ] Add comprehensive error handling
- [ ] Add loading states
- [ ] Test all authentication flows

### Day 5: Testing and Documentation
- [ ] Comprehensive testing
- [ ] Update documentation
- [ ] Code review and cleanup
- [ ] Deploy to staging

## Acceptance Criteria

- [ ] User can sign up with email/password using existing beautiful UI
- [ ] User can sign in with email/password using existing beautiful UI
- [ ] Email verification works with custom UI
- [ ] Password reset works with custom UI
- [ ] All existing styling and branding preserved
- [ ] Error handling works properly
- [ ] Authentication state persists across page refreshes
- [ ] Protected routes work correctly
- [ ] No hardcoded credentials remain
- [ ] All forms are functional (not just static)
- [ ] Loading states work properly
- [ ] Responsive design maintained

## Dependencies

### External Dependencies
- AWS Cognito User Pool (✅ Deployed)
- AWS Amplify SDK (To be installed)
- Environment variables (To be configured)

### Internal Dependencies
- Existing AuthProvider component
- Existing form components
- Existing styling and branding
- Existing routing and navigation

## Risks and Mitigation

### Technical Risks
- **Risk**: AWS Amplify SDK compatibility issues
- **Mitigation**: Use stable version, test thoroughly

- **Risk**: Session management complexity
- **Mitigation**: Use Amplify's built-in session management

- **Risk**: UI/UX changes during integration
- **Mitigation**: Preserve existing components, minimal changes

### Business Risks
- **Risk**: Authentication downtime during migration
- **Mitigation**: Gradual migration, rollback plan

- **Risk**: User experience disruption
- **Mitigation**: Preserve existing UI/UX, thorough testing

## Success Metrics

### Technical Metrics
- [ ] Authentication success rate > 99%
- [ ] Page load time increase < 200ms
- [ ] Bundle size increase < 300KB
- [ ] Zero authentication-related errors

### User Experience Metrics
- [ ] User satisfaction with authentication flow
- [ ] Time to complete authentication < 30 seconds
- [ ] Error rate < 1%
- [ ] User retention after authentication

## Conclusion

This implementation plan provides a comprehensive approach to integrating AWS Cognito authentication while preserving our beautiful custom UI. The plan follows the minimal viable approach established in the infrastructure documentation and addresses all requirements from Issue #11.

The implementation will provide enterprise-grade authentication capabilities while maintaining the existing user experience and branding. The modular approach allows for future enhancements without throwing away existing work.

**Next Steps:**
1. Review and approve this implementation plan
2. Begin implementation following the timeline
3. Test thoroughly at each step
4. Deploy to staging for team review
5. Deploy to production when ready

---

*This document will be updated as the implementation progresses and requirements evolve.*

# Password Reset & Email Verification Flows

Complete guide to the password reset and email verification flows for TITAN Forecast.

---

## 📧 **Email Verification Flow**

### User Journey:
1. **User signs up** for a new account
2. **Receives branded email** with:
   - 6-digit verification code displayed prominently
   - "Verify Email Address" button (magic link)
   - Manual link fallback
3. **Clicks button** or **visits `/verify-email`** manually
4. **Code auto-fills** from URL parameter (if clicked from email)
5. **Enters email** (required, since Cognito doesn't support `{username}` placeholder in links)
6. **Submits form** → Email verified!
7. **Redirects to login** with success message

### Key Features:
- ✨ **Magic Link**: Button in email pre-fills the 6-digit code
- 🔄 **Resend Code**: Users can request a new code if needed
- ⏱️ **24-hour expiration** clearly communicated
- 📱 **Mobile-friendly** responsive design
- 🎨 **Branded**: Matches TITAN Forecast maroon (#550000) theme

### API Endpoints Used:
- `confirmSignUp()` - Verify email with code
- `resendSignUpCode()` - Resend verification code

---

## 🔐 **Password Reset Flow**

### User Journey:
1. **User clicks "Forgot Password"** on login page
2. **Enters email** → Receives branded email with:
   - 6-digit reset code displayed prominently
   - "Reset Your Password" button (magic link)
   - Manual link fallback
3. **Clicks button** or **visits `/forgot-password`** manually
4. **Code auto-fills** from URL parameter (if clicked from email)
5. **Enters email, code, and new password**
6. **Password validated** (8+ chars, uppercase, lowercase, number, special char)
7. **Submits form** → Password reset!
8. **Success screen** → Redirects to login

### Key Features:
- ✨ **Magic Link**: Button in email pre-fills code and skips to password entry
- 🔄 **Resend Code**: Users can request a new reset code
- 🔒 **Password Validation**: Real-time validation with clear requirements
- 🎯 **Multi-step UI**: Guides user through request → confirm → success
- ⚠️ **User-friendly errors**: Clear messages for expired codes, invalid passwords, etc.

### API Endpoints Used:
- `resetPassword()` - Request password reset (sends email)
- `confirmResetPassword()` - Complete reset with code and new password

---

## 🎨 **Email Templates**

Both flows use **custom HTML email templates** with:
- **TITAN Forecast branding** (maroon gradient headers)
- **Dark theme** with high contrast
- **Prominent verification codes** (large, monospace font)
- **Call-to-action buttons** with magic links
- **Security notices** (expiration time, ignore instructions)
- **Footer with branding** and copyright

### Environment Configuration:

```bash
# Generate templates for different environments
./email-templates/generate-templates.sh local      # localhost:3000
./email-templates/generate-templates.sh staging    # app-staging.titanforecast.com
./email-templates/generate-templates.sh production # app.titanforecast.com
```

Templates are stored in:
- `email-templates/verification-email.html` (template with `${app_domain}` variable)
- `email-templates/password-reset-email.html` (template with `${app_domain}` variable)
- `email-templates/generated/{env}/` (environment-specific versions)

See [Email Templates README](../email-templates/README.md) for full customization guide.

---

## 🔧 **Technical Implementation**

### Frontend Pages:
- `/app/(auth)/verify-email/page.tsx` - Email verification UI
- `/app/(auth)/forgot-password/page.tsx` - Password reset UI (3-step flow)

### Auth Library:
- `/lib/cognito/auth-flows.ts` - Centralized auth functions:
  - `verifyEmail()` - Confirm email with code
  - `resendVerificationCode()` - Resend email verification
  - `requestPasswordReset()` - Request password reset
  - `confirmPasswordReset()` - Complete password reset
  - `validatePassword()` - Client-side password validation

### Password Requirements:
- ✅ At least 8 characters
- ✅ Uppercase letter (A-Z)
- ✅ Lowercase letter (a-z)
- ✅ Number (0-9)
- ✅ Special character (!@#$%^&*)

---

## 🚀 **Deployment Checklist**

### 1. **Configure Cognito** (via Terraform or Console):
```hcl
# In infrastructure/cognito.tf
email_verification_message = templatefile(
  "${path.module}/../frontend/email-templates/verification-email.html",
  { app_domain = local.app_domain }
)

email_verification_subject = "Verify Your Email - TITAN Forecast"

# For password reset
verification_message_template {
  default_email_option = "CONFIRM_WITH_CODE"
  email_message = templatefile(
    "${path.module}/../frontend/email-templates/password-reset-email.html",
    { app_domain = local.app_domain }
  )
  email_subject = "Reset Your Password - TITAN Forecast"
}
```

### 2. **Verify SES Configuration**:
- Sender email: `noreply@titanforecast.com`
- Domain verified in SES
- SPF/DKIM/DMARC records configured
- Production access enabled (out of sandbox)

### 3. **Test in Staging**:
- Register new user → verify email flow works
- Request password reset → magic link works
- Test manual code entry (without clicking email)
- Test error scenarios (expired code, wrong code, etc.)
- Test email rendering in Gmail, Outlook, Apple Mail

---

## 📱 **Magic Link Behavior**

**Important Note**: Cognito doesn't support `{username}` in custom email templates, so:
- ✅ Code auto-fills from URL: `?code={####}`
- ❌ Email doesn't auto-fill (user must enter it)
- 💡 This is by design for security (email acts as second factor)

**URLs**:
- Verification: `https://app.titanforecast.com/verify-email?code=123456`
- Password Reset: `https://app.titanforecast.com/forgot-password?code=123456`

---

## 🎯 **Testing Instructions**

### Local Testing:
1. Generate local templates:
   ```bash
   cd email-templates
   ./generate-templates.sh local
   ```

2. Configure Cognito to use `localhost:3000` domain

3. Start frontend:
   ```bash
   npm run dev
   ```

4. Register test user → check verification email
5. Request password reset → check reset email
6. Click magic links → verify they work

### Staging Testing:
1. Generate staging templates:
   ```bash
   cd email-templates
   ./generate-templates.sh staging
   ```

2. Deploy templates to Cognito (via Terraform or Console)

3. Deploy frontend to `app-staging.titanforecast.com`

4. Full end-to-end testing with real emails

### Production Deployment:
1. Generate production templates:
   ```bash
   cd email-templates
   ./generate-templates.sh production
   ```

2. Deploy via Terraform:
   ```bash
   cd ../../infrastructure
   export AWS_PROFILE=TitanOps
   terraform plan
   terraform apply
   ```

3. Verify emails in production environment

---

## 🐛 **Troubleshooting**

### Email Not Received:
- Check SES sending limits (sandbox mode?)
- Verify sender email is configured
- Check spam/junk folders
- Review CloudWatch logs for delivery errors

### Magic Link Not Working:
- Verify domain in `generate-templates.sh` matches deployment
- Check URL parameters are present (`?code=123456`)
- Ensure frontend routes are accessible

### Code Invalid/Expired:
- Codes expire after 24 hours
- User can request new code via "Resend Code" button
- Check Cognito user pool settings for code expiration

### Password Validation Failing:
- Review password requirements in UI
- Ensure password meets all criteria
- Check for leading/trailing spaces

---

## 📚 **Related Documentation**

- [Email Templates README](../email-templates/README.md)
- [Cognito User Management](./cognito-user-integration.md)
- [Infrastructure Setup](../../infrastructure/README.md)
- [SES Configuration](../../infrastructure/ses.tf)

---

## 🔒 **Security Considerations**

### Code Expiration:
- Verification codes expire after 24 hours
- Password reset codes expire after 1 hour (Cognito default)
- Expired codes require user to request new ones

### Rate Limiting:
- Cognito enforces rate limits on code requests
- Users see "Too many attempts" error if exceeded
- Automatic throttling prevents abuse

### Email as Second Factor:
- Users must enter their email when using magic links
- Prevents unauthorized access if link is leaked
- Email acts as second authentication factor

### Password Strength:
- Client-side validation enforces strong passwords
- Server-side validation via Cognito password policy
- Clear requirements displayed to users

---

## 📝 **Future Enhancements**

Potential improvements for the auth flows:

1. **SMS Verification**: Add phone number as backup verification method
2. **Social Login**: Google/Microsoft SSO integration
3. **Biometric Auth**: Face ID / Touch ID support
4. **Session Management**: Remember device, trusted devices
5. **Account Recovery**: Security questions, backup codes
6. **Email Delivery Tracking**: Monitor open rates, click-through rates
7. **A/B Testing**: Test different email designs for conversion
8. **Localization**: Multi-language support for emails

---

## 📞 **Support**

For questions or issues with the authentication flows:
- **Engineering**: Contact the development team
- **AWS Support**: For Cognito/SES configuration issues
- **User Support**: Provide this guide to help desk team

---

**Last Updated**: January 2025
**Maintained By**: Frontend Team
**Status**: ✅ Production Ready

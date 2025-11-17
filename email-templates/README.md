# TITAN Forecast Email Templates

Custom HTML email templates for AWS Cognito authentication flows, branded to match the TITAN Forecast marketing site.

## Templates

### 1. `verification-email.html`
**Purpose:** Email verification for new user registration  
**Cognito Message Type:** Verification Code

**Placeholders:**
- `{####}` - Verification code (6 digits)
- `{##Verify Email##}` - Verification link URL

### 2. `password-reset-email.html`
**Purpose:** Password reset request  
**Cognito Message Type:** Forgot Password

**Placeholders:**
- `{####}` - Reset code (6 digits)
- `{##Reset Password##}` - Password reset link URL

## Design Features

- **Branding**: Maroon (#550000) primary color matching TITAN Forecast brand
- **Typography**: Inter font family for consistency with website
- **Responsive**: Mobile-friendly design with max-width constraints
- **Professional**: Clean, modern aesthetic for business intelligence platform
- **Accessibility**: High contrast, readable fonts
- **Security**: Clear expiration times and security notices

## Configuring in AWS Cognito

### Option 1: Via AWS Console

1. Go to **AWS Cognito Console**
2. Select **User Pools** → `titan-users-staging` (or production)
3. Navigate to **Messaging** → **Email**
4. Under **Email message customization**:
   - Click **Edit** for "Verification message"
   - Choose **Custom message**
   - Copy content from `verification-email.html`
   - Save
5. Repeat for "Forgot password message" using `password-reset-email.html`

### Option 2: Via Terraform (Recommended)

Update your Cognito User Pool configuration in `infrastructure/cognito.tf`:

```hcl
resource "aws_cognito_user_pool" "main" {
  # ... existing config ...
  
  # Custom email templates
  email_verification_message = file("${path.module}/email-templates/verification-email.html")
  email_verification_subject = "Verify Your Email - TITAN Forecast"
  
  # For forgot password (requires verification template)
  verification_message_template {
    default_email_option = "CONFIRM_WITH_LINK"
    email_message_by_link = file("${path.module}/email-templates/password-reset-email.html")
    email_subject_by_link = "Reset Your Password - TITAN Forecast"
  }
}
```

## Testing

Before deploying to production:

1. **Test in Staging**: Configure templates in `titan-users-staging` user pool
2. **Create Test User**: Register with a valid email address
3. **Verify Rendering**: Check email renders correctly in:
   - Gmail
   - Outlook
   - Apple Mail
   - Mobile clients
4. **Test Links**: Verify verification and reset links work correctly
5. **Test Codes**: Confirm verification codes can be entered manually

## Email Deliverability

**SES Configuration Required:**
- Verify sender domain in SES
- Ensure `noreply@titanforecast.com` is configured
- Check SPF, DKIM, and DMARC records
- Monitor bounce and complaint rates

**From Address:** `TITAN Forecast <noreply@titanforecast.com>`

## Customization Guidelines

When modifying templates:

1. **Preserve Placeholders**: Keep `{####}` and `{##Link##}` syntax
2. **Test Thoroughly**: Changes affect user experience
3. **Maintain Branding**: Use Titan Forecast colors and fonts
4. **Keep Mobile-Friendly**: Test on small screens
5. **Security First**: Include expiration times and security warnings
6. **Accessibility**: Maintain contrast ratios and alt text

## Related Documentation

- [Cognito User Management](../docs/cognito-user-integration.md)
- [Infrastructure Setup](../../infrastructure/README.md)
- [SES Configuration](../../infrastructure/ses.tf)


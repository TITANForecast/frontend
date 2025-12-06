# TITAN Forecast Email Templates

Custom HTML email templates for AWS Cognito authentication flows, branded to match the TITAN Forecast marketing site.

## Templates

### 1. `verification-email.html`
**Purpose:** Email verification for new user registration  
**Cognito Message Type:** Verification Code

**Placeholders:**
- `{####}` - Verification code (6 digits)
- `{username}` - User's email address

**Magic Link:**
- Button links to: `https://app.titanforecast.com/verify-email?email={username}&code={####}`
- This automatically pre-fills the email and code on the verification page
- Users can click the button or manually enter the code

### 2. `password-reset-email.html`
**Purpose:** Password reset request  
**Cognito Message Type:** Forgot Password

**Placeholders:**
- `{####}` - Reset code (6 digits)
- `{username}` - User's email address

**Magic Link:**
- Button links to: `https://app.titanforecast.com/forgot-password?email={username}&code={####}`
- This automatically pre-fills the email and code, skipping to the password entry step
- Users can click the button or manually enter the code

## Design Features

- **Branding**: Maroon (#550000) primary color matching TITAN Forecast brand
- **Typography**: Inter font family for consistency with website
- **Responsive**: Mobile-friendly design with max-width constraints
- **Professional**: Clean, modern aesthetic for business intelligence platform
- **Accessibility**: High contrast, readable fonts
- **Security**: Clear expiration times and security notices

## Environment Configuration

The email templates use a variable `${app_domain}` for the domain, allowing you to test in different environments.

### Generate Templates for Your Environment

Use the provided script to generate environment-specific templates:

```bash
# For local development
./generate-templates.sh local
# Generates templates with domain: localhost:3000

# For staging
./generate-templates.sh staging
# Generates templates with domain: app-staging.titanforecast.com

# For production
./generate-templates.sh production
# Generates templates with domain: app.titanforecast.com
```

Generated templates will be placed in `generated/<environment>/` directory.

**Supported Environments:**
- `local` → `localhost:3000`
- `staging` → `app-staging.titanforecast.com`
- `production` → `app.titanforecast.com`

## Configuring in AWS Cognito

### Option 1: Via AWS Console

1. **Generate templates** for your environment first:
   ```bash
   ./generate-templates.sh staging
   ```

2. Go to **AWS Cognito Console**
3. Select **User Pools** → `titan-users-staging` (or production)
4. Navigate to **Messaging** → **Email**
5. Under **Email message customization**:
   - Click **Edit** for "Verification message"
   - Choose **Custom message**
   - Copy content from `generated/staging/verification-email.html`
   - Save
6. Repeat for "Forgot password message" using `generated/staging/password-reset-email.html`

### Option 2: Via Terraform (Recommended)

Use Terraform's `templatefile()` function to inject the correct domain:

```hcl
locals {
  app_domain = var.environment == "production" ? "app.titanforecast.com" : "app-staging.titanforecast.com"
}

resource "aws_cognito_user_pool" "main" {
  # ... existing config ...
  
  # Custom email templates with domain variable
  email_verification_message = templatefile(
    "${path.module}/../frontend/email-templates/verification-email.html",
    { app_domain = local.app_domain }
  )
  email_verification_subject = "Verify Your Email - TITAN Forecast"
  
  # For forgot password
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message = templatefile(
      "${path.module}/../frontend/email-templates/password-reset-email.html",
      { app_domain = local.app_domain }
    )
    email_subject = "Reset Your Password - TITAN Forecast"
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


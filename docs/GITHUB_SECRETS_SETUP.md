# GitHub Secrets Setup for Cognito Authentication

## 🔐 Required GitHub Secrets

The frontend application requires the following environment variables to be set as GitHub repository secrets for the CI/CD pipeline to work properly.

### **Secrets to Add:**

1. **`NEXT_PUBLIC_COGNITO_USER_POOL_ID`**
   - **Value**: `us-east-1_elJqujwjE`
   - **Description**: AWS Cognito User Pool ID for authentication

2. **`NEXT_PUBLIC_COGNITO_CLIENT_ID`**
   - **Value**: `56n4j0cr37ngirgq5a5918c48h`
   - **Description**: AWS Cognito User Pool Client ID for the web application

## 📋 How to Add GitHub Secrets

### **Step 1: Navigate to Repository Settings**
1. Go to the [TITANForecast/frontend](https://github.com/TITANForecast/frontend) repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**

### **Step 2: Add Repository Secrets**
1. Click **New repository secret**
2. Add each secret with the exact name and value:

#### **Secret 1:**
- **Name**: `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- **Secret**: `us-east-1_elJqujwjE`

#### **Secret 2:**
- **Name**: `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- **Secret**: `56n4j0cr37ngirgq5a5918c48h`

### **Step 3: Verify Secrets**
After adding both secrets, you should see them listed in the repository secrets section.

## 🔧 Workflow Integration

The following workflows have been updated to use these secrets:

- **`deploy-release.yml`** - Production deployment
- **`lint.yml`** - Code linting
- **`test.yml`** - Code quality and testing

### **Environment Variables in Workflows:**
```yaml
env:
  NODE_VERSION: '20'
  # Cognito Authentication
  NEXT_PUBLIC_AWS_REGION: us-east-1
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: ${{ secrets.NEXT_PUBLIC_COGNITO_USER_POOL_ID }}
  NEXT_PUBLIC_COGNITO_CLIENT_ID: ${{ secrets.NEXT_PUBLIC_COGNITO_CLIENT_ID }}
```

## 🚀 Benefits

- **Secure**: Sensitive values are stored as encrypted secrets
- **Automated**: CI/CD pipelines can access these values during builds
- **Consistent**: Same environment variables across all environments
- **Maintainable**: Easy to update values without code changes

## ⚠️ Important Notes

1. **Public Variables**: These are `NEXT_PUBLIC_*` variables, meaning they will be exposed in the client-side bundle
2. **Security**: While these values are public, they should still be managed as secrets for consistency
3. **Updates**: If Cognito configuration changes, update both the secrets and local `.env.local` file

## 🔗 Related Documentation

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)

---

**Last Updated**: September 22, 2025  
**Related Issues**: #11, #25, #26

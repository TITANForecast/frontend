# TITAN Frontend

This is the frontend application for the TITAN Forecast platform, built with [Next.js](https://nextjs.org/) and integrated with AWS Cognito for authentication.

## 🔐 Authentication Service

This application uses **AWS Cognito** for user authentication and management. The authentication service is deployed and managed through our infrastructure repository.

### **Cognito Service Details:**
- **User Pool**: `titan-users` (us-east-1_elJqujwjE)
- **User Pool Client**: `titan-web-client` (56n4j0cr37ngirgq5a5918c48h)
- **Region**: us-east-1
- **Environment**: sandbox
- **Features**: Email verification, password reset, JWT tokens, OAuth code flow

### **Infrastructure Documentation:**
For complete details about the Cognito service configuration, deployment, and management, see:
- **[Infrastructure Repository](https://github.com/TITANForecast/infrastructure)**
- **[Cognito Implementation](https://github.com/TITANForecast/infrastructure/issues/21)**
- **[SES Email Setup](https://github.com/TITANForecast/infrastructure/issues/25)**
- **[Email Templates](https://github.com/TITANForecast/infrastructure/issues/26)**

## 🚀 Getting Started

### **Prerequisites:**
- Node.js 18.18.0+ (recommended: 20.x)
- npm, yarn, or pnpm
- Git

### **1. Clone the Repository:**
```bash
git clone https://github.com/TITANForecast/frontend.git
cd frontend
```

### **2. Install Dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install
```

### **3. Configure Environment Variables:**
Create a `.env.local` file in the root directory:

```bash
# AWS Cognito Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_elJqujwjE
NEXT_PUBLIC_COGNITO_CLIENT_ID=56n4j0cr37ngirgq5a5918c48h
```

**Note**: These values are safe to expose publicly as they are designed to be client-side configuration for AWS Cognito. The real security comes from user authentication (passwords, MFA) and JWT token validation, not these configuration values.

### **4. Start the Development Server:**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run build:static` - Build static site for deployment

## 📱 Authentication Features

### **Available Routes:**
- **`/`** - Main login form
- **`/signin`** - Sign in page
- **`/signup`** - User registration
- **`/reset-password`** - Password reset
- **`/dashboard`** - Protected dashboard (requires authentication)

### **Authentication Flow:**
1. **Sign Up**: Users create accounts with email verification
2. **Sign In**: Email/password authentication with JWT tokens
3. **Password Reset**: Email-based password recovery
4. **Session Management**: Automatic token refresh and persistence

### **Security Features:**
- JWT token-based authentication
- Automatic session management
- Password strength requirements
- Email verification
- Secure token storage

## 🏗️ Architecture

### **Frontend Stack:**
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **AWS Amplify** - Cognito integration
- **Lucide React** - Icons

### **Authentication Stack:**
- **AWS Cognito** - User management and authentication
- **AWS Amplify SDK** - Client-side integration
- **JWT Tokens** - Session management
- **Custom UI** - Branded authentication forms

## 📚 Documentation

- **[Cognito Integration Plan](docs/COGNITO_INTEGRATION_PLAN.md)** - Complete implementation details
- **[GitHub Secrets Setup](docs/GITHUB_SECRETS_SETUP.md)** - CI/CD configuration
- **[Workflow Optimization](docs/WORKFLOW_OPTIMIZATION.md)** - GitHub Actions improvements

## 🚀 Deployment

This application is deployed using GitHub Actions to AWS S3 and CloudFront. See the [deployment workflow](.github/workflows/deploy-release.yml) for details.

### **Environment Variables for CI/CD:**
The following secrets must be configured in the GitHub repository:
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`

See [GitHub Secrets Setup](docs/GITHUB_SECRETS_SETUP.md) for configuration instructions.

## 🔗 Related Repositories

- **[Infrastructure](https://github.com/TITANForecast/infrastructure)** - AWS infrastructure and Cognito service
- **[Core API](https://github.com/TITANForecast/core-api)** - Backend API services
- **[Data API](https://github.com/TITANForecast/data-api)** - Data processing services
- **[Website](https://github.com/TITANForecast/website)** - Main marketing website

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is part of the TITAN Forecast platform.

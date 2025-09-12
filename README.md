This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deployment

This application is configured for automated deployment to AWS S3 and CloudFront using GitHub Actions.

### 🚀 Automated Deployment

#### Release Deployment
Deployments are automatically triggered when release tags are created:

```bash
# Create and push a release tag
git tag v1.0.0
git push origin v1.0.0
```

#### Manual Deployment
You can also trigger deployments manually through GitHub Actions:

1. Go to the **Actions** tab in the repository
2. Select **Deploy Release** workflow
3. Click **Run workflow**
4. Choose the branch and click **Run workflow**

### 🏗️ Build Process

The deployment pipeline includes:

1. **Build**: Static site generation with Next.js
2. **Deploy**: Upload to S3 with optimized caching
3. **Security Scan**: Vulnerability scanning with Trivy
4. **Cache Invalidation**: CloudFront cache refresh

### ⚙️ Configuration

#### Next.js Configuration
- **Static Export**: `output: 'export'` for S3 hosting
- **Image Optimization**: Disabled for static hosting compatibility
- **ESLint**: Disabled during builds (developer working on fixes)
- **Trailing Slashes**: Enabled for proper routing

#### AWS Resources
- **S3 Bucket**: `titan-static-site-8fbf908b`
- **CloudFront Distribution**: `E1F8WGVOCZWT1K`
- **Authentication**: OIDC with organization-wide access

### 📦 Deployment Details

#### Caching Strategy
- **Static Assets** (JS, CSS, images): 1-year cache with immutable headers
- **HTML/JSON Files**: 1-hour cache for content updates
- **CloudFront**: Automatic cache invalidation after deployment

#### Build Artifacts
- **Retention**: 7 days
- **Location**: GitHub Actions artifacts
- **Content**: Complete static site in `out/` directory

### 🔧 Local Development

#### Running Locally
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

#### Building for Production
```bash
npm run build
# or
yarn build
# or
pnpm build
```

#### Testing Static Export
```bash
npm run build
npm run start
# or
yarn build
yarn start
```

### 🛡️ Security

- **Vulnerability Scanning**: Trivy scans during deployment
- **OIDC Authentication**: No long-term AWS credentials stored
- **Organization Access**: Any TITANForecast repository can deploy
- **Non-blocking Scans**: Security issues don't block deployments

### 📊 Monitoring

#### Deployment Status
- Check GitHub Actions for build and deployment status
- Monitor CloudFront distribution for cache performance
- Review S3 bucket for uploaded content

#### Troubleshooting
- **Build Failures**: Check GitHub Actions logs
- **Deployment Issues**: Verify AWS permissions and resources
- **Cache Problems**: Check CloudFront invalidation status

### 🔄 Workflow Triggers

| Trigger | Description |
|---------|-------------|
| `push: tags: ['v*']` | Automatic deployment on release tags |
| `workflow_dispatch` | Manual deployment trigger |

### 📝 Environment Variables

The workflow uses these environment variables:
- `AWS_REGION`: us-east-1
- `NODE_VERSION`: 20
- `S3_BUCKET`: titan-static-site-8fbf908b
- `CLOUDFRONT_DISTRIBUTION_ID`: E1F8WGVOCZWT1K

### 🚨 Important Notes

- **ESLint Disabled**: Currently bypassed during builds for deployment testing
- **API Routes**: Not supported in static export mode
- **Image Optimization**: Disabled for S3 compatibility
- **Organization Access**: Any TITANForecast repository can use this pipeline

---

## Deploy on Vercel (Alternative)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

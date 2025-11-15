# Vercel Deployment Guide

This guide will walk you through deploying your Next.js app to Vercel and setting up CI/CD.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. Your code pushed to a Git repository
3. A Vercel account (sign up at [vercel.com](https://vercel.com))

## Step 1: Prepare Your Repository

### 1.1 Ensure your code is committed and pushed

```bash
# Check git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Prepare for Vercel deployment"

# Push to your repository
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for first deployment)

1. **Sign in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub/GitLab/Bitbucket account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize Vercel to access your repositories
   - Find and select `ravisabha_attendence` repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Should auto-detect as "Next.js"
   - **Root Directory**: Leave as `./` (unless your Next.js app is in a subdirectory)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: Leave default (Next.js handles this)
   - **Install Command**: `npm install` (auto-detected)

4. **Set Environment Variables**
   - Click "Environment Variables" section
   - Add your production environment variables:
     - Click "Add" for each variable
     - For each variable from `.env.production`:
       - **Name**: e.g., `NEXT_PUBLIC_API_URL`
       - **Value**: Your production value
       - **Environment**: Select "Production", "Preview", and/or "Development" as needed
     - **Important**: 
       - Variables starting with `NEXT_PUBLIC_` are exposed to the browser
       - Never commit sensitive keys to Git
       - Use Vercel's environment variables for all secrets

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-3 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # For production deployment
   vercel --prod
   
   # Or for preview deployment
   vercel
   ```

## Step 3: Configure CI/CD (Automatic Deployments)

CI/CD is **automatically enabled** when you connect your Git repository to Vercel. Here's how it works:

### Automatic Deployment Triggers

1. **Production Deployments**
   - Triggered when you push to your **main/master branch**
   - Automatically deploys to your production domain
   - Example: `https://your-project.vercel.app`

2. **Preview Deployments**
   - Triggered on every push to other branches
   - Creates a unique preview URL for each branch/PR
   - Example: `https://your-project-git-branch-name.vercel.app`

3. **Pull Request Deployments**
   - Automatically creates a preview deployment for each PR
   - Comments on the PR with the preview URL
   - Allows you to test changes before merging

### Configure Branch Protection (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Git" settings
3. Configure:
   - **Production Branch**: Set to `main` (or your default branch)
   - **Auto-assign Custom Domains**: Enable if you have custom domains
   - **Vercel for Git**: Ensure it's enabled

## Step 4: Environment Variables Setup

### MongoDB Configuration

Since you're using MongoDB with separate databases for dev and prod on the same instance, see `MONGODB_SETUP.md` for detailed MongoDB configuration instructions.

**Quick Setup:**
- **Development**: Use database name `ravisabha_dev` in your `.env.local`
- **Production**: Use database name `ravisabha_prod` in Vercel environment variables
- **Same connection string**: Only the database name changes

### Development Environment (Local)

1. Copy `.env.development` to `.env.local`:
   ```bash
   cp .env.development .env.local
   ```
   Or on Windows PowerShell:
   ```powershell
   Copy-Item .env.development .env.local
   ```

2. Update `.env.local` with your actual MongoDB connection string:
   - Replace `username:password` with your MongoDB Atlas credentials
   - Replace `cluster.mongodb.net` with your actual cluster address
   - Ensure database name is `ravisabha_dev`

3. `.env.local` is gitignored and won't be committed

### Production Environment (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add MongoDB variables:
   - **MONGODB_URI**: Your MongoDB connection string with database name `ravisabha_prod`
     - Example: `mongodb+srv://username:password@cluster.mongodb.net/ravisabha_prod?retryWrites=true&w=majority`
   - **MONGODB_DB_NAME**: `ravisabha_prod`
   - Select environments: Production (and Preview if needed)
   - Click "Save"

4. Add all other variables from your `.env.production` file:
   - Click "Add New" for each variable
   - Enter variable name and value
   - Select environments: Production, Preview, Development
   - Click "Save"

### Environment Variable Best Practices

- ✅ Use Vercel Dashboard for production secrets
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Use `.env.example` as a template (can be committed)
- ❌ Never commit `.env.local` or `.env.production` with real values
- ❌ Never hardcode secrets in your code

## Step 5: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

## Step 6: Monitoring and Logs

### View Deployment Logs

1. Go to your project dashboard
2. Click on any deployment
3. View build logs, function logs, and runtime logs

### Monitor Performance

- Vercel Analytics (if enabled)
- Real-time logs in dashboard
- Function execution metrics

## Troubleshooting

### Build Failures

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility
4. Check for TypeScript errors: `npm run build` locally

### Environment Variables Not Working

1. Ensure variables are set in Vercel dashboard
2. Restart deployment after adding new variables
3. For `NEXT_PUBLIC_*` variables, rebuild is required
4. Check variable names match exactly (case-sensitive)

### Common Issues

- **Module not found**: Check `package.json` dependencies
- **Build timeout**: Optimize build or upgrade plan
- **Function errors**: Check serverless function logs

## Next Steps

1. ✅ Set up environment variables in Vercel
2. ✅ Test your deployment
3. ✅ Configure custom domain (if needed)
4. ✅ Set up monitoring/analytics
5. ✅ Review and optimize build performance

## Useful Commands

```bash
# Local development
npm run dev

# Build locally to test
npm run build
npm run start

# Deploy to Vercel (if using CLI)
vercel
vercel --prod

# View Vercel project info
vercel ls
vercel inspect
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CI/CD Guide](https://vercel.com/docs/concepts/git)

---

**Note**: After your first deployment, every push to your main branch will automatically trigger a new production deployment. Preview deployments are created for all other branches and pull requests.


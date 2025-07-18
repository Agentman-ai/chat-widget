# GitHub Actions Workflows

This directory contains automated workflows for the Agentman Chat Widget project.

## Available Workflows

### 1. Full Release Pipeline (`full-release.yml`)

Handles the complete release process for the NPM package and WordPress plugin.

**Trigger**: Manual via GitHub Actions UI

**Parameters**:
- `release_type`: patch, minor, or major
- `dry_run`: Whether to skip actual publishing (default: false)

**What it does**:
1. Bumps version in package.json
2. Builds and tests the package
3. Publishes to NPM
4. Builds WordPress plugin
5. Creates GitHub release with WordPress plugin zip
6. Verifies the release

**Required Secrets**:
- `NPM_TOKEN`: NPM authentication token

### 2. Shopify Widget Release (`shopify-release.yml`)

Manages the Shopify widget deployment to Google Cloud Storage CDN.

**Trigger**: Manual via GitHub Actions UI

**Parameters**:
- `release_type`: patch, minor, or major
- `deploy_to_gcp`: Whether to deploy to Google Cloud Storage (default: true)
- `dry_run`: Whether to skip deployment (default: false)
- `deploy_version`: Always set to 'v2' (v1 is frozen for legacy support)

**What it does**:
1. Bumps Shopify widget version
2. Builds the Shopify-specific widget
3. Deploys to Google Cloud Storage (v2 directory only)
4. Creates Git tag and GitHub release

**Important**: 
- v1 contains the old non-refactored widget and is frozen
- All new deployments go to v2 automatically
- CDN URLs:
  - v1 (legacy): `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js`
  - v2 (current): `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v2/widget.js`

**Required Secrets**:
- `WIF_PROVIDER`: Workload Identity Federation provider
- `WIF_SERVICE_ACCOUNT`: Service account for GCP deployment

### 3. Release All Components (`release-all.yml`)

Orchestrates releases across all components.

**Trigger**: Manual via GitHub Actions UI

**Parameters**:
- `release_type`: patch, minor, or major
- `components`: Which components to release
  - `all`: Release everything
  - `npm-only`: Only NPM package
  - `wordpress-only`: Only WordPress plugin
  - `shopify-only`: Only Shopify widget
  - `npm-and-wordpress`: NPM and WordPress together
- `deploy_shopify_to_gcp`: Deploy Shopify to GCP (default: true)
- `dry_run`: Skip publishing (default: false)

### 4. CI Pipeline (`ci.yml`)

Continuous integration for pull requests and main branch.

**Trigger**: 
- Push to main branch
- Pull requests to main branch

**What it does**:
1. Tests across Node.js versions (16.x, 18.x, 20.x)
2. Builds the package
3. Runs tests
4. Auto-publishes to NPM on main branch (if version changed)

### 5. Build & Release WP Plugin (`release.yml`)

Legacy workflow for WordPress plugin releases.

**Trigger**: Push tags matching `v*.*.*`

**What it does**:
1. Builds WordPress plugin
2. Creates GitHub release with plugin zip

## Quick Start Guide

### Releasing a New Version

#### Option 1: Release Everything (Recommended)

```bash
# Go to Actions tab → Release All Components → Run workflow
# Select:
# - release_type: patch/minor/major
# - components: all
# - deploy_shopify_to_gcp: true
# - dry_run: false (or true to test first)
```

#### Option 2: Release Individual Components

**NPM & WordPress:**
```bash
# Go to Actions tab → Full Release Pipeline → Run workflow
# Select release_type and dry_run options
```

**Shopify Only:**
```bash
# Go to Actions tab → Shopify Widget Release → Run workflow
# Select release_type, deploy_to_gcp, and dry_run options
```

### Dry Run Testing

Always test with `dry_run: true` first:

1. Run the workflow with `dry_run: true`
2. Check the workflow summary for what would happen
3. If everything looks good, run again with `dry_run: false`

## Version Management

### NPM & WordPress
- Version tracked in `package.json`
- Follows semantic versioning
- Git tags created as `v{version}` (e.g., `v1.2.3`)

### Shopify Widget
- Version tracked in `shopify/version.json`
- Independent versioning from NPM
- Git tags created as `shopify-v{version}` (e.g., `shopify-v1.0.10`)

## Required Repository Secrets

Configure these in Settings → Secrets and variables → Actions:

1. **NPM_TOKEN**: 
   - Get from npmjs.com → Access Tokens
   - Required for NPM publishing

2. **WIF_PROVIDER**: 
   - Google Cloud Workload Identity Federation provider
   - Format: `projects/{number}/locations/global/workloadIdentityPools/{pool}/providers/{provider}`

3. **WIF_SERVICE_ACCOUNT**: 
   - Service account email for GCP deployment
   - Format: `service-account@project.iam.gserviceaccount.com`

## Troubleshooting

### NPM Publishing Issues
- Check if version already exists: `npm view @agentman/chat-widget@{version}`
- Verify NPM_TOKEN is valid
- Ensure you have publish permissions

### GCP Deployment Issues
- Verify WIF credentials are configured correctly
- Check GCP project permissions
- Ensure bucket exists: `chatwidget-shopify-storage-for-cdn`

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Look for TypeScript errors in the logs

### Workflow Permissions
Ensure workflows have correct permissions:
- `contents: write` (for creating releases)
- `packages: write` (for NPM publishing)
- `id-token: write` (for GCP authentication)

## Best Practices

1. **Always use dry run first** to verify the release process
2. **Check existing versions** before releasing
3. **Test locally** before triggering workflows
4. **Monitor the workflow** execution for any issues
5. **Verify deployments** after release completes
6. **Keep secrets secure** and rotate them regularly

## Support

For issues or questions:
1. Check workflow run logs in the Actions tab
2. Review error messages in the workflow summary
3. Create an issue with workflow logs attached
# Proper Release Process for Agentman Chat Widget

## Overview

The Agentman Chat Widget has **separate release processes** for each platform to maintain independent versioning. The old CI/CD pipeline that auto-builds on git push is deprecated. Instead, we use explicit build and deployment scripts for each platform.

## Current Version Status (as of 2025-08-30)
- **NPM Package**: 5.10.0
- **Shopify Widget**: 5.10.0
- **WordPress Plugin**: 5.10.0
- **Wix Integration**: Uses NPM CDN version

## Platform-Specific Release Processes

### 1. NPM Package Release

```bash
# 1. Bump version (automatically builds, commits, tags, and pushes)
npm run release:patch  # or release:minor, release:major

# The npm scripts handle everything:
# - Updates package.json version
# - Runs build
# - Creates git commit and tag
# - Pushes to GitHub (triggers npm publish via CI/CD)
```

### 2. Shopify Widget Release

```bash
# 1. Navigate to Shopify directory
cd shopify/

# 2. Run the complete release script
./release.sh minor  # or major, patch

# This script will:
# - Bump version in multiple files
# - Build the widget
# - Optionally deploy to GCP CDN
# - Create Shopify-specific git tag (shopify-vX.Y.Z)
# - Push changes
```

**Manual steps if needed:**
```bash
# Bump version only
./bump-version.sh minor

# Build locally
./deploy-local.sh build

# Deploy to GCP
./deploy-gcp.sh deploy

# Invalidate CDN cache
./deploy-gcp.sh invalidate
```

### 3. WordPress Plugin Release

```bash
# 1. From root directory, run the WordPress bundle script
node wp-bundle.js

# This will:
# - Build WordPress-specific UMD bundle
# - Copy to wordpress/assets/vendor/
# - Update version in wordpress/agentman-chat-widget.php
# - Create versioned ZIP file

# 2. The ZIP file is ready for distribution
# File created: agentman-chat-widget-X.Y.Z.zip
```

### 4. Wix Integration

Wix uses the NPM CDN version directly, so it's automatically updated when NPM is released:
```html
<!-- Wix uses unpkg CDN -->
<script src="https://unpkg.com/@agentman/chat-widget@latest"></script>
```

## Version Synchronization

To keep versions in sync across platforms:

### Step 1: Update All Version References

```bash
# After npm version bump, update other platforms
NEW_VERSION=$(node -p "require('./package.json').version")

# Update Shopify
cd shopify/
./bump-version.sh  # Will use same version number
cd ..

# WordPress version is auto-updated by wp-bundle.js
node wp-bundle.js
```

### Step 2: Commit Version Updates

```bash
git add -A
git commit -m "chore: sync all platform versions to $NEW_VERSION"
git push
```

## Files That Need Version Updates

### NPM
- `package.json` - Main version source

### Shopify
- `shopify/version.json` - Shopify metadata
- `shopify/script-service/index.js` - SCRIPT_VERSION constant
- `shopify/config-tool/script.js` - Config tool version
- `shopify/cdn/versions/version.json` - CDN version tracking

### WordPress
- `wordpress/agentman-chat-widget.php` - Plugin header and VERSION constant
- Handled automatically by `wp-bundle.js`

## Release Checklist

- [ ] Run tests: `npm test`
- [ ] Build locally: `npm run build`
- [ ] Test with demo files
- [ ] Bump NPM version: `npm run release:minor`
- [ ] Release Shopify: `cd shopify && ./release.sh minor`
- [ ] Build WordPress: `node wp-bundle.js`
- [ ] Create GitHub release with WordPress ZIP
- [ ] Verify CDN deployments
- [ ] Update documentation if needed

## GitHub Actions Workflows

While manual releases are recommended for control, GitHub Actions are available:

- **Full Release Pipeline** - NPM + WordPress
- **Shopify Widget Release** - Independent Shopify deployment
- **Release All Components** - Orchestrated multi-platform release

Required secrets in GitHub:
- `NPM_TOKEN` - For NPM publishing
- `WIF_PROVIDER` - Google Cloud auth for Shopify
- `WIF_SERVICE_ACCOUNT` - GCP service account

## Common Issues

### Versions Out of Sync
This happens when using old CI/CD instead of platform-specific scripts. Always use the explicit build scripts for each platform.

### Build Failures
- Ensure all dependencies are installed: `npm install`
- Check Node version compatibility (14+)
- Clear cache: `rm -rf node_modules dist && npm install`

### CDN Not Updating
- Shopify: Run `./deploy-gcp.sh invalidate`
- NPM: Wait for unpkg/jsdelivr cache to expire (5-10 minutes)

## Support

For issues or questions about the release process, contact the development team or check the repository issues.
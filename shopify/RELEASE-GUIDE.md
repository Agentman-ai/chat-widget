# Shopify Agent Widget Release Guide

## Table of Contents
- [Overview](#overview)
- [Release Types](#release-types)
- [Prerequisites](#prerequisites)
- [Quick Release](#quick-release)
- [Step-by-Step Release](#step-by-step-release)
- [Configuration Options](#configuration-options)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Overview

The Shopify Agent Widget is a standalone integration that allows Shopify stores to embed the Agentman chat widget directly into their themes. This guide covers the complete release process from development to production deployment.

### Current Version
- **Version**: 1.0.9
- **CDN URL**: `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js`
- **Core Widget**: `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/core/chat-widget.js`

## Release Types

### Semantic Versioning
We follow semantic versioning (MAJOR.MINOR.PATCH):

- **Patch Release (1.0.9 → 1.0.10)**: Bug fixes, minor updates
- **Minor Release (1.0.9 → 1.1.0)**: New features, backward compatible
- **Major Release (1.0.9 → 2.0.0)**: Breaking changes

## Prerequisites

### Required Tools
```bash
# Check if you have required tools
gcloud --version      # Google Cloud SDK
node --version        # Node.js 14+
npm --version         # npm 6+
git --version         # Git
```

### GCP Setup
```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project agentman-public-cloud-storage
```

### Directory Structure
```
shopify/
├── script-service/      # Main widget source
├── config-tool/         # Configuration UI
├── dist/               # Build output
├── docs/               # Documentation
├── bump-version.sh     # Version management
├── deploy-local.sh     # Local build script
├── deploy-gcp.sh       # GCP deployment
└── release.sh          # Automated release
```

## Quick Release

### One-Command Release
```bash
# Navigate to shopify directory
cd /path/to/chat-widget/shopify

# Run automated release
./release.sh patch    # For bug fixes
./release.sh minor    # For new features
./release.sh major    # For breaking changes
```

### Example Output
```bash
$ ./release.sh patch
🚀 Shopify Widget Release Process

Step 1: Bumping version (patch)...
Current version: 1.0.9
New version: 1.0.10
✅ Version bumped to 1.0.10

Step 2: Building widget...
🚀 Building Shopify Widget for Deployment
Version: 1.0.10
✅ Build completed successfully!

Step 3: Deploying to GCP...
Deploy to GCP? (y/N): y
✅ All files deployed to GCS

Step 4: Invalidating CDN cache...
✅ Cache invalidation completed

Step 5: Git operations...
Commit and tag these changes? (y/N): y
✅ Created git tag: shopify-v1.0.10

🎉 Release process complete!
Version 1.0.10 is ready
```

## Step-by-Step Release

### 1. Update Version
```bash
# Bump version number
./bump-version.sh patch

# This updates:
# - version.json
# - script-service/index.js (SCRIPT_VERSION)
# - config-tool/script.js
# - deploy-local.sh headers
```

### 2. Build Widget
```bash
# Build the widget locally
./deploy-local.sh build

# Verify build output
ls -la dist/cdn/shopify/v1/widget.js
head -25 dist/cdn/shopify/v1/widget.js
```

### 3. Test Locally (Optional)
```bash
# Start local test server
cd dist
python3 -m http.server 8000

# Test at http://localhost:8000/cdn/shopify/v1/widget.js
```

### 4. Deploy to GCP
```bash
# Deploy files to Google Cloud Storage
./deploy-gcp.sh deploy

# Output:
# [SUCCESS] All files deployed to GCS
# Widget Script: https://storage.googleapis.com/.../shopify/v1/widget.js
```

### 5. Invalidate Cache
```bash
# Force CDN refresh
./deploy-gcp.sh invalidate

# This ensures immediate updates across all edge locations
```

### 6. Commit Changes
```bash
# Add all changes
git add -A

# Commit with version
git commit -m "chore: release Shopify widget v1.0.10"

# Create tag
git tag shopify-v1.0.10

# Push to remote
git push origin main
git push origin shopify-v1.0.10
```

## Configuration Options

### Shopify Installation Script
```html
<!-- Basic Installation -->
<script async 
    src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js"
    data-agent-token="YOUR_AGENT_TOKEN">
</script>

<!-- Full Configuration -->
<script async 
    src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js?t={{ 'now' | date: '%s' }}"
    data-agent-token="YOUR_AGENT_TOKEN"
    data-api-url="https://your-api.com"
    data-title="{{ shop.name }} Assistant"
    data-toggle-text="Chat with us"
    data-variant="corner"
    data-position="bottom-right"
    data-bg-color="{{ settings.colors_background_1 }}"
    data-text-color="{{ settings.colors_text }}"
    data-button-color="{{ settings.colors_accent_1 }}"
    data-user-color="#2563eb"
    data-agent-color="#111827"
    data-welcome-message="Welcome to {{ shop.name }}!"
    data-prompt-1="Track my order"
    data-prompt-2="Product information"
    data-prompt-3="Return policy"
    data-persistence-enabled="true"
    data-persistence-days="7"
    data-enable-attachments="true">
</script>
```

### Available Data Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-agent-token` | Required | Your Agentman agent token |
| `data-api-url` | `https://studio-api.agentman.ai` | API endpoint |
| `data-title` | `AI Assistant` | Widget header title |
| `data-toggle-text` | `Ask AI` | Toggle button text |
| `data-variant` | `corner` | Widget style: corner, centered, inline |
| `data-position` | `bottom-right` | Position for corner variant |
| `data-bg-color` | `#ffffff` | Background color |
| `data-text-color` | `#111827` | Text color |
| `data-button-color` | `#2563eb` | Button color |
| `data-user-color` | `#2563eb` | User message color |
| `data-agent-color` | `#111827` | Agent message color |
| `data-welcome-message` | `How can I help you today?` | Welcome text |
| `data-prompt-1/2/3` | Various | Quick action prompts |
| `data-persistence-enabled` | `true` | Save conversations |
| `data-persistence-days` | `7` | Days to keep conversations |
| `data-enable-attachments` | `true` | Allow file uploads |

## Testing

### 1. Version Verification
```bash
# Check deployed version
curl -s https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js | \
  grep -E "Version:|SCRIPT_VERSION" | head -2

# Expected output:
# * Version: 1.0.10
# const SCRIPT_VERSION = '1.0.10';
```

### 2. Cache Headers
```bash
# Check cache status
curl -I https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js | \
  grep -i cache-control

# Expected: cache-control: public, max-age=300
```

### 3. Live Testing
1. Create a test page with the script tag
2. Open browser DevTools Console
3. Look for: `[Agentman Shopify] Initializing widget v1.0.10`
4. Verify widget appears and functions correctly

### 4. API Connection Test
```bash
# In browser console after widget loads
window.agentmanWidget
// Should show ChatWidget instance

window.agentmanShopifyDebug
// Available in development environments
```

## Troubleshooting

### Common Issues

#### 1. Old Version Still Showing
```bash
# Force cache invalidation
./deploy-gcp.sh invalidate

# Clear browser cache
# Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Add timestamp to force fresh load
?t=<timestamp>
```

#### 2. Build Errors
```bash
# Clean build directory
rm -rf dist/

# Rebuild
./deploy-local.sh build

# Check for errors in output
```

#### 3. Deployment Failures
```bash
# Check GCP authentication
gcloud auth list

# Verify project
gcloud config get-value project

# Check bucket permissions
gsutil ls gs://chatwidget-shopify-storage-for-cdn/
```

#### 4. Script Not Loading
```javascript
// Check in browser console
document.querySelector('script[src*="widget.js"]')

// Verify data attributes
const script = document.querySelector('script[src*="widget.js"]');
console.log('Token:', script.getAttribute('data-agent-token'));
console.log('API URL:', script.getAttribute('data-api-url'));
```

### Debug Mode
Add to your test environment:
```javascript
// Enable debug logging
localStorage.setItem('agentman_debug', 'true');

// View debug info
window.agentmanShopifyDebug
```

## Rollback Procedures

### Quick Rollback
```bash
# 1. Checkout previous version
git checkout shopify-v1.0.9

# 2. Build previous version
./deploy-local.sh build

# 3. Deploy
./deploy-gcp.sh deploy
./deploy-gcp.sh invalidate

# 4. Verify rollback
curl -s https://storage.googleapis.com/.../widget.js | grep "Version:"
```

### Version History
```bash
# List all releases
git tag | grep shopify-v

# Show specific version
git show shopify-v1.0.9
```

## Best Practices

### 1. Pre-Release Checklist
- [ ] Test locally with `./deploy-local.sh build`
- [ ] Verify version numbers are correct
- [ ] Check for console errors
- [ ] Test on a staging Shopify store
- [ ] Review changed files: `git diff`

### 2. Release Notes Template
```markdown
## Shopify Widget v1.0.10

### Changes
- Fixed: [Description of bug fixes]
- Added: [New features]
- Updated: [Improvements]

### Installation
```html
<script src="https://storage.googleapis.com/.../shopify/v1/widget.js" 
        data-agent-token="YOUR_TOKEN"></script>
```
```

### 3. Communication
1. Update internal documentation
2. Notify affected merchants
3. Update support documentation
4. Monitor error logs post-release

## Monitoring

### Check Deployment Status
```bash
# Version manifest
curl https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/version.json

# Widget availability
curl -I https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js

# Core widget
curl -I https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/core/chat-widget.js
```

### Error Tracking
Monitor browser console for:
- `[Agentman Shopify] ERROR:` messages
- Failed network requests to the API
- JavaScript errors in widget initialization

## Support

### Resources
- **Documentation**: `/shopify/docs/`
- **Config Tool**: `https://storage.googleapis.com/.../shopify/config-tool/index.html`
- **Troubleshooting**: `/shopify/docs/troubleshooting.md`

### Contact
- Technical issues: Create GitHub issue
- Merchant support: support@agentman.ai
- Emergency rollback: Use rollback procedures above

---

Last Updated: 2025-01-10 | Current Version: 1.0.9
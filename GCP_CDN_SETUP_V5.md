# GCP CDN Setup for Shopify Widget v5

## Overview

This document explains how to configure Google Cloud Storage (GCS) for public CDN access to deploy the Shopify widget v5.

**Version Note**: The Shopify integration uses independent versioning (v5.x) separate from the core library (v2.3.x).

## Current Setup

- **Bucket**: `chatwidget-shopify-storage-for-cdn`
- **Project**: `agentman-public-cloud-storage`
- **Region**: Multi-region (default)

## Directory Structure

```
gs://chatwidget-shopify-storage-for-cdn/
├── shopify/
│   ├── v1/              # Frozen (DO NOT MODIFY)
│   │   └── widget.js
│   ├── v2/              # Legacy (existing deployments)
│   │   ├── widget.js
│   │   └── widget.min.js
│   ├── v5/              # Latest (v5.2.0+)
│   │   ├── widget.js    # New security and accessibility fixes
│   │   └── widget.min.js
│   ├── config-tool/     # Configuration tool
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── script.js
│   └── version.json     # Version manifest
├── core/
│   └── chat-widget.js   # Core widget bundle
```

## Step-by-Step GCP Configuration

### 1. Make Bucket Public

```bash
# Set bucket-level public access
gsutil iam ch allUsers:objectViewer gs://chatwidget-shopify-storage-for-cdn
```

### 2. Configure CORS (for cross-origin requests)

Create a `cors.json` file:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Cache-Control"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS configuration:

```bash
gsutil cors set cors.json gs://chatwidget-shopify-storage-for-cdn
```

### 3. Set Cache Control Headers

#### For v5 widget files (shorter cache for updates):
```bash
# v5 widget - 5 minutes cache (for faster updates)
gsutil -m setmeta \
  -h "Cache-Control:public, max-age=300" \
  gs://chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js

gsutil -m setmeta \
  -h "Cache-Control:public, max-age=300" \
  gs://chatwidget-shopify-storage-for-cdn/shopify/v5/widget.min.js
```

#### For core widget (longer cache):
```bash
# Core widget - 1 hour cache
gsutil -m setmeta \
  -h "Cache-Control:public, max-age=3600" \
  gs://chatwidget-shopify-storage-for-cdn/core/chat-widget.js
```

#### For v2 legacy (maintain existing cache):
```bash
# v2 widget - 5 minutes cache
gsutil -m setmeta \
  -h "Cache-Control:public, max-age=300" \
  gs://chatwidget-shopify-storage-for-cdn/shopify/v2/widget.js
```

### 4. Verify Public Access

Test that files are publicly accessible:

```bash
# Test v5 widget
curl -I https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js

# Test v2 widget (legacy)
curl -I https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v2/widget.js

# Test core widget
curl -I https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/core/chat-widget.js
```

Expected response headers:
```
HTTP/2 200
cache-control: public, max-age=300
content-type: application/javascript
access-control-allow-origin: *
```

### 5. Set Default Public Permissions for New Objects

To ensure all future uploads are automatically public:

```bash
# Set default object ACL to public-read
gsutil defacl set public-read gs://chatwidget-shopify-storage-for-cdn
```

## CI/CD Pipeline Configuration

The GitHub Actions workflow (`.github/workflows/shopify-release.yml`) now supports v5 deployment:

### Key Changes:

1. **Deploy Version Selection**:
   ```yaml
   deploy_version:
     description: 'Deploy to version (v2/v5 - v1 is frozen)'
     required: true
     default: 'v5'
     type: choice
     options:
       - v2
       - v5
   ```

2. **Dynamic Path Deployment**:
   ```bash
   gsutil -m cp -r dist/cdn/shopify/${DEPLOY_VERSION}/* \
     $BUCKET/shopify/${DEPLOY_VERSION}/
   ```

3. **Safety Checks**:
   - v1 deployments are blocked
   - Build verification checks for correct version directory

## CDN URLs

### v5 (Latest - Recommended)
```
https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js
```

### v2 (Legacy - Existing Deployments)
```
https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v2/widget.js
```

### v1 (Frozen - DO NOT USE)
```
https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js
```

## Installation Examples

### For New Shopify Stores (v5 - Recommended)

```html
<script async
    src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js"
    data-agent-token="YOUR_AGENT_TOKEN">
</script>
```

### For Existing Stores (v2 - Legacy)

```html
<script async
    src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v2/widget.js"
    data-agent-token="YOUR_AGENT_TOKEN">
</script>
```

## Deployment Process

### Via GitHub Actions (Recommended)

1. Go to GitHub Actions
2. Select "Shopify Widget Release"
3. Click "Run workflow"
4. Select:
   - Release type: `patch`, `minor`, or `major`
   - Deploy version: `v5` (recommended) or `v2` (legacy)
   - Deploy to GCP: `true`
   - Dry run: `false`
5. Click "Run workflow"

The pipeline will:
- Bump version in `shopify/version.json`
- Build widget for selected version (v5 or v2)
- Deploy to GCS
- Set cache headers
- Create GitHub release tag
- Generate deployment summary

### Manual Deployment

```bash
# 1. Navigate to shopify directory
cd shopify

# 2. Build the widget
./deploy-local.sh build

# 3. Verify build output
ls -la dist/cdn/shopify/v5/

# 4. Deploy to GCS
BUCKET="gs://chatwidget-shopify-storage-for-cdn"
gsutil -m cp -r dist/cdn/shopify/v5/* $BUCKET/shopify/v5/
gsutil -m cp -r dist/cdn/core/* $BUCKET/core/

# 5. Set cache headers
gsutil -m setmeta \
  -h "Cache-Control:public, max-age=300" \
  "$BUCKET/shopify/v5/widget.js"

gsutil -m setmeta \
  -h "Cache-Control:public, max-age=3600" \
  "$BUCKET/core/chat-widget.js"

# 6. Verify deployment
curl -I https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js
```

## Monitoring and Verification

### Check Current Version

```bash
curl -s https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/version.json | jq
```

Expected output:
```json
{
  "version": "5.x.x",
  "updated": "2025-01-05T12:00:00Z"
}
```

**Note**: Shopify widget version (5.x.x) is independent from core library version (2.3.x)

### Check Version in Widget

```bash
curl -s https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js | grep "SCRIPT_VERSION"
```

Expected output:
```javascript
const SCRIPT_VERSION = '5.x.x';
```

## Troubleshooting

### Issue: 403 Forbidden when accessing widget

**Solution**: Check bucket permissions
```bash
gsutil iam get gs://chatwidget-shopify-storage-for-cdn
```

Ensure `allUsers` has `roles/storage.objectViewer`:
```bash
gsutil iam ch allUsers:objectViewer gs://chatwidget-shopify-storage-for-cdn
```

### Issue: Old version being served after deployment

**Solution**: Cache invalidation
- Wait 5 minutes for cache to expire (max-age=300)
- Or force refresh in browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: CORS errors in browser console

**Solution**: Verify CORS configuration
```bash
gsutil cors get gs://chatwidget-shopify-storage-for-cdn
```

If empty, apply CORS:
```bash
gsutil cors set cors.json gs://chatwidget-shopify-storage-for-cdn
```

## Security Considerations

1. **Public Access**: The bucket is intentionally public for CDN distribution
2. **Content Integrity**: Use GitHub Actions for deployment to ensure code review
3. **Version Control**: Never modify v1, maintain v2 for legacy support
4. **Cache Headers**: Short cache times (5 min) allow quick updates for security fixes

## Version Migration Strategy

### For Existing v2 Users

**Option 1: Gradual Migration** (Recommended)
1. Keep v2 for existing stores
2. Use v5 for new installations
3. Plan migration window for existing stores
4. Update documentation to recommend v5

**Option 2: Immediate Migration**
1. Deploy v5
2. Update all script tags to point to v5
3. Test on staging environment first
4. Roll out to production stores

### Breaking Changes

v5 has no breaking changes from v2. The upgrade includes:
- Security improvements (XSS fixes)
- Accessibility enhancements (keyboard navigation, ARIA)
- TypeScript type safety improvements

**All v2 configurations are compatible with v5.**

## Support

For issues or questions:
- GitHub Issues: https://github.com/Agentman-ai/.github/issues
- Documentation: /shopify/docs/
- Config Tool: https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/config-tool/index.html

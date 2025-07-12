# Shopify Widget Deployment Guide

This guide explains how to deploy the Shopify widget using GitHub Actions.

## Prerequisites

1. **GCP Setup**: Complete the [GCP Deployment Setup](../../docs/gcp-deployment-setup.md)
2. **GitHub Secrets**: Configure the required secrets in your repository
3. **Permissions**: Ensure you have permissions to run GitHub Actions workflows

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

#### 1. Using the Shopify Release Workflow

1. Go to the [Actions tab](../../actions) in your repository
2. Select "Shopify Widget Release" from the left sidebar
3. Click "Run workflow"
4. Configure the parameters:
   - **release_type**: Choose patch, minor, or major
   - **deploy_to_gcp**: Set to true for production deployment
   - **dry_run**: Set to true for testing (recommended first time)

#### 2. Using the Combined Release Workflow

To release all components including Shopify:

1. Go to the [Actions tab](../../actions)
2. Select "Release All Components"
3. Choose `components: all` or `components: shopify-only`

### Method 2: Manual Deployment

If you need to deploy manually, follow these steps:

#### 1. Bump Version

```bash
cd shopify
./bump-version.sh patch  # or minor/major
```

#### 2. Build Widget

```bash
# Build the core widget first
npm run build

# Build Shopify widget
cd shopify
./deploy-local.sh build
```

#### 3. Deploy to GCP

```bash
# Authenticate with GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy files
./deploy-gcp.sh deploy

# Invalidate CDN cache
./deploy-gcp.sh invalidate
```

## Version Management

The Shopify widget maintains its own version separate from the npm package:

- Version stored in `shopify/version.json`
- Current version visible at: https://storage.googleapis.com/YOUR_BUCKET/shopify/version.json
- Git tags created as `shopify-v{version}` (e.g., `shopify-v1.0.10`)

## CDN URLs

After deployment, the widget is available at:

- **Widget Script**: `https://storage.googleapis.com/YOUR_BUCKET/shopify/v1/widget.js`
- **Core Library**: `https://storage.googleapis.com/YOUR_BUCKET/core/chat-widget.js`
- **Config Tool**: `https://storage.googleapis.com/YOUR_BUCKET/shopify/config-tool/index.html`
- **Version Info**: `https://storage.googleapis.com/YOUR_BUCKET/shopify/version.json`

## Testing Deployment

### 1. Verify CDN Access

```bash
# Check widget is accessible
curl -I https://storage.googleapis.com/YOUR_BUCKET/shopify/v1/widget.js

# Verify version
curl https://storage.googleapis.com/YOUR_BUCKET/shopify/version.json
```

### 2. Test in Browser

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Shopify Widget Test</title>
</head>
<body>
    <h1>Testing Shopify Widget</h1>
    
    <script async 
        src="https://storage.googleapis.com/YOUR_BUCKET/shopify/v1/widget.js"
        data-agent-token="YOUR_TEST_TOKEN">
    </script>
</body>
</html>
```

### 3. Check Console Logs

Open browser DevTools and look for:
- `[Agentman Shopify] Initializing widget v{version}`
- Any error messages

## Rollback Procedure

If you need to rollback to a previous version:

### Using GitHub Actions

1. Check out the previous tag:
   ```bash
   git checkout shopify-v1.0.9
   ```

2. Run the Shopify release workflow with the checked-out version

### Manual Rollback

```bash
# Checkout previous version
git checkout shopify-v1.0.9

# Build and deploy
cd shopify
./deploy-local.sh build
./deploy-gcp.sh deploy
./deploy-gcp.sh invalidate
```

## Monitoring

### Check Deployment Status

```bash
# Current version
curl https://storage.googleapis.com/YOUR_BUCKET/shopify/version.json

# Widget headers (check cache status)
curl -I https://storage.googleapis.com/YOUR_BUCKET/shopify/v1/widget.js
```

### Browser Caching

The widget uses a 5-minute cache (`max-age=300`). After deployment:
- New users get the updated version immediately
- Existing users may see the old version for up to 5 minutes
- Force refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Troubleshooting

### Widget Not Loading

1. Check browser console for errors
2. Verify the script tag has correct attributes
3. Ensure agent token is valid

### Old Version Still Showing

1. Clear browser cache
2. Check CDN cache headers
3. Wait for cache expiration (5 minutes)
4. Add timestamp parameter: `?t=123456789`

### Deployment Failures

1. Check GitHub Actions logs
2. Verify GCP authentication
3. Ensure bucket permissions are correct
4. Check service account roles

### Version Mismatch

If version in widget doesn't match version.json:
1. Rebuild the widget
2. Ensure deploy script completed successfully
3. Check for CDN propagation delays

## Best Practices

1. **Always test with dry run first**
2. **Verify version numbers before deployment**
3. **Monitor the deployment process**
4. **Check the live widget after deployment**
5. **Keep the config tool updated**
6. **Document any manual changes**

## Support

For deployment issues:
1. Check the GitHub Actions run logs
2. Review GCP deployment logs
3. Create an issue with error details
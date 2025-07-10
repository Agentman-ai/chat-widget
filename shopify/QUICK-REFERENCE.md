# Shopify Widget Quick Reference

## 🚀 Common Commands

### Release New Version
```bash
# Navigate to shopify directory first!
cd /path/to/chat-widget/shopify

# One-command release (recommended)
./release.sh patch    # Bug fixes: 1.0.9 → 1.0.10
./release.sh minor    # Features: 1.0.9 → 1.1.0  
./release.sh major    # Breaking: 1.0.9 → 2.0.0
```

### Manual Release Steps
```bash
# 1. Bump version
./bump-version.sh patch

# 2. Build
./deploy-local.sh build

# 3. Deploy
./deploy-gcp.sh deploy

# 4. Clear cache
./deploy-gcp.sh invalidate

# 5. Commit
git add -A && git commit -m "chore: release v1.0.10"
git tag shopify-v1.0.10
git push origin main --tags
```

### Emergency Commands
```bash
# Force cache refresh (when changes aren't showing)
./deploy-gcp.sh invalidate

# Check current deployed version
curl -s https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js | grep "Version:"

# Rollback to previous version
git checkout shopify-v1.0.8
./deploy-local.sh build
./deploy-gcp.sh deploy
```

## 📋 Installation Examples

### Basic Shopify Installation
```html
<script async 
    src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js"
    data-agent-token="YOUR_TOKEN_HERE">
</script>
```

### Custom API Endpoint
```html
<script async 
    src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js"
    data-agent-token="YOUR_TOKEN_HERE"
    data-api-url="https://studio-api.chainoftasks.ai">
</script>
```

### Full Customization
```html
<script async 
    src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js?t={{ 'now' | date: '%s' }}"
    data-agent-token="YOUR_TOKEN_HERE"
    data-api-url="https://studio-api.chainoftasks.ai"
    data-title="{{ shop.name }} Assistant"
    data-toggle-text="Chat with AI"
    data-variant="corner"
    data-position="bottom-right"
    data-bg-color="#ffffff"
    data-text-color="#111827"
    data-button-color="#2563eb"
    data-user-color="#2563eb"
    data-agent-color="#111827"
    data-toggle-bg-color="#2563eb"
    data-toggle-text-color="#ffffff"
    data-welcome-message="Hi! How can I help you today?"
    data-prompt-1="Track my order"
    data-prompt-2="Product help"
    data-prompt-3="Returns"
    data-persistence-enabled="true"
    data-enable-attachments="true">
</script>
```

### Using Shopify Liquid Variables
```html
<script async 
    src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js"
    data-agent-token="YOUR_TOKEN_HERE"
    data-title="{{ shop.name }} Support"
    data-bg-color="{{ settings.colors_background_1 }}"
    data-button-color="{{ settings.colors_accent_1 }}"
    data-text-color="{{ settings.colors_text }}">
</script>
```

## 🔍 Debugging

### Check Widget Version
```javascript
// In browser console
console.log(window.agentmanWidget);

// Check script version
const script = document.querySelector('script[src*="widget.js"]');
console.log('Script found:', script);
console.log('Token:', script?.getAttribute('data-agent-token'));
console.log('API URL:', script?.getAttribute('data-api-url'));
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Widget not appearing | Check agent token is valid |
| Old version showing | Clear cache: `./deploy-gcp.sh invalidate` |
| API connection failed | Verify `data-api-url` is correct |
| Styling not applied | Check color format (use hex: `#ffffff`) |
| Script not loading | Check for syntax errors in HTML |

### Force Reload
```javascript
// Add timestamp to bypass cache
const timestamp = Date.now();
const scriptUrl = `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js?t=${timestamp}`;
```

## 📊 Version Management

### Current Setup
- **Version File**: `version.json`
- **Script Version**: `script-service/index.js` → `SCRIPT_VERSION`
- **Build Header**: Generated during build

### Check All Versions
```bash
# Current version in version.json
cat version.json

# Script service version
grep "SCRIPT_VERSION" script-service/index.js

# Built widget version
grep "Version:" dist/cdn/shopify/v1/widget.js

# Deployed version
curl -s https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js | grep "Version:"
```

## 🔗 Important URLs

### Production
- **Widget**: `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js`
- **Core**: `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/core/chat-widget.js`
- **Config Tool**: `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/config-tool/index.html`
- **Version Info**: `https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/version.json`

### Documentation
- **Installation**: `/shopify/docs/installation.md`
- **Troubleshooting**: `/shopify/docs/troubleshooting.md`
- **Release Guide**: `/shopify/RELEASE-GUIDE.md`

## ⚡ Tips

1. **Always bump version** before building
2. **Test locally** before deploying
3. **Invalidate cache** after deployment
4. **Tag releases** in git for easy rollback
5. **Monitor console** for errors after release

---
*Last Updated: 2025-01-10 | Current Version: 1.0.9*
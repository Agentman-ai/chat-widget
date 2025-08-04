# Release Notes - v4.0.0

## 🚀 Major Release: Streaming by Default

This is a major release that introduces streaming responses as the default behavior across all platforms, along with a unified loading state management system to prevent UI glitches.

### 🎯 Key Features

#### Streaming Responses Now Default
- **Breaking Change**: Streaming is now enabled by default for all new installations
- Provides a more interactive, real-time experience as AI responses appear progressively
- Can be disabled via configuration if needed: `streaming: { enabled: false }`

#### Unified Loading State Management
- Implemented a centralized loading state system to prevent double loading indicators
- Smooth transitions between initial loading (wave animation) and streaming dots (●●●)
- Eliminates UI glitches during message processing

### 💻 Platform Updates

#### Core Widget (v4.0.0)
- Streaming enabled by default in ChatWidget configuration
- New `UnifiedLoadingManager` class for centralized loading state control
- Updated TypeScript types to make `streaming.enabled` optional (defaults to true)
- Enhanced event system for loading state transitions

#### WordPress Plugin (v4.0.0)
- Added "Enable Streaming Responses" toggle in admin settings (checked by default)
- Streaming configuration automatically included in widget initialization
- Full backward compatibility - existing installations will have streaming enabled

#### Shopify Integration (v4.0.0)
- Added streaming toggle in configuration tool's Advanced section
- Script service updated to support streaming configuration
- CDN deployment updated to v2 path structure

#### Wix Integration (v4.0.0)
- Added streaming toggle switch in Advanced settings tab
- Configuration tool generates code with streaming enabled by default
- Full support for streaming configuration in embed code

### 🔧 Technical Details

#### Loading State Transitions
```
NONE → INITIAL (wave animation) → STREAMING (dots) → NONE
```

#### Configuration Example
```javascript
// Streaming is enabled by default
const widget = new ChatWidget({
  agentToken: 'your-token',
  // streaming: { enabled: true } // This is the default
});

// To disable streaming
const widget = new ChatWidget({
  agentToken: 'your-token',
  streaming: { enabled: false }
});
```

### 📦 Migration Guide

#### For Existing Users
- No action required - streaming will be automatically enabled after update
- To maintain non-streaming behavior, explicitly set `streaming: { enabled: false }`

#### For Platform Integrations
- WordPress: Check admin settings after update, streaming toggle will be enabled
- Shopify: Regenerate configuration if using the config tool
- Wix: Regenerate embed code if using the config tool

### 🐛 Bug Fixes
- Fixed double loading indicator issue when streaming starts
- Resolved race condition between wave animation and streaming dots
- Improved loading state cleanup on errors

### 📝 Documentation Updates
- Updated all documentation to reflect streaming as default behavior
- Added streaming configuration examples to all platform guides
- Updated demo files with streaming toggle options

### ⚠️ Breaking Changes
1. **Default Behavior**: Streaming is now enabled by default
2. **Version Jump**: Major version bump to v4.0.0 across all packages
3. **CDN Path**: Shopify users should use v2 path for new features

### 🔄 Upgrade Instructions

#### NPM Package
```bash
npm install @agentman/chat-widget@^4.0.0
```

#### CDN Users
```html
<!-- Updated URL with v4 -->
<script src="https://cdn.jsdelivr.net/npm/@agentman/chat-widget@4/dist/index.js"></script>
```

#### Shopify
```html
<!-- Use v2 path for latest features -->
<script async 
  src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v2/widget.js"
  data-agent-token="YOUR_TOKEN">
</script>
```

### 🙏 Acknowledgments
This release includes improvements based on user feedback about loading indicators and streaming experience. Thank you to our community for helping make the widget better!

---

**Full Changelog**: [v3.0.10...v4.0.0](https://github.com/agentman-ai/chat-widget/compare/v3.0.10...v4.0.0)
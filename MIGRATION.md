# Migration Guide: v0.x to v1.0

## Overview

Version 1.0.0 introduces a major refactor with a new service-oriented architecture and welcome screen functionality. While we've maintained backward compatibility where possible, there are some important changes to be aware of.

## Breaking Changes

### 1. **Welcome Screen by Default**
The widget now shows a welcome screen when users first open it, instead of immediately showing the conversation view.

**To disable welcome screen and maintain v0.x behavior:**
```javascript
const widget = new ChatWidget({
  // ... your config
  showWelcomeScreen: false
});
```

### 2. **File Attachments Enabled by Default**
File attachments are now enabled by default. 

**To disable attachments:**
```javascript
const widget = new ChatWidget({
  // ... your config
  enableAttachments: false
});
```

### 3. **Floating Prompts**
New floating prompt bubbles appear when the widget is closed (corner variant only).

**To disable floating prompts:**
```javascript
const widget = new ChatWidget({
  // ... your config
  floatingPromptsEnabled: false
});
```

## New Features

### 1. **Welcome Screen Configuration**
```javascript
const widget = new ChatWidget({
  // ... your config
  showWelcomeScreen: true,           // Enable welcome screen
  showWelcomeMinimize: true,         // Show minimize button on welcome screen
  floatingPromptsEnabled: true,      // Show floating prompts when closed
  floatingPromptsDelay: 5000,        // Delay before showing prompts (ms)
});
```

### 2. **Direct Conversation Restore**
When users with existing conversations click the closed widget button, they now go directly to their last conversation instead of the welcome screen.

### 3. **Enhanced Message Prompts**
Message prompts now appear in multiple locations:
- Welcome screen (below centered input)
- Floating bubbles (when widget is closed)
- Conversation view (above input field)

## API Compatibility

### Unchanged APIs
- All configuration options from v0.x still work
- Event handlers remain the same
- Theme customization is backward compatible
- Persistence settings unchanged

### Deprecated Features
None - all v0.x features are still supported.

## WordPress Plugin Users

The WordPress plugin has been updated to v0.26.0 with new settings:
1. Update the plugin through WordPress admin
2. New settings available in Settings → Agentman AI Assistant → Content tab
3. Configure welcome screen options as desired

## Shopify Integration Users

The Shopify script has been updated to v1.0.19:
1. No action required - changes are automatic
2. New data attributes available for customization:
   - `data-show-welcome-screen="true"`
   - `data-floating-prompts-enabled="true"`
   - `data-floating-prompts-delay="5000"`

## CDN Users

### Update CDN URL

**Old URL (v0.x):**
```html
<script src="https://cdn.agentman.ai/chat-widget.js"></script>
```

**New URL (v1.x):**
```html
<!-- Recommended: Always latest -->
<script src="https://cdn.agentman.ai/chat-widget/latest/chat-widget.min.js"></script>

<!-- Or specific version -->
<script src="https://cdn.agentman.ai/chat-widget/1.0.0/chat-widget.min.js"></script>

<!-- Or stay on v0.x -->
<script src="https://cdn.agentman.ai/chat-widget/v1/chat-widget.min.js"></script>
```

## Rollback Instructions

If you need to rollback to v0.x:

### NPM Users:
```bash
npm install @agentman/chat-widget@0.26.0
```

### CDN Users:
```html
<script src="https://cdn.agentman.ai/chat-widget/v1/chat-widget.min.js"></script>
```

### WordPress Users:
1. Download v0.25.0 from [releases](https://github.com/Agentman-ai/chat-widget/releases)
2. Upload via WordPress admin

## Support

For questions or issues:
- GitHub Issues: https://github.com/Agentman-ai/chat-widget/issues
- Documentation: https://docs.agentman.ai/chat-widget

## Changelog Highlights

### v1.0.0 (2024-01-18)
- ✨ Added welcome screen with centered input interface
- 🎈 Added floating prompts when widget is closed
- 💬 Direct conversation restore on widget click
- 📎 File attachments enabled by default
- 🏗️ Refactored to service-oriented architecture
- 🎨 Enhanced theming system
- 🐛 Fixed conversation persistence issues
- ⚡ Improved performance and state management
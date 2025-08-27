# Wix Integration Implementation Guide

## Overview

This document outlines the implementation strategy for integrating the Agentman ChatWidget with Wix websites. Based on our WordPress plugin experience, we've identified two primary approaches with Phase 1 being the recommended starting point.

## Implementation Phases

### Phase 1: HTML Widget Approach (Recommended Start)
**Timeline**: 2-3 days  
**Complexity**: Low  
**Risk**: Low  

### Phase 2: Wix App Development (Future)
**Timeline**: 2-3 weeks  
**Complexity**: High  
**Risk**: Medium (approval process)

## Phase 1: HTML Widget Implementation

### Architecture Overview

```
wix-integration/
├── config-tool/           # Web-based configuration generator
│   ├── index.html         # Main configuration interface
│   ├── styles.css         # Configuration tool styling
│   ├── script.js          # Configuration logic
│   └── preview.html       # Live preview iframe
├── wix-bundle.js          # Bundle generation script
├── templates/             # Pre-built configurations
│   ├── default.json       # Default Wix configuration
│   ├── ecommerce.json     # E-commerce optimized
│   └── professional.json  # Professional services
└── docs/                  # Documentation
    ├── installation.md    # Step-by-step guide
    ├── troubleshooting.md # Common issues
    └── examples/          # Code examples
```

### Configuration Capabilities

The Wix HTML widget provides **90% of WordPress functionality** with full configuration control:

#### ✅ Full Control Available
- **Theme Colors**: All 9 simplified theme properties
- **Widget Behavior**: Position, variant, dimensions
- **Content**: Messages, prompts, placeholders
- **Advanced Features**: Persistence, icons, branding
- **API Settings**: Token, URL, custom endpoints
- **AI Disclaimer**: Configurable disclaimer message with optional link

#### ❌ Limitations vs WordPress
- No native admin interface (external config tool)
- Manual installation (copy/paste vs one-click)
- No automatic updates
- No server-side settings storage

#### AI Disclaimer Configuration
The widget supports displaying an AI disclaimer to inform users that responses are AI-generated:

```javascript
disclaimer: {
    enabled: true,                        // Enable/disable disclaimer
    message: 'AI-generated responses',    // Disclaimer text
    linkText: 'Learn more',              // Optional link text
    linkUrl: 'https://your-site.com/ai-policy' // Optional link URL
}
```

When enabled, the disclaimer appears:
- In the welcome screen below the main message
- Next to "Powered by Agentman" in the conversation view
- With optional link to your AI usage policy or terms

### Technical Implementation

#### 1. Configuration Tool Interface

**Main Configuration Form** (`config-tool/index.html`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agentman Widget - Wix Configuration Tool</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Configure Agentman Widget for Wix</h1>
            <p>Generate custom embed code for your Wix website</p>
        </header>

        <div class="config-tabs">
            <button class="tab-btn active" data-tab="basic">Basic Setup</button>
            <button class="tab-btn" data-tab="appearance">Appearance</button>
            <button class="tab-btn" data-tab="content">Content</button>
            <button class="tab-btn" data-tab="advanced">Advanced</button>
            <button class="tab-btn" data-tab="preview">Preview & Code</button>
        </div>

        <!-- Basic Setup Tab -->
        <div class="tab-content active" id="basic">
            <h3>🔑 Basic Configuration</h3>
            
            <div class="form-group">
                <label for="agentToken">Agent Token *</label>
                <input type="text" id="agentToken" placeholder="Your Agentman token" required>
                <small>Get your token from <a href="https://studio.agentman.ai" target="_blank">Agentman Studio</a></small>
            </div>

            <div class="form-group">
                <label for="variant">Widget Style</label>
                <select id="variant">
                    <option value="corner">Corner (floating button)</option>
                    <option value="inline">Inline (embedded in page)</option>
                    <option value="centered">Centered overlay</option>
                </select>
            </div>

            <div class="form-group">
                <label for="position">Position (for corner variant)</label>
                <select id="position">
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                </select>
            </div>
        </div>

        <!-- Appearance Tab -->
        <div class="tab-content" id="appearance">
            <h3>🎨 Appearance Customization</h3>
            
            <div class="color-grid">
                <div class="color-field">
                    <label for="buttonColor">Primary Color</label>
                    <input type="color" id="buttonColor" value="#2563eb">
                </div>
                <div class="color-field">
                    <label for="backgroundColor">Background</label>
                    <input type="color" id="backgroundColor" value="#ffffff">
                </div>
                <div class="color-field">
                    <label for="textColor">Text Color</label>
                    <input type="color" id="textColor" value="#111827">
                </div>
                <div class="color-field">
                    <label for="agentForegroundColor">Assistant Text</label>
                    <input type="color" id="agentForegroundColor" value="#111827">
                </div>
                <div class="color-field">
                    <label for="userForegroundColor">User Text</label>
                    <input type="color" id="userForegroundColor" value="#2563eb">
                </div>
            </div>

            <div class="form-group">
                <label for="title">Widget Title</label>
                <input type="text" id="title" value="AI Assistant">
            </div>

            <div class="form-group">
                <label for="toggleText">Toggle Button Text</label>
                <input type="text" id="toggleText" value="Ask Agentman">
            </div>
        </div>

        <!-- More tabs... -->

        <!-- Preview & Code Tab -->
        <div class="tab-content" id="preview">
            <h3>👀 Live Preview</h3>
            
            <div class="preview-section">
                <iframe id="preview-frame" src="preview.html"></iframe>
                <button onclick="updatePreview()" class="btn-primary">Update Preview</button>
            </div>

            <div class="code-section">
                <h4>Generated Code for Wix</h4>
                <div class="code-actions">
                    <button onclick="generateCode()" class="btn-primary">Generate Code</button>
                    <button onclick="copyToClipboard()" class="btn-secondary">📋 Copy</button>
                    <button onclick="downloadCode()" class="btn-secondary">💾 Download</button>
                </div>
                <textarea id="generated-code" readonly placeholder="Click 'Generate Code' to create your embed code"></textarea>
            </div>

            <div class="installation-guide">
                <h4>📋 Installation Instructions</h4>
                <ol>
                    <li>Copy the generated code above</li>
                    <li>In Wix Editor, go to Add → Embed → HTML iframe</li>
                    <li>Paste the code into the HTML Settings</li>
                    <li>Adjust iframe size if needed</li>
                    <li>Publish your site</li>
                </ol>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

#### 2. Configuration Logic (`config-tool/script.js`):
```javascript
class WixConfigTool {
    constructor() {
        this.config = this.getDefaultConfig();
        this.initEventListeners();
        this.loadSavedConfig();
    }

    getDefaultConfig() {
        return {
            // Required
            agentToken: '',
            containerId: 'agentman-chat-wix',
            
            // Widget behavior
            variant: 'corner',
            position: 'bottom-right',
            initialHeight: '600px',
            initialWidth: '400px',
            title: 'AI Assistant',
            placeholder: 'Ask me anything...',
            toggleText: 'Ask Agentman',
            initiallyOpen: false,
            
            // Theme
            theme: {
                backgroundColor: '#ffffff',
                textColor: '#111827',
                buttonColor: '#2563eb',
                buttonTextColor: '#ffffff',
                agentForegroundColor: '#111827',
                userForegroundColor: '#2563eb',
                toggleBackgroundColor: '#2563eb',
                toggleTextColor: '#ffffff',
                toggleIconColor: '#ffffff'
            },
            
            // Content
            initialMessage: 'Hello! How can I help you today?',
            messagePrompts: {
                show: true,
                welcome_message: 'How can I help you today?',
                prompts: [
                    'What can you do?',
                    'Help me get started',
                    'Tell me about your services'
                ]
            },
            
            // Advanced
            persistence: {
                enabled: true,
                days: 7
            },
            
            // Streaming (enabled by default)
            streaming: {
                enabled: true
            },
            
            icons: {
                agentIcon: '',
                userIcon: ''
            },
        };
    }

    generateCode() {
        this.updateConfigFromForm();
        
        const code = `<!-- Agentman Chat Widget for Wix -->
<div id="${this.config.containerId}" style="position: relative; z-index: 100000;"></div>

<script src="https://cdn.jsdelivr.net/npm/@agentman/chat-widget@latest/dist/index.js"></script>

<script>
(function() {
    // Wait for ChatWidget to load
    function initWidget() {
        if (typeof window.ChatWidget === 'undefined') {
            setTimeout(initWidget, 100);
            return;
        }
        
        // Wix-specific optimizations
        const wixConfig = {
            ...${JSON.stringify(this.config, null, 12)},
            
            // Wix-specific CSS isolation
            cssIsolation: true,
            
            // Higher z-index for Wix compatibility
            zIndexBase: 100000
        };
        
        // Initialize widget
        const widget = new window.ChatWidget(wixConfig);
        
        // Wix-specific event handling
        if (window.wixDevelopersAnalytics) {
            window.wixDevelopersAnalytics.reportBI({
                src: 31, // Widget loaded
                evid: 'agentman_widget_loaded'
            });
        }
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
</script>

<!-- End Agentman Chat Widget -->`;

        document.getElementById('generated-code').value = code;
        this.saveConfig();
    }

    updatePreview() {
        this.updateConfigFromForm();
        const previewFrame = document.getElementById('preview-frame');
        previewFrame.contentWindow.postMessage({
            type: 'updateConfig',
            config: this.config
        }, '*');
    }

    copyToClipboard() {
        const code = document.getElementById('generated-code');
        code.select();
        document.execCommand('copy');
        this.showToast('Code copied to clipboard!');
    }

    downloadCode() {
        const code = document.getElementById('generated-code').value;
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agentman-wix-widget.html';
        a.click();
        URL.revokeObjectURL(url);
    }

    // ... more methods
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WixConfigTool();
});
```

#### 3. Bundle Generation Script (`wix-bundle.js`):
```javascript
/**
 * Wix Bundle Script for Agentman Chat Widget
 * 
 * Generates Wix-optimized bundle with specific considerations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
    sourceDir: path.resolve(__dirname),
    outputDir: path.resolve(__dirname, 'wix-dist'),
    bundleFileName: 'agentman-wix-widget.js',
    version: require('./package.json').version,
};

console.log('🚀 Starting Wix bundle process');

// Create Wix-specific webpack config
const wixWebpackConfig = `
const path = require('path');

module.exports = {
    entry: './index.ts',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\\.svg$/,
                type: 'asset/source'
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '${CONFIG.bundleFileName}',
        path: path.resolve(__dirname, 'wix-dist'),
        library: {
            name: 'AgentmanWidget',
            type: 'umd',
            export: 'ChatWidget'
        },
        globalObject: 'typeof self !== "undefined" ? self : this',
        umdNamedDefine: true
    },
    optimization: {
        minimize: true
    },
    // Wix-specific externals and configurations
    externals: {
        // Exclude any Wix-specific libraries if needed
    }
};
`;

// Generate bundle
fs.writeFileSync('webpack.wix.config.js', wixWebpackConfig);

try {
    execSync('npx webpack --config webpack.wix.config.js', { stdio: 'inherit' });
    console.log('✅ Wix bundle created successfully');
} catch (error) {
    console.error('❌ Wix bundle failed:', error.message);
    process.exit(1);
}

// Cleanup
fs.unlinkSync('webpack.wix.config.js');
console.log('✨ Wix bundle process completed');
```

### Wix-Specific Optimizations

#### CSS Isolation
```css
/* Wix-specific CSS to prevent conflicts */
.agentman-widget-wix {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    z-index: 100000 !important;
}

.agentman-widget-wix * {
    box-sizing: border-box;
    font-family: inherit;
}

/* Wix mobile responsiveness */
@media (max-width: 768px) {
    .agentman-widget-wix.corner-variant {
        bottom: 20px !important;
        right: 20px !important;
    }
}
```

#### JavaScript Optimizations
```javascript
// Wix environment detection
const WixUtils = {
    isWixSite() {
        return typeof window.wixDevelopersAnalytics !== 'undefined' ||
               document.querySelector('[data-wix-code]') !== null;
    },

    getWixViewMode() {
        if (window.wixDevelopersAnalytics) {
            return window.wixDevelopersAnalytics.getViewMode?.() || 'site';
        }
        return 'site';
    },

    optimizeForWix(config) {
        if (!this.isWixSite()) return config;

        return {
            ...config,
            // Higher z-index for Wix
            zIndexBase: 100000,
            // Wix-specific positioning
            offsetBottom: 20,
            offsetRight: 20,
            // Performance optimizations
            lazyLoad: true,
            debounceResize: 300
        };
    }
};
```

### Templates and Presets

#### Default Template (`templates/default.json`):
```json
{
    "name": "Default Wix Configuration",
    "description": "Standard configuration optimized for most Wix sites",
    "config": {
        "variant": "corner",
        "position": "bottom-right",
        "theme": {
            "backgroundColor": "#ffffff",
            "textColor": "#111827",
            "buttonColor": "#2563eb",
            "buttonTextColor": "#ffffff",
            "agentForegroundColor": "#111827",
            "userForegroundColor": "#2563eb",
            "toggleBackgroundColor": "#2563eb",
            "toggleTextColor": "#ffffff",
            "toggleIconColor": "#ffffff"
        },
        "messagePrompts": {
            "show": true,
            "welcome_message": "How can I help you today?",
            "prompts": [
                "What can you do?",
                "Help me get started",
                "Tell me about your services"
            ]
        }
    }
}
```

## Phase 2: Wix App Development

### App Architecture
```
wix-app/
├── backend/                 # Wix app backend (Node.js)
│   ├── src/
│   │   ├── config/         # App configuration
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── webhooks/       # Wix webhooks
│   └── package.json
├── dashboard/              # Wix dashboard widgets
│   ├── settings-panel/    # Settings configuration
│   ├── widget-panel/      # Widget management
│   └── analytics-panel/   # Usage analytics
└── frontend/              # Widget frontend
    ├── widget/            # Chat widget
    └── embed/             # Embed scripts
```

### Wix App Benefits
- **Native Integration**: Proper Wix dashboard integration
- **Automatic Updates**: Via Wix App Market
- **Revenue Stream**: Paid app with subscription model
- **Professional Distribution**: Wix App Market visibility

### Development Requirements
- Wix Developer Account
- Node.js backend for app configuration
- Wix SDK integration
- App Market submission and approval

## Implementation Roadmap

### Immediate (Phase 1 - Week 1)
1. **Day 1-2**: Create configuration tool interface
2. **Day 2-3**: Implement Wix-specific optimizations
3. **Day 3**: Testing on various Wix templates
4. **Day 3**: Documentation and tutorials

### Future (Phase 2 - Month 2-3)
1. **Week 1-2**: Wix app backend development
2. **Week 3**: Dashboard widget creation
3. **Week 4**: Testing and refinement
4. **Week 5-6**: App Store submission process

## Success Metrics

### Phase 1 Targets
- **Adoption**: 50+ Wix sites using HTML widget in first month
- **Configuration**: 90%+ users successfully configuring widget
- **Support**: <5% support ticket rate for installation issues

### Phase 2 Targets
- **App Store**: Approved in Wix App Market
- **Downloads**: 100+ installations in first month
- **Revenue**: Break-even on development costs within 6 months

## Technical Considerations

### Performance
- Bundle size optimization for Wix (target <50KB)
- Lazy loading to prevent Wix site slowdown
- CDN delivery for global performance

### Compatibility
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness on Wix mobile sites
- Wix template compatibility testing

### Security
- CSP (Content Security Policy) compliance
- XSS prevention in user configurations
- HTTPS enforcement for all assets

## Files to Create

1. **`config-tool/index.html`** - Main configuration interface
2. **`config-tool/styles.css`** - Configuration tool styling
3. **`config-tool/script.js`** - Configuration logic
4. **`config-tool/preview.html`** - Live preview page
5. **`wix-bundle.js`** - Bundle generation script
6. **`templates/`** - Configuration presets
7. **`docs/installation.md`** - User installation guide
8. **`docs/troubleshooting.md`** - Common issues and solutions

## Next Steps

When ready to implement:

1. **Review this document** and current ChatWidget state
2. **Create config-tool directory** structure
3. **Implement configuration interface** with live preview
4. **Test on sample Wix sites** across different templates
5. **Create documentation** and tutorials
6. **Launch Phase 1** and gather user feedback
7. **Evaluate Phase 2** based on adoption and feedback

---

*This document serves as the complete implementation guide for Wix integration. Update as needed based on ChatWidget changes and Wix platform updates.*
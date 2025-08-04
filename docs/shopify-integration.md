# Shopify Integration Guide - Phase 1 (Direct Connection)

## Overview

This document outlines the implementation for integrating the Agentman ChatWidget with Shopify stores using a direct connection approach. This simplified method is designed for the first 5-10 pilot customers before building a full marketplace app.

**Key Architecture Decision**: No intermediate backend - the widget connects directly to the agent runtime using the agentToken, exactly like the web ChatWidget.

## Implementation Strategy

### Script Tag Service Approach

We'll create a hosted script service that Shopify store owners can add with a single script tag. This provides:
- Full configuration capabilities matching WordPress
- One-link installation for store owners
- Easy updates without store owner intervention
- Direct agent runtime connection

## Directory Structure

```
shopify-integration/
├── script-service/              # Hosted script service
│   ├── index.js                # Main script entry point
│   ├── config-generator.js     # Configuration generator
│   └── shopify-loader.js       # Shopify-specific loader
├── config-tool/                # Web-based configuration tool
│   ├── index.html              # Configuration interface
│   ├── styles.css              # Tool styling
│   ├── script.js               # Configuration logic
│   └── templates/              # Configuration templates
│       ├── default.json        # Default settings
│       ├── ecommerce.json      # E-commerce optimized
│       └── support.json        # Customer support focused
├── cdn/                        # CDN deployment files
│   ├── deploy.sh               # Deployment script
│   └── versions/               # Version management
└── docs/                       # Documentation
    ├── installation.md         # Store owner guide
    ├── configuration.md        # Configuration guide
    └── troubleshooting.md      # Common issues
```

## Technical Implementation

### 1. Script Tag Service (`script-service/index.js`)

```javascript
/**
 * Shopify Script Tag Service for Agentman ChatWidget
 * Provides direct agent runtime connection without backend
 */

(function() {
    'use strict';
    
    // Extract configuration from script tag
    const currentScript = document.currentScript;
    const configId = currentScript.getAttribute('data-config-id');
    const agentToken = currentScript.getAttribute('data-agent-token');
    
    // Default configuration matching WordPress feature parity
    const defaultConfig = {
        // Required
        agentToken: agentToken || '',
        containerId: 'agentman-chat-shopify',
        
        // Widget behavior
        variant: 'corner',
        position: 'bottom-right',
        initialHeight: '600px',
        initialWidth: '400px',
        title: 'AI Assistant',
        placeholder: 'Ask me anything...',
        toggleText: 'Ask Agentman',
        initiallyOpen: false,
        
        // Theme (matching WordPress options)
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
                'Track my order',
                'Product information',
                'Return policy'
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
        
        // Shopify-specific
        shopifyIntegration: {
            customerData: true,
            cartSync: true,
            orderLookup: true
        }
    };
    
    // Load configuration
    function loadConfiguration() {
        if (configId) {
            // Load from configuration service
            return fetch(`https://config.agentman.ai/shopify/${configId}`)
                .then(response => response.json())
                .catch(() => defaultConfig);
        }
        return Promise.resolve(defaultConfig);
    }
    
    // Initialize widget
    function initializeWidget(config) {
        // Create container
        const container = document.createElement('div');
        container.id = config.containerId;
        document.body.appendChild(container);
        
        // Load ChatWidget script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@agentman/chat-widget@latest/dist/index.js';
        script.onload = function() {
            // Wait for ChatWidget to be available
            function tryInit() {
                if (typeof window.ChatWidget !== 'undefined') {
                    // Add Shopify-specific data if available
                    if (window.Shopify && config.shopifyIntegration.customerData) {
                        config.metadata = {
                            platform: 'shopify',
                            shop: window.Shopify.shop,
                            customer: window.ShopifyAnalytics?.meta?.page?.customerId || null,
                            cart: window.Shopify.cart || null
                        };
                    }
                    
                    // Initialize widget
                    window.agentmanWidget = new window.ChatWidget(config);
                    
                    // Shopify-specific enhancements
                    if (config.shopifyIntegration.cartSync) {
                        setupCartSync();
                    }
                } else {
                    setTimeout(tryInit, 100);
                }
            }
            tryInit();
        };
        document.head.appendChild(script);
    }
    
    // Shopify cart synchronization
    function setupCartSync() {
        if (window.Shopify && window.Shopify.onCartUpdate) {
            window.Shopify.onCartUpdate = function(cart) {
                if (window.agentmanWidget) {
                    window.agentmanWidget.updateMetadata({
                        cart: cart
                    });
                }
            };
        }
    }
    
    // Start initialization
    loadConfiguration().then(initializeWidget);
})();
```

### 2. Configuration Tool (`config-tool/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agentman Widget Configuration for Shopify</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Configure Agentman Widget for Shopify</h1>
            <p>Set up your AI assistant with the same options as WordPress</p>
        </header>

        <div class="config-sections">
            <!-- Step 1: Agent Token -->
            <section class="config-section active" data-step="1">
                <h2>Step 1: Agent Token</h2>
                <div class="form-group">
                    <label for="agentToken">Agent Token *</label>
                    <input type="text" id="agentToken" placeholder="Your Agentman token" required>
                    <small>Get your token from <a href="https://studio.agentman.ai" target="__blank">Agentman Studio</a></small>
                </div>
                <button class="btn-next" onclick="nextStep()">Next →</button>
            </section>

            <!-- Step 2: Appearance -->
            <section class="config-section" data-step="2">
                <h2>Step 2: Appearance</h2>
                
                <div class="form-group">
                    <label>Widget Style</label>
                    <select id="variant">
                        <option value="corner">Corner (floating button)</option>
                        <option value="inline">Inline (embedded)</option>
                        <option value="centered">Centered overlay</option>
                    </select>
                </div>

                <div class="form-group" id="positionGroup">
                    <label>Position</label>
                    <select id="position">
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                    </select>
                </div>

                <h3>Colors</h3>
                <div class="color-grid">
                    <div class="color-input">
                        <label>Primary Color</label>
                        <input type="color" id="buttonColor" value="#2563eb">
                    </div>
                    <div class="color-input">
                        <label>Background</label>
                        <input type="color" id="backgroundColor" value="#ffffff">
                    </div>
                    <div class="color-input">
                        <label>Text Color</label>
                        <input type="color" id="textColor" value="#111827">
                    </div>
                </div>

                <div class="nav-buttons">
                    <button class="btn-prev" onclick="prevStep()">← Back</button>
                    <button class="btn-next" onclick="nextStep()">Next →</button>
                </div>
            </section>

            <!-- Step 3: Content -->
            <section class="config-section" data-step="3">
                <h2>Step 3: Content & Messages</h2>
                
                <div class="form-group">
                    <label>Widget Title</label>
                    <input type="text" id="title" value="AI Assistant">
                </div>

                <div class="form-group">
                    <label>Input Placeholder</label>
                    <input type="text" id="placeholder" value="Ask me anything...">
                </div>

                <div class="form-group">
                    <label>Initial Message</label>
                    <textarea id="initialMessage" rows="3">Hello! How can I help you today?</textarea>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" id="showPrompts" checked>
                        Show Quick Prompts
                    </label>
                </div>

                <div id="promptsSection">
                    <label>Quick Prompts (Shopify-optimized)</label>
                    <input type="text" id="prompt1" value="Track my order" placeholder="Prompt 1">
                    <input type="text" id="prompt2" value="Product information" placeholder="Prompt 2">
                    <input type="text" id="prompt3" value="Return policy" placeholder="Prompt 3">
                </div>

                <div class="nav-buttons">
                    <button class="btn-prev" onclick="prevStep()">← Back</button>
                    <button class="btn-next" onclick="nextStep()">Next →</button>
                </div>
            </section>

            <!-- Step 4: Advanced -->
            <section class="config-section" data-step="4">
                <h2>Step 4: Advanced Settings</h2>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="persistenceEnabled" checked>
                        Enable Conversation Persistence
                    </label>
                    <small>Save conversations across page loads</small>
                </div>

                <div class="form-group">
                    <label>Persistence Duration</label>
                    <input type="number" id="persistenceDays" value="7" min="1" max="30"> days
                </div>

                <h3>Shopify Integration</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="customerData" checked>
                        Include Customer Data
                    </label>
                    <small>Pass customer ID for personalized responses</small>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" id="cartSync" checked>
                        Sync Cart Information
                    </label>
                    <small>Allow AI to see cart contents</small>
                </div>

                <div class="nav-buttons">
                    <button class="btn-prev" onclick="prevStep()">← Back</button>
                    <button class="btn-primary" onclick="generateInstallation()">Generate Installation</button>
                </div>
            </section>

            <!-- Step 5: Installation -->
            <section class="config-section" data-step="5">
                <h2>Installation Instructions</h2>
                
                <div class="installation-method">
                    <h3>Method 1: Quick Install (Recommended)</h3>
                    <p>Copy this script tag and add it to your theme's <code>theme.liquid</code> file, just before the closing <code>&lt;/body&gt;</code> tag:</p>
                    
                    <div class="code-block">
                        <code id="scriptTag"></code>
                        <button onclick="copyScriptTag()" class="btn-copy">Copy</button>
                    </div>
                </div>

                <div class="installation-method">
                    <h3>Method 2: Configuration Link</h3>
                    <p>Share this link with store owners for one-click installation:</p>
                    
                    <div class="code-block">
                        <code id="installLink"></code>
                        <button onclick="copyInstallLink()" class="btn-copy">Copy Link</button>
                    </div>
                </div>

                <div class="detailed-steps">
                    <h3>Detailed Installation Steps:</h3>
                    <ol>
                        <li>Go to your Shopify Admin</li>
                        <li>Navigate to Online Store → Themes</li>
                        <li>Click "Actions" → "Edit code" on your current theme</li>
                        <li>Find and open <code>layout/theme.liquid</code></li>
                        <li>Paste the script tag just before <code>&lt;/body&gt;</code></li>
                        <li>Save the file</li>
                        <li>The widget will appear on your store immediately</li>
                    </ol>
                </div>

                <div class="nav-buttons">
                    <button class="btn-prev" onclick="prevStep()">← Back</button>
                    <button class="btn-primary" onclick="startOver()">Configure Another</button>
                </div>
            </section>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

### 3. Configuration Script (`config-tool/script.js`)

```javascript
class ShopifyConfigTool {
    constructor() {
        this.currentStep = 1;
        this.config = {};
        this.init();
    }

    init() {
        // Initialize event listeners
        document.getElementById('variant').addEventListener('change', (e) => {
            const positionGroup = document.getElementById('positionGroup');
            positionGroup.style.display = e.target.value === 'corner' ? 'block' : 'none';
        });

        document.getElementById('showPrompts').addEventListener('change', (e) => {
            const promptsSection = document.getElementById('promptsSection');
            promptsSection.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    nextStep() {
        if (this.validateStep(this.currentStep)) {
            this.saveStepData(this.currentStep);
            this.currentStep++;
            this.showStep(this.currentStep);
        }
    }

    prevStep() {
        this.currentStep--;
        this.showStep(this.currentStep);
    }

    showStep(step) {
        document.querySelectorAll('.config-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelector(`[data-step="${step}"]`).classList.add('active');
    }

    validateStep(step) {
        switch(step) {
            case 1:
                const token = document.getElementById('agentToken').value;
                if (!token) {
                    alert('Please enter your Agent Token');
                    return false;
                }
                return true;
            default:
                return true;
        }
    }

    saveStepData(step) {
        switch(step) {
            case 1:
                this.config.agentToken = document.getElementById('agentToken').value;
                break;
            case 2:
                this.config.variant = document.getElementById('variant').value;
                this.config.position = document.getElementById('position').value;
                this.config.theme = {
                    buttonColor: document.getElementById('buttonColor').value,
                    backgroundColor: document.getElementById('backgroundColor').value,
                    textColor: document.getElementById('textColor').value,
                    // ... other colors
                };
                break;
            case 3:
                this.config.title = document.getElementById('title').value;
                this.config.placeholder = document.getElementById('placeholder').value;
                this.config.initialMessage = document.getElementById('initialMessage').value;
                this.config.messagePrompts = {
                    show: document.getElementById('showPrompts').checked,
                    prompts: [
                        document.getElementById('prompt1').value,
                        document.getElementById('prompt2').value,
                        document.getElementById('prompt3').value
                    ].filter(p => p)
                };
                break;
            case 4:
                this.config.persistence = {
                    enabled: document.getElementById('persistenceEnabled').checked,
                    days: parseInt(document.getElementById('persistenceDays').value)
                };
                this.config.shopifyIntegration = {
                    customerData: document.getElementById('customerData').checked,
                    cartSync: document.getElementById('cartSync').checked
                };
                break;
        }
    }

    generateInstallation() {
        this.saveStepData(4);
        
        // Generate script tag
        const scriptTag = `<script src="https://cdn.agentman.ai/shopify/v1/widget.js" data-agent-token="${this.config.agentToken}"></script>`;
        
        // Generate installation link
        const configData = btoa(JSON.stringify(this.config));
        const installLink = `https://install.agentman.ai/shopify?config=${configData}`;
        
        document.getElementById('scriptTag').textContent = scriptTag;
        document.getElementById('installLink').textContent = installLink;
        
        this.currentStep = 5;
        this.showStep(5);
    }

    copyScriptTag() {
        const scriptTag = document.getElementById('scriptTag').textContent;
        navigator.clipboard.writeText(scriptTag).then(() => {
            this.showToast('Script tag copied to clipboard!');
        });
    }

    copyInstallLink() {
        const link = document.getElementById('installLink').textContent;
        navigator.clipboard.writeText(link).then(() => {
            this.showToast('Installation link copied!');
        });
    }

    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    startOver() {
        this.currentStep = 1;
        this.config = {};
        this.showStep(1);
        // Reset form
        document.querySelectorAll('input, textarea, select').forEach(el => {
            if (el.type === 'checkbox') {
                el.checked = el.hasAttribute('checked');
            } else {
                el.value = el.defaultValue;
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.shopifyConfig = new ShopifyConfigTool();
});

// Global functions for onclick handlers
function nextStep() { window.shopifyConfig.nextStep(); }
function prevStep() { window.shopifyConfig.prevStep(); }
function generateInstallation() { window.shopifyConfig.generateInstallation(); }
function copyScriptTag() { window.shopifyConfig.copyScriptTag(); }
function copyInstallLink() { window.shopifyConfig.copyInstallLink(); }
function startOver() { window.shopifyConfig.startOver(); }
```

### 4. Installation Guide (`docs/installation.md`)

```markdown
# Shopify Installation Guide

## Quick Start (For Store Owners)

### Option 1: Script Tag Installation

1. Copy the provided script tag from your configuration
2. In Shopify Admin, go to **Online Store → Themes**
3. Click **Actions → Edit code** on your current theme
4. Open `layout/theme.liquid`
5. Paste the script tag just before `</body>`
6. Save the file

### Option 2: One-Click Installation Link

If provided with an installation link:
1. Click the installation link
2. Follow the on-screen instructions
3. Authorize the installation when prompted

## Configuration

All configuration is handled through the script tag attributes:
- `data-agent-token`: Your unique agent token (required)
- `data-config-id`: Configuration ID for advanced settings

## Features Available

✅ **Full WordPress Feature Parity**:
- All theme customization options
- Message prompts and welcome messages
- Conversation persistence
- Position and style variants
- Custom colors and branding

✅ **Shopify-Specific Features**:
- Customer data integration
- Cart synchronization
- Order lookup capabilities
- Mobile-optimized for Shopify themes

## Troubleshooting

### Widget Not Appearing
1. Check browser console for errors
2. Verify agent token is correct
3. Ensure script is placed before `</body>`
4. Clear browser cache

### Style Conflicts
- The widget uses isolated CSS
- Contact support if theme conflicts occur

## Support

For assistance: support@agentman.ai
```

## Implementation Timeline

### Phase 1: MVP (3-5 days)
1. **Day 1-2**: Build script service and loader
2. **Day 2-3**: Create configuration tool
3. **Day 3-4**: Test with sample Shopify stores
4. **Day 4-5**: Deploy to CDN and document

### Deployment Strategy

1. **CDN Hosting**: 
   - Host script on CloudFlare/AWS CloudFront
   - Version management for updates
   - Automatic minification and optimization

2. **Configuration Storage**:
   - Initially use inline configuration (data attributes)
   - For advanced users, provide configuration tool
   - No database needed for phase 1

3. **Updates**:
   - Centralized updates via CDN
   - No action required by store owners
   - Version pinning available for stability

## Benefits of This Approach

1. **No Backend Required**: Direct connection to agent runtime
2. **Full Feature Parity**: All WordPress features available
3. **Easy Installation**: Single script tag
4. **Centralized Updates**: Update all stores at once
5. **Low Maintenance**: No OAuth, no app review process
6. **Quick to Market**: Can deploy in less than a week

## Future Phase 2 Considerations

When ready to scale beyond 10 customers:
- Build proper Shopify app with OAuth
- Add backend for advanced features
- Submit to Shopify App Store
- Implement subscription billing

This phase 1 approach provides a perfect testing ground to validate the integration with real customers before investing in a full marketplace app.
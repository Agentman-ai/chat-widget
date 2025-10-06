# Shopify Integration for Agentman ChatWidget

This directory contains the Shopify integration implementation for the Agentman ChatWidget, designed for direct agent runtime connection without requiring an intermediate backend.

## Phase 1: Script Tag Service (Current)

Target: First 5-10 pilot customers  
Timeline: 3-5 days development  
Approach: Direct connection using agentToken  

## Directory Structure

```
shopify/
├── README.md                   # This file
├── script-service/             # Hosted script service
│   ├── index.js               # Main script entry point
│   ├── config-generator.js    # Configuration generator
│   └── shopify-loader.js      # Shopify-specific loader
├── config-tool/               # Web-based configuration tool
│   ├── index.html             # Configuration interface
│   ├── styles.css             # Tool styling
│   ├── script.js              # Configuration logic
│   └── templates/             # Configuration templates
│       ├── default.json       # Default settings
│       ├── ecommerce.json     # E-commerce optimized
│       └── support.json       # Customer support focused
├── cdn/                       # CDN deployment files
│   ├── deploy.sh              # Deployment script
│   └── versions/              # Version management
└── docs/                      # Documentation
    ├── installation.md        # Store owner guide
    ├── configuration.md       # Configuration guide
    └── troubleshooting.md     # Common issues
```

## Features

### ✅ Full WordPress Feature Parity
- All 9 simplified theme properties
- Message prompts and welcome messages  
- Conversation persistence (configurable duration)
- Position variants (corner, centered, inline)
- Hide branding option
- Custom dimensions and styling

### ✅ Shopify-Specific Features  
- Customer data integration (customer ID passing)
- Cart synchronization for AI awareness
- Order lookup capabilities
- Mobile-optimized for Shopify themes
- Theme conflict prevention

### ✅ Easy Installation
- **Method 1**: Single script tag in theme.liquid
- **Method 2**: Configuration tool with one-click installation
- **Method 3**: Installation link for store owners

## Installation for Store Owners

### Quick Install (Recommended)
1. Copy the provided script tag
2. Go to Shopify Admin → Online Store → Themes
3. Click Actions → Edit code on current theme
4. Open `layout/theme.liquid`
5. Paste script tag before `</body>`
6. Save file

### Script Tag Example

**v5 (Latest - Recommended for New Installations):**
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js"
        data-agent-token="YOUR_AGENT_TOKEN"></script>
```

**v2 (Legacy - For Existing Installations):**
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v2/widget.js"
        data-agent-token="YOUR_AGENT_TOKEN"></script>
```

**Customized Installation (v5 with all features):**
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js"
        data-agent-token="YOUR_AGENT_TOKEN"
        data-title="{{ shop.name }} Assistant"
        data-bg-color="{{ settings.colors_background_1 }}"
        data-button-color="{{ settings.colors_accent_1 }}"
        data-text-color="{{ settings.colors_text }}"
        data-toggle-text="Chat with us"
        data-agent-closed-view="welcome-card"
        data-welcome-message="Welcome to {{ shop.name }}! How can I help you today?"
        data-prompt-1="Track my order"
        data-prompt-2="Product information"
        data-prompt-3="Return policy"
        data-persistence-enabled="true"
        data-enable-attachments="true"
        data-disclaimer-enabled="true"
        data-disclaimer-message="AI-generated responses"
        data-disclaimer-link-text="Learn more"
        data-disclaimer-link-url="https://{{ shop.domain }}/pages/ai-policy"></script>
```

### What's New in v5? 🎉

Version 5.x includes major new features and improvements:

- **🆕 Input Bar Mode**: Modern AI search bar at bottom of screen (ChatGPT/Perplexity-style)
- **🎨 Enhanced Theming**: 7 new CSS variables for input bar customization
- **📱 Safari Mobile**: Safe-area-inset support for iOS notch/home indicator
- **🔐 Security**: XSS vulnerability fixes using safe DOM APIs
- **♿ Accessibility**: Full keyboard navigation with Arrow keys, Home/End, Enter/Space
- **🎯 ARIA Support**: Comprehensive ARIA attributes for screen readers
- **⚡ Performance**: Improved TypeScript type safety, GPU-optimized animations
- **🎬 Animations**: Typewriter effects, progressive disclosure, elastic easing

**Upgrade from v2**: Simply change `v2` to `v5` in your script URL. No breaking changes!

**New in v5**: The `input-bar` presentation mode is only available in v5. Requires `data-agent-closed-view="input-bar"`.

## Configuration Options

🆕 **NEW: Data Attribute Configuration System**  
All ChatWidget options can now be customized directly in your Shopify theme using data attributes on the script tag. No need to modify the CDN package!

### Available Data Attributes

| Category | Data Attribute | Default | Description |
|----------|---------------|---------|-------------|
| **Required** | `data-agent-token` | - | Your Agentman agent token |
| **API** | `data-api-url` | `https://api.agentman.ai` | Custom API endpoint |
| **Behavior** | `data-variant` | `corner` | Widget style: corner, centered, inline |
| | `data-position` | `bottom-right` | Position: bottom-right, bottom-left, etc. |
| | `data-initially-open` | `false` | Open widget on page load |
| | `data-enable-attachments` | `true` | Enable file attachments |
| **Appearance** | `data-initial-height` | `600px` | Widget height when opened |
| | `data-initial-width` | `400px` | Widget width when opened |
| | `data-title` | `AI Assistant` | Widget title in header |
| | `data-placeholder` | `Type your message...` | Input placeholder text |
| | `data-toggle-text` | `Ask AI` | Toggle button text |
| | `data-initial-message` | `Hello` | Initial message to agent |
| **Colors** | `data-bg-color` | `#ffffff` | Widget background color |
| | `data-text-color` | `#111827` | Text color |
| | `data-button-color` | `#2563eb` | Primary button color |
| | `data-button-text-color` | `#ffffff` | Button text color |
| | `data-agent-color` | `#111827` | Agent message text color |
| | `data-user-color` | `#2563eb` | User message text color |
| | `data-toggle-bg-color` | `#2563eb` | Toggle button background |
| | `data-toggle-text-color` | `#ffffff` | Toggle button text color |
| | `data-toggle-icon-color` | `#ffffff` | Toggle button icon color |
| **Closed View** | `data-agent-closed-view` | `null` | Presentation mode: toggle-only, floating-prompts, welcome-card |
| **Content** | `data-show-prompts` | `true` | (Deprecated) Show message prompts - use data-agent-closed-view |
| | `data-welcome-message` | `How can I help you today?` | Welcome message |
| | `data-prompt-1` | - | First quick prompt |
| | `data-prompt-2` | - | Second quick prompt |
| | `data-prompt-3` | - | Third quick prompt |
| **Persistence** | `data-persistence-enabled` | `true` | Enable conversation persistence |
| | `data-persistence-days` | `7` | Days to keep conversations |
| | `data-persistence-key` | `agentman_chat` | Storage key prefix |
| | `data-max-conversations` | `10` | Max conversations to store |
| **AI Disclaimer** | `data-disclaimer-enabled` | `false` | Show AI disclaimer |
| | `data-disclaimer-message` | `AI-generated responses` | Disclaimer text |
| | `data-disclaimer-link-text` | - | Optional link text (e.g., "Learn more") |
| | `data-disclaimer-link-url` | - | Optional URL to AI policy |
| **Input Bar** | `data-input-bar-brand-bg` | Auto-derived | Brand pill background (input-bar mode only) |
| | `data-input-bar-brand-text` | `#0066FF` | Brand text color (e.g., "Ask AI") |
| | `data-input-bar-logo-bg` | `transparent` | Logo circle background |
| | `data-input-bar-logo-icon` | Same as brand text | Logo icon color |
| | `data-input-bar-button-bg` | Auto-derived | Menu button background |
| | `data-input-bar-button-icon` | `#6B7280` | Menu button icon color |
| | `data-input-bar-glow-color` | Auto-derived | Focus glow effect color |

### AgentClosedView Presentation Modes 🆕

Control how the widget appears when closed using the `data-agent-closed-view` attribute. Choose from four distinct presentation modes:

#### **Mode 1: Toggle Only** (`toggle-only`)
Just the chat button, no external prompts. Clean and minimal.

```html
data-agent-closed-view="toggle-only"
```

**Best for:**
- Minimal, unobtrusive presence
- When you don't want to show prompts outside the widget
- Mobile-first designs
- Sites with limited screen space

**What users see:**
- Only the chat toggle button in the corner
- Prompts appear inside the widget after opening

---

#### **Mode 2: Floating Prompts** (`floating-prompts`)
Traditional floating bubbles with prompts. The classic approach.

```html
data-agent-closed-view="floating-prompts"
data-welcome-message="How can I help you today?"
data-prompt-1="Track my order"
data-prompt-2="Product information"
data-prompt-3="Return policy"
```

**Best for:**
- High engagement - prompts visible immediately
- E-commerce stores with common questions
- Desktop-focused experiences
- Traditional chat widget feel

**What users see:**
- Welcome message bubble above toggle button
- 3 clickable prompt buttons
- Traditional chat widget appearance

---

#### **Mode 3: Welcome Card** (`welcome-card`)
Modern glassmorphic card with prompts inside. Premium look and feel.

```html
data-agent-closed-view="welcome-card"
data-welcome-message="Welcome! How can I help?"
data-prompt-1="What can you do?"
data-prompt-2="Tell me about features"
data-prompt-3="Get started"
```

**Best for:**
- Modern, premium aesthetic
- Apps that want a unique, standout design
- Sites with space for a larger welcome element
- Maximum visual impact

**What users see:**
- Beautiful glassmorphic card with blur effects
- Welcome message and prompts contained inside
- Toggle button integrated into the card
- Smooth animations and hover effects

**Minimal version** (no prompts):
```html
data-agent-closed-view="welcome-card"
data-welcome-message="Click below to chat!"
<!-- No prompts defined = minimal card -->
```

---

#### **Mode 4: Input Bar** (`input-bar`) 🆕 **[v5 Required]**

Modern AI search bar at bottom of screen. Perplexity/ChatGPT-style interface.

> **Note**: This mode requires v5 or later. Make sure your script tag uses `/v5/widget.js`

```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js"
        data-agent-token="YOUR_TOKEN"
        data-agent-closed-view="input-bar"
        data-toggle-text="Ask AI"
        data-placeholder="Ask anything..."
        data-welcome-message="How can I help you today?"
        data-prompt-1="Product information"
        data-prompt-2="Track my order"
        data-prompt-3="Return policy"></script>
```

**Best for:**
- Modern, AI-first user experiences
- Mobile-optimized chat/search
- Minimalist, clean designs
- Sites inspired by ChatGPT/Perplexity UX

**What customers see:**
- Floating search bar centered at bottom of screen
- Typewriter animation cycling through prompts
- Brand logo + "Ask AI" text (collapses to circle on focus)
- Prompts slide up above bar when customer clicks
- Smooth animations and modern micro-interactions

**Visual Design:**
- **Unfocused**: Pill-shaped bar with logo, brand text, and typewriter placeholder
- **Focused**: Brand collapses to circle, input expands, prompts appear above, menu button revealed
- **Mobile**: Respects Safari safe areas, keyboard-optimized

**Technical Features:**
- Typewriter cycles: welcome message → prompt 1 → prompt 2 → prompt 3 → repeat
- GPU-accelerated animations (60fps)
- Safari iOS safe-area support (`env(safe-area-inset-bottom)`)
- Progressive disclosure (menu appears on focus)
- Enter to submit, Shift+Enter for multi-line

---

#### **Default Behavior** (no attribute)
If you don't specify `data-agent-closed-view`, the widget automatically chooses:
- **Floating prompts** if you have prompts defined
- **Toggle only** if no prompts are defined

---

#### **Migration from Old API**

If you were using `data-show-prompts="false"`:
```html
<!-- OLD (still works but deprecated) -->
data-show-prompts="false"

<!-- NEW (recommended) -->
data-agent-closed-view="toggle-only"
```

---

### AI Disclaimer Feature

The widget supports displaying an AI disclaimer to inform customers that responses are AI-generated:

**Basic Disclaimer:**
```html
data-disclaimer-enabled="true"
data-disclaimer-message="AI-generated responses"
```

**With Link to Policy:**
```html
data-disclaimer-enabled="true"
data-disclaimer-message="AI-generated responses"
data-disclaimer-link-text="Learn more"
data-disclaimer-link-url="https://{{ shop.domain }}/pages/ai-policy"
```

**Where it appears:**
- In the welcome screen below the main message
- Next to "Powered by Agentman" in the conversation view
- Responsive design optimized for mobile devices

### Quick Start Examples

#### **E-Commerce Store (Recommended)**
High-engagement setup with welcome card and order tracking:
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js"
        data-agent-token="YOUR_TOKEN"
        data-agent-closed-view="welcome-card"
        data-title="{{ shop.name }} Assistant"
        data-welcome-message="Welcome to {{ shop.name }}! How can I help you?"
        data-prompt-1="Track my order"
        data-prompt-2="Product information"
        data-prompt-3="Return policy"
        data-button-color="{{ settings.colors_accent_1 }}">
</script>
```

#### **Minimal Setup (Clean & Simple)**
Just the essentials - toggle button only:
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js"
        data-agent-token="YOUR_TOKEN"
        data-agent-closed-view="toggle-only"
        data-title="{{ shop.name }} Support">
</script>
```

#### **Support-Focused (Traditional)**
Classic floating prompts for customer support:
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js"
        data-agent-token="YOUR_TOKEN"
        data-agent-closed-view="floating-prompts"
        data-welcome-message="Need help?"
        data-prompt-1="Contact support"
        data-prompt-2="FAQ"
        data-prompt-3="Shipping info">
</script>
```

#### **AI Search Experience (Input Bar)** 🆕
Modern bottom search bar with typewriter effect:
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v5/widget.js"
        data-agent-token="YOUR_TOKEN"
        data-agent-closed-view="input-bar"
        data-toggle-text="Ask {{ shop.name }} AI"
        data-welcome-message="Welcome to {{ shop.name }}! What are you looking for?"
        data-prompt-1="Find products"
        data-prompt-2="Track my order"
        data-prompt-3="Help & Support"
        data-toggle-bg-color="{{ settings.colors_accent_1 }}">
</script>
```

### Integration with Shopify Themes

**Use Theme Colors:**
```html
data-bg-color="{{ settings.background_color }}"
data-button-color="{{ settings.accent_color }}"
data-text-color="{{ settings.text_color }}"
```

**Page-Specific Configuration:**
```html
{% if template.name == 'product' %}
  data-title="Product Help"
  data-prompt-1="Product details"
  data-prompt-2="Size guide"
{% elsif template.name == 'cart' %}
  data-title="Checkout Help"
  data-prompt-1="Payment options"
{% endif %}
```

**Conditional Presentation Modes:**
```html
{% if template.name == 'index' %}
  data-agent-closed-view="welcome-card"
{% else %}
  data-agent-closed-view="toggle-only"
{% endif %}
```

📖 **Complete Guide**: See `/docs/shopify-customization.md` for comprehensive documentation and examples.

## Development Status

- [✅] **Phase 1 Planning**: Complete
- [✅] **Script Service**: Implemented with data attribute configuration system
- [✅] **Configuration System**: Data attributes for theme customization  
- [✅] **Documentation**: Complete with examples and best practices
- [✅] **CDN Deployment**: Deployed to GCP Storage
- [🚧] **Config Tool**: Web-based tool (available but optional)
- [📋] **Testing**: Ready for pilot customers

## Technical Architecture

### Direct Connection Model
```
Shopify Store → Script Tag → ChatWidget → Agent Runtime
```

No intermediate backend required. The widget connects directly to the agent runtime using the agentToken, exactly like the web ChatWidget.

### CDN Hosting Strategy
- Host script on CloudFlare/AWS CloudFront
- Version management for updates
- Automatic minification and optimization
- Global edge locations for performance

### Shopify Theme Compatibility
- CSS isolation to prevent theme conflicts
- High z-index for proper layering
- Mobile-responsive design
- Compatible with all major Shopify themes

## Future Phase 2: Shopify App Store

When ready to scale beyond 10 customers:
- Build proper Shopify app with OAuth
- Add backend for advanced analytics
- Submit to Shopify App Store  
- Implement subscription billing
- Advanced Shopify API integrations

## Next Steps

1. Implement script service (`script-service/index.js`)
2. Create configuration tool (`config-tool/index.html`)
3. Set up CDN deployment (`cdn/deploy.sh`)
4. Create installation documentation (`docs/installation.md`)
5. Test with sample Shopify stores
6. Deploy and onboard first pilot customers

## Related Files

- `../docs/shopify-integration.md` - Detailed implementation guide
- `../wordpress/` - WordPress integration for reference
- `../assistantWidget/` - Core ChatWidget implementation
- `../docs/wix-integration.md` - Wix integration for comparison
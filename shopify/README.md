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

**Basic Installation:**
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js" 
        data-agent-token="YOUR_AGENT_TOKEN"></script>
```

**Customized Installation:**
```html
<script src="https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js" 
        data-agent-token="YOUR_AGENT_TOKEN"
        data-title="{{ shop.name }} Assistant"
        data-bg-color="{{ settings.background_color }}"
        data-button-color="{{ settings.accent_color }}"
        data-toggle-text="Chat with us"
        data-prompt-1="Track my order"
        data-prompt-2="Product information"
        data-prompt-3="Return policy"></script>
```

## Configuration Options

🆕 **NEW: Data Attribute Configuration System**  
All ChatWidget options can now be customized directly in your Shopify theme using data attributes on the script tag. No need to modify the CDN package!

### Available Data Attributes

| Category | Data Attribute | Default | Description |
|----------|---------------|---------|-------------|
| **Behavior** | `data-variant` | `corner` | Widget style: corner, centered, inline |
| | `data-position` | `bottom-right` | Position: bottom-right, bottom-left, etc. |
| | `data-initially-open` | `false` | Open widget on page load |
| | `data-enable-attachments` | `true` | Enable file attachments |
| **Appearance** | `data-initial-height` | `600px` | Widget height when opened |
| | `data-initial-width` | `400px` | Widget width when opened |
| | `data-title` | `AI Assistant` | Widget title in header |
| | `data-placeholder` | `Ask me anything...` | Input placeholder text |
| | `data-toggle-text` | `Ask Agentman` | Toggle button text |
| **Colors** | `data-bg-color` | `#ffffff` | Widget background color |
| | `data-text-color` | `#111827` | Text color |
| | `data-button-color` | `#2563eb` | Primary button color |
| | `data-button-text-color` | `#ffffff` | Button text color |
| | `data-toggle-bg-color` | `#2563eb` | Toggle button background |
| **Content** | `data-welcome-message` | `How can I help you today?` | Welcome message |
| | `data-prompt-1` | `Track my order` | First quick prompt |
| | `data-prompt-2` | `Product information` | Second quick prompt |
| | `data-prompt-3` | `Return policy` | Third quick prompt |

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
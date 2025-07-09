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
```html
<script src="https://cdn.agentman.ai/shopify/v1/widget.js" 
        data-agent-token="YOUR_AGENT_TOKEN"></script>
```

## Configuration Options

All configuration options from WordPress are available:

- **General**: Enable/disable, placement, position, initially open
- **Appearance**: Colors, dimensions, toggle button styling
- **Content**: Title, placeholder, initial message, prompts
- **Advanced**: Persistence, branding, Shopify integration options

## Development Status

- [📋] **Phase 1 Planning**: Complete
- [🚧] **Script Service**: Ready to implement
- [🚧] **Config Tool**: Ready to implement  
- [🚧] **Documentation**: Ready to create
- [📋] **Testing**: Pending implementation
- [📋] **CDN Deployment**: Pending implementation

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
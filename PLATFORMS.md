# Platform Integrations

This directory contains integrations for various platforms and content management systems.

## Directory Structure

```
chat-widget/
├── assistantWidget/           # Core ChatWidget implementation
├── docs/                     # General documentation
├── wordpress/               # WordPress plugin integration
├── shopify/                 # Shopify integration (Phase 1)
├── wix/                     # Wix integration (Future)
└── platforms/               # Additional platform integrations
    ├── react/               # React component wrapper
    ├── vue/                 # Vue component wrapper
    └── angular/             # Angular component wrapper
```

## Integration Approaches

### WordPress (`wordpress/`)
- **Type**: Full PHP plugin
- **Installation**: WordPress plugin repository + manual install
- **Features**: Complete admin interface, all configuration options
- **Status**: ✅ Complete (v0.24.0)

### Shopify (`shopify/`)
- **Type**: Script Tag Service (Phase 1)
- **Installation**: Single script tag in theme.liquid
- **Features**: Full feature parity with WordPress
- **Status**: 📋 Planned

### Wix (`wix/`)
- **Type**: HTML Widget + Configuration Tool
- **Installation**: Copy/paste embed code
- **Features**: 90% of WordPress functionality
- **Status**: 📋 Documented (ready for implementation)

## Implementation Priorities

1. **WordPress** - Complete ✅
2. **Shopify Phase 1** - Direct connection for 5-10 pilot customers
3. **Shopify Phase 2** - Full App Store submission (after validation)
4. **Wix** - HTML widget approach
5. **React/Vue/Angular** - Framework-specific wrappers

## Shared Components

All platform integrations share:
- Core ChatWidget from `assistantWidget/`
- Same theme system and configuration options
- Direct connection to agent runtime via agentToken
- Consistent user experience across platforms

## Development Guidelines

- Each platform maintains its own build process
- Shared utilities should be added to `assistantWidget/utils/`
- Platform-specific optimizations stay within platform folders
- Documentation for each platform should include installation guides
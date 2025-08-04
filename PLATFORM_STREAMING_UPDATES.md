# Platform Integration Streaming Updates

## Summary
Updated all platform integrations (WordPress, Shopify, and Wix) to support the new streaming configuration with streaming enabled by default.

## Changes Made

### WordPress Integration
1. **`wordpress/agentman-chat-widget.php`**:
   - Added streaming configuration to `get_widget_config()` method (lines 404-407)
   - Added `streaming_enabled` to default options with value `true` (line 166)
   - Added sanitization for `streaming_enabled` in `sanitize_options()` (line 259)

2. **`wordpress/admin/admin-page.php`**:
   - Added UI checkbox for "Enable Streaming Responses" in Content Settings tab (lines 343-351)
   - Checkbox defaults to checked (enabled)
   - Includes help text explaining the feature

### Shopify Integration
1. **`shopify/config-tool/script.js`**:
   - Added streaming configuration to `getAdvancedConfig()` method (lines 393-396)
   - Added streaming to the full configuration in `generateInstallation()` (line 429)
   - Default value is `enabled: true` when checkbox is not explicitly unchecked

2. **`shopify/config-tool/index.html`**:
   - Added checkbox for "Enable Streaming Responses" in Advanced section (lines 359-367)
   - Checkbox defaults to checked
   - Includes help text about the feature

### Wix Integration
1. **`wix-integration/config-tool/script.js`**:
   - Added streaming to default configuration object (lines 59-61)
   - Added streaming data collection in `updateConfigFromForm()` (lines 235-237)
   - Added UI update logic in `updateUI()` method (lines 403-405)

2. **`wix-integration/config-tool/index.html`**:
   - Added toggle switch for "Enable Streaming Responses" in Advanced tab (lines 237-244)
   - Toggle defaults to checked
   - Includes help text about the feature

## Key Points
- All platform integrations now support streaming configuration
- Streaming is enabled by default across all platforms
- Users can disable streaming if needed through the UI
- Configuration follows the same pattern as the main ChatWidget: `streaming: { enabled: true/false }`
- All changes are backward compatible - existing installations will default to streaming enabled
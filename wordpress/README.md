# Agentman AI Agents for WordPress

A WordPress plugin that integrates the Agentman AI Agents into your WordPress site with full customization options in the admin dashboard.

## Description

This plugin allows you to easily add the Agentman AI Agents to your WordPress website. The chat widget provides a modern, responsive interface for your visitors to interact with Agentman AI.

### Features

- 🎨 Fully customizable UI and icons through the WordPress admin
- 🔒 Secure token-based authentication
- 🌐 Easy integration with any WordPress theme
- 📱 Responsive design for all devices
- 💾 Built-in conversation persistence across page reloads
- ⚡ Lightweight and performant
- 🧩 Multiple widget placement options (corner, centered, inline)
- 🔄 Cross-browser compatibility

## Installation

1. Download the latest plugin zip file from the [GitHub releases page](https://github.com/Agentman-ai/chat-widget/releases) or get the latest version directly from this repository
2. Go to your WordPress admin dashboard
3. Navigate to Plugins > Add New
4. Click "Upload Plugin" and select the zip file
5. Click "Install Now"
6. After installation, click "Activate Plugin"

## Configuration

1. After activation, go to Settings > Agentman AI Agents
2. Enter your Agentman Agent Token (required)
3. Configure the appearance and behavior of the chat widget
4. Click "Save Changes"

### Required Settings

- **Agent Token**: Your Agentman API token

### Customization Options

The plugin provides extensive customization options:

- **General Settings**: Enable/disable the widget, placement, position
- **Appearance**: Colors, logos, icons, dimensions
- **Content**: Widget title, placeholder text, initial message
- **Persistence**: Configure conversation storage settings
- **Advanced**: Preview functionality, reset to defaults

## Persistence Functionality

The Agentman AI Agents includes built-in persistence functionality that allows conversations to be saved and restored across page reloads and browser sessions.

### How Persistence Works

- Conversations are stored in the user's browser using localStorage
- Each conversation has a unique ID that is maintained across sessions
- Messages are automatically loaded when the user returns to your site
- Old conversations expire after a configurable number of days

### Persistence Configuration

You can configure the persistence functionality in the plugin settings:

- **Enable Persistence**: Turn conversation storage on or off
- **Storage Duration**: Number of days to keep conversations (default: 7 days)

### Privacy Considerations

When using the persistence functionality, you should inform your users that their conversation history is being stored in their browser. This information should be included in your privacy policy.

## Installation Guide

### Standard Installation

1. Download the plugin zip file
2. Go to your WordPress admin dashboard
3. Navigate to Plugins > Add New
4. Click "Upload Plugin" and select the zip file
5. Click "Install Now"
6. After installation, click "Activate Plugin"

### Manual Installation

1. Download and unzip the plugin
2. Upload the `agentman-chat-widget` directory to your `/wp-content/plugins/` directory
3. Activate the plugin through the 'Plugins' menu in WordPress

## Configuration Guide

### Basic Setup

1. After activation, go to Settings > Agentman Chat
2. Enter your Agentman Agent Token (required)
3. Configure the API URL if needed
4. Save changes

### Appearance Customization

1. Navigate to the Appearance tab in the settings
2. Customize colors to match your brand
3. Upload custom logos or icons if desired
4. Configure widget dimensions
5. Preview changes and save

### Content Configuration

1. Navigate to the Content tab in the settings
2. Set the widget title and placeholder text
3. Configure an initial message (optional)
4. Save changes

### Persistence Settings

1. Navigate to the Persistence tab in the settings
2. Enable or disable conversation persistence
3. Set the number of days to store conversations
4. Save changes

## Frequently Asked Questions

### Where do I get my Agentman Agent Token?

You can obtain an Agentman Agent Token by signing up at [agentman.ai](https://agentman.ai) and creating an agent.

### How do I change the chat widget colors?

You can customize all colors in the Appearance tab of the plugin settings. This includes background colors, text colors, header colors, and message bubble colors.

### Can I use custom icons?

Yes, you can upload custom icons for both the user and agent avatars. You can also use the default icons and customize their colors.

### How do I change the position of the chat widget?

In the General Settings tab, you can select the position (bottom-right, bottom-left, top-right, top-left) and the variant (corner, centered, inline).

### Are conversations saved between sessions?

Yes, with the built-in persistence functionality enabled, conversations are saved in the user's browser and restored when they return to your site. You can configure the duration in the Persistence tab.

### How do I disable the chat widget on specific pages?

Currently, the widget appears on all pages when enabled. For selective display, you can use WordPress conditional tags in your theme or a custom plugin. Contact us for implementation assistance.

### Is the chat widget GDPR compliant?

The chat widget stores conversation data in the user's browser using localStorage. No data is sent to our servers except the actual messages exchanged with the AI. You should include information about this in your privacy policy. The persistence feature can be disabled if needed for compliance.

### How do I troubleshoot if the widget isn't appearing?

1. Check that the plugin is activated
2. Verify that you've entered a valid Agent Token
3. Check for JavaScript errors in your browser console
4. Try disabling other plugins to check for conflicts
5. Ensure your theme is not hiding the widget container

### Can I customize the widget beyond the provided settings?

Advanced users can modify the plugin's CSS or JavaScript files for further customization. However, these changes may be overwritten during plugin updates.

### Can I customize the appearance of the chat widget?

Yes, the plugin provides extensive customization options including colors, icons, logos, and placement.

## Support

If you need assistance with the Agentman Chat Widget plugin, please contact us at support@agentman.ai or visit our [support portal](https://support.agentman.ai).

### Can I preview the chat widget before making it live?

Yes, the plugin includes a preview functionality in the admin settings.

## Screenshots

1. Chat widget on the frontend
2. Admin settings page
3. Customization options
4. Preview functionality

## Changelog

### 1.0.0
* Initial release

## Upgrade Notice

### 1.0.0
Initial release

## License

This plugin is licensed under the MIT License - see the LICENSE file for details.

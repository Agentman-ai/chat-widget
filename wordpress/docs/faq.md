# Agentman Chat Widget FAQ

## General Questions

### What is the Agentman Chat Widget?
The Agentman Chat Widget is a customizable AI-powered chat interface that allows your website visitors to interact with an AI assistant directly on your WordPress site.

### How does the chat widget work?
The widget connects to the Agentman AI platform using your API token. When a visitor types a message, it's sent to the Agentman AI service, which processes the message and returns a response that's displayed in the chat interface.

### Do I need an account to use this plugin?
Yes, you need an Agentman account and API token. You can sign up at [agentman.ai](https://agentman.ai).

### Is the chat widget mobile-friendly?
Yes, the chat widget is fully responsive and works well on all devices including smartphones and tablets.

## Installation & Setup

### How do I install the Agentman Chat Widget plugin?
1. Upload the plugin files to the `/wp-content/plugins/agentman-chat-widget` directory, or install the plugin through the WordPress plugins screen.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Go to Settings > Agentman Chat Widget to configure the plugin.

### What settings do I need to configure?
At minimum, you need to enter your Agentman API token. However, you can also customize the appearance, behavior, and content of the chat widget.

### Can I use the chat widget on specific pages only?
Yes, you can control where the chat widget appears using the display settings in the plugin configuration. You can choose to show it on all pages, specific pages, or use the shortcode to place it exactly where you want.

### How do I use the shortcode?
Add `[agentman_chat_widget]` to any post or page where you want the chat widget to appear. You can also pass parameters to customize it, like `[agentman_chat_widget title="Support Chat" theme_color="#FF5500"]`.

## Persistence Functionality

### What is conversation persistence?
Persistence allows the chat widget to remember conversations across page reloads and browser sessions. When a visitor returns to your site, they can continue their previous conversation instead of starting over.

### How does persistence work?
The chat widget stores conversation history in the visitor's browser using localStorage. Each conversation has a unique ID that is maintained across sessions, and messages are automatically loaded when the user returns to your site.

### Is persistence enabled by default?
Yes, persistence is enabled by default with a 7-day storage period. You can disable it or change the storage duration in the plugin settings.

### How long are conversations stored?
By default, conversations are stored for 7 days. You can change this in the plugin settings to any value between 1 and 30 days.

### Is persistence secure?
Yes, conversation data is stored locally in the visitor's browser and is not accessible to other websites or users. The data never leaves the visitor's device except when communicating with the Agentman API.

### Do I need to inform visitors about persistence?
Yes, since the plugin stores data in the visitor's browser, you should mention this in your privacy policy to comply with privacy regulations like GDPR.

### Can visitors delete their conversation history?
Yes, visitors can clear their conversation history by clicking the "Clear conversation" button in the chat widget menu.

### Does persistence work across different devices?
No, persistence is device-specific. If a visitor starts a conversation on their phone and then switches to their laptop, they will have separate conversations on each device.

### Will persistence slow down my website?
No, the persistence functionality has minimal impact on website performance as it uses the browser's built-in localStorage API, which is very efficient.

## Customization

### Can I customize the appearance of the chat widget?
Yes, you can customize colors, dimensions, position, and more through the plugin settings. You can also add custom CSS for more advanced styling.

### Can I change the chat widget's position?
Yes, you can choose from several predefined positions (bottom-right, bottom-left, top-right, top-left) or use the inline variant to place it within your content.

### Can I add my logo to the chat widget?
Yes, you can upload your logo to display in the chat header through the plugin settings.

### Can I customize the initial message?
Yes, you can set a custom initial message that will be displayed when a visitor first opens the chat.

## Troubleshooting

### The chat widget isn't appearing on my site
Check that:
1. The plugin is activated
2. You've entered a valid Agentman API token
3. The display settings are configured correctly
4. There are no JavaScript errors in your browser console

### Conversations aren't being saved
Check that:
1. Persistence is enabled in the plugin settings
2. Your browser supports localStorage
3. You don't have privacy settings or extensions blocking localStorage
4. You haven't exceeded the browser's storage limit

### The chat widget looks broken or unstyled
This could be due to:
1. A conflict with your theme's CSS
2. A caching plugin that needs to be cleared
3. A JavaScript error preventing proper initialization

### I'm getting API errors
Verify that:
1. Your Agentman API token is correct
2. Your account is active
3. You haven't exceeded your API usage limits

## Advanced Usage

### Can developers extend the chat widget functionality?
Yes, the plugin provides hooks and filters that developers can use to customize its behavior. See the [Developer Guide](developer-guide.md) for more information.

### Can I integrate the chat widget with other plugins?
Yes, the plugin is designed to work alongside other WordPress plugins. Developers can use the provided hooks to create integrations.

### Is there an API for programmatic control?
Yes, the chat widget exposes a JavaScript API that allows developers to control it programmatically. See the [Developer Guide](developer-guide.md) for details.

## Support

### Where can I get help if I have issues?
If you need assistance with the Agentman Chat Widget plugin, please contact us at support@agentman.ai or visit our [support portal](https://support.agentman.ai).

### How do I report a bug?
Please report bugs through our [support portal](https://support.agentman.ai) or by emailing support@agentman.ai with detailed information about the issue.

### How do I request a feature?
Feature requests can be submitted through our [support portal](https://support.agentman.ai) or by emailing support@agentman.ai.

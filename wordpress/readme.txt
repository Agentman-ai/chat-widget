=== Agentman AI Assistant ===
Contributors: Agentman.ai
Tags: chatbot, agent, sales, support, assistant
Requires at least: 5.6
Tested up to: 6.5
Stable tag: 5.5.0
Requires PHP: 7.2
License: MIT
License URI: https://opensource.org/licenses/MIT

Integrate the Agentman AI Assistant into your WordPress site with fully customizable appearance and built-in conversation persistence.

== Description ==
Agentman AI Assistant provides a modern, customizable chat interface for your WordPress site. The widget allows your visitors to interact with Agentman AI assistants directly from your website, providing instant support and information without leaving your site.

**Features:**

* **NEW: Welcome Screen** - Clean, centered interface when users first open the chat
* **NEW: Floating Prompts** - Contextual prompt bubbles that appear when widget is closed
* Fully customizable appearance to match your brand
* Independent toggle button styling to prevent theme conflicts
* Built-in conversation persistence across page reloads and tabs
* File attachment support (images, documents, etc.) - now enabled by default
* Multiple conversation management with history
* Responsive design for all devices (mobile, tablet, desktop)
* Easy configuration through WordPress admin
* Secure token-based authentication
* Lightweight and performant
* Multiple widget positions (corner, centered, inline)
* Customizable icons, logos, and text
* Enhanced mobile experience

The Agentman AI Assistant is designed to provide a seamless experience for your website visitors, allowing them to get instant AI-powered assistance without leaving your site.

== Installation ==

1. Download the latest version of the plugin from the [GitHub repository](https://github.com/Agentman-ai/chat-widget/tree/main/wordpress) or the [releases page](https://github.com/Agentman-ai/chat-widget/releases).
2. Upload the plugin files to the `/wp-content/plugins/agentman-chat-widget` directory, or install the plugin through the WordPress plugins screen.
3. Activate the plugin through the 'Plugins' screen in WordPress.
4. Use the Settings -> Agentman Chat screen to configure the plugin.
5. Enter your Agentman API token to connect to your assistant.
6. Customize the appearance to match your website's design.

== Frequently Asked Questions ==

= Do I need an API token to start using the plugin? =

No! The plugin comes with a default demo agent token so you can start using it immediately after installation. This allows you to test the functionality right away without creating an account.

= How do I get my own custom API token? =

To create your own custom AI assistant, sign up at [agentman.ai](https://agentman.ai), create an assistant with your specific knowledge base and preferences, then copy your API token from the dashboard. Enter this token in the plugin settings (Settings -> Agentman Chat) to replace the default demo agent.

= How do I customize the appearance? =

The plugin includes comprehensive appearance settings in the WordPress admin under Settings -> Agentman Chat. You can customize colors, icons, text, and positioning. The toggle button can be styled independently from the chat header to prevent conflicts with your WordPress theme.

= Why is the toggle button styling important? =

The toggle button is the entry point for users to access your chat assistant. With our independent styling options, you can ensure the toggle button maintains a consistent appearance across different WordPress themes, preventing unwanted style inheritance that could affect its visibility or appearance.

= Does it work on mobile devices? =

Yes, the chat widget is fully responsive and works on all devices including smartphones, tablets, and desktop computers. We've enhanced the mobile experience with proper hiding of desktop-only elements and optimized touch interactions.

= Are conversations saved between sessions? =

Yes, the plugin includes built-in persistence that saves conversations in the user's browser for a configurable number of days (default is 7 days). Conversations persist across page navigations and even across multiple tabs.

= Can I change the position of the chat widget? =

Yes, you can choose from several positions: bottom-right, bottom-left, top-right, or top-left. You can also choose between different variants like corner (floating button) or inline embedding.

= How do I disable the chat widget on specific pages? =

You can use WordPress conditional tags in your theme to control where the chat widget appears. Contact us for custom implementation assistance.

= Is the chat widget GDPR compliant? =

The chat widget stores conversation data in the user's browser using localStorage. The persistence feature can be disabled if needed.

== Privacy Policy ==

The Agentman AI Assistant plugin respects user privacy and is designed with data protection in mind:

1. **Local Storage**: When persistence is enabled, conversation history is stored in the user's browser using localStorage. This data never leaves the user's device unless they interact with the chat widget.

2. **Data Collection and Processing**: 
   - **What data is sent**: When users interact with the chat widget, their messages, conversation history, and a unique conversation ID are sent to Agentman.ai servers.
   - **Purpose**: This data is processed solely to generate AI responses and maintain conversation context.
   - **No personal identifiers**: The plugin does not collect or transmit personal information such as names, email addresses, or IP addresses unless explicitly entered by the user during a conversation.
   - **Server storage**: Conversation data may be temporarily stored on Agentman.ai servers to maintain conversation context and improve AI responses. This data is not used for marketing purposes.

3. **User Consent**: 
   - By installing, activating, and configuring the plugin, site administrators provide consent for the necessary data processing.
   - End users provide implicit consent when they initiate a conversation by clicking on the chat widget.
   - Site owners should inform their visitors about the chat functionality in their own privacy policies.

4. **No Tracking**: The plugin does not track users across websites or collect analytics data without explicit configuration.

5. **Data Control**: 
   - Site administrators can configure how long conversation data is stored in the browser (from 1 to 30 days) or disable persistence entirely.
   - To completely remove all stored data, administrators can disable the persistence feature and clear browser localStorage.

6. **Data Security**: All communication with Agentman.ai servers occurs via secure HTTPS connections to protect the privacy and integrity of conversation data.

We recommend that website owners using this plugin update their privacy policies to inform users about how their chat interactions are processed and stored.

== Screenshots ==

1. Chat widget in action on a website
2. Admin configuration screen
3. Customization options
4. Mobile view of the chat widget

== Changelog ==

= 0.26.0 =
* Added welcome screen with centered input interface when users first open the chat
* Added floating prompts that appear after a configurable delay when widget is closed
* Added minimize/close button to welcome screen for better user control
* File attachments now enabled by default for better user experience
* Added WordPress admin settings for welcome screen configuration
* Added settings for floating prompts delay (default: 5 seconds)
* Improved conversation loading and message visibility
* Enhanced state management with ViewManager architecture
* Fixed conversation persistence and header visibility issues

= 0.25.0 =
* Fixed widget title configuration - now properly uses configured title instead of hardcoded text
* Added conversation management UI with "Chats" and "New" buttons in header
* Fixed toggle button color theming to properly apply configured colors
* Added vertical divider between conversation and window control buttons
* Improved header spacing and prevented title wrapping
* Fixed HTML entity encoding for apostrophes in messages
* Fixed button visibility for different widget variants (corner vs centered/inline)
* File attachments enabled by default

= 0.22.1 =
* Fixed toggle button display issues on various WordPress themes
* Enhanced mobile responsiveness with improved CSS for desktop-only elements
* Fixed edge cases

= 0.21.11 =
* Added independent toggle button styling options to prevent theme conflicts
* Enhanced mobile responsiveness with improved CSS for desktop-only elements
* Fixed toggle button display issues on various WordPress themes
* Improved accessibility for the toggle button
* Updated configuration options in the WordPress admin

= 0.21.10 =
* Enhanced widget positioning and responsiveness
* Improved compatibility with WordPress 6.5
* Fixed minor styling issues
* Performance optimizations

= 0.20.0 =
* Added support for custom icons and logos
* Improved conversation persistence across tabs
* Enhanced security for API token handling
* Added more customization options for chat appearance

= 0.13.0 =
* Added built-in persistence functionality
* Improved cross-browser compatibility
* Fixed conversation ID handling
* Enhanced error handling and debugging
* Added WordPress admin help documentation

= 0.12.0 =
* Initial release

== Upgrade Notice ==

= 0.21.11 =
This version adds independent toggle button styling options to prevent theme conflicts and enhances mobile responsiveness. Upgrade recommended for all users.

= 0.21.10 =
This version improves compatibility with WordPress 6.5 and fixes several styling issues. Upgrade recommended.

= 0.20.0 =
This version adds support for custom icons and logos, and improves conversation persistence. Upgrade recommended.

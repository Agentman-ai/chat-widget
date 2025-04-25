# Agentman Chat Widget Developer Guide

This guide provides information for developers who want to integrate the Agentman Chat Widget into their own WordPress plugins or themes, or extend its functionality.

## Table of Contents

1. [Integration Methods](#integration-methods)
2. [JavaScript API](#javascript-api)
3. [WordPress Hooks](#wordpress-hooks)
4. [Persistence Implementation](#persistence-implementation)
5. [Custom Styling](#custom-styling)
6. [Troubleshooting](#troubleshooting)

## Integration Methods

There are several ways to integrate the Agentman Chat Widget into your WordPress project:

### Method 1: Shortcode

The simplest way to add the chat widget to specific pages or posts is using the shortcode:

```php
[agentman_chat_widget]
```

You can also pass parameters to customize the widget:

```php
[agentman_chat_widget title="Custom Support" theme_color="#FF5500"]
```

Available shortcode attributes:
- `title` - The title displayed in the chat header
- `theme_color` - Primary color for the widget
- `variant` - Widget display variant (corner, centered, inline)
- `position` - Position of the widget (bottom-right, bottom-left, etc.)

### Method 2: PHP Function

You can programmatically add the widget using the provided PHP function:

```php
<?php
if (function_exists('agentman_chat_widget_display')) {
    $args = array(
        'title' => 'Custom Support',
        'theme_color' => '#FF5500',
        'variant' => 'corner',
        'position' => 'bottom-right'
    );
    agentman_chat_widget_display($args);
}
?>
```

### Method 3: Direct JavaScript Integration

For advanced use cases, you can directly initialize the widget using JavaScript:

```html
<div id="my-custom-chat-container"></div>
<script>
document.addEventListener('DOMContentLoaded', function() {
    if (window.AgentmanChatWidget) {
        const widget = new AgentmanChatWidget({
            agentToken: 'your-token',
            apiUrl: 'https://api.agentman.ai',
            containerId: 'my-custom-chat-container',
            variant: 'inline',
            persistence: {
                enabled: true,
                days: 7
            }
        });
    }
});
</script>
```

## JavaScript API

The Agentman Chat Widget exposes a JavaScript API that allows developers to interact with the widget programmatically.

### Initialization

```javascript
const widget = new AgentmanChatWidget(config);
```

### Configuration Options

```javascript
const config = {
    // Required
    agentToken: 'your-agent-token',
    apiUrl: 'https://api.agentman.ai',
    
    // Display options
    variant: 'corner', // 'corner', 'centered', or 'inline'
    containerId: 'chat-container', // Required for 'inline' variant
    position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    
    // Content
    title: 'Chat Support',
    placeholder: 'Type your message...',
    toggleText: 'Chat with us',
    initialMessage: 'Hello! How can I help you today?',
    
    // Behavior
    initiallyOpen: false,
    initialHeight: '500px',
    initialWidth: '350px',
    
    // Theme
    theme: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        agentBackgroundColor: '#f0f0f0',
        userBackgroundColor: '#e1f5fe',
        agentForegroundColor: '#333333',
        userForegroundColor: '#333333',
        headerBackgroundColor: '#2196f3',
        headerTextColor: '#ffffff',
        agentIconColor: '#2196f3',
        userIconColor: '#ff9800'
    },
    
    // Icons and logos
    icons: {
        userIcon: 'https://example.com/user-icon.png',
        agentIcon: 'https://example.com/agent-icon.png'
    },
    logo: 'https://example.com/logo.png',
    headerLogo: 'https://example.com/header-logo.png',
    
    // Persistence
    persistence: {
        enabled: true,
        days: 7
    }
};
```

### Methods

```javascript
// Open the chat widget
widget.open();

// Close the chat widget
widget.close();

// Toggle the chat widget
widget.toggle();

// Send a message programmatically
widget.sendMessage('Hello from my application!');

// Clear the conversation history
widget.clearConversation();

// Destroy the widget and clean up resources
widget.destroy();

// Get the current conversation ID
const conversationId = widget.getConversationId();

// Check if the widget is currently open
const isOpen = widget.isOpen();
```

### Events

You can listen for events from the chat widget:

```javascript
// Listen for when the widget is opened
widget.on('open', function() {
    console.log('Widget opened');
});

// Listen for when the widget is closed
widget.on('close', function() {
    console.log('Widget closed');
});

// Listen for when a message is sent by the user
widget.on('messageSent', function(message) {
    console.log('User sent message:', message);
});

// Listen for when a message is received from the agent
widget.on('messageReceived', function(message) {
    console.log('Agent sent message:', message);
});

// Listen for conversation start
widget.on('conversationStart', function(conversationId) {
    console.log('Conversation started with ID:', conversationId);
});

// Listen for errors
widget.on('error', function(error) {
    console.error('Widget error:', error);
});
```

## WordPress Hooks

The plugin provides several WordPress hooks that allow developers to customize its behavior.

### Filters

```php
// Modify the widget configuration before it's output
add_filter('agentman_chat_widget_config', function($config) {
    // Modify the configuration
    $config['title'] = 'Custom Title';
    $config['theme']['backgroundColor'] = '#f9f9f9';
    
    return $config;
});

// Modify the persistence settings
add_filter('agentman_chat_widget_persistence_settings', function($settings) {
    // Modify persistence settings
    $settings['enabled'] = true;
    $settings['days'] = 14; // Keep conversations for 14 days
    
    return $settings;
});

// Control which pages the widget appears on
add_filter('agentman_chat_widget_display', function($display) {
    // Only show on product pages
    if (!is_product()) {
        return false;
    }
    
    return $display;
});
```

### Actions

```php
// Do something before the widget is initialized
add_action('agentman_chat_widget_before_init', function() {
    // Custom code here
});

// Do something after the widget is initialized
add_action('agentman_chat_widget_after_init', function() {
    // Custom code here
});

// Hook into the settings save process
add_action('agentman_chat_widget_settings_saved', function($options) {
    // Do something with the saved options
});
```

## Persistence Implementation

The Agentman Chat Widget includes built-in persistence functionality that stores conversation history in the user's browser using localStorage. This allows conversations to be maintained across page reloads and browser sessions.

### How Persistence Works

1. Each conversation is assigned a unique ID (UUID)
2. Messages are stored in localStorage with the conversation ID as a key
3. When the page loads, the widget checks for an existing conversation
4. If found, it loads the conversation history
5. Messages expire after the configured number of days

### Extending Persistence

You can extend the persistence functionality to store conversations in a database or other storage mechanism:

```php
// Example: Store conversations in a custom database table
add_action('wp_ajax_agentman_save_conversation', 'save_conversation_to_db');
add_action('wp_ajax_nopriv_agentman_save_conversation', 'save_conversation_to_db');

function save_conversation_to_db() {
    // Verify nonce
    check_ajax_referer('agentman_chat_widget_nonce', 'nonce');
    
    // Get conversation data
    $conversation_id = sanitize_text_field($_POST['conversation_id']);
    $messages = json_decode(stripslashes($_POST['messages']), true);
    $user_id = get_current_user_id();
    
    // Insert into database
    global $wpdb;
    $table_name = $wpdb->prefix . 'agentman_conversations';
    
    $wpdb->replace(
        $table_name,
        array(
            'conversation_id' => $conversation_id,
            'user_id' => $user_id,
            'messages' => json_encode($messages),
            'updated_at' => current_time('mysql')
        ),
        array('%s', '%d', '%s', '%s')
    );
    
    wp_send_json_success();
}
```

## Custom Styling

You can customize the appearance of the chat widget using CSS:

```css
/* Example: Custom styling for the chat widget */
.agentman-chat-widget {
    /* Widget container */
    border-radius: 12px !important;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1) !important;
}

.agentman-chat-header {
    /* Widget header */
    padding: 15px !important;
}

.agentman-chat-messages {
    /* Messages container */
    padding: 20px !important;
}

.agentman-user-message {
    /* User message bubbles */
    border-radius: 18px 18px 0 18px !important;
}

.agentman-agent-message {
    /* Agent message bubbles */
    border-radius: 18px 18px 18px 0 !important;
}
```

## Troubleshooting

### Common Issues

1. **Widget not appearing**
   - Check if the plugin is activated
   - Verify that the agent token is correct
   - Check for JavaScript errors in the browser console
   - Make sure there are no conflicts with other plugins

2. **Persistence not working**
   - Verify that persistence is enabled in the settings
   - Check if localStorage is available in the browser
   - Look for errors related to storage in the browser console

3. **API connection issues**
   - Confirm that the API URL is correct
   - Verify that the agent token is valid
   - Check network requests in the browser developer tools

### Debugging

Enable debug mode to get more detailed information:

```php
// Add to wp-config.php
define('AGENTMAN_DEBUG', true);
```

Or enable it via JavaScript:

```javascript
const widget = new AgentmanChatWidget({
    // Other config options...
    debug: true
});
```

### Support Resources

- [GitHub Repository](https://github.com/agentman/chat-widget)
- [Support Forum](https://wordpress.org/support/plugin/agentman-chat-widget/)
- [Documentation](https://docs.agentman.ai/chat-widget/)
- [API Reference](https://api.agentman.ai/docs/)

<?php
/**
 * Help documentation for the Agentman Chat Widget admin interface
 * 
 * This file contains the help tabs and contextual help content
 * for the WordPress admin settings page.
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add help tabs to the plugin settings page
 */
function agentman_chat_widget_add_help_tabs() {
    $screen = get_current_screen();
    
    // Only add help tabs on our plugin settings page
    if ($screen->id != 'settings_page_agentman-chat-widget') {
        return;
    }
    
    // Overview Tab
    $screen->add_help_tab(array(
        'id'      => 'agentman-overview',
        'title'   => __('Overview', 'agentman-chat-widget'),
        'content' => '<h2>' . __('Agentman Chat Widget', 'agentman-chat-widget') . '</h2>' .
            '<p>' . __('The Agentman Chat Widget allows your website visitors to interact with an AI assistant directly on your site. This plugin provides a customizable chat interface that can be configured to match your brand and website design.', 'agentman-chat-widget') . '</p>' .
            '<p>' . __('To get started, you\'ll need an Agentman API token. If you don\'t have one yet, you can sign up at <a href="https://agentman.ai" target="_blank">agentman.ai</a>.', 'agentman-chat-widget') . '</p>' .
            '<p>' . __('Once configured, the chat widget will appear on your website according to your settings. Visitors can interact with your AI assistant to get information, support, or engage with your content.', 'agentman-chat-widget') . '</p>'
    ));
    
    // Configuration Tab
    $screen->add_help_tab(array(
        'id'      => 'agentman-configuration',
        'title'   => __('Configuration', 'agentman-chat-widget'),
        'content' => '<h2>' . __('Configuration Options', 'agentman-chat-widget') . '</h2>' .
            '<p>' . __('The plugin settings are organized into several sections:', 'agentman-chat-widget') . '</p>' .
            '<ul>' .
            '<li><strong>' . __('General Settings', 'agentman-chat-widget') . '</strong> - ' . __('Enable/disable the widget, set API credentials, and configure basic behavior.', 'agentman-chat-widget') . '</li>' .
            '<li><strong>' . __('Appearance', 'agentman-chat-widget') . '</strong> - ' . __('Customize colors, dimensions, and visual elements of the chat widget.', 'agentman-chat-widget') . '</li>' .
            '<li><strong>' . __('Content', 'agentman-chat-widget') . '</strong> - ' . __('Set the widget title, placeholder text, and initial messages.', 'agentman-chat-widget') . '</li>' .
            '<li><strong>' . __('Persistence', 'agentman-chat-widget') . '</strong> - ' . __('Configure conversation storage settings.', 'agentman-chat-widget') . '</li>' .
            '</ul>' .
            '<p>' . __('Required fields are marked with an asterisk (*). Make sure to save your changes after making any modifications.', 'agentman-chat-widget') . '</p>'
    ));
    
    // Appearance Tab
    $screen->add_help_tab(array(
        'id'      => 'agentman-appearance',
        'title'   => __('Appearance', 'agentman-chat-widget'),
        'content' => '<h2>' . __('Customizing Appearance', 'agentman-chat-widget') . '</h2>' .
            '<p>' . __('The appearance settings allow you to customize how the chat widget looks on your website:', 'agentman-chat-widget') . '</p>' .
            '<ul>' .
            '<li><strong>' . __('Colors', 'agentman-chat-widget') . '</strong> - ' . __('Customize background colors, text colors, and accent colors.', 'agentman-chat-widget') . '</li>' .
            '<li><strong>' . __('Icons & Logos', 'agentman-chat-widget') . '</strong> - ' . __('Upload custom icons for user and agent avatars, as well as logos.', 'agentman-chat-widget') . '</li>' .
            '<li><strong>' . __('Dimensions', 'agentman-chat-widget') . '</strong> - ' . __('Set the initial height and width of the chat widget.', 'agentman-chat-widget') . '</li>' .
            '<li><strong>' . __('Position', 'agentman-chat-widget') . '</strong> - ' . __('Choose where the chat widget appears on your website.', 'agentman-chat-widget') . '</li>' .
            '</ul>' .
            '<p>' . __('You can use the color pickers to select colors that match your brand. For icons and logos, you can enter a URL to an image or upload one through the WordPress media library.', 'agentman-chat-widget') . '</p>'
    ));
    
    // Persistence Tab
    $screen->add_help_tab(array(
        'id'      => 'agentman-persistence',
        'title'   => __('Persistence', 'agentman-chat-widget'),
        'content' => '<h2>' . __('Conversation Persistence', 'agentman-chat-widget') . '</h2>' .
            '<p>' . __('The persistence functionality allows conversations to be saved and restored across page reloads and browser sessions:', 'agentman-chat-widget') . '</p>' .
            '<ul>' .
            '<li><strong>' . __('Enable Persistence', 'agentman-chat-widget') . '</strong> - ' . __('Turn conversation storage on or off.', 'agentman-chat-widget') . '</li>' .
            '<li><strong>' . __('Storage Duration', 'agentman-chat-widget') . '</strong> - ' . __('Number of days to keep conversations (default: 7 days).', 'agentman-chat-widget') . '</li>' .
            '</ul>' .
            '<p>' . __('When persistence is enabled, conversations are stored in the user\'s browser using localStorage. Each conversation has a unique ID that is maintained across sessions, and messages are automatically loaded when the user returns to your site.', 'agentman-chat-widget') . '</p>' .
            '<p>' . __('For privacy compliance, you should inform your users that their conversation history is being stored in their browser. This information should be included in your privacy policy.', 'agentman-chat-widget') . '</p>'
    ));
    
    // Troubleshooting Tab
    $screen->add_help_tab(array(
        'id'      => 'agentman-troubleshooting',
        'title'   => __('Troubleshooting', 'agentman-chat-widget'),
        'content' => '<h2>' . __('Troubleshooting', 'agentman-chat-widget') . '</h2>' .
            '<p>' . __('If you\'re experiencing issues with the chat widget, here are some common troubleshooting steps:', 'agentman-chat-widget') . '</p>' .
            '<ul>' .
            '<li>' . __('Verify that you\'ve entered a valid Agentman API token.', 'agentman-chat-widget') . '</li>' .
            '<li>' . __('Check that the plugin is activated and the widget is enabled in the settings.', 'agentman-chat-widget') . '</li>' .
            '<li>' . __('Look for JavaScript errors in your browser console that might be preventing the widget from loading.', 'agentman-chat-widget') . '</li>' .
            '<li>' . __('Try temporarily disabling other plugins to check for conflicts.', 'agentman-chat-widget') . '</li>' .
            '<li>' . __('Ensure your theme is not hiding the widget container with CSS.', 'agentman-chat-widget') . '</li>' .
            '<li>' . __('Clear your browser cache and reload the page.', 'agentman-chat-widget') . '</li>' .
            '</ul>' .
            '<p>' . __('If you continue to experience issues, please contact our support team at support@agentman.ai.', 'agentman-chat-widget') . '</p>'
    ));
    
    // Set the help sidebar
    $screen->set_help_sidebar(
        '<p><strong>' . __('For more information:', 'agentman-chat-widget') . '</strong></p>' .
        '<p><a href="https://docs.agentman.ai/chat-widget/" target="_blank">' . __('Documentation', 'agentman-chat-widget') . '</a></p>' .
        '<p><a href="https://support.agentman.ai" target="_blank">' . __('Support', 'agentman-chat-widget') . '</a></p>' .
        '<p><a href="https://agentman.ai/faq" target="_blank">' . __('FAQ', 'agentman-chat-widget') . '</a></p>'
    );
}

/**
 * Add contextual help for specific settings
 */
function agentman_chat_widget_field_help($field_id) {
    $help_text = array(
        'agent_token' => __('Your Agentman API token. The plugin comes with a default demo token so you can test immediately without creating an account. For a custom assistant with your own content and branding, sign up at agentman.ai and replace this token with your own.', 'agentman-chat-widget'),
        'api_url' => __('The API endpoint URL. Leave as default unless instructed otherwise by Agentman support.', 'agentman-chat-widget'),
        'variant' => __('Corner: Shows a floating button that expands to the chat widget. Centered: Displays the widget in the center of the screen. Inline: Embeds the widget directly in a container.', 'agentman-chat-widget'),
        'position' => __('Where the chat widget appears on your website. Only applies to corner and centered variants.', 'agentman-chat-widget'),
        'hide_branding' => __('When enabled, the "Powered by Agentman.ai" text will still appear but without a clickable link. This is enabled by default to comply with WordPress.org guidelines.', 'agentman-chat-widget'),
        'persistence_enabled' => __('When enabled, conversations are saved in the user\'s browser and restored when they return to your site.', 'agentman-chat-widget'),
        'persistence_days' => __('Number of days to keep conversations before they expire. Set to a lower value to reduce storage usage.', 'agentman-chat-widget'),
    );
    
    if (isset($help_text[$field_id])) {
        return '<p class="description">' . $help_text[$field_id] . '</p>';
    }
    
    return '';
}

<?php
/**
 * Agentman Chat Widget Admin
 *
 * @package Agentman_Chat_Widget
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin class for Agentman Chat Widget
 */
class Agentman_Chat_Widget_Admin {
    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Get the singleton instance
     */
    public static function get_instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Add admin hooks
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('wp_ajax_agentman_reset_settings', array($this, 'reset_settings'));
        add_action('wp_ajax_agentman_republish_widget', array($this, 'republish_widget'));
        
        // Add help documentation
        add_action('admin_head', array($this, 'add_help_tabs'));
        
        // Include help documentation file
        require_once AGENTMAN_CHAT_WIDGET_PATH . 'admin/help-doc.php';
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_assets($hook) {
        // Only load on plugin settings page
        if ('settings_page_agentman-chat-widget' !== $hook) {
            return;
        }

        // Enqueue WordPress media scripts
        wp_enqueue_media();

        // Enqueue admin styles
        wp_enqueue_style(
            'agentman-chat-widget-admin',
            AGENTMAN_CHAT_WIDGET_URL . 'admin/css/admin-style.css',
            array(),
            AGENTMAN_CHAT_WIDGET_VERSION
        );
        
        // Enqueue help documentation styles
        wp_enqueue_style(
            'agentman-chat-widget-admin-help',
            AGENTMAN_CHAT_WIDGET_URL . 'admin/css/admin-style-help.css',
            array('agentman-chat-widget-admin'),
            AGENTMAN_CHAT_WIDGET_VERSION
        );

        // Enqueue admin scripts
        wp_enqueue_script(
            'agentman-chat-widget-admin',
            AGENTMAN_CHAT_WIDGET_URL . 'admin/js/admin-script.js',
            array('jquery'),
            AGENTMAN_CHAT_WIDGET_VERSION,
            true
        );

        // Localize the script with plugin data
        wp_localize_script(
            'agentman-chat-widget-admin',
            'agentmanChatWidget',
            array(
                'nonce' => wp_create_nonce('agentman_chat_widget_nonce'),
                'ajaxUrl' => admin_url('admin-ajax.php')
            )
        );

        // Enqueue the chat widget script for preview
        wp_enqueue_script(
            'agentman-chat-widget-preview',
            AGENTMAN_CHAT_WIDGET_URL . 'assets/vendor/agentman-chat-widget.js',
            array(),
            AGENTMAN_CHAT_WIDGET_VERSION,
            true
        );

        // Enqueue the loader script to expose the ChatWidget class globally
        wp_enqueue_script(
            'agentman-chat-widget-loader-preview',
            AGENTMAN_CHAT_WIDGET_URL . 'assets/js/chat-widget-loader.js',
            array('agentman-chat-widget-preview'),
            AGENTMAN_CHAT_WIDGET_VERSION,
            true
        );

        // Make ChatWidget available in the global scope for preview
        wp_add_inline_script(
            'agentman-chat-widget-loader-preview',
            'window.AgentmanChatWidget = window.ChatWidget;'
        );
    }

    /**
     * Reset settings to defaults
     */
    public function reset_settings() {
        // Check nonce
        check_ajax_referer('agentman_chat_widget_nonce', 'nonce');
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }
        
        // Delete options
        delete_option('agentman_chat_widget_options');
        
        // Send success response
        wp_send_json_success('Settings reset to defaults');
    }
    
    /**
     * Republish the widget by clearing caches and updating version info
     */
    public function republish_widget() {
        // Check nonce
        check_ajax_referer('agentman_chat_widget_nonce', 'nonce');
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Permission denied'));
        }
        
        // Clear WordPress transients related to the widget
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_agentman_%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_timeout_agentman_%'");
        
        // Flush WordPress object cache
        wp_cache_flush();
        
        // Try to clear popular caching plugins
        $this->clear_cache_plugins();
        
        // Bump the version timestamp to force cache refresh
        $options = get_option('agentman_chat_widget_options');
        if ($options) {
            // Add or update a timestamp and API URL to force refresh and update endpoint
            $options['last_republish'] = time();
            $options['api_url']       = 'https://run.agentman.ai';
            update_option('agentman_chat_widget_options', $options);
        }
        
        // Send success response
        wp_send_json_success(array(
            'message' => 'Widget republished successfully. All caches have been cleared and configurations refreshed.',
            'timestamp' => time()
        ));
    }
    
    /**
     * Clear caches from popular WordPress caching plugins
     */
    private function clear_cache_plugins() {
        // WP Super Cache
        if (function_exists('wp_cache_clear_cache')) {
            wp_cache_clear_cache();
        }
        
        // W3 Total Cache
        if (function_exists('w3tc_flush_all')) {
            w3tc_flush_all();
        }
        
        // WP Rocket
        if (function_exists('rocket_clean_domain')) {
            rocket_clean_domain();
        }
        
        // WP Fastest Cache
        if (function_exists('wpfc_clear_all_cache')) {
            wpfc_clear_all_cache(true);
        }
        
        // LiteSpeed Cache
        if (class_exists('LiteSpeed_Cache_API') && method_exists('LiteSpeed_Cache_API', 'purge_all')) {
            LiteSpeed_Cache_API::purge_all();
        }
        
        // Autoptimize
        if (class_exists('autoptimizeCache') && method_exists('autoptimizeCache', 'clearall')) {
            autoptimizeCache::clearall();
        }
    }
    
    /**
     * Add help tabs to the plugin settings page
     */
    public function add_help_tabs() {
        $screen = get_current_screen();
        
        // Only add help tabs on our plugin settings page
        if ($screen && $screen->id == 'settings_page_agentman-chat-widget') {
            // Call the function from help-doc.php
            if (function_exists('agentman_chat_widget_add_help_tabs')) {
                agentman_chat_widget_add_help_tabs();
            }
        }
    }
    
    /**
     * Get field help text
     * 
     * @param string $field_id The field ID
     * @return string The help text
     */
    public function get_field_help($field_id) {
        // Call the function from help-doc.php
        if (function_exists('agentman_chat_widget_field_help')) {
            return agentman_chat_widget_field_help($field_id);
        }
        
        return '';
    }
}

// Initialize the admin class
Agentman_Chat_Widget_Admin::get_instance();

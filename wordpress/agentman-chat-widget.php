<?php
/**
 * Plugin Name: Agentman AI Agents
 * Plugin URI: https://github.com/Agentman-ai/chat-widget/tree/main/wordpress
 * Description: Integrates the Agentman AI Agents into your WordPress site with admin customization options.
 * Version: 0.23.0
 * Author: Agentman
 * Author URI: https://agentman.ai
 * License: MIT
 * Text Domain: agentman-chat-widget
 * Requires at least: 5.6
 * Requires PHP: 7.2ls -lrt
 * Tested up to: 6.5
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('AGENTMAN_CHAT_WIDGET_VERSION', '0.23.0');
define('AGENTMAN_CHAT_WIDGET_PATH', plugin_dir_path(__FILE__));
define('AGENTMAN_CHAT_WIDGET_URL', plugin_dir_url(__FILE__));
define('AGENTMAN_CHAT_WIDGET_BASENAME', plugin_basename(__FILE__));

// Include required files
require_once AGENTMAN_CHAT_WIDGET_PATH . 'admin/class-admin.php';

/**
 * Main plugin class
 */
class Agentman_Chat_Widget {
    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Plugin options
     */
    private $options;

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
        // Load plugin options, merging with defaults for missing keys
        $this->options = wp_parse_args(
            get_option('agentman_chat_widget_options', array()),
            $this->get_default_options()
        );
        // Persist merged options to include any new default keys for existing installs
        update_option('agentman_chat_widget_options', $this->options);
        
        // Register activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Initialize the plugin
        add_action('plugins_loaded', array($this, 'init'));
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Add default options if they don't exist
        if (!get_option('agentman_chat_widget_options')) {
            add_option('agentman_chat_widget_options', $this->get_default_options());
        }
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up if needed
    }

    /**
     * Initialize the plugin
     */
    public function init() {
        // Load translations
        load_plugin_textdomain('agentman-chat-widget', false, dirname(AGENTMAN_CHAT_WIDGET_BASENAME) . '/languages');

        // Admin hooks
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu'));
            add_action('admin_init', array($this, 'register_settings'));
            add_filter('plugin_action_links_' . AGENTMAN_CHAT_WIDGET_BASENAME, array($this, 'add_settings_link'));
        }

        // Frontend hooks
        if (!is_admin() && $this->options['enabled']) {
            add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
            add_action('wp_footer', array($this, 'render_chat_widget'));
        }
    }

    /**
     * Get default options
     */
    private function get_default_options() {
        return array(
            'enabled' => true,
            'agent_token' => '.eJyrVipJzUvMK4nPTFGyMjHTUUosKMjJTE4syczPQ4ilp0JVGBqa1wIAxoEQ6Q.aBBksw.BckjpVgss02uf6AWE5yqqMUrQms',
            'api_url' => 'https://run.agentman.ai',
            'variant' => 'corner',
            'position' => 'bottom-right',
            'title' => 'AI Assistant',
            'placeholder' => 'Ask me anything...',
            'toggle_text' => 'Ask Agentman',
            'initially_open' => false,
            'initial_message' => 'Hello! How can I help you today?',
            'welcome_message' => 'How can I help you today?',
            'show_prompts' => true,
            'prompt_1' => 'Tell me about your services',
            'prompt_2' => 'How do I get started?',
            'prompt_3' => 'I need help with...',
            'initial_height' => '600px',
            'initial_width' => '400px',
            'background_color' => '#ffffff',
            'text_color' => '#111827',
            'agent_background_color' => '#f3f4f6',
            'user_background_color' => '#10b981',
            'agent_foreground_color' => '#000000',
            'user_foreground_color' => '#ffffff',
            'header_background_color' => '#059669',
            'header_text_color' => '#ffffff',
            'toggle_background_color' => '#059669',
            'toggle_text_color' => '#ffffff',
            'toggle_icon_color' => '#ffffff',
            'agent_icon_color' => '#059669',
            'user_icon_color' => '#059669',
            'user_icon' => '',
            'agent_icon' => '',
            'logo' => '',
            'header_logo' => '',
            'persistence_enabled' => true,
            'persistence_days' => 7,
            'hide_branding' => true
        );
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('Agentman AI Assistant', 'agentman-chat-widget'),
            __('Agentman AI Assistant', 'agentman-chat-widget'),
            'manage_options',
            'agentman-chat-widget',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting(
            'agentman_chat_widget_options_group',
            'agentman_chat_widget_options',
            array($this, 'sanitize_options')
        );
    }

    /**
     * Sanitize options
     */
    public function sanitize_options($input) {
        $sanitized = array();
        
        // Boolean options
        $sanitized['enabled'] = isset($input['enabled']) ? (bool) $input['enabled'] : false;
        $sanitized['initially_open'] = isset($input['initially_open']) ? (bool) $input['initially_open'] : false;
        $sanitized['persistence_enabled'] = isset($input['persistence_enabled']) ? (bool) $input['persistence_enabled'] : true;
        $sanitized['hide_branding'] = isset($input['hide_branding']) ? (bool) $input['hide_branding'] : true;
        $sanitized['show_prompts'] = isset($input['show_prompts']) ? (bool) $input['show_prompts'] : true;
        
        // Text options
        $sanitized['agent_token'] = sanitize_text_field($input['agent_token']);
        $sanitized['api_url'] = esc_url_raw($input['api_url']);
        $sanitized['title'] = sanitize_text_field($input['title']);
        $sanitized['placeholder'] = sanitize_text_field($input['placeholder']);
        $sanitized['toggle_text'] = sanitize_text_field($input['toggle_text']);
        $sanitized['initial_message'] = sanitize_text_field($input['initial_message']);
        $sanitized['welcome_message'] = sanitize_text_field(isset($input['welcome_message']) ? $input['welcome_message'] : '');
        $sanitized['prompt_1'] = sanitize_text_field(isset($input['prompt_1']) ? $input['prompt_1'] : '');
        $sanitized['prompt_2'] = sanitize_text_field(isset($input['prompt_2']) ? $input['prompt_2'] : '');
        $sanitized['prompt_3'] = sanitize_text_field(isset($input['prompt_3']) ? $input['prompt_3'] : '');
        $sanitized['initial_height'] = sanitize_text_field($input['initial_height']);
        $sanitized['initial_width'] = sanitize_text_field($input['initial_width']);
        
        // Color options
        $sanitized['background_color'] = sanitize_hex_color($input['background_color']);
        $sanitized['text_color'] = sanitize_hex_color($input['text_color']);
        $sanitized['agent_background_color'] = sanitize_hex_color($input['agent_background_color']);
        $sanitized['user_background_color'] = sanitize_hex_color($input['user_background_color']);
        $sanitized['agent_foreground_color'] = sanitize_hex_color($input['agent_foreground_color']);
        $sanitized['user_foreground_color'] = sanitize_hex_color($input['user_foreground_color']);
        $sanitized['header_background_color'] = sanitize_hex_color($input['header_background_color']);
        $sanitized['header_text_color'] = sanitize_hex_color($input['header_text_color']);
        $sanitized['agent_icon_color'] = sanitize_hex_color($input['agent_icon_color']);
        $sanitized['user_icon_color'] = sanitize_hex_color($input['user_icon_color']);
        
        // Toggle button color options
        $sanitized['toggle_background_color'] = sanitize_hex_color(isset($input['toggle_background_color']) ? $input['toggle_background_color'] : '#059669');
        $sanitized['toggle_text_color'] = sanitize_hex_color(isset($input['toggle_text_color']) ? $input['toggle_text_color'] : '#ffffff');
        $sanitized['toggle_icon_color'] = sanitize_hex_color(isset($input['toggle_icon_color']) ? $input['toggle_icon_color'] : '#ffffff');
        
        // Select options
        $sanitized['variant'] = in_array($input['variant'], array('corner', 'centered', 'inline')) ? $input['variant'] : 'corner';
        $sanitized['position'] = in_array($input['position'], array('bottom-right', 'bottom-left', 'top-right', 'top-left')) ? $input['position'] : 'bottom-right';
        
        // URL options
        $sanitized['user_icon'] = esc_url_raw($input['user_icon']);
        $sanitized['agent_icon'] = esc_url_raw($input['agent_icon']);
        $sanitized['logo'] = esc_url_raw($input['logo']);
        $sanitized['header_logo'] = esc_url_raw($input['header_logo']);
        
        // Persistence options
        $sanitized['persistence_days'] = absint($input['persistence_days']);
        
        return $sanitized;
    }

    /**
     * Add settings link on plugin page
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="options-general.php?page=agentman-chat-widget">' . __('Settings', 'agentman-chat-widget') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Save settings if form is submitted
        if (isset($_POST['agentman_chat_widget_options'])) {
            $this->options = $this->sanitize_options($_POST['agentman_chat_widget_options']);
            update_option('agentman_chat_widget_options', $this->options);
            echo '<div class="notice notice-success is-dismissible"><p>' . __('Settings saved.', 'agentman-chat-widget') . '</p></div>';
        }
        
        // Include admin view
        include_once AGENTMAN_CHAT_WIDGET_PATH . 'admin/admin-page.php';
    }

    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        // Register the Agentman Chat Widget script with built-in persistence
        wp_register_script(
            'agentman-chat-widget-core',
            AGENTMAN_CHAT_WIDGET_URL . 'assets/vendor/agentman-chat-widget.js',
            array(),
            AGENTMAN_CHAT_WIDGET_VERSION,
            true
        );
        
        // Enqueue the loader script to expose the ChatWidget class globally
        wp_enqueue_script(
            'agentman-chat-widget-loader',
            AGENTMAN_CHAT_WIDGET_URL . 'assets/js/chat-widget-loader.js',
            array('agentman-chat-widget-core'),
            AGENTMAN_CHAT_WIDGET_VERSION,
            true
        );
        
        // Enqueue the initialization script
        wp_enqueue_script(
            'agentman-chat-widget-init',
            AGENTMAN_CHAT_WIDGET_URL . 'assets/js/agentman-chat-widget.js',
            array('agentman-chat-widget-loader'),
            AGENTMAN_CHAT_WIDGET_VERSION,
            true
        );
        
        // Localize the script with plugin options
        wp_localize_script(
            'agentman-chat-widget-init',
            'agentmanChatWidgetOptions',
            $this->get_widget_config()
        );
    }

    /**
     * Get widget configuration
     */
    private function get_widget_config() {
        // Process prompts to handle validation and edge cases
        $prompts = array();
        $prompt_fields = array('prompt_1', 'prompt_2', 'prompt_3');
        
        foreach ($prompt_fields as $field) {
            if (isset($this->options[$field]) && ($this->options[$field] !== '' || $this->options[$field] === '0')) {
                // Limit prompt length to 50 characters to prevent UI issues
                $prompt = substr($this->options[$field], 0, 50);
                // Escape the prompt for safe output in JavaScript
                $prompts[] = esc_js($prompt);
            }
        }
        
        return array(
            // Cache busting parameters
            'version' => AGENTMAN_CHAT_WIDGET_VERSION,
            'timestamp' => isset($this->options['last_republish']) ? $this->options['last_republish'] : time(), // Use last republish timestamp for cache busting
            
            // Widget configuration
            'agentToken' => $this->options['agent_token'],
            'apiUrl' => $this->options['api_url'],
            'containerId' => 'agentman-chat-widget-container',
            'variant' => $this->options['variant'],
            'position' => $this->options['position'],
            'title' => $this->options['title'],
            'placeholder' => $this->options['placeholder'],
            'toggleText' => $this->options['toggle_text'],
            'initiallyOpen' => $this->options['initially_open'],
            'initialMessage' => $this->options['initial_message'],
            'initialHeight' => $this->options['initial_height'],
            'initialWidth' => $this->options['initial_width'],
            'hideBranding' => isset($this->options['hide_branding']) ? (bool)$this->options['hide_branding'] : true,
            'theme' => array(
                'backgroundColor' => $this->options['background_color'],
                'textColor' => $this->options['text_color'],
                'agentBackgroundColor' => $this->options['agent_background_color'],
                'userBackgroundColor' => $this->options['user_background_color'],
                'agentForegroundColor' => $this->options['agent_foreground_color'],
                'userForegroundColor' => $this->options['user_foreground_color'],
                'headerBackgroundColor' => $this->options['header_background_color'],
                'headerTextColor' => $this->options['header_text_color'],
                'agentIconColor' => $this->options['agent_icon_color'],
                'userIconColor' => $this->options['user_icon_color']
            ),
            'toggleStyle' => array(
                'backgroundColor' => isset($this->options['toggle_background_color']) ? $this->options['toggle_background_color'] : '#059669',
                'textColor' => isset($this->options['toggle_text_color']) ? $this->options['toggle_text_color'] : '#ffffff',
                'iconColor' => isset($this->options['toggle_icon_color']) ? $this->options['toggle_icon_color'] : '#ffffff'
            ),
            'icons' => array(
                'userIcon' => $this->options['user_icon'],
                'agentIcon' => $this->options['agent_icon']
            ),
            'logo' => $this->options['logo'],
            'headerLogo' => $this->options['header_logo'],
            'isAdmin' => current_user_can('manage_options'),
            'persistence' => array(
                'enabled' => isset($this->options['persistence_enabled']) ? $this->options['persistence_enabled'] : true,
                'days' => isset($this->options['persistence_days']) ? $this->options['persistence_days'] : 7
            ),
            'messagePrompts' => array(
                // Include the show option to toggle visibility
                'show' => isset($this->options['show_prompts']) ? (bool)$this->options['show_prompts'] : true,
                // Properly escape the welcome message for JS
                'welcome_message' => isset($this->options['welcome_message']) ? esc_js($this->options['welcome_message']) : '',
                // Use the processed prompts array
                'prompts' => $prompts
            )
        );
    }

    /**
     * Render chat widget container
     */
    public function render_chat_widget() {
        echo '<div id="agentman-chat-widget-container"></div>';
    }
}

// Initialize the plugin
Agentman_Chat_Widget::get_instance();

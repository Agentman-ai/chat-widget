<?php
/**
 * Settings Fields Helper Functions
 *
 * @package Agentman_Chat_Widget
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Generate a settings field with help text
 * 
 * @param string $field_id The field ID
 * @param string $field_name The field name
 * @param string $field_type The field type (text, checkbox, select, etc.)
 * @param array $options The current options
 * @param array $args Additional arguments
 */
function agentman_chat_widget_field($field_id, $field_name, $field_type, $options, $args = array()) {
    $defaults = array(
        'label' => '',
        'description' => '',
        'placeholder' => '',
        'class' => '',
        'options' => array(),
        'min' => '',
        'max' => '',
        'step' => '1',
        'required' => false,
    );
    
    $args = wp_parse_args($args, $defaults);
    $value = isset($options[$field_id]) ? $options[$field_id] : '';
    $name = "agentman_chat_widget_options[$field_id]";
    $required = $args['required'] ? 'required' : '';
    $class = !empty($args['class']) ? ' class="' . esc_attr($args['class']) . '"' : '';
    
    // Get help text from the help documentation
    $help_text = '';
    if (class_exists('Agentman_Chat_Widget_Admin')) {
        $admin = Agentman_Chat_Widget_Admin::get_instance();
        $help_text = $admin->get_field_help($field_id);
    }
    
    // If no help text is found from the help documentation, use the description
    if (empty($help_text) && !empty($args['description'])) {
        $help_text = '<p class="description">' . esc_html($args['description']) . '</p>';
    }
    
    switch ($field_type) {
        case 'text':
        case 'url':
        case 'email':
        case 'number':
            printf(
                '<input type="%1$s" id="%2$s" name="%3$s" value="%4$s" placeholder="%5$s" %6$s %7$s />',
                esc_attr($field_type),
                esc_attr($field_id),
                esc_attr($name),
                esc_attr($value),
                esc_attr($args['placeholder']),
                $required,
                $class
            );
            
            if ($field_type === 'number') {
                printf(
                    '<input type="range" id="%1$s_range" min="%2$s" max="%3$s" step="%4$s" value="%5$s" oninput="%1$s.value=this.value" />',
                    esc_attr($field_id),
                    esc_attr($args['min']),
                    esc_attr($args['max']),
                    esc_attr($args['step']),
                    esc_attr($value)
                );
            }
            break;
            
        case 'checkbox':
            printf(
                '<label for="%1$s"><input type="checkbox" id="%1$s" name="%2$s" value="1" %3$s %4$s /> %5$s</label>',
                esc_attr($field_id),
                esc_attr($name),
                checked(1, $value, false),
                $class,
                esc_html($args['label'])
            );
            break;
            
        case 'select':
            printf(
                '<select id="%1$s" name="%2$s" %3$s %4$s>',
                esc_attr($field_id),
                esc_attr($name),
                $required,
                $class
            );
            
            foreach ($args['options'] as $option_value => $option_label) {
                printf(
                    '<option value="%1$s" %2$s>%3$s</option>',
                    esc_attr($option_value),
                    selected($option_value, $value, false),
                    esc_html($option_label)
                );
            }
            
            echo '</select>';
            break;
            
        case 'textarea':
            printf(
                '<textarea id="%1$s" name="%2$s" placeholder="%3$s" %4$s %5$s>%6$s</textarea>',
                esc_attr($field_id),
                esc_attr($name),
                esc_attr($args['placeholder']),
                $required,
                $class,
                esc_textarea($value)
            );
            break;
            
        case 'color':
            printf(
                '<input type="color" id="%1$s" name="%2$s" value="%3$s" %4$s %5$s />',
                esc_attr($field_id),
                esc_attr($name),
                esc_attr($value),
                $required,
                $class
            );
            break;
            
        case 'media':
            $preview = '';
            if (!empty($value)) {
                $preview = sprintf(
                    '<div class="agentman-media-preview"><img src="%s" alt="" /></div>',
                    esc_url($value)
                );
            }
            
            printf(
                '<div class="agentman-media-field">
                    <input type="url" id="%1$s" name="%2$s" value="%3$s" placeholder="%4$s" %5$s %6$s />
                    <button type="button" class="button agentman-media-upload" data-target="%1$s">%7$s</button>
                    <button type="button" class="button agentman-media-remove" data-target="%1$s">%8$s</button>
                    %9$s
                </div>',
                esc_attr($field_id),
                esc_attr($name),
                esc_attr($value),
                esc_attr($args['placeholder']),
                $required,
                $class,
                esc_html__('Select Image', 'agentman-chat-widget'),
                esc_html__('Remove', 'agentman-chat-widget'),
                $preview
            );
            break;
    }
    
    // Output help text
    echo $help_text;
}

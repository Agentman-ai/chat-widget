<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <form method="post" action="">
        <div class="agentman-tabs">
            <div class="agentman-tab-nav">
                <button type="button" class="agentman-tab-link active" data-tab="general"><?php _e('General', 'agentman-chat-widget'); ?></button>
                <button type="button" class="agentman-tab-link" data-tab="appearance"><?php _e('Appearance', 'agentman-chat-widget'); ?></button>
                <button type="button" class="agentman-tab-link" data-tab="content"><?php _e('Content', 'agentman-chat-widget'); ?></button>
                <button type="button" class="agentman-tab-link" data-tab="advanced"><?php _e('Advanced', 'agentman-chat-widget'); ?></button>
            </div>
            
            <!-- General Settings Tab -->
            <div id="general" class="agentman-tab-content active">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[enabled]"><?php _e('Enable Chat Widget', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="checkbox" id="agentman_chat_widget_options[enabled]" name="agentman_chat_widget_options[enabled]" value="1" <?php checked(1, $this->options['enabled']); ?> />
                            <p class="description"><?php _e('Enable or disable the chat widget on your site.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[agent_token]"><?php _e('Agent Token', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="agentman_chat_widget_options[agent_token]" name="agentman_chat_widget_options[agent_token]" value="<?php echo esc_attr($this->options['agent_token']); ?>" class="regular-text" required />
                            <p class="description"><?php _e('Your Agentman API token (required).', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <!-- API URL field hidden as it's an internal setting that won't change -->
                    <input type="hidden" id="agentman_chat_widget_options[api_url]" name="agentman_chat_widget_options[api_url]" value="<?php echo esc_url($this->options['api_url']); ?>" />
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[variant]"><?php _e('Widget Placement', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <select id="agentman_chat_widget_options[variant]" name="agentman_chat_widget_options[variant]">
                                <option value="corner" <?php selected('corner', $this->options['variant']); ?>><?php _e('Corner', 'agentman-chat-widget'); ?></option>
                                <option value="centered" <?php selected('centered', $this->options['variant']); ?>><?php _e('Centered', 'agentman-chat-widget'); ?></option>
                                <option value="inline" <?php selected('inline', $this->options['variant']); ?>><?php _e('Inline', 'agentman-chat-widget'); ?></option>
                            </select>
                            <p class="description"><?php _e('Widget placement style.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[position]"><?php _e('Position', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <select id="agentman_chat_widget_options[position]" name="agentman_chat_widget_options[position]">
                                <option value="bottom-right" <?php selected('bottom-right', $this->options['position']); ?>><?php _e('Bottom Right', 'agentman-chat-widget'); ?></option>
                                <option value="bottom-left" <?php selected('bottom-left', $this->options['position']); ?>><?php _e('Bottom Left', 'agentman-chat-widget'); ?></option>
                                <option value="top-right" <?php selected('top-right', $this->options['position']); ?>><?php _e('Top Right', 'agentman-chat-widget'); ?></option>
                                <option value="top-left" <?php selected('top-left', $this->options['position']); ?>><?php _e('Top Left', 'agentman-chat-widget'); ?></option>
                            </select>
                            <p class="description"><?php _e('Widget position on the screen (for corner variant).', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[initially_open]"><?php _e('Initially Open', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="checkbox" id="agentman_chat_widget_options[initially_open]" name="agentman_chat_widget_options[initially_open]" value="1" <?php checked(1, $this->options['initially_open']); ?> />
                            <p class="description"><?php _e('Open the chat widget automatically when the page loads.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label><?php _e('Preview', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <button type="button" id="agentman-preview-widget" class="button button-primary"><?php _e('Preview Chat Widget', 'agentman-chat-widget'); ?></button>
                            <p class="description"><?php _e('Preview how the chat widget will appear on your site with current settings.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Appearance Settings Tab -->
            <div id="appearance" class="agentman-tab-content">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[initial_height]"><?php _e('Initial Height', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="agentman_chat_widget_options[initial_height]" name="agentman_chat_widget_options[initial_height]" value="<?php echo esc_attr($this->options['initial_height']); ?>" class="regular-text" />
                            <p class="description"><?php _e('Initial height of the widget (e.g., 600px).', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[initial_width]"><?php _e('Initial Width', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="agentman_chat_widget_options[initial_width]" name="agentman_chat_widget_options[initial_width]" value="<?php echo esc_attr($this->options['initial_width']); ?>" class="regular-text" />
                            <p class="description"><?php _e('Initial width of the widget (e.g., 400px).', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label><?php _e('Theme Colors', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <div class="agentman-color-fields">
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[background_color]"><?php _e('Background Color', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[background_color]" name="agentman_chat_widget_options[background_color]" value="<?php echo esc_attr($this->options['background_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[text_color]"><?php _e('Text Color', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[text_color]" name="agentman_chat_widget_options[text_color]" value="<?php echo esc_attr($this->options['text_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[header_background_color]"><?php _e('Header Background', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[header_background_color]" name="agentman_chat_widget_options[header_background_color]" value="<?php echo esc_attr($this->options['header_background_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[header_text_color]"><?php _e('Header Text', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[header_text_color]" name="agentman_chat_widget_options[header_text_color]" value="<?php echo esc_attr($this->options['header_text_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[agent_background_color]"><?php _e('Agent Background', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[agent_background_color]" name="agentman_chat_widget_options[agent_background_color]" value="<?php echo esc_attr($this->options['agent_background_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[agent_foreground_color]"><?php _e('Agent Text', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[agent_foreground_color]" name="agentman_chat_widget_options[agent_foreground_color]" value="<?php echo esc_attr($this->options['agent_foreground_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[user_background_color]"><?php _e('User Background', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[user_background_color]" name="agentman_chat_widget_options[user_background_color]" value="<?php echo esc_attr($this->options['user_background_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[user_foreground_color]"><?php _e('User Text', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[user_foreground_color]" name="agentman_chat_widget_options[user_foreground_color]" value="<?php echo esc_attr($this->options['user_foreground_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[agent_icon_color]"><?php _e('Agent Icon Color', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[agent_icon_color]" name="agentman_chat_widget_options[agent_icon_color]" value="<?php echo esc_attr($this->options['agent_icon_color']); ?>" />
                                </div>
                                <div class="agentman-color-field">
                                    <label for="agentman_chat_widget_options[user_icon_color]"><?php _e('User Icon Color', 'agentman-chat-widget'); ?></label>
                                    <input type="color" id="agentman_chat_widget_options[user_icon_color]" name="agentman_chat_widget_options[user_icon_color]" value="<?php echo esc_attr($this->options['user_icon_color']); ?>" />
                                </div>
                            </div>
                        </td>
                    </tr>
                    <!-- Logo customization temporarily disabled
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[logo]"><?php _e('Logo URL', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="url" id="agentman_chat_widget_options[logo]" name="agentman_chat_widget_options[logo]" value="<?php echo esc_url($this->options['logo']); ?>" class="regular-text" />
                            <button type="button" class="button agentman-media-upload" data-target="agentman_chat_widget_options[logo]"><?php _e('Select Image', 'agentman-chat-widget'); ?></button>
                            <p class="description"><?php _e('URL for the main logo.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    -->
                    <!-- Header logo customization temporarily disabled
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[header_logo]"><?php _e('Header Logo URL', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="url" id="agentman_chat_widget_options[header_logo]" name="agentman_chat_widget_options[header_logo]" value="<?php echo esc_url($this->options['header_logo']); ?>" class="regular-text" />
                            <button type="button" class="button agentman-media-upload" data-target="agentman_chat_widget_options[header_logo]"><?php _e('Select Image', 'agentman-chat-widget'); ?></button>
                            <p class="description"><?php _e('URL for the header logo (32x32px).', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    -->
                    <!-- User icon customization temporarily disabled
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[user_icon]"><?php _e('User Icon URL', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="url" id="agentman_chat_widget_options[user_icon]" name="agentman_chat_widget_options[user_icon]" value="<?php echo esc_url($this->options['user_icon']); ?>" class="regular-text" />
                            <button type="button" class="button agentman-media-upload" data-target="agentman_chat_widget_options[user_icon]"><?php _e('Select Image', 'agentman-chat-widget'); ?></button>
                            <p class="description"><?php _e('URL for the user avatar icon.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    -->
                    <!-- Agent icon customization temporarily disabled
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[agent_icon]"><?php _e('Agent Icon URL', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="url" id="agentman_chat_widget_options[agent_icon]" name="agentman_chat_widget_options[agent_icon]" value="<?php echo esc_url($this->options['agent_icon']); ?>" class="regular-text" />
                            <button type="button" class="button agentman-media-upload" data-target="agentman_chat_widget_options[agent_icon]"><?php _e('Select Image', 'agentman-chat-widget'); ?></button>
                            <p class="description"><?php _e('URL for the agent avatar icon.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    -->
                </table>
            </div>
            
            <!-- Content Settings Tab -->
            <div id="content" class="agentman-tab-content">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[title]"><?php _e('Widget Title', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="agentman_chat_widget_options[title]" name="agentman_chat_widget_options[title]" value="<?php echo esc_attr($this->options['title']); ?>" class="regular-text" />
                            <p class="description"><?php _e('Title displayed in the chat header.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[placeholder]"><?php _e('Input Placeholder', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="agentman_chat_widget_options[placeholder]" name="agentman_chat_widget_options[placeholder]" value="<?php echo esc_attr($this->options['placeholder']); ?>" class="regular-text" />
                            <p class="description"><?php _e('Placeholder text for the chat input field.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[toggle_text]"><?php _e('Toggle Button Text', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="agentman_chat_widget_options[toggle_text]" name="agentman_chat_widget_options[toggle_text]" value="<?php echo esc_attr($this->options['toggle_text']); ?>" class="regular-text" />
                            <p class="description"><?php _e('Text shown on the toggle button (corner variant).', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="agentman_chat_widget_options[initial_message]"><?php _e('Initial Message', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <textarea id="agentman_chat_widget_options[initial_message]" name="agentman_chat_widget_options[initial_message]" rows="3" class="large-text"><?php echo esc_textarea($this->options['initial_message']); ?></textarea>
                            <p class="description"><?php _e('Initial message displayed from the agent when chat is opened.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Advanced Settings Tab -->
            <div id="advanced" class="agentman-tab-content">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label><?php _e('Conversation Persistence', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <fieldset>
                                <label for="agentman_chat_widget_options[persistence_enabled]">
                                    <input type="checkbox" id="agentman_chat_widget_options[persistence_enabled]" name="agentman_chat_widget_options[persistence_enabled]" value="1" <?php checked(1, $this->options['persistence_enabled']); ?> />
                                    <?php _e('Enable conversation persistence across pages', 'agentman-chat-widget'); ?>
                                </label>
                                <p class="description"><?php _e('When enabled, conversation history will be maintained when users navigate between pages.', 'agentman-chat-widget'); ?></p>
                                
                                <div style="margin-top: 10px;">
                                    <label for="agentman_chat_widget_options[persistence_days]">
                                        <?php _e('Keep conversation history for', 'agentman-chat-widget'); ?>
                                        <input type="number" id="agentman_chat_widget_options[persistence_days]" name="agentman_chat_widget_options[persistence_days]" value="<?php echo esc_attr($this->options['persistence_days']); ?>" min="1" max="30" style="width: 60px;" />
                                        <?php _e('days', 'agentman-chat-widget'); ?>
                                    </label>
                                </div>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label><?php _e('Reset Settings', 'agentman-chat-widget'); ?></label>
                        </th>
                        <td>
                            <button type="button" id="agentman-reset-settings" class="button"><?php _e('Reset to Defaults', 'agentman-chat-widget'); ?></button>
                            <p class="description"><?php _e('Reset all settings to default values.', 'agentman-chat-widget'); ?></p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        
        <p class="submit">
            <input type="submit" name="submit" id="submit" class="button button-primary" value="<?php _e('Save Changes', 'agentman-chat-widget'); ?>" />
        </p>
    </form>
</div>

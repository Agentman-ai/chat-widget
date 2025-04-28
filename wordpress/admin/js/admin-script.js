/**
 * Agentman Chat Widget Admin Scripts
 */
(function($) {
    'use strict';

    // Initialize when document is ready
    $(document).ready(function() {
        // Initialize help tooltips
        initHelpTooltips();

        // Tab Navigation
        $('.agentman-tab-link').on('click', function(e) {
            e.preventDefault();
            
            // Get the tab ID
            const tabId = $(this).data('tab');
            
            // Remove active class from all tabs and content
            $('.agentman-tab-link').removeClass('active');
            $('.agentman-tab-content').removeClass('active');
            
            // Add active class to current tab and content
            $(this).addClass('active');
            $('#' + tabId).addClass('active');
        });

        // Media Upload
        $('.agentman-media-upload').on('click', function(e) {
            e.preventDefault();
            
            const targetInput = $(this).data('target');
            
            // Create a media frame
            const mediaFrame = wp.media({
                title: 'Select or Upload Media',
                button: {
                    text: 'Use this media'
                },
                multiple: false
            });
            
            // When an image is selected, run a callback
            mediaFrame.on('select', function() {
                const attachment = mediaFrame.state().get('selection').first().toJSON();
                $('input[name="' + targetInput + '"]').val(attachment.url);
            });
            
            // Open the media frame
            mediaFrame.open();
        });

        // Preview Widget
        $('#agentman-preview-widget').on('click', function(e) {
            e.preventDefault();
            
            // Get current settings
            const settings = {
                agentToken: $('#agentman_chat_widget_options\\[agent_token\\]').val(),
                apiUrl: $('#agentman_chat_widget_options\\[api_url\\]').val(),
                // Use the variant from the settings
                variant: $('#agentman_chat_widget_options\\[variant\\]').val(),
                position: $('#agentman_chat_widget_options\\[position\\]').val(),
                title: $('#agentman_chat_widget_options\\[title\\]').val(),
                placeholder: $('#agentman_chat_widget_options\\[placeholder\\]').val(),
                toggleText: $('#agentman_chat_widget_options\\[toggle_text\\]').val(),
                initiallyOpen: true, // Always open for preview
                initialMessage: $('#agentman_chat_widget_options\\[initial_message\\]').val(),
                initialHeight: $('#agentman_chat_widget_options\\[initial_height\\]').val(),
                initialWidth: $('#agentman_chat_widget_options\\[initial_width\\]').val(),
                theme: {
                    backgroundColor: $('#agentman_chat_widget_options\\[background_color\\]').val(),
                    textColor: $('#agentman_chat_widget_options\\[text_color\\]').val(),
                    agentBackgroundColor: $('#agentman_chat_widget_options\\[agent_background_color\\]').val(),
                    userBackgroundColor: $('#agentman_chat_widget_options\\[user_background_color\\]').val(),
                    agentForegroundColor: $('#agentman_chat_widget_options\\[agent_foreground_color\\]').val(),
                    userForegroundColor: $('#agentman_chat_widget_options\\[user_foreground_color\\]').val(),
                    headerBackgroundColor: $('#agentman_chat_widget_options\\[header_background_color\\]').val(),
                    headerTextColor: $('#agentman_chat_widget_options\\[header_text_color\\]').val(),
                    agentIconColor: $('#agentman_chat_widget_options\\[agent_icon_color\\]').val()
                    // User icon color removed since user icons are not displayed
                },
                icons: {
                    // User icon removed since user icons are not displayed
                    agentIcon: $('#agentman_chat_widget_options\\[agent_icon\\]').val()
                },
                logo: $('#agentman_chat_widget_options\\[logo\\]').val(),
                headerLogo: $('#agentman_chat_widget_options\\[header_logo\\]').val(),
                persistence: {
                    enabled: $('#agentman_chat_widget_options\\[persistence_enabled\\]').is(':checked'),
                    days: parseInt($('#agentman_chat_widget_options\\[persistence_days\\]').val(), 10) || 7
                }
            };
            
            // Initialize or update the widget directly (no modal)
            if (window.AgentmanChatWidget) {
                // If preview widget exists, destroy it first
                if (window.previewWidget) {
                    window.previewWidget.destroy();
                }
                
                // Create a new preview widget with current settings
                window.previewWidget = new window.AgentmanChatWidget(settings);
                
                // Show a notification that preview is active
                const $notification = $('<div class="notice notice-info is-dismissible"><p><strong>Preview Active:</strong> The chat widget is now visible with your current settings. Click "Stop Preview" to hide it.</p></div>');
                $notification.insertAfter('#agentman-preview-widget');
                
                // Change button text to "Stop Preview"
                $(this).text('Stop Preview').addClass('button-secondary').attr('id', 'agentman-stop-preview');
                
                // Add event handler for the stop preview button
                $('#agentman-stop-preview').on('click', function(e) {
                    e.preventDefault();
                    
                    // Destroy the preview widget
                    if (window.previewWidget) {
                        window.previewWidget.destroy();
                        window.previewWidget = null;
                    }
                    
                    // Remove the notification
                    $('.notice').remove();
                    
                    // Change button text back
                    $(this).text('Preview Chat Widget').removeClass('button-secondary').attr('id', 'agentman-preview-widget');
                });
            } else {
                // Show error if widget class is not available
                const $error = $('<div class="notice notice-error is-dismissible"><p>Chat widget preview not available. Please save settings first.</p></div>');
                $error.insertAfter('#agentman-preview-widget');
            }
        });
        
        // We've removed the modal, so this handler is no longer needed
        
        // Reset Settings
        $('#agentman-reset-settings').on('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to reset all settings to default values? This cannot be undone.')) {
                // Send AJAX request to reset settings
                $.ajax({
                    url: agentmanChatWidget.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'agentman_reset_settings',
                        nonce: agentmanChatWidget.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            alert('Settings have been reset to defaults. The page will now reload.');
                            window.location.reload();
                        } else {
                            alert('Error: ' + response.data);
                        }
                    },
                    error: function() {
                        alert('An error occurred while resetting settings.');
                    }
                });
            }
        });
        
        // Toggle help sections
        $('.agentman-help-toggle').on('click', function(e) {
            e.preventDefault();
            $(this).next('.agentman-help-content').slideToggle();
            $(this).toggleClass('open');
        });
        
        // Show contextual help when field is focused
        $('.agentman-field').on('focus', function() {
            const fieldId = $(this).attr('id');
            const helpText = $('#' + fieldId + '-help');
            
            if (helpText.length) {
                helpText.addClass('active');
            }
        }).on('blur', function() {
            const fieldId = $(this).attr('id');
            const helpText = $('#' + fieldId + '-help');
            
            if (helpText.length) {
                helpText.removeClass('active');
            }
        });
    });
    
    /**
     * Initialize help tooltips
     */
    function initHelpTooltips() {
        $('.agentman-help-icon').on('mouseenter', function() {
            const tooltip = $(this).find('.agentman-tooltip');
            tooltip.fadeIn(200);
            
            // Position the tooltip
            const iconPos = $(this).offset();
            const tooltipWidth = tooltip.outerWidth();
            const windowWidth = $(window).width();
            
            // Check if tooltip would go off-screen to the right
            if (iconPos.left + tooltipWidth > windowWidth) {
                tooltip.css({
                    left: 'auto',
                    right: '20px'
                });
            }
        }).on('mouseleave', function() {
            $(this).find('.agentman-tooltip').fadeOut(200);
        });
    }
})(jQuery);

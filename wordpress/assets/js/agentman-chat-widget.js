/**
 * Agentman AI Agents Frontend Script
 * 
 * This script initializes the Agentman AI Agents on the frontend
 * using the configuration provided by WordPress.
 */
(function() {
    'use strict';
    
    let initAttempts = 0;
    const MAX_ATTEMPTS = 3;
    
    // Function to initialize the widget
    function attemptInitialization() {
        // Check if the configuration object exists
        if (typeof agentmanChatWidgetOptions === 'undefined') {
            console.error('Agentman Chat Widget: Configuration not found.');
            handleInitFailure('Configuration not found');
            return;
        }
        

        // Check if required fields are present
        if (!agentmanChatWidgetOptions.agentToken) {
            console.error('Agentman Chat Widget: Agent token is required.');
            handleInitFailure('Agent token is missing');
            return;
        }

        // Check if ChatWidget is available
        if (typeof window.ChatWidget === 'undefined') {
            console.error('Agentman Chat Widget: ChatWidget class not found. Make sure the widget script is loaded correctly.');
            
            // If we haven't reached max attempts, try again
            if (initAttempts < MAX_ATTEMPTS) {
                initAttempts++;
                setTimeout(attemptInitialization, initAttempts * 500);
            } else {
                handleInitFailure('ChatWidget class not found after multiple attempts');
            }
            return;
        }

        initializeWidget();
    }
    
    function handleInitFailure(reason) {
        console.error(`Agentman Chat Widget: Initialization failed - ${reason}`);
        
        // Create a visible error message for admins
        if (agentmanChatWidgetOptions && agentmanChatWidgetOptions.containerId) {
            const container = document.getElementById(agentmanChatWidgetOptions.containerId);
            if (container) {
                // Only show detailed error to admins
                if (typeof agentmanChatWidgetOptions.isAdmin === 'boolean' && agentmanChatWidgetOptions.isAdmin) {
                    container.innerHTML = `
                        <div style="border: 1px solid #f44336; padding: 15px; border-radius: 4px; margin: 10px 0; background-color: #ffebee;">
                            <h3 style="color: #d32f2f; margin-top: 0;">Agentman Chat Widget Error</h3>
                            <p>The chat widget failed to initialize: ${reason}</p>
                            <p>Please check the browser console for more details.</p>
                        </div>
                    `;
                }
            }
        }
    }
    
    function initializeWidget() {
        try {
            // Check for stored version and timestamp in localStorage
            const storedVersion = localStorage.getItem('agentman_chat_widget_version');
            const storedTimestamp = localStorage.getItem('agentman_chat_widget_timestamp');
            const currentVersion = agentmanChatWidgetOptions.version;
            const currentTimestamp = agentmanChatWidgetOptions.timestamp ? agentmanChatWidgetOptions.timestamp.toString() : '';
            
            // Check if either version or timestamp has changed
            const versionChanged = storedVersion !== currentVersion;
            const timestampChanged = storedTimestamp !== currentTimestamp;
            
            // If version or timestamp has changed, clear cached data
            if (versionChanged || timestampChanged) {
                
                
                // Clear configuration-related localStorage items, preserving chat history
                // These key patterns align with the actual keys used by the widget
                Object.keys(localStorage).forEach(key => {
                    if (key === 'agentman_chat_widget_version' ||
                        key === 'agentman_chat_widget_timestamp' ||
                        key.includes('agentman_config') ||
                        key.includes('agentman_endpoint') ||
                        key.includes('agentman_api_url') ||
                        key.includes('agentman_settings')) {
                        localStorage.removeItem(key);
                    }
                });
                
                // Store the new version and timestamp
                localStorage.setItem('agentman_chat_widget_version', currentVersion);
                localStorage.setItem('agentman_chat_widget_timestamp', currentTimestamp);
            }
            
            // Note: Toggle button styling is now handled by the new ChatWidget theme system
            // The theme.toggleBackgroundColor, theme.toggleTextColor, and theme.toggleIconColor
            // properties are automatically applied by the ChatWidget
            
            // Initialize the widget with the configuration
            window.agentmanChatWidget = new window.ChatWidget(agentmanChatWidgetOptions);
            
            // Dispatch an event that other scripts can listen for
            document.dispatchEvent(new CustomEvent('agentman-chat-widget-initialized', {
                detail: { widget: window.agentmanChatWidget }
            }));
        } catch (error) {
            console.error('Agentman Chat Widget: Failed to initialize.', error);
            handleInitFailure(error.message || 'Unknown error during initialization');
        }
    }

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attemptInitialization);
    } else {
        // DOM already loaded, initialize immediately
        attemptInitialization();
    }
    
    // The chat widget now has built-in persistence, no need to wait for external persistence
})();

/**
 * Agentman Chat Widget Frontend Script
 * 
 * This script initializes the Agentman Chat Widget on the frontend
 * using the configuration provided by WordPress.
 */
(function() {
    'use strict';
    
    let initAttempts = 0;
    const MAX_ATTEMPTS = 3;
    
    // Function to initialize the widget
    function attemptInitialization() {
        console.log(`Agentman Chat Widget Init: Attempt ${initAttempts + 1} of ${MAX_ATTEMPTS}`);
        
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
                console.log(`Agentman Chat Widget: Retrying in ${initAttempts * 500}ms...`);
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
                console.log(`Agentman Chat Widget: Configuration changed, clearing cached data`);
                if (versionChanged) {
                    console.log(`- Version changed from ${storedVersion || 'none'} to ${currentVersion}`);
                }
                if (timestampChanged) {
                    console.log(`- Timestamp changed from ${storedTimestamp || 'none'} to ${currentTimestamp}`);
                }
                
                // Clear configuration-related localStorage items, preserving chat history
                // These key patterns align with the actual keys used by the widget
                Object.keys(localStorage).forEach(key => {
                    if (key === 'agentman_chat_widget_version' ||
                        key === 'agentman_chat_widget_timestamp' ||
                        key.includes('agentman_config') ||
                        key.includes('agentman_endpoint') ||
                        key.includes('agentman_api_url') ||
                        key.includes('agentman_settings')) {
                        console.log(`- Clearing: ${key}`);
                        localStorage.removeItem(key);
                    }
                });
                
                // Store the new version and timestamp
                localStorage.setItem('agentman_chat_widget_version', currentVersion);
                localStorage.setItem('agentman_chat_widget_timestamp', currentTimestamp);
            }
            
            // Apply custom toggle button styling if toggle style options are present
            if (agentmanChatWidgetOptions.toggleStyle) {
                const customToggleStyle = document.createElement('style');
                customToggleStyle.id = 'agentman-custom-toggle-styles';
                customToggleStyle.textContent = `
                    .agentman-toggle-button {
                        background-color: ${agentmanChatWidgetOptions.toggleStyle.backgroundColor || '#059669'} !important;
                        color: ${agentmanChatWidgetOptions.toggleStyle.textColor || '#ffffff'} !important;
                    }
                    .agentman-toggle-button svg path {
                        fill: ${agentmanChatWidgetOptions.toggleStyle.iconColor || '#ffffff'} !important;
                    }
                    .agentman-toggle-button:hover {
                        background-color: ${agentmanChatWidgetOptions.toggleStyle.backgroundColor || '#059669'} !important;
                        filter: brightness(1.1) !important;
                    }
                    .agentman-toggle-button:focus {
                        outline: none !important;
                    }
                `;
                document.head.appendChild(customToggleStyle);
                
                // Set up a MutationObserver to apply styles when button is dynamically created
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        if (mutation.addedNodes.length) {
                            const toggleButton = document.querySelector('.agentman-toggle-button');
                            if (toggleButton) {
                                toggleButton.classList.add('has-custom-style');
                                // Observer did its job, disconnect
                                observer.disconnect();
                            }
                        }
                    }
                });
                
                // Start observing the document body for dynamic elements
                observer.observe(document.body, { childList: true, subtree: true });
            }
            
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

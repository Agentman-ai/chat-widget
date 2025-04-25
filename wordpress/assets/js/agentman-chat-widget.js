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
        
        console.log('Agentman Chat Widget Init: Configuration found', agentmanChatWidgetOptions);

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
            // Initialize the widget with the configuration
            console.log('Agentman Chat Widget: Attempting to initialize with', window.ChatWidget);
            window.agentmanChatWidget = new window.ChatWidget(agentmanChatWidgetOptions);
            console.log('Agentman Chat Widget: Successfully initialized.');
            
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
    console.log('Agentman Chat Widget: Using built-in persistence');
})();

/**
 * Agentman Chat Widget Loader
 * 
 * This script ensures the ChatWidget class is exposed globally
 * Updated to use the new version with built-in persistence
 */
(function() {
    
    // Check all possible locations where the ChatWidget might be defined
    function findChatWidgetClass() {
        // Option 1: Check if it's in the expected module format
        if (typeof window['@agentman/chat-widget'] !== 'undefined' && 
            typeof window['@agentman/chat-widget'].ChatWidget === 'function') {
            return window['@agentman/chat-widget'].ChatWidget;
        }
        
        // Option 2: Check if it's already defined globally
        if (typeof window.ChatWidget === 'function') {
            return window.ChatWidget;
        }
        
        // Option 3: Check if it's in exports
        if (typeof exports !== 'undefined' && 
            typeof exports['@agentman/chat-widget'] !== 'undefined' && 
            typeof exports['@agentman/chat-widget'].ChatWidget === 'function') {
            return exports['@agentman/chat-widget'].ChatWidget;
        }
        
        // Option 4: Look for it in the webpack modules if available
        if (typeof window.webpackJsonp !== 'undefined') {
            // This is a complex operation and depends on the webpack configuration
        }
        
        // Option 5: Check if it's in the vendor script directly
        var vendorScript = document.querySelector('script[src*="agentman-chat-widget.js"]');
        if (vendorScript) {
            // The script is loaded, but the class might not be exposed properly
        }
        
        return null;
    }
    
    // Try to find and expose the ChatWidget class
    var ChatWidgetClass = findChatWidgetClass();
    
    if (ChatWidgetClass) {
        // Expose it globally
        window.ChatWidget = ChatWidgetClass;
    } else {
        console.error('Agentman Chat Widget: Module not loaded correctly.');
        
        // Create a fallback implementation to prevent errors
        window.ChatWidget = function(config) {
            console.error('Using fallback ChatWidget implementation. The actual widget functionality is not available.');
            this.config = config;
            this.initialize = function() { 
                return this; 
            };
            this.open = function() { return this; };
            this.close = function() { return this; };
            this.expand = function() { return this; };
            this.collapse = function() { return this; };
            this.sendMessage = function() { return this; };
        };
        
        // Dispatch an event to notify that we're using a fallback
        document.dispatchEvent(new CustomEvent('agentman-chat-widget-fallback'));
    }
    
    // Notify that the loader has completed its work
    document.dispatchEvent(new CustomEvent('agentman-chat-widget-loader-complete'));
})();

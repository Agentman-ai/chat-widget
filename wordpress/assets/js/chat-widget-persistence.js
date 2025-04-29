/**
 * chat-widget-persistence.js
 * This is now a compatibility wrapper for the built-in persistence in the Agentman ChatWidget
 * The actual persistence functionality is now built into the chat widget itself
 */
;(function() {
  'use strict';

  // Wait for the ChatWidget to be available
  document.addEventListener('agentman-chat-widget-loader-complete', function() {
    if (typeof window.ChatWidget !== 'function') {
      console.error('Persistence compatibility wrapper: ChatWidget not found');
      return;
    }
    
    // No need to patch anything as persistence is now built-in
    // This file is kept for backward compatibility only
    
    // Dispatch an event to notify that persistence is ready
    document.dispatchEvent(new CustomEvent('agentman-persistence-ready'));
    
  });
})();

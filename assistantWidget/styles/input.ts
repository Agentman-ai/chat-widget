// styles/input.ts - Shared input component styles
export const inputStyles = `
  /* ===== SHARED INPUT COMPONENT STYLES ===== */
  
  .am-input-component {
    width: 100%;
    box-sizing: border-box;
  }

  .am-input-container {
    position: relative;
    background: white;
    /* Primary border with explicit properties */
    border: 1px solid #e5e7eb !important;
    border-style: solid !important;
    border-width: 1px !important;
    border-radius: 12px !important;
    /* Ensure border renders in all contexts */
    border-collapse: separate;
    overflow: visible;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    box-sizing: border-box;
    /* Performance optimization for focus transitions */
    will-change: border-color, box-shadow;
  }
  
  /* Fallback border using box-shadow for better compatibility */
  .am-input-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    pointer-events: none;
    z-index: 0;
    /* Use inset box-shadow as more reliable border alternative */
    box-shadow: inset 0 0 0 1px #e5e7eb;
  }

  .am-input-container:focus-within {
    border-color: var(--chat-button-color, #2563eb) !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border-radius: 12px !important;
  }
  
  .am-input-container:focus-within::before {
    box-shadow: inset 0 0 0 1px var(--chat-button-color, #2563eb);
  }

  .am-input-top-bar {
    height: 12px;
    /* Fallback to white if container background fails */
    background: transparent;
    background-color: rgba(255, 255, 255, 0);
    width: 100%;
    border-radius: 11px 11px 0 0;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }

  .am-input-textarea {
    width: 100%;
    padding: 10px 12px;
    /* Transparent with white fallback for safety */
    background: transparent;
    background-color: rgba(255, 255, 255, 0);
    color: #111827;
    border: none;
    outline: none !important;
    resize: none;
    font-size: 14px;
    line-height: 1.5;
    min-height: 36px;
    max-height: 180px;
    height: 48px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }
  
  /* Override Shopify's focus-visible styles */
  .am-input-textarea:focus,
  .am-input-textarea:focus-visible {
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }
  
  .am-input-container,
  .am-input-container:focus,
  .am-input-container:focus-visible,
  .am-input-container:focus-within {
    outline: none !important;
    outline-offset: 0 !important;
  }
  
  /* Ensure our custom focus styles take precedence */
  .am-input-container:focus-within {
    border-color: var(--chat-button-color, #2563eb) !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  }

  .am-input-textarea::placeholder {
    color: #9ca3af;
  }

  .am-input-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    /* Transparent with white fallback */
    background: transparent;
    background-color: rgba(255, 255, 255, 0);
    border-radius: 0 0 11px 11px;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }

  .am-input-actions-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .am-input-add-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid #e5e7eb;
    background: white;
    color: #2563eb;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 18px;
    font-weight: 500;
    line-height: 1;
    padding: 0px;
    outline: none !important;
  }
  
  .am-input-add-btn:focus,
  .am-input-add-btn:focus-visible {
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }

  .am-input-add-btn:hover {
    background-color: #eff6ff;
    border-color: #2563eb;
  }

  .am-input-actions-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .am-input-send {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    outline: none !important;
  }
  
  .am-input-send:focus,
  .am-input-send:focus-visible {
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }

  .am-input-send:not(:disabled) {
    background-color: var(--chat-button-color, #2563eb);
    color: var(--chat-button-text-color, #ffffff);
    cursor: pointer;
  }

  .am-input-send:not(:disabled):hover {
    background-color: var(--chat-button-color, #2563eb);
    filter: brightness(1.1);
    transform: scale(1.05);
  }

  .am-input-send:not(:disabled):active {
    transform: scale(0.95);
  }

  .am-input-send:disabled:hover {
    background-color: #f3f4f6;
    cursor: not-allowed;
    transform: none;
  }

  .am-input-send-icon {
    width: 20px;
    height: 20px;
  }

  .am-input-file-input {
    display: none;
  }

  /* Attachment preview - reuse existing styles */
  .am-input-attachments-preview {
    display: flex;
    gap: 8px;
    padding: 8px 0;
    margin-bottom: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }

  .am-input-attachments-preview::-webkit-scrollbar {
    height: 4px;
  }

  .am-input-attachments-preview::-webkit-scrollbar-track {
    background: transparent;
  }

  .am-input-attachments-preview::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }

  /* Context-specific adjustments */
  
  /* Welcome screen context */
  .am-welcome-input-section .am-input-component {
    max-width: 100%;
  }

  /* Conversation view context */
  .am-chat-input-wrapper {
    padding: 14px;
    background: var(--chat-background-color, #ffffff);
    flex: 0 0 auto;
    box-sizing: border-box;
  }

  .am-chat-input-wrapper .am-input-component {
    max-width: 100%;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .am-input-textarea {
      font-size: 16px; /* Prevent zoom on iOS */
      padding: 8px 12px;
    }

    .am-input-bottom {
      padding: 6px 12px;
    }

    .am-input-send {
      width: 36px;
      height: 36px;
    }

    .am-input-send-icon {
      width: 18px;
      height: 18px;
    }

    .am-input-add-btn {
      width: 26px;
      height: 26px;
      font-size: 16px;
    }

    .am-chat-input-wrapper {
      padding: 12px;
    }
  }
`;
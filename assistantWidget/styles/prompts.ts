// styles/prompts.ts
export const promptStyles = `
  /* Input Prompts Container - DISABLED due to UX issues */
  /* Keeping styles for potential future use */
  .am-chat-input-prompts {
    display: none !important; /* Force hide due to UX issues */
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px 8px 16px;
    background: var(--chat-background-color, #ffffff);
    border-bottom: 1px solid #e5e7eb;
  }

  /* Individual Prompt Buttons */
  .am-chat-input-prompt-btn {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    line-height: 1.2;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .am-chat-input-prompt-btn:hover {
    background-color: var(--chat-button-color, #059669);
    color: var(--chat-button-text-color, #ffffff);
    border-color: var(--chat-button-color, #059669);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .am-chat-input-prompt-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  /* Hide prompts when input is focused and has content */
  .am-chat-input:focus ~ .am-chat-input-prompts,
  .am-chat-input:not(:placeholder-shown) ~ .am-chat-input-prompts {
    opacity: 0.7;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .am-chat-input-prompts {
      padding: 8px 12px 6px 12px;
      gap: 6px;
    }

    .am-chat-input-prompt-btn {
      font-size: 12px;
      padding: 5px 10px;
      max-width: 150px;
    }
  }

  /* Animation for showing/hiding prompts - DISABLED */
  /* .am-chat-input-prompts {
    transition: opacity 0.3s ease, transform 0.3s ease;
  } */

  .am-chat-input-prompts[style*="display: none"] {
    opacity: 0;
    transform: translateY(-5px);
  }

  /* ===== FLOATING PROMPT BUBBLES (When widget is closed) ===== */
  
  .am-chat-floating-prompts-container {
    position: fixed;
    bottom: 80px; /* Above the toggle button */
    right: 20px;
    max-width: 320px;
    z-index: 999; /* Below the toggle button which is 1000 */
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
  }

  /* Show animation */
  .am-chat-floating-prompts-container {
    animation: fadeInUp 0.3s ease forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Left-aligned for bottom-left corner widget */
  .am-chat-bottom-left .am-chat-floating-prompts-container {
    right: auto;
    left: 20px;
  }

  /* Welcome message bubble */
  .am-chat-floating-welcome-message {
    background: white;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  .am-chat-floating-welcome-header {
    display: flex;
    align-items: center;
  }

  .am-chat-floating-welcome-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--chat-button-color, #059669);
    margin-right: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .am-chat-floating-welcome-avatar svg {
    width: 18px;
    height: 18px;
  }

  .am-chat-floating-welcome-text {
    font-weight: 500;
    font-size: 14px;
    color: #111827;
    line-height: 1.4;
  }

  /* Floating prompt buttons container */
  .am-chat-floating-message-prompts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end; /* Right-align buttons */
  }

  /* Individual floating prompt buttons */
  .am-chat-floating-message-prompt {
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    line-height: 1.3;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 100%;
    word-wrap: break-word;
    font-family: inherit;
  }

  .am-chat-floating-message-prompt:hover {
    background: var(--chat-button-color, #059669);
    color: var(--chat-button-text-color, #ffffff);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .am-chat-floating-message-prompt:active {
    transform: translateY(0);
  }

  /* Hide floating prompts on mobile devices */
  @media (max-width: 768px) {
    .am-chat-floating-prompts-container {
      display: none !important;
    }
  }

  /* Responsive adjustments for smaller screens */
  @media (max-width: 480px) {
    .am-chat-floating-prompts-container {
      right: 12px;
      max-width: 280px;
    }
    
    .am-chat-floating-welcome-message {
      padding: 12px;
    }
    
    .am-chat-floating-message-prompt {
      font-size: 13px;
      padding: 10px 14px;
    }
  }
`;
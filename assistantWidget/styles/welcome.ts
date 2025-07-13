// styles/welcome.ts - Styles for the welcome screen component
export const welcomeStyles = `
  /* ===== WELCOME SCREEN LAYOUT ===== */
  
  .am-welcome-screen {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--chat-background-color, #ffffff);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .am-welcome-container {
    max-width: 500px;
    width: 100%;
    padding: 40px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  /* ===== WELCOME HEADER ===== */
  
  .am-welcome-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .am-welcome-logo {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--chat-button-color, #2563eb);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .am-welcome-logo svg {
    width: 32px;
    height: 32px;
  }

  .am-welcome-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--chat-text-color, #111827);
    margin: 0;
    line-height: 1.2;
  }

  /* ===== INPUT SECTION ===== */
  
  .am-welcome-input-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .am-welcome-message {
    font-size: 18px;
    color: var(--chat-text-color, #374151);
    font-weight: 400;
    line-height: 1.4;
  }

  .am-welcome-input-container {
    position: relative;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 16px;
    transition: all 0.2s ease;
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }

  .am-welcome-input-container:focus-within {
    border-color: var(--chat-button-color, #2563eb);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .am-welcome-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 16px;
    color: var(--chat-text-color, #111827);
    resize: none;
    line-height: 1.5;
    min-height: 48px;
    font-family: inherit;
  }

  .am-welcome-input::placeholder {
    color: #9ca3af;
  }

  .am-welcome-send {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    border: none;
    background-color: var(--chat-button-color, #2563eb);
    color: var(--chat-button-text-color, #ffffff);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .am-welcome-send:disabled {
    background-color: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .am-welcome-send:not(:disabled):hover {
    background-color: var(--chat-button-hover-color, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .am-welcome-send:not(:disabled):active {
    transform: translateY(0);
  }

  .am-welcome-send svg {
    width: 20px;
    height: 20px;
  }

  /* ===== PROMPTS SECTION ===== */
  
  .am-welcome-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    margin-top: 8px;
  }

  .am-welcome-prompt-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 24px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    line-height: 1.2;
    white-space: nowrap;
    font-family: inherit;
  }

  .am-welcome-prompt-btn:hover {
    background-color: var(--chat-button-color, #2563eb);
    color: var(--chat-button-text-color, #ffffff);
    border-color: var(--chat-button-color, #2563eb);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  .am-welcome-prompt-btn:active {
    transform: translateY(0);
  }

  /* ===== BRANDING ===== */
  
  .am-welcome-branding {
    font-size: 13px;
    color: #9ca3af;
    margin-top: auto;
  }

  .am-welcome-branding a {
    color: var(--chat-button-color, #2563eb);
    text-decoration: none;
    font-weight: 500;
  }

  .am-welcome-branding a:hover {
    text-decoration: underline;
  }

  /* ===== RESPONSIVE DESIGN ===== */
  
  @media (max-width: 480px) {
    .am-welcome-container {
      padding: 24px 16px;
      gap: 24px;
    }

    .am-welcome-title {
      font-size: 24px;
    }

    .am-welcome-message {
      font-size: 16px;
    }

    .am-welcome-logo {
      width: 56px;
      height: 56px;
    }

    .am-welcome-logo svg {
      width: 28px;
      height: 28px;
    }

    .am-welcome-input-container {
      padding: 12px;
    }

    .am-welcome-input {
      font-size: 16px; /* Prevent zoom on iOS */
    }

    .am-welcome-send {
      width: 44px;
      height: 44px;
    }

    .am-welcome-prompt-btn {
      font-size: 13px;
      padding: 10px 16px;
    }
  }

  /* ===== VARIANT-SPECIFIC STYLES ===== */
  
  /* Corner variant - full screen overlay on mobile */
  .am-chat-widget--corner .am-welcome-screen {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  /* Centered variant - fits container */
  .am-chat-widget--centered .am-welcome-screen {
    min-height: 500px;
  }

  /* Inline variant - adapts to container */
  .am-chat-widget--inline .am-welcome-screen {
    min-height: 400px;
  }

  /* ===== ANIMATIONS ===== */
  
  .am-welcome-screen {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Focus animation for input */
  .am-welcome-input-container {
    animation: none;
  }

  .am-welcome-input-container:focus-within {
    animation: inputFocus 0.2s ease-out;
  }

  @keyframes inputFocus {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.02);
    }
  }
`;
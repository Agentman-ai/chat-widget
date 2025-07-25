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
    gap: 20px;
    position: relative;
  }
  
  /* Balanced max-width for inline variant */
  .am-chat-widget--inline .am-welcome-container {
    max-width: 720px; /* Wider than mobile but not too wide */
    padding: 40px 40px;
  }
  
  /* For very large screens, allow a bit more width */
  @media (min-width: 1200px) {
    .am-chat-widget--inline .am-welcome-container {
      max-width: 800px;
    }
  }

  /* ===== MINIMIZE BUTTON ===== */
  
  .am-welcome-minimize {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: white;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 20px;
    font-weight: 400;
    line-height: 1;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .am-welcome-minimize:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .am-welcome-minimize svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
  }

  /* ===== WELCOME HEADER ===== */
  
  .am-welcome-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .am-welcome-logo {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background-color: var(--chat-button-color, #2563eb);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .am-welcome-logo svg {
    width: 50px;
    height: 50px;
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

  /* Input component styles moved to input.ts */
  .am-welcome-input-placeholder {
    width: 100%;
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
    background: transparent;
    color: #374151;
    border: 0.5px solid #d1d5db;
    border-radius: 8px;
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

  /* ===== BOTTOM SECTION ===== */
  
  .am-welcome-bottom {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    margin-top: auto;
  }
  
  .am-welcome-conversations-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }
  
  .am-welcome-conversations-link:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }
  
  .am-welcome-conversations-link svg {
    width: 18px;
    height: 18px;
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
    
    /* Maintain better padding for inline on mobile */
    .am-chat-widget--inline .am-welcome-container {
      padding: 24px 24px;
    }

    .am-welcome-title {
      font-size: 24px;
    }

    .am-welcome-message {
      font-size: 16px;
    }

    .am-welcome-logo {
      width: 48px;
      height: 48px;
    }

    .am-welcome-logo svg {
      width: 40px;
      height: 40px;
    }

    /* Input component responsive styles moved to input.ts */


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
// styles/welcome.ts - Styles for the welcome screen component
export const welcomeStyles = `
  /* ===== WELCOME SCREEN LAYOUT ===== */
  
  .am-welcome-screen {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--chat-background-color, #ffffff);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    position: relative;
    overflow: hidden;
  }

  .am-welcome-container {
    max-width: 500px;
    width: calc(100% - 60px); /* Leave space for X button on the right */
    padding: 24px 24px 20px 24px; /* Optimized vertical padding */
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 20px; /* Consistent vertical rhythm */
    position: relative;
    margin: 0 auto;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    align-self: center;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
    /* Better content distribution */
    justify-content: flex-start;
  }

  .am-welcome-container::-webkit-scrollbar {
    width: 6px;
  }

  .am-welcome-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .am-welcome-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  .am-welcome-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  
  /* Balanced max-width for inline variant */
  .am-chat-widget--inline .am-welcome-container {
    max-width: 720px; /* Wider than mobile but not too wide */
    padding: 40px 40px; /* Normal padding since button is outside now */
    width: 100%; /* Full width for inline since no minimize button */
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
    top: 20px; /* Slightly lower for better alignment with content */
    right: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: white;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    z-index: 10;
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
  
  /* Mobile-specific X button adjustments */
  @media (max-width: 480px) {
    .am-welcome-minimize {
      top: 24px; /* More space from top on mobile */
      right: 12px; /* Slightly closer to edge on mobile */
      width: 32px; /* Slightly smaller on mobile */
      height: 32px;
    }
    
    .am-welcome-minimize svg {
      width: 18px;
      height: 18px;
    }
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
    gap: 16px; /* Balanced spacing for visual hierarchy */
    padding-top: 8px; /* Small breathing room at top */
  }

  .am-welcome-logo {
    width: 56px;
    height: 56px;
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

  /* ===== INTERACTION GROUP (Input + Prompts) ===== */
  
  .am-welcome-interaction-group {
    display: flex;
    flex-direction: column;
    gap: 8px; /* Tight spacing between input and prompts */
  }
  
  /* ===== INPUT SECTION ===== */
  
  .am-welcome-input-section {
    display: flex;
    flex-direction: column;
    gap: 24px; /* Space between message and input */
  }

  .am-welcome-message {
    font-size: 17px; /* Slightly smaller for better balance */
    color: var(--chat-text-color, #374151);
    font-weight: 400;
    line-height: 1.5;
  }

  /* Input component styles moved to input.ts */
  .am-welcome-input-placeholder {
    width: 100%;
  }

  /* ===== PROMPTS SECTION ===== */
  
  .am-welcome-prompts {
    display: flex;
    flex-wrap: wrap; /* Allow wrapping to 2 rows */
    gap: 8px;
    padding: 0;
    margin: 0; /* No margin needed, gap handled by parent */
  }

  .am-welcome-prompt-btn {
    flex: 1 1 calc(50% - 4px); /* 2 buttons per row with gap */
    min-width: 0; /* Allow shrinking */
    min-height: 48px; /* Better touch target size */
    font-size: 13px;
    padding: 12px 14px;
    background: linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%);
    color: #374151;
    border: 1px solid rgba(209, 213, 219, 0.3);
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    line-height: 1.3;
    white-space: nowrap;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    margin: 0 !important; /* Reset all margins */
  }
  
  /* Alternating subtle backgrounds for visual interest */
  .am-welcome-prompt-btn:nth-child(odd) {
    background: linear-gradient(135deg, #f0f9ff 0%, #fafafa 100%);
  }

  .am-welcome-prompt-btn:hover {
    background: linear-gradient(135deg, #f0f4ff 0%, #e6efff 100%);
    color: #1e40af;
    border-color: rgba(37, 99, 235, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  }

  .am-welcome-prompt-btn:active {
    transform: scale(0.95);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  /* Ripple effect for touch feedback */
  .am-welcome-prompt-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(37, 99, 235, 0.2);
    transform: translate(-50%, -50%);
    pointer-events: none;
    transition: width 0.6s, height 0.6s;
  }
  
  .am-welcome-prompt-btn:active::after {
    width: 200px;
    height: 200px;
  }

  /* ===== BOTTOM SECTION ===== */
  
  .am-welcome-bottom {
    display: flex;
    flex-direction: column;
    gap: 8px; /* Tighter spacing for bottom elements */
    align-items: center;
    margin-top: auto;
    padding-top: 12px; /* Separation from content above */
  }
  
  .am-welcome-conversations-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 13px;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    text-decoration: none;
  }
  
  .am-welcome-conversations-link:hover {
    background-color: rgba(0, 0, 0, 0.03);
    color: #6b7280;
    text-decoration: underline;
  }
  
  .am-welcome-conversations-link svg {
    width: 16px;
    height: 16px;
    opacity: 0.7;
  }
  
  /* ===== BRANDING ===== */
  
  .am-welcome-branding {
    font-size: 11px; /* Smaller to match disclaimer */
    color: #9ca3af;
    margin-top: 4px; /* Minimal spacing */
    line-height: 1.3;
  }

  .am-welcome-branding a {
    color: var(--chat-button-color, #2563eb);
    text-decoration: none;
    font-weight: 500;
  }

  .am-welcome-branding a:hover {
    text-decoration: underline;
  }

  /* ===== HEIGHT-AWARE RESPONSIVE DESIGN ===== */
  
  /* For smaller heights, reduce spacing and sizes */
  @media (max-height: 700px) {
    .am-welcome-container {
      gap: 16px;
      padding: 48px 24px 20px 24px; /* Responsive top padding for medium heights */
    }
    
    /* On mobile with small height, reduce top padding further */
    @media (max-width: 480px) {
      .am-welcome-container {
        padding: 40px 16px 20px 16px; /* Balance between space and content visibility */
      }
    }
    
    .am-welcome-header {
      gap: 12px;
      padding-top: 8px; /* Still maintain some top padding */
      margin-bottom: 4px;
    }
    
    .am-welcome-logo {
      width: 48px;
      height: 48px;
    }
    
    .am-welcome-logo svg {
      width: 42px;
      height: 42px;
    }
    
    .am-welcome-title {
      font-size: 24px;
    }
    
    .am-welcome-message {
      font-size: 16px;
      margin-bottom: 2px;
    }
    
    .am-welcome-input-section {
      gap: 20px; /* Slightly tighter on smaller heights */
      margin-bottom: 4px;
    }
    
    .am-welcome-prompts {
      min-height: 44px;
      margin-bottom: 12px;
    }
    
    .am-welcome-bottom {
      padding-top: 12px;
      gap: 6px;
    }
  }
  
  /* For very small heights */
  @media (max-height: 550px) {
    .am-welcome-container {
      gap: 12px;
      padding: 24px 20px 16px 20px; /* Still maintain decent top padding */
    }
    
    .am-welcome-header {
      gap: 10px;
      padding-top: 4px; /* Small but present top padding */
      margin-bottom: 2px;
    }
    
    .am-welcome-logo {
      width: 44px; /* Not too small to maintain presence */
      height: 44px;
    }
    
    .am-welcome-logo svg {
      width: 38px;
      height: 38px;
    }
    
    .am-welcome-title {
      font-size: 20px;
    }
    
    .am-welcome-message {
      font-size: 15px;
    }
    
    .am-welcome-input-section {
      gap: 16px;
      margin-bottom: 2px;
    }
    
    .am-welcome-prompts {
      min-height: 40px;
      margin-bottom: 8px;
    }
    
    .am-welcome-bottom {
      padding-top: 8px;
    }
  }
  
  /* ===== RESPONSIVE DESIGN ===== */
  
  @media (max-width: 480px) {
    /* Add swipe indicator for mobile */
    .am-welcome-screen::before {
      content: '';
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 36px;
      height: 4px;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 2px;
      z-index: 100;
    }
    
    .am-welcome-container {
      padding: 64px 16px 24px 16px; /* 64px top padding for better balance */
      gap: 16px; /* Tighter gap to keep elements closer */
      width: calc(100% - 50px); /* Account for X button */
    }
    
    /* Maintain better padding for inline on mobile */
    .am-chat-widget--inline .am-welcome-container {
      padding: 40px 24px 24px 24px;
      width: 100%; /* Full width for inline */
    }
    
    .am-welcome-header {
      gap: 12px; /* Tighter gap between logo and title */
      margin-bottom: 12px; /* More separation from content below */
    }

    .am-welcome-title {
      font-size: 24px;
    }

    .am-welcome-message {
      font-size: 16px;
    }
    
    /* Input section - tighter spacing on mobile */
    .am-welcome-input-section {
      gap: 12px; /* Tight gap to keep heading close to input */
    }

    .am-welcome-logo {
      width: 48px;
      height: 48px;
    }

    .am-welcome-logo svg {
      width: 40px;
      height: 40px;
    }
    
    /* Adjust minimize button position for mobile */
    .am-welcome-minimize {
      top: 20px;
      right: 12px;
      width: 32px;
      height: 32px;
    }
    
    /* Mobile inherits the base prompt styles - no overrides needed */
    
    /* Bottom section adjustments */
    .am-welcome-bottom {
      padding-top: 16px; /* More separation from content */
      margin-top: auto; /* Push to bottom */
    }

    /* Input component responsive styles moved to input.ts */


    .am-welcome-prompt-btn {
      font-size: 13px;
      padding: 10px 16px;
    }
    
    /* Maintain padding on mobile */
    .am-welcome-prompt-btn:first-child {
      margin-left: 16px;
    }
    
    .am-welcome-prompt-btn:last-child {
      margin-right: 16px;
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
    /* Add subtle gradient background for depth */
    background: linear-gradient(180deg, 
      var(--chat-background-color, #ffffff) 0%,
      rgba(249, 250, 251, 0.3) 100%
    );
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
  
  /* Slide up animation for container */
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .am-welcome-container {
    animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  /* Logo entrance animation for mobile */
  @keyframes logoAppear {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
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
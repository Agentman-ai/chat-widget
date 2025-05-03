// styles/prompts.ts
export const promptStyles = `
  /* Message Prompts Container - Using fixed positioning to match toggle button */
  .am-chat-message-prompts-container {
    position: fixed !important; /* Match the toggle button's fixed positioning */
    bottom: 70px !important; /* Position above the toggle button */
    right: 12px !important; /* Match the toggle's right position */
    width: 280px; /* Fixed width */
    min-width: 280px; /* Ensure minimum width */
    background: transparent; /* Transparent background as requested */
    padding: 16px 0 16px 16px; /* Remove right padding to align with toggle button */
    z-index: 10001; /* Ensure it's above other elements */
    border: none; /* Remove border for cleaner look */
    word-wrap: break-word; /* Ensure text wraps properly */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  /* Adjust position for bottom-left corner widget */
  .am-chat-bottom-left .am-chat-message-prompts-container {
    right: auto !important;
    left: 12px !important;
  }
  
  /* Right-aligned for bottom-right position */
  .am-chat-bottom-right .am-chat-message-prompts-container {
    left: auto !important;
    right: 12px !important;
  }
  
  /* Hide prompts on mobile devices */
  @media (max-width: 768px) {
    .am-chat-message-prompts-container {
      display: none !important; /* Hide on mobile devices */
    }
  }

  /* Welcome Message Container */
  .am-chat-welcome-message {
    font-size: 14px;
    margin-bottom: 14px;
    color: #333;
    line-height: 1.4;
    font-weight: 400;
    padding: 8px 12px 8px 12px;
    display: flex;
    flex-direction: column;
    background-color: white;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);    
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-right: 0; /* Ensure right alignment with toggle button */
  }
  
  /* Header with avatar and text */
  .am-chat-welcome-header {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }
  
  /* Avatar styling */
  .am-chat-welcome-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--chat-toggle-background-color, var(--chat-header-background-color, #059669));
    margin-right: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  /* SVG styling */
  .am-chat-welcome-avatar svg {
    width: 28px;
    height: 28px;
    overflow: visible;
  }
  
  /* Agentman logo colors */
  .am-chat-welcome-avatar svg ellipse {
    fill: white;
  }
  
  .am-chat-welcome-avatar svg path {
    fill: var(--chat-toggle-background-color, var(--chat-header-background-color, #059669));
    stroke: var(--chat-toggle-background-color, var(--chat-header-background-color, #059669));
  }
  
  /* Fallback styling if SVG fails to render */
  .am-chat-logo-fallback {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: white;
  }
  
  /* Show fallback only if SVG is hidden or fails */
  .am-chat-welcome-avatar svg:not(:visible) + .am-chat-logo-fallback {
    display: block;
  }
  
  /* Welcome text */
  .am-chat-welcome-text {
    font-weight: 500;
  }
  
  /* Timestamp */
  .am-chat-welcome-timestamp {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
    font-weight: 400;
    margin-left: 32px; /* Align with text after avatar */
  }
  
  /* Prompts Container */
  .am-chat-message-prompts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end; /* Align buttons to the right */
    padding-right: 0; /* Remove right padding to align with toggle button */
  }

  /* Individual Prompt Buttons */
  .am-chat-message-prompt {
    background-color: #f8f9fa;
    color: #000;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 20px;
    padding: 10px 16px;
    font-size: 14px;
    cursor: pointer;
    text-align: right; /* Right-justified text as requested */
    transition: all 0.2s ease;
    line-height: 1.3;
    font-weight: normal;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); /* Box-shadow as requested */
    width: auto; /* Variable width as requested */
    display: inline-block; /* Allow width to fit content */
    max-width: 100%; /* Ensure it doesn't overflow container */
    margin-right: 0; /* Ensure right alignment with toggle button */
  }

  .am-chat-message-prompt:hover {
    background-color: #f0f0f0;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15); /* Enhanced shadow on hover */
  }
`;

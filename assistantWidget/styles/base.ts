// styles/base.ts
export const baseStyles = `
  .am-chat-widget {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    z-index: 1000;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .am-chat-container {
    background: var(--chat-background-color, #FFFFFF);
    flex-direction: column;
    overflow: hidden;
    display: flex;
    width: 360px;
    height: 560px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    flex: 1;
  }

  .am-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    min-height: 48px;
    background: var(--chat-header-background-color, #059669);
    color: var(--chat-header-text-color, #FFFFFF);
  }

  .am-chat-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .am-chat-logo-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
  }

  .am-chat-logo {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .am-chat-logo svg {
    width: 100%;
    height: 100%;
  }

  .am-chat-header-logo {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .am-chat-header-logo svg {
    width: 100%;
    height: 100%;
  }

  .am-chat-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: inherit !important;
  }

  .am-chat-header button {
    background: none;
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .am-chat-header button svg {
    width: 20px;
    height: 20px;
    fill: var(--chat-header-text-color, #FFFFFF);
  }

  .am-chat-header button:hover {
    opacity: 0.8;
  }

  .am-chat-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .am-chat-header-button {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: filter 0.2s;
  }

  .am-chat-header-button:hover {
    filter: brightness(1.5);
  }

  .am-chat-header-button svg {
    width: 20px;
    height: 20px;
  }

  .am-chat-messages {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 16px;
    min-height: 0;
    background: white;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .am-chat-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .am-chat-avatar.agent {
    background: var(--chat-header-background-color, #BE185D);
  }

  .am-chat-avatar.user {
    background: var(--chat-user-background-color, #F43F5E);
  }

  .am-chat-avatar img, .am-chat-avatar svg {
    width: 20px;
    height: 20px;
  }

  .am-chat-avatar.agent svg {
    fill: var(--chat-agent-icon-color, #FFFFFF);
  }

  .am-chat-avatar.user svg {
    fill: var(--chat-user-icon-color, #FFFFFF);
  }

  .am-chat-branding {
    text-align: left;
    font-size: 10px;
    padding: 4px 16px;
    color: #9CA3AF;
    background: white;
  }

  .am-chat-branding a {
    color: #059669;
    text-decoration: none;
    font-weight: 500;
  }

  .am-chat-branding a:hover {
    text-decoration: underline;
  }

  .am-chat-input-container {
    display: flex;
    align-items: center;
    padding: 8px 16px 8px;
    background: white;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }

  .am-chat-input-wrapper {
    position: relative;
    width: 100%;
  }

  .am-chat-input {
    flex: 1;
    min-height: 44px;
    max-height: 120px;
    padding: 10px 12px 6px 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-size: 14px;
    line-height: 20px;
    resize: none;
    overflow-y: auto;
    background: white;
    box-sizing: border-box;
  }

  .am-chat-send {
    margin-left: 8px;
    width: 32px;
    height: 32px;
    padding: 6px;
    background: var(--chat-header-background-color, #059669);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: filter 0.2s;
  }

  .am-chat-send:hover {
    filter: brightness(1.5);
  }

  .am-chat-send:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }

  .am-chat-send svg {
    width: 20px;
    height: 20px;
  }

  .am-chat-send:disabled svg {
    opacity: 0.8;
  }

  .am-chat-initializing {
    padding: 16px;
    text-align: center;
    color: #6B7280;
  }

  .desktop-only {
    display: none;
  }

  @media (min-width: 768px) {
    .desktop-only {
      display: flex;
    }
  }

  .am-chat-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    border: none;
    border-radius: 100px;
    padding: 0;
    cursor: pointer;
    background: none;
    transition: transform 0.2s;
    z-index: 1000;
  }

  .am-chat-toggle:hover {
    transform: scale(1.05);
  }

  .am-chat-toggle-content {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--chat-header-background-color, #059669);
    color: var(--chat-header-text-color, #FFFFFF);
    padding: 8px 16px 8px 8px;
    border-radius: 100px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .am-chat-toggle-text {
    font-size: 14px;
    font-weight: 500;
  }

  .am-chat-expanded {
    position: fixed !important;
    top: 12px !important;
    right: 0 !important;
    bottom: 12px !important;
    width: 100vw !important;
    margin: 0 !important;
    border-radius: 0 !important;
    transition: all 0.3s ease-in-out !important;
    display: flex !important;
    justify-content: center !important;
  }

  .am-chat-expanded .am-chat-container {
    width: 66.67vw !important;
    max-width: 700px !important;
    height: calc(95vh - 24px) !important;
    border-radius: 8px !important;
    transition: all 0.3s ease-in-out !important;
  }

  .am-chat-expanded .am-chat-messages {
    height: calc(95vh - 148px) !important; /* 24px margins + 124px for header and input */
  }

  .am-chat-minimize {
    border: none;
    background: none;
    cursor: pointer;
  }

  /* Override any external styles that might affect the header text */
  .am-chat-header * {
    color: inherit !important;
  }
`;

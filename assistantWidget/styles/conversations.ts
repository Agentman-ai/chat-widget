// styles/conversations.ts
export const conversationStyles = `
  /* Conversation List View (replaces entire chat area - messages and input) */
  .am-conversation-list-view {
    display: none;
    flex-direction: column;
    flex: 1;
    background: var(--chat-background-color, #ffffff);
    overflow: hidden;
    position: absolute;
    top: 60px; /* Below header */
    left: 0;
    right: 0;
    bottom: 60px; /* Above branding */
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
  }

  /* Animation states */
  .am-conversation-list-view.opening {
    display: flex;
    transform: translateX(0);
  }

  .am-conversation-list-view.closing {
    transform: translateX(100%);
  }

  /* Chat area animation */
  .am-chat-messages,
  .am-chat-input-prompts,
  .am-chat-input-container,
  .chat-attachments-preview {
    transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  }

  .am-chat-messages.sliding-out,
  .am-chat-input-prompts.sliding-out,
  .am-chat-input-container.sliding-out,
  .chat-attachments-preview.sliding-out {
    transform: translateX(-100%);
    opacity: 0;
  }

  .am-conversation-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* New conversation button in header */
  .am-conversation-new-header {
    background: transparent;
    border: none;
    color: var(--chat-header-text-color, #ffffff);
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 16px;
    transition: background-color 0.2s;
    margin-right: 8px;
  }

  .am-conversation-new-header:hover {
    background: rgba(255, 255, 255, 0.1) !important;
  }

  /* Conversation List */
  .am-conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  .am-conversation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .am-conversation-item:hover {
    background: #f9fafb;
  }

  .am-conversation-item.active {
    background: #eff6ff;
    border-left: 3px solid var(--chat-button-color, #2563eb);
  }

  .am-conversation-info {
    flex: 1;
    min-width: 0;
  }

  .am-conversation-title {
    font-weight: 500;
    font-size: 14px;
    color: #111827;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .am-conversation-date {
    font-size: 12px;
    color: #6b7280;
  }

  .am-conversation-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .am-conversation-item:hover .am-conversation-actions {
    opacity: 1;
  }

  .am-conversation-delete {
    background: transparent;
    border: none;
    color: #dc2626;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    transition: background-color 0.2s;
  }

  .am-conversation-delete:hover {
    background: #fef2f2;
  }

  /* Empty State */
  .am-conversation-empty {
    padding: 40px 20px;
    text-align: center;
    color: #6b7280;
  }

  .am-conversation-empty p {
    margin: 0 0 16px 0;
    font-size: 14px;
  }

  .am-conversation-new-button {
    background: var(--chat-button-color, #2563eb);
    color: var(--chat-button-text-color, #ffffff);
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .am-conversation-new-button:hover {
    background: var(--chat-button-hover-color, #047857);
  }

  /* Header Navigation Buttons */
  .am-conversation-toggle,
  .am-conversation-back {
    background: transparent;
    border: none;
    color: var(--chat-header-text-color, #ffffff);
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 16px;
    transition: background-color 0.2s;
    margin-right: 8px;
  }

  .am-conversation-toggle:hover,
  .am-conversation-back:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .am-conversation-back {
    font-size: 18px;
    font-weight: bold;
    margin-right: 12px;
  }

  /* Mobile Responsiveness */
  @media (max-width: 768px) {
    .am-conversation-drawer {
      width: 280px;
      left: -300px;
    }
    
    .am-conversation-manager.open .am-conversation-drawer {
      left: 0;
    }
  }

  /* Overlay for mobile */
  .am-conversation-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    z-index: 1000;
  }

  .am-conversation-manager.open .am-conversation-overlay {
    display: block;
  }

  @media (max-width: 768px) {
    .am-conversation-overlay {
      display: none;
    }
    
    .am-conversation-manager.open .am-conversation-overlay {
      display: block;
    }
  }
`;
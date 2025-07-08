export const attachmentStyles = `
  /* File attachment button */
  .chat-attachment-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chat-text-color);
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .chat-attachment-button:hover {
    opacity: 1;
  }

  .chat-attachment-button svg {
    width: 20px;
    height: 20px;
  }

  /* Hidden file input */
  .chat-file-input {
    display: none;
  }

  /* Attachment preview container - STACKED: Full width row above input */
  .chat-attachments-preview {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding: 12px 16px;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    width: 100%;
    background: rgba(0, 0, 0, 0.02);
    border-bottom: none;
    
    /* Custom scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }

  .chat-attachments-preview::-webkit-scrollbar {
    height: 4px;
  }

  .chat-attachments-preview::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-attachments-preview::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }

  .chat-attachments-preview::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  /* Scroll hint indicator */
  .chat-attachments-preview::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 20px;
    background: linear-gradient(to left, rgba(0, 0, 0, 0.02), transparent);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .chat-attachments-preview.has-overflow::after {
    opacity: 1;
  }

  /* Individual attachment item - MINIMAL: Clean thumbnail design */
  .chat-attachment-item {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 8px;
    animation: slideIn 0.2s ease-out;
    width: 40%;
    flex-shrink: 0;
    cursor: default;
    transition: all 0.2s;
    gap: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .chat-attachment-item:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Attachment thumbnail for images - MINIMAL: Larger preview */
  .chat-attachment-thumbnail {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
  }

  /* File icon for non-images - MINIMAL: Larger icon area */
  .chat-attachment-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.08);
    border-radius: 6px;
    flex-shrink: 0;
  }

  .chat-attachment-icon svg {
    width: 20px;
    height: 20px;
    opacity: 0.6;
    color: rgba(59, 130, 246, 0.7);
  }

  /* Attachment info - HORIZONTAL: Left-aligned for inline layout */
  .chat-attachment-info {
    flex: 1;
    min-width: 0;
  }

  .chat-attachment-name {
    font-size: 13px;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    color: rgba(0, 0, 0, 0.7);
  }

  /* Remove button - MINIMAL: Subtle × in top-right corner */
  .chat-attachment-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 18px;
    height: 18px;
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.4);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: normal;
    line-height: 1;
    transition: all 0.2s;
    padding: 0;
  }

  .chat-attachment-remove:hover {
    background: rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.6);
  }

  .chat-attachment-remove:active {
    transform: scale(0.9);
  }

  /* Upload progress - HORIZONTAL: Bottom overlay for inline layout */
  .chat-attachment-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 0 0 6px 6px;
    overflow: hidden;
  }

  .chat-attachment-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    transition: width 0.3s ease;
    border-radius: 2px;
    position: relative;
  }

  .chat-attachment-progress-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* Error state */
  .chat-attachment-item.error {
    background: rgba(255, 0, 0, 0.1);
  }

  .chat-attachment-item.error .chat-attachment-name {
    color: #ff0000;
  }

  /* Attachments in messages */
  .chat-message-attachments {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .chat-message-attachment {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    padding: 6px 8px;
    text-decoration: none;
    color: inherit;
    transition: background 0.2s;
  }

  .chat-message-attachment:hover {
    background: rgba(0, 0, 0, 0.05);
    text-decoration: none;
  }

  .message-attachment-icon {
    width: 16px;
    height: 16px;
    margin-right: 6px;
    opacity: 0.6;
  }

  .message-attachment-image {
    max-width: 200px;
    max-height: 200px;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .message-attachment-image:hover {
    transform: scale(1.05);
  }

  /* File type icons */
  .icon-file-document::before {
    content: "📄";
    font-size: 20px;
  }

  .icon-file-image::before {
    content: "🖼️";
    font-size: 20px;
  }

  .icon-file-audio::before {
    content: "🎵";
    font-size: 20px;
  }

  .icon-file-video::before {
    content: "🎬";
    font-size: 20px;
  }

  .icon-file-data::before {
    content: "📊";
    font-size: 20px;
  }

  .icon-file-text::before {
    content: "📝";
    font-size: 20px;
  }

  /* Responsive adjustments - HORIZONTAL: Better mobile experience */
  @media (max-width: 480px) {
    .chat-attachments-preview {
      padding: 6px 0;
      gap: 6px;
    }

    .chat-attachment-item {
      width: 45%;
      padding: 4px 6px;
      gap: 6px;
    }

    .chat-attachment-thumbnail,
    .chat-attachment-icon {
      width: 36px;
      height: 36px;
    }

    .chat-attachment-icon svg {
      width: 18px;
      height: 18px;
    }

    .chat-attachment-name {
      font-size: 12px;
    }

    .chat-attachment-remove {
      width: 16px;
      height: 16px;
      top: 2px;
      right: 2px;
      font-size: 12px;
    }
  }

  /* Extra improvements for very wide screens */
  @media (min-width: 768px) {
    .chat-attachment-item {
      padding: 10px;
    }

    .chat-attachment-thumbnail,
    .chat-attachment-icon {
      width: 44px;
      height: 44px;
    }

    .chat-attachment-name {
      font-size: 13px;
    }
  }
`;

// SVG icons for file attachments
export const attachmentIcons = {
  paperclip: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>`,
  
  document: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>`,
  
  image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>`,
  
  audio: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18V5l12-2v13"></path>
    <circle cx="6" cy="18" r="3"></circle>
    <circle cx="18" cy="16" r="3"></circle>
  </svg>`,
  
  video: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>`,
  
  file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>`,
  
  close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`
};

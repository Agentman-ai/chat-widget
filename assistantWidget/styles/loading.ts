export const loadingStyles = `
  .am-chat-loading-message {
    padding: 0 !important;
    margin-bottom: 18px !important;
    margin-top: 0 !important;
    opacity: 1;
    transition: opacity 0.15s ease-out;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    width: 100% !important;
  }

  .am-chat-loading-message .am-message-role {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #111827 !important;
    margin-bottom: 8px !important;
    margin-top: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    padding: 0 !important;
    text-align: left !important;
  }

  .am-chat-loading-message .am-message-content {
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    font-size: 14px !important;
    width: 100% !important;
    word-wrap: break-word !important;
    line-height: 1.6 !important;
    background: none !important;
    border: none !important;
    color: #111827 !important;
    text-align: left !important;
  }

  .am-chat-loading-message.loading-fade-out {
    opacity: 0;
  }

  .loading-container {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    width: 100% !important;
    text-align: left !important;
  }

  .loading-waves {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 2px !important;
    height: 24px !important;
    padding: 0 !important;
    margin: 0 !important;
    text-align: left !important;
  }

  .loading-waves span {
    display: inline-block;
    width: 4px;
    height: 4px;
    background-color: var(--chat-secondary-color, #666);
    border-radius: 50%;
    animation: wave-loading 1.4s infinite ease-in-out both;
  }

  .loading-waves span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .loading-waves span:nth-child(2) {
    animation-delay: -0.16s;
  }

  .loading-waves span:nth-child(3) {
    animation-delay: 0s;
  }

  .loading-waves span:nth-child(4) {
    animation-delay: 0.16s;
  }

  .loading-waves span:nth-child(5) {
    animation-delay: 0.32s;
  }

  @keyframes wave-loading {
    0%, 80%, 100% {
      transform: scale(0.8) translateY(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1.2) translateY(-8px);
      opacity: 1;
    }
  }

  /* Alternative typing dots animation */
  .loading-dots {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 24px;
  }

  .loading-dots span {
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: var(--chat-secondary-color, #666);
    border-radius: 50%;
    animation: typing-dots 1.4s infinite ease-in-out;
  }

  .loading-dots span:nth-child(1) {
    animation-delay: 0s;
  }

  .loading-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .loading-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing-dots {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }
`; 
// styles/variants.ts
export const variantStyles = {
    corner: `
      .am-chat-widget--corner {
        position: fixed;
        bottom: var(--chat-bottom, 12px);
        right: var(--chat-right, 12px);
        z-index: var(--chat-z-index, 1000);
      }
  
      .am-chat-widget--corner .am-chat-container {
        position: fixed;
        bottom: var(--chat-container-bottom, 20px);
        right: var(--chat-container-right, 20px);
        width: var(--chat-container-width, 360px);
        height: var(--chat-container-height, 700px);
      }

      .am-chat-widget--corner .am-chat-toggle {
        position: fixed;
        bottom: var(--chat-toggle-bottom, 12px);
        right: var(--chat-toggle-right, 12px);
        padding: 0;
        border: none;
        background: var(--chat-header-background-color, #059669);
        cursor: pointer;
        z-index: var(--chat-z-index, 1000);
        border-radius: 32px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s;
      }

      .am-chat-widget--corner .am-chat-toggle:hover {
        transform: translateY(-1px);
      }

      .am-chat-widget--corner .am-chat-toggle-content {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
      }

      .am-chat-widget--corner .am-chat-toggle img {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }

      .am-chat-widget--corner .am-chat-toggle-text {
        color: white;
        font-size: 16px;
        font-weight: 500;
      }

      @media (max-width: 640px) {
        .am-chat-widget--corner .am-chat-toggle {
          border-radius: 20px;
        }

        .am-chat-widget--corner .am-chat-toggle-content {
          padding: 8px 12px;
          gap: 6px;
        }

        .am-chat-widget--corner .am-chat-toggle img {
          width: 20px;
          height: 20px;
        }

        .am-chat-widget--corner .am-chat-toggle-text {
          font-size: 13px;
        }
      }
    `,
  
    centered: `
      .am-chat-widget--centered {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        inset: var(--chat-inset, 64px 0 0 0);
      }
  
      .am-chat-widget--centered .am-chat-container {
        width: var(--chat-container-width, 100%);
        max-width: var(--chat-container-max-width, 500px);
        height: var(--chat-container-height, 700px);
        margin: auto;
        border-radius: var(--chat-container-radius, 8px);
        display: flex !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    `,
  
    inline: `
      .am-chat-widget--inline {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
  
      .am-chat-widget--inline .am-chat-container {
        position: relative;
        width: 100%;
        height: 100%;
        box-shadow: none;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .am-chat-widget--inline .am-chat-messages {
        flex: 1 1 auto;
        height: 0;
        min-height: 0;
      }

      .am-chat-widget--inline .am-chat-input-container {
        flex: 0 0 auto;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      }
    `
  };
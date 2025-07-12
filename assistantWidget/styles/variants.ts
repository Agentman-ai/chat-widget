// styles/variants.ts
export const variantStyles = {
    corner: `
      .am-chat-widget--corner {
        position: fixed;
        bottom: var(--chat-bottom, 12px);
        right: var(--chat-right, 12px);
        z-index: var(--chat-z-index, 999999);
      }
  
      .am-chat-widget--corner .am-chat-container {
        position: fixed;
        bottom: var(--chat-container-bottom, 20px);
        right: var(--chat-container-right, 20px);
        width: var(--chat-container-width, 480px);
        height: var(--chat-container-height, 600px);
        z-index: var(--chat-z-index, 999999);
      }

      .am-chat-widget--corner .am-chat-toggle {
        position: fixed !important;
        bottom: var(--chat-toggle-bottom, 12px) !important;
        right: var(--chat-toggle-right, 12px) !important;
        padding: 0 !important;
        border: none !important;
        background: var(--chat-toggle-background-color, var(--chat-header-background-color, #2563eb)) !important;
        cursor: pointer !important;
        z-index: var(--chat-z-index, 1000)
        border-radius: 32px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        transition: transform 0.2s !important;
        text-transform: none !important;
        letter-spacing: normal !important;
        line-height: normal !important;
        text-decoration: none !important;
        min-width: auto !important;
        min-height: auto !important;
        max-width: none !important;
        max-height: none !important;
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
      }

      .am-chat-widget--corner .am-chat-toggle:hover {
        transform: translateY(-1px) !important;
        background: var(--chat-toggle-background-color, var(--chat-header-background-color, #2563eb)) !important;
        color: var(--chat-toggle-text-color, var(--chat-header-text-color, #FFFFFF)) !important;
        text-decoration: none !important;
        border: none !important;
        outline: none !important;
      }
      
      .am-chat-widget--corner .am-chat-toggle:focus {
        outline: none !important;
        box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.5) !important;
      }

      .am-chat-widget--corner .am-chat-toggle-content {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        padding: 8px 12px !important;
        text-transform: none !important;
        letter-spacing: normal !important;
        line-height: normal !important;
        text-decoration: none !important;
        margin: 0 !important;
      }

      .am-chat-widget--corner .am-chat-toggle img {
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        max-width: 24px !important;
        max-height: 24px !important;
        min-width: 24px !important;
        min-height: 24px !important;
        padding: 0 !important;
        margin: 0 !important;
        display: inline-block !important;
        vertical-align: middle !important;
      }

      .am-chat-widget--corner .am-chat-toggle-text {
        color: var(--chat-toggle-text-color, var(--chat-header-text-color, #FFFFFF)) !important;
        font-size: 16px !important;
        font-weight: 500 !important;
        text-transform: none !important;
        letter-spacing: normal !important;
        text-decoration: none !important;
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
        height: var(--chat-container-height, 600px);
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
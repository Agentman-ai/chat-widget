// styles/responsive.ts
export const responsiveStyles = `
  @media (max-width: 640px) {
    .am-chat-widget--corner .am-chat-container {
      width: 100%;
      height: 100vh;
      bottom: 0;
      right: 0;
    }

    .am-chat-widget--centered {
      max-width: 100%;
      margin: 0 16px;
    }
    
    .desktop-only {
      display: none !important;
    }
    
    /* Branding section - single line on mobile */
    .am-chat-branding {
      padding: 3px 12px !important;
      font-size: 9px !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      gap: 2px !important;
    }
    
    .am-chat-branding > span {
      white-space: nowrap;
    }
    
    .am-chat-branding a {
      font-size: 9px;
    }
  }

  @media (max-width: 480px) {
    .am-chat-widget--centered {
      margin: 0;
    }

    .am-chat-widget--centered .am-chat-container {
      border-radius: 0;
    }
  }
`;

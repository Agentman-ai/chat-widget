// styles/responsive.ts
export const responsiveStyles = `
  @media (max-width: 640px) {
    .am-chat-widget--corner .am-chat-container {
      width: 100%;
      height: 100vh;
      bottom: 0;
      right: 0;
      border-radius: 0;
    }

    .am-chat-widget--centered {
      max-width: 100%;
      margin: 0 16px;
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

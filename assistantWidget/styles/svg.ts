// Add these styles to your style-manager.ts
export const svgStyles = `
  
  .am-chat-svg-container {
    margin: 8px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    padding: 4px;
  }

  .am-chat-svg-wrapper {
    width: 200px;  // Back to original size
    height: auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .am-chat-svg-wrapper svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .am-chat-svg-wrapper.small {
    width: 100px;
  }
  .am-chat-svg-wrapper.medium {
    width: 200px;
  }
  .am-chat-svg-wrapper.large {
    width: 300px;
  }   

`;
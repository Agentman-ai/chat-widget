// notifications.ts - Styles for persistence notifications

export const notificationStyles = `
  .am-persistence-notification {
    position: absolute;
    top: 60px;
    left: 10px;
    right: 10px;
    z-index: 1000;
    border-radius: 8px;
    padding: 12px;
    animation: am-slide-down 0.3s ease-out;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .am-persistence-notification.am-persistence-error {
    background-color: #fee;
    border: 1px solid #fcc;
    color: #c00;
  }
  
  .am-persistence-notification.am-persistence-warning {
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
  }
  
  .am-notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .am-notification-icon {
    font-size: 20px;
    flex-shrink: 0;
  }
  
  .am-notification-message {
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .am-notification-close,
  .am-notification-action {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  .am-notification-close {
    color: inherit;
    font-size: 20px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .am-notification-close:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  .am-notification-action {
    background-color: rgba(0, 0, 0, 0.1);
    color: inherit;
    font-weight: 500;
  }
  
  .am-notification-action:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
  
  @keyframes am-slide-down {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
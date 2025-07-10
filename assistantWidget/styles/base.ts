// styles/base.ts
export const baseStyles = `
  :root{
    --am-bg-item-hover:#eef3ff;
    --am-bg-item-active:#dbeafe;
    --am-text-muted:#6b7280;
    --am-bg-badge:#ef4444;
  }

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
    width: 480px;
    height: 600px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    flex: 1;
  }

  .am-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    height: 54px;
    background: white !important;
    color: #111827 !important;
    box-sizing: border-box;
  }

  .am-chat-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
  }

  .am-chat-logo-title {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 16px;
    font-weight: normal;
    color: #111827;
    flex-shrink: 1;
    min-width: 0;
  }
  
  .am-chat-logo-title span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Hamburger menu button */
  .am-hamburger {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    margin-right: 4px;
  }

  .am-chat-logo {
    width: 28px;
    height: 28px;
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
    width: 18px;
    height: 18px;
    fill: var(--chat-header-text-color, #FFFFFF);
  }

  .am-chat-header button:hover {
    opacity: 0.8;
  }

  .am-chat-header-actions {
    display: flex;
    align-items: center;
    gap: 0px !important;
    flex-shrink: 0;
  }

  .am-chat-header-button {
    background: none;
    border: none;
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
    border-radius: 4px;
    color: #6b7280 !important;
  }

  .am-chat-header-button:hover {
    background: rgba(0, 0, 0, 0.05) !important;
    color: #374151 !important;
  }

  .am-chat-header-button svg {
    width: 18px;
    height: 18px;
    display: block;
    margin: auto;
  }

  /* For stroke-based icons (new collection) */
  .am-chat-header-button svg[stroke],
  .am-chat-header-button svg[stroke-width] {
    stroke: #6b7280 !important;
    fill: none !important;
  }

  .am-chat-header-button:hover svg[stroke],
  .am-chat-header-button:hover svg[stroke-width] {
    stroke: #374151 !important;
    fill: none !important;
  }

  /* For fill-based icons (old collection) */
  .am-chat-header-button svg[fill]:not([fill="none"]) {
    fill: #6b7280 !important;
  }

  .am-chat-header-button:hover svg[fill]:not([fill="none"]) {
    fill: #374151 !important;
  }


  .am-chat-messages {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Stage-2 conversation drawer */
  .am-drawer {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 240px;
    transform: translateX(-100%);
    transition: transform .2s ease-out;
    background: #f5f5f5;
    box-shadow: 2px 0 6px rgba(0,0,0,.08);
    display: flex;
    flex-direction: column;
    z-index: 3;
  }
  .am-drawer.open {
    transform: translateX(0);
  }

  .am-drawer header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    padding: .6rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  .am-drawer header button.am-new {
    font-size: 1.1rem;
    line-height: 1;
    border: none;
    background: var(--chat-header-background-color, #2563eb);
    color: var(--chat-header-text-color, #FFFFFF);
    cursor: pointer;
    border-radius: 4px;
    padding: 4px 8px;
    font-weight: bold;
  }
  
  .am-drawer button.am-close {
    width: 100%;
    padding: 8px;
    margin-top: auto;
    border: none;
    background: #f0f0f0;
    cursor: pointer;
    border-top: 1px solid #e5e7eb;
    font-size: 0.9rem;
    text-align: center;
  }

  .am-drawer ul {
    list-style: none;
    margin: 0;
    padding: .4rem 0;
    flex: 1;
    overflow-y: auto;
  }
  
  /* drawer list styling */
  .am-drawer li {
    display: flex;
    align-items: center;
    gap: .5rem;
    position: relative;
    padding: .45rem 1rem;
    cursor: pointer;
  }
  
  .am-drawer li:hover {
    background: var(--am-bg-item-hover);
  }
  
  .am-drawer li.active {
    background: var(--am-bg-item-active);
  }
  
  .am-drawer li .title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .am-drawer li .time {
    font-size: .72rem;
    color: var(--am-text-muted);
  }
  
  .am-drawer li .badge {
    background: var(--am-bg-badge);
    color: #fff;
    border-radius: 9999px;
    font-size: .65rem;
    padding: 0 .4em;
    min-width: 1.2em;
    text-align: center;
  }

  /* swipe hint overlay (mobile) */
  @media(max-width:479px){
    .am-drawer{
      touch-action:pan-y;
    }
  }
  
  .am-drawer .am-close {
    border: none;
    background: none;
    padding: .6rem 1rem;
    text-align: left;
    cursor: pointer;
    border-top: 1px solid #e5e7eb;
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
    color: #334155;
    background: white;
  }

  .am-chat-branding a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }

  .am-chat-branding a:hover {
    text-decoration: underline;
  }

  .am-chat-input-wrapper {
    background: white;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .am-chat-input-container {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    gap: 8px;
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
    background: var(--chat-header-background-color, #2563eb);
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
    background: var(--chat-header-background-color, #2563eb);
    color: var(--chat-header-text-color, #FFFFFF);
    padding: 8px 16px 8px 8px;
    border-radius: 100px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .am-chat-toggle-text {
    font-size: 16px;
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
    max-width: 600px !important;
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

// Input Bar Styles - Enhanced with Daydream Design Patterns
// Based on analysis of Daydream's modern chat input implementation

export const inputBarEnhancedStyles = `
  /* ============================================
     ENHANCED INPUT BAR WITH DAYDREAM PATTERNS
     Features:
     - Dynamic height expansion (48px → 88px)
     - Progressive button disclosure
     - Blue glow shadow on focus
     - GPU-accelerated animations
     - Field-sizing for auto-resize
     - Micro-interactions
     ============================================ */

  /* Input Bar Container - Modern Compact Design */
  .am-chat-input-bar {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: min(520px, calc(100% - 32px));
    z-index: 100000;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Mobile: Full width with safe area */
  @media (max-width: 768px) {
    .am-chat-input-bar {
      width: calc(100% - 16px);
      bottom: max(8px, env(safe-area-inset-bottom));
    }
  }

  /* Main Input Container - Enhanced with Daydream patterns */
  .am-chat-input-bar-main {
    position: relative;
    background: #FFFFFF;
    border-radius: 24px;
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    border: none;
    display: flex;
    align-items: flex-start; /* Changed for vertical expansion */
    gap: 0;
    min-height: 48px; /* Start small like Daydream */
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* GPU Optimization - Daydream pattern */
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    will-change: transform, box-shadow, min-height;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform-style: preserve-3d;
  }

  /* Focused State - Enhanced with Daydream expansion */
  .am-chat-input-bar-main.focused,
  .am-chat-input-bar-main:focus-within {
    min-height: 88px; /* Expand like Daydream */
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 4px 16px rgba(0, 0, 0, 0.08),
      0 0 24px rgba(201, 208, 245, 0.8), /* Blue glow from Daydream */
      0 0 0 2px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px) translateX(-50%);
  }

  /* Branded Zone - Unchanged but with better alignment */
  .am-chat-input-bar-brand {
    display: flex;
    align-items: center;
    gap: 0;
    background: color-mix(in srgb, var(--chat-toggle-background-color, #3B82F6) 15%, white);
    border-radius: 24px 0 0 24px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    position: relative;
    padding-right: 16px;
    padding-left: 44px;
    min-height: 48px; /* Match container min-height */
    align-self: stretch; /* Stretch to match container height */
  }

  .am-chat-input-bar-brand:hover {
    background: color-mix(in srgb, var(--chat-toggle-background-color, #3B82F6) 20%, white);
  }

  /* Brand Logo */
  .am-chat-input-bar-logo {
    position: absolute;
    left: 6px;
    top: 12px; /* Fixed position instead of centering */
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--chat-toggle-background-color, linear-gradient(135deg, #3B82F6, #2563EB));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chat-toggle-icon-color, white);
    font-size: 18px;
    font-weight: 600;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
  }

  /* Logo pulse animation on thinking */
  .am-chat-input-bar-brand.thinking .am-chat-input-bar-logo {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    50% {
      opacity: 0.8;
      transform: scale(0.95);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
  }

  /* Brand Text */
  .am-chat-input-bar-brand-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--chat-toggle-text-color, white);
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    letter-spacing: -0.01em;
  }

  /* Input Field Container - New wrapper for better control */
  .am-chat-input-bar-input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 8px 16px;
    min-height: 48px;
  }

  /* Enhanced Input Field with Daydream auto-sizing */
  .am-chat-input-bar-field {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 15px;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    padding: 4px 0;
    min-height: 32px;
    max-height: 120px;
    resize: none;

    /* Modern field sizing from Daydream */
    field-sizing: content;
    -webkit-field-sizing: content;

    /* Smooth transitions */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* For browsers that don't support field-sizing, use JavaScript fallback */
  @supports not (field-sizing: content) {
    .am-chat-input-bar-field {
      overflow-y: auto;
    }
  }

  .am-chat-input-bar-field::placeholder {
    color: #9CA3AF;
    font-weight: 400;
    transition: opacity 0.3s ease;
  }

  /* Hide placeholder on focus for cleaner look */
  .am-chat-input-bar-main.focused .am-chat-input-bar-field::placeholder {
    opacity: 0.5;
  }

  /* Typewriter Text (when not focused) */
  .am-chat-input-bar-typewriter {
    position: absolute;
    top: 50%;
    left: 16px;
    right: 16px;
    transform: translateY(-50%);
    font-size: 15px;
    color: #9ca3af;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  /* Hide typewriter on focus */
  .am-chat-input-bar-main.focused .am-chat-input-bar-typewriter {
    opacity: 0;
  }

  .am-chat-input-bar-typewriter::after {
    content: '|';
    animation: blink 1s step-end infinite;
    margin-left: 2px;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  /* Action Buttons Container - Progressive Disclosure (Daydream pattern) */
  .am-chat-input-bar-actions {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 6px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(4px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Show actions on focus with smooth animation */
  .am-chat-input-bar-main.focused .am-chat-input-bar-actions,
  .am-chat-input-bar-main:focus-within .am-chat-input-bar-actions {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  /* Individual Action Buttons - Daydream style */
  .am-chat-input-bar-action {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    background: rgba(243, 244, 246, 0.8);
    color: #6b7280;
  }

  /* Hover state with elevation */
  .am-chat-input-bar-action:hover {
    background: rgba(229, 231, 235, 0.9);
    color: #4b5563;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Active state with micro-interaction */
  .am-chat-input-bar-action:active {
    transform: scale(0.92);
    transition: transform 0.1s ease;
  }

  /* Primary action button (Send) */
  .am-chat-input-bar-action.primary {
    background: var(--chat-toggle-background-color, #3b82f6);
    color: white;
  }

  .am-chat-input-bar-action.primary:hover {
    background: var(--chat-toggle-hover-color, #2563eb);
    box-shadow: 0 2px 12px rgba(59, 130, 246, 0.4);
  }

  /* Ripple effect on click */
  .am-chat-input-bar-action::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .am-chat-input-bar-action:active::after {
    animation: ripple 0.4s ease;
  }

  @keyframes ripple {
    from {
      width: 0;
      height: 0;
      opacity: 1;
    }
    to {
      width: 40px;
      height: 40px;
      opacity: 0;
    }
  }

  /* Menu Icon - Enhanced with rotation */
  .am-chat-input-bar-menu {
    position: absolute;
    right: 8px;
    top: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: #9CA3AF;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .am-chat-input-bar-menu:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #6b7280;
    transform: rotate(90deg);
  }

  .am-chat-input-bar-menu svg {
    width: 20px;
    height: 20px;
    transition: inherit;
  }

  /* Icon styles for action buttons */
  .am-chat-input-bar-action svg {
    width: 18px;
    height: 18px;
    stroke-width: 2;
  }

  /* Prompts Container - Enhanced with blur backdrop */
  .am-chat-input-bar-prompts {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% + 8px);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);
    border-radius: 18px;
    padding: 8px;
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.06),
      0 1px 6px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    gap: 6px;
    opacity: 0;
    transform: translateY(4px) scale(0.98);
    pointer-events: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Show prompts when focused */
  .am-chat-input-bar-main.focused + .am-chat-input-bar-prompts {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  /* Prompt Button - Compact Pills */
  .am-chat-input-bar-prompt {
    flex: 1;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 10px;
    font-size: 13px;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    font-weight: 450;
    position: relative;
  }

  .am-chat-input-bar-prompt:hover {
    background: white;
    border-color: rgba(99, 102, 241, 0.2);
    color: #1f2937;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .am-chat-input-bar-prompt:active {
    transform: translateY(0);
  }

  /* Mobile: Stack prompts vertically */
  @media (max-width: 480px) {
    .am-chat-input-bar-prompts {
      flex-direction: column;
    }

    .am-chat-input-bar-prompt {
      width: 100%;
    }

    /* Adjust main container for mobile */
    .am-chat-input-bar-main.focused {
      max-height: 50dvh; /* Dynamic viewport height */
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .am-chat-input-bar-main {
      background: rgba(31, 41, 55, 0.95);
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .am-chat-input-bar-main.focused {
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 24px rgba(99, 102, 241, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .am-chat-input-bar-field {
      color: #f3f4f6;
    }

    .am-chat-input-bar-field::placeholder {
      color: #6b7280;
    }

    .am-chat-input-bar-typewriter {
      color: #6b7280;
    }

    .am-chat-input-bar-action {
      background: rgba(75, 85, 99, 0.5);
      color: #9ca3af;
    }

    .am-chat-input-bar-action:hover {
      background: rgba(75, 85, 99, 0.8);
      color: #f3f4f6;
    }

    .am-chat-input-bar-prompts {
      background: rgba(31, 41, 55, 0.95);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .am-chat-input-bar-prompt {
      background: rgba(55, 65, 81, 0.8);
      border-color: rgba(255, 255, 255, 0.1);
      color: #e5e7eb;
    }

    .am-chat-input-bar-prompt:hover {
      background: rgba(75, 85, 99, 0.8);
      border-color: rgba(255, 255, 255, 0.2);
      color: #f3f4f6;
    }
  }

  /* Animation for initial appearance */
  @keyframes inputBarSlideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .am-chat-input-bar.am-chat-input-bar-enter {
    animation: inputBarSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Loading state for input bar */
  .am-chat-input-bar-main.loading {
    pointer-events: none;
    opacity: 0.7;
  }

  .am-chat-input-bar-main.loading .am-chat-input-bar-logo {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Accessibility improvements */
  .am-chat-input-bar-action:focus-visible,
  .am-chat-input-bar-menu:focus-visible {
    outline: 2px solid var(--chat-toggle-background-color, #3b82f6);
    outline-offset: 2px;
  }

  .am-chat-input-bar-field:focus-visible {
    outline: none; /* Handled by container focus styles */
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .am-chat-input-bar-main {
      border: 2px solid currentColor;
    }

    .am-chat-input-bar-action {
      border: 1px solid currentColor;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .am-chat-input-bar-main,
    .am-chat-input-bar-actions,
    .am-chat-input-bar-action,
    .am-chat-input-bar-prompts {
      transition-duration: 0.01ms !important;
    }

    .am-chat-input-bar-logo,
    .am-chat-input-bar-menu {
      animation: none !important;
    }
  }
`;
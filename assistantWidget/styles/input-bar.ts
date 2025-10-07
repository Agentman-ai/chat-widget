// Input Bar Styles - Modern AI search bar at bottom of screen
export const inputBarStyles = `
  /* Input Bar Container - Modern Compact Design with GPU Optimization */
  .am-chat-input-bar {
    position: fixed;
    bottom: calc(12px + env(safe-area-inset-bottom, 0px)); /* Safari safe area */
    left: 50%;
    transform: translateX(-50%) translateZ(0); /* GPU acceleration */
    width: min(520px, calc(100% - 32px));
    z-index: 100000;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); /* Elastic easing */
    will-change: transform;
    backface-visibility: hidden;
    perspective: 1000px;
    max-height: 80dvh; /* Mobile keyboard handling */
  }

  /* Mobile: Full width + safe area handling */
  @media (max-width: 768px) {
    .am-chat-input-bar {
      width: calc(100% - 24px);
      bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    }
  }

  /* Main Input Container - Expandable Design with Brand-Colored Glow */
  .am-chat-input-bar-main {
    position: relative;
    background: #FFFFFF;
    border-radius: 24px;
    padding: 0;
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.08);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); /* Elastic easing */
    display: flex;
    align-items: center;
    gap: 0;
    height: 48px; /* Collapsed height */
    overflow: hidden;
    transform: translateZ(0);
    will-change: height, box-shadow, transform;
    backface-visibility: hidden;
    perspective: 1000px;
    contain: layout style paint;
  }

  /* Focused State - Height Expansion + Multi-Layer Glow */
  .am-chat-input-bar-main.focused {
    height: 80px; /* Fixed height */
    align-items: center; /* Keep elements vertically centered */
    box-shadow:
      /* Primary shadow */
      0 12px 48px rgba(0, 0, 0, 0.15),
      /* Mid shadow */
      0 6px 24px rgba(0, 0, 0, 0.08),
      /* Brand glow - multi-layer for depth */
      0 0 0 1px var(--chat-input-bar-logo-background, var(--chat-toggle-background-color, #0066FF)),
      0 0 32px var(--chat-input-bar-glow-color, color-mix(in srgb, var(--chat-toggle-background-color, #0066FF) 40%, transparent)),
      0 0 64px var(--chat-input-bar-glow-color, color-mix(in srgb, var(--chat-toggle-background-color, #0066FF) 20%, transparent));
    transform: translateY(-3px) scale(1.02); /* Subtle lift + scale */
    border-color: transparent;
  }

  /* Gradient border effect on focus */
  .am-chat-input-bar-main.focused::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 26px;
    padding: 2px;
    background: linear-gradient(
      45deg,
      var(--chat-toggle-background-color, #0066FF),
      color-mix(in srgb, var(--chat-toggle-background-color, #0066FF) 60%, #FF00FF)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.8;
    animation: glowPulse 3s ease-in-out infinite;
    pointer-events: none;
    z-index: -1;
  }

  @keyframes glowPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  /* Branded Zone - Fully Customizable */
  .am-chat-input-bar-brand {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--chat-input-bar-brand-background, color-mix(in srgb, var(--chat-toggle-background-color, #0066FF) 8%, white));
    border-radius: 24px 0 0 24px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); /* Elastic easing */
    flex-shrink: 0;
    position: relative;
    padding-right: 16px;
    padding-left: 16px;
    height: 48px;
  }

  /* Brand zone collapses to circular icon on focus */
  .am-chat-input-bar-main.focused .am-chat-input-bar-brand {
    width: 56px; /* Square for perfect circle */
    height: 56px;
    padding-left: 0;
    padding-right: 0;
    border-radius: 50%; /* Full circle */
    justify-content: center;
    margin-left: 12px; /* Add spacing from edge */
  }

  .am-chat-input-bar-brand:hover {
    background: color-mix(in srgb, var(--chat-input-bar-brand-background, var(--chat-toggle-background-color, #3B82F6)) 120%, white);
  }

  /* Brand Logo - No Circle, Just Icon */
  .am-chat-input-bar-logo {
    position: relative;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chat-input-bar-logo-icon, var(--chat-input-bar-brand-text, #0066FF));
    flex-shrink: 0;
    margin-right: 8px;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Logo adjustments when focused (no margin when text is hidden) */
  .am-chat-input-bar-main.focused .am-chat-input-bar-logo {
    margin-right: 0;
    width: 32px;
    height: 32px;
  }

  /* Robot/AI Icon in Logo - Matches Text Color */
  .am-chat-input-bar-logo svg {
    width: 28px;
    height: 28px;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Scale up icon when focused */
  .am-chat-input-bar-main.focused .am-chat-input-bar-logo svg {
    width: 32px;
    height: 32px;
  }

  /* Brand Text - Electric Blue Default */
  .am-chat-input-bar-brand-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--chat-input-bar-brand-text, #0066FF);
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    letter-spacing: -0.01em;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Hide text when focused - only show icon */
  .am-chat-input-bar-main.focused .am-chat-input-bar-brand-text {
    opacity: 0;
    width: 0;
    overflow: hidden;
    margin: 0;
  }

  /* Thinking Animation for Logo */
  .am-chat-input-bar-brand.thinking .am-chat-input-bar-logo {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(0.95);
    }
  }

  /* Typing Indicator in Brand Zone */
  .am-chat-input-bar-brand.typing::after {
    content: '';
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 24px;
    height: 4px;
    background: linear-gradient(
      90deg,
      var(--chat-toggle-background-color, #0066FF) 0%,
      var(--chat-toggle-background-color, #0066FF) 33%,
      transparent 33%,
      transparent 66%,
      var(--chat-toggle-background-color, #0066FF) 66%
    );
    background-size: 300% 100%;
    animation: typingWave 1s linear infinite;
    border-radius: 2px;
    opacity: 0.6;
  }

  @keyframes typingWave {
    0% { background-position: 100% 0; }
    100% { background-position: 0% 0; }
  }

  /* Plus Icon Button - Hidden by default when brand zone exists */
  .am-chat-input-bar-plus {
    display: none; /* Will be replaced by brand zone */
  }

  /* Optional: Plus button for file attachments (separate from brand) */
  .am-chat-input-bar-attach {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    transition: all 0.2s ease;
    border-radius: 8px;
    margin-left: 4px;
  }

  .am-chat-input-bar-attach:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #6b7280;
  }

  .am-chat-input-bar-attach svg {
    width: 20px;
    height: 20px;
    stroke-width: 2;
  }

  /* Input Field - Auto-Resize with Field Sizing */
  .am-chat-input-bar-field {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 15px;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    padding: 16px; /* Padding for expanded state */
    height: auto;
    min-height: 48px;
    max-height: 120px; /* Limit expansion */
    resize: none;
    overflow-y: auto;
    field-sizing: content; /* Auto-resize textarea */
    transition: font-size 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), padding 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: none; /* Hidden by default, shown via JS on focus */
  }

  /* Larger font and more breathing room when focused */
  .am-chat-input-bar-main.focused .am-chat-input-bar-field {
    padding: 20px 16px;
    font-size: 16px;
    line-height: 1.6;
  }

  .am-chat-input-bar-field::placeholder {
    color: #9CA3AF;
    font-weight: 400;
  }

  /* Focus hint */
  .am-chat-input-bar-field:focus::placeholder {
    opacity: 0.7;
  }

  /* Typewriter Text (when not focused) */
  .am-chat-input-bar-typewriter {
    flex: 1;
    font-size: 15px;
    color: #9ca3af;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    padding: 0 16px; /* Match input field padding */
    height: 48px; /* Match input field height */
    display: flex;
    align-items: center;
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

  /* Right Icons Container */
  .am-chat-input-bar-icons {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    padding-right: 8px; /* Padding from right edge */
  }

  /* Menu Icon Button - Integrated into Layout Flow */
  .am-chat-input-bar-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--chat-input-bar-button-background, color-mix(in srgb, var(--chat-toggle-background-color, #3B82F6) 10%, white));
    border: none;
    border-radius: 12px;
    cursor: pointer;
    color: var(--chat-input-bar-button-icon, #6B7280);
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); /* Elastic easing */
    margin-right: 8px;
    flex-shrink: 0;
    opacity: 0;
    pointer-events: none;
    transform: scale(0.8) rotate(-90deg) translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  /* Show button on focus with staggered animation (Progressive Disclosure) */
  .am-chat-input-bar-main.focused .am-chat-input-bar-icon {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1) rotate(0deg) translateZ(0);
    transition-delay: 0.1s; /* Staggered appearance */
  }

  .am-chat-input-bar-icon:hover {
    background: color-mix(in srgb, var(--chat-input-bar-button-background, var(--chat-toggle-background-color, #3B82F6)) 150%, white);
    color: var(--chat-input-bar-logo-background, var(--chat-toggle-background-color, #3B82F6));
  }

  .am-chat-input-bar-icon:active {
    transform: scale(0.95) translateZ(0);
  }

  /* Menu icon specific rotation on hover */
  .am-chat-input-bar-menu:hover {
    transform: rotate(90deg) translateZ(0);
  }

  .am-chat-input-bar-icon svg {
    width: 20px;
    height: 20px;
    transition: inherit;
  }

  /* Microphone Active State */
  .am-chat-input-bar-icon.recording {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    animation: recordPulse 1.5s ease-in-out infinite;
  }

  @keyframes recordPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
    }
  }

  /* Prompts Container - Floating Above Input Bar */
  .am-chat-input-bar-prompts {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% + 8px); /* Above input bar */
    background: rgba(255, 255, 255, 0.92);
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
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    opacity: 0;
    transform: translateY(12px) scale(0.95);
    filter: blur(4px);
    pointer-events: none;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    will-change: transform, opacity, filter;
    backface-visibility: hidden;
  }

  /* Show prompts when focused with enhanced animation */
  .am-chat-input-bar-main.focused + .am-chat-input-bar-prompts {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
    pointer-events: auto;
    animation: promptSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes promptSlide {
    0% {
      opacity: 0;
      transform: translateY(12px) scale(0.95);
      filter: blur(4px);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  /* Prompt Button - Compact Pills */
  .am-chat-input-bar-prompt {
    flex: 0 1 auto;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 10px;
    font-size: 13px;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    min-width: 120px;
    max-width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    font-weight: 450;
  }

  .am-chat-input-bar-prompt:hover {
    background: white;
    border-color: rgba(99, 102, 241, 0.2);
    color: #1f2937;
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .am-chat-input-bar-prompt:active {
    transform: translateY(0) scale(1);
  }

  /* Mobile: Stack prompts vertically on very small screens */
  @media (max-width: 480px) {
    .am-chat-input-bar-prompts {
      flex-direction: column;
    }

    .am-chat-input-bar-prompt {
      width: 100%;
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

    .am-chat-input-bar-field {
      color: #f3f4f6;
    }

    .am-chat-input-bar-field::placeholder {
      color: #6b7280;
    }

    .am-chat-input-bar-typewriter {
      color: #6b7280;
    }

    .am-chat-input-bar-icon {
      background: rgba(75, 85, 99, 0.5);
      color: #9ca3af;
    }

    .am-chat-input-bar-icon:hover {
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
`;

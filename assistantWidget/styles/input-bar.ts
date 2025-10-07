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

  /* Subtle glow wrapper - sits behind the main input */
  .am-chat-input-bar::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 28px;
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.3) 0%,
      rgba(168, 85, 247, 0.3) 25%,
      rgba(236, 72, 153, 0.3) 50%,
      rgba(99, 102, 241, 0.3) 100%
    );
    background-size: 200% 200%;
    opacity: 0.4;
    filter: blur(20px);
    animation: inputBarGradientGlow 8s ease-in-out infinite;
    z-index: -1;
    pointer-events: none;
    transition: all 0.3s ease;
  }

  @keyframes inputBarGradientGlow {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  /* Subtle ambient orb - even further behind */
  .am-chat-input-bar::after {
    content: '';
    position: absolute;
    inset: -80px -60px;
    background: radial-gradient(
      ellipse at center,
      rgba(139, 92, 246, 0.15) 0%,
      rgba(168, 85, 247, 0.1) 30%,
      transparent 60%
    );
    opacity: 0.3;
    filter: blur(60px);
    animation: inputBarOrbPulse 10s ease-in-out infinite;
    z-index: -2;
    pointer-events: none;
    transition: all 0.3s ease;
  }

  @keyframes inputBarOrbPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  /* Moderate glow enhancement on focus */
  .am-chat-input-bar:has(.am-chat-input-bar-main.focused)::before {
    opacity: 0.7;
    filter: blur(28px);
    inset: -6px;
    animation: inputBarGradientGlow 4s ease-in-out infinite;
  }

  .am-chat-input-bar:has(.am-chat-input-bar-main.focused)::after {
    opacity: 0.5;
    filter: blur(80px);
    transform: scale(1.1);
  }

  /* Mobile: Full width + safe area handling */
  @media (max-width: 768px) {
    .am-chat-input-bar {
      width: calc(100% - 24px);
      bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    }
  }

  /* Main Input Container - Premium Glassmorphism */
  .am-chat-input-bar-main {
    position: relative;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border-radius: 24px;
    padding: 0;
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.06),
      0 1px 2px rgba(0, 0, 0, 0.08),
      inset 0 1px 1px rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.6);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    display: flex;
    align-items: center;
    gap: 0;
    height: 48px;
    overflow: visible;
    transform: translateZ(0);
    will-change: height, box-shadow, transform;
    backface-visibility: hidden;
    perspective: 1000px;
  }

  /* Focused State - Enhanced Glassmorphism */
  .am-chat-input-bar-main.focused {
    height: 80px;
    align-items: center;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.08),
      0 2px 4px rgba(0, 0, 0, 0.06),
      inset 0 1px 2px rgba(255, 255, 255, 0.8);
    transform: translateY(-2px) scale(1.01);
    border: 1px solid rgba(255, 255, 255, 0.8);
  }

  /* Show gradient border on focus */
  .am-chat-input-bar-main.focused::before {
    opacity: 0.6;
  }

  /* Enhanced background gradient animation on focus */
  .am-chat-input-bar-main.focused::after {
    opacity: 0.5;
    filter: blur(80px);
  }

  @keyframes glowPulse {
    0%, 100% {
      opacity: 0.6;
      filter: saturate(1) brightness(1);
    }
    50% {
      opacity: 1;
      filter: saturate(1.3) brightness(1.15);
    }
  }

  /* Branded Zone - Refined Modern Design */
  .am-chat-input-bar-brand {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--chat-input-bar-brand-background, color-mix(in srgb, var(--chat-toggle-background-color, #0066FF) 8%, white));
    border-radius: 24px 0 0 24px;
    border: 1px solid color-mix(in srgb, var(--chat-input-bar-brand-background, var(--chat-toggle-background-color, #0066FF)) 85%, white);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    flex-shrink: 0;
    position: relative;
    padding-right: 16px;
    padding-left: 16px;
    height: 48px;
    overflow: hidden;
  }

  /* Subtle gradient overlay for premium feel */
  .am-chat-input-bar-brand::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 50%
    );
    pointer-events: none;
    border-radius: inherit;
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
    background: color-mix(in srgb, var(--chat-input-bar-brand-background, var(--chat-toggle-background-color, #3B82F6)) 110%, white);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .am-chat-input-bar-brand:active {
    transform: scale(0.98) translateY(0);
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

  /* Robot/AI Icon in Logo - Clean with Micro-interactions */
  .am-chat-input-bar-logo svg {
    width: 28px;
    height: 28px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Playful rotation on hover */
  .am-chat-input-bar-brand:hover .am-chat-input-bar-logo svg {
    transform: rotate(-8deg);
  }

  /* Scale up when focused with subtle shadow */
  .am-chat-input-bar-main.focused .am-chat-input-bar-logo svg {
    width: 32px;
    height: 32px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  /* Brand Text - Clean and Confident */
  .am-chat-input-bar-brand-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--chat-input-bar-brand-text, #0066FF);
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    letter-spacing: -0.02em;
    user-select: none;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Subtle micro-interaction on hover */
  .am-chat-input-bar-brand:hover .am-chat-input-bar-brand-text {
    transform: translateX(2px);
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
    position: relative;
    
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
    position: relative;
    
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
    position: relative;
    
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

  /* Prompts Container - Premium Glassmorphism */
  .am-chat-input-bar-prompts {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% + 12px);
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border-radius: 20px;
    padding: 10px;
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.06),
      0 1px 2px rgba(0, 0, 0, 0.08),
      inset 0 1px 1px rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.6);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
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

  /* Prompt Button - Glassmorphic Pills */
  .am-chat-input-bar-prompt {
    flex: 0 1 auto;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px) saturate(150%);
    -webkit-backdrop-filter: blur(12px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.23, 1, 0.320, 1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    min-width: 120px;
    max-width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    font-weight: 450;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.04),
      inset 0 1px 1px rgba(255, 255, 255, 0.3);
  }

  .am-chat-input-bar-prompt:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.7);
    color: #111827;
    transform: translateY(-2px);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.06),
      inset 0 1px 1px rgba(255, 255, 255, 0.5);
  }

  .am-chat-input-bar-prompt:active {
    transform: translateY(0) scale(1);
  }

  /* Mobile: Stack prompts vertically on very small screens */
  @media (max-width: 480px) {
    .am-chat-input-bar-prompts {
      flex-direction: column;
      align-items: center; /* Center prompts within container */
    }

    .am-chat-input-bar-prompt {
      width: 100%;
      max-width: 100%; /* Ensure full width */
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

  /* Accessibility: Respect user's motion preferences */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

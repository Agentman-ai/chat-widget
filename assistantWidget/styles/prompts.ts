// styles/prompts.ts
export const promptStyles = `
  /* Input Prompts Container */
  .am-chat-input-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px 8px 16px;
    background: var(--chat-background-color, #ffffff);
    border-bottom: 1px solid #e5e7eb;
  }

  /* Individual Prompt Buttons */
  .am-chat-input-prompt-btn {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    line-height: 1.2;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .am-chat-input-prompt-btn:hover {
    background-color: var(--chat-button-color, #2563eb);
    color: var(--chat-button-text-color, #ffffff);
    border-color: var(--chat-button-color, #2563eb);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .am-chat-input-prompt-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  /* Hide prompts when input is focused and has content */
  .am-chat-input:focus ~ .am-chat-input-prompts,
  .am-chat-input:not(:placeholder-shown) ~ .am-chat-input-prompts {
    opacity: 0.7;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .am-chat-input-prompts {
      padding: 8px 12px 6px 12px;
      gap: 6px;
    }

    .am-chat-input-prompt-btn {
      font-size: 12px;
      padding: 5px 10px;
      max-width: 150px;
    }
  }

  /* Animation for showing/hiding prompts - DISABLED */
  /* .am-chat-input-prompts {
    transition: opacity 0.3s ease, transform 0.3s ease;
  } */

  .am-chat-input-prompts[style*="display: none"] {
    opacity: 0;
    transform: translateY(-5px);
  }

  /* ===== FLOATING PROMPT BUBBLES (When widget is closed) ===== */
  
  .am-chat-floating-prompts-container {
    position: fixed;
    bottom: 80px; /* Above the toggle button */
    right: 20px;
    max-width: 320px;
    z-index: 999; /* Below the toggle button which is 1000 */
    animation: fadeInUp 0.3s ease forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Position-specific adjustments */
  .am-chat-widget--corner[data-position="bottom-left"] .am-chat-floating-prompts-container {
    right: auto;
    left: 20px;
  }

  .am-chat-widget--corner[data-position="top-right"] .am-chat-floating-prompts-container {
    bottom: auto;
    top: 80px;
  }

  .am-chat-widget--corner[data-position="top-left"] .am-chat-floating-prompts-container {
    bottom: auto;
    top: 80px;
    right: auto;
    left: 20px;
  }

  /* Left-align prompts when widget is on the left */
  .am-chat-widget--corner[data-position="bottom-left"] .am-chat-floating-message-prompts,
  .am-chat-widget--corner[data-position="top-left"] .am-chat-floating-message-prompts {
    align-items: flex-start;
  }

  /* Welcome message bubble */
  .am-chat-floating-welcome-message {
    background: white;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    position: relative;
  }

  .am-chat-floating-welcome-header {
    display: flex;
    align-items: center;
  }

  .am-chat-floating-welcome-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--chat-button-color, #2563eb);
    margin-right: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .am-chat-floating-welcome-avatar svg {
    width: 18px;
    height: 18px;
  }

  .am-chat-floating-welcome-text {
    font-weight: 500;
    font-size: 14px;
    color: #111827;
    line-height: 1.4;
    flex: 1;
    padding-right: 28px;
  }

  .am-chat-floating-welcome-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #f3f4f6;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: all 0.2s ease;
    padding: 0;
  }

  .am-chat-floating-welcome-close:hover {
    background-color: #e5e7eb;
    color: #111827;
  }

  .am-chat-floating-welcome-close svg {
    width: 14px;
    height: 14px;
  }

  /* Floating prompt buttons container */
  .am-chat-floating-message-prompts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end; /* Right-align buttons */
  }

  /* Individual floating prompt buttons */
  .am-chat-floating-message-prompt {
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    line-height: 1.3;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 100%;
    word-wrap: break-word;
    font-family: inherit;
  }

  .am-chat-floating-message-prompt:hover {
    background: var(--chat-button-color, #2563eb);
    color: var(--chat-button-text-color, #ffffff);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .am-chat-floating-message-prompt:active {
    transform: translateY(0);
  }

  /* Hide floating prompts on mobile devices */
  @media (max-width: 768px) {
    .am-chat-floating-prompts-container {
      display: none !important;
    }
  }

  /* Responsive adjustments for smaller screens */
  @media (max-width: 480px) {
    .am-chat-floating-prompts-container {
      right: 12px;
      max-width: 280px;
    }
    
    .am-chat-floating-welcome-message {
      padding: 12px;
    }
    
    .am-chat-floating-message-prompt {
      font-size: 13px;
      padding: 10px 14px;
    }
  }

  /* ===== MODERNIZED WELCOME CARD (2025 Standards) ===== */

  .am-chat-floating-welcome-card {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(255, 255, 255, 0.85) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 20px;
    padding: 44px 0px 16px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.08),
      0 24px 48px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    max-width: 360px;
    width: 360px;
    text-align: center;
    z-index: 1000;
    overflow: hidden;
    transform-origin: bottom right;
    /* CHANGE THIS LINE TO TEST DIFFERENT ANIMATIONS:
       - gentleFadeIn (smooth slide up from 40px)
       - softScale (grows from 85% - NO sliding)
       - blurFade (heavy blur + slide - very distinct!)
       - naturalSpring (bouncy overshoot)
       - minimalSlide (barely moves - 4px only)
       - magneticSlideIn (old bouncy version)
    */
    animation: spinIn 0.8s ease-out;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .am-chat-floating-welcome-card:hover {
    transform: translateY(-2px);
  }

  /* Animation Options - Switch by changing animation name on line 278 */

  /* OPTION 1: Gentle Fade & Rise (Apple-style - Most subtle) */
  @keyframes gentleFadeIn {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* OPTION 2: Soft Scale (Google Material-style) - NO vertical movement, just growth */
  @keyframes softScale {
    from {
      opacity: 0;
      transform: scale(0.85);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* OPTION 3: Blur Fade (macOS-style - Most sophisticated) - Heavy blur effect */
  @keyframes blurFade {
    from {
      opacity: 0;
      filter: blur(20px);
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      filter: blur(0);
      transform: translateY(0);
    }
  }

  /* OPTION 4: Natural Spring (Vercel/Linear-style) - Bouncy with overshoot */
  @keyframes naturalSpring {
    0% {
      opacity: 0;
      transform: translateY(40px) scale(0.9);
    }
    60% {
      transform: translateY(-8px) scale(1.02);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* OPTION 5: Minimal Slide (Stripe-style - Most conservative) - Barely moves */
  @keyframes minimalSlide {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* EXTREME TEST ANIMATIONS - These are VERY different, use to verify it's working */

  /* TEST A: Slide from RIGHT (horizontal instead of vertical) */
  @keyframes slideFromRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* TEST B: Spin and fade in */
  @keyframes spinIn {
    from {
      opacity: 0;
      transform: rotate(-180deg) scale(0.3);
    }
    to {
      opacity: 1;
      transform: rotate(0) scale(1);
    }
  }

  /* TEST C: Instant pop (no animation) */
  @keyframes instantPop {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* OLD: Magnetic Slide In (Current - bouncy, can feel grating) */
  @keyframes magneticSlideIn {
    0% {
      transform: translateY(40px) scale(0.92) rotateX(10deg);
      opacity: 0;
      filter: blur(4px);
    }
    50% {
      transform: translateY(-5px) scale(1.02) rotateX(-2deg);
      filter: blur(0);
    }
    100% {
      transform: translateY(0) scale(1) rotateX(0);
      opacity: 1;
      filter: blur(0);
    }
  }

  /* Noise texture overlay */
  .am-chat-floating-welcome-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      repeating-conic-gradient(
        from 0deg at 50% 50%,
        transparent 0deg,
        rgba(255, 255, 255, 0.03) 1deg,
        transparent 2deg
      );
    opacity: 0.4;
    pointer-events: none;
    z-index: 1;
    border-radius: 24px;
  }

  /* Advanced animated background */
  .am-chat-welcome-card-background {
    position: absolute;
    inset: -50%;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    opacity: 0;
    animation: fadeInBackground 1s ease-out 0.3s forwards;
  }

  @keyframes fadeInBackground {
    to {
      opacity: 1;
    }
  }

  /* Mesh gradient orbs */
  .am-chat-welcome-card-bg-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    mix-blend-mode: multiply;
    animation: floatOrb 8s ease-in-out infinite;
  }

  .am-chat-welcome-card-bg-circle:nth-child(1) {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle at 30% 30%,
      var(--chat-toggle-background-color, #2563eb) 0%,
      transparent 70%);
    top: -20%;
    left: -20%;
    opacity: 0.35;
    animation-duration: 8s;
  }

  .am-chat-welcome-card-bg-circle:nth-child(2) {
    width: 350px;
    height: 350px;
    background: radial-gradient(circle at 70% 70%,
      var(--chat-toggle-background-color, #2563eb) 0%,
      transparent 70%);
    bottom: -20%;
    right: -20%;
    opacity: 0.25;
    animation-duration: 10s;
    animation-delay: -2s;
  }

  .am-chat-welcome-card-bg-circle:nth-child(3) {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle at 50% 50%,
      var(--chat-toggle-background-color, #2563eb) 0%,
      transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.18;
    animation-duration: 12s;
    animation-delay: -4s;
  }

  @keyframes floatOrb {
    0%, 100% {
      transform: translate(0, 0) scale(1) rotate(0deg);
    }
    25% {
      transform: translate(30px, -30px) scale(1.1) rotate(90deg);
    }
    50% {
      transform: translate(-20px, 20px) scale(0.95) rotate(180deg);
    }
    75% {
      transform: translate(20px, 30px) scale(1.05) rotate(270deg);
    }
  }

  /* Content with stagger animation */
  .am-chat-welcome-card-content {
    position: relative;
    z-index: 2;
    padding: 0 40px;
  }

  .am-chat-welcome-card-content > * {
    opacity: 0;
    animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .am-chat-welcome-card-content > *:nth-child(1) {
    animation-delay: 0.1s;
  }

  .am-chat-welcome-card-content > *:nth-child(2) {
    animation-delay: 0.2s;
  }

  .am-chat-welcome-card-content > *:nth-child(3) {
    animation-delay: 0.3s;
  }

  .am-chat-welcome-card-content > *:nth-child(4) {
    animation-delay: 0.4s;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Modernized close button */
  .am-chat-welcome-card-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.9),
      rgba(255, 255, 255, 0.7));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    width: 28px;
    height: 28px;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0;
    z-index: 3;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  .am-chat-welcome-card-close:hover {
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.1),
      rgba(239, 68, 68, 0.05));
    color: #ef4444;
    transform: scale(1.1) rotate(90deg);
    box-shadow:
      0 4px 12px rgba(239, 68, 68, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  .am-chat-welcome-card-close:active {
    transform: scale(0.95) rotate(90deg);
  }

  .am-chat-welcome-card-close svg {
    width: 16px;
    height: 16px;
    transition: transform 0.3s ease;
  }

  /* Enhanced welcome message */
  .am-chat-welcome-card-message {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    background: linear-gradient(135deg,
      #1e293b 0%,
      #64748b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 20px;
    padding: 0 8px;
    letter-spacing: -0.02em;
    position: relative;
  }

  /* Animated underline - short line that moves from left to right */
  .am-chat-welcome-card-message::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 8px;
    width: 20%;
    height: 2px;
    background: var(--chat-toggle-background-color, #2563eb);
    opacity: 0.5;
    border-radius: 2px;
    animation: moveLeftToRight 2.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s infinite;
  }

  @keyframes moveLeftToRight {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(400%);
    }
  }

  /* Enhanced toggle button container with magnetic effect */
  .am-chat-welcome-card-toggle-container {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    position: relative;
    padding: 4px;
  }

  .am-chat-welcome-card-toggle-container .am-chat-toggle {
    position: relative !important;
    transform: none !important;
    margin: 0 !important;
    min-width: 120px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 4px 16px rgba(37, 99, 235, 0.2));
  }

  .am-chat-welcome-card-toggle-container .am-chat-toggle .am-chat-toggle-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .am-chat-welcome-card-toggle-container .am-chat-toggle:hover {
    transform: translateY(-2px) scale(1.05) !important;
    filter: drop-shadow(0 8px 24px rgba(37, 99, 235, 0.3));
  }

  .am-chat-welcome-card-toggle-container .am-chat-toggle:active {
    transform: translateY(0) scale(0.98) !important;
  }

  /* Pulse ring animation for CTA - DISABLED */
  /* Removed pulsing rectangle around button */

  /* Modernized footer with better hierarchy */
  .am-chat-welcome-card-footer {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.025em;
    color: #94a3b8;
    margin-top: 16px;
    opacity: 0.6;
    transition: opacity 0.2s ease;
  }

  .am-chat-floating-welcome-card:hover .am-chat-welcome-card-footer {
    opacity: 0.4;
  }

  /* Position adjustments for different corners */
  .am-chat-widget[data-position="bottom-left"] .am-chat-floating-welcome-card {
    left: 20px;
    right: auto;
    transform-origin: bottom left;
  }

  .am-chat-widget[data-position="top-right"] .am-chat-floating-welcome-card {
    top: 20px;
    bottom: auto;
    transform-origin: top right;
  }

  .am-chat-widget[data-position="top-left"] .am-chat-floating-welcome-card {
    top: 20px;
    left: 20px;
    right: auto;
    bottom: auto;
    transform-origin: top left;
  }

  /* Mobile responsive with better animations */
  @media (max-width: 768px) {
    .am-chat-floating-welcome-card {
      left: 16px !important;
      right: 16px !important;
      bottom: 16px !important;
      top: auto !important;
      width: auto;
      max-width: none;
      padding: 44px 0px 16px;
      transform-origin: bottom center;
      border-radius: 18px;
    }

    .am-chat-welcome-card-content {
      padding: 0 24px;
    }

    .am-chat-welcome-card-toggle-container {
      margin-bottom: 12px;
    }

    .am-chat-welcome-card-message {
      font-size: 14px;
      margin-bottom: 16px;
    }

    .am-chat-welcome-card-footer {
      margin-top: 14px;
    }

    @keyframes magneticSlideIn {
      0% {
        transform: translateY(40px) scale(0.95);
        opacity: 0;
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .am-chat-floating-welcome-card {
      background: linear-gradient(135deg,
        rgba(30, 41, 59, 0.95) 0%,
        rgba(30, 41, 59, 0.85) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 24px 48px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .am-chat-welcome-card-message {
      background: linear-gradient(135deg,
        #e2e8f0 0%,
        #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .am-chat-welcome-card-close {
      background: linear-gradient(135deg,
        rgba(51, 65, 85, 0.9),
        rgba(51, 65, 85, 0.7));
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
    }
  }
`;
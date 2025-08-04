/**
 * ScrollManager - Intelligent scroll behavior for chat messages
 * 
 * Handles:
 * - Auto-scroll when user is at bottom
 * - Preserve scroll position when user is reading
 * - Show "new content" indicator when not auto-scrolling
 * - Smooth vs instant scroll options
 */

import { Logger } from './logger';

export interface ScrollConfig {
  threshold?: number; // How close to bottom counts as "at bottom" (default: 50px)
  smoothScroll?: boolean; // Use smooth scrolling (default: true)
  debug?: boolean;
}

export class ScrollManager {
  private container: HTMLElement | null = null;
  private isUserScrolling = false;
  private lastScrollTop = 0;
  private scrollEndTimer: number | null = null;
  private newContentIndicator: HTMLElement | null = null;
  private logger: Logger;
  private config: Required<ScrollConfig>;
  
  constructor(config: ScrollConfig = {}) {
    this.config = {
      threshold: config.threshold ?? 50,
      smoothScroll: config.smoothScroll ?? true,
      debug: config.debug ?? false
    };
    this.logger = new Logger(this.config.debug, '[ScrollManager]');
  }
  
  /**
   * Initialize scroll manager with container
   */
  init(container: HTMLElement): void {
    this.container = container;
    this.attachListeners();
    this.logger.debug('Initialized with container', { 
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight 
    });
  }
  
  /**
   * Clean up listeners and resources
   */
  destroy(): void {
    if (this.container) {
      this.container.removeEventListener('scroll', this.handleScroll);
      this.container.removeEventListener('wheel', this.handleWheel);
      this.container.removeEventListener('touchstart', this.handleTouchStart);
    }
    if (this.newContentIndicator) {
      this.newContentIndicator.remove();
      this.newContentIndicator = null;
    }
    if (this.scrollEndTimer) {
      clearTimeout(this.scrollEndTimer);
    }
  }
  
  /**
   * Check if user is at the bottom of the scroll container
   */
  isAtBottom(): boolean {
    if (!this.container) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = this.container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    this.logger.debug('Scroll position check', {
      scrollTop,
      scrollHeight,
      clientHeight,
      distanceFromBottom,
      threshold: this.config.threshold
    });
    
    return distanceFromBottom <= this.config.threshold;
  }
  
  /**
   * Check if user is actively scrolling
   */
  isScrolling(): boolean {
    return this.isUserScrolling;
  }
  
  /**
   * Scroll to bottom if appropriate
   * @param force - Force scroll even if user is reading
   */
  scrollToBottom(force = false): void {
    if (!this.container) return;
    
    const shouldScroll = force || this.isAtBottom() || !this.isUserScrolling;
    
    this.logger.debug('Scroll to bottom request', {
      force,
      shouldScroll,
      isUserScrolling: this.isUserScrolling,
      isAtBottom: this.isAtBottom()
    });
    
    if (shouldScroll) {
      this.hideNewContentIndicator();
      
      if (this.config.smoothScroll && !force) {
        this.container.scrollTo({
          top: this.container.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        this.container.scrollTop = this.container.scrollHeight;
      }
    } else {
      // User is reading - show new content indicator
      this.showNewContentIndicator();
    }
  }
  
  /**
   * Handle new content during streaming
   */
  handleStreamingUpdate(): void {
    // Only auto-scroll if user was already at bottom
    this.scrollToBottom(false);
  }
  
  /**
   * Attach scroll event listeners
   */
  private attachListeners(): void {
    if (!this.container) return;
    
    // Detect scroll events
    this.container.addEventListener('scroll', this.handleScroll);
    
    // Detect user-initiated scrolls
    this.container.addEventListener('wheel', this.handleWheel);
    this.container.addEventListener('touchstart', this.handleTouchStart);
  }
  
  /**
   * Handle scroll events
   */
  private handleScroll = (event: Event): void => {
    if (!this.container) return;
    
    const currentScrollTop = this.container.scrollTop;
    
    // Detect scroll direction
    const scrollingUp = currentScrollTop < this.lastScrollTop;
    
    // Update scroll state
    if (scrollingUp && !this.isAtBottom()) {
      this.isUserScrolling = true;
    }
    
    this.lastScrollTop = currentScrollTop;
    
    // Clear existing timer
    if (this.scrollEndTimer) {
      clearTimeout(this.scrollEndTimer);
    }
    
    // Set timer to detect when scrolling stops
    this.scrollEndTimer = window.setTimeout(() => {
      if (this.isAtBottom()) {
        this.isUserScrolling = false;
        this.hideNewContentIndicator();
      }
    }, 150);
  };
  
  /**
   * Handle wheel events (user scrolling with mouse)
   */
  private handleWheel = (event: WheelEvent): void => {
    // Scrolling up indicates user wants to read
    if (event.deltaY < 0) {
      this.isUserScrolling = true;
      this.logger.debug('User scrolling detected (wheel)');
    }
  };
  
  /**
   * Handle touch start (user scrolling on mobile)
   */
  private handleTouchStart = (): void => {
    // Any touch could be a scroll gesture
    if (!this.isAtBottom()) {
      this.isUserScrolling = true;
      this.logger.debug('User scrolling detected (touch)');
    }
  };
  
  /**
   * Show indicator that new content is available
   */
  private showNewContentIndicator(): void {
    if (!this.container || this.newContentIndicator) return;
    
    this.newContentIndicator = document.createElement('div');
    this.newContentIndicator.className = 'am-new-content-indicator';
    this.newContentIndicator.innerHTML = `
      <span>New messages below</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 11.5l-4-4h8l-4 4z"/>
      </svg>
    `;
    
    // Style the indicator
    Object.assign(this.newContentIndicator.style, {
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      zIndex: '10',
      animation: 'slideUp 0.3s ease-out'
    });
    
    // Add click handler to scroll to bottom
    this.newContentIndicator.addEventListener('click', () => {
      this.scrollToBottom(true);
      this.isUserScrolling = false;
    });
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Position relative to container
    if (this.container.style.position === '' || this.container.style.position === 'static') {
      this.container.style.position = 'relative';
    }
    
    this.container.appendChild(this.newContentIndicator);
  }
  
  /**
   * Hide the new content indicator
   */
  private hideNewContentIndicator(): void {
    if (this.newContentIndicator) {
      this.newContentIndicator.remove();
      this.newContentIndicator = null;
    }
  }
  
  /**
   * Reset scroll state (e.g., when switching conversations)
   */
  reset(): void {
    this.isUserScrolling = false;
    this.lastScrollTop = 0;
    this.hideNewContentIndicator();
    if (this.scrollEndTimer) {
      clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = null;
    }
  }
}
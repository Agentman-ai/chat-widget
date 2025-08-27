/**
 * DisclaimerComponent - Reusable AI disclaimer component for the chat widget
 * 
 * Provides a consistent way to display AI disclaimers across different views
 * with support for multiple display variants and proper accessibility.
 */

import type { ChatConfig } from '../types/types';

/**
 * Disclaimer configuration
 */
export interface DisclaimerConfig {
  enabled: boolean;
  message: string;
  linkText?: string;
  linkUrl?: string;
}

/**
 * Disclaimer display variants
 */
export type DisclaimerVariant = 'standalone' | 'inline' | 'compact';

/**
 * Disclaimer component options
 */
export interface DisclaimerOptions {
  variant?: DisclaimerVariant;
  className?: string;
  showIcon?: boolean;
  ariaLabel?: string;
  iconType?: 'info' | 'warning' | 'alert';
}

/**
 * DisclaimerComponent Class
 * 
 * A reusable component for rendering AI disclaimers with:
 * - Multiple display variants (standalone, inline, compact)
 * - Optional link support
 * - Proper HTML escaping for security
 * - Accessibility features (ARIA labels, semantic HTML)
 * - Responsive design support
 */
export class DisclaimerComponent {
  private config?: DisclaimerConfig;
  private options: DisclaimerOptions;
  private element: HTMLElement | null = null;

  constructor(config?: DisclaimerConfig, options?: DisclaimerOptions) {
    this.config = config;
    this.options = {
      variant: options?.variant || 'standalone',
      className: options?.className || '',
      showIcon: options?.showIcon !== false,
      ariaLabel: options?.ariaLabel || 'AI disclaimer',
      iconType: options?.iconType || 'info'
    };
  }

  /**
   * Check if disclaimer should be rendered
   */
  private shouldRender(): boolean {
    return !!(this.config?.enabled && this.config?.message);
  }

  /**
   * Render the disclaimer component
   */
  public render(): HTMLElement | null {
    if (!this.shouldRender() || !this.config) {
      return null;
    }

    const message = this.escapeHtml(this.config.message);
    const linkText = this.config.linkText ? this.escapeHtml(this.config.linkText) : '';
    const linkUrl = this.config.linkUrl ? this.escapeHtml(this.config.linkUrl) : '';

    // Create container element
    const container = document.createElement('div');
    
    switch (this.options.variant) {
      case 'inline':
        container.innerHTML = this.renderInline(message, linkText, linkUrl);
        this.element = container.firstElementChild as HTMLElement;
        break;
      case 'compact':
        container.innerHTML = this.renderCompact(message, linkText, linkUrl);
        this.element = container.firstElementChild as HTMLElement;
        break;
      case 'standalone':
      default:
        container.innerHTML = this.renderStandalone(message, linkText, linkUrl);
        this.element = container.firstElementChild as HTMLElement;
        break;
    }

    return this.element;
  }

  /**
   * Render standalone variant (for welcome screen)
   */
  private renderStandalone(message: string, linkText: string, linkUrl: string): string {
    const icon = this.options.showIcon ? this.getIcon() : '';
    
    return `
      <aside 
        class="am-disclaimer am-disclaimer--standalone ${this.options.className}"
        role="complementary"
        aria-label="${this.options.ariaLabel}">
        ${icon}
        <span class="am-disclaimer__text">${message}</span>
        ${this.renderLink(linkText, linkUrl)}
      </aside>
    `;
  }

  /**
   * Render inline variant (for branding section)
   */
  private renderInline(message: string, linkText: string, linkUrl: string): string {
    return `
      <span class="am-disclaimer am-disclaimer--inline ${this.options.className}">
        <span class="am-disclaimer__separator" aria-hidden="true">•</span>
        <span class="am-disclaimer__text">${message}</span>
        ${this.renderLink(linkText, linkUrl, true)}
      </span>
    `;
  }

  /**
   * Render compact variant (for mobile or limited space)
   */
  private renderCompact(message: string, linkText: string, linkUrl: string): string {
    // For compact, we might truncate the message or show only icon + link
    const truncatedMessage = message.length > 30 ? message.substring(0, 27) + '...' : message;
    
    return `
      <span 
        class="am-disclaimer am-disclaimer--compact ${this.options.className}"
        title="${message}">
        <span class="am-disclaimer__text">${truncatedMessage}</span>
        ${this.renderLink(linkText || '(?)', linkUrl, true)}
      </span>
    `;
  }

  /**
   * Render the optional link
   */
  private renderLink(text: string, url: string, inline: boolean = false): string {
    if (!text || !url) {
      return '';
    }

    const linkClass = inline ? 'am-disclaimer__link--inline' : 'am-disclaimer__link';
    
    return `
      <a 
        href="${url}" 
        class="am-disclaimer__link ${linkClass}"
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="${text} (opens in new window)">
        ${text}
        ${this.getExternalLinkIcon()}
      </a>
    `;
  }

  /**
   * Get icon SVG based on type
   */
  private getIcon(): string {
    const iconClass = `am-disclaimer__icon am-disclaimer__icon--${this.options.iconType}`;
    
    switch (this.options.iconType) {
      case 'warning':
        return this.getWarningIcon(iconClass);
      case 'alert':
        return this.getAlertIcon(iconClass);
      case 'info':
      default:
        return this.getInfoIcon(iconClass);
    }
  }

  /**
   * Get info icon SVG
   */
  private getInfoIcon(className: string): string {
    return `
      <svg 
        class="${className}" 
        width="12" 
        height="12" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
  }

  /**
   * Get external link icon SVG
   */
  private getExternalLinkIcon(): string {
    return `
      <svg 
        class="am-disclaimer__external-icon" 
        width="10" 
        height="10" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        aria-hidden="true">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get warning icon SVG
   */
  private getWarningIcon(className: string): string {
    return `
      <svg 
        class="${className}" 
        width="12" 
        height="12" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
  }

  /**
   * Get alert icon SVG
   */
  private getAlertIcon(className: string): string {
    return `
      <svg 
        class="${className}" 
        width="12" 
        height="12" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
  }

  /**
   * Update configuration
   */
  public update(config: DisclaimerConfig | undefined): void {
    this.config = config;
    
    // If mounted, re-render
    if (this.element && this.element.parentElement) {
      const parent = this.element.parentElement;
      const newElement = this.render();
      if (newElement) {
        parent.replaceChild(newElement, this.element);
        this.element = newElement;
      } else if (this.element) {
        this.element.remove();
        this.element = null;
      }
    }
  }

  /**
   * Destroy the component and clean up
   */
  public destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Static factory method for creating disclaimer from configuration
   */
  public static fromConfig(config?: ChatConfig['disclaimer'], variant?: DisclaimerVariant): DisclaimerComponent | null {
    if (!config || !config.enabled) {
      return null;
    }
    
    return new DisclaimerComponent(
      config as DisclaimerConfig,
      { variant: variant || 'standalone' }
    );
  }
}
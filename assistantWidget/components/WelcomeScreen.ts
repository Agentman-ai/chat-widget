// WelcomeScreen.ts - Welcome screen component with centered input and prompts
import type { ChatConfig, ChatTheme, ChatAssets } from '../types/types';
import * as icons from '../assets/icons';
import { InputComponent } from './InputComponent';
// DisclaimerComponent no longer needed - disclaimer is rendered directly in bottom section

/**
 * WelcomeScreen Component - Claude-style minimalist welcome interface
 * 
 * Features:
 * - Centered chat input
 * - Message prompts below input
 * - Clean, focused design without header
 * - Responsive layout
 */
export class WelcomeScreen {
  private config: ChatConfig;
  private theme: ChatTheme;
  private assets: ChatAssets;
  private element: HTMLElement | null = null;

  // Event handlers
  private boundInputKeyHandler: (e: KeyboardEvent) => void;
  private boundSendHandler: () => void;
  private boundPromptClickHandler: (prompt: string) => void;
  private boundConversationsClickHandler?: () => void;
  private boundToggleHandler?: () => void;
  private boundAttachmentClickHandler?: () => void;
  private boundFileSelectHandler?: (files: FileList) => void;
  private boundAttachmentRemoveHandler?: (fileId: string) => void;
  private boundHasConversationsHandler?: () => boolean;
  
  // Store bound handlers for proper cleanup
  private boundPromptHandlers = new Map<Element, EventListener>();
  
  // Input component
  private inputComponent: InputComponent | null = null;
  
  // Disclaimer component

  constructor(
    config: ChatConfig,
    theme: ChatTheme,
    assets: ChatAssets,
    eventHandlers: {
      onInputKey: (e: KeyboardEvent) => void;
      onSend: () => void;
      onPromptClick: (prompt: string) => void;
      onConversationsClick?: () => void;
      onToggle?: () => void;
      onAttachmentClick?: () => void;
      onFileSelect?: (files: FileList) => void;
      onAttachmentRemove?: (fileId: string) => void;
      hasConversations?: () => boolean;
    }
  ) {
    this.config = config;
    this.theme = theme;
    this.assets = assets;

    // Bind event handlers
    this.boundInputKeyHandler = eventHandlers.onInputKey;
    this.boundSendHandler = eventHandlers.onSend;
    this.boundPromptClickHandler = eventHandlers.onPromptClick;
    this.boundConversationsClickHandler = eventHandlers.onConversationsClick;
    this.boundToggleHandler = eventHandlers.onToggle;
    this.boundAttachmentClickHandler = eventHandlers.onAttachmentClick;
    this.boundFileSelectHandler = eventHandlers.onFileSelect;
    this.boundAttachmentRemoveHandler = eventHandlers.onAttachmentRemove;
    this.boundHasConversationsHandler = eventHandlers.hasConversations;
  }

  /**
   * Create and return the welcome screen DOM element
   */
  public create(): HTMLElement {
    this.element = document.createElement('div');
    this.element.className = 'am-welcome-screen';
    this.element.innerHTML = this.generateTemplate();

    this.attachEventListeners();
    this.applyTheme();
    this.createInputComponent();

    return this.element;
  }

  /**
   * Update theme colors
   */
  public updateTheme(theme: Partial<ChatTheme>): void {
    if (!this.element) return;

    Object.entries(theme).forEach(([key, value]) => {
      if (value) {
        // Inline camelToKebab conversion to ensure it's not tree-shaken
        const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
        const cssVarName = `--chat-${kebabKey}`;
        this.element!.style.setProperty(cssVarName, value);
      }
    });

    // Update input component theme
    this.inputComponent?.updateTheme(theme);
  }

  /**
   * Get the input value
   */
  public getInputValue(): string {
    return this.inputComponent?.getInputValue() || '';
  }

  /**
   * Clear the input
   */
  public clearInput(): void {
    this.inputComponent?.clearInput();
  }

  /**
   * Focus the input
   */
  public focusInput(): void {
    this.inputComponent?.focusInput();
  }

  /**
   * Get the input component instance
   */
  public getInputComponent(): InputComponent | null {
    return this.inputComponent;
  }

  /**
   * Get the root element
   */
  public getRootElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Update attachment preview
   */
  public updateAttachmentPreview(attachments: Record<string, unknown>[]): void {
    this.inputComponent?.updateAttachmentPreview(attachments as any[]);
  }

  /**
   * Clear file input
   */
  public clearFileInput(): void {
    this.inputComponent?.clearFileInput();
  }

  /**
   * Destroy the component and clean up
   */
  public destroy(): void {
    this.removeEventListeners();
    this.inputComponent?.destroy();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Generate the welcome screen HTML template
   */
  private generateTemplate(): string {
    return `
      ${this.generateMinimizeButton()}
      <div class="am-welcome-container" role="main" aria-label="Chat interface">
        ${this.generateHeader()}
        <div class="am-welcome-interaction-group">
          ${this.generateInputSection()}
          ${this.generatePrompts()}
        </div>
        ${this.generateBottomSection()}
      </div>
    `;
  }

  /**
   * Generate minimize button
   */
  private generateMinimizeButton(): string {
    // Only show minimize button if toggle handler is provided and not in inline mode
    if (!this.boundToggleHandler || this.config.variant === 'inline') return '';
    
    return `
      <button class="am-welcome-minimize" title="Close" aria-label="Close chat widget">
        ${icons.close2}
      </button>
    `;
  }

  /**
   * Generate welcome header with logo and title
   */
  private generateHeader(): string {
    const logo = icons.agentmanLogo || this.assets.logo;
    const title = this.config.title || 'AI Assistant';
    
    return `
      <div class="am-welcome-header">
        <div class="am-welcome-logo" aria-hidden="true">
          ${logo}
        </div>
        <h1 class="am-welcome-title" role="heading" aria-level="1">${this.escapeHtml(title)}</h1>
      </div>
    `;
  }

  /**
   * Generate centered input section
   */
  private generateInputSection(): string {
    const welcomeMessage = this.config.messagePrompts?.welcome_message || 'How can I help you today?';

    return `
      <div class="am-welcome-input-section">
        <div class="am-welcome-message">${this.escapeHtml(welcomeMessage)}</div>
        <div class="am-welcome-input-placeholder"></div>
      </div>
    `;
  }

  /**
   * Generate message prompts
   */
  private generatePrompts(): string {
    const messagePrompts = this.config.messagePrompts;
    
    if (!messagePrompts || !messagePrompts.show) {
      return '';
    }

    const prompts = messagePrompts.prompts || [];
    const validPrompts = prompts.filter(prompt => prompt && prompt.trim().length > 0);
    
    if (validPrompts.length === 0) {
      return '';
    }

    return `
      <div class="am-welcome-prompts">
        ${validPrompts.map((prompt) => `
          <button 
            class="am-welcome-prompt-btn" 
            data-prompt="${this.escapeHtml(prompt || '')}"
            title="${this.escapeHtml(prompt || '')}"
            aria-label="Send message: ${this.escapeHtml(prompt || '')}"
          >
            ${this.escapeHtml(prompt || '')}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate bottom section with conversations link and branding
   */
  private generateBottomSection(): string {
    // Only show conversations button if persistence is enabled, handler exists, and there are conversations
    const hasConversations = this.boundHasConversationsHandler ? this.boundHasConversationsHandler() : false;
    const showConversations = this.config.persistence?.enabled && this.boundConversationsClickHandler && hasConversations;
    
    // Build disclaimer HTML if configured
    let disclaimerHtml = '';
    if (this.config.disclaimer?.enabled && this.config.disclaimer?.message) {
      disclaimerHtml = `<div class="am-welcome-disclaimer" style="font-size: 11px; color: #9ca3af; margin-top: 4px;">`;
      disclaimerHtml += `<span>${this.escapeHtml(this.config.disclaimer.message)}</span>`;
      
      if (this.config.disclaimer.linkText && this.config.disclaimer.linkUrl) {
        disclaimerHtml += ` <a href="${this.escapeHtml(this.config.disclaimer.linkUrl)}" 
                               target="_blank" 
                               rel="noopener noreferrer"
                               style="color: #9ca3af; text-decoration: underline;">
                               ${this.escapeHtml(this.config.disclaimer.linkText)}
                            </a>`;
      }
      disclaimerHtml += '</div>';
    }
    
    return `
      <div class="am-welcome-bottom">
        ${showConversations ? `
          <button class="am-welcome-conversations-link" title="View previous conversations" aria-label="View previous conversations">
            ${icons.chatHistory}
            <span>Previous conversations</span>
          </button>
        ` : ''}
        <div class="am-welcome-branding">
          Powered by <a href="https://agentman.ai" target="_blank" rel="noopener noreferrer">Agentman.ai</a>
          ${disclaimerHtml}
        </div>
      </div>
    `;
  }
  
  /**
   * Generate branding section
   * @deprecated Use generateBottomSection instead
   */
  private generateBranding(): string {
    return this.generateBottomSection();
  }

  /**
   * Create and mount the input component
   */
  private createInputComponent(): void {
    if (!this.element) return;
    
    const placeholder = this.element.querySelector('.am-welcome-input-placeholder');
    if (!placeholder) return;
    
    // Create input component with all handlers
    this.inputComponent = new InputComponent(
      this.config,
      this.theme,
      {
        onInputKey: this.boundInputKeyHandler,
        onSend: this.boundSendHandler,
        onAttachmentClick: this.boundAttachmentClickHandler,
        onFileSelect: this.boundFileSelectHandler,
        onAttachmentRemove: this.boundAttachmentRemoveHandler
      }
    );
    
    const inputElement = this.inputComponent.create();
    placeholder.appendChild(inputElement);
  }


  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.element) return;

    // Minimize button
    const minimizeButton = this.element.querySelector('.am-welcome-minimize');
    if (minimizeButton && this.boundToggleHandler) {
      minimizeButton.addEventListener('click', this.boundToggleHandler);
    }

    // Prompt buttons - store bound handlers for proper cleanup
    const promptButtons = this.element.querySelectorAll('.am-welcome-prompt-btn');
    promptButtons.forEach(button => {
      const boundHandler = this.handlePromptClick.bind(this);
      this.boundPromptHandlers.set(button, boundHandler);
      button.addEventListener('click', boundHandler);
    });
    
    // Conversations button
    const conversationsButton = this.element.querySelector('.am-welcome-conversations-link');
    if (conversationsButton && this.boundConversationsClickHandler) {
      conversationsButton.addEventListener('click', this.boundConversationsClickHandler);
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    // Remove minimize button listener
    const minimizeButton = this.element.querySelector('.am-welcome-minimize');
    if (minimizeButton && this.boundToggleHandler) {
      minimizeButton.removeEventListener('click', this.boundToggleHandler);
    }

    // Remove prompt button listeners using stored handlers
    this.boundPromptHandlers.forEach((handler, button) => {
      button.removeEventListener('click', handler);
    });
    this.boundPromptHandlers.clear();
    
    // Remove conversations button listener
    const conversationsButton = this.element.querySelector('.am-welcome-conversations-link');
    if (conversationsButton && this.boundConversationsClickHandler) {
      conversationsButton.removeEventListener('click', this.boundConversationsClickHandler);
    }
  }


  /**
   * Handle prompt button clicks
   */
  private handlePromptClick(e: Event): void {
    const button = e.target as HTMLButtonElement;
    const prompt = button.getAttribute('data-prompt');
    
    if (prompt) {
      // Clear input to prevent double processing
      this.inputComponent?.clearInput();
      
      // Trigger prompt click handler directly
      this.boundPromptClickHandler(prompt);
    }
  }


  /**
   * Apply theme to the component
   */
  private applyTheme(): void {
    if (!this.element) return;

    // Apply CSS custom properties
    Object.entries(this.theme).forEach(([key, value]) => {
      if (value) {
        // Inline camelToKebab conversion to ensure it's not tree-shaken
        const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
        const cssVarName = `--chat-${kebabKey}`;
        this.element!.style.setProperty(cssVarName, value);
      }
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
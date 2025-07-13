// WelcomeScreen.ts - Welcome screen component with centered input and prompts
import type { ChatConfig, ChatTheme, ChatAssets } from '../types/types';
import * as icons from '../assets/icons';

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

  constructor(
    config: ChatConfig,
    theme: ChatTheme,
    assets: ChatAssets,
    eventHandlers: {
      onInputKey: (e: KeyboardEvent) => void;
      onSend: () => void;
      onPromptClick: (prompt: string) => void;
    }
  ) {
    this.config = config;
    this.theme = theme;
    this.assets = assets;

    // Bind event handlers
    this.boundInputKeyHandler = eventHandlers.onInputKey;
    this.boundSendHandler = eventHandlers.onSend;
    this.boundPromptClickHandler = eventHandlers.onPromptClick;
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

    return this.element;
  }

  /**
   * Update theme colors
   */
  public updateTheme(theme: Partial<ChatTheme>): void {
    if (!this.element) return;

    Object.entries(theme).forEach(([key, value]) => {
      if (value) {
        this.element!.style.setProperty(`--chat-${key}`, value);
      }
    });

    // Update send button specifically
    const sendButton = this.element.querySelector('.am-welcome-send') as HTMLButtonElement;
    if (sendButton) {
      if (theme.buttonColor) {
        sendButton.style.backgroundColor = theme.buttonColor;
      }
      if (theme.buttonTextColor) {
        sendButton.style.color = theme.buttonTextColor;
      }
    }
  }

  /**
   * Get the input value
   */
  public getInputValue(): string {
    const input = this.element?.querySelector('.am-welcome-input') as HTMLTextAreaElement;
    return input?.value.trim() || '';
  }

  /**
   * Clear the input
   */
  public clearInput(): void {
    const input = this.element?.querySelector('.am-welcome-input') as HTMLTextAreaElement;
    if (input) {
      input.value = '';
      this.updateSendButtonState();
    }
  }

  /**
   * Focus the input
   */
  public focusInput(): void {
    const input = this.element?.querySelector('.am-welcome-input') as HTMLTextAreaElement;
    if (input) {
      input.focus();
    }
  }

  /**
   * Get the root element
   */
  public getRootElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up
   */
  public destroy(): void {
    this.removeEventListeners();
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
      <div class="am-welcome-container">
        ${this.generateHeader()}
        ${this.generateInputSection()}
        ${this.generatePrompts()}
        ${this.generateBranding()}
      </div>
    `;
  }

  /**
   * Generate welcome header with logo and title
   */
  private generateHeader(): string {
    const logo = this.assets.logo || icons.agentmanLogo;
    const title = this.config.title || 'AI Assistant';
    
    return `
      <div class="am-welcome-header">
        <div class="am-welcome-logo">
          ${logo}
        </div>
        <h1 class="am-welcome-title">${this.escapeHtml(title)}</h1>
      </div>
    `;
  }

  /**
   * Generate centered input section
   */
  private generateInputSection(): string {
    const welcomeMessage = this.config.messagePrompts?.welcome_message || 'How can I help you today?';
    const placeholder = this.config.placeholder || 'Ask me anything...';

    return `
      <div class="am-welcome-input-section">
        <div class="am-welcome-message">${this.escapeHtml(welcomeMessage)}</div>
        <div class="am-welcome-input-container">
          <textarea 
            class="am-welcome-input" 
            placeholder="${this.escapeHtml(placeholder)}"
            rows="1"
          ></textarea>
          <button 
            class="am-welcome-send" 
            style="background-color: ${this.theme.buttonColor || '#2563eb'}; color: ${this.theme.buttonTextColor || '#ffffff'};"
            disabled
          >
            ${icons.send}
          </button>
        </div>
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
          >
            ${this.escapeHtml(prompt || '')}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate branding section
   */
  private generateBranding(): string {
    return `
      <div class="am-welcome-branding">
        Powered by <a href="https://agentman.ai" target="_blank" rel="noopener noreferrer">Agentman.ai</a>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.element) return;

    // Send button
    const sendButton = this.element.querySelector('.am-welcome-send');
    if (sendButton) {
      sendButton.addEventListener('click', this.boundSendHandler);
    }

    // Input field
    const input = this.element.querySelector('.am-welcome-input') as HTMLTextAreaElement;
    if (input) {
      input.addEventListener('keydown', this.boundInputKeyHandler as EventListener);
      input.addEventListener('input', this.handleInputChange.bind(this));
    }

    // Prompt buttons
    const promptButtons = this.element.querySelectorAll('.am-welcome-prompt-btn');
    promptButtons.forEach(button => {
      button.addEventListener('click', this.handlePromptClick.bind(this));
    });
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    const sendButton = this.element.querySelector('.am-welcome-send');
    if (sendButton) {
      sendButton.removeEventListener('click', this.boundSendHandler);
    }

    const input = this.element.querySelector('.am-welcome-input');
    if (input) {
      input.removeEventListener('keydown', this.boundInputKeyHandler as EventListener);
      input.removeEventListener('input', this.handleInputChange.bind(this));
    }

    const promptButtons = this.element.querySelectorAll('.am-welcome-prompt-btn');
    promptButtons.forEach(button => {
      button.removeEventListener('click', this.handlePromptClick.bind(this));
    });
  }

  /**
   * Handle input field changes
   */
  private handleInputChange(e: Event): void {
    const input = e.target as HTMLTextAreaElement;
    
    // Auto-resize textarea
    input.style.height = 'auto';
    const newHeight = Math.max(48, Math.min(input.scrollHeight, 120));
    input.style.height = `${newHeight}px`;

    // Update send button state
    this.updateSendButtonState();
  }

  /**
   * Handle prompt button clicks
   */
  private handlePromptClick(e: Event): void {
    const button = e.target as HTMLButtonElement;
    const prompt = button.getAttribute('data-prompt');
    
    if (prompt) {
      // Clear input to prevent double processing
      const input = this.element?.querySelector('.am-welcome-input') as HTMLTextAreaElement;
      if (input) {
        input.value = '';
        this.updateSendButtonState();
      }
      
      // Trigger prompt click handler directly
      this.boundPromptClickHandler(prompt);
    }
  }

  /**
   * Update send button enabled/disabled state
   */
  private updateSendButtonState(): void {
    const input = this.element?.querySelector('.am-welcome-input') as HTMLTextAreaElement;
    const sendButton = this.element?.querySelector('.am-welcome-send') as HTMLButtonElement;
    
    if (input && sendButton) {
      const hasText = input.value.trim().length > 0;
      sendButton.disabled = !hasText;
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
        this.element!.style.setProperty(`--chat-${key}`, value);
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
// ConversationView.ts - Conversation interface with header, messages, and input
import type { ChatConfig, ChatState, ChatTheme, ChatAssets, Message } from '../types/types';
import * as icons from '../assets/icons';
import { UIUtils } from '../utils/UIUtils';
import { MessageRenderer } from '../message-renderer/message-renderer';
import { InputComponent } from './InputComponent';

/**
 * ConversationView Component - Traditional chat interface
 * 
 * Features:
 * - Header with title and controls
 * - Scrollable messages area
 * - Input area with prompts
 * - File attachments support
 */
export class ConversationView {
  private config: ChatConfig;
  private theme: ChatTheme;
  private assets: ChatAssets;
  private element: HTMLElement | null = null;

  // Event handlers
  private boundToggleHandler: () => void;
  private boundExpandHandler?: () => void;
  private boundSendHandler: () => void;
  private boundInputKeyHandler: (e: KeyboardEvent) => void;
  private boundPromptClickHandler?: (prompt: string) => void;
  private boundAttachmentClickHandler?: () => void;
  private boundFileSelectHandler?: (files: FileList) => void;
  private boundAttachmentRemoveHandler?: (fileId: string) => void;

  // Cached DOM elements
  private cachedElements = new Map<string, HTMLElement>();
  
  // Message renderer
  private messageRenderer: MessageRenderer;
  
  // Loading element
  private loadingMessageElement: HTMLElement | null = null;
  
  // Input component
  private inputComponent: InputComponent | null = null;

  constructor(
    config: ChatConfig,
    theme: ChatTheme,
    assets: ChatAssets,
    eventHandlers: {
      onToggle: () => void;
      onExpand?: () => void;
      onSend: () => void;
      onInputKey: (e: KeyboardEvent) => void;
      onPromptClick?: (prompt: string) => void;
      onAttachmentClick?: () => void;
      onFileSelect?: (files: FileList) => void;
      onAttachmentRemove?: (fileId: string) => void;
    }
  ) {
    this.config = config;
    this.theme = theme;
    this.assets = assets;
    
    // Initialize message renderer
    this.messageRenderer = new MessageRenderer();

    // Bind event handlers
    this.boundToggleHandler = eventHandlers.onToggle;
    this.boundExpandHandler = eventHandlers.onExpand;
    this.boundSendHandler = eventHandlers.onSend;
    this.boundInputKeyHandler = eventHandlers.onInputKey;
    this.boundPromptClickHandler = eventHandlers.onPromptClick;
    this.boundAttachmentClickHandler = eventHandlers.onAttachmentClick;
    this.boundFileSelectHandler = eventHandlers.onFileSelect;
    this.boundAttachmentRemoveHandler = eventHandlers.onAttachmentRemove;
  }

  /**
   * Create and return the conversation view DOM element
   */
  public create(): HTMLElement {
    this.element = document.createElement('div');
    this.element.className = 'am-conversation-view';
    
    // Apply flexbox layout to match original ChatWidget container
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.height = '100%';
    this.element.style.overflow = 'hidden';
    
    this.element.innerHTML = this.generateTemplate();

    this.attachEventListeners();
    this.applyTheme();
    this.createInputComponent();

    return this.element;
  }

  /**
   * Update UI based on state changes
   */
  public updateUI(_state: ChatState): void {
    if (!this.element) return;

    // Update any state-dependent UI elements
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

    // Update specific elements
    this.updateHeaderStyling(theme);
    this.updateInputStyling(theme);
  }

  /**
   * Get specific DOM elements with caching
   */
  public getElement(selector: string): HTMLElement | null {
    if (this.cachedElements.has(selector)) {
      const cached = this.cachedElements.get(selector)!;
      if (cached.isConnected) {
        return cached;
      }
      this.cachedElements.delete(selector);
    }
    
    const element = this.element?.querySelector(selector) as HTMLElement | null;
    if (element) {
      this.cachedElements.set(selector, element);
    }
    return element;
  }

  /**
   * Get the messages container
   */
  public getMessagesContainer(): HTMLElement | null {
    return this.getElement('.am-chat-messages');
  }

  /**
   * Get the input element
   */
  public getInputElement(): HTMLTextAreaElement | null {
    return this.element?.querySelector('.am-input-textarea') as HTMLTextAreaElement;
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
   * Hide message prompts
   */
  public hideMessagePrompts(): void {
    const promptsElement = this.getElement('.am-chat-input-prompts');
    if (promptsElement) {
      (promptsElement as HTMLElement).style.display = 'none';
    }
  }

  /**
   * Show message prompts
   */
  public showMessagePrompts(): void {
    const promptsElement = this.getElement('.am-chat-input-prompts');
    if (promptsElement) {
      (promptsElement as HTMLElement).style.display = 'flex';
    }
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
   * Get the header element for dynamic button management
   */
  public getHeaderElement(): HTMLElement | null {
    return this.getElement('.am-chat-header');
  }

  /**
   * Update header buttons dynamically based on conversation state
   */
  public updateHeaderButtons(conversationManager: any, hasConversations: boolean): void {
    const headerElement = this.getHeaderElement();
    if (!headerElement) return;

    // Clear existing dynamic buttons (keep static ones)
    this.clearDynamicButtons(headerElement);

    // Add conversation history button if we have multiple conversations
    if (hasConversations) {
      conversationManager.addConversationButton(headerElement, hasConversations);
    }

    // Always add new conversation button
    conversationManager.addNewConversationButton(headerElement);
    
    // Add divider between conversation buttons and static buttons
    conversationManager.addHeaderDivider(headerElement);
    
    // Note: Back button is only added when in conversation list view, not in chat view
  }

  /**
   * Clear dynamic buttons from header while preserving static ones
   */
  private clearDynamicButtons(headerElement: HTMLElement): void {
    const headerActions = headerElement.querySelector('.am-chat-header-actions');
    if (!headerActions) return;

    // Remove conversation management buttons (including any back buttons)
    const dynamicButtons = headerActions.querySelectorAll(
      '.am-conversation-toggle, .am-conversation-new-header, .am-header-divider'
    );
    
    // Also remove back buttons from header content area
    const headerContent = headerElement.querySelector('.am-chat-header-content');
    if (headerContent) {
      const backButtons = headerContent.querySelectorAll('.am-conversation-back');
      backButtons.forEach(btn => btn.remove());
    }
    
    dynamicButtons.forEach(button => button.remove());
  }

  /**
   * Add a message to the conversation view
   */
  public addMessage(message: Message): void {
    const messagesContainer = this.getMessagesContainer();
    if (!messagesContainer) {
      return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = `am-message ${message.sender}`;
    
    const renderedContent = this.messageRenderer.render(message);
    const attachmentsHtml = this.renderMessageAttachments(message);
    
    // Claude-style layout: role labels and no bubbles, both left-aligned
    if (message.sender === 'user') {
      messageElement.innerHTML = `
        <div class="am-message-role">You</div>
        <div class="am-message-content">
          ${renderedContent}
          ${attachmentsHtml}
        </div>
      `;
    } else {
      messageElement.innerHTML = `
        <div class="am-message-role">Assistant</div>
        <div class="am-message-content">
          ${renderedContent}
          ${attachmentsHtml}
        </div>
      `;
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Render message attachments HTML
   */
  private renderMessageAttachments(message: Message): string {
    if (!message.attachments || message.attachments.length === 0) {
      return '';
    }

    const attachmentsHtml = message.attachments.map(attachment => {
      const isImage = attachment.file_type === 'image' && attachment.url;
      const iconType = UIUtils.getAttachmentIcon(attachment.file_type);
      const escapedFilename = UIUtils.escapeHtml(attachment.filename);
      const formattedSize = UIUtils.formatFileSize(attachment.size_bytes);
      
      if (isImage) {
        return `
          <div class="chat-message-attachment">
            <img src="${attachment.url}" 
                 alt="${escapedFilename}" 
                 class="message-attachment-image"
                 onclick="window.open('${attachment.url}', '_blank')"
                 loading="lazy">
          </div>
        `;
      } else {
        return `
          <a href="${attachment.url || '#'}" 
             class="chat-message-attachment" 
             target="_blank" 
             rel="noopener noreferrer"
             ${!attachment.url ? 'onclick="return false;" style="cursor: not-allowed; opacity: 0.5;"' : ''}>
            <div class="message-attachment-icon">${iconType}</div>
            <div class="chat-attachment-info">
              <div class="chat-attachment-name">${escapedFilename}</div>
              <div class="chat-attachment-size">${formattedSize}</div>
            </div>
          </a>
        `;
      }
    }).join('');

    return `<div class="chat-message-attachments">${attachmentsHtml}</div>`;
  }

  /**
   * Show loading indicator
   */
  public showLoadingIndicator(): void {
    if (this.loadingMessageElement) {
      return;
    }

    const messagesContainer = this.getMessagesContainer();
    if (!messagesContainer) {
      return;
    }

    this.loadingMessageElement = document.createElement('div');
    this.loadingMessageElement.className = 'am-message agent am-chat-loading-message';

    this.loadingMessageElement.innerHTML = `
      <div class="am-message-role">Assistant</div>
      <div class="am-message-content">
        <div class="loading-container">
          <div class="loading-waves">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;

    messagesContainer.appendChild(this.loadingMessageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Hide loading indicator
   */
  public hideLoadingIndicator(): void {
    if (this.loadingMessageElement) {
      this.loadingMessageElement.remove();
      this.loadingMessageElement = null;
    }
  }

  /**
   * Clear all messages from the view
   */
  public clearMessages(): void {
    const messagesContainer = this.getMessagesContainer();
    if (messagesContainer) {
      // Remove all message elements
      const messages = messagesContainer.querySelectorAll('.am-message');
      messages.forEach(msg => msg.remove());
    }
  }

  /**
   * Destroy the component and clean up
   */
  public destroy(): void {
    this.removeEventListeners();
    this.cachedElements.clear();
    this.inputComponent?.destroy();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Generate the conversation view HTML template
   */
  private generateTemplate(): string {
    return `
      ${this.generateHeader()}
      ${this.generateMessagesArea()}
      ${this.generateInputArea()}
      ${this.generateBranding()}
    `;
  }

  /**
   * Generate header HTML - basic structure with dynamic button management
   */
  private generateHeader(): string {
    // Only show expand/minimize buttons for corner variant
    const showWindowControls = this.config.variant === 'corner';
    
    return `
      <div class="am-chat-header" style="background-color: white; 
                                         color: #333;
                                         display: flex;
                                         align-items: center;
                                         justify-content: space-between;
                                         padding: 12px 16px;
                                         border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                                         height: 54px;
                                         flex: 0 0 auto;
                                         box-sizing: border-box;">
        <div class="am-chat-header-content" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div class="am-chat-logo-title">
            <span>${this.config.title || 'AI Assistant'}</span>
          </div>
          <div class="am-chat-header-actions">
            <!-- Dynamic buttons will be inserted here -->
            
            ${showWindowControls ? `
              <!-- Expand button (static) -->
              <button class="am-chat-expand am-chat-header-button desktop-only" 
                      title="Expand chat"
                      style="background: none;
                             border: none;
                             padding: 6px;
                             cursor: pointer;
                             display: flex;
                             align-items: center;
                             justify-content: center;
                             transition: background-color 0.2s;
                             border-radius: 4px;
                             color: #6b7280;">
                ${icons.expand2}
              </button>
              
              <!-- Minimize button (static) -->
              <button class="am-chat-minimize am-chat-header-button" 
                      title="Minimize chat"
                      style="background: none;
                             border: none;
                             padding: 6px;
                             cursor: pointer;
                             display: flex;
                             align-items: center;
                             justify-content: center;
                             transition: background-color 0.2s;
                             border-radius: 4px;
                             color: #6b7280;">
                ${icons.minimize}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate messages area HTML
   */
  private generateMessagesArea(): string {
    return `
      <div class="am-chat-messages" 
           style="flex: 1 1 auto;
                  overflow-y: auto;
                  overflow-x: hidden;
                  padding: 1rem;
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                  min-height: 0;
                  position: relative;">
      </div>
    `;
  }

  /**
   * Generate input area HTML - using shared InputComponent
   */
  private generateInputArea(): string {
    return `
      <div class="am-chat-input-wrapper">
        <div class="am-chat-input-placeholder"></div>
      </div>
    `;
  }

  /**
   * Generate message prompts HTML
   */
  private generateMessagePrompts(): string {
    // Message prompts are now shown in the welcome screen only
    // Do not show them in the conversation view
    return '';
  }

  /**
   * Generate attachment button and file input
   */
  private generateAttachmentButton(): string {
    // Attachment button is now integrated into the input area
    return '';
  }

  /**
   * Generate attachment preview container
   */
  private generateAttachmentPreview(): string {
    return `
      <div class="chat-attachments-preview" style="display: none;"></div>
    `;
  }

  /**
   * Generate branding HTML - matches original ChatWidget exactly
   */
  private generateBranding(): string {
    return `
      <div class="am-chat-branding" style="text-align: left;
                                           font-size: 10px;
                                           padding: 4px 16px;
                                           color: #334155;
                                           background: white;
                                           flex: 0 0 auto;">
        Powered by <a href="https://agentman.ai" target="_blank" style="color: var(--chat-text-color, #334155); text-decoration: underline;">Agentman</a>
      </div>
    `;
  }

  /**
   * Attach event listeners - matches original ChatWidget exactly
   */
  private attachEventListeners(): void {
    if (!this.element) return;

    // Header minimize button
    const minimize = this.element.querySelector('.am-chat-minimize');
    if (minimize) {
      minimize.addEventListener('click', this.boundToggleHandler);
    }

    // Note: New conversation button is now dynamically managed by ConversationManager
    // No hardcoded event listener needed here

    // Expand button
    const expand = this.element.querySelector('.am-chat-expand');
    if (expand && this.boundExpandHandler) {
      expand.addEventListener('click', this.boundExpandHandler);
    }

  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    // Event listeners will be automatically removed when element is destroyed
    // Individual cleanup not needed due to DOM removal
  }


  /**
   * Handle prompt button clicks
   */
  private handlePromptClick(e: Event): void {
    const button = e.target as HTMLButtonElement;
    const prompt = button.getAttribute('data-prompt');
    
    if (prompt && this.boundPromptClickHandler) {
      this.boundPromptClickHandler(prompt);
    }
  }



  /**
   * Update header styling
   */
  private updateHeaderStyling(_theme: Partial<ChatTheme>): void {
    // Header maintains white background as per design
  }

  /**
   * Update input area styling
   */
  private updateInputStyling(theme: Partial<ChatTheme>): void {
    const sendButton = this.getElement('.am-chat-send') as HTMLButtonElement;
    if (!sendButton) return;

    // CSS variables handle the color updates now
    // No need for direct style assignments
    
    // Update input component theme
    this.inputComponent?.updateTheme(theme);
  }

  /**
   * Create and mount the input component
   */
  private createInputComponent(): void {
    if (!this.element) return;
    
    const placeholder = this.element.querySelector('.am-chat-input-placeholder');
    if (!placeholder) return;
    
    // Create input component with conversation-specific handlers
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
   * Apply theme to the component
   */
  private applyTheme(): void {
    if (!this.element) return;

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
   * Get appropriate icon for file type
   */
  private getFileTypeIcon(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop() || '';
    
    // Simple file type icons (would import from attachments module in real implementation)
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return '🖼️';
    } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
      return '🎵';
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) {
      return '🎬';
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return '📄';
    } else {
      return '📎';
    }
  }


}
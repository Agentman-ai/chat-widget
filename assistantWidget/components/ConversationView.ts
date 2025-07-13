// ConversationView.ts - Conversation interface with header, messages, and input
import type { ChatConfig, ChatState, ChatTheme, ChatAssets, Message } from '../types/types';
import * as icons from '../assets/icons';
import { UIUtils } from '../utils/UIUtils';
import { MessageRenderer } from '../message-renderer/message-renderer';

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
        this.element!.style.setProperty(`--chat-${key}`, value);
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
    return this.getElement('.am-chat-input') as HTMLTextAreaElement;
  }

  /**
   * Get the input value
   */
  public getInputValue(): string {
    const input = this.getInputElement();
    return input?.value.trim() || '';
  }

  /**
   * Clear the input
   */
  public clearInput(): void {
    const input = this.getInputElement();
    if (input) {
      input.value = '';
      input.style.height = 'auto';
      // Input updated
    }
  }

  /**
   * Focus the input
   */
  public focusInput(): void {
    const input = this.getInputElement();
    if (input) {
      input.focus();
    }
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
    if (!this.config.enableAttachments || !this.element) return;

    const previewContainer = this.getElement('.chat-attachments-preview') as HTMLElement;
    const inputWrapper = this.getElement('.am-chat-input-wrapper') as HTMLElement;
    if (!previewContainer) return;

    if (attachments.length === 0) {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
      if (inputWrapper) {
        inputWrapper.classList.remove('has-attachments');
      }
      return;
    }

    previewContainer.style.display = 'flex';
    if (inputWrapper) {
      inputWrapper.classList.add('has-attachments');
    }
    
    previewContainer.innerHTML = attachments.map(attachment => {
      const statusClass = (attachment.upload_status as string) === 'error' ? 'error' : '';
      const progressHtml = (attachment.upload_status as string) === 'uploading' ? 
        `<div class="chat-attachment-progress"><div class="chat-attachment-progress-bar" style="width: ${(attachment.upload_progress as number) || 0}%"></div></div>` : '';
      
      const isImage = (attachment.file_type as string) === 'image' && attachment.url;
      const filename = (attachment.filename as string) || 'unknown';
      const thumbnailHtml = isImage ? 
        `<img src="${attachment.url as string}" alt="${UIUtils.escapeHtml(filename)}" class="chat-attachment-thumbnail" />` :
        `<div class="chat-attachment-icon">${this.getFileTypeIcon(filename)}</div>`;
      
      return `
        <div class="chat-attachment-item ${statusClass}">
          ${thumbnailHtml}
          <div class="chat-attachment-info">
            <div class="chat-attachment-name">${UIUtils.escapeHtml(filename)}</div>
          </div>
          <button class="chat-attachment-remove" data-id="${attachment.file_id as string}" title="Remove attachment">×</button>
          ${progressHtml}
        </div>
      `;
    }).join('');

    // Attach remove button listeners
    const removeButtons = previewContainer.querySelectorAll('.chat-attachment-remove');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const fileId = (e.target as HTMLElement).getAttribute('data-id');
        if (fileId && this.boundAttachmentRemoveHandler) {
          this.boundAttachmentRemoveHandler(fileId);
        }
      });
    });
  }

  /**
   * Clear file input
   */
  public clearFileInput(): void {
    const fileInput = this.getElement('.chat-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Get the root element
   */
  public getRootElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Add a message to the conversation view
   */
  public addMessage(message: Message): void {
    const messagesContainer = this.getMessagesContainer();
    if (!messagesContainer) {
      console.error('Messages container not found');
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
   * Generate header HTML - matches original ChatWidget exactly
   */
  private generateHeader(): string {
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
            <!-- New conversation button -->
            <button class="am-conversation-new-header am-chat-header-button am-header-button-with-text" 
                    title="New conversation"
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
              ${icons.plus2}
              <span class="am-button-label" style="margin-left: 4px; font-size: 14px;">New</span>
            </button>
            
            <!-- Divider -->
            <div class="am-header-divider" style="width: 1px;
                                                   height: 20px;
                                                   background: rgba(0, 0, 0, 0.1);
                                                   margin: 0 4px;"></div>
            
            <!-- Expand button -->
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
            
            <!-- Minimize button -->
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
           style="background-color: ${this.theme.backgroundColor}; 
                  color: ${this.theme.textColor};
                  flex: 1 1 auto;
                  overflow-y: auto;
                  overflow-x: hidden;
                  padding: 1rem;
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                  min-height: 0;">
      </div>
    `;
  }

  /**
   * Generate input area HTML - matches original ChatWidget exactly
   */
  private generateInputArea(): string {
    return `
      <div class="am-chat-input-container" style="display: flex;
                                                   align-items: center;
                                                   padding: 8px 16px;
                                                   gap: 8px;
                                                   flex: 0 0 auto;
                                                   border-top: 1px solid rgba(0, 0, 0, 0.1);
                                                   background: white;">
        <textarea class="am-chat-input" 
                  placeholder="${this.config.placeholder || 'Type your message...'}"
                  style="flex: 1;
                         min-height: 44px;
                         max-height: 120px;
                         padding: 10px 12px 6px 12px;
                         border: 1px solid rgba(0, 0, 0, 0.1);
                         border-radius: 8px;
                         font-size: 14px;
                         line-height: 20px;
                         resize: none;
                         font-family: inherit;"></textarea>
        <button class="am-chat-send" 
                style="background-color: ${this.theme.buttonColor}; 
                       color: ${this.theme.buttonTextColor};
                       margin-left: 8px;
                       width: 32px;
                       height: 32px;
                       padding: 6px;
                       border: none;
                       border-radius: 4px;
                       cursor: pointer;
                       display: flex;
                       align-items: center;
                       justify-content: center;">
          ${icons.send}
        </button>
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
    return `
      <button class="chat-attachment-button" type="button" title="Attach files">
        ${icons.attachment}
      </button>
      <input type="file" class="chat-file-input" multiple>
    `;
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
        Powered by <a href="https://agentman.ai" target="_blank" style="color: #334155; text-decoration: underline;">Agentman</a>
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

    // New conversation button (takes back to welcome screen)
    const newConvButton = this.element.querySelector('.am-conversation-new-header');
    if (newConvButton) {
      newConvButton.addEventListener('click', () => {
        // This should trigger a transition back to welcome screen
        // We'll need to emit an event that ChatWidget can handle
        window.dispatchEvent(new CustomEvent('chatwidget:newconversation', {
          detail: { source: 'conversation-view' }
        }));
      });
    }

    // Expand button
    const expand = this.element.querySelector('.am-chat-expand');
    if (expand && this.boundExpandHandler) {
      expand.addEventListener('click', this.boundExpandHandler);
    }

    // Send button
    const send = this.element.querySelector('.am-chat-send');
    if (send) {
      send.addEventListener('click', this.boundSendHandler);
    }

    // Input field
    const input = this.element.querySelector('.am-chat-input') as HTMLTextAreaElement;
    if (input) {
      input.addEventListener('keydown', this.boundInputKeyHandler);
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
   * Handle input field changes
   */
  private handleInputChange(e: Event): void {
    const input = e.target as HTMLTextAreaElement;
    
    // Auto-resize textarea
    input.style.height = 'auto';
    const newHeight = Math.max(32, Math.min(input.scrollHeight, 120));
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
    
    if (prompt && this.boundPromptClickHandler) {
      this.boundPromptClickHandler(prompt);
    }
  }

  /**
   * Attach attachment-related event listeners
   */
  private attachAttachmentListeners(): void {
    const attachButton = this.element?.querySelector('.chat-attachment-button');
    if (attachButton && this.boundAttachmentClickHandler) {
      attachButton.addEventListener('click', this.boundAttachmentClickHandler);
    }

    const fileInput = this.element?.querySelector('.chat-file-input') as HTMLInputElement;
    if (fileInput && this.boundFileSelectHandler) {
      fileInput.addEventListener('change', (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && this.boundFileSelectHandler) {
          this.boundFileSelectHandler(files);
        }
      });
    }
  }

  /**
   * Update send button enabled/disabled state
   */
  private updateSendButtonState(): void {
    // Original ChatWidget doesn't disable send button
    // Keep this method for compatibility but don't disable button
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

    if (theme.buttonColor) {
      sendButton.style.backgroundColor = theme.buttonColor;
    }
    if (theme.buttonTextColor) {
      sendButton.style.color = theme.buttonTextColor;
    }
  }

  /**
   * Apply theme to the component
   */
  private applyTheme(): void {
    if (!this.element) return;

    Object.entries(this.theme).forEach(([key, value]) => {
      if (value) {
        this.element!.style.setProperty(`--chat-${key}`, value);
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
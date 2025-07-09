// UIManager.ts - Handles DOM creation, manipulation, and UI updates
import type { ChatConfig, ChatState, ChatTheme, ChatAssets } from '../types/types';
import { debounce } from '../utils/debounce';
import * as icons from '../assets/icons';

/**
 * UIManager - Responsible for all DOM-related operations
 * 
 * This component handles:
 * - DOM element creation and structure
 * - Event listener attachment and management
 * - UI state updates and transitions
 * - Responsive behavior and layout
 * - Element querying and manipulation
 */
export class UIManager {
  private config: ChatConfig;
  private theme: ChatTheme;
  private assets: ChatAssets;
  private containerId: string;
  private element: HTMLElement | null = null;

  // Event handlers (bound methods to preserve context)
  private boundToggleHandler: () => void;
  private boundSendHandler: () => void;
  private boundInputKeyHandler: (e: KeyboardEvent) => void;
  private boundResizeHandler: () => void;
  private boundExpandHandler?: () => void;
  private boundPromptClickHandler?: (prompt: string) => void;
  private boundAttachmentClickHandler?: () => void;
  private boundFileSelectHandler?: (files: FileList) => void;
  private boundAttachmentRemoveHandler?: (fileId: string) => void;

  // Resize debouncing
  private resizeTimeout: number | null = null;
  
  // Cached DOM elements for performance
  private cachedElements = new Map<string, HTMLElement>();
  
  // Event listener cleanup tracking
  private eventListeners = new Map<HTMLElement, Array<{event: string, handler: EventListener}> >();
  
  // Debounced methods
  private debouncedUpdateSendButton: () => void;

  constructor(
    config: ChatConfig,
    theme: ChatTheme,
    assets: ChatAssets,
    containerId: string,
    eventHandlers: {
      onToggle: () => void;
      onSend: () => void;
      onInputKey: (e: KeyboardEvent) => void;
      onResize: () => void;
      onExpand?: () => void;
      onPromptClick?: (prompt: string) => void;
      onAttachmentClick?: () => void;
      onFileSelect?: (files: FileList) => void;
      onAttachmentRemove?: (fileId: string) => void;
    }
  ) {
    this.config = config;
    this.theme = theme;
    this.assets = assets;
    this.containerId = containerId;

    // Bind event handlers to preserve context
    this.boundToggleHandler = eventHandlers.onToggle;
    this.boundSendHandler = eventHandlers.onSend;
    this.boundInputKeyHandler = eventHandlers.onInputKey;
    this.boundResizeHandler = this.debounceResize(eventHandlers.onResize);
    this.boundExpandHandler = eventHandlers.onExpand;
    this.boundPromptClickHandler = eventHandlers.onPromptClick;
    this.boundAttachmentClickHandler = eventHandlers.onAttachmentClick;
    this.boundFileSelectHandler = eventHandlers.onFileSelect;
    this.boundAttachmentRemoveHandler = eventHandlers.onAttachmentRemove;
    
    // Initialize debounced methods
    this.debouncedUpdateSendButton = debounce(this.updateSendButtonState.bind(this), 100);
  }

  /**
   * Create and mount the widget DOM structure
   */
  public createAndMount(): HTMLElement {
    // Remove any existing widget for this container
    this.removeExistingWidget();

    // Create root element
    this.element = document.createElement('div');
    this.element.className = `am-chat-widget am-chat-widget--${this.config.variant}`;
    this.element.setAttribute('data-container', this.containerId);

    // Generate the HTML structure
    this.element.innerHTML = this.generateTemplate();

    // Apply initial styling
    this.applyInitialStyling();

    // Mount to appropriate container
    this.mountToContainer();

    // Attach event listeners
    this.attachEventListeners();

    // Setup responsive behavior
    this.setupResponsiveBehavior();

    return this.element;
  }

  /**
   * Update UI based on state changes
   */
  public updateUI(state: ChatState): void {
    if (!this.element) return;

    const container = this.element.querySelector('.am-chat-container') as HTMLDivElement;
    const toggle = this.element.querySelector('.am-chat-toggle') as HTMLButtonElement;

    if (this.config.variant === 'corner') {
      // Handle corner variant show/hide logic
      if (container) {
        container.style.display = state.isOpen ? 'flex' : 'none';
      }
      if (toggle) {
        toggle.style.display = state.isOpen ? 'none' : 'flex';
      }

      // Update responsive layout for corner variant
      this.updateResponsiveLayout();
    } else {
      // For centered and inline variants, always show container
      if (container) {
        container.style.display = 'flex';
      }
      if (toggle) {
        toggle.style.display = 'none';
      }
    }

    // Update send button state based on input content
    this.updateSendButtonState();
  }

  /**
   * Update theme colors in real-time
   */
  public updateTheme(theme: Partial<ChatTheme>): void {
    if (!this.element) return;

    // Update CSS custom properties
    Object.entries(theme).forEach(([key, value]) => {
      if (value) {
        this.element!.style.setProperty(`--chat-${key}`, value);
      }
    });

    // Update specific elements that need direct styling
    this.updateToggleButtonStyling(theme);
    this.updateHeaderStyling(theme);
    this.updateInputStyling(theme);
  }

  /**
   * Get specific DOM elements with caching
   */
  public getElement(selector: string): HTMLElement | null {
    if (this.cachedElements.has(selector)) {
      const cached = this.cachedElements.get(selector)!;
      // Verify element is still in DOM
      if (cached.isConnected) {
        return cached;
      }
      // Remove stale cache entry
      this.cachedElements.delete(selector);
    }
    
    const element = this.element?.querySelector(selector) as HTMLElement | null;
    if (element) {
      this.cachedElements.set(selector, element);
    }
    return element;
  }

  /**
   * Get the root widget element
   */
  public getRootElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Clean up and remove the widget
   */
  public destroy(): void {
    // Remove event listeners
    this.removeEventListeners();
    
    // Clean up all tracked event listeners
    this.cleanupAllEventListeners();

    // Clear timeouts
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }

    // Remove DOM element
    this.removeExistingWidget();

    // Clear caches and references
    this.cachedElements.clear();
    this.eventListeners.clear();
    this.element = null;
  }

  /**
   * Generate the complete widget HTML template
   */
  private generateTemplate(): string {
    const showToggle = this.config.variant === 'corner';
    
    return `
      ${showToggle ? this.generateToggleButton() : ''}
      ${this.generateMainContainer()}
    `;
  }

  /**
   * Generate toggle button HTML (for corner variant)
   */
  private generateToggleButton(): string {
    return `
      <button class="am-chat-toggle" 
              style="background-color: ${this.theme.toggleBackgroundColor} !important;">
        <div class="am-chat-toggle-content">
          <div class="am-chat-logo" style="color: ${this.theme.toggleIconColor} !important;">
            ${this.assets.logo || icons.agentmanLogo}
          </div>
          <span class="am-chat-toggle-text" 
                style="color: ${this.theme.toggleTextColor} !important;">
            ${this.config.toggleText || 'Ask AI'}
          </span>
        </div>
      </button>
    `;
  }

  /**
   * Generate main chat container HTML
   */
  private generateMainContainer(): string {
    return `
      <div class="am-chat-container">
        ${this.generateHeader()}
        ${this.generateMessagesArea()}
        ${this.generateInputArea()}
        ${this.generateBranding()}
      </div>
    `;
  }

  /**
   * Generate header HTML
   */
  private generateHeader(): string {
    return `
      <div class="am-chat-header">
        <div class="am-chat-header-content">
          <div class="am-chat-logo-title">
            <span>Ask AI</span>
          </div>
          <div class="am-chat-header-actions">
            <button class="am-chat-expand am-chat-header-button desktop-only" 
                    title="Expand">
              ${icons.expand2}
            </button>
            <button class="am-chat-minimize am-chat-header-button" 
                    title="Close">
              ${icons.close2}
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
                  color: ${this.theme.textColor};">
      </div>
    `;
  }

  /**
   * Generate message prompts HTML (compact buttons above input)
   */
  private generateMessagePrompts(): string {
    const messagePrompts = this.config.messagePrompts;
    
    if (!messagePrompts || !messagePrompts.show) {
      return '';
    }

    const prompts = messagePrompts.prompts || [];
    
    // Filter out empty prompts
    const validPrompts = prompts.filter(prompt => prompt && prompt.trim().length > 0);
    
    if (validPrompts.length === 0) {
      return '';
    }

    return `
      <div class="am-chat-input-prompts">
        ${validPrompts.map((prompt) => `
          <button class="am-chat-input-prompt-btn" 
                  data-prompt="${this.escapeHtml(prompt || '')}"
                  title="${this.escapeHtml(prompt || '')}">
            ${this.escapeHtml(prompt || '')}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate input area HTML
   */
  private generateInputArea(): string {
    const showAttachments = this.config.enableAttachments;
    
    return `
      ${this.generateMessagePrompts()}
      <div class="am-chat-input-wrapper">
        ${showAttachments ? this.generateAttachmentPreview() : ''}
        <div class="am-chat-input-container">
          ${showAttachments ? this.generateAttachmentButton() : ''}
          <textarea class="am-chat-input" 
                    placeholder="${this.config.placeholder || 'Type your message...'}"
                    rows="1"></textarea>
          <button class="am-chat-send" 
                  style="background-color: ${this.theme.buttonColor}; 
                         color: ${this.theme.buttonTextColor};"
                  disabled>
            ${icons.send}
          </button>
        </div>
      </div>
    `;
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
   * Generate branding HTML
   */
  private generateBranding(): string {
    const brandingText = this.config.hideBranding 
      ? `<span style="color: #10b981;">ChatAgent</span>`
      : `<a href="https://agentman.ai" target="_blank" rel="noopener noreferrer">Agentman.ai</a>`;
    
    return `
      <div class="am-chat-branding">
        Powered by Agentman.ai
      </div>
    `;
  }

  /**
   * Apply initial styling to the widget
   */
  private applyInitialStyling(): void {
    if (!this.element) return;

    // Apply initial dimensions if specified
    if (this.config.initialHeight || this.config.initialWidth) {
      const container = this.element.querySelector('.am-chat-container') as HTMLElement;
      if (container) {
        if (this.config.initialHeight) {
          container.style.height = this.config.initialHeight;
        }
        if (this.config.initialWidth) {
          container.style.width = this.config.initialWidth;
        }
      }
    }

    // Apply theme colors as CSS custom properties
    this.updateTheme(this.theme);
  }

  /**
   * Mount the widget to the appropriate container
   */
  private mountToContainer(): void {
    if (!this.element) return;

    if (this.config.variant === 'inline') {
      const container = document.getElementById(this.containerId);
      if (!container) {
        console.error(`Container with id "${this.containerId}" not found`);
        return;
      }
      container.innerHTML = '';
      container.appendChild(this.element);
    } else {
      document.body.appendChild(this.element);
    }
  }

  /**
   * Attach all event listeners
   */
  private attachEventListeners(): void {
    if (!this.element) return;

    // Toggle button (corner variant)
    const toggle = this.element.querySelector('.am-chat-toggle');
    if (toggle) {
      toggle.addEventListener('click', this.boundToggleHandler);
    }

    // Minimize button
    const minimize = this.element.querySelector('.am-chat-minimize');
    if (minimize) {
      minimize.addEventListener('click', this.boundToggleHandler);
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
      input.addEventListener('keydown', this.boundInputKeyHandler as EventListener);
      input.addEventListener('input', this.handleInputChange.bind(this));
    }

    // Prompt buttons
    const promptButtons = this.element.querySelectorAll('.am-chat-input-prompt-btn');
    promptButtons.forEach(button => {
      button.addEventListener('click', this.handlePromptClick.bind(this));
    });

    // Attachment functionality (if enabled)
    if (this.config.enableAttachments) {
      this.attachAttachmentListeners();
    }

    // Window resize
    window.addEventListener('resize', this.boundResizeHandler);
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    const toggle = this.element.querySelector('.am-chat-toggle');
    if (toggle) {
      toggle.removeEventListener('click', this.boundToggleHandler);
    }

    const minimize = this.element.querySelector('.am-chat-minimize');
    if (minimize) {
      minimize.removeEventListener('click', this.boundToggleHandler);
    }

    const expand = this.element.querySelector('.am-chat-expand');
    if (expand && this.boundExpandHandler) {
      expand.removeEventListener('click', this.boundExpandHandler);
    }

    const send = this.element.querySelector('.am-chat-send');
    if (send) {
      send.removeEventListener('click', this.boundSendHandler);
    }

    const input = this.element.querySelector('.am-chat-input');
    if (input) {
      input.removeEventListener('keydown', this.boundInputKeyHandler as EventListener);
      input.removeEventListener('input', this.handleInputChange.bind(this));
    }

    // Prompt buttons
    const promptButtons = this.element.querySelectorAll('.am-chat-input-prompt-btn');
    promptButtons.forEach(button => {
      button.removeEventListener('click', this.handlePromptClick.bind(this));
    });

    window.removeEventListener('resize', this.boundResizeHandler);
  }

  /**
   * Handle input field changes (auto-resize, button state)
   */
  private handleInputChange(e: Event): void {
    const input = e.target as HTMLTextAreaElement;
    
    // Auto-resize textarea
    input.style.height = 'auto';
    const newHeight = Math.max(32, Math.min(input.scrollHeight, 120));
    input.style.height = `${newHeight}px`;

    // Update send button state (debounced)
    this.debouncedUpdateSendButton();
  }

  /**
   * Update send button enabled/disabled state
   */
  private updateSendButtonState(): void {
    const input = this.element?.querySelector('.am-chat-input') as HTMLTextAreaElement;
    const sendButton = this.element?.querySelector('.am-chat-send') as HTMLButtonElement;
    
    if (input && sendButton) {
      const hasText = input.value.trim().length > 0;
      
      // Check if there are pending attachments
      const attachmentPreview = this.element?.querySelector('.chat-attachments-preview') as HTMLElement;
      const hasAttachments = attachmentPreview && 
                            attachmentPreview.style.display !== 'none' && 
                            attachmentPreview.children.length > 0;
      
      // Enable send button if there's text OR attachments
      sendButton.disabled = !(hasText || hasAttachments);
    }
  }

  /**
   * Setup responsive behavior
   */
  private setupResponsiveBehavior(): void {
    this.updateResponsiveLayout();
  }

  /**
   * Update responsive layout based on screen size
   */
  private updateResponsiveLayout(): void {
    if (this.config.variant !== 'corner' || !this.element) return;

    const container = this.element.querySelector('.am-chat-container') as HTMLElement;
    if (!container) return;

    const isMobile = window.innerWidth <= 480;

    if (isMobile) {
      // Mobile layout - full screen
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.borderRadius = '0';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.position = 'fixed';
    } else {
      // Desktop layout - floating window
      container.style.width = this.config.initialWidth || '400px';
      container.style.height = this.config.initialHeight || '600px';
      container.style.borderRadius = '12px';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.position = 'fixed';
    }
  }

  /**
   * Update toggle button styling
   */
  private updateToggleButtonStyling(theme: Partial<ChatTheme>): void {
    const toggleButton = this.element?.querySelector('.am-chat-toggle') as HTMLButtonElement;
    if (!toggleButton) return;

    if (theme.toggleBackgroundColor) {
      toggleButton.style.backgroundColor = theme.toggleBackgroundColor;
    }

    const toggleText = toggleButton.querySelector('.am-chat-toggle-text') as HTMLElement;
    if (toggleText && theme.toggleTextColor) {
      toggleText.style.color = theme.toggleTextColor;
    }

    const toggleIcon = toggleButton.querySelector('.am-chat-logo') as HTMLElement;
    if (toggleIcon && theme.toggleIconColor) {
      toggleIcon.style.color = theme.toggleIconColor;
    }
  }

  /**
   * Update header styling
   */
  private updateHeaderStyling(theme: Partial<ChatTheme>): void {
    const header = this.element?.querySelector('.am-chat-header') as HTMLElement;
    if (!header) return;

    // Don't apply theme colors - let CSS handle the white background
    // The header should always be white as per the new design
  }

  /**
   * Update input area styling
   */
  private updateInputStyling(theme: Partial<ChatTheme>): void {
    const sendButton = this.element?.querySelector('.am-chat-send') as HTMLButtonElement;
    if (!sendButton) return;

    if (theme.buttonColor) {
      sendButton.style.backgroundColor = theme.buttonColor;
    }
    if (theme.buttonTextColor) {
      sendButton.style.color = theme.buttonTextColor;
    }
  }

  /**
   * Remove existing widget from DOM
   */
  private removeExistingWidget(): void {
    const existingWidget = document.querySelector(`.am-chat-widget[data-container="${this.containerId}"]`);
    if (existingWidget) {
      existingWidget.remove();
    }
  }

  /**
   * Handle prompt button clicks
   */
  private handlePromptClick(e: Event): void {
    const button = e.target as HTMLButtonElement;
    const prompt = button.getAttribute('data-prompt');
    
    if (prompt && this.boundPromptClickHandler) {
      this.boundPromptClickHandler(prompt);
      
      // Message prompts disabled - no need to hide
    }
  }

  /**
   * Hide message prompts after user interaction
   * @deprecated Message prompts in chat area disabled
   */
  public hideMessagePrompts(): void {
    // Disabled - no prompts in chat area
  }

  /**
   * Show message prompts (for reset functionality)
   * @deprecated Message prompts in chat area disabled
   */
  public showMessagePrompts(): void {
    // Disabled - no prompts in chat area
  }

  /**
   * Show floating prompt bubbles (when widget is closed)
   */
  public showFloatingPrompts(): void {
    if (this.config.variant !== 'corner') return;
    
    // Check if floating prompts already exist
    const existingPrompts = document.querySelector('.am-chat-floating-prompts-container');
    if (existingPrompts) return;

    const floatingPrompts = document.createElement('div');
    floatingPrompts.className = 'am-chat-floating-prompts-container';
    floatingPrompts.innerHTML = this.generateFloatingPrompts();
    
    // Insert before the toggle button in the DOM
    const toggleButton = this.element?.querySelector('.am-chat-toggle');
    if (toggleButton && toggleButton.parentElement) {
      toggleButton.parentElement.insertBefore(floatingPrompts, toggleButton);
      
      // Attach event listeners to floating prompts
      this.attachFloatingPromptListeners(floatingPrompts);
    }
  }

  /**
   * Hide floating prompt bubbles
   */
  public hideFloatingPrompts(): void {
    const floatingPrompts = document.querySelector('.am-chat-floating-prompts-container');
    if (floatingPrompts) {
      floatingPrompts.remove();
    }
  }

  /**
   * Generate floating prompt bubbles HTML (for when widget is closed)
   */
  private generateFloatingPrompts(): string {
    const messagePrompts = this.config.messagePrompts;
    
    if (!messagePrompts || !messagePrompts.show) {
      return '';
    }

    const welcomeMessage = messagePrompts.welcome_message || 'How can I help you today?';
    const prompts = messagePrompts.prompts || [];
    
    // Filter out empty prompts
    const validPrompts = prompts.filter(prompt => prompt && prompt.trim().length > 0);
    
    if (validPrompts.length === 0) {
      return '';
    }

    return `
      <div class="am-chat-floating-welcome-message">
        <div class="am-chat-floating-welcome-header">
          <div class="am-chat-floating-welcome-avatar">
            ${icons.chat}
          </div>
          <div class="am-chat-floating-welcome-text">${welcomeMessage}</div>
        </div>
      </div>
      <div class="am-chat-floating-message-prompts">
        ${validPrompts.map((prompt) => `
          <button class="am-chat-floating-message-prompt" 
                  data-prompt="${this.escapeHtml(prompt || '')}"
                  title="${this.escapeHtml(prompt || '')}">
            ${this.escapeHtml(prompt || '')}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Attach event listeners to floating prompt buttons
   */
  private attachFloatingPromptListeners(container: HTMLElement): void {
    const promptButtons = container.querySelectorAll('.am-chat-floating-message-prompt');
    promptButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const prompt = (e.target as HTMLElement).getAttribute('data-prompt');
        if (prompt && this.boundPromptClickHandler) {
          // Add visual feedback
          (e.target as HTMLElement).style.background = 'var(--chat-button-color, #2563eb)';
          (e.target as HTMLElement).style.color = 'var(--chat-button-text-color, #ffffff)';
          
          // Delay to show visual feedback, then trigger action
          setTimeout(() => {
            this.boundPromptClickHandler!(prompt);
            this.hideFloatingPrompts();
          }, 200);
        }
      });
    });
  }

  /**
   * Attach attachment-related event listeners
   */
  private attachAttachmentListeners(): void {
    if (!this.element) return;

    // Attachment button
    const attachButton = this.element.querySelector('.chat-attachment-button');
    if (attachButton && this.boundAttachmentClickHandler) {
      attachButton.addEventListener('click', this.boundAttachmentClickHandler);
    }

    // File input
    const fileInput = this.element.querySelector('.chat-file-input') as HTMLInputElement;
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
   * Update attachment preview
   */
  public updateAttachmentPreview(attachments: any[]): void {
    if (!this.config.enableAttachments || !this.element) return;

    const previewContainer = this.element.querySelector('.chat-attachments-preview') as HTMLElement;
    const inputWrapper = this.element.querySelector('.am-chat-input-wrapper') as HTMLElement;
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
      const statusClass = attachment.upload_status === 'error' ? 'error' : '';
      const progressHtml = attachment.upload_status === 'uploading' ? 
        `<div class="chat-attachment-progress"><div class="chat-attachment-progress-bar" style="width: ${attachment.upload_progress || 0}%"></div></div>` : '';
      
      // Determine if this is an image or file
      const isImage = attachment.file_type === 'image' && attachment.url;
      const thumbnailHtml = isImage ? 
        `<img src="${attachment.url}" alt="${this.escapeHtml(attachment.filename)}" class="chat-attachment-thumbnail" />` :
        `<div class="chat-attachment-icon">${this.getFileTypeIcon(attachment.filename)}</div>`;
      
      return `
        <div class="chat-attachment-item ${statusClass}">
          ${thumbnailHtml}
          <div class="chat-attachment-info">
            <div class="chat-attachment-name">${this.escapeHtml(attachment.filename)}</div>
          </div>
          <button class="chat-attachment-remove" data-id="${attachment.file_id}" title="Remove attachment">×</button>
          ${progressHtml}
        </div>
      `;
    }).join('');

    // Add scroll indicator if content overflows
    setTimeout(() => {
      if (previewContainer.scrollWidth > previewContainer.clientWidth) {
        previewContainer.classList.add('has-overflow');
      } else {
        previewContainer.classList.remove('has-overflow');
      }
    }, 100);

    // Attach remove button listeners with proper cleanup tracking
    const removeButtons = previewContainer.querySelectorAll('.chat-attachment-remove');
    removeButtons.forEach(button => {
      const handler = (e: Event) => {
        const fileId = (e.target as HTMLElement).getAttribute('data-id');
        if (fileId && this.boundAttachmentRemoveHandler) {
          this.boundAttachmentRemoveHandler(fileId);
        }
      };
      
      this.addTrackedEventListener(button as HTMLElement, 'click', handler);
    });
    
    // Update send button state when attachments change (debounced)
    this.debouncedUpdateSendButton();
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get appropriate icon for file type
   */
  private getFileTypeIcon(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop() || '';
    
    // Import icons from the attachments module
    const { attachmentIcons } = require('../styles/attachments');
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return attachmentIcons.image;
    } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
      return attachmentIcons.audio;
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) {
      return attachmentIcons.video;
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return attachmentIcons.document;
    } else {
      return attachmentIcons.file;
    }
  }

  /**
   * Clear file input
   */
  public clearFileInput(): void {
    const fileInput = this.element?.querySelector('.chat-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Debounce resize events for performance
   */
  private debounceResize(callback: () => void): () => void {
    return () => {
      if (this.resizeTimeout) {
        window.clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = window.setTimeout(() => {
        callback();
        this.updateResponsiveLayout();
      }, 100);
    };
  }
  
  /**
   * Add event listener with cleanup tracking
   */
  private addTrackedEventListener(element: HTMLElement, event: string, handler: EventListener): void {
    element.addEventListener(event, handler);
    
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    
    this.eventListeners.get(element)!.push({ event, handler });
  }
  
  /**
   * Remove all tracked event listeners
   */
  private cleanupAllEventListeners(): void {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }
}
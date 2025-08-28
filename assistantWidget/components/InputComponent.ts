// InputComponent.ts - Shared input component for welcome and conversation views
import type { ChatConfig, ChatTheme } from '../types/types';
import * as icons from '../assets/icons';

/**
 * InputComponent - Reusable chat input with modern design
 * 
 * Features:
 * - Auto-resizing textarea
 * - Attachment support with + button
 * - Send button with disabled state
 * - Consistent styling across views
 */
export class InputComponent {
  private config: ChatConfig;
  private theme: ChatTheme;
  private element: HTMLElement | null = null;
  
  // Event handlers
  private boundInputKeyHandler: (e: KeyboardEvent) => void;
  private boundSendHandler: () => void;
  private boundAttachmentClickHandler?: () => void;
  private boundFileSelectHandler?: (files: FileList) => void;
  private boundAttachmentRemoveHandler?: (fileId: string) => void;
  
  // State
  private attachments: any[] = [];
  private supportedMimeTypes: string[] = [];
  private supportsAttachments: boolean = true;

  constructor(
    config: ChatConfig,
    theme: ChatTheme,
    eventHandlers: {
      onInputKey: (e: KeyboardEvent) => void;
      onSend: () => void;
      onAttachmentClick?: () => void;
      onFileSelect?: (files: FileList) => void;
      onAttachmentRemove?: (fileId: string) => void;
    }
  ) {
    this.config = config;
    this.theme = theme;
    
    // Bind event handlers
    this.boundInputKeyHandler = eventHandlers.onInputKey;
    this.boundSendHandler = eventHandlers.onSend;
    this.boundAttachmentClickHandler = eventHandlers.onAttachmentClick;
    this.boundFileSelectHandler = eventHandlers.onFileSelect;
    this.boundAttachmentRemoveHandler = eventHandlers.onAttachmentRemove;
  }

  /**
   * Create and return the input component DOM element
   */
  public create(): HTMLElement {
    this.element = document.createElement('div');
    this.element.className = 'am-input-component';
    this.element.innerHTML = this.generateTemplate();
    
    this.attachEventListeners();
    this.updateSendButtonState();
    
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
  }

  /**
   * Get the input value
   */
  public getInputValue(): string {
    const input = this.element?.querySelector('.am-input-textarea') as HTMLTextAreaElement;
    return input?.value.trim() || '';
  }

  /**
   * Clear the input
   */
  public clearInput(): void {
    const input = this.element?.querySelector('.am-input-textarea') as HTMLTextAreaElement;
    if (input) {
      input.value = '';
      input.style.height = '48px';
      this.updateSendButtonState();
    }
  }

  /**
   * Focus the input
   */
  public focusInput(): void {
    const input = this.element?.querySelector('.am-input-textarea') as HTMLTextAreaElement;
    if (input) {
      input.focus();
    }
  }

  /**
   * Update attachment preview
   */
  public updateAttachmentPreview(attachments: any[]): void {
    this.attachments = attachments;
    
    if (!this.config.enableAttachments || !this.element) return;
    
    const previewContainer = this.element.querySelector('.am-input-attachments-preview') as HTMLElement;
    if (!previewContainer) return;
    
    if (attachments.length === 0) {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
      return;
    }
    
    previewContainer.style.display = 'flex';
    previewContainer.innerHTML = attachments.map(attachment => {
      const statusClass = attachment.upload_status === 'error' ? 'error' : '';
      const progressHtml = attachment.upload_status === 'uploading' ? 
        `<div class="chat-attachment-progress"><div class="chat-attachment-progress-bar" style="width: ${attachment.upload_progress || 0}%"></div></div>` : '';
      
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
          <button class="chat-attachment-remove" data-id="${attachment.id || attachment.file_id}" title="Remove attachment">×</button>
          ${progressHtml}
        </div>
      `;
    }).join('');
    
    // Attach remove button listeners
    const removeButtons = previewContainer.querySelectorAll('.chat-attachment-remove');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fileId = (e.target as HTMLElement).getAttribute('data-id');
        if (fileId && this.boundAttachmentRemoveHandler) {
          this.boundAttachmentRemoveHandler(fileId);
        }
      });
    });
    
    // Update send button state
    this.updateSendButtonState();
  }

  /**
   * Clear file input
   */
  public clearFileInput(): void {
    const fileInput = this.element?.querySelector('.am-input-file-input') as HTMLInputElement;
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
   * Generate the input component HTML template
   */
  private generateTemplate(): string {
    const placeholder = this.config.placeholder || 'Reply to Claude...';
    const showAttachments = this.config.enableAttachments;
    
    return `
      ${showAttachments ? '<div class="am-input-attachments-preview" style="display: none;"></div>' : ''}
      <div class="am-input-container">
        <div class="am-input-top-bar"></div>
        <textarea 
          class="am-input-textarea" 
          placeholder="${this.escapeHtml(placeholder)}"
          rows="1"
        ></textarea>
        <div class="am-input-bottom">
          <div class="am-input-actions-left">
            ${showAttachments ? `
              <button type="button" class="am-input-add-btn" title="Add content">
                <span>+</span>
              </button>
              <input type="file" class="am-input-file-input" multiple style="display: none;">
            ` : ''}
          </div>
          <div class="am-input-actions-right">
            <button 
              type="submit"
              class="am-input-send" 
              disabled
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="am-input-send-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.element) return;
    
    // Send button
    const sendButton = this.element.querySelector('.am-input-send');
    if (sendButton) {
      sendButton.addEventListener('click', this.boundSendHandler);
    }
    
    // Input field
    const input = this.element.querySelector('.am-input-textarea') as HTMLTextAreaElement;
    if (input) {
      input.addEventListener('keydown', this.boundInputKeyHandler);
      input.addEventListener('input', this.handleInputChange.bind(this));
    }
    
    // Attachment functionality (if enabled)
    if (this.config.enableAttachments) {
      const addButton = this.element.querySelector('.am-input-add-btn');
      const fileInput = this.element.querySelector('.am-input-file-input') as HTMLInputElement;
      
      if (addButton) {
        addButton.addEventListener('click', () => {
          // Trigger the file input when add button is clicked
          if (fileInput) {
            fileInput.click();
          }
          // Also call the attachment click handler if provided
          if (this.boundAttachmentClickHandler) {
            this.boundAttachmentClickHandler();
          }
        });
      }
      
      if (fileInput && this.boundFileSelectHandler) {
        fileInput.addEventListener('change', (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && this.boundFileSelectHandler) {
            this.boundFileSelectHandler(files);
          }
        });
      }
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    // Event listeners will be automatically removed when element is destroyed
  }

  /**
   * Handle input field changes
   */
  private handleInputChange(e: Event): void {
    const input = e.target as HTMLTextAreaElement;
    
    // Only auto-resize if there's actual content or if content has changed
    const hasContent = input.value.trim().length > 0;
    
    if (hasContent) {
      // Auto-resize textarea when there's content
      input.style.height = 'auto';
      const newHeight = Math.max(48, Math.min(input.scrollHeight, 180));
      input.style.height = `${newHeight}px`;
    } else {
      // Reset to initial height when empty
      input.style.height = '48px';
    }
    
    // Update send button state
    this.updateSendButtonState();
  }

  /**
   * Update send button enabled/disabled state
   */
  private updateSendButtonState(): void {
    const input = this.element?.querySelector('.am-input-textarea') as HTMLTextAreaElement;
    const sendButton = this.element?.querySelector('.am-input-send') as HTMLButtonElement;
    
    if (input && sendButton) {
      const hasText = input.value.trim().length > 0;
      const hasAttachments = this.attachments.length > 0;
      
      // Enable send button if there's text OR attachments
      sendButton.disabled = !(hasText || hasAttachments);
    }
  }

  /**
   * Get appropriate icon for file type
   */
  private getFileTypeIcon(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop() || '';
    
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

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Configure attachment settings based on agent capabilities
   */
  public configureAttachments(supportedMimeTypes: string[], supportsAttachments: boolean): void {
    this.supportedMimeTypes = supportedMimeTypes;
    this.supportsAttachments = supportsAttachments;
    
    // Update file input accept attribute
    const fileInput = this.element?.querySelector('.am-input-file-input') as HTMLInputElement;
    if (fileInput) {
      if (supportsAttachments && supportedMimeTypes.length > 0) {
        fileInput.accept = supportedMimeTypes.join(',');
        fileInput.disabled = false;
        
        // Add capture attribute for mobile camera access if image types are supported
        const hasImageTypes = supportedMimeTypes.some(type => type.startsWith('image/'));
        if (hasImageTypes) {
          fileInput.setAttribute('capture', 'environment');
        }
      } else {
        fileInput.disabled = true;
      }
    }
    
    // Update attachment button
    const attachmentButton = this.element?.querySelector('.am-input-add-btn') as HTMLButtonElement;
    if (attachmentButton) {
      if (supportsAttachments && supportedMimeTypes.length > 0) {
        attachmentButton.disabled = false;
        attachmentButton.style.opacity = '1';
        attachmentButton.style.cursor = 'pointer';
        
        // Update tooltip
        const supportedTypes = supportedMimeTypes
          .map(type => type.split('/')[1]?.toUpperCase())
          .filter(Boolean)
          .join(', ');
        
        const hasImageTypes = supportedMimeTypes.some(type => type.startsWith('image/'));
        const cameraText = hasImageTypes ? ' or take photo' : '';
        
        attachmentButton.title = `Attach files (${supportedTypes} supported)${cameraText}`;
      } else {
        attachmentButton.disabled = true;
        attachmentButton.style.opacity = '0.5';
        attachmentButton.style.cursor = 'not-allowed';
        attachmentButton.title = 'File attachments not supported by this agent';
      }
    }
  }

  /**
   * Get supported MIME types
   */
  public getSupportedMimeTypes(): string[] {
    return this.supportedMimeTypes;
  }
}
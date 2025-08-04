// StandardRenderer.ts - Standard message renderer (non-streaming)
import type { Message } from '../types/types';
import type { MessageRenderer, RendererConfig } from './MessageRenderer';
import { MessageRenderer as MarkdownRenderer } from '../message-renderer/message-renderer';
import { Logger } from '../utils/logger';

/**
 * Standard renderer for non-streaming messages
 * Uses simple innerHTML replacement
 */
export class StandardRenderer implements MessageRenderer {
  private markdownRenderer: MarkdownRenderer;
  private logger: Logger;
  
  constructor(config?: RendererConfig) {
    this.markdownRenderer = new MarkdownRenderer();
    this.logger = new Logger(config?.debug || false, '[StandardRenderer]');
  }
  
  /**
   * Render a new message
   */
  async render(message: Message, container: HTMLElement): Promise<void> {
    this.logger.debug('Rendering message', { id: message.id, sender: message.sender });
    
    // Render content
    const renderedContent = await this.markdownRenderer.render(message);
    const attachmentsHtml = this.renderAttachments(message);
    
    // Update container
    container.innerHTML = renderedContent + attachmentsHtml;
  }
  
  /**
   * Update an existing message (same as render for standard)
   */
  update(message: Message, container: HTMLElement): void {
    // For standard renderer, update is the same as render
    this.render(message, container);
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    // No cleanup needed for standard renderer
  }
  
  /**
   * Render message attachments
   */
  private renderAttachments(message: Message): string {
    if (!message.attachments || message.attachments.length === 0) {
      return '';
    }
    
    const attachmentsHtml = message.attachments.map(attachment => {
      const isImage = attachment.file_type === 'image' && attachment.url;
      
      if (isImage) {
        return `
          <div class="chat-message-attachment">
            <img src="${attachment.url}" 
                 alt="${this.escapeHtml(attachment.filename)}" 
                 class="message-attachment-image"
                 loading="lazy">
          </div>
        `;
      } else {
        return `
          <a href="${attachment.url || '#'}" 
             class="chat-message-attachment" 
             target="_blank" 
             rel="noopener noreferrer">
            <div class="chat-attachment-info">
              <div class="chat-attachment-name">${this.escapeHtml(attachment.filename)}</div>
              <div class="chat-attachment-size">${this.formatFileSize(attachment.size_bytes)}</div>
            </div>
          </a>
        `;
      }
    }).join('');
    
    return attachmentsHtml ? `<div class="chat-message-attachments">${attachmentsHtml}</div>` : '';
  }
  
  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
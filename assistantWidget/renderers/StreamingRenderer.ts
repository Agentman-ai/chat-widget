// StreamingRenderer.ts - Streaming message renderer with morphdom
import type { Message } from '../types/types';
import type { MessageRenderer, RendererConfig } from './MessageRenderer';
import { MessageRenderer as MarkdownRenderer } from '../message-renderer/message-renderer';
import { Logger } from '../utils/logger';
import { loadMorphdom, fallbackDomUpdate } from '../utils/morphdom-loader';

/**
 * Streaming renderer that uses morphdom for efficient DOM updates
 * Preserves images and other media elements during updates
 */
export class StreamingRenderer implements MessageRenderer {
  private markdownRenderer: MarkdownRenderer;
  private logger: Logger;
  private config: RendererConfig;
  private imageCache: Set<string> = new Set();
  private morphdom: any = null;
  
  constructor(config?: RendererConfig) {
    this.config = config || {};
    this.markdownRenderer = new MarkdownRenderer();
    this.logger = new Logger(config?.debug || false, '[StreamingRenderer]');
    
    // Load morphdom asynchronously
    this.loadMorphdomAsync();
  }
  
  private async loadMorphdomAsync(): Promise<void> {
    try {
      this.morphdom = await loadMorphdom(this.config.debug);
      this.logger.debug('Morphdom loaded successfully');
    } catch (error) {
      this.logger.warn('Failed to load morphdom, will use fallback DOM updates', error);
    }
  }
  
  /**
   * Render a new message
   */
  async render(message: Message, container: HTMLElement): Promise<void> {
    this.logger.debug('Initial render for message', { id: message.id });
    
    const renderedContent = await this.markdownRenderer.render(message);
    const attachmentsHtml = this.renderAttachments(message);
    
    // Set initial content
    container.innerHTML = renderedContent + attachmentsHtml;
    
    // Track images
    this.trackImages(container);
  }
  
  /**
   * Update an existing message efficiently
   */
  update(message: Message, container: HTMLElement): void {
    this.logger.debug('Streaming update for message', { 
      id: message.id, 
      contentLength: message.content.length 
    });
    
    // Render new content asynchronously
    this.markdownRenderer.render(message).then(renderedContent => {
      const attachmentsHtml = this.renderAttachments(message);
      const isStreaming = (message as any).isStreaming;
      
      // Create new element with updated content
      const newElement = document.createElement('div');
      newElement.innerHTML = renderedContent + attachmentsHtml;
      
      // Add streaming indicator if needed
      if (isStreaming) {
        const indicator = document.createElement('span');
        indicator.className = 'am-streaming-indicator';
        indicator.innerHTML = ' ●●●';
        newElement.appendChild(indicator);
      }
      
      // Use morphdom if available, otherwise use fallback
      if (this.morphdom) {
        this.morphdom(container, newElement, {
          onBeforeElUpdated: (fromEl: any, toEl: any) => {
            // Preserve loaded images
            if (fromEl.tagName === 'IMG' && toEl.tagName === 'IMG') {
              const fromSrc = fromEl.getAttribute('src');
              const toSrc = toEl.getAttribute('src');
              
              if (fromSrc === toSrc && (fromEl as HTMLImageElement).complete) {
                // Image is already loaded, don't update
                this.logger.debug('Preserving loaded image', { src: fromSrc });
                return false;
              }
            }
            
            // Preserve videos and iframes
            if ((fromEl.tagName === 'VIDEO' || fromEl.tagName === 'IFRAME') && 
                fromEl.getAttribute('src') === toEl.getAttribute('src')) {
              return false;
            }
            
            return true;
          },
          
          onNodeAdded: (node: any) => {
            // Track new images
            if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'IMG') {
              const img = node as HTMLImageElement;
              const src = img.getAttribute('src');
              if (src && this.imageCache.has(src)) {
                this.logger.debug('Image already in cache', { src });
              }
            }
          },
          
          childrenOnly: true // Only update children, not the container itself
        });
      } else {
        // Use fallback DOM update
        this.logger.debug('Using fallback DOM update (morphdom not loaded)');
        fallbackDomUpdate(container, newElement);
      }
    });
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.imageCache.clear();
  }
  
  /**
   * Track images in the container
   */
  private trackImages(container: HTMLElement): void {
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        this.imageCache.add(src);
        
        // Add load listener
        img.addEventListener('load', () => {
          this.logger.debug('Image loaded', { src });
        }, { once: true });
      }
    });
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
        // Mark images that we've seen before
        const cached = this.imageCache.has(attachment.url!);
        return `
          <div class="chat-message-attachment">
            <img src="${attachment.url}" 
                 alt="${this.escapeHtml(attachment.filename)}" 
                 class="message-attachment-image${cached ? ' cached' : ''}"
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
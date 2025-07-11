// AttachmentHandlerSimple.ts - Simplified attachment handler for refactoring
import type { Message, FileAttachment } from '../types/types';
import { UIManager } from '../components/UIManager';
import { Logger } from '../utils/logger';
import * as icons from '../assets/icons';
import { UI_CONSTANTS, VALIDATION_CONSTANTS } from '../constants';

export interface AttachmentHandlerConfig {
  enableAttachments?: boolean;
  maxFileSize?: number;
  maxAttachments?: number;
  acceptedFileTypes?: string[];
  debug?: boolean | import('../types/types').DebugConfig;
}

/**
 * Simplified AttachmentHandler that demonstrates the pattern
 * without depending on the full FileUploadManager API
 */
export class AttachmentHandlerSimple {
  private logger: Logger;
  private fileInput: HTMLInputElement | null = null;
  private attachedFiles: File[] = [];

  constructor(
    private config: AttachmentHandlerConfig,
    private uiManager: UIManager
  ) {
    this.logger = new Logger(config.debug || false, '[AttachmentHandler]');
    this.initializeFileInput();
  }

  /**
   * Initialize hidden file input
   */
  private initializeFileInput(): void {
    if (!this.config.enableAttachments) return;

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.multiple = true;
    this.fileInput.style.display = 'none';
    this.fileInput.accept = this.config.acceptedFileTypes?.join(',') || '*/*';
    
    this.fileInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        this.handleFileSelect(files);
      }
    });

    document.body.appendChild(this.fileInput);
  }

  /**
   * Handle attachment button click
   */
  public handleAttachmentClick(): void {
    if (!this.config.enableAttachments) {
      this.logger.warn('Attachments are not enabled');
      return;
    }

    this.fileInput?.click();
  }

  /**
   * Handle file selection
   */
  public handleFileSelect(files: FileList): void {
    const maxAttachments = this.config.maxAttachments || UI_CONSTANTS.MAX_ATTACHMENTS;
    const remainingSlots = maxAttachments - this.attachedFiles.length;

    if (remainingSlots <= 0) {
      this.showError(`Maximum ${maxAttachments} attachments allowed`);
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToAdd) {
      // Validate file size
      const maxSize = this.config.maxFileSize || UI_CONSTANTS.MAX_ATTACHMENT_SIZE;
      if (file.size > maxSize) {
        this.showError(`File "${file.name}" exceeds maximum size of ${this.formatFileSize(maxSize)}`);
        continue;
      }

      // Add file to local array
      this.attachedFiles.push(file);
    }

    // Update UI
    this.updateAttachmentPreview();
    
    // Clear file input
    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }

  /**
   * Get attached files
   */
  public getAttachedFiles(): File[] {
    return this.attachedFiles;
  }

  /**
   * Clear attachments
   */
  public clearAttachments(): void {
    this.attachedFiles = [];
    this.updateAttachmentPreview();
  }

  /**
   * Update attachment preview UI
   */
  public updateAttachmentPreview(): void {
    const attachmentPreview = this.uiManager.getElement('.am-attachment-preview');
    if (!attachmentPreview) return;

    if (this.attachedFiles.length === 0) {
      attachmentPreview.style.display = 'none';
      return;
    }

    attachmentPreview.style.display = 'flex';
    attachmentPreview.innerHTML = this.attachedFiles.map((file, index) => `
      <div class="am-attachment-item" data-file-index="${index}">
        <div class="am-attachment-icon">${this.getAttachmentIcon(this.getFileType(file))}</div>
        <div class="am-attachment-info">
          <div class="am-attachment-name">${this.escapeHtml(file.name)}</div>
          <div class="am-attachment-size">${this.formatFileSize(file.size)}</div>
        </div>
        <button class="am-attachment-remove" data-file-index="${index}">×</button>
      </div>
    `).join('');

    // Attach remove handlers
    attachmentPreview.querySelectorAll('.am-attachment-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-file-index') || '0');
        this.removeFile(index);
      });
    });
  }

  /**
   * Remove file by index
   */
  private removeFile(index: number): void {
    this.attachedFiles.splice(index, 1);
    this.updateAttachmentPreview();
  }

  /**
   * Render attachments in a message
   */
  public renderMessageAttachments(message: Message): string {
    if (!message.attachments || message.attachments.length === 0) {
      return '';
    }

    return `
      <div class="am-message-attachments">
        ${message.attachments.map(attachment => `
          <div class="am-message-attachment">
            <div class="am-attachment-icon">${this.getAttachmentIcon(attachment.file_type)}</div>
            <div class="am-attachment-info">
              <a href="${attachment.url}" target="_blank" class="am-attachment-name">
                ${this.escapeHtml(attachment.filename)}
              </a>
              <div class="am-attachment-size">${this.formatFileSize(attachment.size_bytes)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Get file type category
   */
  private getFileType(file: File): 'image' | 'document' | 'audio' | 'video' | 'text' | 'data' {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('text/')) return 'text';
    if (
      type.includes('pdf') ||
      type.includes('document') ||
      type.includes('msword') ||
      type.includes('spreadsheet') ||
      type.includes('presentation')
    ) {
      return 'document';
    }
    
    return 'data';
  }

  /**
   * Get attachment icon
   */
  private getAttachmentIcon(fileType: string): string {
    switch (fileType) {
      case 'image': return icons.imageIcon;
      case 'document': return icons.documentIcon;
      case 'audio': return icons.audioIcon;
      case 'video': return icons.videoIcon;
      case 'text': return icons.textIcon;
      default: return icons.fileIcon;
    }
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // This could be enhanced to show a toast notification
    this.logger.error(message);
    alert(message); // Temporary - should use a proper notification system
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.fileInput) {
      this.fileInput.remove();
      this.fileInput = null;
    }
    this.attachedFiles = [];
  }
}
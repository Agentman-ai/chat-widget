// UIUtils.ts - Shared UI utility functions
/**
 * UIUtils - Common UI helper functions used across components
 * 
 * This module contains utility functions for:
 * - File type icon mapping
 * - File size formatting
 * - HTML escaping
 * - Other common UI operations
 */

export class UIUtils {
  /**
   * Get attachment icon based on file type
   */
  static getAttachmentIcon(fileType: string): string {
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'document':
        return '📄';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎬';
      case 'text':
        return '📝';
      case 'data':
        return '📊';
      default:
        return '📎';
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get file type from file object
   */
  static getFileType(file: File): 'image' | 'document' | 'audio' | 'video' | 'text' | 'data' {
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('text/') || mimeType.includes('text')) return 'text';
    
    // Check by extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'ppt':
      case 'pptx':
      case 'xls':
      case 'xlsx':
        return 'document';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'video';
      case 'txt':
      case 'md':
      case 'json':
      case 'csv':
        return 'text';
      default:
        return 'data';
    }
  }

  /**
   * Generate unique ID
   */
  static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
/**
 * File and attachment type definitions for the chat widget
 */

/**
 * Unified attachment data structure representing files attached to messages
 * @interface Attachment
 */
export interface Attachment {
  id: string;                // Local ID
  file_id?: string;          // Server-assigned ID
  filename: string;
  file_type: 'image' | 'document' | 'video' | 'audio' | 'text' | 'file';
  mime_type: string;
  size_bytes: number;
  url?: string;              // Preview or download URL
  upload_progress?: number;
  upload_status?: 'pending' | 'uploading' | 'completed' | 'error';
}

/**
 * File handler interface for managing file uploads and attachments
 * @interface IFileHandler
 */
export interface IFileHandler {
  // Core methods
  /**
   * Get all current attachments with their metadata
   * @returns Array of attachment objects
   */
  getAttachments(): Attachment[];
  
  /**
   * Get IDs of successfully uploaded files
   * @returns Array of server-assigned file IDs
   */
  getUploadedFileIds(): string[];
  
  /**
   * Get URLs of uploaded files (deprecated, use getUploadedFileIds)
   * @returns Array of file URLs
   * @deprecated Use getUploadedFileIds instead
   */
  getUploadedFileUrls(): string[];
  
  /**
   * Check if any files are currently being uploaded
   * @returns True if uploads are in progress
   */
  isUploading(): boolean;
  
  /**
   * Clear all attachments and cancel pending uploads
   */
  clearAllAttachments(): void;
  
  // File operations
  /**
   * Handle file selection from user input
   * @param files - FileList from file input or drag-drop
   * @returns Promise that resolves when files are processed
   */
  handleFileSelection(files: FileList): Promise<void>;
  
  /**
   * Remove a specific attachment
   * @param fileId - ID of the attachment to remove
   */
  removeAttachment(fileId: string): void;
  
  // Upload management
  /**
   * Upload a file to the server
   * @param file - File object to upload
   * @param fileId - Local ID for tracking the upload
   * @returns Promise that resolves when upload completes
   */
  uploadFile(file: File, fileId: string): Promise<void>;
  
  /**
   * Cancel an ongoing upload
   * @param fileId - ID of the upload to cancel
   */
  cancelUpload(fileId: string): void;
  
  // Agent capabilities
  /**
   * Set agent capabilities for file handling
   * @param capabilities - Agent capability configuration
   */
  setAgentCapabilities(capabilities: any): void;
  
  // Cleanup
  /**
   * Clean up resources and cancel all pending operations
   */
  destroy(): void;
}

/**
 * Configuration options for loading operations
 * @interface LoadingOptions
 */
export interface LoadingOptions {
  timeout?: number;
  message?: string;
  showIndicator?: boolean;
  allowContinueAfterTimeout?: boolean;
}

/**
 * Result returned from successful file upload
 * @interface FileUploadResult
 */
export interface FileUploadResult {
  file_id: string;
  filename: string;
  content_type: string;
  file_type: string;
  url: string;
  size_bytes: number;
  status: string;
  created_at: string;
  expires_at: string;
}
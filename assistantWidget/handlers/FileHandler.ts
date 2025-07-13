// FileHandler.ts - Centralized file operations and attachment management
import type { ViewManager } from '../components/ViewManager';
import type { EventBus } from '../utils/EventBus';
import type { ErrorHandler } from './ErrorHandler';
import { LoadingManager } from './LoadingManager';
import { Logger } from '../utils/logger';
import { createEvent } from '../types/events';

/**
 * FileHandler - Manages file operations and attachment handling
 * 
 * This handler manages:
 * - File selection and validation
 * - File upload operations with progress tracking
 * - Attachment preview and removal
 * - File type and size validation
 * - Upload error handling and retry logic
 */
export class FileHandler {
  private logger: Logger;
  private loadingManager: LoadingManager;
  private activeUploads: Map<string, AbortController> = new Map();
  private uploadProgress: Map<string, number> = new Map();
  private attachments: Map<string, File> = new Map();
  
  // Configuration
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  constructor(
    private viewManager: ViewManager,
    private eventBus: EventBus,
    private errorHandler: ErrorHandler,
    private apiUrl: string,
    private agentToken: string,
    debug: boolean = false
  ) {
    this.logger = new Logger(debug, '[FileHandler]');
    this.loadingManager = new LoadingManager(this.viewManager, this.eventBus, debug);
  }

  /**
   * Handle file selection from input
   */
  public handleFileSelection(files: FileList): void {
    this.logger.debug(`Handling file selection: ${files.length} files`);

    // Emit file selected event
    this.eventBus.emit('file:selected', createEvent('file:selected', {
      files,
      source: 'FileHandler'
    }));

    // Validate and process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.processSelectedFile(file);
    }
  }

  /**
   * Process a selected file (validation + upload)
   */
  private async processSelectedFile(file: File): Promise<void> {
    const fileId = this.generateFileId(file);
    
    try {
      // Validate file
      this.validateFile(file);
      
      // Add to attachments
      this.attachments.set(fileId, file);
      
      // Update UI preview
      this.updateAttachmentPreview();
      
      // Start upload
      await this.uploadFile(file, fileId);
      
    } catch (error) {
      const errorMessage = this.errorHandler.handleFileError(
        file.name,
        this.getFileErrorType(error),
        {
          maxSize: this.MAX_FILE_SIZE,
          allowedTypes: this.ALLOWED_TYPES
        }
      );
      
      // Show error to user through ViewManager
      this.viewManager.addMessage(errorMessage);
    }
  }

  /**
   * Validate file size and type
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('INVALID_FILE_TYPE');
    }

    this.logger.debug(`File validation passed: ${file.name} (${file.size} bytes, ${file.type})`);
  }

  /**
   * Upload file with progress tracking
   */
  private async uploadFile(file: File, fileId: string): Promise<void> {
    const abortController = new AbortController();
    this.activeUploads.set(fileId, abortController);

    // Start loading operation
    const loadingId = this.loadingManager.startLoading('file_upload', {
      message: `Uploading ${file.name}...`,
      timeout: 60000 // 1 minute timeout for file uploads
    });

    try {
      // Emit upload start event
      this.eventBus.emit('file:upload_start', createEvent('file:upload_start', {
        file,
        fileId,
        source: 'FileHandler'
      }));

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agentToken', this.agentToken);

      // Upload with progress tracking
      const response = await this.uploadWithProgress(
        `${this.apiUrl}/v2/agentman_runtime/file/upload`,
        formData,
        fileId,
        abortController.signal
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.debug(`File upload successful: ${file.name}`, result);

      // Complete loading operation
      this.loadingManager.completeLoading(loadingId, true);

      // Emit upload complete event
      this.eventBus.emit('file:upload_complete', createEvent('file:upload_complete', {
        fileId,
        success: true,
        source: 'FileHandler'
      }));

      // Update attachment with upload result
      this.updateAttachmentResult(fileId, result);

    } catch (error) {
      this.logger.error(`File upload failed: ${file.name}`, error);

      // Complete loading operation with error
      this.loadingManager.completeLoading(
        loadingId, 
        false, 
        error instanceof Error ? error : new Error(String(error))
      );

      // Emit upload complete event with error
      this.eventBus.emit('file:upload_complete', createEvent('file:upload_complete', {
        fileId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        source: 'FileHandler'
      }));

      // Remove failed attachment
      this.removeAttachment(fileId);

      // Re-throw for caller handling
      throw error;

    } finally {
      // Clean up
      this.activeUploads.delete(fileId);
      this.uploadProgress.delete(fileId);
    }
  }

  /**
   * Upload with progress tracking using XMLHttpRequest
   */
  private uploadWithProgress(
    url: string,
    formData: FormData,
    fileId: string,
    signal: AbortSignal
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this.uploadProgress.set(fileId, progress);
          
          // Update loading manager progress
          this.loadingManager.updateProgress(fileId, progress, `Uploading... ${progress}%`);
          
          // Update UI progress
          this.updateUploadProgress(fileId, progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText
          }));
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during file upload'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        reject(new Error('File upload cancelled'));
      });

      // Handle signal abort
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      // Start upload
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }

  /**
   * Remove an attachment
   */
  public removeAttachment(fileId: string): void {
    this.logger.debug(`Removing attachment: ${fileId}`);

    // Cancel upload if in progress
    const abortController = this.activeUploads.get(fileId);
    if (abortController) {
      abortController.abort();
      this.activeUploads.delete(fileId);
    }

    // Remove from attachments
    this.attachments.delete(fileId);
    this.uploadProgress.delete(fileId);

    // Update UI
    this.updateAttachmentPreview();

    // Emit removal event
    this.eventBus.emit('file:attachment_removed', createEvent('file:attachment_removed', {
      fileId,
      source: 'FileHandler'
    }));
  }

  /**
   * Get all current attachments
   */
  public getAttachments(): Record<string, any>[] {
    const attachments: Record<string, any>[] = [];
    
    this.attachments.forEach((file, fileId) => {
      attachments.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: this.uploadProgress.get(fileId) || 0,
        status: this.getAttachmentStatus(fileId)
      });
    });
    
    return attachments;
  }

  /**
   * Clear all attachments
   */
  public clearAllAttachments(): void {
    this.logger.debug('Clearing all attachments');

    // Cancel all uploads
    this.activeUploads.forEach((abortController, fileId) => {
      abortController.abort();
    });

    // Clear all data
    this.attachments.clear();
    this.activeUploads.clear();
    this.uploadProgress.clear();

    // Update UI
    this.updateAttachmentPreview();
    this.viewManager.clearFileInput();
  }

  /**
   * Check if files are currently uploading
   */
  public isUploading(): boolean {
    return this.activeUploads.size > 0;
  }

  /**
   * Get upload progress for a specific file
   */
  public getUploadProgress(fileId: string): number {
    return this.uploadProgress.get(fileId) || 0;
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(file: File): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`;
  }

  /**
   * Get file error type from error
   */
  private getFileErrorType(error: unknown): 'size' | 'type' | 'upload' | 'network' {
    if (error instanceof Error) {
      if (error.message.includes('FILE_TOO_LARGE')) return 'size';
      if (error.message.includes('INVALID_FILE_TYPE')) return 'type';
      if (error.message.includes('Network')) return 'network';
    }
    return 'upload';
  }

  /**
   * Get attachment status
   */
  private getAttachmentStatus(fileId: string): 'uploading' | 'completed' | 'error' {
    if (this.activeUploads.has(fileId)) return 'uploading';
    const progress = this.uploadProgress.get(fileId) || 0;
    return progress === 100 ? 'completed' : 'error';
  }

  /**
   * Update attachment preview in UI
   */
  private updateAttachmentPreview(): void {
    const attachments = this.getAttachments();
    this.viewManager.updateAttachmentPreview(attachments);
  }

  /**
   * Update upload progress in UI
   */
  private updateUploadProgress(fileId: string, progress: number): void {
    // This would update specific file progress in the UI
    // The ViewManager would handle the visual updates
    this.updateAttachmentPreview();
  }

  /**
   * Update attachment with upload result
   */
  private updateAttachmentResult(fileId: string, result: any): void {
    // Store upload result for later use (e.g., including in message)
    this.logger.debug(`Attachment ${fileId} upload completed`, result);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.logger.debug('Destroying FileHandler');

    // Cancel all uploads
    this.clearAllAttachments();

    // Clean up loading manager
    this.loadingManager.destroy();
  }
}
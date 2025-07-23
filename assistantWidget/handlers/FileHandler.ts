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
  private uploadedFileIds: Map<string, string> = new Map(); // Maps temp IDs to server IDs
  
  // Configuration
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  private supportedMimeTypes: string[] = [];
  private getConversationId: (() => string | null) | null = null;
  private ensureConversation: (() => string) | null = null;

  constructor(
    private viewManager: ViewManager,
    private eventBus: EventBus,
    private errorHandler: ErrorHandler,
    private apiUrl: string,
    private agentToken: string,
    debug: boolean = false,
    getConversationId?: () => string | null,
    ensureConversation?: () => string
  ) {
    this.logger = new Logger(debug, '[FileHandler]');
    this.loadingManager = new LoadingManager(this.viewManager, this.eventBus, debug);
    // Default to built-in allowed types until agent capabilities are set
    this.supportedMimeTypes = this.DEFAULT_ALLOWED_TYPES;
    this.getConversationId = getConversationId || null;
    this.ensureConversation = ensureConversation || null;
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
      this.logger.info(`Starting upload for file: ${file.name}`);
      await this.uploadFile(file, fileId);
      
    } catch (error) {
      this.logger.error(`Failed to process file ${file.name}:`, error);
      this.logger.error(`Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      const errorMessage = this.errorHandler.handleFileError(
        file.name,
        this.getFileErrorType(error),
        {
          maxSize: this.MAX_FILE_SIZE,
          allowedTypes: this.supportedMimeTypes
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

    // Check file type against supported mime types
    this.logger.debug(`Checking file type ${file.type} against supported types:`, this.supportedMimeTypes);
    if (!this.supportedMimeTypes.includes(file.type)) {
      this.logger.error(`File type ${file.type} not in supported types:`, this.supportedMimeTypes);
      throw new Error('INVALID_FILE_TYPE');
    }

    this.logger.debug(`File validation passed: ${file.name} (${file.size} bytes, ${file.type})`);
  }

  /**
   * Upload file with progress tracking
   */
  private async uploadFile(file: File, fileId: string): Promise<void> {
    this.logger.info(`uploadFile called for: ${file.name}, fileId: ${fileId}`);
    
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

      // Create FormData (only file, other params go in URL/headers)
      const formData = new FormData();
      formData.append('file', file);

      // Build URL with query parameters - note: 'files' (plural) endpoint
      const url = new URL(`${this.apiUrl}/v2/agentman_runtime/files/upload`);
      
      // Get or create conversation ID
      let conversationId = this.getConversationId ? this.getConversationId() : null;
      
      // If no conversation ID and we're in welcome screen, create one
      if (!conversationId && this.ensureConversation) {
        this.logger.info('No conversation ID found, creating new conversation for file upload');
        conversationId = this.ensureConversation();
        
        // Log that a conversation was created for file upload
        this.logger.debug('Conversation created for file upload:', conversationId);
      }
      
      if (conversationId) {
        url.searchParams.append('conversation_id', conversationId);
        this.logger.debug(`Uploading file with conversation ID: ${conversationId}`);
      } else {
        this.logger.warn('Uploading file without conversation ID');
      }

      // Upload with progress tracking
      const response = await this.uploadWithProgress(
        url.toString(),
        formData,
        fileId,
        abortController.signal,
        this.agentToken
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Upload failed - Status: ${response.status}, Response: ${errorText}`);
        
        // Try to parse error response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorResponse = JSON.parse(errorText);
          if (response.status === 422 && errorResponse.detail) {
            // Handle FastAPI validation errors
            if (Array.isArray(errorResponse.detail)) {
              const details = errorResponse.detail.map((err: any) => 
                `${err.loc?.join('.')} - ${err.msg}`
              ).join(', ');
              errorMessage = `Validation error: ${details}`;
            } else {
              errorMessage = `Validation error: ${errorResponse.detail}`;
            }
          } else {
            errorMessage = errorResponse.error || errorResponse.message || errorMessage;
          }
        } catch (e) {
          errorMessage += ` - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      this.logger.debug(`File upload successful: ${file.name}`, result);
      
      // Extract the file_id and other metadata from response
      if (result.file_id) {
        // Store the server-assigned file ID for later use
        this.uploadedFileIds.set(fileId, result.file_id);
      }

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
    signal: AbortSignal,
    agentToken: string
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
          // Log the error response for debugging
          // Parse error response
          let errorMessage = `HTTP ${xhr.status}: ${xhr.statusText}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (xhr.status === 422 && errorResponse.detail) {
              if (Array.isArray(errorResponse.detail)) {
                const details = errorResponse.detail.map((err: any) => 
                  `${err.loc?.join('.')} - ${err.msg}`
                ).join(', ');
                errorMessage = `Validation error: ${details}`;
              } else {
                errorMessage = `Validation error: ${errorResponse.detail}`;
              }
            } else {
              errorMessage = errorResponse.error || errorResponse.message || errorMessage;
            }
          } catch (e) {
            this.logger.error(`Failed to parse error response: ${xhr.responseText}`);
            errorMessage += ` - ${xhr.responseText}`;
          }
          
          this.logger.error(`Upload failed: ${errorMessage}`);
          reject(new Error(errorMessage));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        this.logger.error('Network error during file upload');
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
      // Set the agent_token header (FastAPI expects this exact header name)
      xhr.setRequestHeader('agent_token', agentToken);
      // Log the request details for debugging
      this.logger.debug(`Uploading to: ${url}`);
      this.logger.debug(`With agent_token header: ${agentToken.substring(0, 20)}...`);
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
        filename: file.name,
        file_type: this.getFileTypeFromMimeType(file.type),
        size_bytes: file.size,
        mime_type: file.type,
        upload_progress: this.uploadProgress.get(fileId) || 0,
        upload_status: this.getAttachmentStatus(fileId)
      });
    });
    
    return attachments;
  }

  /**
   * Get uploaded file URLs for sending with messages
   */
  public getUploadedFileUrls(): string[] {
    const urls: string[] = [];
    
    // Iterate through uploadedFileIds to get server file IDs
    this.uploadedFileIds.forEach((serverFileId) => {
      // Construct the file URL using the server-assigned file ID
      urls.push(`${this.apiUrl}/v2/agentman_runtime/files/${serverFileId}/download`);
    });
    
    return urls;
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
    this.uploadedFileIds.clear();

    // Update UI
    this.updateAttachmentPreview();
    this.viewManager.clearFileInput();
  }

  /**
   * Update supported MIME types from agent capabilities
   */
  public updateSupportedMimeTypes(mimeTypes: string[]): void {
    if (mimeTypes && mimeTypes.length > 0) {
      this.supportedMimeTypes = mimeTypes;
      this.logger.info('Updated supported MIME types:', this.supportedMimeTypes);
    } else {
      // Fallback to defaults if no types provided
      this.supportedMimeTypes = this.DEFAULT_ALLOWED_TYPES;
      this.logger.warn('No MIME types provided, using defaults');
    }
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
   * Get file type from MIME type
   */
  private getFileTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'document';
    if (mimeType.startsWith('text/')) return 'text';
    return 'file';
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
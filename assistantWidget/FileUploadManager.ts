import type { FileAttachment } from './types/types';

export class FileUploadManager {
  private apiUrl: string;
  private agentToken: string;
  private conversationId: string;

  constructor(apiUrl: string, agentToken: string, conversationId: string) {
    this.apiUrl = apiUrl;
    this.agentToken = agentToken;
    this.conversationId = conversationId;
  }

  /**
   * Upload a file to the runtime file service
   * @param file The file to upload
   * @param onProgress Optional callback for upload progress
   * @returns Promise with the file attachment data
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileAttachment> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Generate a temporary file ID for tracking
      const tempFileId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create initial attachment object
      const attachment: FileAttachment = {
        file_id: tempFileId,
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        file_type: this.getFileType(file),
        size_bytes: file.size,
        upload_status: 'pending',
        upload_progress: 0
      };

      // Handle upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          if (onProgress) {
            onProgress(progress);
          }
        }
      });

      // Handle successful upload
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            
            // Update attachment with server response
            const uploadedAttachment: FileAttachment = {
              ...attachment,
              file_id: response.file_id,
              url: response.url,
              created_at: response.created_at,
              expires_at: response.expires_at,
              upload_status: 'success',
              upload_progress: 100
            };
            
            resolve(uploadedAttachment);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          let errorMessage = 'Upload failed';
          let errorDetails = '';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error('Upload error response:', errorResponse);
            
            // Handle FastAPI validation errors (422)
            if (xhr.status === 422 && errorResponse.detail) {
              if (Array.isArray(errorResponse.detail)) {
                errorDetails = errorResponse.detail.map((err: any) => 
                  `${err.loc?.join('.')} - ${err.msg}`
                ).join(', ');
              } else {
                errorDetails = errorResponse.detail;
              }
              errorMessage = `Validation error: ${errorDetails}`;
            } else {
              errorMessage = errorResponse.error || errorResponse.message || errorMessage;
            }
          } catch (e) {
            console.error('Failed to parse error response:', xhr.responseText);
            errorMessage = `${errorMessage} - ${xhr.responseText}`;
          }
          reject(new Error(`${errorMessage} (Status: ${xhr.status})`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Build the upload URL with conversation_id
      const uploadUrl = new URL(`${this.apiUrl}/v2/agentman_runtime/files/upload`);
      if (this.conversationId) {
        uploadUrl.searchParams.append('conversation_id', this.conversationId);
      }

      // Open and send the request
      xhr.open('POST', uploadUrl.toString());
      xhr.setRequestHeader('agent_token', this.agentToken);
      xhr.send(formData);
    });
  }

  /**
   * Delete a file from the runtime file service
   * @param fileId The ID of the file to delete
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/v2/agentman_runtime/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'agent_token': this.agentToken
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  /**
   * Determine the file type category based on MIME type
   */
  public getFileType(file: File): FileAttachment['file_type'] {
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/xml'
    ) {
      return 'text';
    } else if (
      mimeType === 'application/pdf' ||
      mimeType === 'application/msword' ||
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')
    ) {
      return 'document';
    } else {
      return 'data';
    }
  }

  /**
   * Validate file before upload
   * @param file The file to validate
   * @returns Error message if invalid, null if valid
   */
  validateFile(file: File): string | null {
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds maximum allowed size of 100MB`;
    }

    // Add more validation rules as needed
    return null;
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
}

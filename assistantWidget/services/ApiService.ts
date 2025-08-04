// ApiService.ts - Centralized API communication service
import type { ClientMetadata } from '../types/types';
import { Logger } from '../utils/logger';
import { StreamingClient, StreamingCallbacks } from './StreamingClient';

export interface SendMessageParams {
  agentToken: string;
  conversationId: string;
  userInput: string;
  clientMetadata?: ClientMetadata;
  forceLoad?: boolean;
  attachmentUrls?: string[];
  streaming?: boolean;
  debug?: boolean;
}

export interface ApiResponse {
  response: any[];
  metadata?: any;
}

export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  error?: string;
}

/**
 * ApiService - Handles all API communication with the Agentman backend
 * 
 * Responsibilities:
 * - Send messages to agent API
 * - Handle file uploads
 * - Process API responses
 * - Centralized error handling
 * - Request/response formatting
 */
export class ApiService {
  private logger: Logger;
  private apiUrl: string;
  private streamingClient: StreamingClient;

  constructor(apiUrl: string, debug?: boolean | import('../types/types').DebugConfig) {
    this.apiUrl = apiUrl;
    this.logger = new Logger(debug || false, '[ApiService]');
    this.streamingClient = new StreamingClient({ apiUrl, debug: !!debug });
  }

  /**
   * Send message to the agent API
   * Routes to streaming or non-streaming based on params
   */
  async sendMessage(params: SendMessageParams, streamCallbacks?: StreamingCallbacks): Promise<ApiResponse> {
    // If streaming is requested and callbacks are provided, use streaming
    if (params.streaming && streamCallbacks) {
      return this.sendMessageStreaming(params, streamCallbacks);
    }
    
    // Otherwise use standard non-streaming
    const requestBody = {
      agent_token: params.agentToken,
      force_load: params.forceLoad || false,
      conversation_id: params.conversationId,
      user_input: params.userInput,
      include_attachment_metadata: true, // Always include attachment metadata for rendering
      ...(params.attachmentUrls && params.attachmentUrls.length > 0
        ? { attachment_urls: params.attachmentUrls }
        : {}
      ),
      ...(params.clientMetadata && Object.keys(params.clientMetadata).length > 0 
        ? { client_metadata: params.clientMetadata } 
        : {}
      )
    };

    this.logger.debug('🔄 Sending message to API:', {
      url: `${this.apiUrl}/v2/agentman_runtime/agent`,
      body: requestBody
    });

    try {
      const response = await fetch(`${this.apiUrl}/v2/agentman_runtime/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);
      
      this.logger.info('📨 Received API response:', data);
      
      return {
        response: data.response || [],
        metadata: data.metadata
      };

    } catch (error) {
      this.logger.error('❌ API request failed:', error);
      throw this.handleApiError(error as Error);
    }
  }
  
  /**
   * Send message with streaming
   */
  private async sendMessageStreaming(params: SendMessageParams, callbacks: StreamingCallbacks): Promise<ApiResponse> {
    this.logger.debug('🔄 Starting streaming request');
    
    // Create a promise to collect messages
    const messages: any[] = [];
    let streamError: Error | null = null;
    
    return new Promise<ApiResponse>((resolve, reject) => {
      // Set up callbacks to collect messages
      const wrappedCallbacks: StreamingCallbacks = {
        onMessage: (message) => {
          messages.push({
            agent: {
              id: message.id,
              role: 'agent',
              content: message.content
            }
          });
          callbacks.onMessage?.(message);
        },
        onError: (error) => {
          streamError = error;
          callbacks.onError?.(error);
        },
        onComplete: () => {
          callbacks.onComplete?.();
          
          if (streamError) {
            reject(streamError);
          } else {
            resolve({
              response: messages,
              metadata: { streaming: true }
            });
          }
        },
        onChunk: callbacks.onChunk
      };
      
      // Start streaming
      this.streamingClient.sendMessage({
        agentToken: params.agentToken,
        conversationId: params.conversationId,
        userInput: params.userInput,
        attachmentUrls: params.attachmentUrls,
        debug: params.debug
      }, wrappedCallbacks).catch(reject);
    });
  }

  /**
   * Upload file to the API
   */
  async uploadFile(file: File, agentToken: string, conversationId: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agent_token', agentToken);
    formData.append('conversation_id', conversationId);

    this.logger.debug('📤 Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      const response = await fetch(`${this.apiUrl}/v2/agentman_runtime/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed! status: ${response.status}`);
      }

      const data = await response.json();
      this.logger.info('📨 File upload response:', data);

      return {
        success: true,
        fileId: data.file_id,
      };

    } catch (error) {
      this.logger.error('❌ File upload failed:', error);
      return {
        success: false,
        error: this.getErrorMessage(error as Error)
      };
    }
  }

  /**
   * Get agent capabilities and metadata
   */
  async getAgentCapabilities(agentToken: string): Promise<any> {
    this.logger.debug('🔍 Fetching agent capabilities');

    try {
      const response = await fetch(`${this.apiUrl}/v2/agentman_runtime/capabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_token: agentToken
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch capabilities! status: ${response.status}`);
      }

      const data = await response.json();
      this.logger.info('📋 Agent capabilities received:', data);
      
      return data;

    } catch (error) {
      this.logger.error('❌ Failed to fetch agent capabilities:', error);
      throw this.handleApiError(error as Error);
    }
  }

  /**
   * Handle API errors with user-friendly messages
   */
  private handleApiError(error: Error): Error {
    let errorMessage = 'Sorry, I encountered an error. Please try again.';

    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Unable to connect to the agent service. Please check your connection and try again.';
    } else if (error.message.includes('401')) {
      errorMessage = 'Authentication failed. Please check your agent token.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Agent service not found. Please check the API URL.';
    } else if (error.message.includes('403')) {
      errorMessage = 'Access denied. Please check your permissions.';
    } else if (error.message.includes('429')) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Server error. Please try again later.';
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.name = 'ApiError';
    enhancedError.cause = error;
    
    return enhancedError;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: Error): string {
    if (error.message.includes('Failed to fetch')) {
      return 'Network connection failed';
    } else if (error.message.includes('413')) {
      return 'File too large';
    } else if (error.message.includes('415')) {
      return 'File type not supported';
    } else {
      return 'Upload failed';
    }
  }

  /**
   * Update API URL (for dynamic configuration)
   */
  updateApiUrl(newApiUrl: string): void {
    this.logger.debug('🔄 Updating API URL:', { from: this.apiUrl, to: newApiUrl });
    this.apiUrl = newApiUrl;
  }

  /**
   * Get current API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }
  
  /**
   * Abort any active streaming
   */
  abortStreaming(): void {
    this.streamingClient.abort();
  }
  
  /**
   * Check if currently streaming
   */
  isStreaming(): boolean {
    return this.streamingClient.isStreaming();
  }
}
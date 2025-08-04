// StreamingClient.ts - Dedicated service for handling streaming responses
import type { Message } from '../types/types';
import { Logger } from '../utils/logger';

export interface StreamingCallbacks {
  onMessage?: (message: Message) => void;
  onChunk?: (chunk: string, messageId: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export interface StreamingConfig {
  apiUrl: string;
  debug?: boolean;
}

/**
 * Dedicated client for handling streaming responses
 * Separates streaming logic from main ApiService
 */
export class StreamingClient {
  private logger: Logger;
  private apiUrl: string;
  private config: StreamingConfig;
  private currentStream: AbortController | null = null;
  
  constructor(config: StreamingConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl;
    this.logger = new Logger(config.debug || false, '[StreamingClient]');
  }
  
  /**
   * Send a streaming message request
   */
  async sendMessage(
    params: {
      agentToken: string;
      conversationId: string;
      userInput: string;
      attachmentUrls?: string[];
      debug?: boolean;
    },
    callbacks: StreamingCallbacks
  ): Promise<void> {
    // Cancel any existing stream
    this.abort();
    
    // Create new abort controller
    this.currentStream = new AbortController();
    
    const requestBody = {
      agent_token: params.agentToken,
      conversation_id: params.conversationId,
      user_input: params.userInput,
      attachment_urls: params.attachmentUrls || [],
      stream: true,
      debug: params.debug || false
    };
    
    try {
      this.logger.debug('Starting streaming request', requestBody);
      
      const response = await fetch(`${this.apiUrl}/v2/agentman_runtime/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody),
        signal: this.currentStream.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Process the stream
      await this.processStream(response, callbacks);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.debug('Stream aborted');
      } else {
        this.logger.error('Streaming error:', error);
        callbacks.onError?.(error);
      }
    } finally {
      this.currentStream = null;
    }
  }
  
  /**
   * Process the SSE stream
   */
  private async processStream(response: Response, callbacks: StreamingCallbacks): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessage: Partial<Message> | null = null;
    let accumulatedContent = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          this.logger.debug('Stream completed');
          callbacks.onComplete?.();
          break;
        }
        
        // Decode chunk
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              this.logger.debug('Received DONE signal');
              if (currentMessage && accumulatedContent) {
                // Finalize the message
                currentMessage.content = accumulatedContent;
                (currentMessage as any).isStreaming = false;
                callbacks.onMessage?.(currentMessage as Message);
              }
              callbacks.onComplete?.();
              return;
            }
            
            try {
              const eventData = JSON.parse(data);
              
              // Handle different event types
              if (eventData.type === 'chunk') {
                // Filter out human messages - they should never be streamed
                if (eventData.role === 'human') {
                  this.logger.debug('Skipping human message chunk');
                  continue;
                }
                
                // Process assistant messages
                if (eventData.role === 'assistant' && eventData.content) {
                  if (!currentMessage || currentMessage.id !== eventData.id) {
                    // Create new message
                    currentMessage = {
                      id: eventData.id,
                      sender: 'agent',
                      content: '',
                      timestamp: new Date().toISOString()
                    };
                    accumulatedContent = ''; // Reset accumulator for new message
                  }
                  
                  // Accumulate content
                  accumulatedContent += eventData.content;
                  if (currentMessage) {
                    currentMessage.content = accumulatedContent;
                    (currentMessage as any).isStreaming = true;
                  }
                  
                  // Notify callbacks
                  callbacks.onChunk?.(eventData.content, eventData.id);
                  callbacks.onMessage?.(currentMessage as Message);
                }
                
                // Process tool messages (only in debug mode)
                if (eventData.role === 'tool') {
                  if (this.config.debug) {
                    const toolMessage: Message = {
                      id: eventData.id,
                      sender: 'agent',
                      content: typeof eventData.content === 'string' 
                        ? eventData.content 
                        : JSON.stringify(eventData.content, null, 2),
                      timestamp: new Date().toISOString(),
                      type: 'tool' as any
                    };
                    callbacks.onMessage?.(toolMessage);
                  } else {
                    this.logger.debug('Skipping tool message (debug mode disabled)');
                  }
                }
                
                // Process system messages (only in debug mode)
                if (eventData.role === 'system' && eventData.metadata?.debug) {
                  const systemMessage: Message = {
                    id: eventData.id,
                    sender: 'agent',
                    content: eventData.content,
                    timestamp: new Date().toISOString(),
                    type: 'system' as any
                  };
                  callbacks.onMessage?.(systemMessage);
                }
              } else if (eventData.type === 'done') {
                // Stream complete
                if (currentMessage) {
                  currentMessage.content = accumulatedContent;
                  (currentMessage as any).isStreaming = false;
                  callbacks.onMessage?.(currentMessage as Message);
                }
                this.logger.debug('Stream done event', eventData);
              } else if (eventData.type === 'error') {
                // Handle error
                const error = new Error(eventData.message || 'Stream error');
                callbacks.onError?.(error);
              }
              
            } catch (parseError) {
              this.logger.warn('Failed to parse event data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  /**
   * Abort the current stream
   */
  abort(): void {
    if (this.currentStream) {
      this.currentStream.abort();
      this.currentStream = null;
      this.logger.debug('Stream aborted');
    }
  }
  
  /**
   * Check if currently streaming
   */
  isStreaming(): boolean {
    return this.currentStream !== null;
  }
}
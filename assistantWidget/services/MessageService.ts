// MessageService.ts - Handles message processing, validation, and formatting
import type { Message } from '../types/types';
import { Logger } from '../utils/logger';

export interface ProcessedResponse {
  newMessages: Message[];
  totalCount: number;
}

/**
 * MessageService - Handles all message-related operations
 * 
 * Responsibilities:
 * - Message validation and processing
 * - Response filtering and deduplication
 * - Message ID generation
 * - Message formatting and preparation
 * - Content validation and sanitization
 */
export class MessageService {
  private logger: Logger;
  private apiUrl: string;

  constructor(apiUrl: string, debug?: boolean | import('../types/types').DebugConfig) {
    this.logger = new Logger(debug || false, '[MessageService]');
    this.apiUrl = apiUrl;
  }

  /**
   * Validate if a message object is properly formatted
   */
  validateMessage(msg: any): boolean {
    const isValid = (
      typeof msg === 'object' &&
      msg !== null &&
      'type' in msg &&
      'content' in msg &&
      (typeof msg.content === 'string' || Array.isArray(msg.content))
    );

    if (!isValid) {
      this.logger.warn('❌ Invalid message format:', msg);
    }

    return isValid;
  }

  /**
   * Extract content and attachments from message data
   */
  private extractMessageContent(msg: any): { content: string; attachments: any[] } {
    let content = '';
    let attachments: any[] = [];
    
    // Check for attachment_metadata field (API response format)
    if (msg.attachment_metadata && Array.isArray(msg.attachment_metadata)) {
      this.logger.debug('Found attachment_metadata in message:', msg.attachment_metadata);
      attachments = msg.attachment_metadata.map((meta: any) => ({
        file_id: meta.file_id,
        filename: meta.filename,
        file_type: meta.file_type || (meta.content_type?.startsWith('image/') ? 'image' : 'document'),
        mime_type: meta.content_type || meta.mime_type,
        size_bytes: meta.size_bytes || meta.size || 0,
        url: meta.url
      }));
    }
    
    // Check if content is an array (multimodal message with attachments)
    if (Array.isArray(msg.content)) {
      // Process multimodal content
      for (const item of msg.content) {
        if (item.type === 'text' && item.text) {
          content = item.text;
        } else if (item.type === 'image_url' && item.image_url) {
          // OpenAI/Gemini format
          const fileId = item.image_url.file_id;
          const baseUrl = item.image_url.thumbnail_url || item.image_url.url;
          
          // If no URL provided but we have file_id, construct it
          const url = baseUrl || (fileId && this.apiUrl ? `${this.apiUrl}/v2/agentman_runtime/files/${fileId}/download` : null);
          
          this.logger.debug('Processing image attachment:', {
            fileId,
            hasBaseUrl: !!baseUrl,
            constructedUrl: url,
            imageUrlData: item.image_url
          });
          
          attachments.push({
            file_id: fileId,
            filename: item.image_url.filename || `image_${fileId}`,
            file_type: 'image',
            mime_type: item.image_url.mime_type || 'image/jpeg',
            size_bytes: item.image_url.size || 0,
            url: url
          });
        } else if (item.type === 'image' && item.source) {
          // Anthropic format
          attachments.push({
            file_id: item.source.file_id,
            filename: item.source.filename,
            file_type: 'image',
            mime_type: item.source.mime_type,
            size_bytes: item.source.size,
            url: item.source.thumbnail_url
          });
        } else if (item.type === 'document' && item.source) {
          // Document format
          attachments.push({
            file_id: item.source.file_id,
            filename: item.source.filename,
            file_type: 'document',
            mime_type: item.source.mime_type,
            size_bytes: item.source.size,
            url: item.source.download_url
          });
        }
      }
    } else if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (msg.output) {
      content = msg.output;
    } else if (msg.text) {
      content = msg.text;
    }
    
    return { content, attachments };
  }

  /**
   * Process API response and extract new messages
   */
  processResponse(
    responseData: any[], 
    lastMessageCount: number, 
    existingMessages: Message[] = []
  ): ProcessedResponse {
    this.logger.verbose(`🔍 Processing response with ${responseData.length} messages, lastMessageCount=${lastMessageCount}`);

    if (!Array.isArray(responseData)) {
      this.logger.error('❌ Invalid response format - not an array:', responseData);
      return { newMessages: [], totalCount: lastMessageCount };
    }

    // Initialize lastMessageCount if undefined
    const currentCount = typeof lastMessageCount === 'undefined' ? 0 : lastMessageCount;

    // Get only the new messages that appear after the last known count
    const candidateMessages = responseData.slice(currentCount);
    this.logger.info(`🔄 Found ${candidateMessages.length} candidate messages`);

    // Get existing message contents for deduplication
    const existingContents = existingMessages.map(m => m.content.trim());

    const newMessages: Message[] = [];

    for (let i = 0; i < candidateMessages.length; i++) {
      const msg = candidateMessages[i];
      // Skip tool messages - they should not be displayed in the UI
      if (msg.type === 'tool') {
        this.logger.debug('⏭️ Skipping tool message');
        continue;
      }
      
      // Determine sender based on message type
      const sender = msg.type === 'ai' ? 'agent' : 'user';
      
      // Extract content and attachments
      const { content, attachments } = this.extractMessageContent(msg);
      const trimmedContent = content.trim();
      
      // Debug log for messages with attachments
      if (attachments.length > 0 || (msg.attachment_file_ids && msg.attachment_file_ids.length > 0)) {
        this.logger.info(`📎 Message ${i} (${sender}) has attachments:`, {
          attachmentCount: attachments.length,
          attachmentFileIds: msg.attachment_file_ids,
          attachments
        });
      }

      // Skip empty messages
      if (!trimmedContent && attachments.length === 0) {
        this.logger.debug('⏭️ Skipping empty message with no attachments');
        continue;
      }

      // For user messages, check if we need to update with attachments
      if (sender === 'user' && existingContents.includes(trimmedContent)) {
        // If this user message has attachments but our existing one doesn't, we should update it
        if (attachments.length > 0) {
          this.logger.info('📎 User message has attachments from API, will include for update');
          // Continue processing to update the message with attachments
        } else {
          this.logger.debug('⏭️ Skipping duplicate user message: ' + trimmedContent.substring(0, 30) + '...');
          continue;
        }
      }

      // Create processed message
      const processedMessage: Message = {
        id: msg.id ?? this.generateMessageId(),
        sender: sender,
        content: trimmedContent || (attachments.length > 0 ? '' : '...'), // Allow empty content if there are attachments
        timestamp: msg.timestamp || new Date().toISOString(),
        type: msg.type === 'text' ? 'text' : (msg.type || 'text'),
        attachments: attachments.length > 0 ? attachments : (msg.attachments || [])
      };

      newMessages.push(processedMessage);
      if (trimmedContent) {
        existingContents.push(trimmedContent); // Add to dedup list for subsequent messages
      }
      this.logger.info(`➕ Adding new ${sender} message` + (attachments.length > 0 ? ` with ${attachments.length} attachments` : ''));
      
      if (attachments.length > 0) {
        this.logger.debug('Message attachments:', attachments);
      }
    }

    const result = {
      newMessages,
      totalCount: responseData.length
    };
    
    return result;
  }

  /**
   * Process initial response (for welcome messages)
   */
  processInitialResponse(responseData: any[], lastMessageCount: number = 0): ProcessedResponse {
    this.logger.info('👋 Processing initial response');
    this.logger.verbose(`📊 Response data contains ${responseData.length} total messages`);
    this.logger.verbose(`📊 Current lastMessageCount: ${lastMessageCount}`);

    if (!Array.isArray(responseData)) {
      this.logger.error('❌ Invalid response format:', responseData);
      return { newMessages: [], totalCount: lastMessageCount };
    }

    const currentCount = typeof lastMessageCount === 'undefined' ? 0 : lastMessageCount;
    const newMessages: Message[] = [];

    // Get only the new messages that appear after the last known count
    const candidateMessages = responseData.slice(currentCount);
    this.logger.info(`💬 Processing ${candidateMessages.length} new messages from initial response (sliced from index ${currentCount})`);

    for (let i = 0; i < candidateMessages.length; i++) {
      const msg = candidateMessages[i];
      // Skip tool messages - they should not be displayed in the UI
      if (msg.type === 'tool') {
        this.logger.debug('⏭️ Skipping tool message in initial response');
        continue;
      }
      
      // Skip human messages since we already display them when sending
      if (msg.type !== 'ai') {
        this.logger.debug('⏭️ Skipping human message in initial response');
        continue;
      }

      // Extract content and attachments
      const { content, attachments } = this.extractMessageContent(msg);
      const trimmedContent = content.trim();
      
      // Debug log for messages with attachments
      if (attachments.length > 0 || (msg.attachment_file_ids && msg.attachment_file_ids.length > 0)) {
        this.logger.info(`📎 Initial message ${i} (agent) has attachments:`, {
          attachmentCount: attachments.length,
          attachmentFileIds: msg.attachment_file_ids,
          attachments
        });
      }
      
      if (trimmedContent) {
        this.logger.info(`➕ Adding welcome message to queue: "${trimmedContent.substring(0, 50)}..."`);
        
        newMessages.push({
          id: msg.id ?? this.generateMessageId(),
          sender: 'agent',
          content: trimmedContent,
          timestamp: new Date().toISOString(),
          type: 'text',
          attachments: attachments.length > 0 ? attachments : (msg.attachments || [])
        });
      }
    }

    const result = {
      newMessages,
      totalCount: responseData.length
    };
    
    return result;
  }

  /**
   * Create a user message object
   */
  createUserMessage(content: string, attachments: any[] = []): Message {
    return {
      id: this.generateMessageId(),
      sender: 'user',
      content: content,
      timestamp: new Date().toISOString(),
      type: 'text',
      attachments: attachments
    };
  }

  /**
   * Create an error message object
   */
  createErrorMessage(content: string): Message {
    return {
      id: this.generateMessageId(),
      sender: 'agent',
      content: `⚠️ ${content}`,
      timestamp: new Date().toISOString(),
      type: 'text',
      attachments: []
    };
  }

  /**
   * Generate a unique message ID
   */
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Filter messages by type
   */
  filterMessagesByType(messages: Message[], type: 'user' | 'agent'): Message[] {
    return messages.filter(msg => msg.sender === type);
  }

  /**
   * Get last N messages
   */
  getLastMessages(messages: Message[], count: number): Message[] {
    return messages.slice(-count);
  }

  /**
   * Sanitize message content (basic XSS prevention)
   */
  sanitizeContent(content: string): string {
    // Basic HTML escape - more sophisticated sanitization should be done by MessageRenderer
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Check if two messages have the same content (for deduplication)
   */
  isDuplicateContent(message1: Message, message2: Message): boolean {
    return message1.content.trim() === message2.content.trim() && 
           message1.sender === message2.sender;
  }

  /**
   * Get message statistics
   */
  getMessageStats(messages: Message[]): { userCount: number; agentCount: number; total: number } {
    const userCount = messages.filter(m => m.sender === 'user').length;
    const agentCount = messages.filter(m => m.sender === 'agent').length;
    
    return {
      userCount,
      agentCount,
      total: messages.length
    };
  }

  /**
   * Validate message content length
   */
  validateContentLength(content: string, maxLength: number = 10000): boolean {
    if (content.length > maxLength) {
      this.logger.warn(`❌ Message content too long: ${content.length} > ${maxLength}`);
      return false;
    }
    return true;
  }

  /**
   * Truncate message content if too long
   */
  truncateContent(content: string, maxLength: number = 10000): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    const truncated = content.substring(0, maxLength - 3) + '...';
    this.logger.warn(`✂️ Content truncated from ${content.length} to ${truncated.length} characters`);
    return truncated;
  }
}
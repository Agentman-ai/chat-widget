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

  constructor(debug?: boolean | import('../types/types').DebugConfig) {
    this.logger = new Logger(debug || false, '[MessageService]');
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
      typeof msg.content === 'string'
    );

    if (!isValid) {
      this.logger.warn('❌ Invalid message format:', msg);
    }

    return isValid;
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

    for (const msg of candidateMessages) {
      // Skip human messages since we already display them when sending
      if (msg.type !== 'ai') {
        this.logger.debug('⏭️ Skipping human message');
        continue;
      }

      const content = msg.content?.trim();

      // Skip empty messages
      if (!content) {
        this.logger.debug('⏭️ Skipping empty message');
        continue;
      }

      // Skip if this message content already exists
      if (existingContents.includes(content)) {
        this.logger.debug('⏭️ Skipping duplicate message: ' + content.substring(0, 30) + '...');
        continue;
      }

      // Validate message format
      if (this.validateMessage(msg)) {
        const processedMessage: Message = {
          id: msg.id ?? this.generateMessageId(),
          sender: 'agent',
          content: content,
          timestamp: msg.timestamp || new Date().toISOString(),
          type: msg.type === 'text' ? 'text' : (msg.type || 'text'),
          attachments: msg.attachments || []
        };

        newMessages.push(processedMessage);
        existingContents.push(content); // Add to dedup list for subsequent messages
        this.logger.info('➕ Adding new agent message');
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

    for (const msg of candidateMessages) {
      // Skip human messages since we already display them when sending
      if (msg.type !== 'ai') {
        this.logger.debug('⏭️ Skipping human message in initial response');
        continue;
      }

      if (this.validateMessage(msg) && msg.content.trim()) {
        const content = msg.content.trim();
        this.logger.info(`➕ Adding welcome message to queue: "${content.substring(0, 50)}..."`);
        
        newMessages.push({
          id: msg.id ?? this.generateMessageId(),
          sender: 'agent',
          content: content,
          timestamp: new Date().toISOString(),
          type: 'text',
          attachments: msg.attachments || []
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
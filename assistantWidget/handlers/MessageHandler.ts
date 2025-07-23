// MessageHandler.ts - Centralized message flow orchestration
import type { Message, ChatState } from '../types/types';
import type { StateManager } from '../StateManager';
import type { ViewManager } from '../components/ViewManager';
import type { PersistenceManager } from '../PersistenceManager';
import type { ApiService } from '../services/ApiService';
import type { MessageService } from '../services/MessageService';
import type { AgentService } from '../services/AgentService';
import type { ErrorHandler } from './ErrorHandler';
import type { EventBus } from '../utils/EventBus';
import { LoadingManager } from './LoadingManager';
import { Logger } from '../utils/logger';
import { createEvent } from '../types/events';

/**
 * MessageHandler - Orchestrates message flow and UI updates
 * 
 * This handler manages:
 * - Message sending flow
 * - Response processing
 * - Loading state management
 * - Message view updates
 * - Error handling for message operations
 */
export class MessageHandler {
  private logger: Logger;
  private lastMessageCount: number = 0;
  private isProcessingMessage: boolean = false;
  private loadingManager: LoadingManager;
  private currentLoadingOperation: string | null = null;
  
  constructor(
    private stateManager: StateManager,
    private viewManager: ViewManager,
    private apiService: ApiService,
    private messageService: MessageService,
    private agentService: AgentService,
    private errorHandler: ErrorHandler,
    private eventBus: EventBus,
    private persistenceManager: PersistenceManager | null,
    debug: boolean = false
  ) {
    this.logger = new Logger(debug, '[MessageHandler]');
    this.loadingManager = new LoadingManager(this.viewManager, this.eventBus, debug);
  }

  /**
   * Send a message through the complete flow
   */
  public async sendMessage(
    message: string,
    conversationId: string,
    config: {
      agentToken: string;
      clientMetadata?: any;
      attachmentUrls?: string[];
    }
  ): Promise<void> {
    // Prevent duplicate processing
    if (this.isProcessingMessage) {
      this.logger.warn('Already processing a message, ignoring duplicate request');
      return;
    }

    this.isProcessingMessage = true;

    try {
      // Create user message for the event, but only add it to view if there are no attachments
      const hasAttachments = config.attachmentUrls && config.attachmentUrls.length > 0;
      const userMessage = this.messageService.createUserMessage(message);
      
      if (!hasAttachments) {
        // No attachments - add user message locally for immediate feedback
        this.logger.debug('Creating user message without attachments:', userMessage);
        await this.addMessageToView(userMessage);
      } else {
        // Has attachments - skip local message, wait for API response
        this.logger.debug('User message has attachments, waiting for API response to display');
        this.logger.debug('Attachment URLs being sent:', config.attachmentUrls);
      }
      
      // Don't increment lastMessageCount here - we'll update it after API response
      this.logger.debug(`Current lastMessageCount: ${this.lastMessageCount} (not incrementing for user message)`);
      this.logger.debug(`Has attachments: ${hasAttachments}`);

      // Start loading operation
      this.currentLoadingOperation = this.loadingManager.startLoading('message_send', {
        message: 'Sending message...',
        timeout: 30000
      });

      // Emit message sent event
      this.eventBus.emit('message:sent', createEvent('message:sent', {
        message: userMessage,
        isFirstMessage: this.lastMessageCount === 0,
        source: 'MessageHandler'
      }));

      // Send message via API
      const apiResponse = await this.apiService.sendMessage({
        agentToken: config.agentToken,
        conversationId,
        userInput: message,
        clientMetadata: config.clientMetadata,
        forceLoad: false,
        attachmentUrls: config.attachmentUrls
      });

      // Complete loading operation
      if (this.currentLoadingOperation) {
        this.loadingManager.completeLoading(this.currentLoadingOperation, true);
        this.currentLoadingOperation = null;
      }

      // Process response
      if (apiResponse.response && Array.isArray(apiResponse.response)) {
        this.logger.debug('API Response received:', apiResponse.response);
        await this.handleApiResponse(apiResponse.response, conversationId);

        // Process agent metadata if available
        if (apiResponse.metadata) {
          this.logger.debug('Processing agent metadata');
          this.agentService.processCapabilities(apiResponse.metadata);
        }

        // Save messages if persistence is enabled
        this.saveConversation();
      } else {
        throw new Error('Invalid response format from agent');
      }
    } catch (error) {
      // Complete loading operation with error
      if (this.currentLoadingOperation) {
        this.loadingManager.completeLoading(
          this.currentLoadingOperation, 
          false, 
          error instanceof Error ? error : new Error(String(error))
        );
        this.currentLoadingOperation = null;
      }
      
      // Handle error
      const errorMessage = this.errorHandler.handleApiError(
        error instanceof Error ? error : new Error(String(error)),
        '/v2/agentman_runtime/agent',
        'sending message'
      );
      
      await this.addMessageToView(errorMessage);
    } finally {
      this.isProcessingMessage = false;
    }
  }

  /**
   * Process initial response (e.g., from agent initialization)
   */
  public async handleInitialResponse(responseData: any[]): Promise<void> {
    const result = this.messageService.processInitialResponse(responseData, this.lastMessageCount);
    
    // Add new messages to UI
    for (const message of result.newMessages) {
      await this.addMessageToView(message);
    }
    
    // Update message count to the total API response count
    this.lastMessageCount = result.totalCount;
    this.logger.debug(`Updated lastMessageCount to ${this.lastMessageCount} (total messages in API response)`);
  }

  /**
   * Handle API response with messages
   */
  public async handleApiResponse(responseData: any[], conversationId: string): Promise<void> {
    const currentMessages = this.stateManager.getState().messages;
    
    const result = this.messageService.processResponse(responseData, this.lastMessageCount, currentMessages);
    
    // Add new messages to UI
    for (const message of result.newMessages) {
      await this.addMessageToView(message);
      
      // Emit message received event
      this.eventBus.emit('message:received', createEvent('message:received', {
        messages: [message],
        totalCount: this.lastMessageCount,
        source: 'MessageHandler'
      }));
    }
    
    // Update message count to the total API response count
    this.lastMessageCount = result.totalCount;
    this.logger.debug(`Updated lastMessageCount to ${this.lastMessageCount} (total messages in API response)`);
  }

  /**
   * Add a message to the view and state
   */
  public async addMessageToView(message: Message): Promise<void> {
    // Add to state manager
    this.stateManager.addMessage(message);
    
    // Add to view
    if (this.viewManager) {
      await this.viewManager.addMessage(message);
    }
    
    // Mark for saving
    if (this.persistenceManager) {
      this.scheduleConversationSave();
    }
  }

  /**
   * Show loading indicator (delegated to LoadingManager)
   */
  public showLoadingIndicator(): void {
    if (!this.currentLoadingOperation) {
      this.currentLoadingOperation = this.loadingManager.startLoading('message_send');
    }
  }

  /**
   * Hide loading indicator (delegated to LoadingManager)
   */
  public hideLoadingIndicator(): void {
    if (this.currentLoadingOperation) {
      this.loadingManager.completeLoading(this.currentLoadingOperation, true);
      this.currentLoadingOperation = null;
    }
  }

  /**
   * Reset message count (e.g., when switching conversations)
   */
  public resetMessageCount(): void {
    this.lastMessageCount = 0;
    this.logger.debug('Reset message count to 0');
  }

  /**
   * Update message count (e.g., when loading conversation)
   */
  public setMessageCount(count: number): void {
    this.lastMessageCount = count;
    this.logger.debug(`Set message count to ${count}`);
  }

  /**
   * Get current message count
   */
  public getMessageCount(): number {
    return this.lastMessageCount;
  }

  /**
   * Check if currently processing a message
   */
  public isProcessing(): boolean {
    return this.isProcessingMessage;
  }

  /**
   * Clear all messages from view
   */
  public clearMessages(): void {
    this.viewManager?.clearMessages();
    this.resetMessageCount();
  }

  /**
   * Load messages into view (e.g., when switching conversations)
   */
  public loadMessages(messages: Message[]): void {
    
    // Clear existing messages
    this.clearMessages();
    
    // Add each message to view
    messages.forEach((message, index) => {
      this.viewManager?.addMessage(message);
    });
    
    // Update message count
    this.setMessageCount(messages.length);
  }

  /**
   * Handle prompt click from welcome screen
   */
  public async handlePromptClick(prompt: string, conversationId: string, config: any): Promise<void> {
    // Transition to conversation view if needed
    if (this.viewManager.getCurrentView() === 'welcome') {
      await this.viewManager.transitionToConversation();
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Send the prompt as a message
    await this.sendMessage(prompt, conversationId, config);
  }

  /**
   * Save conversation state
   */
  private saveConversation(): void {
    if (!this.persistenceManager) return;
    
    const result = this.persistenceManager.saveMessages();
    if (result.success) {
      this.logger.debug('Conversation saved successfully');
      
      // Emit conversation saved event
      this.eventBus.emit('conversation:saved', createEvent('conversation:saved', {
        conversationId: this.persistenceManager.getConversationId() || '',
        messageCount: this.stateManager.getState().messages.length,
        source: 'MessageHandler'
      }));
    } else {
      this.logger.warn('Failed to save conversation:', result.error);
    }
  }

  /**
   * Schedule conversation save with debouncing
   */
  private saveDebounceTimer: number | null = null;
  
  private scheduleConversationSave(): void {
    if (!this.persistenceManager) return;
    
    // Clear existing timer
    if (this.saveDebounceTimer) {
      window.clearTimeout(this.saveDebounceTimer);
    }
    
    // Schedule save after 1 second of inactivity
    this.saveDebounceTimer = window.setTimeout(() => {
      this.saveConversation();
    }, 1000);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    
    // Clean up loading manager
    this.loadingManager.destroy();
    
    this.isProcessingMessage = false;
    this.lastMessageCount = 0;
    this.currentLoadingOperation = null;
  }
}
// ConversationOrchestrator.ts - High-level conversation flow management
import type { ChatConfig, ChatState, Message } from '../types/types';
import type { StateManager } from '../StateManager';
import type { ViewManager } from '../components/ViewManager';
import type { PersistenceManager } from '../PersistenceManager';
import type { EventBus } from '../utils/EventBus';
import type { MessageHandler } from './MessageHandler';
import type { FileHandler } from './FileHandler';
import type { ErrorHandler } from './ErrorHandler';
import { Logger } from '../utils/logger';
import { createEvent } from '../types/events';

/**
 * ConversationOrchestrator - High-level conversation flow management
 * 
 * This orchestrator manages:
 * - Complete conversation lifecycles
 * - Multi-turn conversation flows
 * - Conversation state transitions
 * - Integration between message, file, and view handling
 * - Business logic for conversation management
 */
export class ConversationOrchestrator {
  private logger: Logger;
  private currentConversationId: string | null = null;
  private conversationStartTime: number | null = null;
  private messageCount: number = 0;

  constructor(
    private config: ChatConfig,
    private stateManager: StateManager,
    private viewManager: ViewManager,
    private messageHandler: MessageHandler,
    private fileHandler: FileHandler | null,
    private errorHandler: ErrorHandler,
    private eventBus: EventBus,
    private persistenceManager: PersistenceManager | null,
    debug: boolean = false
  ) {
    this.logger = new Logger(debug, '[ConversationOrchestrator]');
    this.setupEventListeners();
  }

  /**
   * Start a new conversation
   */
  public async startNewConversation(
    conversationId?: string,
    initialMessage?: string
  ): Promise<void> {
    this.logger.debug('Starting new conversation', { conversationId, hasInitialMessage: !!initialMessage });

    // Clear any existing messages first
    this.messageHandler.clearMessages();
    
    // Create new conversation in persistence manager if enabled
    if (this.persistenceManager && !conversationId) {
      
      // Create a new conversation and get its ID
      this.currentConversationId = this.persistenceManager.create('New chat');
      this.logger.debug('Created new conversation in persistence:', this.currentConversationId);
    } else {
      // Use provided ID or generate one (for non-persisted conversations)
      this.currentConversationId = conversationId || this.generateConversationId();
    }
    
    this.conversationStartTime = Date.now();
    this.messageCount = 0;

    // Update state
    const state = this.stateManager.getState();
    state.messages = [];
    state.hasStartedConversation = !!initialMessage;
    state.currentView = initialMessage ? 'conversation' : 'welcome';
    this.stateManager.updateState(state);

    // Transition to appropriate view
    if (initialMessage) {
      await this.viewManager.transitionToConversation();
      
      // Send initial message
      await this.sendMessage(initialMessage);
    } else {
      await this.viewManager.transitionToWelcome();
    }

    // Emit conversation started event
    this.eventBus.emit('conversation:started', createEvent('conversation:started', {
      conversationId: this.currentConversationId,
      hasInitialMessage: !!initialMessage,
      source: 'ConversationOrchestrator'
    }));
  }

  /**
   * Send a message in the current conversation
   */
  public async sendMessage(
    message: string,
    attachments?: string[]
  ): Promise<void> {
    // Start a new conversation if none exists
    if (!this.currentConversationId) {
      await this.startNewConversation(undefined, message);
      return; // startNewConversation will handle sending the message
    }

    this.logger.debug('Sending message', { 
      conversationId: this.currentConversationId, 
      messageLength: message.length,
      hasAttachments: !!attachments?.length
    });

    try {
      // Ensure we're in conversation view
      if (this.viewManager.getCurrentView() === 'welcome') {
        await this.viewManager.transitionToConversation();
        
        // Mark conversation as started
        const state = this.stateManager.getState();
        state.hasStartedConversation = true;
        state.currentView = 'conversation';
        this.stateManager.updateState(state);
      }

      // Check for file uploads in progress
      if (this.fileHandler?.isUploading()) {
        this.logger.warn('Files are still uploading, waiting...');
        // Could implement a wait or show user feedback
      }

      // Get attachment URLs if any files have been uploaded
      const attachmentUrls = this.fileHandler?.getUploadedFileUrls() || [];

      // Send message via MessageHandler
      await this.messageHandler.sendMessage(
        message,
        this.currentConversationId,
        {
          agentToken: this.config.agentToken,
          clientMetadata: this.gatherClientMetadata(),
          attachmentUrls
        }
      );

      // Clear uploaded files after sending message
      if (attachmentUrls.length > 0) {
        this.fileHandler?.clearAllAttachments();
      }

      // Increment message count
      this.messageCount++;

      // Auto-save conversation
      this.autoSaveConversation();

      // Emit message sent in conversation event
      this.eventBus.emit('conversation:message_sent', createEvent('conversation:message_sent', {
        conversationId: this.currentConversationId,
        messageCount: this.messageCount,
        hasAttachments: !!attachments?.length,
        source: 'ConversationOrchestrator'
      }));

    } catch (error) {
      this.logger.error('Failed to send message', error);
      
      // Handle error through ErrorHandler
      const errorMessage = this.errorHandler.handleApplicationError(
        'sending message',
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Add error message to view
      this.messageHandler.addMessageToView(errorMessage);
      
      // Emit conversation error event
      this.eventBus.emit('conversation:error', createEvent('conversation:error', {
        conversationId: this.currentConversationId,
        error: error instanceof Error ? error : new Error(String(error)),
        operation: 'send_message',
        source: 'ConversationOrchestrator'
      }));
      
      throw error;
    }
  }

  /**
   * Handle prompt click from welcome screen
   */
  public async handlePromptClick(prompt: string): Promise<void> {
    this.logger.debug('Handling prompt click', { prompt: prompt.substring(0, 50) + '...' });

    // Start new conversation if needed
    if (!this.currentConversationId) {
      await this.startNewConversation();
    }

    // Send the prompt as a message (sendMessage will handle view transition)
    await this.sendMessage(prompt);
  }

  /**
   * Load an existing conversation
   */
  public async loadConversation(conversationId: string): Promise<void> {
    this.logger.debug('Loading conversation', { conversationId });

    if (!this.persistenceManager) {
      throw new Error('Persistence not enabled');
    }

    try {
      // Save current conversation if it has changes
      if (this.currentConversationId && this.messageCount > 0) {
        this.persistenceManager.saveMessages();
      }

      // Switch to target conversation
      this.persistenceManager.switchTo(conversationId);
      
      // Load messages
      const messages = this.persistenceManager.loadMessages();
      
      // Update state
      this.currentConversationId = conversationId;
      this.messageCount = messages.length;
      this.conversationStartTime = messages.length > 0 && typeof messages[0].timestamp === 'number' ? messages[0].timestamp : Date.now();

      // Update UI
      if (messages.length > 0) {
        // Transition to conversation view and load messages
        await this.viewManager.transitionToConversation();
        
        this.messageHandler.loadMessages(messages);
        
        // Update state
        const state = this.stateManager.getState();
        state.hasStartedConversation = true;
        state.currentView = 'conversation';
        state.messages = messages;
        this.stateManager.updateState(state);
        
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          // Check if conversation view is actually visible
          const conversationView = this.viewManager.getElement('.am-conversation-view');
          if (conversationView) {
            conversationView.style.display = 'flex';
            conversationView.style.opacity = '1';
            conversationView.style.visibility = 'visible';
          }
          
          // Ensure messages container is visible
          const messagesContainer = this.viewManager.getElement('.am-chat-messages');
          if (messagesContainer) {
            // Force visibility by removing any animation classes or inline styles
            messagesContainer.style.display = 'flex'; // Explicitly set to flex instead of empty string
            messagesContainer.style.opacity = '1';
            messagesContainer.style.transform = 'none';
            messagesContainer.style.visibility = 'visible';
            messagesContainer.classList.remove('sliding-out');
            
            // Also check parent containers
            const inputContainer = this.viewManager.getElement('.am-chat-input-container');
            if (inputContainer) {
              inputContainer.style.display = 'flex';
              inputContainer.style.opacity = '1';
              inputContainer.style.transform = 'none';
              inputContainer.style.visibility = 'visible';
              inputContainer.classList.remove('sliding-out');
            }
            
            // Also ensure the input wrapper is visible
            const inputWrapper = this.viewManager.getElement('.am-chat-input-wrapper');
            if (inputWrapper) {
              inputWrapper.style.display = 'flex';
              inputWrapper.style.opacity = '1';
              inputWrapper.style.transform = 'none';
              inputWrapper.style.visibility = 'visible';
              inputWrapper.classList.remove('sliding-out');
            }
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Ensure main header is visible
            const mainHeader = this.viewManager.getHeaderElement();
            if (mainHeader) {
              mainHeader.style.display = 'flex';
              mainHeader.style.visibility = 'visible';
              mainHeader.style.opacity = '1';
            }
            
            // Focus the input after loading conversation
            this.viewManager.focusInput();
          }
        }, 100);
      } else {
        // Empty conversation - go to welcome screen
        await this.viewManager.transitionToWelcome();
        
        const state = this.stateManager.getState();
        state.hasStartedConversation = false;
        state.currentView = 'welcome';
        state.messages = [];
        this.stateManager.updateState(state);
      }

      // Emit conversation loaded event
      this.eventBus.emit('conversation:loaded', createEvent('conversation:loaded', {
        conversationId,
        messages,
        source: 'ConversationOrchestrator'
      }));

    } catch (error) {
      this.logger.error('Failed to load conversation', error);
      
      const errorMessage = this.errorHandler.handleStorageError(
        'load',
        error instanceof Error ? error : new Error(String(error)),
        conversationId
      );
      
      this.messageHandler.addMessageToView(errorMessage);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  public async deleteConversation(conversationId: string): Promise<void> {
    this.logger.debug('Deleting conversation', { conversationId });

    if (!this.persistenceManager) {
      throw new Error('Persistence not enabled');
    }

    try {
      // Delete the conversation
      this.persistenceManager.delete(conversationId);
      
      // If we deleted the current conversation, start a new one
      if (conversationId === this.currentConversationId) {
        await this.startNewConversation();
      }

      // Emit conversation deleted event
      this.eventBus.emit('conversation:deleted', createEvent('conversation:deleted', {
        conversationId,
        source: 'ConversationOrchestrator'
      }));

    } catch (error) {
      this.logger.error('Failed to delete conversation', error);
      
      const errorMessage = this.errorHandler.handleStorageError(
        'delete',
        error instanceof Error ? error : new Error(String(error)),
        conversationId
      );
      
      this.messageHandler.addMessageToView(errorMessage);
      throw error;
    }
  }

  /**
   * Clear current conversation and return to welcome screen
   */
  public async clearConversation(): Promise<void> {
    this.logger.debug('Clearing current conversation');

    // Clear attachments
    this.fileHandler?.clearAllAttachments();

    // Clear messages
    this.messageHandler.clearMessages();

    // Reset state
    const state = this.stateManager.getState();
    state.messages = [];
    state.hasStartedConversation = false;
    state.currentView = 'welcome';
    this.stateManager.updateState(state);

    // Transition to welcome screen
    await this.viewManager.transitionToWelcome();

    // Reset conversation tracking
    const oldConversationId = this.currentConversationId;
    this.currentConversationId = null;
    this.conversationStartTime = null;
    this.messageCount = 0;

    // Emit conversation cleared event
    if (oldConversationId) {
      this.eventBus.emit('conversation:cleared', createEvent('conversation:cleared', {
        conversationId: oldConversationId,
        source: 'ConversationOrchestrator'
      }));
    }
  }

  /**
   * Get current conversation info
   */
  public getConversationInfo(): {
    id: string | null;
    messageCount: number;
    startTime: number | null;
    duration: number | null;
  } {
    const duration = this.conversationStartTime 
      ? Date.now() - this.conversationStartTime 
      : null;

    return {
      id: this.currentConversationId,
      messageCount: this.messageCount,
      startTime: this.conversationStartTime,
      duration
    };
  }

  /**
   * Check if there's an active conversation
   */
  public hasActiveConversation(): boolean {
    return !!this.currentConversationId && this.messageCount > 0;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for message sent events to update count
    this.eventBus.on('message:sent', () => {
      // MessageHandler already handles message adding, we just track count
      this.autoSaveConversation();
    });

    // Listen for conversation switching requests
    this.eventBus.on('conversation:switch_requested', (event) => {
      this.loadConversation(event.conversationId);
    });

    // Listen for conversation deletion requests
    this.eventBus.on('conversation:delete_requested', (event) => {
      this.deleteConversation(event.conversationId);
    });

    // Listen for new conversation requests
    this.eventBus.on('conversation:new_requested', () => {
      this.startNewConversation();
    });
  }

  /**
   * Auto-save conversation if persistence is enabled
   */
  private autoSaveConversation(): void {
    if (this.persistenceManager && this.currentConversationId) {
      
      const result = this.persistenceManager.saveMessages();
      if (result.success) {
        this.logger.debug('Conversation auto-saved');
      } else {
        this.logger.warn('Failed to auto-save conversation:', result.error);
      }
    } else {
    }
  }

  /**
   * Gather client metadata for API calls
   */
  private gatherClientMetadata(): any {
    return {
      conversationId: this.currentConversationId,
      messageCount: this.messageCount,
      sessionDuration: this.conversationStartTime 
        ? Date.now() - this.conversationStartTime 
        : 0,
      currentView: this.viewManager.getCurrentView(),
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
  }

  /**
   * Generate a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.logger.debug('Destroying ConversationOrchestrator');
    
    // Auto-save current conversation
    this.autoSaveConversation();
    
    // Reset state
    this.currentConversationId = null;
    this.conversationStartTime = null;
    this.messageCount = 0;
  }
}

// Extend event registry with conversation orchestrator events
declare module '../types/events' {
  interface EventTypeRegistry {
    'conversation:started': {
      conversationId: string;
      hasInitialMessage: boolean;
      source: string;
      timestamp: number;
    };
    'conversation:message_sent': {
      conversationId: string;
      messageCount: number;
      hasAttachments: boolean;
      source: string;
      timestamp: number;
    };
    'conversation:error': {
      conversationId: string;
      error: Error;
      operation: string;
      source: string;
      timestamp: number;
    };
    'conversation:deleted': {
      conversationId: string;
      source: string;
      timestamp: number;
    };
    'conversation:switch_requested': {
      conversationId: string;
      source: string;
      timestamp: number;
    };
    'conversation:delete_requested': {
      conversationId: string;
      source: string;
      timestamp: number;
    };
    'conversation:new_requested': {
      source: string;
      timestamp: number;
    };
  }
}
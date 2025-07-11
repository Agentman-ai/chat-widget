// MessageHandler.ts - Handles all message-related operations
import type { Message, ChatState, ClientMetadata, FileAttachment } from '../types/types';
import { StateManager } from '../StateManager';
import { UIManager } from '../components/UIManager';
import { MessageRenderer } from '../message-renderer/message-renderer';
import { ValidationUtils } from '../utils/validation';
import { Logger } from '../utils/logger';
import { loadingIcon } from '../assets/icons';
import type { PersistenceManager } from '../PersistenceManager';
import type { FileUploadManager } from '../FileUploadManager';

export interface MessageHandlerConfig {
  apiUrl: string;
  websiteName: string;
  conversationId?: string;
  enableAttachments?: boolean;
  debug?: boolean | import('../types/types').DebugConfig;
}

export class MessageHandler {
  private logger: Logger;
  private loadingMessageElement: HTMLElement | null = null;
  private loadingAnimationInterval: number | null = null;
  private currentLoadingStateIndex: number = 0;
  private lastMessageCount: number = 0;
  private isSending: boolean = false;
  
  // Loading animation states
  private loadingStates = ['.', '..', '...'];

  constructor(
    private config: MessageHandlerConfig,
    private stateManager: StateManager,
    private uiManager: UIManager,
    private messageRenderer: MessageRenderer,
    private persistenceManager?: PersistenceManager,
    private fileUploadManager?: FileUploadManager
  ) {
    this.logger = new Logger(config.debug || false, '[MessageHandler]');
  }

  /**
   * Handle sending a message from the input
   */
  public async handleSendMessage(clientMetadata?: ClientMetadata): Promise<void> {
    const input = this.uiManager.getElement('.am-chat-input') as HTMLTextAreaElement;
    if (!input || this.isSending) return;

    const message = input.value.trim();
    if (!message) {
      // For now, we require at least a message
      return;
    }

    // Set sending state
    this.isSending = true;
    input.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    try {
      await this.sendMessage(message, clientMetadata);
    } catch (error) {
      this.logger.error('Error sending message:', error);
      this.addErrorMessage('Failed to send message. Please try again.');
    } finally {
      this.isSending = false;
      input.disabled = false;
      input.focus();
    }
  }

  /**
   * Send message to the API
   */
  public async sendMessage(message: string, clientMetadata?: ClientMetadata): Promise<void> {
    const conversationId = this.config.conversationId || this.persistenceManager?.getCurrentId();
    if (!conversationId) {
      throw new Error('No conversation ID available');
    }

    // Create user message
    const userMessage: Message = {
      id: this.generateMessageId(),
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text',
      attachments: []
    };

    // Add message to UI
    this.addMessage(userMessage);

    // Show loading indicator
    this.showLoadingIndicator();

    try {
      // Prepare request data
      const requestData: any = {
        website_name: this.config.websiteName,
        conversation_id: conversationId,
        messages: this.stateManager.getState().messages
      };

      // Add client metadata if available
      if (clientMetadata && Object.keys(clientMetadata).length > 0) {
        requestData.client_metadata = clientMetadata;
      }

      // File upload would be handled separately
      // This is simplified for the refactoring example

      // Make API request
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      await this.handleResponse(data);

    } catch (error) {
      this.logger.error('Error in sendMessage:', error);
      this.hideLoadingIndicator();
      this.addErrorMessage('Failed to connect to the server. Please try again.');
    } finally {
      // Cleanup would be handled by the parent widget
    }
  }

  /**
   * Handle response from the API
   */
  public async handleResponse(responseData: any[]): Promise<void> {
    this.hideLoadingIndicator();

    if (!Array.isArray(responseData)) {
      this.logger.error('Invalid response format:', responseData);
      this.addErrorMessage('Invalid response from server');
      return;
    }

    // Process messages
    const newMessages = responseData.slice(this.lastMessageCount);
    
    for (const msg of newMessages) {
      if (this.isValidMessage(msg)) {
        const newMessage: Message = {
          id: msg.id || this.generateMessageId(),
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString(),
          type: msg.type || 'text',
          attachments: msg.attachments
        };
        this.addMessage(newMessage);
      }
    }

    // Update message count
    this.lastMessageCount = responseData.length;
    this.logger.debug(`Updated lastMessageCount to ${this.lastMessageCount}`);

    // Save messages if persistence is enabled
    if (this.persistenceManager) {
      const result = this.persistenceManager.saveMessages();
      if (!result.success) {
        this.logger.warn('Failed to save messages after response');
      }
    }

    // Note: This should not return responseData
    // The handler only processes messages, not returns them
  }

  /**
   * Add error message to chat
   */
  public addErrorMessage(content: string): void {
    const errorMessage: Message = {
      id: this.generateMessageId(),
      sender: 'agent',
      content: `⚠️ ${content}`,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    this.addMessage(errorMessage);
  }

  /**
   * Show loading indicator
   */
  public showLoadingIndicator(): void {
    const messagesContainer = this.uiManager.getElement('.am-chat-messages');
    if (!messagesContainer) return;

    this.hideLoadingIndicator();

    this.loadingMessageElement = document.createElement('div');
    this.loadingMessageElement.className = 'am-message agent loading';
    this.loadingMessageElement.innerHTML = `
      <div class="am-message-role">Assistant</div>
      <div class="am-message-content">
        <span class="am-loading-icon">${loadingIcon}</span>
        <span class="am-loading-text">Thinking${this.loadingStates[0]}</span>
      </div>
    `;

    messagesContainer.appendChild(this.loadingMessageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Start loading animation
    this.currentLoadingStateIndex = 0;
    this.loadingAnimationInterval = window.setInterval(() => {
      if (this.loadingMessageElement) {
        const loadingText = this.loadingMessageElement.querySelector('.am-loading-text');
        if (loadingText) {
          this.currentLoadingStateIndex = (this.currentLoadingStateIndex + 1) % this.loadingStates.length;
          loadingText.textContent = `Thinking${this.loadingStates[this.currentLoadingStateIndex]}`;
        }
      }
    }, 500);
  }

  /**
   * Hide loading indicator
   */
  public hideLoadingIndicator(): void {
    if (this.loadingAnimationInterval) {
      clearInterval(this.loadingAnimationInterval);
      this.loadingAnimationInterval = null;
    }
    
    if (this.loadingMessageElement) {
      this.loadingMessageElement.remove();
      this.loadingMessageElement = null;
    }
  }

  /**
   * Reset message count (for conversation switches)
   */
  public resetMessageCount(): void {
    this.lastMessageCount = 0;
  }

  /**
   * Set message count (for restoring conversations)
   */
  public setMessageCount(count: number): void {
    this.lastMessageCount = count;
  }

  /**
   * Get current message count
   */
  public getMessageCount(): number {
    return this.lastMessageCount;
  }

  /**
   * Validate message object
   */
  private isValidMessage(msg: any): boolean {
    return msg && 
           typeof msg.sender === 'string' && 
           typeof msg.content === 'string' &&
           msg.content.trim() !== '';
  }

  /**
   * Add message to UI (delegate to parent)
   */
  private addMessage(message: Message): void {
    // This will be called on the parent ChatWidget
    // For now, we emit an event that ChatWidget can listen to
    this.stateManager.addMessage(message);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.hideLoadingIndicator();
  }
}
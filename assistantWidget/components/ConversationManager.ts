// ConversationManager.ts - Manages multiple conversations with UI controls
import type { ChatConfig, ChatTheme } from '../types/types';
import type { ConversationMeta } from '../PersistenceManager';
import * as icons from '../assets/icons';
import { Logger } from '../utils/logger';

/**
 * ConversationManager - Handles multiple conversation management
 * 
 * This component provides:
 * - Conversation list view (replaces chat messages)
 * - New conversation creation
 * - Conversation switching
 * - Conversation deletion
 * - Integration with PersistenceManager
 */
export class ConversationManager {
  private logger: Logger;
  private config: ChatConfig;
  private theme: ChatTheme;
  private element: HTMLElement | null = null;
  private isListViewOpen: boolean = false;
  private sourceView: 'welcome' | 'conversation' | null = null;

  // Event handlers
  private boundNewConversationHandler?: () => void;
  private boundSwitchConversationHandler?: (conversationId: string) => void;
  private boundDeleteConversationHandler?: (conversationId: string) => void;
  private boundToggleListViewHandler?: () => void;

  constructor(
    config: ChatConfig,
    theme: ChatTheme,
    eventHandlers: {
      onNewConversation?: () => void;
      onSwitchConversation?: (conversationId: string) => void;
      onDeleteConversation?: (conversationId: string) => void;
      onToggleListView?: () => void;
    }
  ) {
    this.config = config;
    this.theme = theme;
    this.logger = new Logger(config.debug || false, "[ConversationManager]");

    // Bind event handlers
    this.boundNewConversationHandler = eventHandlers.onNewConversation;
    this.boundSwitchConversationHandler = eventHandlers.onSwitchConversation;
    this.boundDeleteConversationHandler = eventHandlers.onDeleteConversation;
    this.boundToggleListViewHandler = eventHandlers.onToggleListView;
  }

  /**
   * Create conversation list view (replaces messages area)
   */
  public createConversationListView(): HTMLElement {
    this.element = document.createElement('div');
    this.element.className = 'am-conversation-list-view';
    this.element.style.display = 'none'; // Hidden by default
    
    this.element.innerHTML = this.generateConversationListTemplate();
    this.attachEventListeners();
    
    return this.element;
  }

  /**
   * Update conversation list display
   */
  public updateConversationList(conversations: ConversationMeta[], currentId?: string): void {
    if (!this.element) return;

    const listContainer = this.element.querySelector('.am-conversation-list');
    if (!listContainer) return;

    if (conversations.length === 0) {
      listContainer.innerHTML = `
        <div class="am-conversation-empty">
          <p>No conversations yet</p>
          <button class="am-conversation-new-button">Start new conversation</button>
        </div>
      `;
      
      // Attach event listener to the new button
      const newButton = listContainer.querySelector('.am-conversation-new-button');
      if (newButton) {
        newButton.addEventListener('click', () => {
          if (this.boundNewConversationHandler) {
            this.boundNewConversationHandler();
          }
        });
      }
      return;
    }

    listContainer.innerHTML = conversations.map(conv => `
      <div class="am-conversation-item ${conv.id === currentId ? 'active' : ''}" 
           data-conversation-id="${conv.id}">
        <div class="am-conversation-info">
          <div class="am-conversation-title">${this.escapeHtml(conv.title)}</div>
          <div class="am-conversation-date">${this.formatDate(conv.lastUpdated)}</div>
        </div>
        <div class="am-conversation-actions">
          <button class="am-conversation-delete" 
                  data-conversation-id="${conv.id}"
                  title="Delete conversation">
            ${icons.close2}
          </button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    this.attachConversationListeners();
  }

  /**
   * Check if the list view is currently open
   */
  public isOpen(): boolean {
    return this.isListViewOpen;
  }

  /**
   * Close the list view if it's open (without triggering toggle callback)
   */
  public closeListView(): void {
    if (this.isListViewOpen) {
      this.isListViewOpen = false;
      
      if (this.element) {
        this.element.classList.remove('sliding-in');
        this.element.classList.add('sliding-out');
        
        setTimeout(() => {
          if (this.element) {
            this.element.style.display = 'none';
            this.element.classList.remove('sliding-out');
          }
        }, 300);
      }
    }
  }

  /**
   * Show/hide conversation list view with animations
   */
  public toggleListView(source?: 'welcome' | 'conversation'): void {
    if (!this.element) {
      this.logger.error('Cannot toggle list view - element is null');
      return;
    }

    this.isListViewOpen = !this.isListViewOpen;
    
    if (this.isListViewOpen) {
      // Store where we came from when opening
      if (source) {
        this.sourceView = source;
      }
      
      // Opening animation
      this.element.style.display = 'flex';
      this.element.classList.remove('closing');
      this.element.classList.add('opening');
    } else {
      // Closing animation
      this.element.classList.remove('opening');
      this.element.classList.add('closing');
      
      // Hide after animation completes
      setTimeout(() => {
        if (!this.isListViewOpen) { // Check if still closed
          this.element!.style.display = 'none';
          this.element!.classList.remove('closing');
        }
      }, 300); // Match CSS transition duration
    }

    if (this.boundToggleListViewHandler) {
      this.boundToggleListViewHandler();
    }
  }

  /**
   * Get the source view that opened the conversation list
   */
  public getSourceView(): 'welcome' | 'conversation' | null {
    return this.sourceView;
  }

  /**
   * Check if list view is open
   */
  public isListViewActive(): boolean {
    return this.isListViewOpen;
  }

  /**
   * Add conversation management button to header (hamburger menu)
   */
  public addConversationButton(headerElement: HTMLElement, hasConversations: boolean = false): void {
    if (!hasConversations) {
      return; // Don't show if no past conversations
    }

    // Don't add the button if we're already in list view
    if (this.isListViewOpen) {
      return;
    }

    // Check if button already exists
    const existingButton = headerElement.querySelector('.am-conversation-toggle');
    if (existingButton) {
      return;
    }
    const conversationButton = document.createElement('button');
    conversationButton.className = 'am-conversation-toggle am-chat-header-button am-header-button-with-text';
    conversationButton.title = 'Conversation History';
    conversationButton.innerHTML = `
      ${icons.chatHistory}
      <span class="am-button-label">Chats</span>
      <span class="am-conversation-indicator"></span>
    `;
    
    conversationButton.addEventListener('click', () => {
      this.toggleListView('conversation');
    });

    // Insert in the header actions container as the first button
    const headerActions = headerElement.querySelector('.am-chat-header-actions');
    const firstButton = headerActions?.querySelector('.am-chat-header-button');
    
    if (headerActions && firstButton) {
      headerActions.insertBefore(conversationButton, firstButton);
    } else if (headerActions) {
      headerActions.appendChild(conversationButton);
    }
  }

  /**
   * Add new conversation button to header actions (always visible)
   */
  public addNewConversationButton(headerElement: HTMLElement): void {
    // Check if button already exists
    const existingButton = headerElement.querySelector('.am-conversation-new-header');
    if (existingButton) {
      return;
    }
    
    const newButton = document.createElement('button');
    newButton.className = 'am-conversation-new-header am-chat-header-button am-header-button-with-text';
    newButton.title = 'New conversation';
    newButton.innerHTML = `
      ${icons.plus2}
      <span class="am-button-label">New</span>
    `;
    // Always visible - no display style needed
    
    newButton.addEventListener('click', () => {
      if (this.boundNewConversationHandler) {
        this.boundNewConversationHandler();
      }
    });

    // Insert in the header actions container, before the expand button
    const headerActions = headerElement.querySelector('.am-chat-header-actions');
    const expandButton = headerActions?.querySelector('.am-chat-expand');
    
    if (headerActions && expandButton) {
      headerActions.insertBefore(newButton, expandButton);
    } else if (headerActions) {
      headerActions.appendChild(newButton);
    }
  }

  /**
   * Add a vertical divider in the header actions
   */
  public addHeaderDivider(headerElement: HTMLElement): void {
    const divider = document.createElement('div');
    divider.className = 'am-header-divider';
    
    const headerActions = headerElement.querySelector('.am-chat-header-actions');
    const expandButton = headerActions?.querySelector('.am-chat-expand');
    
    if (headerActions && expandButton) {
      headerActions.insertBefore(divider, expandButton);
    }
  }


  /**
   * Add back button to header (legacy compatibility - stub method)
   */
  public addBackButton(headerElement: HTMLElement): void {
    // This method is no longer needed with separate headers
    // Kept for legacy ChatWidget.ts compatibility
  }

  /**
   * Update header button visibility (legacy compatibility - stub method)
   */
  public updateHeaderButtons(headerElement: HTMLElement): void {
    // This method is no longer needed with separate headers
    // Kept for legacy ChatWidget.ts compatibility
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.removeEventListeners();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  /**
   * Generate the conversation list template with its own header
   */
  private generateConversationListTemplate(): string {
    return `
      <div class="am-conversation-list-header">
        <div class="am-conversation-list-header-content">
          <div class="am-conversation-list-header-left">
            <button class="am-conversation-back am-chat-header-button" title="Back to chat">
              ${icons.arrowLeft}
            </button>
            <div class="am-chat-logo-title">
              <span>Conversations</span>
            </div>
          </div>
          <div class="am-conversations-header-actions">
            <button class="am-conversation-new-list am-chat-header-button am-header-button-with-text" title="New conversation">
              ${icons.plus2}
              <span class="am-button-label">New</span>
            </button>
            <button class="am-chat-minimize-list am-chat-header-button" title="Minimize chat">
              ${icons.minimize}
            </button>
          </div>
        </div>
      </div>
      <div class="am-conversation-list-container">
        <div class="am-conversation-list">
          <!-- Conversation list will be populated here -->
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners for the header buttons and conversation items
   */
  private attachEventListeners(): void {
    if (!this.element) return;
    
    // Back button
    const backButton = this.element.querySelector('.am-conversation-back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.toggleListView();
      });
    }
    
    // New conversation button
    const newButton = this.element.querySelector('.am-conversation-new-list');
    if (newButton) {
      newButton.addEventListener('click', () => {
        if (this.boundNewConversationHandler) {
          this.boundNewConversationHandler();
        }
      });
    }
    
    // Minimize button
    const minimizeButton = this.element.querySelector('.am-chat-minimize-list');
    if (minimizeButton) {
      minimizeButton.addEventListener('click', () => {
        // Trigger the same minimize action as the main header
        const mainMinimizeButton = document.querySelector('.am-chat-minimize') as HTMLElement;
        if (mainMinimizeButton) {
          mainMinimizeButton.click();
        }
      });
    }
    
    // Event listeners for conversation items will be attached in attachConversationListeners
  }

  /**
   * Attach event listeners to conversation list items
   */
  private attachConversationListeners(): void {
    if (!this.element) return;

    // Conversation item clicks (for switching)
    const conversationItems = this.element.querySelectorAll('.am-conversation-item');
    conversationItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on delete button
        if ((e.target as HTMLElement).closest('.am-conversation-delete')) {
          return;
        }
        
        const conversationId = item.getAttribute('data-conversation-id');
        if (conversationId && this.boundSwitchConversationHandler) {
          // Switch to the conversation (handleSwitchConversation will close the list)
          this.boundSwitchConversationHandler(conversationId);
        }
      });
    });

    // Delete buttons
    const deleteButtons = this.element.querySelectorAll('.am-conversation-delete');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering conversation switch
        
        const conversationId = button.getAttribute('data-conversation-id');
        if (conversationId && this.boundDeleteConversationHandler) {
          // Confirm deletion
          if (confirm('Are you sure you want to delete this conversation?')) {
            this.boundDeleteConversationHandler(conversationId);
          }
        }
      });
    });
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    // Event listeners will be automatically removed when element is destroyed
  }

  /**
   * Format date for display
   */
  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
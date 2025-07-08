// ConversationManager.ts - Manages multiple conversations with UI controls
import type { ChatConfig, ChatTheme } from '../types/types';
import type { ConversationMeta } from '../PersistenceManager';
import * as icons from '../assets/icons';

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
  private config: ChatConfig;
  private theme: ChatTheme;
  private element: HTMLElement | null = null;
  private isListViewOpen: boolean = false;

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
   * Show/hide conversation list view with animations
   */
  public toggleListView(): void {
    if (!this.element) return;

    this.isListViewOpen = !this.isListViewOpen;
    
    if (this.isListViewOpen) {
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

    const conversationButton = document.createElement('button');
    conversationButton.className = 'am-conversation-toggle am-chat-header-button';
    conversationButton.title = 'View conversations';
    conversationButton.innerHTML = icons.chatHistory;
    
    conversationButton.addEventListener('click', () => {
      this.toggleListView();
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
    const newButton = document.createElement('button');
    newButton.className = 'am-conversation-new-header am-chat-header-button';
    newButton.title = 'New conversation';
    newButton.innerHTML = icons.plus2;
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
   * Add back button to header (when in list view)
   */
  public addBackButton(headerElement: HTMLElement): void {
    const backButton = document.createElement('button');
    backButton.className = 'am-conversation-back am-chat-header-button';
    backButton.title = 'Back to chat';
    backButton.innerHTML = icons.arrowLeft;
    backButton.style.display = this.isListViewOpen ? 'block' : 'none';
    
    backButton.addEventListener('click', () => {
      this.toggleListView();
    });

    // Insert at the beginning
    const headerContent = headerElement.querySelector('.am-chat-header-content');
    if (headerContent) {
      headerContent.insertBefore(backButton, headerContent.firstChild);
    }
  }

  /**
   * Update header button visibility
   */
  public updateHeaderButtons(headerElement: HTMLElement): void {
    const conversationButton = headerElement.querySelector('.am-conversation-toggle') as HTMLElement;
    const backButton = headerElement.querySelector('.am-conversation-back') as HTMLElement;
    const newButton = headerElement.querySelector('.am-conversation-new-header') as HTMLElement;
    
    // Chat view: [☰] Logo Title [+] [×]
    // History view: [←] Conversations [×]
    
    if (conversationButton) {
      conversationButton.style.display = this.isListViewOpen ? 'none' : 'block';
    }
    
    if (backButton) {
      backButton.style.display = this.isListViewOpen ? 'block' : 'none';
    }

    // New chat button is always visible in both views
    // No need to change its visibility
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
   * Generate the conversation list template (no header since new button is in main header)
   */
  private generateConversationListTemplate(): string {
    return `
      <div class="am-conversation-list-container">
        <div class="am-conversation-list">
          <!-- Conversation list will be populated here -->
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners (no panel event listeners needed - button is in header)
   */
  private attachEventListeners(): void {
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
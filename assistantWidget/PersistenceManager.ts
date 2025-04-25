// PersistenceManager.ts
import type { Message, PersistenceConfig } from './types/types';
import { StateManager } from './StateManager';

export interface StoredData {
  version: number;
  messages: Message[];
  conversationId?: string;
  timestamp: number;
}

export class PersistenceManager {
  private config: PersistenceConfig;
  private stateManager: StateManager;
  private containerId: string;
  private conversationId: string | null = null;

  constructor(config: PersistenceConfig, stateManager: StateManager, containerId: string) {
    this.config = {
      enabled: config.enabled === true, // Convert to boolean
      days: config.days || 7,
      key: config.key
    };
    this.stateManager = stateManager;
    this.containerId = containerId;
  }

  /**
   * Set the conversation ID for storage
   */
  public setConversationId(id: string): void {
    this.conversationId = id;
  }

  /**
   * Get the conversation ID from storage if available
   */
  public getConversationId(): string | null {
    try {
      if (!this.config.enabled) return null;
      
      const raw = localStorage.getItem(this.getStorageKey());
      if (!raw) return null;
      
      const data = JSON.parse(raw) as StoredData;
      return data.conversationId || null;
    } catch (e) {
      console.error('[PersistenceManager] Error getting conversation ID:', e);
      return null;
    }
  }

  /**
   * Load messages from localStorage
   */
  public loadMessages(): Message[] {
    try {
      if (!this.config.enabled) return [];
      
      const key = this.getStorageKey();
      console.log(`[PersistenceManager] Loading messages from localStorage key: ${key}`);
      
      const raw = localStorage.getItem(key);
      if (!raw) {
        console.log('[PersistenceManager] No saved messages found');
        return [];
      }
      
      const data = JSON.parse(raw) as StoredData;
      
      // Check for expiration
      const expiryMs = (this.config.days || 7) * 86400000; // days to ms with default
      if (Date.now() - data.timestamp > expiryMs) {
        console.log(`[PersistenceManager] Stored messages expired (${this.config.days} days), removing`);
        localStorage.removeItem(key);
        return [];
      }
      
      // Store conversation ID for later use
      if (data.conversationId) {
        this.conversationId = data.conversationId;
        console.log(`[PersistenceManager] Found stored conversation ID: ${data.conversationId}`);
      }
      
      // Return messages
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        console.log(`[PersistenceManager] Loaded ${data.messages.length} messages from storage`);
        return data.messages;
      }
      
      return [];
    } catch (e) {
      console.error('[PersistenceManager] Error loading messages:', e);
      return [];
    }
  }

  /**
   * Save messages to localStorage
   */
  public saveMessages(): void {
    try {
      if (!this.config.enabled) return;
      
      const key = this.getStorageKey();
      const msgs = this.stateManager.getState().messages;
      
      const payload: StoredData = {
        version: 1,
        messages: msgs,
        timestamp: Date.now()
      };
      
      // Include conversation ID if available
      if (this.conversationId) {
        payload.conversationId = this.conversationId;
      }
      
      localStorage.setItem(key, JSON.stringify(payload));
      console.log(`[PersistenceManager] Saved ${msgs.length} messages to localStorage key: ${key}`);
    } catch (e) {
      console.error('[PersistenceManager] Error saving messages:', e);
    }
  }

  /**
   * Clear stored messages
   */
  public clearStorage(): void {
    try {
      const key = this.getStorageKey();
      localStorage.removeItem(key);
      console.log('[PersistenceManager] Storage cleared');
    } catch (e) {
      console.error('[PersistenceManager] Error clearing storage:', e);
    }
  }

  /**
   * Get the storage key for this widget instance
   */
  public getStorageKey(): string {
    return this.config.key || `chatwidget_${this.containerId}_data`;
  }
}

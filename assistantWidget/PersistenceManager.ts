// PersistenceManager.ts
import { generateId } from "./utils/id-generator";
import type { Message, AgentMetadata } from "./types/types";
import type { PersistenceError, PersistenceResult, PersistenceEventCallback, StorageInfo, PersistenceEvent } from "./types/persistence-types";
import { StateManager } from "./StateManager";
import { Logger } from "./utils/logger";

export interface ConversationMeta {
  id: string;
  title: string;
  lastUpdated: number;
  metadata?: AgentMetadata;
}

interface IndexPayload {
  version: 2;
  conversations: ConversationMeta[];
  currentId?: string;
}

interface ConversationPayload {
  version: 2;
  messages: Message[];
  timestamp: number;
  metadata?: AgentMetadata;
}

export class PersistenceManager {
  private logger: Logger;
  private eventCallbacks: PersistenceEventCallback[] = [];
  private inMemoryFallback: Map<string, any> = new Map();
  private useInMemoryFallback: boolean = false;
  
  constructor(
    private containerId: string,
    private stateManager: StateManager,
    private enabled = true,
    debugConfig?: boolean | import('./types/types').DebugConfig,
  ) {
    this.logger = new Logger(debugConfig || false, "[PersistenceManager]");
    this.checkStorageAvailability();
  }

  /* ——— Event Management ——— */
  public onPersistenceEvent(callback: PersistenceEventCallback): void {
    this.eventCallbacks.push(callback);
  }
  
  private emitEvent(type: PersistenceEvent['type'], error?: PersistenceError, details?: any): void {
    const event = { type, error, details };
    this.eventCallbacks.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        this.logger.error('Error in persistence event callback:', e);
      }
    });
  }

  /* ——— Storage Availability ——— */
  private checkStorageAvailability(): void {
    try {
      const testKey = `chatwidget_test_${Date.now()}`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.useInMemoryFallback = false;
    } catch (error) {
      this.logger.warn('localStorage not available, using in-memory fallback:', error);
      this.useInMemoryFallback = true;
      this.emitEvent('save_failed', {
        type: 'ACCESS_DENIED',
        message: 'localStorage is not available. Chat history will not persist across sessions.',
        originalError: error as Error,
        recoverable: false
      });
    }
  }

  /* ——— helpers ——— */
  private get indexKey() {return `chatwidget_${this.containerId}_index`;}
  private convKey = (id: string) => `chatwidget_${this.containerId}_conv_${id}`;
  
  // Public method to get storage key for debugging
  public getStorageKey(): string {
    const currentId = this.getCurrentId();
    return currentId ? this.convKey(currentId) : this.indexKey;
  }

  private readIndex(): IndexPayload {
    try {
      if (this.useInMemoryFallback) {
        const data = this.inMemoryFallback.get(this.indexKey);
        return data ? JSON.parse(data) : { version: 2, conversations: [] };
      }
      const raw = localStorage.getItem(this.indexKey);
      return raw ? JSON.parse(raw) : { version: 2, conversations: [] };
    } catch (error) {
      this.logger.error('Failed to read index:', error);
      return { version: 2, conversations: [] };
    }
  }
  
  private writeIndex(ix: IndexPayload): boolean {
    try {
      const data = JSON.stringify(ix);
      if (this.useInMemoryFallback) {
        this.inMemoryFallback.set(this.indexKey, data);
        return true;
      }
      localStorage.setItem(this.indexKey, data);
      return true;
    } catch (error) {
      this.handleStorageError(error as Error);
      return false;
    }
  }
  
  private handleStorageError(error: Error): PersistenceError {
    let errorType: PersistenceError['type'] = 'UNKNOWN_ERROR';
    let recoverable = false;
    
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      errorType = 'QUOTA_EXCEEDED';
      recoverable = true;
    } else if (error.name === 'SecurityError') {
      errorType = 'ACCESS_DENIED';
    } else if (error instanceof SyntaxError) {
      errorType = 'PARSE_ERROR';
    }
    
    const persistenceError: PersistenceError = {
      type: errorType,
      message: this.getErrorMessage(errorType),
      originalError: error,
      recoverable
    };
    
    this.emitEvent('save_failed', persistenceError);
    this.logger.error(`Storage error (${errorType}):`, error);
    
    return persistenceError;
  }
  
  private getErrorMessage(errorType: PersistenceError['type']): string {
    switch (errorType) {
      case 'QUOTA_EXCEEDED':
        return 'Storage quota exceeded. Please clear some chat history to continue saving.';
      case 'ACCESS_DENIED':
        return 'Storage access denied. Chat history will not be saved.';
      case 'PARSE_ERROR':
        return 'Corrupted data detected. Some chat history may be lost.';
      case 'INVALID_STATE':
        return 'Invalid storage state. Please refresh the page.';
      default:
        return 'An error occurred while saving chat history.';
    }
  }

  /* ——— public API ——— */
  list() {return this.readIndex().conversations.sort((a,b)=>b.lastUpdated - a.lastUpdated);}  
  getCurrentId() {return this.readIndex().currentId;}

  create(initialTitle = "New chat") {
    const id = generateId();
    const meta: ConversationMeta = { id, title: initialTitle, lastUpdated: Date.now() };
    
    const ix = this.readIndex();
    
    ix.conversations.unshift(meta);
    
    // Automatically limit conversations to prevent storage issues
    const maxConversations = 10; // Keep a reasonable limit to prevent storage issues
    if (ix.conversations.length > maxConversations) {
      this.logger.debug(`Conversation limit exceeded (${ix.conversations.length}), cleaning up old conversations`);
      
      // Keep only the most recent conversations
      const toRemove = ix.conversations.slice(maxConversations);
      ix.conversations = ix.conversations.slice(0, maxConversations);
      
      // Clean up old conversation data
      toRemove.forEach(conv => {
        try {
          localStorage.removeItem(this.convKey(conv.id));
          this.logger.debug(`Removed old conversation: ${conv.id}`);
        } catch (e) {
          this.logger.warn(`Failed to remove old conversation ${conv.id}:`, e);
        }
      });
    }
    
    ix.currentId = id;
    this.writeIndex(ix);

    const payload: ConversationPayload = {
      version: 2,
      messages: [],
      timestamp: Date.now(),
    };
    
    try {
      localStorage.setItem(this.convKey(id), JSON.stringify(payload));
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.logger.warn('Storage quota exceeded, attempting cleanup');
        this.clearOldConversations(5);
        
        // Retry after cleanup
        try {
          localStorage.setItem(this.convKey(id), JSON.stringify(payload));
        } catch (retryError) {
          this.logger.error('Failed to create conversation even after cleanup:', retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }
    
    return id;
  }

  switchTo(id: string) {
    this.logger.debug(`🔄 switchTo(${id}) called`);
    const ix = this.readIndex();
    
    if (!ix.conversations.find(c => c.id === id)) {
      this.logger.debug(`❌ switchTo() failed - unknown conversation id: ${id}`);
      throw new Error("unknown conversation id");
    }
    
    // Only update currentId, don't touch lastUpdated
    ix.currentId = id;
    this.logger.debug(`✅ switchTo() - setting currentId to ${id}`);
    this.writeIndex(ix);
  }

  delete(id: string) {
    localStorage.removeItem(this.convKey(id));
    const ix = this.readIndex();
    ix.conversations = ix.conversations.filter(c => c.id !== id);
    if (ix.currentId === id) ix.currentId = ix.conversations[0]?.id;
    this.writeIndex(ix);
  }

  loadMessages(): Message[] {
    const id = this.getCurrentId();
    if (!id) {
      return [];
    }
    
    try {
      const key = this.convKey(id);
      const raw = localStorage.getItem(key);
      
      if (!raw) return [];
      
      const payload = this.parseAndValidatePayload(raw);
      return payload?.messages || [];
    } catch (error) {
      this.logger.error('Failed to load messages:', error);
      return [];
    }
  }

  loadMetadata(): AgentMetadata | null {
    const id = this.getCurrentId();
    if (!id) return null;
    
    try {
      const raw = localStorage.getItem(this.convKey(id));
      if (!raw) return null;
      
      const payload = this.parseAndValidatePayload(raw);
      return payload?.metadata || null;
    } catch (error) {
      this.logger.error('Failed to load metadata:', error);
      return null;
    }
  }

  saveMetadata(metadata: AgentMetadata) {
    this.logger.debug('💾 saveMetadata() called', metadata);
    if (!this.enabled) {
      this.logger.debug('⏭️ saveMetadata() aborted - persistence not enabled');
      return;
    }
    
    const id = this.getCurrentId();
    if (!id) {
      this.logger.debug('⏭️ saveMetadata() aborted - no current conversation ID');
      return;
    }

    try {
      this.saveMetadataAtomic(id, metadata);
    } catch (error) {
      this.logger.error('Failed to save metadata:', error);
    }
  }
  
  /**
   * Atomically save metadata to prevent corruption
   */
  private saveMetadataAtomic(id: string, metadata: AgentMetadata): void {
    const key = this.convKey(id);
    
    // Get current payload safely
    let payload: ConversationPayload;
    const existingRaw = localStorage.getItem(key);
    
    if (existingRaw) {
      payload = this.parseAndValidatePayload(existingRaw) || this.createDefaultPayload();
    } else {
      payload = this.createDefaultPayload();
      payload.messages = this.stateManager.getState().messages;
    }
    
    // Update metadata
    payload.metadata = metadata;
    payload.timestamp = Date.now();
    
    // Save atomically
    const serialized = JSON.stringify(payload);
    localStorage.setItem(key, serialized);
    
    // Update index
    this.updateIndexMetadata(id, metadata);
    
    this.logger.debug('✅ Metadata saved atomically');
  }
  
  /**
   * Update index with metadata
   */
  private updateIndexMetadata(id: string, metadata: AgentMetadata): void {
    try {
      const ix = this.readIndex();
      const meta = ix.conversations.find(c => c.id === id);
      if (meta) {
        meta.metadata = metadata;
        this.writeIndex(ix);
      }
    } catch (error) {
      this.logger.error('Failed to update index metadata:', error);
    }
  }

  saveMessages(): PersistenceResult {
    this.logger.debug('📝 saveMessages() called');
    
    if (!this.enabled) {
      this.logger.debug('⏭️ saveMessages() aborted - persistence not enabled');
      return { success: true }; // Not an error, just disabled
    }
    
    const id = this.getCurrentId();
    
    if (!id) {
      this.logger.debug('⏭️ saveMessages() aborted - no current conversation ID');
      return { success: false, error: {
        type: 'INVALID_STATE',
        message: 'No active conversation',
        recoverable: true
      }};
    }

    const msgs = this.stateManager.getState().messages;
    this.logger.debug(`📊 Current messages count: ${msgs.length}`);
    const key = this.convKey(id);
    
    // Check if messages have changed before saving
    let existingRaw: string | null = null;
    if (this.useInMemoryFallback) {
      existingRaw = this.inMemoryFallback.get(key) || null;
    } else {
      existingRaw = localStorage.getItem(key);
    }
    const existingMsgs = existingRaw ? (JSON.parse(existingRaw) as ConversationPayload).messages : [];
    this.logger.debug(`📊 Existing messages count: ${existingMsgs.length}`);
    
    // More thorough comparison - check if messages are actually different
    // Don't just compare lengths as duplicate messages might have same length
    let hasChanges = existingMsgs.length !== msgs.length;
    
    if (!hasChanges && msgs.length > 0) {
      // If same length, check if content is different
      for (let i = 0; i < msgs.length; i++) {
        if (!existingMsgs[i] || 
            existingMsgs[i].content !== msgs[i].content ||
            existingMsgs[i].sender !== msgs[i].sender) {
          hasChanges = true;
          break;
        }
      }
    }
    
    if (!hasChanges) {
      this.logger.debug('⏭️ saveMessages() aborted - no changes detected');
      return { success: true };
    }
    
    this.logger.debug('💾 Saving messages - changes detected');
    
    // Preserve existing metadata when saving messages
    let existingMetadata: AgentMetadata | undefined;
    if (existingRaw) {
      try {
        const existingPayload = this.parseAndValidatePayload(existingRaw);
        existingMetadata = existingPayload?.metadata;
      } catch (error) {
        this.logger.warn('Failed to parse existing metadata, continuing without it:', error);
      }
    }
    
    const payload: ConversationPayload = { 
      version: 2, 
      messages: msgs, 
      timestamp: Date.now(),
      metadata: existingMetadata
    };
    
    try {
      const data = JSON.stringify(payload);
      if (this.useInMemoryFallback) {
        this.inMemoryFallback.set(key, data);
      } else {
        localStorage.setItem(key, data);
      }
    } catch (error) {
      const persistenceError = this.handleStorageError(error as Error);
      return { success: false, error: persistenceError };
    }

    // Update index meta only when messages have changed
    const ix = this.readIndex();
    const m = ix.conversations.find(c => c.id === id);
    if (m) {
      m.lastUpdated = payload.timestamp;
      
      // Update title based on first user message
      const firstUserMsg = msgs.find(m => m.sender === "user");
      if (firstUserMsg) {
        // Trim to a reasonable length and add ellipsis if needed
        const content = firstUserMsg.content.trim();
        m.title = content.length > 25 ? content.slice(0, 25) + '...' : content;
      } else if (m.title === "New chat" && msgs.length > 0) {
        // If there's no user message but there are agent messages and title is still default
        m.title = "Chat with Agentman";
      }
      
      const success = this.writeIndex(ix);
      if (!success) {
        this.logger.warn('Failed to update conversation index');
      }
    }
    
    return { success: true };
  }

  /* ——— legacy migration (single‑chat ⇒ multi) ——— */
  migrateLegacy() {
    const legacyKey = `chatwidget_${this.containerId}_data`;
    const old = localStorage.getItem(legacyKey);
    if (!old) return;

    try {
      const { messages } = JSON.parse(old);
      const id = this.create("Imported chat");
      localStorage.setItem(
        this.convKey(id),
        JSON.stringify(<ConversationPayload>{ version: 2, messages, timestamp: Date.now() }),
      );
      localStorage.removeItem(legacyKey);
    } catch (e) {
      this.logger.error("Error migrating legacy data:", e);
    }
  }

  // Legacy compatibility methods
  setConversationId(id: string): void {
    this.switchTo(id);
  }
  
  getConversationId(): string | null {
    return this.getCurrentId() || null;
  }
  
  clearStorage(): void {
    const id = this.getCurrentId();
    if (id) this.delete(id);
  }
  
  /**
   * Safely parse and validate conversation payload
   */
  private parseAndValidatePayload(raw: string): ConversationPayload | null {
    try {
      const data = JSON.parse(raw);
      
      // Validate payload structure
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid payload format');
      }
      
      // Validate required fields
      if (typeof data.version !== 'number' || data.version !== 2) {
        throw new Error('Invalid or unsupported payload version');
      }
      
      if (!Array.isArray(data.messages)) {
        throw new Error('Invalid messages format');
      }
      
      if (typeof data.timestamp !== 'number') {
        throw new Error('Invalid timestamp format');
      }
      
      return data as ConversationPayload;
    } catch (error) {
      this.logger.warn('Failed to parse conversation payload:', error);
      
      // Emit corrupted data event for telemetry
      this.emitEvent('corrupted_data', {
        type: 'PARSE_ERROR',
        message: 'Failed to parse conversation payload',
        originalError: error as Error,
        recoverable: true
      }, {
        rawDataLength: raw.length,
        errorMessage: (error as Error).message
      });
      
      return null;
    }
  }
  
  /**
   * Create default conversation payload
   */
  private createDefaultPayload(): ConversationPayload {
    return {
      version: 2,
      messages: [],
      timestamp: Date.now()
    };
  }
  
  /**
   * Get storage usage information
   */
  public async getStorageInfo(): Promise<StorageInfo> {
    try {
      // Calculate current usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`chatwidget_${this.containerId}`)) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
      
      // Try to get quota information (Chrome/Edge)
      let quota: number | undefined;
      let available: number | undefined;
      
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          quota = estimate.quota;
          available = estimate.quota ? estimate.quota - (estimate.usage || 0) : undefined;
        } catch (e) {
          this.logger.debug('Could not estimate storage quota:', e);
        }
      }
      
      return {
        used,
        quota,
        available,
        percentUsed: quota ? (used / quota) * 100 : undefined
      };
    } catch (error) {
      this.logger.error('Failed to get storage info:', error);
      return { used: 0 };
    }
  }
  
  /**
   * Clear old conversations to free up space
   */
  public clearOldConversations(keepCount: number = 5): PersistenceResult<number> {
    try {
      const conversations = this.list();
      if (conversations.length <= keepCount) {
        return { success: true };
      }
      
      // Keep the most recent conversations
      const toDelete = conversations.slice(keepCount);
      let deletedCount = 0;
      
      for (const conv of toDelete) {
        try {
          this.delete(conv.id);
          deletedCount++;
        } catch (e) {
          this.logger.warn(`Failed to delete conversation ${conv.id}:`, e);
        }
      }
      
      this.logger.info(`Cleared ${deletedCount} old conversations`);
      return { success: true, data: deletedCount };
    } catch (error) {
      return { 
        success: false, 
        error: {
          type: 'UNKNOWN_ERROR',
          message: 'Failed to clear old conversations',
          originalError: error as Error,
          recoverable: false
        }
      };
    }
  }
}

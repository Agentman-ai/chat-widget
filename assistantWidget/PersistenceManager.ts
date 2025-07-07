// PersistenceManager.ts
import { v4 as uuid } from "uuid";
import type { Message, AgentMetadata } from "./types/types";
import { StateManager } from "./StateManager";

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
  constructor(
    private containerId: string,
    private stateManager: StateManager,
    private enabled = true,
  ) {}

  /* ——— helpers ——— */
  private get indexKey() {return `chatwidget_${this.containerId}_index`;}
  private convKey = (id: string) => `chatwidget_${this.containerId}_conv_${id}`;

  private readIndex(): IndexPayload {
    const raw = localStorage.getItem(this.indexKey);
    return raw ? JSON.parse(raw) : { version: 2, conversations: [] };
  }
  private writeIndex(ix: IndexPayload) {
    localStorage.setItem(this.indexKey, JSON.stringify(ix));
  }

  /* ——— public API ——— */
  list() {return this.readIndex().conversations.sort((a,b)=>b.lastUpdated - a.lastUpdated);}  
  getCurrentId() {return this.readIndex().currentId;}

  create(initialTitle = "New chat") {
    const id = uuid();
    const meta: ConversationMeta = { id, title: initialTitle, lastUpdated: Date.now() };
    const ix = this.readIndex();
    ix.conversations.unshift(meta);
    ix.currentId = id;
    this.writeIndex(ix);

    const payload: ConversationPayload = {
      version: 2,
      messages: [],
      timestamp: Date.now(),
    };
    localStorage.setItem(this.convKey(id), JSON.stringify(payload));
    return id;
  }

  switchTo(id: string) {
    console.log(`🔄 switchTo(${id}) called`);
    const ix = this.readIndex();
    if (!ix.conversations.find(c => c.id === id)) {
      console.log(`❌ switchTo() failed - unknown conversation id: ${id}`);
      throw new Error("unknown conversation id");
    }
    
    // Only update currentId, don't touch lastUpdated
    ix.currentId = id;
    console.log(`✅ switchTo() - setting currentId to ${id}`);
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
    if (!id) return [];
    
    try {
      const raw = localStorage.getItem(this.convKey(id));
      if (!raw) return [];
      
      const payload = this.parseAndValidatePayload(raw);
      return payload?.messages || [];
    } catch (error) {
      console.error('Failed to load messages:', error);
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
      console.error('Failed to load metadata:', error);
      return null;
    }
  }

  saveMetadata(metadata: AgentMetadata) {
    console.log('💾 saveMetadata() called', metadata);
    if (!this.enabled) {
      console.log('⏭️ saveMetadata() aborted - persistence not enabled');
      return;
    }
    
    const id = this.getCurrentId();
    if (!id) {
      console.log('⏭️ saveMetadata() aborted - no current conversation ID');
      return;
    }

    try {
      this.saveMetadataAtomic(id, metadata);
    } catch (error) {
      console.error('Failed to save metadata:', error);
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
    
    console.log('✅ Metadata saved atomically');
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
      console.error('Failed to update index metadata:', error);
    }
  }

  saveMessages() {
    console.log('📝 saveMessages() called');
    if (!this.enabled) {
      console.log('⏭️ saveMessages() aborted - persistence not enabled');
      return;
    }
    
    const id = this.getCurrentId();
    if (!id) {
      console.log('⏭️ saveMessages() aborted - no current conversation ID');
      return;
    }

    const msgs = this.stateManager.getState().messages;
    console.log(`📊 Current messages count: ${msgs.length}`);
    const key = this.convKey(id);
    
    // Check if messages have changed before saving
    const existingRaw = localStorage.getItem(key);
    const existingMsgs = existingRaw ? (JSON.parse(existingRaw) as ConversationPayload).messages : [];
    console.log(`📊 Existing messages count: ${existingMsgs.length}`);
    
    // Compare message lengths as a quick check
    // If they're the same length, we'll assume no changes (optimization)
    if (existingMsgs.length === msgs.length && existingMsgs.length > 0) {
      console.log('⏭️ saveMessages() aborted - no changes detected');
      return;
    }
    
    console.log('💾 Saving messages - changes detected');
    
    // Preserve existing metadata when saving messages
    let existingMetadata: AgentMetadata | undefined;
    if (existingRaw) {
      try {
        const existingPayload = this.parseAndValidatePayload(existingRaw);
        existingMetadata = existingPayload?.metadata;
      } catch (error) {
        console.warn('Failed to parse existing metadata, continuing without it:', error);
      }
    }
    
    const payload: ConversationPayload = { 
      version: 2, 
      messages: msgs, 
      timestamp: Date.now(),
      metadata: existingMetadata
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save messages:', error);
      throw error;
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
      
      this.writeIndex(ix);
    }
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
      console.error("Error migrating legacy data:", e);
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
      console.warn('Failed to parse conversation payload:', error);
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
}

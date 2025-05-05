// PersistenceManager.ts
import { v4 as uuid } from "uuid";
import type { Message } from "./types/types";
import { StateManager } from "./StateManager";

export interface ConversationMeta {
  id: string;
  title: string;
  lastUpdated: number;
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
    const raw = localStorage.getItem(this.convKey(id));
    return raw ? (JSON.parse(raw) as ConversationPayload).messages : [];
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
    
    const payload: ConversationPayload = { version: 2, messages: msgs, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));

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
}

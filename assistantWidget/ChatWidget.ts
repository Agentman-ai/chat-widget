// ChatWidget.ts - Refactored component-based chat widget
import type { ChatConfig, Message, ChatState, ChatTheme, ChatAssets, ClientMetadata, AgentMetadata } from './types/types';
import { PersistenceManager } from './PersistenceManager';
import { FileUploadManager } from './FileUploadManager';
import { ConfigManager } from './ConfigManager';
import { StateManager } from './StateManager';
import { StyleManager } from './styles/style-manager';
import { MessageRenderer } from './message-renderer/message-renderer';
import { UIManager } from './components/UIManager';
import { ConversationManager } from './components/ConversationManager';
import { ClientMetadataCollector } from './utils/client-metadata';
import { ValidationUtils } from './utils/validation';
import { OfflineParser } from './message-renderer/offline-parser';
import { Logger } from './utils/logger';
import * as icons from './assets/icons';
import { UI_CONSTANTS, API_CONSTANTS, STORAGE_CONSTANTS } from './constants';

/**
 * ChatWidget - Component-based chat widget with modern architecture
 * 
 * This class serves as the main coordinator for all chat widget functionality,
 * delegating specific responsibilities to focused component classes.
 */
export class ChatWidget {
  // Track instances by containerId
  private static instances: Map<string, ChatWidget> = new Map();

  // Core properties
  private config: ChatConfig;
  private state: ChatState;
  private element!: HTMLElement;
  private containerId: string;
  private conversationId: string;
  private theme: ChatTheme;
  private assets: ChatAssets;

  // Existing managers (reused from original)
  private configManager!: ConfigManager;
  private stateManager!: StateManager;
  private messageRenderer!: MessageRenderer;
  private fileUploadManager!: FileUploadManager;
  private styleManager!: StyleManager;
  private persistenceManager: PersistenceManager | null = null;

  // Component managers
  private uiManager!: UIManager;
  private conversationManager!: ConversationManager;

  // Logger instance
  private logger!: Logger;

  // Runtime state
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private isOffline: boolean = false;
  private lastMessageCount: number = 0;
  private hasUserStartedConversation: boolean = false;
  private isFreshConversation: boolean = true; // New flag to track if this is a truly fresh conversation

  // Agent capabilities (extracted from API metadata)
  private supportedMimeTypes: string[] = [];
  private supportsAttachments: boolean = false;
  private agentCapabilities: any = null;
  
  // Client metadata
  private clientMetadata: ClientMetadata = {};

  // Timer handles
  private promptTimer: number | null = null;
  private floatingPromptTimer: number | null = null;
  private resizeTimeout: number | null = null;
  private resizeDebounceTimeout: number | null = null;
  private loadingAnimationInterval: number | null = null;

  // Loading states
  private loadingMessageElement: HTMLElement | null = null;
  private currentLoadingStateIndex: number = 0;
  
  // Unload handler
  private boundUnloadHandler?: (event: BeforeUnloadEvent) => string | undefined;
  private hasUnsavedChanges: boolean = false;
  private saveDebounceTimer: number | null = null;

  constructor(config: ChatConfig & { containerId: string }) {
    // Initialize logger first
    this.logger = new Logger(config.debug, '[ChatWidget]');
    this.logger.info('🚀 ChatWidget initializing...');
    
    this.containerId = config.containerId;

    // Check for existing instance with this containerId
    const existingInstance = ChatWidget.instances.get(this.containerId);
    if (existingInstance) {
      existingInstance.destroy();
    }

    // Store the new instance
    ChatWidget.instances.set(this.containerId, this);

    // Initialize configuration and state
    this.config = this.mergeWithDefaultConfig(config);
    this.theme = this.initializeTheme();
    this.assets = this.initializeAssets();
    this.state = {
      isOpen: config.initiallyOpen || false,
      isExpanded: false,
      isInitialized: false,
      isSending: false,
      messages: [],
      error: undefined,
      pendingAttachments: [],
      isUploadingFiles: false
    };

    // Initialize managers
    this.initializeManagers();

    // Initialize conversation ID
    this.conversationId = this.generateUUID();

    // Initialize persistence if enabled
    if (this.config.persistence?.enabled) {
      this.initializePersistence();
    }

    // Start initialization process
    this.init();
  }

  /**
   * Initialize all manager components
   */
  private initializeManagers(): void {
    this.stateManager = new StateManager(this.state);
    this.stateManager.subscribe(this.handleStateChange.bind(this));

    this.configManager = new ConfigManager(this.config);
    this.messageRenderer = new MessageRenderer();
    this.fileUploadManager = new FileUploadManager(
      this.config.apiUrl,
      this.config.agentToken,
      this.conversationId
    );

    this.styleManager = new StyleManager(this.config.variant);

    // Initialize UI manager with event handlers
    this.uiManager = new UIManager(
      this.config,
      this.theme,
      this.assets,
      this.containerId,
      {
        onToggle: this.toggleChat.bind(this),
        onSend: this.handleSendMessage.bind(this),
        onInputKey: this.handleInputKeypress.bind(this),
        onResize: this.handleResize.bind(this),
        onExpand: this.handleExpandClick.bind(this),
        onPromptClick: this.handlePromptClick.bind(this),
        onAttachmentClick: this.handleAttachmentClick.bind(this),
        onFileSelect: this.handleFileSelect.bind(this),
        onAttachmentRemove: this.handleAttachmentRemove.bind(this)
      }
    );

    // Initialize conversation manager
    this.conversationManager = new ConversationManager(
      this.config,
      this.theme,
      {
        onNewConversation: this.handleNewConversation.bind(this),
        onSwitchConversation: this.handleSwitchConversation.bind(this),
        onDeleteConversation: this.handleDeleteConversation.bind(this),
        onToggleListView: this.handleToggleListView.bind(this)
      }
    );
  }

  /**
   * Initialize persistence manager
   */
  private initializePersistence(): void {
    this.persistenceManager = new PersistenceManager(
      this.containerId,
      this.stateManager,
      true, // enabled
      this.config.debug // pass debug config
    );
    
    // Listen for persistence errors
    this.persistenceManager.onPersistenceEvent((event) => {
      if (event.type === 'save_failed' && event.error) {
        this.handlePersistenceError(event.error);
      } else if (event.type === 'quota_warning') {
        this.showQuotaWarning();
      }
    });
    
    // Migrate any legacy data
    this.persistenceManager.migrateLegacy();
    
    // Get the first conversation ID or create a new one
    const firstId = this.persistenceManager.getCurrentId() ?? this.persistenceManager.create();
    this.conversationId = firstId;
  }

  /**
   * Main initialization method
   */
  async init(): Promise<void> {
    try {
      this.logger.info('📦 ChatAgent loading dependencies...');
      await this.loadDependencies();
      this.isOffline = false;
    } catch (error) {
      this.logger.warn('Failed to load dependencies:', error);
      this.fallbackToOfflineMode();
    }

    // Always initialize, regardless of online/offline status
    this.initialize();
  
    // Fetch agent capabilities after initialization (only if attachments are enabled)
    if (this.config.enableAttachments) {
      this.fetchAgentCapabilities();
    }

    // Set up beforeunload handler to save messages on page exit
    this.setupUnloadHandler();

    this.logger.debug('✅ ChatWidget initialized successfully');
  }

  /**
   * Load external dependencies (marked.js)
   */
  private async loadDependencies(): Promise<void> {
    // TODO: Move to DependencyLoader component
    if (window.marked) {
      this.configureMarked();
      return;
    }

    // For now, use simple fallback
    this.fallbackToOfflineMode();
  }

  /**
   * Configure marked.js when available
   */
  private configureMarked(): void {
    if (window.marked) {
      window.marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false,
        sanitize: true
      });
    }
  }

  /**
   * Fallback to offline mode without marked.js
   */
  private fallbackToOfflineMode(): void {
    this.isOffline = true;
    // Use enhanced offline parser instead of basic text processing
    window.marked = {
      setOptions: () => { },
      parse: (text: string) => OfflineParser.parse(text)
    };
  }

  /**
   * Initialize the widget UI and functionality
   */
  private initialize(): void {
    if (this.isInitialized) return;

    this.logger.info('🎨 ChatWidget creating UI...');
    
    // Step 1: Initialize UI
    this.initializeUI();
    
    // Step 2: Initialize markdown processing
    this.initializeMarkdownProcessing();
    
    // Step 3: Collect client metadata
    this.initializeClientMetadata();

    // Step 4: Setup conversation management
    if (this.persistenceManager) {
      this.setupConversationManagement();
    }

    // Step 5: Restore or initialize conversation
    const shouldInitChat = this.restoreOrInitializeConversation();

    if (shouldInitChat) {
      this.initializeChat();
    }

    // Step 6: Final UI updates
    this.finalizeInitialization();
  }

  /**
   * Initialize UI components
   */
  private initializeUI(): void {
    this.styleManager.injectStyles();
    this.element = this.uiManager.createAndMount();
  }

  /**
   * Initialize markdown processing
   */
  private initializeMarkdownProcessing(): void {
    // Fallback to offline mode since we don't load CDN
    this.fallbackToOfflineMode();
  }

  /**
   * Initialize client metadata collection
   */
  private initializeClientMetadata(): void {
    if (this.config.collectClientMetadata === false) {
      if (this.config.clientMetadata) {
        // Use only the provided metadata without auto-collection
        this.clientMetadata = this.config.clientMetadata;
        this.logger.verbose('📋 Using provided client metadata:', this.clientMetadata);
      }
      return;
    }

    // Collect basic metadata synchronously
    this.clientMetadata = ClientMetadataCollector.collect(this.config.clientMetadata);
    this.logger.verbose('🔍 Collected client metadata:', this.clientMetadata);
    
    // Optionally collect IP address asynchronously
    if (this.config.collectIPAddress) {
      this.collectIPAddressAsync();
    }
  }

  /**
   * Asynchronously collect IP address and geolocation
   */
  private collectIPAddressAsync(): void {
    this.logger.info('🌐 Fetching IP address and geolocation...');
    const currentMetadata = { ...this.clientMetadata };
    
    ClientMetadataCollector.collectWithIP(this.config.clientMetadata)
      .then(metadataWithIP => {
        this.mergeIPMetadata(metadataWithIP, currentMetadata);
      })
      .catch(error => {
        this.logger.warn('⚠️ Failed to fetch IP address:', error);
      });
  }

  /**
   * Merge IP metadata with current metadata
   */
  private mergeIPMetadata(metadataWithIP: ClientMetadata, originalMetadata: ClientMetadata): void {
    // Only update if no other updates have occurred
    if (JSON.stringify(this.clientMetadata) === JSON.stringify(originalMetadata)) {
      this.clientMetadata = metadataWithIP;
      this.logger.debug('✅ Updated metadata with IP:', metadataWithIP);
    } else {
      this.logger.warn('⚠️ Metadata changed during IP collection, merging...');
      // Merge IP data with current metadata
      if (metadataWithIP.ip_address && !this.clientMetadata.ip_address) {
        this.clientMetadata.ip_address = metadataWithIP.ip_address;
      }
      if (metadataWithIP.geo_location && !this.clientMetadata.geo_location) {
        this.clientMetadata.geo_location = metadataWithIP.geo_location;
      }
    }
  }

  /**
   * Restore conversation from persistence or prepare for new conversation
   * @returns {boolean} Whether to initialize a new chat
   */
  private restoreOrInitializeConversation(): boolean {
    if (!this.persistenceManager) {
      return true; // No persistence, always init new chat
    }

    const messages = this.persistenceManager.loadMessages();
    const metadata = this.persistenceManager.loadMetadata();
    
    // Load persisted metadata
    if (metadata) {
      this.logger.verbose('📋 Initial load - restoring agent capabilities from persisted metadata:', metadata);
      this.processAgentCapabilities(metadata);
    } else {
      this.logger.warn('⚠️ Initial load - no persisted metadata found, will initialize from API');
    }
    
    // Check if we have existing conversation data
    if (messages.length > 0 || metadata) {
      if (messages.length > 0) {
        this.restoreMessages(messages);
      } else if (metadata) {
        this.handleMetadataWithoutMessages(metadata);
      }
      
      this.isFreshConversation = false;
      this.stateManager.setInitialized(true);
      return false; // Don't init new chat
    }

    return true; // Init new chat
  }

  /**
   * Restore messages from persistence
   */
  private restoreMessages(messages: Message[]): void {
    this.stateManager.clearMessages();
    messages.forEach(msg => this.addMessage(msg));
    
    // Set lastMessageCount to match API response array counting
    this.lastMessageCount = messages.length;
    
    // Set conversation state based on loaded messages
    const userMessages = messages.filter(msg => msg.sender === 'user');
    this.hasUserStartedConversation = userMessages.length > 0;
    
    // Clear unsaved flag since we just loaded from persistence
    this.hasUnsavedChanges = false;
    
    this.logger.verbose(`📊 Loaded ${messages.length} messages from persistence, lastMessageCount set to ${this.lastMessageCount}`);
  }

  /**
   * Handle edge case of metadata without messages
   */
  private handleMetadataWithoutMessages(metadata: AgentMetadata): void {
    // This is an edge case that shouldn't normally occur
    this.logger.warn('⚠️ Found metadata but no messages - likely a persistence issue');
    
    // Track this edge case for telemetry
    this.trackTelemetryEvent('metadata_without_messages', {
      conversationId: this.persistenceManager?.getCurrentId(),
      metadata: metadata,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Finalize initialization with UI updates
   */
  private finalizeInitialization(): void {
    // Update UI based on initial state
    this.uiManager.updateUI(this.stateManager.getState());
    this.uiManager.updateTheme(this.theme);
    
    this.isInitialized = true;
    this.logger.info('🎉 ChatWidget UI initialized');
  }

  /**
   * Create DOM elements - TODO: Move to UIManager
   */
  private createElements(): void {
    // Remove any existing widget for this container
    const existingWidget = document.querySelector(`.am-chat-widget[data-container="${this.containerId}"]`);
    if (existingWidget) {
      existingWidget.remove();
    }

    this.element = document.createElement('div');
    this.element.className = `am-chat-widget am-chat-widget--${this.config.variant}`;
    this.element.setAttribute('data-container', this.containerId);
    
    // Set position attribute for corner variant
    if (this.config.variant === 'corner' && this.config.position) {
      this.element.setAttribute('data-position', this.config.position);
    }

    // Basic template for now - TODO: Move to UIManager
    this.element.innerHTML = this.generateTemplate();

    // Mount to container
    if (this.config.variant === 'inline') {
      const container = document.getElementById(this.containerId);
      if (!container) {
        this.logger.error(`Container with id "${this.containerId}" not found`);
        return;
      }
      container.innerHTML = '';
      container.appendChild(this.element);
    } else {
      document.body.appendChild(this.element);
    }
  }

  /**
   * Generate widget template - TODO: Move to UIManager
   */
  private generateTemplate(): string {
    const showToggle = this.config.variant === 'corner';
    
    return `
      ${showToggle ? `
        <button class="am-chat-toggle" style="background-color: ${this.theme.toggleBackgroundColor} !important;">
          <div class="am-chat-toggle-content">
            <span class="am-chat-toggle-text" style="color: ${this.theme.toggleTextColor} !important;">
              ${this.config.toggleText || 'AI Assistant'}
            </span>
          </div>
        </button>
      ` : ''}
      <div class="am-chat-container" style="display: ${this.state.isOpen || this.config.variant !== 'corner' ? 'flex' : 'none'};">
        <div class="am-chat-header" style="background-color: white; color: #333;">
          <div class="am-chat-header-content">
            <span>${this.config.title}</span>
            <button class="am-chat-minimize">×</button>
          </div>
        </div>
        <div class="am-chat-messages" style="background-color: ${this.theme.backgroundColor}; color: ${this.theme.textColor};"></div>
        <div class="am-chat-input-container">
          <textarea class="am-chat-input" placeholder="${this.config.placeholder || 'Type your message...'}"></textarea>
          <button class="am-chat-send" style="background-color: ${this.theme.buttonColor}; color: ${this.theme.buttonTextColor};">Send</button>
        </div>
        <div class="am-chat-branding">Powered by <a href="https://agentman.ai" target="_blank">Agentman</a></div>
      </div>
    `;
  }

  /**
   * Attach event listeners - TODO: Move to appropriate components
   */
  private attachEventListeners(): void {
    const toggle = this.element.querySelector('.am-chat-toggle');
    const minimize = this.element.querySelector('.am-chat-minimize');
    const send = this.element.querySelector('.am-chat-send');
    const input = this.element.querySelector('.am-chat-input') as HTMLTextAreaElement;

    if (toggle) {
      toggle.addEventListener('click', () => this.toggleChat());
    }

    if (minimize) {
      minimize.addEventListener('click', () => this.toggleChat());
    }

    if (send) {
      send.addEventListener('click', () => this.handleSendMessage());
    }

    if (input) {
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }
  }

  /**
   * Handle state changes
   */
  private handleStateChange(state: ChatState): void {
    this.uiManager.updateUI(state);
    this.updateFloatingPrompts(state);
  }

  /**
   * Manage floating prompt bubbles based on widget state
   */
  private updateFloatingPrompts(state: ChatState): void {
    
    if (this.config.variant !== 'corner') return;

    // Show floating prompts when: closed + no conversation started + fresh conversation + desktop
    const shouldShowFloating = !state.isOpen && 
                               !this.hasUserStartedConversation && 
                               this.isFreshConversation &&
                               window.innerWidth > UI_CONSTANTS.TABLET_BREAKPOINT;

    if (shouldShowFloating) {
      // Schedule floating prompts to appear after 5 seconds
      if (!this.floatingPromptTimer) {
        this.floatingPromptTimer = window.setTimeout(() => {
          this.uiManager.showFloatingPrompts();
          this.floatingPromptTimer = null;
        }, 5000);
      }
    } else {
      // Clear timer and hide floating prompts
      if (this.floatingPromptTimer) {
        clearTimeout(this.floatingPromptTimer);
        this.floatingPromptTimer = null;
      }
      this.uiManager.hideFloatingPrompts();
    }

    // Handle inline prompts (when chat is open)
    // Show prompts only for truly fresh conversations where user hasn't interacted
    const shouldShowInline = state.isOpen && !this.hasUserStartedConversation && this.isFreshConversation;
    
    if (shouldShowInline) {
      this.uiManager.showMessagePrompts();
    } else if (state.isOpen) {
      this.uiManager.hideMessagePrompts();
    }
  }

  /**
   * Toggle chat open/closed
   */
  public toggleChat(): void {
    if (this.config.variant === 'corner') {
      const newState = !this.stateManager.getState().isOpen;
      this.stateManager.setOpen(newState);
    }
  }

  /**
   * Initialize chat with welcome message from API
   */
  private async initializeChat(): Promise<void> {
    this.logger.info('🌟 initializeChat() called');
    if (this.state.isInitialized || this.isInitializing) {
      this.logger.debug('⏭️ initializeChat() aborted - already initialized or initializing');
      return;
    }

    // Double-check: Don't initialize if we already have messages
    const currentMessages = this.stateManager.getState().messages;
    if (currentMessages.length > 0) {
      this.logger.debug(`⏭️ initializeChat() aborted - already have ${currentMessages.length} messages`);
      this.stateManager.setInitialized(true);
      return;
    }

    this.isInitializing = true;
    this.showLoadingIndicator();
    this.lastMessageCount = 0;
    this.logger.info('🚧 Starting chat initialization');

    try {
      // Use the initialMessage if provided, otherwise default to 'Hello'
      const initialMessage = this.config.initialMessage || 'Hello';
      this.logger.info(`💬 Using initial message: "${initialMessage}"`);
      this.logger.info(`🔗 Conversation ID: ${this.conversationId}`);
      
      const response = await fetch(`${this.config.apiUrl}/v2/agentman_runtime/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_token: this.config.agentToken,
          force_load: false,
          conversation_id: this.conversationId,
          user_input: initialMessage,
          ...(Object.keys(this.clientMetadata).length > 0 ? { client_metadata: this.clientMetadata } : {})
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      const data = ValidationUtils.parseAndValidatePayload(responseText);
      
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      
      // Handle the response directly
      if (data.response) {
        this.logger.debug('📡 Received initial response data');
        this.handleInitialResponse(data.response);
        
        // Extract and process agent capabilities from metadata
        if (data.metadata) {
          this.processAgentCapabilities(data.metadata);
        }
        
        // Check if persistenceManager is saving after welcome message
        if (this.persistenceManager) {
          this.logger.verbose('🔍 Checking if welcome message is saved to persistence');
          const currentMessages = this.stateManager.getState().messages;
          this.logger.verbose(`📊 Current message count after welcome: ${currentMessages.length}`);
        }
      }

      this.stateManager.setInitialized(true);
    } catch (error) {
      this.logger.error('Chat initialization error:', error);
      this.stateManager.setError('Failed to initialize chat. Please try again.');
      
      // Fallback to local welcome message if API fails
      if (this.config.initialMessage) {
        this.addMessage({
          id: this.generateUUID(),
          sender: 'agent',
          content: this.config.initialMessage,
          timestamp: new Date().toISOString(),
          type: 'text'
        });
      }
    } finally {
      this.isInitializing = false;
      this.hideLoadingIndicator();
    }
  }

  /**
   * Handle initial API response
   */
  private handleInitialResponse(responseData: any[]): void {
    this.logger.info('👋 handleInitialResponse() called');
    this.logger.verbose(`📊 Response data contains ${responseData.length} total messages`);
    this.logger.verbose(`📊 Current lastMessageCount: ${this.lastMessageCount}`);
    
    if (!Array.isArray(responseData)) {
      this.logger.error('Invalid response format:', responseData);
      return;
    }

    // If this.lastMessageCount is undefined, initialize it
    if (typeof this.lastMessageCount === 'undefined') {
      this.lastMessageCount = 0;
    }

    // Get only the new messages that appear after the last known count
    const newMessages = responseData.slice(this.lastMessageCount);
    this.logger.info(`💬 Processing ${newMessages.length} new messages from initial response (sliced from index ${this.lastMessageCount})`);

    // Log message types for debugging
    newMessages.forEach((msg, index) => {
      this.logger.info(`  Message ${this.lastMessageCount + index}: type=${msg.type}, content preview: "${msg.content?.substring(0, 50)}..."`);
    });

    for (const msg of newMessages) {
      // Skip human messages since we already display them when sending
      if (msg.type !== 'ai') {
        this.logger.debug('⏭️ Skipping human message in initial response');
        continue;
      }

      if (this.isValidMessage(msg) && msg.content.trim()) {
        this.logger.info(`➕ Adding welcome message to UI: "${msg.content.substring(0, 50)}..."`);
        this.addMessage({
          id: msg.id ?? this.generateUUID(),
          sender: 'agent',
          content: msg.content,
          timestamp: new Date().toISOString(),
          type: 'text'
        });
      }
    }

    // Update lastMessageCount to reflect the total messages processed
    this.lastMessageCount = responseData.length;
    this.logger.debug(`✅ Updated lastMessageCount to ${this.lastMessageCount}`);
    
    // Save the initial messages to persistence
    if (this.persistenceManager) {
      this.logger.debug('💾 Saving initial messages to persistence');
      const result = this.persistenceManager.saveMessages();
      if (result.success) {
        this.hasUnsavedChanges = false;
      } else {
        this.logger.warn('Failed to save initial messages');
      }
    }
  }

  /**
   * Handle sending messages - TODO: Move to MessageHandler
   */
  private async handleSendMessage(): Promise<void> {
    const input = this.uiManager.getElement('.am-chat-input') as HTMLTextAreaElement;
    const rawMessage = input?.value || '';
    
    // Sanitize user input
    const message = ValidationUtils.sanitizeUserInput(rawMessage).trim();
    
    // Check if we have attachments
    const pendingAttachments = this.stateManager.getState().pendingAttachments || [];
    const hasAttachments = pendingAttachments.length > 0;
    
    // Allow sending if we have either message text OR attachments
    if ((!message && !hasAttachments) || this.state.isSending) {
      return;
    }

    // Rate limiting check
    if (!ValidationUtils.checkRateLimit(`chat_${this.containerId}`, 30, 60000)) {
      this.logger.warn('Rate limit exceeded for chat messages');
      return;
    }

    // Mark that user has started conversation BEFORE any state changes
    this.hasUserStartedConversation = true;
    this.isFreshConversation = false; // No longer fresh once user sends a message
    
    // Hide prompts immediately since user is now interacting
    this.uiManager.hideMessagePrompts();
    this.uiManager.hideFloatingPrompts();

    // Set sending state (this triggers handleStateChange, but hasUserStartedConversation is already true)
    this.stateManager.setSending(true);

    try {
      // Clear input
      if (input) {
        input.value = '';
        input.style.height = 'auto';
      }

      // Disable send button
      const sendButton = this.uiManager.getElement('.am-chat-send') as HTMLButtonElement;
      if (sendButton) {
        sendButton.disabled = true;
      }

      // Use message text or empty string if only attachments
      await this.sendMessage(message || '');
    } catch (error) {
      this.logger.error('Error sending message:', error);
    } finally {
      this.stateManager.setSending(false);
    }
  }

  /**
   * Send message to agent API
   */
  private async sendMessage(message: string): Promise<void> {
    const messageId = this.generateUUID();
    
    // Get successfully uploaded attachments
    const successfulAttachments = this.config.enableAttachments ? 
      this.stateManager.getState().pendingAttachments.filter(a => a.upload_status === 'success') : [];
    
    // Create user message
    const newMessage: Message = {
      id: messageId,
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text',
      attachments: successfulAttachments.length > 0 ? successfulAttachments : undefined
    };

    // Add user message
    this.addMessage(newMessage);

    // Clear pending attachments after adding to message
    if (this.config.enableAttachments && successfulAttachments.length > 0) {
      this.stateManager.clearPendingAttachments();
      this.updateAttachmentPreview();
    }

    // Show loading indicator
    this.showLoadingIndicator();

    try {
      // Prepare request body
      const requestBody: any = {
        agent_token: this.config.agentToken,
        force_load: false,
        conversation_id: this.conversationId,
        user_input: message,
        ...(Object.keys(this.clientMetadata).length > 0 ? { client_metadata: this.clientMetadata } : {})
      };

      // Add attachment URLs if available
      if (successfulAttachments.length > 0) {
        const attachmentUrls = successfulAttachments
          .filter(a => a.url)
          .map(a => a.url);
        if (attachmentUrls.length > 0) {
          requestBody.attachment_urls = attachmentUrls;
        }
      }
      
      this.logger.debug('🔄 Sending message to API:', {
        url: `${this.config.apiUrl}/v2/agentman_runtime/agent`,
        body: requestBody
      });
      
      const response = await fetch(
        `${this.config.apiUrl}/v2/agentman_runtime/agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      const data = ValidationUtils.parseAndValidatePayload(responseText);
      
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      this.logger.info('📨 Received API response:', data);

      // Hide loading before showing response
      this.hideLoadingIndicator();

      // Process the response array first
      if (Array.isArray(data.response)) {
        await this.handleResponse(data.response);
        
        // Process agent metadata after messages are handled (prevents race condition)
        if (data.metadata) {
          this.logger.debug('💾 Processing updated agent metadata from response');
          this.processAgentCapabilities(data.metadata);
        }
        
        // Save messages and metadata atomically
        if (this.persistenceManager) {
          this.logger.debug('💾 Saving messages after response processed');
          const result = this.persistenceManager.saveMessages();
          if (result.success) {
            this.hasUnsavedChanges = false;
          } else {
            this.logger.warn('Failed to save messages after response');
          }
        }
      } else {
        this.logger.error('Invalid response format:', data);
        this.addErrorMessage('Invalid response format from agent');
      }
    } catch (error) {
      this.logger.error('Message sending error:', error);
      this.hideLoadingIndicator();

      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      // Parse API errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorContent = 'Unable to connect to the agent service. Please check your connection and try again.';
        } else if (error.message.includes('401')) {
          errorContent = 'Authentication failed. Please check your agent token.';
        } else if (error.message.includes('404')) {
          errorContent = 'Agent service not found. Please check the API URL.';
        }
      }

      this.addErrorMessage(errorContent);
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse(responseData: any[]): Promise<void> {
    if (!Array.isArray(responseData)) {
      this.logger.error('Invalid response format:', responseData);
      return;
    }

    // If this.lastMessageCount is undefined, initialize it
    if (typeof this.lastMessageCount === 'undefined') {
      this.lastMessageCount = 0;
    }
    
    this.logger.verbose(`🔍 Processing response with ${responseData.length} messages, lastMessageCount=${this.lastMessageCount}`);

    // Get only the new messages that appear after the last known count
    const newMessages = responseData.slice(this.lastMessageCount);
    this.logger.info(`🔄 Found ${newMessages.length} new messages`);
    
    // Get current messages to check for duplicates
    const currentMessages = this.stateManager.getState().messages;
    const existingContents = currentMessages.map(m => m.content.trim());
    
    for (const msg of newMessages) {
      // Skip human messages since we already display them when sending
      if (msg.type !== 'ai') {
        this.logger.debug('⏭️ Skipping human message');
        continue;
      }
      
      const content = msg.content.trim();
      
      // Skip if this message content already exists in the UI
      if (existingContents.includes(content)) {
        this.logger.debug('⏭️ Skipping duplicate message: ' + content.substring(0, 30) + '...');
        continue;
      }

      if (this.isValidMessage(msg) && content) {
        this.logger.info('➕ Adding new agent message');
        this.addMessage({
          id: msg.id ?? this.generateUUID(),
          sender: 'agent',
          content: content,
          timestamp: new Date().toISOString(),
          type: 'text'
        });
      }
    }

    // Update lastMessageCount to reflect the total messages processed
    this.lastMessageCount = responseData.length;
    this.logger.debug(`✅ Updated lastMessageCount to ${this.lastMessageCount}`);
  }

  /**
   * Add error message to chat
   */
  private addErrorMessage(content: string): void {
    const errorMessage: Message = {
      id: this.generateUUID(),
      sender: 'agent',
      content: content,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    this.addMessage(errorMessage);
  }

  /**
   * Check if message is valid
   */
  private isValidMessage(msg: any): boolean {
    return (
      typeof msg === 'object' &&
      msg !== null &&
      'type' in msg &&
      'content' in msg &&
      typeof msg.content === 'string'
    );
  }

  /**
   * Show loading indicator
   */
  private showLoadingIndicator(): void {
    if (this.loadingMessageElement) {
      return;
    }

    const messagesContainer = this.uiManager.getElement('.am-chat-messages');
    if (!messagesContainer) {
      return;
    }

    this.loadingMessageElement = document.createElement('div');
    this.loadingMessageElement.className = 'am-message agent am-chat-loading-message';

    this.loadingMessageElement.innerHTML = `
      <div class="am-message-role">Assistant</div>
      <div class="am-message-content">
        <div class="loading-container">
          <div class="loading-waves">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;

    messagesContainer.appendChild(this.loadingMessageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    // Wave animation is CSS-based, no need for JavaScript animation
  }

  /**
   * Hide loading indicator
   */
  private hideLoadingIndicator(): void {
    if (this.loadingMessageElement) {
      this.loadingMessageElement.remove();
      this.loadingMessageElement = null;
    }

    // No longer needed - wave animation is CSS-based
    if (this.loadingAnimationInterval) {
      window.clearInterval(this.loadingAnimationInterval);
      this.loadingAnimationInterval = null;
    }
  }

  /**
   * Start loading animation (deprecated - now using CSS-based wave animation)
   */
  private startLoadingAnimation(): void {
    // No longer needed - wave animation is CSS-based
    // Keeping method for backward compatibility
  }

  /**
   * Handle input keypress events
   */
  private handleInputKeypress(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSendMessage();
    }
  }

  /**
   * Handle resize events
   */
  private handleResize(): void {
    // UIManager handles the actual resize logic
    // This is just for any additional resize handling needed
  }

  /**
   * Handle prompt button clicks
   * Note: Only used for floating prompts now, chat area prompts are disabled
   */
  private handlePromptClick(prompt: string): void {
    // If widget is closed, open it first
    if (!this.stateManager.getState().isOpen && this.config.variant === 'corner') {
      this.stateManager.setOpen(true);
      
      // Small delay to ensure widget is fully opened before sending
      setTimeout(() => {
        this.fillAndSendPrompt(prompt);
      }, 300);
    } else {
      this.fillAndSendPrompt(prompt);
    }
  }
  
  /**
   * Helper to fill input and send prompt message
   */
  private fillAndSendPrompt(prompt: string): void {
    const input = this.uiManager.getElement('.am-chat-input') as HTMLTextAreaElement;
    if (input) {
      input.value = prompt;
      input.focus();
      
      // Trigger send message
      this.handleSendMessage();
    }
  }

  /**
   * Handle expand button clicks (toggle fullscreen mode)
   */
  private handleExpandClick(): void {
    if (!this.element) return;

    const isExpanded = this.element.classList.contains('am-chat-expanded');
    
    if (isExpanded) {
      // Collapse
      this.element.classList.remove('am-chat-expanded');
      const expandButton = this.uiManager.getElement('.am-chat-expand');
      if (expandButton) {
        expandButton.innerHTML = icons.expand2;
        expandButton.title = 'Expand chat';
      }
    } else {
      // Expand
      this.element.classList.add('am-chat-expanded');
      const expandButton = this.uiManager.getElement('.am-chat-expand');
      if (expandButton) {
        expandButton.innerHTML = icons.collapse2;
        expandButton.title = 'Collapse chat';
      }
    }
  }

  /**
   * Setup conversation management UI
   */
  private setupConversationManagement(): void {
    if (!this.persistenceManager || !this.element) return;

    // Create conversation list view and add to main container (will replace entire chat area)
    const mainContainer = this.uiManager.getElement('.am-chat-container');
    if (mainContainer) {
      const conversationListView = this.conversationManager.createConversationListView();
      mainContainer.appendChild(conversationListView);
    }

    // Get conversation count to determine if we should show the hamburger menu
    const conversations = this.persistenceManager.list();
    const hasConversations = conversations.length > 1; // Show when more than current conversation

    // Add navigation buttons to header
    const header = this.uiManager.getElement('.am-chat-header');
    if (header) {
      this.conversationManager.addConversationButton(header, hasConversations);
      this.conversationManager.addNewConversationButton(header); // Always show + button
      this.conversationManager.addHeaderDivider(header); // Add divider between button groups
      this.conversationManager.addBackButton(header);
    }

    // Update conversation list
    this.updateConversationList();
  }

  /**
   * Update conversation list in the UI
   */
  private updateConversationList(): void {
    if (!this.persistenceManager) return;

    const conversations = this.persistenceManager.list();
    const currentId = this.persistenceManager.getCurrentId();
    this.conversationManager.updateConversationList(conversations, currentId);

    // Update header button visibility
    this.updateConversationHeaderButtons();
  }

  /**
   * Update conversation header button visibility
   */
  private updateConversationHeaderButtons(): void {
    if (!this.persistenceManager) return;

    const conversations = this.persistenceManager.list();
    const hasConversations = conversations.length > 1;
    const header = this.uiManager.getElement('.am-chat-header');
    
    this.logger.verbose(`🔍 [DEBUG] Updating header buttons - ${conversations.length} conversations, hasConversations: ${hasConversations}`);
    
    if (header) {
      // Handle conversation list button (hamburger menu)
      let conversationButton = header.querySelector('.am-conversation-toggle') as HTMLElement;
      
      if (hasConversations && !conversationButton) {
        // Add the button if it doesn't exist but should
        this.logger.verbose(`🔍 [DEBUG] Adding missing conversation button`);
        this.conversationManager.addConversationButton(header, hasConversations);
        conversationButton = header.querySelector('.am-conversation-toggle') as HTMLElement;
      }
      
      if (conversationButton) {
        conversationButton.style.display = hasConversations && !this.conversationManager.isListViewActive() ? 'block' : 'none';
        this.logger.verbose(`🔍 [DEBUG] Conversation button display: ${conversationButton.style.display}`);
      }

      // Update all header button states
      this.conversationManager.updateHeaderButtons(header);
    }
  }

  /**
   * Handle new conversation creation
   */
  private handleNewConversation(): void {
    if (!this.persistenceManager) return;

    // Save current messages before switching
    const saveResult = this.persistenceManager.saveMessages();
    if (saveResult.success) {
      this.hasUnsavedChanges = false;
    } else {
      this.logger.warn('Failed to save messages before switching');
    }

    // Create new conversation
    const newId = this.persistenceManager.create();
    this.conversationId = newId;

    // Clear current messages and initialize
    this.stateManager.clearMessages();
    this.clearMessagesUI();
    this.hasUserStartedConversation = false; // Reset conversation state
    this.isFreshConversation = true; // This is a brand new conversation
    this.lastMessageCount = 0; // Reset message count for new conversation
    this.logger.info('🆕 New conversation created, resetting lastMessageCount to 0');
    this.initializeChat();

    // Update conversation list
    this.updateConversationList();

    // Update prompts based on new conversation state
    this.updateFloatingPrompts(this.stateManager.getState());

    // Close conversation list view and return to chat
    if (this.conversationManager.isListViewActive()) {
      this.conversationManager.toggleListView();
    }

    this.logger.debug(`✅ Created new conversation: ${newId}`);
  }

  /**
   * Handle conversation switching
   */
  private handleSwitchConversation(conversationId: string): void {
    
    if (!this.persistenceManager || conversationId === this.conversationId) return;

    // Save current messages before switching
    const saveResult = this.persistenceManager.saveMessages();
    if (saveResult.success) {
      this.hasUnsavedChanges = false;
    } else {
      this.logger.warn('Failed to save messages before switching');
    }

    // Switch to the selected conversation
    this.persistenceManager.switchTo(conversationId);
    this.conversationId = conversationId;

    // Load messages for the selected conversation
    const messages = this.persistenceManager.loadMessages();
    
    // Load and restore metadata for the selected conversation
    const metadata = this.persistenceManager.loadMetadata();
    if (metadata) {
      this.processAgentCapabilities(metadata);
    } else {
      this.logger.warn('⚠️ No metadata found for conversation, keeping current capabilities');
    }
    
    // Update conversation state FIRST, before any UI updates
    const userMessages = messages.filter(msg => msg.sender === 'user');
    const previousState = this.hasUserStartedConversation;
    this.hasUserStartedConversation = userMessages.length > 0;
    this.isFreshConversation = false; // This is an existing conversation we're switching to
    
    // Update lastMessageCount to match the loaded messages
    this.lastMessageCount = messages.length;
    this.logger.verbose(`📊 Switched to conversation with ${messages.length} messages, lastMessageCount set to ${this.lastMessageCount}`);
    
    this.stateManager.clearMessages();
    this.clearMessagesUI();

    // Load messages into UI (now with correct conversation state)
    messages.forEach(msg => this.addMessage(msg));

    // Update conversation list
    this.updateConversationList();

    // Final update of prompts based on conversation state
    this.updateFloatingPrompts(this.stateManager.getState());

    // Close conversation list view and return to chat
    if (this.conversationManager.isListViewActive()) {
      this.conversationManager.toggleListView();
    }

    this.logger.debug(`✅ Switched to conversation: ${conversationId}`);
  }

  /**
   * Handle conversation deletion
   */
  private handleDeleteConversation(conversationId: string): void {
    if (!this.persistenceManager) return;

    const currentId = this.persistenceManager.getCurrentId();
    
    // Delete the conversation
    this.persistenceManager.delete(conversationId);

    // If we deleted the current conversation, switch to another or create new
    if (conversationId === currentId) {
      const conversations = this.persistenceManager.list();
      if (conversations.length > 0) {
        this.handleSwitchConversation(conversations[0].id);
      } else {
        this.handleNewConversation();
      }
    }

    // Update conversation list
    this.updateConversationList();

    this.logger.debug(`✅ Deleted conversation: ${conversationId}`);
  }

  /**
   * Handle conversation list view toggle
   */
  private handleToggleListView(): void {
    const mainContainer = this.uiManager.getElement('.am-chat-container');
    const header = this.uiManager.getElement('.am-chat-header');
    
    if (mainContainer && header) {
      const isListViewActive = this.conversationManager.isListViewActive();
      
      // Get chat area elements
      const messagesContainer = mainContainer.querySelector('.am-chat-messages') as HTMLElement;
      const branding = mainContainer.querySelector('.am-chat-branding') as HTMLElement;
      const inputElements = mainContainer.querySelectorAll('.am-chat-input-prompts, .am-chat-input-container, .chat-attachments-preview');
      
      if (isListViewActive) {
        // Opening list view - animate chat elements out
        if (messagesContainer) {
          messagesContainer.classList.add('sliding-out');
        }
        inputElements.forEach(el => {
          (el as HTMLElement).classList.add('sliding-out');
        });
        
        // Hide elements after animation
        setTimeout(() => {
          if (messagesContainer) {
            messagesContainer.style.display = 'none';
          }
          inputElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        }, UI_CONSTANTS.TRANSITION_NORMAL);
        
      } else {
        // Closing list view - show and animate chat elements back
        if (messagesContainer) {
          messagesContainer.style.display = '';
          messagesContainer.classList.remove('sliding-out');
        }
        inputElements.forEach(el => {
          (el as HTMLElement).style.display = '';
          (el as HTMLElement).classList.remove('sliding-out');
        });
      }
      
      // Keep branding visible
      if (branding) {
        branding.style.display = '';
      }
      
      // Update header buttons
      this.conversationManager.updateHeaderButtons(header);
      
      // Update header title
      const headerTitle = header.querySelector('.am-chat-header-content span');
      if (headerTitle) {
        headerTitle.textContent = isListViewActive ? 'Conversations' : (this.config.title || 'Chat Agent');
      }
    }
    
    this.logger.info('📂 Conversation list view toggled:', this.conversationManager.isListViewActive());
  }

  /**
   * Clear messages from UI
   */
  private clearMessagesUI(): void {
    const messagesContainer = this.uiManager.getElement('.am-chat-messages');
    if (messagesContainer) {
      // Keep the prompts, only clear actual messages
      const existingMessages = messagesContainer.querySelectorAll('.am-message');
      existingMessages.forEach(msg => msg.remove());
    }
  }

  /**
   * Handle attachment button click
   */
  private handleAttachmentClick(): void {
    const fileInput = this.uiManager.getElement('.chat-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle file selection
   */
  private handleFileSelect(files: FileList): void {
    if (!this.config.enableAttachments || !this.fileUploadManager) return;

    Array.from(files).forEach(async (file) => {
      // Security validation first
      const fileValidation = ValidationUtils.sanitizeFileData(file);
      if (!fileValidation.valid) {
        this.logger.warn(`🚫 File validation failed: ${fileValidation.errors.join(', ')}`);
        // TODO: Show user-friendly error message in UI
        return;
      }

      // Validate mime type if agent capabilities are available
      if (this.supportedMimeTypes.length > 0 && !this.supportedMimeTypes.includes(file.type)) {
        this.logger.warn(`🚫 File type not supported: ${file.type}. Supported types: ${this.supportedMimeTypes.join(', ')}`);
        
        // Show user-friendly error message
        this.stateManager.setError(`File type "${file.type || 'unknown'}" is not supported. Supported types: ${this.supportedMimeTypes.map(type => type.split('/')[1]?.toUpperCase()).join(', ')}`);
        return;
      }
      
      // Create temporary attachment object
      const tempAttachment = {
        file_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        file_type: this.getFileType(file),
        size_bytes: file.size,
        upload_status: 'uploading' as const,
        upload_progress: 0
      };

      // Add to pending attachments
      this.stateManager.addPendingAttachment(tempAttachment);
      this.updateAttachmentPreview();

      try {
        // Upload the file
        const uploadedAttachment = await this.fileUploadManager.uploadFile(file, (progress) => {
          this.stateManager.updateAttachmentStatus(tempAttachment.file_id, { upload_progress: progress });
          this.updateAttachmentPreview();
        });

        // Update with success status
        this.stateManager.updateAttachmentStatus(tempAttachment.file_id, {
          ...uploadedAttachment,
          upload_status: 'success'
        });
        this.updateAttachmentPreview();

      } catch (error) {
        this.logger.error('File upload failed:', error);
        // Update with error status
        this.stateManager.updateAttachmentStatus(tempAttachment.file_id, {
          upload_status: 'error',
          error_message: error instanceof Error ? error.message : 'Upload failed'
        });
        this.updateAttachmentPreview();
      }
    });

    // Clear the file input
    this.uiManager.clearFileInput();
  }

  /**
   * Get file type from file extension/mime type
   */
  private getFileType(file: File): 'image' | 'document' | 'audio' | 'video' | 'text' | 'data' {
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('text/') || mimeType.includes('text')) return 'text';
    
    // Check by extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'ppt':
      case 'pptx':
      case 'xls':
      case 'xlsx':
        return 'document';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'video';
      case 'txt':
      case 'md':
      case 'json':
      case 'csv':
        return 'text';
      default:
        return 'data';
    }
  }

  /**
   * Handle attachment removal
   */
  private handleAttachmentRemove(fileId: string): void {
    this.stateManager.removePendingAttachment(fileId);
    this.updateAttachmentPreview();
  }

  /**
   * Update attachment preview in UI
   */
  private updateAttachmentPreview(): void {
    if (!this.config.enableAttachments) return;

    const attachments = this.stateManager.getState().pendingAttachments;
    this.uiManager.updateAttachmentPreview(attachments);
  }

  /**
   * Add message to chat - TODO: Move to MessageContainer
   */
  public addMessage(message: Message): void {
    const messagesContainer = this.uiManager.getElement('.am-chat-messages');
    if (!messagesContainer) {
      this.logger.error('Messages container not found');
      return;
    }

    this.stateManager.addMessage(message);
    
    // Mark that we have unsaved changes and trigger debounced save
    this.hasUnsavedChanges = true;
    this.debouncedSave();

    const messageElement = document.createElement('div');
    messageElement.className = `am-message ${message.sender}`;
    // Remove inline styling to use CSS for Claude-style layout
    
    const renderedContent = this.messageRenderer.render(message);
    const attachmentsHtml = this.renderMessageAttachments(message);
    
    // Claude-style layout: role labels and no bubbles, both left-aligned
    if (message.sender === 'user') {
      messageElement.innerHTML = `
        <div class="am-message-role">You</div>
        <div class="am-message-content">
          ${renderedContent}
          ${attachmentsHtml}
        </div>
      `;
    } else {
      messageElement.innerHTML = `
        <div class="am-message-role">Assistant</div>
        <div class="am-message-content">
          ${renderedContent}
          ${attachmentsHtml}
        </div>
      `;
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Render message attachments HTML
   */
  private renderMessageAttachments(message: Message): string {
    if (!message.attachments || message.attachments.length === 0) {
      return '';
    }

    const attachmentsHtml = message.attachments.map(attachment => {
      const isImage = attachment.file_type === 'image' && attachment.url;
      const iconType = this.getAttachmentIcon(attachment.file_type);
      const escapedFilename = this.escapeHtml(attachment.filename);
      const formattedSize = this.formatFileSize(attachment.size_bytes);
      
      if (isImage) {
        return `
          <div class="chat-message-attachment">
            <img src="${attachment.url}" 
                 alt="${escapedFilename}" 
                 class="message-attachment-image"
                 onclick="window.open('${attachment.url}', '_blank')"
                 loading="lazy">
          </div>
        `;
      } else {
        return `
          <a href="${attachment.url || '#'}" 
             class="chat-message-attachment" 
             target="_blank" 
             rel="noopener noreferrer"
             ${!attachment.url ? 'onclick="return false;" style="cursor: not-allowed; opacity: 0.5;"' : ''}>
            <div class="message-attachment-icon">${iconType}</div>
            <div class="chat-attachment-info">
              <div class="chat-attachment-name">${escapedFilename}</div>
              <div class="chat-attachment-size">${formattedSize}</div>
            </div>
          </a>
        `;
      }
    }).join('');

    return `<div class="chat-message-attachments">${attachmentsHtml}</div>`;
  }

  /**
   * Get attachment icon based on file type
   */
  private getAttachmentIcon(fileType: string): string {
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'document':
        return '📄';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎬';
      case 'text':
        return '📝';
      case 'data':
        return '📊';
      default:
        return '📎';
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear conversation storage
   */
  public clearStorage(): void {
    if (this.persistenceManager) {
      this.persistenceManager.clearStorage();
      this.stateManager.clearMessages();
      
      // Clear UI
      const messagesContainer = this.uiManager.getElement('.am-chat-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
    }
  }

  /**
   * Destroy widget instance
   */
  public destroy(): void {
    this.logger.info('🧹 ChatWidget destroying...');

    // Save any unsaved messages before destroying
    if (this.persistenceManager && this.hasUnsavedChanges) {
      this.persistenceManager.saveMessages();
    }
    
    // Remove unload handlers
    if (this.boundUnloadHandler) {
      window.removeEventListener('beforeunload', this.boundUnloadHandler);
    }
    
    // Clean up timers
    if (this.promptTimer) window.clearTimeout(this.promptTimer);
    if (this.resizeTimeout) window.clearTimeout(this.resizeTimeout);
    if (this.resizeDebounceTimeout) window.clearTimeout(this.resizeDebounceTimeout);
    if (this.loadingAnimationInterval) window.clearInterval(this.loadingAnimationInterval);
    if (this.saveDebounceTimer) window.clearTimeout(this.saveDebounceTimer);

    // Clean up managers
    this.styleManager.cleanup();
    this.stateManager.clearListeners();
    this.uiManager.destroy();
    if (this.conversationManager) {
      this.conversationManager.destroy();
    }

    // Remove from instances map
    ChatWidget.instances.delete(this.containerId);
    
    this.logger.debug('✅ ChatWidget destroyed');
  }

  /**
   * Get instance by containerId
   */
  public static getInstance(containerId: string): ChatWidget | undefined {
    return ChatWidget.instances.get(containerId);
  }

  /**
   * Destroy all instances
   */
  public static destroyAll(): void {
    Array.from(ChatWidget.instances.values()).forEach(instance => {
      instance.destroy();
    });
    ChatWidget.instances.clear();
  }

  // Utility methods
  private mergeWithDefaultConfig(config: ChatConfig): ChatConfig {
    return {
      ...config,
      title: config.title || 'Chat Widget',
      theme: {
        textColor: '#111827',
        backgroundColor: '#FFFFFF',
        buttonColor: '#2563eb',
        buttonTextColor: '#FFFFFF',
        ...config.theme
      },
      placeholder: config.placeholder || 'Type your message...',
      initiallyOpen: config.initiallyOpen || false
    };
  }

  private initializeTheme(): ChatTheme {
    return {
      textColor: this.config.theme?.textColor || '#111827',
      backgroundColor: this.config.theme?.backgroundColor || '#FFFFFF',
      buttonColor: this.config.theme?.buttonColor || UI_CONSTANTS.PRIMARY_COLOR,
      buttonTextColor: this.config.theme?.buttonTextColor || '#FFFFFF',
      agentForegroundColor: this.config.theme?.agentForegroundColor || '#111827',
      userForegroundColor: this.config.theme?.userForegroundColor || '#2563eb',
      toggleBackgroundColor: this.config.theme?.toggleBackgroundColor || '#2563eb',
      toggleTextColor: this.config.theme?.toggleTextColor || '#FFFFFF',
      toggleIconColor: this.config.theme?.toggleIconColor || '#2563eb'
    };
  }

  private initializeAssets(): ChatAssets {
    return {
      logo: this.config.logo || '',
      headerLogo: this.config.headerLogo || ''
    };
  }

  // updateColors method moved to UIManager

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Process agent capabilities from API metadata
   */
  private processAgentCapabilities(metadata: any): void {
    this.logger.verbose('🔍 Processing agent capabilities from metadata:', metadata);
    
    // Validate metadata structure
    const validatedMetadata = ValidationUtils.validateAgentMetadata(metadata);
    if (!validatedMetadata) {
      this.logger.warn('⚠️ Invalid agent metadata received, using defaults');
      this.agentCapabilities = {};
      this.supportedMimeTypes = [];
      this.supportsAttachments = false;
      return;
    }
    
    this.agentCapabilities = validatedMetadata;
    this.supportedMimeTypes = validatedMetadata.supported_mime_types || [];
    this.supportsAttachments = validatedMetadata.supports_attachments || false;
    
    this.logger.verbose('📋 Agent capabilities extracted:', {
      supportedMimeTypes: this.supportedMimeTypes,
      supportsAttachments: this.supportsAttachments
    });
    
    // Persist metadata with the conversation
    if (this.persistenceManager) {
      this.persistenceManager.saveMetadata(validatedMetadata);
    }
    
    // Update file input accept attribute if attachments are enabled
    if (this.config.enableAttachments && this.supportsAttachments) {
      this.updateFileInputAccept();
    } else if (this.config.enableAttachments && !this.supportsAttachments) {
      this.logger.warn('⚠️ Attachments enabled in config but agent does not support attachments');
      // Optionally disable attachment button here
      this.disableAttachmentButton();
    }
  }

  /**
   * Update file input accept attribute based on supported mime types
   */
  private updateFileInputAccept(): void {
    const fileInput = this.uiManager.getElement('.chat-file-input') as HTMLInputElement;
    
    if (fileInput && this.supportedMimeTypes.length > 0) {
      fileInput.accept = this.supportedMimeTypes.join(',');
      this.logger.info(`📎 Updated file input accept attribute: ${fileInput.accept}`);
      
      // Add capture attribute for mobile camera access if image types are supported
      const hasImageTypes = this.supportedMimeTypes.some(type => type.startsWith('image/'));
      if (hasImageTypes) {
        fileInput.setAttribute('capture', 'environment'); // Use rear camera by default
        this.logger.info(`📱 Added camera capture support for mobile devices`);
      }
    }
    
    // Update attachment button tooltip with supported types
    this.updateAttachmentButtonTooltip();
  }

  /**
   * Update attachment button tooltip to show supported file types
   */
  private updateAttachmentButtonTooltip(): void {
    const attachmentButton = this.uiManager.getElement('.chat-attachment-button') as HTMLButtonElement;
    if (attachmentButton && this.supportedMimeTypes.length > 0) {
      const supportedTypes = this.supportedMimeTypes
        .map(type => type.split('/')[1]?.toUpperCase())
        .filter(Boolean)
        .join(', ');
      
      const hasImageTypes = this.supportedMimeTypes.some(type => type.startsWith('image/'));
      const cameraText = hasImageTypes ? ' or take photo' : '';
      
      attachmentButton.title = `Attach files (${supportedTypes} supported)${cameraText}`;
      this.logger.info(`📎 Updated attachment button tooltip: ${attachmentButton.title}`);
    }
  }

  /**
   * Disable attachment button when agent doesn't support attachments
   */
  private disableAttachmentButton(): void {
    const attachmentButton = this.uiManager.getElement('.chat-attachment-button') as HTMLButtonElement;
    if (attachmentButton) {
      attachmentButton.disabled = true;
      attachmentButton.title = 'File attachments not supported by this agent';
      attachmentButton.style.opacity = '0.5';
      this.logger.info('📎 Disabled attachment button - agent does not support attachments');
    }
  }

  private async fetchAgentCapabilities(): Promise<void> {
    // This method is no longer needed as capabilities are extracted from initial response metadata
    this.logger.verbose('🔍 fetchAgentCapabilities() called - capabilities now extracted from initial response metadata');
  }
  
  /**
   * Handle persistence errors with user notifications
   */
  private handlePersistenceError(error: import('./types/persistence-types').PersistenceError): void {
    this.logger.error('Persistence error:', error);
    
    // Don't show notifications for non-recoverable errors in production unless debug is enabled
    if (!error.recoverable && !this.config.debug) {
      return;
    }
    
    // Create a user-friendly notification
    const notification = document.createElement('div');
    notification.className = 'am-persistence-notification am-persistence-error';
    notification.innerHTML = `
      <div class="am-notification-content">
        <span class="am-notification-icon">⚠️</span>
        <span class="am-notification-message">${error.message}</span>
        ${error.type === 'QUOTA_EXCEEDED' ? 
          '<button class="am-notification-action" onclick="this.parentElement.parentElement.remove()">Clear Old Chats</button>' : 
          '<button class="am-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>'
        }
      </div>
    `;
    
    // Add to chat container
    const container = this.uiManager.getElement('.am-chat-container');
    if (container) {
      container.appendChild(notification);
      
      // Handle clear action for quota errors
      if (error.type === 'QUOTA_EXCEEDED') {
        const clearButton = notification.querySelector('.am-notification-action');
        if (clearButton) {
          clearButton.addEventListener('click', async () => {
            const result = this.persistenceManager?.clearOldConversations(3);
            if (result?.success) {
              notification.innerHTML = '<div class="am-notification-content"><span class="am-notification-icon">✅</span><span class="am-notification-message">Cleared old conversations</span></div>';
              setTimeout(() => notification.remove(), 3000);
            }
          });
        }
      }
      
      // Auto-remove after 10 seconds (except for quota errors)
      if (error.type !== 'QUOTA_EXCEEDED') {
        setTimeout(() => notification.remove(), 10000);
      }
    }
  }
  
  /**
   * Show storage quota warning
   */
  private async showQuotaWarning(): Promise<void> {
    if (!this.persistenceManager) return;
    
    const storageInfo = await this.persistenceManager.getStorageInfo();
    if (storageInfo.percentUsed && storageInfo.percentUsed > 80) {
      const notification = document.createElement('div');
      notification.className = 'am-persistence-notification am-persistence-warning';
      notification.innerHTML = `
        <div class="am-notification-content">
          <span class="am-notification-icon">💾</span>
          <span class="am-notification-message">Storage ${Math.round(storageInfo.percentUsed)}% full</span>
          <button class="am-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `;
      
      const container = this.uiManager.getElement('.am-chat-container');
      if (container) {
        container.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      }
    }
  }
  
  /**
   * Debounced save to prevent excessive saves and race conditions
   */
  private debouncedSave(): void {
    if (!this.persistenceManager || !this.hasUnsavedChanges) return;
    
    // Clear existing timer
    if (this.saveDebounceTimer) {
      window.clearTimeout(this.saveDebounceTimer);
    }
    
    // Set new timer - save after 1 second of inactivity
    this.saveDebounceTimer = window.setTimeout(() => {
      if (this.hasUnsavedChanges && this.persistenceManager) {
        this.logger.debug('💾 Auto-saving messages (debounced)');
        const result = this.persistenceManager.saveMessages();
        if (result.success) {
          this.hasUnsavedChanges = false;
        }
      }
    }, 1000);
  }
  
  /**
   * Set up handler to save messages before page unload
   */
  private setupUnloadHandler(): void {
    // Create bound handler so we can remove it later
    this.boundUnloadHandler = (event: BeforeUnloadEvent) => {
      // Force save messages before page unload
      if (this.persistenceManager && this.stateManager.getState().messages.length > 0) {
        this.logger.debug('🚪 Page unloading - saving messages');
        const result = this.persistenceManager.saveMessages();
        
        // If save failed and there are unsaved changes, warn the user
        if (!result.success && this.hasUnsavedChanges) {
          event.preventDefault();
          event.returnValue = 'You have unsaved messages. Are you sure you want to leave?';
          return event.returnValue;
        }
      }
    };
    
    // Add both beforeunload and pagehide for better coverage
    window.addEventListener('beforeunload', this.boundUnloadHandler);
    
    // Also use pagehide for mobile Safari
    window.addEventListener('pagehide', () => {
      if (this.persistenceManager) {
        this.persistenceManager.saveMessages();
      }
    });
  }
  
  /**
   * Track telemetry events for monitoring and debugging
   * This is a lightweight implementation that can be extended with actual analytics
   */
  private trackTelemetryEvent(eventName: string, data: any): void {
    try {
      // Log to debug mode if enabled
      this.logger.debug(`📊 Telemetry Event: ${eventName}`, data);
      
      // If a custom logger is provided in debug config, use it for telemetry
      if (this.config.debug && typeof this.config.debug === 'object' && this.config.debug.logger) {
        this.config.debug.logger('telemetry', eventName, data);
      }
      
      // Fire a custom event that external analytics can listen to
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('chatwidget:telemetry', {
          detail: {
            eventName,
            data,
            widgetId: this.containerId,
            timestamp: Date.now()
          }
        }));
      }
      
      // Store critical telemetry events in localStorage for debugging
      if (eventName === 'metadata_without_messages') {
        try {
          const telemetryKey = `chatwidget_telemetry_${this.containerId}`;
          const existing = localStorage.getItem(telemetryKey);
          const telemetryData = existing ? JSON.parse(existing) : { events: [] };
          
          // Keep only last 10 events
          telemetryData.events.push({
            eventName,
            data,
            timestamp: Date.now()
          });
          if (telemetryData.events.length > 10) {
            telemetryData.events = telemetryData.events.slice(-10);
          }
          
          localStorage.setItem(telemetryKey, JSON.stringify(telemetryData));
        } catch (e) {
          // Fail silently - telemetry should not break the widget
          this.logger.debug('Failed to store telemetry event:', e);
        }
      }
    } catch (error) {
      // Telemetry should never throw and break the widget
      this.logger.debug('Telemetry error:', error);
    }
  }
}
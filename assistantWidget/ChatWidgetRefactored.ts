// ChatWidgetRefactored.ts - Service-based ChatWidget architecture
import type { ChatConfig, ChatState, ChatTheme, ChatAssets, ClientMetadata, Message } from './types/types';
import { PersistenceManager } from './PersistenceManager';
import { FileUploadManager } from './FileUploadManager';
import { ConfigManager } from './ConfigManager';
import { StateManager } from './StateManager';
import { StyleManager } from './styles/style-manager';
import { ViewManager } from './components/ViewManager';
import { ConversationManager } from './components/ConversationManager';
import { ClientMetadataCollector } from './utils/client-metadata';
import { Logger } from './utils/logger';
import { ApiService } from './services/ApiService';
import { MessageService } from './services/MessageService';
import { AgentService } from './services/AgentService';
import { EventBus, type EventSubscription } from './utils/EventBus';
import { ErrorHandler } from './handlers/ErrorHandler';
import { MessageHandler } from './handlers/MessageHandler';
import { FileHandler } from './handlers/FileHandler';
import type { EventData, UserInputEvent, PromptClickEvent, ViewTransitionEvent } from './types/events';
import { createEvent } from './types/events';

/**
 * ChatWidget - Refactored component-based chat widget with welcome screen
 * 
 * This simplified version delegates UI management to ViewManager and focuses on:
 * - Orchestrating component interactions
 * - Managing widget lifecycle
 * - Handling agent initialization
 * - Coordinating state and persistence
 */
export class ChatWidget {
  // Track instances by containerId
  private static instances: Map<string, ChatWidget> = new Map();

  // Core properties
  private config!: ChatConfig;
  private state!: ChatState;
  private element!: HTMLElement;
  private containerId: string;
  private conversationId!: string;
  private theme!: ChatTheme;
  private assets!: ChatAssets;

  // Core managers
  private configManager!: ConfigManager;
  private stateManager!: StateManager;
  private fileUploadManager!: FileUploadManager;
  private styleManager!: StyleManager;
  private persistenceManager: PersistenceManager | null = null;

  // New component architecture
  private viewManager!: ViewManager;
  private conversationManager!: ConversationManager;
  
  // Core services
  private apiService!: ApiService;
  private messageService!: MessageService;
  private agentService!: AgentService;
  private eventBus!: EventBus;
  private errorHandler!: ErrorHandler;
  private messageHandler: MessageHandler | null = null;
  private fileHandler: FileHandler | null = null;

  // Logger instance
  private logger!: Logger;
  
  // Event subscriptions for cleanup
  private eventSubscriptions: EventSubscription[] = [];

  // Runtime state
  private isProcessingMessage: boolean = false;
  
  // Client metadata
  private clientMetadata: ClientMetadata = {};

  // Timer handles
  private resizeTimeout: number | null = null;
  private saveDebounceTimer: number | null = null;


  constructor(config: ChatConfig & { containerId: string }) {
    // Initialize logger first
    this.logger = new Logger(config.debug, '[ChatWidget]');
    this.logger.info('🚀 ChatWidget initializing with welcome screen...');
    
    this.containerId = config.containerId;

    // Check for existing instance with this containerId
    const existingInstance = ChatWidget.instances.get(this.containerId);
    if (existingInstance) {
      existingInstance.destroy();
    }

    // Store the new instance
    ChatWidget.instances.set(this.containerId, this);

    // Initialize configuration and state
    this.initializeConfig(config);
    this.initializeState();
    this.initializeAssets();
    this.initializeServices();
    this.initializeManagers();
    this.initializeViewManager();
    
    // Create and mount widget (starts with welcome screen)
    this.createWidget();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.logger.info('✅ ChatWidget initialized successfully with welcome screen');
  }

  /**
   * Initialize configuration
   */
  private initializeConfig(config: ChatConfig & { containerId: string }): void {
    this.configManager = new ConfigManager(config);
    this.config = this.configManager.getConfig();
    this.logger.debug('Config initialized:', this.config);
  }

  /**
   * Initialize state management
   */
  private initializeState(): void {
    this.stateManager = new StateManager();
    
    // Initialize with welcome screen state
    this.state = this.stateManager.getInitialState();
    this.state.currentView = 'welcome';
    this.state.hasStartedConversation = false;

    // For corner variant, start closed to show toggle button first
    if (this.config.variant === 'corner') {
      this.state.isOpen = this.config.initiallyOpen || false;
    } else {
      this.state.isOpen = true; // Centered and inline variants are always "open"
    }

    this.logger.debug('State initialized:', this.state);
  }

  /**
   * Initialize assets and theme
   */
  private initializeAssets(): void {
    this.theme = this.configManager.getTheme();
    this.assets = this.configManager.getAssets();
    this.conversationId = this.generateConversationId();
  }

  /**
   * Initialize core services
   */
  private initializeServices(): void {
    // Core services
    this.apiService = new ApiService(this.config.apiUrl, this.config.debug);
    this.messageService = new MessageService(this.config.debug);
    this.agentService = new AgentService(this.config.debug);
    this.eventBus = new EventBus(this.config.debug);
    this.errorHandler = new ErrorHandler(this.messageService, this.eventBus, !!this.config.debug);
    
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
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize core managers (but not agent yet)
   */
  private initializeManagers(): void {
    // Style manager
    this.styleManager = new StyleManager(this.config.variant);
    this.styleManager.injectStyles();

    // Note: MessageRenderer is now handled by ConversationView

    // File upload manager (if enabled)
    if (this.config.enableAttachments) {
      this.fileUploadManager = new FileUploadManager(
        this.config.apiUrl,
        this.config.agentToken,
        this.conversationId
      );
    }

    // Persistence manager (delay loading conversations until needed)
    if (this.config.persistence?.enabled) {
      this.persistenceManager = new PersistenceManager(
        this.containerId,
        this.stateManager,
        true,
        this.config.debug
      );
    }

    // Client metadata collection
    this.clientMetadata = ClientMetadataCollector.collect();
  }

  /**
   * Initialize view manager with event handlers
   */
  private initializeViewManager(): void {
    // We'll create the view manager after the main container is ready
  }

  /**
   * Create the widget structure and view manager
   */
  private createWidget(): void {
    // Create main container
    this.element = document.createElement('div');
    this.element.className = `am-chat-widget am-chat-widget--${this.config.variant}`;
    this.element.setAttribute('data-container', this.containerId);

    // Create main container for views
    const mainContainer = document.createElement('div');
    mainContainer.className = 'am-chat-container';
    this.element.appendChild(mainContainer);

    // Initialize view manager with main container
    this.viewManager = new ViewManager(
      this.config,
      this.theme,
      this.assets,
      mainContainer,
      {
        onToggle: this.emitToggleEvent.bind(this),
        onExpand: this.handleExpand.bind(this),
        onSend: this.emitSendEvent.bind(this),
        onInputKey: this.handleInputKey.bind(this),
        onPromptClick: this.emitPromptClickEvent.bind(this),
        onAttachmentClick: this.handleAttachmentClick.bind(this),
        onFileSelect: this.handleFileSelect.bind(this),
        onAttachmentRemove: this.handleAttachmentRemove.bind(this),
        onViewTransition: this.handleViewTransition.bind(this)
      }
    );

    // For corner variant, create toggle button via ViewManager
    if (this.config.variant === 'corner') {
      const toggleButton = this.viewManager.createToggleButton();
      if (toggleButton) {
        this.element.appendChild(toggleButton);
      }
    }

    // Mount to container
    this.mountToContainer();

    // Apply initial UI state
    this.updateUI();
    
    // Setup conversation management if persistence is enabled
    if (this.persistenceManager) {
      this.setupConversationManagement();
    }
  }


  /**
   * Mount widget to appropriate container
   */
  private mountToContainer(): void {
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
   * Setup event listeners for EventBus communication
   */
  private setupEventListeners(): void {
    // Window resize handling
    window.addEventListener('resize', this.handleResize.bind(this));

    // State change subscriptions
    this.stateManager.subscribe(this.handleStateChange.bind(this));
    
    // EventBus subscriptions
    this.eventSubscriptions.push(
      this.eventBus.on('user:input', this.handleUserInputEvent.bind(this)),
      this.eventBus.on('user:prompt_click', this.handlePromptClickEvent.bind(this)),
      this.eventBus.on('user:toggle', this.handleToggleEvent.bind(this)),
      this.eventBus.on('view:transition_start', this.handleViewTransitionEvent.bind(this)),
      this.eventBus.on('message:sent', this.handleMessageSentEvent.bind(this)),
      this.eventBus.on('api:error', this.handleApiErrorEvent.bind(this)),
      
    );
    
    // Listen for new conversation event from ConversationView
    window.addEventListener('chatwidget:newconversation', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.source === 'conversation-view') {
        this.startNewConversation();
      }
    });
    
    // Emit widget initialized event
    this.eventBus.emit('widget:initialized', createEvent('widget:initialized', {
      config: this.config,
      variant: this.config.variant,
      source: 'ChatWidget'
    }));
  }

  /**
   * Emit toggle event (called by ViewManager)
   */
  private emitToggleEvent(): void {
    if (this.config.variant === 'corner') {
      const newOpenState = !this.state.isOpen;
      
      // Emit toggle event
      this.eventBus.emit('user:toggle', createEvent('user:toggle', {
        isOpen: newOpenState,
        source: 'ChatWidget'
      }));
      
      this.state.isOpen = newOpenState;
      this.stateManager.updateState(this.state);
      this.updateUI();
    }
  }

  /**
   * Handle expand button click
   */
  private handleExpand(): void {
    // TODO: Implement expand functionality
    this.logger.debug('Expand clicked');
  }

  /**
   * Emit send event (called by ViewManager)
   */
  private async emitSendEvent(): Promise<void> {
    const message = this.viewManager.getInputValue();
    if (!message) return;

    this.logger.warn('📤 EMIT SEND EVENT CALLED:', { 
      message: message.substring(0, 30) + '...', 
      source: this.viewManager.getCurrentView(),
      stack: new Error().stack?.split('\n').slice(1, 3).join('\n')
    });

    // Emit user input event
    this.eventBus.emit('user:input', createEvent('user:input', {
      message,
      source: this.viewManager.getCurrentView(),
      isFirstMessage: !this.state.hasStartedConversation
    }));
  }

  /**
   * Handle input key events
   */
  private handleInputKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.emitSendEvent();
    }
  }

  /**
   * Emit prompt click event (called by ViewManager)
   */
  private async emitPromptClickEvent(prompt: string): Promise<void> {
    this.logger.warn('📤 EMIT PROMPT CLICK EVENT CALLED:', { 
      prompt: prompt.substring(0, 30) + '...', 
      source: this.viewManager.getCurrentView(),
      stack: new Error().stack?.split('\n').slice(1, 3).join('\n')
    });
    
    // Emit prompt click event
    this.eventBus.emit('user:prompt_click', createEvent('user:prompt_click', {
      prompt,
      source: this.viewManager.getCurrentView(),
      isFirstMessage: !this.state.hasStartedConversation
    }));
  }

  /**
   * Handle attachment button click
   */
  private handleAttachmentClick(): void {
    if (this.fileUploadManager) {
      const fileInput = this.viewManager.getElement('.chat-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }

  /**
   * Handle file selection
   */
  private async handleFileSelect(files: FileList): Promise<void> {
    this.ensureFileHandler();
    if (this.fileHandler && files.length > 0) {
      this.fileHandler.handleFileSelection(files);
    }
  }

  /**
   * Handle attachment removal
   */
  private handleAttachmentRemove(fileId: string): void {
    this.ensureFileHandler();
    if (this.fileHandler) {
      this.fileHandler.removeAttachment(fileId);
    }
  }

  /**
   * Handle view transitions
   */
  private handleViewTransition(from: string, to: string): void {
    this.logger.debug(`View transition: ${from} → ${to}`);
    
    // Update state
    this.state.currentView = to as 'welcome' | 'conversation';
    this.stateManager.updateState(this.state);
  }


  /**
   * Handle window resize
   */
  private handleResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = window.setTimeout(() => {
      this.updateResponsiveLayout();
    }, 100);
  }

  /**
   * Handle state changes
   */
  private handleStateChange(newState: ChatState): void {
    this.state = newState;
    this.updateUI();
  }

  /**
   * Update UI based on current state
   */
  private updateUI(): void {
    if (!this.element) return;

    const container = this.element.querySelector('.am-chat-container') as HTMLDivElement;

    if (this.config.variant === 'corner') {
      // Handle corner variant show/hide logic
      if (container) {
        container.style.display = this.state.isOpen ? 'flex' : 'none';
      }
      
      // Update toggle button via ViewManager
      this.viewManager?.updateToggleButton(this.state.isOpen);

      this.updateResponsiveLayout();
    } else {
      // For centered and inline variants, always show container
      if (container) {
        container.style.display = 'flex';
      }
    }

    // Update view manager
    if (this.viewManager) {
      this.viewManager.updateUI(this.state);
    }
  }

  /**
   * Update responsive layout
   */
  private updateResponsiveLayout(): void {
    if (this.config.variant !== 'corner' || !this.element) return;

    const container = this.element.querySelector('.am-chat-container') as HTMLElement;
    if (!container) return;

    const isMobile = window.innerWidth <= 480;

    if (isMobile) {
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.borderRadius = '0';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.position = 'fixed';
    } else {
      container.style.width = this.config.initialWidth || '400px';
      container.style.height = this.config.initialHeight || '600px';
      container.style.borderRadius = '12px';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.position = 'fixed';
    }
  }

  /**
   * Generate a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }


  /**
   * Add message to conversation view
   */
  public addMessageToView(message: Message): void {
    this.ensureMessageHandler();
    this.messageHandler!.addMessageToView(message);
  }

  /**
   * Ensure MessageHandler is initialized
   */
  private ensureMessageHandler(): void {
    if (!this.messageHandler && this.viewManager) {
      this.messageHandler = new MessageHandler(
        this.stateManager,
        this.viewManager,
        this.apiService,
        this.messageService,
        this.agentService,
        this.errorHandler,
        this.eventBus,
        this.persistenceManager,
        !!this.config.debug
      );
    }
  }

  /**
   * Ensure FileHandler is initialized
   */
  private ensureFileHandler(): void {
    if (!this.fileHandler && this.viewManager && this.config.enableAttachments) {
      this.fileHandler = new FileHandler(
        this.viewManager,
        this.eventBus,
        this.errorHandler,
        this.config.apiUrl,
        this.config.agentToken,
        !!this.config.debug
      );
    }
  }


  /**
   * Public API methods
   */

  /**
   * Get current view type
   */
  public getCurrentView(): 'welcome' | 'conversation' {
    return this.viewManager?.getCurrentView() || 'welcome';
  }

  /**
   * Start a new conversation (reset to welcome screen)
   */
  public async startNewConversation(): Promise<void> {
    if (this.viewManager?.getCurrentView() === 'conversation') {
      await this.viewManager.transitionToWelcome();
      this.state.hasStartedConversation = false;
      this.state.currentView = 'welcome';
      this.stateManager.updateState(this.state);
    }
  }

  /**
   * Update theme colors
   */
  public updateTheme(theme: Partial<ChatTheme>): void {
    this.theme = { ...this.theme, ...theme };
    this.styleManager?.updateTheme(theme);
    this.viewManager?.updateTheme(theme);
  }

  /**
   * Destroy the widget and clean up
   */
  public destroy(): void {
    this.logger.info('🗑️ Destroying ChatWidget...');

    // Emit widget destroyed event
    this.eventBus.emit('widget:destroyed', createEvent('widget:destroyed', {
      reason: 'programmatic',
      source: 'ChatWidget'
    }));
    
    // Clean up event subscriptions
    this.eventSubscriptions.forEach(subscription => subscription.unsubscribe());
    this.eventSubscriptions = [];
    
    // Clean up managers and services
    this.viewManager?.destroy();
    this.styleManager?.removeStyles();
    this.agentService?.reset();
    this.messageHandler?.destroy();
    this.fileHandler?.destroy();
    
    // Clear timers
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Remove DOM element
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // Remove from instances
    ChatWidget.instances.delete(this.containerId);

    this.logger.info('✅ ChatWidget destroyed');
  }

  /**
   * Send message using MessageHandler
   */
  private async sendMessageDirect(message: string): Promise<void> {
    this.logger.debug('Sending message via MessageHandler');
    
    // Mark that user has started conversation
    this.state.hasStartedConversation = true;
    
    // Ensure MessageHandler is initialized
    this.ensureMessageHandler();
    
    // Use MessageHandler for the complete flow
    await this.messageHandler!.sendMessage(
      message,
      this.conversationId,
      {
        agentToken: this.config.agentToken,
        clientMetadata: Object.keys(this.clientMetadata).length > 0 ? this.clientMetadata : undefined
      }
    );
  }









  /**
   * Event Handlers for EventBus communication
   */
   
  /**
   * Handle user input events from EventBus
   */
  private async handleUserInputEvent(event: UserInputEvent): Promise<void> {
    const { message, source } = event;
    
    // Prevent duplicate processing
    if (this.isProcessingMessage) {
      this.logger.warn('⚠️ Already processing a message, ignoring duplicate event');
      return;
    }
    
    this.isProcessingMessage = true;
    
    try {
      this.logger.debug('🎯 Processing user input event:', { message: message.substring(0, 30) + '...', source });
      
      // Transition to conversation view if on welcome screen
      if (this.viewManager.getCurrentView() === 'welcome') {
        await this.viewManager.transitionToConversation();
        this.state.hasStartedConversation = true;
        this.state.currentView = 'conversation';
        
        // Wait a bit for the DOM to be ready after transition
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify messages container exists before proceeding
      const messagesContainer = this.viewManager.getMessagesContainer();
      if (!messagesContainer) {
        this.logger.error('Messages container not available after transition');
        return;
      }

      // Clear input immediately for better UX
      this.viewManager.clearInput();

      // Send message via API
      await this.sendMessageDirect(message);

      // Hide prompts after first message
      this.viewManager.hideMessagePrompts();
    } finally {
      this.isProcessingMessage = false;
    }
  }
  
  /**
   * Handle prompt click events from EventBus
   */
  private async handlePromptClickEvent(event: PromptClickEvent): Promise<void> {
    const { prompt, source } = event;
    
    // Prevent duplicate processing
    if (this.isProcessingMessage) {
      this.logger.warn('⚠️ Already processing a message, ignoring duplicate prompt event');
      return;
    }
    
    this.isProcessingMessage = true;
    
    try {
      this.logger.debug('🎯 Processing prompt click event:', { prompt: prompt.substring(0, 30) + '...', source });
      
      // Transition to conversation if on welcome screen
      if (this.viewManager.getCurrentView() === 'welcome') {
        await this.viewManager.transitionToConversation();
        this.state.hasStartedConversation = true;
        this.state.currentView = 'conversation';
        
        // Wait a bit for the DOM to be ready after transition
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify messages container exists before proceeding
      const messagesContainer = this.viewManager.getMessagesContainer();
      if (!messagesContainer) {
        this.logger.error('Messages container not available after transition');
        return;
      }

      // Send the prompt as a message
      await this.sendMessageDirect(prompt);

      // Hide prompts after selection
      this.viewManager.hideMessagePrompts();
    } finally {
      this.isProcessingMessage = false;
    }
  }
  
  /**
   * Handle toggle events from EventBus
   */
  private handleToggleEvent(event: EventData<'user:toggle'>): void {
    // Toggle event already processed, just log
    this.logger.debug('Toggle event processed via EventBus:', event);
  }
  
  /**
   * Handle view transition events from EventBus
   */
  private handleViewTransitionEvent(event: ViewTransitionEvent): void {
    this.logger.debug('View transition event received:', event);
    
    // Emit transition end event after processing
    setTimeout(() => {
      this.eventBus.emit('view:transition_end', createEvent('view:transition_end', {
        from: event.from,
        to: event.to,
        reason: event.reason,
        source: 'ChatWidget'
      }));
      
      this.eventBus.emit('view:changed', createEvent('view:changed', {
        currentView: event.to,
        previousView: event.from,
        source: 'ChatWidget'
      }));
    }, 300); // Match transition duration
  }
  
  /**
   * Handle message sent events from EventBus
   */
  private handleMessageSentEvent(event: EventData<'message:sent'>): void {
    this.logger.debug('Message sent event received:', event);
    // Additional processing can be added here
  }
  
  /**
   * Handle API error events from EventBus
   */
  private handleApiErrorEvent(event: EventData<'api:error'>): void {
    this.logger.error('API error event received:', event);
    
    // Emit error occurred event for higher-level error handling
    this.eventBus.emit('error:occurred', createEvent('error:occurred', {
      error: event.error,
      context: `API call to ${event.endpoint}`,
      severity: 'high',
      userVisible: true,
      source: 'ChatWidget'
    }));
  }


  /**
   * Conversation management methods
   */
  
  /**
   * Handle new conversation creation
   */
  private handleNewConversation(): void {
    this.logger.debug('Creating new conversation');
    
    // Generate new conversation ID
    const newConversationId = this.generateConversationId();
    
    // Save current conversation if it has messages
    if (this.persistenceManager && this.state.messages.length > 0) {
      this.persistenceManager.saveMessages();
    }
    
    // Reset to new conversation
    this.conversationId = newConversationId;
    if (this.messageHandler) {
      this.messageHandler.resetMessageCount();
    }
    
    // Clear state and UI
    this.state.messages = [];
    this.state.hasStartedConversation = false;
    this.stateManager.updateState(this.state);
    
    // Clear conversation view if active
    if (this.viewManager?.getCurrentView() === 'conversation') {
      this.viewManager.clearMessages();
    }
    
    // Transition to welcome screen
    this.startNewConversation();
  }
  
  /**
   * Handle conversation switching
   */
  private handleSwitchConversation(conversationId: string): void {
    this.logger.debug('Switching to conversation:', conversationId);
    
    if (!this.persistenceManager) {
      this.logger.warn('Cannot switch conversations: persistence not enabled');
      return;
    }
    
    try {
      // Save current conversation
      if (this.state.messages.length > 0) {
        this.persistenceManager.saveMessages();
      }
      
      // Switch to the target conversation
      this.persistenceManager.switchTo(conversationId);
      
      // Load messages for the new conversation
      const messages = this.persistenceManager.loadMessages();
      
      // Update current conversation
      this.conversationId = conversationId;
      
      // Update state
      this.state.messages = messages;
      this.state.hasStartedConversation = messages.length > 0;
      this.stateManager.updateState(this.state);
      
      // Update UI
      if (messages.length > 0) {
        // Switch to conversation view and load messages
        if (this.viewManager?.getCurrentView() === 'welcome') {
          this.viewManager.transitionToConversation();
        }
        
        // Use MessageHandler to load messages
        this.ensureMessageHandler();
        this.messageHandler!.loadMessages(messages);
      } else {
        // Empty conversation - go to welcome screen
        this.startNewConversation();
      }
    } catch (error) {
      const errorMessage = this.errorHandler.handleStorageError(
        'load',
        error instanceof Error ? error : new Error(String(error)),
        conversationId
      );
      this.addMessageToView(errorMessage);
    }
  }
  
  /**
   * Handle conversation deletion
   */
  private handleDeleteConversation(conversationId: string): void {
    this.logger.debug('Deleting conversation:', conversationId);
    
    if (!this.persistenceManager) {
      this.logger.warn('Cannot delete conversation: persistence not enabled');
      return;
    }
    
    try {
      // Delete the conversation
      this.persistenceManager.delete(conversationId);
      
      // If we deleted the current conversation, start a new one
      if (conversationId === this.conversationId) {
        this.handleNewConversation();
      }
      
      // Update conversation list UI
      const conversations = this.persistenceManager.list();
      const currentId = this.persistenceManager.getCurrentId();
      this.conversationManager?.updateConversationList(conversations, currentId || undefined);
    } catch (error) {
      const errorMessage = this.errorHandler.handleStorageError(
        'delete',
        error instanceof Error ? error : new Error(String(error)),
        conversationId
      );
      this.addMessageToView(errorMessage);
    }
  }
  
  /**
   * Handle conversation list view toggle
   */
  private handleToggleListView(): void {
    this.logger.debug('Toggling conversation list view');
    
    // The ConversationManager handles the UI toggle internally
    // This method is called when the list is shown/hidden
    
    // We can add any additional logic here if needed
    // For example, updating analytics or state tracking
  }
  
  /**
   * Setup conversation management features
   */
  private setupConversationManagement(): void {
    if (!this.persistenceManager || !this.conversationManager) {
      this.logger.debug('Conversation management not available - persistence or manager missing');
      return;
    }
    
    this.logger.debug('Setting up conversation management');
    
    // Check if we have existing conversations
    const conversations = this.persistenceManager.list();
    const currentId = this.persistenceManager.getCurrentId();
    
    // Update conversation manager with existing conversations
    if (conversations.length > 0) {
      this.conversationManager.updateConversationList(conversations, currentId || undefined);
    }
    
    // Listen for conversation count changes to update conversation list
    this.eventBus.on('conversation:saved', () => {
      const currentConversations = this.persistenceManager!.list();
      const currentId = this.persistenceManager!.getCurrentId();
      this.conversationManager?.updateConversationList(currentConversations, currentId || undefined);
    });
    
    // Auto-save current conversation when user starts typing
    this.eventBus.on('message:sent', () => {
      // Ensure current conversation is saved
      if (this.state.messages.length > 0 && this.persistenceManager) {
        this.persistenceManager.saveMessages();
        
        // Update conversation list
        const conversations = this.persistenceManager.list();
        const currentId = this.persistenceManager.getCurrentId();
        this.conversationManager?.updateConversationList(conversations, currentId || undefined);
      }
    });
  }

  /**
   * Static methods
   */

  /**
   * Get existing instance by container ID
   */
  public static getInstance(containerId: string): ChatWidget | undefined {
    return ChatWidget.instances.get(containerId);
  }

  /**
   * Destroy all instances
   */
  public static destroyAll(): void {
    ChatWidget.instances.forEach(instance => instance.destroy());
    ChatWidget.instances.clear();
  }
}
// ChatWidget.ts - Service-based ChatWidget architecture
import type { ChatConfig, ChatState, ChatTheme, ChatAssets, Message } from './types/types';
import { PersistenceManager } from './PersistenceManager';
import { ConfigManager } from './ConfigManager';
import { StateManager } from './StateManager';
import { StyleManager } from './styles/style-manager';
import { ViewManager } from './components/ViewManager';
import { ConversationManager } from './components/ConversationManager';
import { Logger } from './utils/logger';
import { ApiService } from './services/ApiService';
import { MessageService } from './services/MessageService';
import { AgentService } from './services/AgentService';
import { EventBus, type EventSubscription } from './utils/EventBus';
import { ErrorHandler } from './handlers/ErrorHandler';
import { MessageHandler } from './handlers/MessageHandler';
import { FileHandler } from './handlers/FileHandler';
import { ConversationOrchestrator } from './handlers/ConversationOrchestrator';
import type { UserInputEvent, PromptClickEvent, ViewTransitionEvent } from './types/events';
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
  private theme!: ChatTheme;
  private assets!: ChatAssets;

  // Core managers
  private configManager!: ConfigManager;
  private stateManager!: StateManager;
  private styleManager!: StyleManager;
  private persistenceManager: PersistenceManager | null = null;

  // New component architecture
  private viewManager!: ViewManager;
  private conversationManager!: ConversationManager;
  
  // Core services
  private apiService!: ApiService;
  private messageService!: MessageService;
  private agentService!: AgentService;
  
  // State flags
  private isSwitchingConversation: boolean = false;
  private floatingPromptsTimeout: NodeJS.Timeout | null = null;
  private eventBus!: EventBus;
  private errorHandler!: ErrorHandler;
  private messageHandler: MessageHandler | null = null;
  private fileHandler: FileHandler | null = null;
  private conversationOrchestrator: ConversationOrchestrator | null = null;

  // Logger instance
  private logger!: Logger;
  
  // Event subscriptions for cleanup
  private eventSubscriptions: EventSubscription[] = [];

  // Agent capabilities (extracted from API metadata)
  private supportedMimeTypes: string[] = [];
  private supportsAttachments: boolean = false;
  private agentCapabilities: any = null;
  private isInitializingAgent: boolean = false;

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
  }

  /**
   * Initialize core services
   */
  private initializeServices(): void {
    // Core services
    this.apiService = new ApiService(this.config.apiUrl, this.config.debug);
    this.messageService = new MessageService(this.config.apiUrl, this.config.debug);
    this.agentService = new AgentService(this.config.debug);
    this.eventBus = new EventBus(this.config.debug);
    this.errorHandler = new ErrorHandler(this.messageService, this.eventBus, !!this.config.debug);
    
    // Initialize conversation manager
    this.conversationManager = new ConversationManager(
      this.config,
      this.theme,
      {
        onNewConversation: () => this.handleNewConversation(),
        onSwitchConversation: (id) => this.handleSwitchConversation(id),
        onDeleteConversation: (id) => this.handleDeleteConversation(id),
        onToggleListView: () => this.handleToggleListView()
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
    // Note: File handling is now managed by FileHandler

    // Persistence manager (delay loading conversations until needed)
    if (this.config.persistence?.enabled) {
      this.persistenceManager = new PersistenceManager(
        this.containerId,
        this.stateManager,
        true,
        this.config.debug
      );
    }

  }


  /**
   * Create the widget structure and view manager
   */
  private createWidget(): void {
    // Create main container
    this.element = document.createElement('div');
    this.element.className = `am-chat-widget am-chat-widget--${this.config.variant}`;
    this.element.setAttribute('data-container', this.containerId);
    
    // Apply theme CSS variables to widget element
    this.applyThemeToWidget();

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
        onViewTransition: this.handleViewTransition.bind(this),
        onConversationsClick: this.handleConversationsClickFromWelcome.bind(this)
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
    
    // Show floating prompts if widget starts closed (corner variant only)
    if (this.config.variant === 'corner' && !this.config.initiallyOpen && !this.state.isOpen) {
      this.floatingPromptsTimeout = setTimeout(() => {
        this.showFloatingPrompts();
        this.floatingPromptsTimeout = null;
      }, 5000);
    }
    
    // Setup conversation management if persistence is enabled
    if (this.persistenceManager) {
      this.setupConversationManagement();
    }
    
    // Initialize agent capabilities when widget is created
    // This ensures we know what file types are supported before the user starts
    this.initializeAgent();
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
      this.eventBus.on('view:transition_start', this.handleViewTransitionEvent.bind(this)),
      
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
      
      // Handle floating prompts
      if (newOpenState) {
        // Clear any pending timeout
        if (this.floatingPromptsTimeout) {
          clearTimeout(this.floatingPromptsTimeout);
          this.floatingPromptsTimeout = null;
        }
        this.hideFloatingPrompts();
        // Focus input when opening widget
        setTimeout(() => {
          this.viewManager?.focusInput();
        }, 150);
        
        // Check if we have an existing conversation with messages
        if (this.persistenceManager) {
          const currentId = this.persistenceManager.getCurrentId();
          if (currentId) {
            const messages = this.persistenceManager.loadMessages();
            if (messages && messages.length > 0) {
              // We have messages, go directly to conversation view
              this.logger.debug('Opening widget with existing conversation, skipping welcome screen');
              // Ensure we're in conversation view
              if (this.viewManager.getCurrentView() === 'welcome') {
                this.viewManager.transitionToConversation();
                // Restore the messages
                this.restoreCurrentConversation();
              }
            }
          }
        }
      } else {
        // Show floating prompts after 5 seconds delay
        this.floatingPromptsTimeout = setTimeout(() => {
          this.showFloatingPrompts();
          this.floatingPromptsTimeout = null;
        }, 5000);
      }
    }
  }

  /**
   * Handle expand button click
   */
  private handleExpand(): void {
    if (!this.element || this.config.variant !== 'corner') return;
    
    const isExpanded = this.element.classList.contains('am-chat-expanded');
    
    if (isExpanded) {
      // Collapse to normal size
      this.element.classList.remove('am-chat-expanded');
      // Update button icon via ViewManager
      this.viewManager?.updateExpandButton(false);
    } else {
      // Expand to fullscreen
      this.element.classList.add('am-chat-expanded');
      // Update button icon via ViewManager
      this.viewManager?.updateExpandButton(true);
    }
    
    this.logger.debug('Expand toggled:', !isExpanded);
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
    const fileInput = this.viewManager.getElement('.chat-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
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

    // Update header buttons when transitioning to conversation view
    if (to === 'conversation' && this.persistenceManager) {
      // Small delay to ensure view is ready
      setTimeout(() => {
        this.updateConversationHeaderButtons();
      }, 100);
    }
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
      container.style.width = this.config.initialWidth || '480px';
      container.style.height = this.config.initialHeight || '600px';
      container.style.borderRadius = '12px';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.position = 'fixed';
    }
    
    // Initialize MessageHandler if needed
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
    
    // Initialize FileHandler if needed
    this.ensureFileHandler();
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
        !!this.config.debug,
        () => this.persistenceManager?.getConversationId() || null,
        () => this.ensureConversationExists()
      );
      
      // Update supported MIME types if agent capabilities are available
      if (this.supportedMimeTypes.length > 0) {
        this.fileHandler.updateSupportedMimeTypes(this.supportedMimeTypes);
      }
    }
  }

  /**
   * Ensure a conversation exists, creating one if necessary
   * Used when files are uploaded from welcome screen
   */
  private ensureConversationExists(): string {
    // If we already have a conversation ID, return it
    const existingId = this.persistenceManager?.getConversationId();
    if (existingId) {
      return existingId;
    }
    
    // Create a new conversation
    if (this.persistenceManager) {
      const newId = this.persistenceManager.create('New chat');
      this.logger.info('Created new conversation for file upload:', newId);
      
      // Initialize the conversation orchestrator to prepare for messages
      this.ensureConversationOrchestrator();
      
      // If we're in welcome screen, transition to conversation view
      if (this.viewManager?.getCurrentView() === 'welcome') {
        this.viewManager.transitionToConversation().then(() => {
          // Update state to reflect we've started a conversation
          this.state.hasStartedConversation = true;
          this.state.currentView = 'conversation';
          this.stateManager.updateState(this.state);
        });
      }
      
      return newId;
    }
    
    throw new Error('Cannot create conversation: PersistenceManager not available');
  }
  
  /**
   * Ensure ConversationOrchestrator is initialized
   */
  private ensureConversationOrchestrator(): void {
    if (!this.conversationOrchestrator && this.viewManager) {
      // Ensure handlers are initialized first
      this.ensureFileHandler();
      
      // Initialize MessageHandler if needed
      if (!this.messageHandler) {
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
      
      this.conversationOrchestrator = new ConversationOrchestrator(
        this.config,
        this.stateManager,
        this.viewManager,
        this.messageHandler!,
        this.fileHandler,
        this.errorHandler,
        this.eventBus,
        this.persistenceManager,
        !!this.config.debug
      );
      
      // Don't initialize with a conversation - let the user start one
      // This prevents creating orphaned conversations that aren't tracked by persistence
      this.logger.debug('ConversationOrchestrator created, waiting for user interaction');
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
   * Apply theme CSS variables to the widget element
   */
  private applyThemeToWidget(): void {
    if (!this.element) return;
    
    Object.entries(this.theme).forEach(([key, value]) => {
      if (value) {
        // Inline camelToKebab conversion to ensure it's not tree-shaken
        const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
        const cssVarName = `--chat-${kebabKey}`;
        this.element!.style.setProperty(cssVarName, value);
      }
    });
  }

  /**
   * Update theme colors
   */
  public updateTheme(theme: Partial<ChatTheme>): void {
    this.theme = { ...this.theme, ...theme };
    this.applyThemeToWidget();
    this.styleManager?.updateTheme(theme);
    this.viewManager?.updateTheme(theme);
  }

  /**
   * Destroy the widget and clean up
   */
  public destroy(): void {
    this.logger.info('🗑️ Destroying ChatWidget...');

    // Clear floating prompts timeout
    if (this.floatingPromptsTimeout) {
      clearTimeout(this.floatingPromptsTimeout);
      this.floatingPromptsTimeout = null;
    }
    
    // Hide floating prompts
    this.hideFloatingPrompts();

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
    this.conversationOrchestrator?.destroy();
    
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
   * Event Handlers for EventBus communication
   */
   
  /**
   * Handle user input events from EventBus
   */
  private async handleUserInputEvent(event: UserInputEvent): Promise<void> {
    const { message } = event;
    
    // Clear input immediately for better UX
    this.viewManager.clearInput();
    
    // Ensure ConversationOrchestrator is initialized
    this.ensureConversationOrchestrator();
    
    // Use orchestrator to send message
    await this.conversationOrchestrator!.sendMessage(message);
    
    // Hide prompts after first message
    this.viewManager.hideMessagePrompts();
  }
  
  /**
   * Handle prompt click events from EventBus
   */
  private async handlePromptClickEvent(event: PromptClickEvent): Promise<void> {
    const { prompt } = event;
    
    // Ensure ConversationOrchestrator is initialized
    this.ensureConversationOrchestrator();
    
    // Use orchestrator to handle prompt click
    await this.conversationOrchestrator!.handlePromptClick(prompt);
    
    // Hide prompts after selection
    this.viewManager.hideMessagePrompts();
  }
  
  
  /**
   * Handle view transition events from EventBus
   */
  private handleViewTransitionEvent(event: ViewTransitionEvent): void {
    this.logger.debug('View transition event received:', event);
    
    // Update state based on view transition
    this.state.currentView = event.to;
    this.stateManager.updateState(this.state);
  }
  
  


  /**
   * Conversation management methods
   */
  
  /**
   * Handle new conversation creation
   */
  private async handleNewConversation(): Promise<void> {
    this.logger.debug('Creating new conversation');
    
    // Ensure ConversationOrchestrator is initialized
    this.ensureConversationOrchestrator();
    
    // Close conversation list view if open
    if (this.conversationManager && this.conversationManager.isListViewActive()) {
      this.conversationManager.toggleListView();
    }
    
    // Use orchestrator to start new conversation
    await this.conversationOrchestrator!.startNewConversation();
    
    // Update header buttons after creating new conversation
    this.updateConversationHeaderButtons();
  }
  
  /**
   * Handle conversation switching
   */
  private async handleSwitchConversation(conversationId: string): Promise<void> {
    this.logger.debug('Switching to conversation:', conversationId);
    
    // Set a flag to indicate we're switching conversations
    this.isSwitchingConversation = true;
    
    // Ensure ConversationOrchestrator is initialized
    this.ensureConversationOrchestrator();
    
    // Close conversation list if it's open
    if (this.conversationManager) {
      this.conversationManager.closeListView();
    }
    
    // If we're still in welcome view, transition to conversation view first
    if (this.viewManager && this.viewManager.getCurrentView() === 'welcome') {
      await this.viewManager.transitionToConversation();
      // Small delay to ensure view is ready
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Use orchestrator to switch conversations
    await this.conversationOrchestrator!.loadConversation(conversationId);
    
    // Mark that we've started a conversation
    this.state.hasStartedConversation = true;
    this.state.currentView = 'conversation';
    
    // Clear the flag after switching is complete
    this.isSwitchingConversation = false;
    this.stateManager.updateState(this.state);
    
    // Close conversation list view and return to chat
    if (this.conversationManager && this.conversationManager.isListViewActive()) {
      this.conversationManager.toggleListView();
      
      // Ensure all chat elements are properly visible after conversation load
      setTimeout(() => {
        const mainContainer = this.viewManager.getContainer();
        const messagesContainer = mainContainer.querySelector('.am-chat-messages') as HTMLElement;
        const inputWrapper = mainContainer.querySelector('.am-chat-input-wrapper') as HTMLElement;
        const branding = mainContainer.querySelector('.am-chat-branding') as HTMLElement;
        
        if (messagesContainer) {
          messagesContainer.style.display = '';
          messagesContainer.style.opacity = '';
          messagesContainer.style.transform = '';
          messagesContainer.classList.remove('sliding-out');
        }
        
        if (inputWrapper) {
          inputWrapper.style.display = '';
          inputWrapper.style.opacity = '';
          inputWrapper.style.transform = '';
          inputWrapper.classList.remove('sliding-out');
        }
        
        if (branding) {
          branding.style.display = '';
          branding.style.opacity = '';
          branding.style.transform = '';
          branding.classList.remove('sliding-out');
        }
      }, 350); // After animation completes
    }
    
    // Update conversation list UI
    if (this.persistenceManager && this.conversationManager) {
      const conversations = this.persistenceManager.list();
      const currentId = this.persistenceManager.getCurrentId();
      this.conversationManager.updateConversationList(conversations, currentId || undefined);
    }
    
    // Update header buttons after switching
    this.updateConversationHeaderButtons();
  }
  
  /**
   * Handle conversation deletion
   */
  private async handleDeleteConversation(conversationId: string): Promise<void> {
    this.logger.debug('Deleting conversation:', conversationId);
    
    // Ensure ConversationOrchestrator is initialized
    this.ensureConversationOrchestrator();
    
    // Use orchestrator to delete conversation
    await this.conversationOrchestrator!.deleteConversation(conversationId);
    
    // Update conversation list UI
    if (this.persistenceManager && this.conversationManager) {
      const conversations = this.persistenceManager.list();
      const currentId = this.persistenceManager.getCurrentId();
      this.conversationManager.updateConversationList(conversations, currentId || undefined);
    }
    
    // Update header buttons after deletion
    this.updateConversationHeaderButtons();
  }
  
  /**
   * Handle conversations click from welcome screen
   */
  private handleConversationsClickFromWelcome(): void {
    this.logger.debug('Conversations clicked from welcome screen');
    
    if (!this.conversationManager || !this.viewManager || !this.persistenceManager) {
      return;
    }
    
    // Check if we have any conversations to show
    const conversations = this.persistenceManager.list();
    if (conversations.length === 0) {
      this.logger.debug('No conversations to show');
      return;
    }
    
    // Transition to conversation view first
    this.viewManager.transitionToConversation().then(() => {
      // Small delay to ensure header is fully rendered
      setTimeout(() => {
        // Update conversation list with current data
        const currentId = this.persistenceManager!.getCurrentId();
        this.conversationManager!.updateConversationList(conversations, currentId || undefined);
        
        // Then toggle the conversation list to show it, marking it came from welcome
        this.conversationManager!.toggleListView('welcome');
      }, 100);
    });
  }
  
  /**
   * Handle conversation list view toggle
   */
  private handleToggleListView(): void {
    this.logger.debug('handleToggleListView called');
    
    // If we're in the middle of switching conversations, don't handle toggle
    if (this.isSwitchingConversation) {
      return;
    }
    
    if (!this.conversationManager || !this.viewManager) {
      return;
    }

    // Note: isListViewActive() returns the state AFTER toggle has been called
    const isListViewNowActive = this.conversationManager.isListViewActive();
    const sourceView = this.conversationManager.getSourceView();
    
    // Get chat area elements from conversation view
    const mainContainer = this.viewManager.getContainer();
    const messagesContainer = mainContainer.querySelector('.am-chat-messages') as HTMLElement;
    const inputWrapper = mainContainer.querySelector('.am-chat-input-wrapper') as HTMLElement;
    const branding = mainContainer.querySelector('.am-chat-branding') as HTMLElement;
    
    if (isListViewNowActive) {
      // List view is now active - hide chat elements and main header
      if (messagesContainer) {
        messagesContainer.style.display = 'none';
      }
      if (inputWrapper) {
        inputWrapper.style.display = 'none';
      }
      if (branding) {
        branding.style.display = 'none';
      }
      
      // Hide the main chat header when list view is active
      const mainHeader = this.viewManager.getHeaderElement();
      if (mainHeader) {
        mainHeader.style.display = 'none';
      }
    } else {
      // List view is now inactive - check where to return
      
      // Check if we have an active conversation loaded
      const hasActiveConversation = this.conversationOrchestrator?.hasActiveConversation() || false;
      
      if (sourceView === 'welcome' && !hasActiveConversation) {
        // Only return to welcome screen if we came from there AND no conversation is loaded
        this.viewManager.transitionToWelcome();
      } else {
        // Stay in conversation view if we have an active conversation
        if (messagesContainer) {
          // Ensure messages container is fully visible
          messagesContainer.style.display = 'flex';
          messagesContainer.style.opacity = '1';
          messagesContainer.style.transform = 'none';
          messagesContainer.style.visibility = 'visible';
          messagesContainer.classList.remove('sliding-out');
        }
        if (inputWrapper) {
          inputWrapper.style.display = 'flex';
          inputWrapper.style.opacity = '1';
          inputWrapper.style.transform = 'none';
          inputWrapper.style.visibility = 'visible';
          inputWrapper.classList.remove('sliding-out');
        }
        if (branding) {
          branding.style.display = 'flex';
          branding.style.opacity = '1';
          branding.style.transform = 'none';
          branding.style.visibility = 'visible';
          branding.classList.remove('sliding-out');
        }
        
        // Show the main chat header when returning to chat view
        const mainHeader = this.viewManager.getHeaderElement();
        if (mainHeader) {
          mainHeader.style.display = 'flex';
          mainHeader.style.visibility = 'visible';
          mainHeader.style.opacity = '1';
        }
      }
    }
    
    // Update conversation list with current data when opening
    if (isListViewNowActive && this.persistenceManager) {
      const conversations = this.persistenceManager.list();
      const currentId = this.persistenceManager.getCurrentId();
      this.conversationManager.updateConversationList(conversations, currentId || undefined);
    }
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

    // Add conversation list view to the main container
    const mainContainer = this.viewManager?.getContainer();
    if (mainContainer) {
      const conversationListView = this.conversationManager.createConversationListView();
      mainContainer.appendChild(conversationListView);
    } else {
      this.logger.error('Failed to get main container for conversation list view');
    }

    // Update header buttons based on conversation count
    this.updateConversationHeaderButtons();
    
    // Listen for conversation count changes to update UI
    this.eventBus.on('conversation:saved', () => {
      const currentConversations = this.persistenceManager!.list();
      const currentId = this.persistenceManager!.getCurrentId();
      this.conversationManager?.updateConversationList(currentConversations, currentId || undefined);
      
      // Update header buttons after save
      this.updateConversationHeaderButtons();
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
        
        // Update header buttons after new message
        this.updateConversationHeaderButtons();
      }
    });
  }

  /**
   * Update conversation header buttons based on current conversation count
   */
  private updateConversationHeaderButtons(): void {
    if (!this.persistenceManager || !this.conversationManager || !this.viewManager) {
      return;
    }

    const conversations = this.persistenceManager.list();
    const hasConversations = conversations.length > 0; // Show when there are any conversations
    
    
    // Update conversation header in conversation view
    this.viewManager.updateConversationHeader(this.conversationManager, hasConversations);
  }

  /**
   * Initialize agent and fetch capabilities
   */
  private async initializeAgent(): Promise<void> {
    if (this.isInitializingAgent) {
      this.logger.debug('Agent initialization already in progress');
      return;
    }
    
    this.isInitializingAgent = true;
    this.logger.info('🚀 Initializing agent capabilities...');
    
    try {
      // Use dedicated capabilities endpoint instead of sending a message
      const capabilities = await this.apiService.getAgentCapabilities(this.config.agentToken);
      
      // Process agent capabilities
      if (capabilities) {
        this.processAgentCapabilities(capabilities);
      }
      
      this.logger.info('✅ Agent capabilities initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize agent capabilities:', error);
      // Continue without capabilities - fallback to defaults
      this.supportedMimeTypes = [];
      this.supportsAttachments = false;
      this.agentCapabilities = null;
    } finally {
      this.isInitializingAgent = false;
    }
  }
  
  /**
   * Process agent capabilities from API metadata
   */
  private processAgentCapabilities(metadata: any): void {
    this.logger.debug('🔍 Processing agent capabilities from metadata:', metadata);
    
    // Extract capabilities
    this.agentCapabilities = metadata;
    this.supportedMimeTypes = metadata.supported_mime_types || [];
    
    // Check if agent supports attachments based on capabilities
    const capabilities = metadata.capabilities || {};
    this.supportsAttachments = !!(
      capabilities.supports_images || 
      capabilities.supports_audio || 
      capabilities.supports_video || 
      capabilities.supports_documents ||
      (this.supportedMimeTypes && this.supportedMimeTypes.length > 0)
    );
    
    this.logger.debug('📋 Agent capabilities extracted:', {
      supportedMimeTypes: this.supportedMimeTypes,
      supportsAttachments: this.supportsAttachments,
      capabilities: capabilities
    });
    
    // Update file input accept attribute if attachments are enabled
    if (this.config.enableAttachments) {
      // Configure attachments in all input components via ViewManager
      this.viewManager?.configureAttachments(this.supportedMimeTypes, this.supportsAttachments);
      
      // Update FileHandler with supported MIME types if it exists
      if (this.fileHandler && this.supportsAttachments) {
        this.fileHandler.updateSupportedMimeTypes(this.supportedMimeTypes);
      }
      
      if (!this.supportsAttachments) {
        this.logger.warn('⚠️ Attachments enabled in config but agent does not support attachments');
      }
    }
  }
  
  
  /**
   * Get agent capabilities
   */
  public getAgentCapabilities(): {
    supportedMimeTypes: string[];
    supportsAttachments: boolean;
    metadata: any;
  } {
    return {
      supportedMimeTypes: this.supportedMimeTypes,
      supportsAttachments: this.supportsAttachments,
      metadata: this.agentCapabilities
    };
  }

  /**
   * Restore the current conversation from persistence
   */
  private restoreCurrentConversation(): void {
    if (!this.persistenceManager) return;
    
    const messages = this.persistenceManager.loadMessages();
    if (messages.length === 0) return;
    
    // Ensure we have message handler initialized
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
    
    // Load messages into the UI
    if (this.messageHandler) {
      this.messageHandler.loadMessages(messages);
    }
    
    // Update state
    this.state.hasStartedConversation = true;
    this.state.messages = messages;
    this.stateManager.updateState(this.state);
    
    // Update conversation management UI
    this.updateConversationHeaderButtons();
    
    this.logger.debug(`Restored ${messages.length} messages from current conversation`);
    
    // Focus input after restoring conversation
    setTimeout(() => {
      this.viewManager?.focusInput();
    }, 200);
  }

  /**
   * Show floating prompts when widget is closed
   */
  private showFloatingPrompts(): void {
    if (this.config.variant !== 'corner' || !this.config.messagePrompts?.show) {
      return;
    }

    // Check if floating prompts already exist
    const existingPrompts = document.querySelector('.am-chat-floating-prompts-container');
    if (existingPrompts) return;

    const prompts = this.config.messagePrompts.prompts.filter(p => p && p.trim());
    if (prompts.length === 0) return;

    // Create floating prompts container
    const floatingPrompts = document.createElement('div');
    floatingPrompts.className = 'am-chat-floating-prompts-container';
    
    // Add welcome message
    const welcomeMessage = this.config.messagePrompts.welcome_message || 'How can I help you today?';
    
    floatingPrompts.innerHTML = `
      <div class="am-chat-floating-welcome-message">
        <div class="am-chat-floating-welcome-header">
          <div class="am-chat-floating-welcome-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
            </svg>
          </div>
          <div class="am-chat-floating-welcome-text">${this.escapeHtml(welcomeMessage)}</div>
        </div>
      </div>
      <div class="am-chat-floating-message-prompts">
        ${prompts.map(prompt => `
          <button class="am-chat-floating-message-prompt" 
                  data-prompt="${this.escapeHtml(prompt || '')}"
                  title="${this.escapeHtml(prompt || '')}">
            ${this.escapeHtml(prompt || '')}
          </button>
        `).join('')}
      </div>
    `;

    // Insert before toggle button
    const toggleButton = this.viewManager?.getToggleButton();
    if (toggleButton && toggleButton.parentElement) {
      toggleButton.parentElement.insertBefore(floatingPrompts, toggleButton);
      
      // Attach event listeners
      const promptButtons = floatingPrompts.querySelectorAll('.am-chat-floating-message-prompt');
      promptButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const prompt = (e.target as HTMLElement).getAttribute('data-prompt');
          if (prompt) {
            // Open widget and send prompt
            this.emitToggleEvent();
            // Wait for widget to open before sending prompt
            setTimeout(() => {
              this.emitPromptClickEvent(prompt);
            }, 400);
          }
        });
      });
    }
  }

  /**
   * Hide floating prompts
   */
  private hideFloatingPrompts(): void {
    const floatingPrompts = document.querySelector('.am-chat-floating-prompts-container');
    if (floatingPrompts) {
      floatingPrompts.remove();
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
// ChatWidget.ts - Service-based ChatWidget architecture
import type { ChatConfig, ChatState, ChatTheme, ChatAssets, Message, ClosedViewMode } from './types/types';
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
import { MarkdownLoader } from './utils/MarkdownLoader';
import * as icons from './assets/icons';
import type { WelcomeCardState } from './types/types';

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
  private inputBarCleanup: (() => void)[] = [];
  private inputBarTypewriterCleanup: (() => void) | null = null;
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

  // Welcome card state
  private welcomeCardStateMap = new WeakMap<HTMLElement, WelcomeCardState>();
  private isWelcomeCardAnimating: boolean = false;
  private activeWelcomeCard: HTMLElement | null = null;

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

    // Set position attribute for CSS selectors (floating prompts, etc.)
    if (this.config.position) {
      this.element.setAttribute('data-position', this.config.position);
    }

    // Apply theme CSS variables to widget element
    this.applyThemeToWidget();

    // Apply position CSS variables to widget element
    this.applyPositionToWidget();

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
        onConversationsClick: this.handleConversationsClickFromWelcome.bind(this),
        hasConversations: () => {
          // Check if persistence is enabled and there are conversations
          if (this.persistenceManager) {
            const conversations = this.persistenceManager.list();
            return conversations.length > 0;
          }
          return false;
        }
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
      // Input bar mode shows immediately, others wait 5 seconds
      const delay = this.config.agentClosedView === 'input-bar' ? 0 : 5000;
      this.floatingPromptsTimeout = setTimeout(() => {
        this.showFloatingPrompts();
        this.floatingPromptsTimeout = null;
      }, delay);
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
        // Reset dismissal when user manually opens widget - shows engagement
        this.resetFloatingPromptsDismissal();
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
        // Show floating prompts after delay (immediate for input-bar, 5s for others)
        const delay = this.config.agentClosedView === 'input-bar' ? 0 : 5000;
        this.floatingPromptsTimeout = setTimeout(() => {
          this.showFloatingPrompts();
          this.floatingPromptsTimeout = null;
        }, delay);
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

    // Check if there are any uploaded attachments
    const hasAttachments = (this.fileHandler?.getUploadedFileIds().length || 0) > 0;

    // Require either a message or attachments to proceed
    if (!message && !hasAttachments) return;

    this.logger.warn('📤 EMIT SEND EVENT CALLED:', {
      message: message ? message.substring(0, 30) + '...' : '(attachment only)',
      hasAttachments,
      source: this.viewManager.getCurrentView(),
      stack: new Error().stack?.split('\n').slice(1, 3).join('\n')
    });

    // Emit user input event
    this.eventBus.emit('user:input', createEvent('user:input', {
      message: message || '', // Allow empty message if there are attachments
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
        { streaming: this.config.streaming, debug: typeof this.config.debug === 'boolean' ? this.config.debug : false },
        !!this.config.debug
      );
    }
    
    // Initialize FileHandler if needed
    this.ensureFileHandler();
    
    // Connect FileHandler to MessageHandler
    if (this.messageHandler && this.fileHandler) {
      this.messageHandler.setFileHandler(this.fileHandler);
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
          { streaming: this.config.streaming, debug: typeof this.config.debug === 'boolean' ? this.config.debug : false },
          !!this.config.debug
        );
        
        // Connect FileHandler to MessageHandler
        if (this.fileHandler) {
          this.messageHandler.setFileHandler(this.fileHandler);
        }
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
   * Apply position CSS variables to the widget element
   */
  private applyPositionToWidget(): void {
    if (!this.element || !this.config.position) return;

    const position = this.config.position;

    // Clear all position variables first
    this.element.style.removeProperty('--chat-bottom');
    this.element.style.removeProperty('--chat-top');
    this.element.style.removeProperty('--chat-left');
    this.element.style.removeProperty('--chat-right');
    this.element.style.removeProperty('--chat-container-bottom');
    this.element.style.removeProperty('--chat-container-top');
    this.element.style.removeProperty('--chat-container-left');
    this.element.style.removeProperty('--chat-container-right');
    this.element.style.removeProperty('--chat-toggle-bottom');
    this.element.style.removeProperty('--chat-toggle-top');
    this.element.style.removeProperty('--chat-toggle-left');
    this.element.style.removeProperty('--chat-toggle-right');

    // Set position variables based on position config
    switch (position) {
      case 'bottom-right':
        this.element.style.setProperty('--chat-bottom', '12px');
        this.element.style.setProperty('--chat-right', '12px');
        this.element.style.setProperty('--chat-container-bottom', '20px');
        this.element.style.setProperty('--chat-container-right', '20px');
        this.element.style.setProperty('--chat-toggle-bottom', '12px');
        this.element.style.setProperty('--chat-toggle-right', '12px');
        break;
      case 'bottom-left':
        this.element.style.setProperty('--chat-bottom', '12px');
        this.element.style.setProperty('--chat-left', '12px');
        this.element.style.setProperty('--chat-container-bottom', '20px');
        this.element.style.setProperty('--chat-container-left', '20px');
        this.element.style.setProperty('--chat-toggle-bottom', '12px');
        this.element.style.setProperty('--chat-toggle-left', '12px');
        break;
      case 'top-right':
        this.element.style.setProperty('--chat-top', '12px');
        this.element.style.setProperty('--chat-right', '12px');
        this.element.style.setProperty('--chat-container-top', '20px');
        this.element.style.setProperty('--chat-container-right', '20px');
        this.element.style.setProperty('--chat-toggle-top', '12px');
        this.element.style.setProperty('--chat-toggle-right', '12px');
        break;
      case 'top-left':
        this.element.style.setProperty('--chat-top', '12px');
        this.element.style.setProperty('--chat-left', '12px');
        this.element.style.setProperty('--chat-container-top', '20px');
        this.element.style.setProperty('--chat-container-left', '20px');
        this.element.style.setProperty('--chat-toggle-top', '12px');
        this.element.style.setProperty('--chat-toggle-left', '12px');
        break;
    }
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
   * Get the current conversation ID
   * Returns null if no conversation has been created yet
   * @returns {string | null} The current conversation ID or null
   */
  public getConversationId(): string | null {
    return this.persistenceManager?.getConversationId() || null;
  }

  /**
   * Getter property for conversation ID
   * Provides easy access: chatWidget.conversationId
   */
  public get conversationId(): string | null {
    return this.getConversationId();
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

    // Cleanup welcome card if active
    if (this.activeWelcomeCard) {
      this.cleanupWelcomeCard(this.activeWelcomeCard);
    }

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
    
    // Clean up markdown loader scripts
    MarkdownLoader.cleanup();

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
          branding.style.display = 'flex';
          branding.style.opacity = '1';
          branding.style.transform = '';
          branding.classList.remove('sliding-out');
        } else {
          console.warn('Branding section not found when loading conversation');
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
        { streaming: this.config.streaming, debug: typeof this.config.debug === 'boolean' ? this.config.debug : false },
        !!this.config.debug
      );
      
      // Connect FileHandler to MessageHandler
      if (this.fileHandler) {
        this.messageHandler.setFileHandler(this.fileHandler);
      }
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
   * Check if floating prompts have been dismissed by user
   */
  private areFloatingPromptsDismissed(): boolean {
    try {
      const storageKey = `${this.containerId}_floating_prompts_dismissed`;
      const dismissed = localStorage.getItem(storageKey);
      return dismissed === 'true';
    } catch (e) {
      this.logger.debug('Error checking floating prompts dismissal:', e);
      return false;
    }
  }

  /**
   * Mark floating prompts as dismissed
   */
  private dismissFloatingPrompts(): void {
    try {
      const storageKey = `${this.containerId}_floating_prompts_dismissed`;
      localStorage.setItem(storageKey, 'true');
      this.logger.debug('Floating prompts dismissed and saved to localStorage');
    } catch (e) {
      this.logger.debug('Error saving floating prompts dismissal:', e);
    }
  }

  /**
   * Reset floating prompts dismissal (allow them to show again)
   * Called when user manually opens widget, showing re-engagement
   */
  private resetFloatingPromptsDismissal(): void {
    try {
      const storageKey = `${this.containerId}_floating_prompts_dismissed`;
      localStorage.removeItem(storageKey);
      this.logger.debug('Floating prompts dismissal reset');
    } catch (e) {
      this.logger.debug('Error resetting floating prompts dismissal:', e);
    }
  }

  /**
   * Determine the AgentClosedView mode based on config (with backward compatibility)
   * Priority: agentClosedView > messagePrompts.show > default
   */
  private getClosedViewMode(): ClosedViewMode {
    // 1. Explicit mode (highest priority)
    if (this.config.agentClosedView) {
      return this.config.agentClosedView;
    }

    // 2. Legacy messagePrompts.show
    if (this.config.messagePrompts?.show === false) {
      return 'toggle-only';
    }

    // 3. Default based on prompts (legacy behavior)
    const prompts = this.config.messagePrompts?.prompts?.filter((p): p is string => !!p && p.trim().length > 0) || [];
    if (prompts.length > 0) {
      return 'floating-prompts'; // Default legacy behavior
    }

    return 'toggle-only';
  }

  /**
   * Show AgentClosedView based on configuration
   * Determines which mode to display: toggle-only, floating-prompts, or welcome-card
   */
  private showFloatingPrompts(): void {
    // Only show for corner variant
    if (this.config.variant !== 'corner') {
      return;
    }

    // Check if user has previously dismissed
    if (this.areFloatingPromptsDismissed()) {
      this.logger.debug('AgentClosedView previously dismissed, not showing');
      return;
    }

    // Check if already exists
    const existingPrompts = document.querySelector('.am-chat-floating-prompts-container');
    const existingCard = document.querySelector('.am-chat-floating-welcome-card');
    const existingInputBar = document.querySelector('.am-chat-input-bar');
    if (existingPrompts || existingCard || existingInputBar) return;

    // Determine mode using new helper
    const mode = this.getClosedViewMode();
    this.logger.debug('AgentClosedView mode:', mode);

    // Filter non-empty prompts
    const prompts = (this.config.messagePrompts?.prompts?.filter((p): p is string => !!p && p.trim().length > 0) || []) as string[];

    // Handle each mode
    switch (mode) {
      case 'toggle-only':
        // Just the toggle button, nothing to show
        this.logger.debug('Mode: toggle-only - no external UI');
        return;

      case 'welcome-card':
        // Show welcome card with or without prompts
        this.logger.debug('Mode: welcome-card - showing card');
        this.showWelcomeCard(prompts);
        return;

      case 'input-bar':
        // Show modern AI search bar at bottom
        this.logger.debug('Mode: input-bar - showing AI search bar');
        this.showInputBar(prompts);
        return;

      case 'floating-prompts':
        // Show traditional floating prompts
        if (prompts.length === 0) {
          this.logger.debug('Mode: floating-prompts but no prompts defined - showing nothing');
          return;
        }
        this.logger.debug('Mode: floating-prompts - showing traditional bubbles');
        break; // Continue to render floating prompts below
    }

    // Create floating prompts container using DOM APIs
    const floatingPrompts = document.createElement('div');
    floatingPrompts.className = 'am-chat-floating-prompts-container';

    // Create welcome message container
    const welcomeMessageContainer = document.createElement('div');
    welcomeMessageContainer.className = 'am-chat-floating-welcome-message';

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'am-chat-floating-welcome-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.setAttribute('title', 'Close');
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>`;

    // Create welcome header
    const welcomeHeader = document.createElement('div');
    welcomeHeader.className = 'am-chat-floating-welcome-header';

    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'am-chat-floating-welcome-avatar';
    avatar.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
    </svg>`;

    // Create welcome text
    const welcomeMessage = this.config.messagePrompts?.welcome_message || 'How can I help you today?';
    const welcomeText = document.createElement('div');
    welcomeText.className = 'am-chat-floating-welcome-text';
    welcomeText.textContent = welcomeMessage; // Safe text content

    welcomeHeader.appendChild(avatar);
    welcomeHeader.appendChild(welcomeText);

    welcomeMessageContainer.appendChild(closeBtn);
    welcomeMessageContainer.appendChild(welcomeHeader);

    floatingPrompts.appendChild(welcomeMessageContainer);

    // Create prompts if provided
    if (prompts.length > 0) {
      const promptsContainer = document.createElement('div');
      promptsContainer.className = 'am-chat-floating-message-prompts';

      prompts.forEach(prompt => {
        const button = document.createElement('button');
        button.className = 'am-chat-floating-message-prompt';
        button.setAttribute('data-prompt', prompt || '');
        button.setAttribute('title', prompt || '');
        button.textContent = prompt || ''; // Safe text content
        promptsContainer.appendChild(button);
      });

      floatingPrompts.appendChild(promptsContainer);
    }

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

      // Attach close button event listener
      const closeButton = floatingPrompts.querySelector('.am-chat-floating-welcome-close');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.hideFloatingPrompts();
          // Mark as dismissed in localStorage
          this.dismissFloatingPrompts();
          // Clear the timeout so prompts don't reappear
          if (this.floatingPromptsTimeout) {
            clearTimeout(this.floatingPromptsTimeout);
            this.floatingPromptsTimeout = null;
          }
        });
      }
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
   * Show welcome card (with optional prompts)
   * @param prompts Optional array of prompt strings to display in the card
   */
  private showWelcomeCard(prompts: string[] = []): void {
    // Cleanup any existing card first
    if (this.activeWelcomeCard) {
      this.cleanupWelcomeCard(this.activeWelcomeCard);
    }

    const toggleButton = this.viewManager?.getToggleButton();
    if (!toggleButton) {
      this.logger.error('Toggle button not found, cannot show welcome card');
      return;
    }

    const card = document.createElement('div');
    card.className = 'am-chat-floating-welcome-card';

    // Add ARIA attributes for accessibility
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Welcome message');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('tabindex', '-1');

    const welcomeMessage = this.config.messagePrompts?.welcome_message || 'How can I help you today?';

    // Build card structure using DOM APIs (safer than innerHTML)
    const background = document.createElement('div');
    background.className = 'am-chat-welcome-card-background';
    for (let i = 0; i < 3; i++) {
      const circle = document.createElement('div');
      circle.className = 'am-chat-welcome-card-bg-circle';
      background.appendChild(circle);
    }

    // Create close button with SVG
    const closeButton = document.createElement('button');
    closeButton.className = 'am-chat-welcome-card-close';
    closeButton.setAttribute('aria-label', 'Close welcome message');
    closeButton.setAttribute('title', 'Close');
    closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;

    // Create content container
    const content = document.createElement('div');
    content.className = 'am-chat-welcome-card-content';

    // Create welcome message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'am-chat-welcome-card-message';
    messageDiv.textContent = welcomeMessage; // Safe text content

    content.appendChild(messageDiv);

    // Create prompts if provided
    if (prompts.length > 0) {
      const promptsContainer = document.createElement('div');
      promptsContainer.className = 'am-chat-welcome-card-prompts';
      promptsContainer.setAttribute('role', 'listbox');
      promptsContainer.setAttribute('aria-label', 'Quick prompts');

      prompts.forEach((prompt, index) => {
        const button = document.createElement('button');
        button.className = 'am-chat-welcome-card-prompt';
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('data-prompt-index', String(index));
        button.setAttribute('aria-posinset', String(index + 1));
        button.setAttribute('aria-setsize', String(prompts.length));
        button.tabIndex = index === 0 ? 0 : -1; // First prompt is focusable
        button.textContent = prompt; // Safe text content
        promptsContainer.appendChild(button);
      });

      content.appendChild(promptsContainer);
    }

    // Create toggle button container
    const toggleButtonContainer = document.createElement('div');
    toggleButtonContainer.className = 'am-chat-welcome-card-toggle-container';

    // Create footer
    const footer = document.createElement('div');
    footer.className = 'am-chat-welcome-card-footer';
    footer.textContent = 'Powered by Agentman';

    content.appendChild(toggleButtonContainer);
    content.appendChild(footer);

    // Assemble card
    card.appendChild(background);
    card.appendChild(closeButton);
    card.appendChild(content);

    // Create event handlers that will be stored in WeakMap
    const closeButtonHandler = (e: Event) => {
      e.preventDefault();
      // User explicitly closed the card - mark prompts as dismissed
      this.dismissWelcomeCard(card, false, true);
    };

    const keyboardHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // User explicitly dismissed via Escape - mark prompts as dismissed
        this.dismissWelcomeCard(card, false, true);
      }
    };

    // Event listeners
    const closeBtn = card.querySelector('.am-chat-welcome-card-close');
    closeBtn?.addEventListener('click', closeButtonHandler);
    card.addEventListener('keydown', keyboardHandler);

    // Add event handlers for prompt buttons with keyboard navigation
    if (prompts.length > 0) {
      const promptButtons = Array.from(card.querySelectorAll<HTMLButtonElement>('.am-chat-welcome-card-prompt'));

      // Keyboard navigation handler for prompts
      const handlePromptKeyboard = (e: KeyboardEvent, currentIndex: number) => {
        let targetIndex = currentIndex;

        switch (e.key) {
          case 'ArrowDown':
          case 'Down':
            e.preventDefault();
            targetIndex = (currentIndex + 1) % promptButtons.length;
            break;
          case 'ArrowUp':
          case 'Up':
            e.preventDefault();
            targetIndex = (currentIndex - 1 + promptButtons.length) % promptButtons.length;
            break;
          case 'Home':
            e.preventDefault();
            targetIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            targetIndex = promptButtons.length - 1;
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            const prompt = prompts[currentIndex];
            this.dismissWelcomeCard(card, false);
            this.eventBus.emit('user:prompt_click', { prompt });
            return;
          default:
            return;
        }

        // Move focus to target button
        promptButtons[currentIndex].tabIndex = -1;
        promptButtons[currentIndex].setAttribute('aria-selected', 'false');
        promptButtons[targetIndex].tabIndex = 0;
        promptButtons[targetIndex].setAttribute('aria-selected', 'true');
        promptButtons[targetIndex].focus();
      };

      promptButtons.forEach((button, index) => {
        // Click handler
        button.addEventListener('click', () => {
          const prompt = prompts[index];
          this.dismissWelcomeCard(card, false);
          this.eventBus.emit('user:prompt_click', { prompt });
        });

        // Keyboard navigation
        button.addEventListener('keydown', (e) => handlePromptKeyboard(e, index));

        // Focus handler to update aria-selected
        button.addEventListener('focus', () => {
          button.setAttribute('aria-selected', 'true');
        });

        button.addEventListener('blur', () => {
          button.setAttribute('aria-selected', 'false');
        });
      });
    }

    // Apply theme CSS variables to card so it can access toggle colors
    Object.entries(this.theme).forEach(([key, value]) => {
      if (value) {
        const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
        const cssVarName = `--chat-${kebabKey}`;
        card.style.setProperty(cssVarName, value);
      }
    });

    // Position-aware placement
    this.applyWelcomeCardPosition(card);

    // Insert into DOM
    document.body.appendChild(card);

    // Check viewport boundaries
    this.ensureCardInViewport(card);

    // Move the actual toggle button into the card as the CTA
    const toggleContainer = card.querySelector('.am-chat-welcome-card-toggle-container');
    const originalParent = toggleButton.parentElement;
    if (toggleContainer && originalParent) {
      // Store original click handler with proper typing
      const originalOnClick = toggleButton.onclick as ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;

      // Store state in WeakMap (proper TypeScript typing)
      this.welcomeCardStateMap.set(card, {
        originalToggleParent: originalParent,
        originalToggleOnClick: originalOnClick,
        closeButtonHandler,
        keyboardHandler
      });

      // Move toggle button into card
      toggleContainer.appendChild(toggleButton);
      toggleButton.style.removeProperty('display');
      toggleButton.style.position = 'relative';
      toggleButton.style.transform = 'none';

      // Override click handler to dismiss card and open widget
      toggleButton.onclick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.dismissWelcomeCard(card, true);
      };
    }

    // Track active card
    this.activeWelcomeCard = card;

    // Focus the card for keyboard navigation
    card.focus();

    this.logger.debug('Welcome card shown with toggle button as CTA');
  }

  /**
   * Apply position-aware card placement based on widget position config
   */
  private applyWelcomeCardPosition(card: HTMLElement): void {
    const position = this.config.position || 'bottom-right';

    // Remove any existing position styles
    card.style.removeProperty('top');
    card.style.removeProperty('bottom');
    card.style.removeProperty('left');
    card.style.removeProperty('right');

    switch (position) {
      case 'bottom-right':
        card.style.bottom = '20px';
        card.style.right = '20px';
        card.style.transformOrigin = 'bottom right';
        break;
      case 'bottom-left':
        card.style.bottom = '20px';
        card.style.left = '20px';
        card.style.transformOrigin = 'bottom left';
        break;
      case 'top-right':
        card.style.top = '20px';
        card.style.right = '20px';
        card.style.transformOrigin = 'top right';
        break;
      case 'top-left':
        card.style.top = '20px';
        card.style.left = '20px';
        card.style.transformOrigin = 'top left';
        break;
    }
  }

  /**
   * Ensure card stays within viewport boundaries
   */
  private ensureCardInViewport(card: HTMLElement): void {
    const rect = card.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Check right boundary
    if (rect.right > viewport.width) {
      card.style.right = '10px';
      card.style.removeProperty('left');
    }

    // Check bottom boundary
    if (rect.bottom > viewport.height) {
      card.style.bottom = '10px';
      card.style.removeProperty('top');
    }

    // Check left boundary
    if (rect.left < 0) {
      card.style.left = '10px';
      card.style.removeProperty('right');
    }

    // Check top boundary
    if (rect.top < 0) {
      card.style.top = '10px';
      card.style.removeProperty('bottom');
    }
  }

  /**
   * Dismiss welcome card with collapse animation
   * @param card The welcome card element to dismiss
   * @param openWidget Whether to open the widget after dismissing (default: false)
   * @param shouldDismissPrompts Whether to mark prompts as dismissed in localStorage (default: false)
   */
  private dismissWelcomeCard(card: HTMLElement, openWidget: boolean = false, shouldDismissPrompts: boolean = false): void {
    // Prevent double-click during animation (race condition protection)
    if (this.isWelcomeCardAnimating) {
      return;
    }
    this.isWelcomeCardAnimating = true;

    const toggleButton = this.viewManager?.getToggleButton();
    if (!toggleButton) {
      this.cleanupWelcomeCard(card, shouldDismissPrompts);
      this.isWelcomeCardAnimating = false;
      return;
    }

    // Get state from WeakMap (proper TypeScript typing)
    const cardState = this.welcomeCardStateMap.get(card);
    if (!cardState) {
      this.logger.warn('Welcome card state not found in WeakMap');
      this.cleanupWelcomeCard(card, shouldDismissPrompts);
      this.isWelcomeCardAnimating = false;
      return;
    }

    // Check for reduced motion preference (accessibility)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Simple fade out for accessibility
      card.style.opacity = '0';
      card.style.transition = 'opacity 0.2s ease-out';

      setTimeout(() => {
        this.restoreToggleButton(toggleButton, cardState);
        this.cleanupWelcomeCard(card, shouldDismissPrompts);
        this.isWelcomeCardAnimating = false;

        if (openWidget) {
          setTimeout(() => this.emitToggleEvent(), 150);
        }
      }, 200);
      return;
    }

    // Get toggle button's current position (inside card)
    const toggleRect = toggleButton.getBoundingClientRect();

    // Hide the toggle button during animation
    toggleButton.style.opacity = '0';

    const cardRect = card.getBoundingClientRect();

    // Calculate transform - card collapses to where toggle button currently is (inside card)
    const deltaX = toggleRect.left + (toggleRect.width / 2) - (cardRect.left + (cardRect.width / 2));
    const deltaY = toggleRect.top + (toggleRect.height / 2) - (cardRect.top + (cardRect.height / 2));
    const scale = Math.min(toggleRect.width / cardRect.width, toggleRect.height / cardRect.height);

    // Animate collapse
    const animation = card.animate([
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1,
        borderRadius: '20px'
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scale})`,
        opacity: 0,
        borderRadius: '100px'
      }
    ], {
      duration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });

    animation.onfinish = () => {
      this.restoreToggleButton(toggleButton, cardState);
      this.cleanupWelcomeCard(card, shouldDismissPrompts);
      this.isWelcomeCardAnimating = false;

      if (openWidget) {
        // User clicked toggle button - open the widget
        setTimeout(() => this.emitToggleEvent(), 150);
      }
    };
  }

  /**
   * Restore toggle button to its original location
   */
  private restoreToggleButton(toggleButton: HTMLElement, cardState: WelcomeCardState): void {
    const { originalToggleParent, originalToggleOnClick } = cardState;

    if (originalToggleParent) {
      originalToggleParent.appendChild(toggleButton);
      toggleButton.style.removeProperty('position');
      toggleButton.style.removeProperty('transform');
      toggleButton.style.removeProperty('opacity');

      // Restore original click handler
      if (originalToggleOnClick !== undefined) {
        toggleButton.onclick = originalToggleOnClick;
      }
    }
  }

  /**
   * Cleanup welcome card and remove event listeners
   * @param shouldDismiss Whether to mark prompts as dismissed in localStorage (default: false)
   */
  private cleanupWelcomeCard(card: HTMLElement, shouldDismiss: boolean = false): void {
    // Get state from WeakMap to remove event listeners
    const cardState = this.welcomeCardStateMap.get(card);

    if (cardState) {
      // Remove event listeners
      const closeBtn = card.querySelector('.am-chat-welcome-card-close');
      if (closeBtn) {
        closeBtn.removeEventListener('click', cardState.closeButtonHandler);
      }
      card.removeEventListener('keydown', cardState.keyboardHandler);

      // Remove from WeakMap (will be garbage collected)
      this.welcomeCardStateMap.delete(card);
    }

    // Remove from DOM
    card.remove();

    // Only dismiss floating prompts if explicitly requested (e.g., user clicked close button)
    if (shouldDismiss) {
      this.dismissFloatingPrompts();
    }

    // Clear active card reference
    if (this.activeWelcomeCard === card) {
      this.activeWelcomeCard = null;
    }
  }

  /**
   * Show modern AI input bar at bottom of screen
   * @param prompts Optional array of prompt strings
   */
  private showInputBar(prompts: string[] = []): void {
    // Check if input bar already exists
    const existingBar = document.querySelector('.am-chat-input-bar');
    if (existingBar) {
      this.logger.debug('Input bar already exists');
      return;
    }

    // Prepare messages for typewriter (cycle through prompts if available)
    const typewriterMessages: string[] = [];
    const welcomeMessage = this.config.messagePrompts?.welcome_message;
    if (welcomeMessage) {
      typewriterMessages.push(welcomeMessage);
    }
    if (prompts.length > 0) {
      typewriterMessages.push(...prompts);
    }
    if (typewriterMessages.length === 0) {
      typewriterMessages.push('Ask anything...');
    }

    // Create main container
    const inputBar = document.createElement('div');
    inputBar.className = 'am-chat-input-bar am-chat-input-bar-enter';

    // Create main input container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'am-chat-input-bar-main';

    // Create branded zone (logo + text using config values)
    const brandZone = document.createElement('div');
    brandZone.className = 'am-chat-input-bar-brand';
    brandZone.setAttribute('aria-label', 'AI Assistant');

    // Logo element - use am-chat-logo with same logic as toggle button
    const logo = document.createElement('div');
    logo.className = 'am-chat-input-bar-logo am-chat-logo';
    logo.innerHTML = this.assets.logo || icons.agentmanLogo;

    // Brand text - use configured toggleText (color from CSS variable)
    const brandText = document.createElement('span');
    brandText.className = 'am-chat-input-bar-brand-text';
    brandText.textContent = this.config.toggleText || 'AI Mode';

    brandZone.appendChild(logo);
    brandZone.appendChild(brandText);

    // Create typewriter text element (shown when not focused)
    const typewriterText = document.createElement('div');
    typewriterText.className = 'am-chat-input-bar-typewriter';

    // Create actual input field (textarea for auto-resize)
    const inputField = document.createElement('textarea');
    inputField.className = 'am-chat-input-bar-field';
    inputField.placeholder = this.config.placeholder || 'Ask anything...';
    inputField.rows = 1;
    inputField.style.display = 'none';

    // Create menu icon (three-dot menu)
    const menuButton = document.createElement('button');
    menuButton.className = 'am-chat-input-bar-icon am-chat-input-bar-menu';
    menuButton.setAttribute('aria-label', 'Menu');
    menuButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
    </svg>`;

    // Assemble main container
    mainContainer.appendChild(brandZone);
    mainContainer.appendChild(typewriterText);
    mainContainer.appendChild(inputField);
    mainContainer.appendChild(menuButton);

    // Create prompts container (shown when focused, floats above)
    const promptsContainer = document.createElement('div');
    promptsContainer.className = 'am-chat-input-bar-prompts';

    if (prompts.length > 0) {
      prompts.forEach(prompt => {
        const promptButton = document.createElement('button');
        promptButton.className = 'am-chat-input-bar-prompt';
        promptButton.textContent = prompt;

        const clickHandler = () => this.handleInputBarPromptClick(prompt);
        promptButton.addEventListener('click', clickHandler);
        this.inputBarCleanup.push(() =>
          promptButton.removeEventListener('click', clickHandler)
        );

        promptsContainer.appendChild(promptButton);
      });
    }

    // Assemble input bar (main container + prompts outside)
    inputBar.appendChild(mainContainer);
    if (prompts.length > 0) {
      inputBar.appendChild(promptsContainer);
    }

    // Add to DOM
    document.body.appendChild(inputBar);

    // Hide the toggle button when input bar is shown
    const toggleButton = this.element.querySelector('.am-chat-toggle');
    if (toggleButton instanceof HTMLElement) {
      toggleButton.style.display = 'none';
    }

    // Start typewriter effect with cleanup
    this.inputBarTypewriterCleanup = this.startTypewriterEffectCycling(typewriterText, typewriterMessages);

    // Focus handler
    const focusHandler = () => mainContainer.classList.add('focused');
    inputField.addEventListener('focus', focusHandler);
    this.inputBarCleanup.push(() =>
      inputField.removeEventListener('focus', focusHandler)
    );

    // Blur handler
    const blurHandler = () => {
      setTimeout(() => mainContainer.classList.remove('focused'), 200);
    };
    inputField.addEventListener('blur', blurHandler);
    this.inputBarCleanup.push(() =>
      inputField.removeEventListener('blur', blurHandler)
    );

    // Typewriter click handler
    const typewriterClickHandler = () => {
      // Stop typewriter animation before hiding
      if (this.inputBarTypewriterCleanup) {
        this.inputBarTypewriterCleanup();
        this.inputBarTypewriterCleanup = null;
      }
      typewriterText.style.display = 'none';
      inputField.style.display = 'block';
      inputField.focus();
      mainContainer.classList.add('focused');
    };
    typewriterText.addEventListener('click', typewriterClickHandler);
    this.inputBarCleanup.push(() =>
      typewriterText.removeEventListener('click', typewriterClickHandler)
    );

    // Input blur handler for typewriter
    const inputBlurHandler = () => {
      setTimeout(() => {
        if (!inputField.value.trim()) {
          // Clean up any existing animation first
          if (this.inputBarTypewriterCleanup) {
            this.inputBarTypewriterCleanup();
            this.inputBarTypewriterCleanup = null;
          }
          inputField.style.display = 'none';
          typewriterText.style.display = 'flex'; // Use flex to maintain vertical centering
          // Start fresh typewriter animation
          this.inputBarTypewriterCleanup = this.startTypewriterEffectCycling(
            typewriterText,
            typewriterMessages
          );
        }
      }, 200);
    };
    inputField.addEventListener('blur', inputBlurHandler);
    this.inputBarCleanup.push(() =>
      inputField.removeEventListener('blur', inputBlurHandler)
    );

    // Enter key handler
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const value = (e.target as HTMLTextAreaElement).value.trim();
        if (value) {
          this.handleInputBarSubmit(value);
          (e.target as HTMLTextAreaElement).value = '';
        }
      }
    };
    inputField.addEventListener('keydown', keydownHandler);
    this.inputBarCleanup.push(() =>
      inputField.removeEventListener('keydown', keydownHandler)
    );

    // Menu button handler
    const menuClickHandler = () => {
      this.emitToggleEvent();
      this.hideInputBar();
    };
    menuButton.addEventListener('click', menuClickHandler);
    this.inputBarCleanup.push(() =>
      menuButton.removeEventListener('click', menuClickHandler)
    );

    this.logger.debug('Input bar displayed with typewriter effect');
  }

  /**
   * Typewriter effect for input bar (single message)
   */
  private startTypewriterEffect(element: HTMLElement, text: string): void {
    let index = 0;
    element.textContent = '';

    const type = () => {
      if (index < text.length) {
        element.textContent = text.substring(0, index + 1);
        index++;
        setTimeout(type, 80); // Typing speed
      }
    };

    type();
  }

  /**
   * Typewriter effect that cycles through multiple messages
   */
  private startTypewriterEffectCycling(element: HTMLElement, messages: string[]): () => void {
    if (messages.length === 0) return () => {};

    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const typeNextChar = () => {
      const currentMessage = messages[messageIndex];

      if (!isDeleting) {
        // Typing
        element.textContent = currentMessage.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentMessage.length) {
          // Pause at end of message, then start deleting
          timeoutId = setTimeout(() => {
            isDeleting = true;
            typeNextChar();
          }, 2000);
          return;
        }
      } else {
        // Deleting
        element.textContent = currentMessage.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          // Move to next message
          isDeleting = false;
          messageIndex = (messageIndex + 1) % messages.length;
          timeoutId = setTimeout(typeNextChar, 500);
          return;
        }
      }

      timeoutId = setTimeout(typeNextChar, isDeleting ? 40 : 80);
    };

    typeNextChar();

    // Return cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }

  /**
   * Handle input bar prompt click
   */
  private handleInputBarPromptClick(prompt: string): void {
    this.logger.debug('Input bar prompt clicked:', prompt);
    this.hideInputBar();
    this.emitToggleEvent();
    // Emit prompt event after widget opens
    setTimeout(() => {
      this.emitPromptClickEvent(prompt);
    }, 400);
  }

  /**
   * Handle input bar submission
   */
  private handleInputBarSubmit(message: string): void {
    this.logger.debug('Input bar submission:', message);
    this.hideInputBar();
    this.emitToggleEvent();
    // Send message after widget opens - use prompt event which will handle it
    setTimeout(() => {
      this.emitPromptClickEvent(message);
    }, 400);
  }

  /**
   * Hide input bar and restore toggle button
   */
  private hideInputBar(): void {
    // Run all cleanup functions
    this.inputBarCleanup.forEach(cleanup => cleanup());
    this.inputBarCleanup = [];

    // Stop typewriter animation
    if (this.inputBarTypewriterCleanup) {
      this.inputBarTypewriterCleanup();
      this.inputBarTypewriterCleanup = null;
    }

    // Remove DOM element
    const inputBar = document.querySelector('.am-chat-input-bar');
    if (inputBar) {
      inputBar.remove();
    }

    // Restore the toggle button visibility
    const toggleButton = this.element.querySelector('.am-chat-toggle');
    if (toggleButton instanceof HTMLElement) {
      toggleButton.style.display = '';
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
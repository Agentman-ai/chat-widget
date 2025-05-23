// ChatWidget.ts
import type { ChatConfig, Message, APIResponse, ChatState, ChatTheme, ChatAssets, PersistenceConfig } from './types/types';
import { PersistenceManager } from './PersistenceManager';

import { ConfigManager } from './ConfigManager';
import { StateManager } from './StateManager';
import { StyleManager } from './styles/style-manager';
import { MessageRenderer } from './message-renderer/message-renderer'
import { OfflineParser } from './message-renderer/offline-parser';
import { user, agent, close, send, minimize, maximize, resize, expand, collapse } from './assets/icons';
import { logo, logo as headerLogo } from './assets/logo';
import { isImageUrl, getIconHtml } from './utils/icon-utils';

export class ChatWidget {
  // Track instances by containerId
  private static instances: Map<string, ChatWidget> = new Map();

  private config: ChatConfig;
  private state: ChatState;
  private element!: HTMLElement; // Mark as definitely assigned
  private containerId: string;
  private conversationId: string;
  private theme: ChatTheme;
  private assets: ChatAssets;
  private configManager: ConfigManager;
  private stateManager: StateManager;
  private messageRenderer: MessageRenderer;
  private resizeTimeout: number | null = null;
  private isInitializing: boolean = false;
  private styleManager: StyleManager;
  private resizeDebounceTimeout: number | null = null;
  private isInitialized: boolean = false;
  private isOffline: boolean = false;
  private lastMessageCount: number = 0;
  private persistenceManager: PersistenceManager | null = null;
  // Timer handle for delayed prompt display
  private promptTimer: number | null = null;

  private static readonly defaultIcons = {
    closeIcon: close,
    sendIcon: send,
    minimizeIcon: minimize,
    maximizeIcon: maximize,
    expandIcon: expand,
    collapseIcon: collapse,
    reduceIcon: resize,
    userIcon: user,
    agentIcon: agent
  };

  private loadingMessageElement: HTMLElement | null = null;
  private loadingStates: string[] = [
    'Thinking',
    'Planning',
    'Acting',
    'Generating response'
  ];
  private loadingAnimationInterval: number | null = null;
  private currentLoadingStateIndex: number = 0;

  private static MARKED_CDNS = [
    'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js',
    'https://cdn.jsdelivr.net/npm/marked@9.1.2/marked.min.js',
    'https://unpkg.com/marked@9.1.2/marked.min.js'
  ];


  constructor(config: ChatConfig & { containerId: string }) {

    this.containerId = config.containerId;

    // Check for existing instance with this containerId
    const existingInstance = ChatWidget.instances.get(this.containerId);
    if (existingInstance) {
      existingInstance.destroy();
    }

    // Store the new instance
    ChatWidget.instances.set(this.containerId, this);

    // Create config with theme properties, only including defined values
    const themeProperties: Record<string, string> = {};
    if (config.userBackgroundColor) themeProperties.userBackgroundColor = config.userBackgroundColor;
    if (config.agentBackgroundColor) themeProperties.agentBackgroundColor = config.agentBackgroundColor;
    if (config.agentForegroundColor) themeProperties.agentForegroundColor = config.agentForegroundColor;
    if (config.userForegroundColor) themeProperties.userForegroundColor = config.userForegroundColor;
    if (config.headerBackgroundColor) themeProperties.headerBackgroundColor = config.headerBackgroundColor;
    if (config.headerTextColor) themeProperties.headerTextColor = config.headerTextColor;
    if (config.agentIconColor) themeProperties.agentIconColor = config.agentIconColor;
    if (config.userIconColor) themeProperties.userIconColor = config.userIconColor;
    // Add toggle button styling properties
    if (config.theme?.toggleBackgroundColor) themeProperties.toggleBackgroundColor = config.theme.toggleBackgroundColor;
    if (config.theme?.toggleTextColor) themeProperties.toggleTextColor = config.theme.toggleTextColor;
    if (config.theme?.toggleIconColor) themeProperties.toggleIconColor = config.theme.toggleIconColor;
    // Pull in PHP-provided toggleStyle overrides
    if (config.toggleStyle?.backgroundColor) themeProperties.toggleBackgroundColor = config.toggleStyle.backgroundColor;
    if (config.toggleStyle?.textColor) themeProperties.toggleTextColor = config.toggleStyle.textColor;
    if (config.toggleStyle?.iconColor) themeProperties.toggleIconColor = config.toggleStyle.iconColor;

    const configWithTheme: ChatConfig = {
      ...config,
      theme: config.theme ? { ...config.theme, ...themeProperties } : themeProperties
    };

    this.config = this.mergeWithDefaultConfig(configWithTheme);
    this.theme = this.initializeTheme();
    this.assets = this.initializeAssets();
    this.state = {
      isOpen: config.initiallyOpen || false,
      isExpanded: false,
      isInitialized: false,
      isSending: false,
      messages: [],
      error: undefined
    };

    this.stateManager = new StateManager(this.state);
    this.stateManager.subscribe(this.handleStateChange.bind(this));

    this.conversationId = this.generateUUID();

    this.configManager = new ConfigManager(this.config);
    this.messageRenderer = new MessageRenderer();

    this.styleManager = new StyleManager(config.variant);
    
    // Initialize persistence if enabled
    if (this.config.persistence?.enabled) {
      this.persistenceManager = new PersistenceManager(
        this.containerId,
        this.stateManager,
        true // enabled
      );
      
      // Migrate any legacy data
      this.persistenceManager.migrateLegacy();
      
      // Get the first conversation ID or create a new one
      const firstId = this.persistenceManager.getCurrentId() ?? this.persistenceManager.create();
      this.conversationId = firstId;
    }

    this.init();

  }

  async init() {
    try {
      await this.loadDependencies();
      this.isOffline = false;
    } catch (error) {
      console.warn('Failed to load dependencies:', error);
      this.fallbackToOfflineMode();
    }

    // Always initialize, regardless of online/offline status
    this.initialize();
  }

  async loadDependencies() {
    if (window.marked) {
      this.configureMarked();
      return;
    }

    if (await this.loadFromCache()) {
      return;
    }

    for (const cdn of ChatWidget.MARKED_CDNS) {
      try {
        await this.loadScript(cdn);
        this.configureMarked();
        this.cacheLibrary(cdn);
        return;
      } catch (error) {
        console.warn(`Failed to load from CDN: ${cdn}`, error);
        continue;
      }
    }

    throw new Error('All CDNs failed to load');
  }


  private async loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      const timeout = setTimeout(() => {
        reject(new Error('Script load timeout'));
      }, 5000);

      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  async loadFromCache() {
    try {
      if ('caches' in window) {
        const cache = await caches.open('chat-widget-cache');
        for (const cdn of ChatWidget.MARKED_CDNS) {
          const response = await cache.match(cdn);
          if (response) {
            const script = await response.text();
            eval(script);
            this.configureMarked();
            return true;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }
    return false;
  }

  cacheLibrary(cdn: string): void {
    try {
      if ('caches' in window) {
        caches.open('chat-widget-cache').then(cache => {
          cache.add(cdn);
        });
      }
    } catch (error) {
      console.warn('Failed to cache library:', error);
    }
  }


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

  private fallbackToOfflineMode(): void {
    this.isOffline = true;
    window.marked = {
      setOptions: () => { },
      parse: (text: string) => OfflineParser.parse(text)
    };
  }


  private mergeWithDefaultConfig(config: ChatConfig): ChatConfig {

    return {
      ...config,
      title: config.title || 'Chat Assistant',
      theme: {
        textColor: '#111827',
        backgroundColor: '#FFFFFF',
        buttonColor: '#059669',
        buttonTextColor: '#FFFFFF',
        ...config.theme
      },
      placeholder: config.placeholder || 'Type your message...',
      initiallyOpen: config.initiallyOpen || false,
      icons: {
        closeIcon: config.icons?.closeIcon || ChatWidget.defaultIcons.closeIcon,
        sendIcon: config.icons?.sendIcon || ChatWidget.defaultIcons.sendIcon,
        minimizeIcon: config.icons?.minimizeIcon || ChatWidget.defaultIcons.minimizeIcon,
        maximizeIcon: config.icons?.maximizeIcon || ChatWidget.defaultIcons.maximizeIcon,
        expandIcon: config.icons?.expandIcon || ChatWidget.defaultIcons.expandIcon,
        collapseIcon: config.icons?.collapseIcon || ChatWidget.defaultIcons.collapseIcon,
        reduceIcon: config.icons?.reduceIcon || ChatWidget.defaultIcons.reduceIcon,
        userIcon: config.icons?.userIcon || ChatWidget.defaultIcons.userIcon,
        agentIcon: config.icons?.agentIcon || ChatWidget.defaultIcons.agentIcon
      }
    };
  }

  private initializeTheme(): ChatTheme {
    return {
      textColor: this.config.theme?.textColor || '#111827',
      backgroundColor: this.config.theme?.backgroundColor || '#FFFFFF',
      buttonColor: this.config.theme?.buttonColor || '#059669',
      buttonTextColor: this.config.theme?.buttonTextColor || '#FFFFFF',
      agentBackgroundColor: this.config.agentBackgroundColor || this.config.theme?.agentBackgroundColor || '#f3f4f6',
      userBackgroundColor: this.config.userBackgroundColor || this.config.theme?.userBackgroundColor || '#ecfdf5',
      agentForegroundColor: this.config.agentForegroundColor || this.config.theme?.agentForegroundColor || '#111827',
      userForegroundColor: this.config.userForegroundColor || this.config.theme?.userForegroundColor || '#FFFFFF',
      headerBackgroundColor: this.config.headerBackgroundColor || this.config.theme?.headerBackgroundColor || '#BE185D',
      headerTextColor: this.config.headerTextColor || this.config.theme?.headerTextColor || '#FFFFFF',
      agentIconColor: this.config.theme?.agentIconColor || '#BE185D',
      userIconColor: this.config.theme?.userIconColor || '#F43F5E',
      // Add toggle button styling properties with fallbacks to header colors
      toggleBackgroundColor: this.config.theme?.toggleBackgroundColor || this.config.theme?.headerBackgroundColor || '#BE185D',
      toggleTextColor: this.config.theme?.toggleTextColor || this.config.theme?.headerTextColor || '#FFFFFF',
      toggleIconColor: this.config.theme?.toggleIconColor || this.config.theme?.headerTextColor || '#FFFFFF'
    };
  }

  private initializeAssets(): ChatAssets {
    const assets = {
      logo: getIconHtml(this.config.logo || logo, 'Main Logo', 42),
      headerLogo: getIconHtml(this.config.headerLogo || headerLogo, 'Header Logo', 32)
    };
    
    return assets;
  }

  private initialize() {
    if (this.isInitialized) return;

    this.setupOnlineStatusMonitoring();
    this.styleManager.injectStyles();
    this.createElements();
    this.attachEventListeners();

    let shouldInitChat = true;
    if (this.persistenceManager) {
      const messages = this.persistenceManager.loadMessages();
      if (messages.length > 0) {
        // Clear existing messages
        this.stateManager.clearMessages();
        
        // Add each message
        messages.forEach(msg => this.addMessage(msg));
        
        // Update lastMessageCount to skip already loaded AI messages
        this.lastMessageCount = messages.filter(m => m.sender === 'agent').length;
        
        // Skip initialization since conversation is restored
        shouldInitChat = false;
      }
    }

    if (shouldInitChat) {
      this.initializeChat();
    }

    // Update UI based on initial state
    this.updateUI(this.stateManager.getState());

    this.updateColors(this.theme);
    
    // Now that the DOM is initialized, load messages from persistence if available
    if (this.persistenceManager) {
      this.stateManager.setMessages(this.persistenceManager.loadMessages());
    }

    this.isInitialized = true;
  }

  private applyInitialDimensions(height?: string, width?: string): void {
    if (!height && !width) return;

    const container = this.element.querySelector('.am-chat-container') as HTMLElement;
    if (container) {
      if (height) container.style.height = height;
      if (width) container.style.width = width;
    }
  }

  // Get instance by containerId
  public static getInstance(containerId: string): ChatWidget | undefined {
    return ChatWidget.instances.get(containerId);
  }

  public destroy(): void {
    // Clean up styles
    this.styleManager.cleanup();

    // Clean up ALL timeouts
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }
    if (this.resizeDebounceTimeout) {
      window.clearTimeout(this.resizeDebounceTimeout);
    }
    if (this.loadingAnimationInterval) {
      window.clearInterval(this.loadingAnimationInterval);
    }
    if (this.promptTimer) {
      window.clearTimeout(this.promptTimer);
    }

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Remove DOM elements
    const widgetElement = document.querySelector(`.am-chat-widget[data-container="${this.containerId}"]`);
    widgetElement?.remove();

    // Clean up state manager
    this.stateManager.clearListeners();
    this.styleManager.cleanup();

    // Remove from instances map
    ChatWidget.instances.delete(this.containerId);
  }

  /**
   * Clear persisted messages and conversation history
   */
  public clearStorage(): void {
    if (this.persistenceManager) {
      this.persistenceManager.clearStorage();
      this.stateManager.clearMessages();
    }
  }

  public static destroyAll(): void {
    // Convert Map values to array before iteration
    Array.from(ChatWidget.instances.values()).forEach(instance => {
      instance.destroy();
    });
    ChatWidget.instances.clear();
  }

  private handleResize = (): void => {
    // Clear any existing resize timeout
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }

    // Set new timeout for performance
    this.resizeTimeout = window.setTimeout(() => {
      const state = this.stateManager.getState();
      this.updateUI(state);
    }, 100);
  };

  private handleImmediateResize(): void {
    // Handle any immediate resize needs
    // For example, adjusting input field height
    const input = this.element.querySelector('.am-chat-input') as HTMLTextAreaElement;
    if (input) {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 100)}px`;
    }
  }

  public subscribeToState(callback: (state: ChatState) => void): () => void {
    return this.stateManager.subscribe(callback);
  }

  private setupForCurrentDevice(): void {
    if (this.config.variant !== 'corner') return;

    const container = this.element.querySelector('.am-chat-container') as HTMLElement;
    const input = this.element.querySelector('.am-chat-input') as HTMLTextAreaElement;
    if (!container) return;

    const isMobile = window.innerWidth <= 480;

    if (isMobile) {
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.borderRadius = '0';
      container.style.bottom = '0';
      container.style.right = '0';

      if (this.state.isOpen) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      container.style.width = this.config.initialWidth || '360px';
      container.style.height = this.config.initialHeight || '700px';
      container.style.borderRadius = '12px';
      container.style.bottom = '20px';
      container.style.right = '20px';

      document.body.style.overflow = '';
    }

    // Ensure input maintains its height
    if (input && !input.style.height) {
      input.style.height = '32px';
    }
  }


  private handleStateChange(state: ChatState): void {
    this.updateUI(state);
    this.updateToggleButtonStyling();
  }
  
  private updateToggleButtonStyling(): void {
    const toggleButton = this.element.querySelector('.am-chat-toggle') as HTMLButtonElement;
    if (toggleButton) {
      toggleButton.style.backgroundColor = this.theme.toggleBackgroundColor;
      
      const toggleIcon = toggleButton.querySelector('.am-chat-logo') as HTMLElement;
      if (toggleIcon) {
        toggleIcon.style.color = this.theme.toggleIconColor;
      }
      
      const toggleText = toggleButton.querySelector('.am-chat-toggle-text') as HTMLElement;
      if (toggleText) {
        toggleText.style.color = this.theme.toggleTextColor;
        toggleText.textContent = this.config.toggleText || 'Ask Agentman';
      }
    }
  }

  private updateUI(state: ChatState): void {
    const container = this.element.querySelector('.am-chat-container') as HTMLDivElement;
    const toggle = this.element.querySelector('.am-chat-toggle') as HTMLButtonElement;
    const prompts = this.element.querySelector('.am-chat-message-prompts-container') as HTMLElement;


    if (container) {
      // For corner variant, handle show/hide
      if (this.config.variant === 'corner') {
        console.log('[DEBUG] updateUI for corner variant', {
          isOpen: state.isOpen,
          messagePromptsConfig: this.config.messagePrompts
        });
        
        const shouldShowCollapsedUI = !state.isOpen && !this.hasUserStartedConversation();
        console.log('[DEBUG] shouldShowCollapsedUI:', shouldShowCollapsedUI);

      // Handle prompts visibility and placement
      if (shouldShowCollapsedUI) {
        console.log('[DEBUG] Scheduling collapsed prompts to show after delay');
        if (!this.promptTimer) {
          this.promptTimer = window.setTimeout(() => {
            console.log('[DEBUG] Delayed showCollapsedPrompts');
            this.showCollapsedPrompts();
            this.promptTimer = null;
          }, 5000);
        }
      } else {
        console.log('[DEBUG] Hiding collapsed prompts and clearing scheduled show');
        if (this.promptTimer) {
          clearTimeout(this.promptTimer);
          this.promptTimer = null;
        }
        this.hideCollapsedPrompts();
      }        

        container.style.display = state.isOpen ? 'flex' : 'none';
        if (toggle) {
          toggle.style.display = state.isOpen ? 'none' : 'flex';
        }
      } else {
        // For centered and inline variants, always show container
        container.style.display = 'flex';
        // Ensure toggle is hidden for non-corner variants
        if (toggle) {
          toggle.style.display = 'none';
        }
      }
    }

    // If we're in corner variant, update device-specific layout
    if (this.config.variant === 'corner') {
      this.setupForCurrentDevice();
    }
  }

  // Determines if the user has started a conversation
  private hasUserStartedConversation(): boolean {
    const messages = this.stateManager.getState().messages;
    
    console.log('[DEBUG] Checking conversation status:', {
      messageCount: messages.length,
      hasInitialMessage: !!this.config.initialMessage,
      messages: messages.map(m => ({ sender: m.sender, content: m.content.substring(0, 30) + '...' }))
    });
    
    // If there are no messages, conversation hasn't started
    if (messages.length === 0) {
      console.log('[DEBUG] No messages, conversation not started');
      return false;
    }
    
    // If there's only one message and it's from the agent (system welcome), 
    // we still consider the conversation as not started by the user
    if (messages.length === 1 && messages[0].sender === 'agent' && 
        this.config.initialMessage) {
      console.log('[DEBUG] Only one message (system welcome), conversation not started');
      return false;
    }
    
    // Otherwise, if there are user messages or multiple agent messages, 
    // the conversation has started
    const hasStarted = messages.some(msg => msg.sender === 'user') || messages.length > 1;
    console.log('[DEBUG] Conversation started:', hasStarted);
    return hasStarted;
  }

  // Show prompts above the toggle button (when chat is collapsed)
  private showCollapsedPrompts(): void {
    console.log('[DEBUG] showCollapsedPrompts called');
    let prompts = this.element.querySelector('.am-chat-message-prompts-container');
    console.log('[DEBUG] Existing prompts element:', prompts);
    
    if (!prompts) {
      console.log('[DEBUG] Creating new prompts container');
      prompts = document.createElement('div');
      prompts.className = 'am-chat-message-prompts-container';
      
      const promptsHTML = this.renderMessagePrompts();
      console.log('[DEBUG] Rendered prompts HTML:', promptsHTML);
      prompts.innerHTML = promptsHTML;
      
      // Insert before or after the toggle button as needed
      const toggle = this.element.querySelector('.am-chat-toggle');
      console.log('[DEBUG] Toggle button found:', !!toggle);
      
      if (toggle && toggle.parentElement) {
        console.log('[DEBUG] Inserting prompts before toggle button');
        toggle.parentElement.insertBefore(prompts, toggle);
      } else {
        console.log('[DEBUG] Could not find toggle button or its parent');
      }
      
      this.attachPromptListeners();
    } else {
      console.log('[DEBUG] Prompts container already exists');
    }
    
    console.log('[DEBUG] Setting prompts display to block');
    (prompts as HTMLElement).style.display = 'block';
  }

// Hide the prompts container
private hideCollapsedPrompts(): void {
  const prompts = this.element.querySelector('.am-chat-message-prompts-container');
  if (prompts) prompts.remove();
}

/**
 * Render the welcome message and up to 3 prompts if enabled and present.
 */
/**
 * Check if the current device is a desktop
 * @returns {boolean} true if device is desktop, false otherwise
 */
private isDesktopDevice(): boolean {
  // Check if window width is greater than 768px (standard tablet breakpoint)
  return window.innerWidth > 768;
}

private renderMessagePrompts(): string {
  console.log('[DEBUG] renderMessagePrompts called');
  const promptsCfg = this.config.messagePrompts;
  console.log('[DEBUG] messagePrompts config:', promptsCfg);
  
  // First check if we're on a desktop device
  if (!this.isDesktopDevice()) {
    console.log('[DEBUG] Not a desktop device, hiding prompts');
    return '';
  }
  
  if (!promptsCfg || !promptsCfg.show) {
    console.log('[DEBUG] Prompts not enabled or missing config');
    return '';
  }
  
  const { welcome_message, prompts } = promptsCfg;
  const hasPrompts = Array.isArray(prompts) && prompts.some(p => !!p);
  const hasWelcome = !!welcome_message;
  
  console.log('[DEBUG] Prompt details:', { 
    hasWelcome, 
    hasPrompts, 
    welcomeMessage: welcome_message,
    prompts: prompts
  });
  
  if (!hasPrompts && !hasWelcome) {
    console.log('[DEBUG] No welcome message or prompts to show');
    return '';
  }
  
  let html = '';
  if (hasWelcome) {
    // Create a welcome message with the structure that matches the design
    html += `<div class="am-chat-welcome-message">
      <div class="am-chat-welcome-header">
        <div class="am-chat-welcome-avatar">
          <svg viewBox="0 0 100 100" width="16" height="16" class="am-chat-logo-svg" aria-label="Agentman logo">
            <!-- Optimized viewBox for better rendering at small sizes -->
            <g transform="scale(0.2) translate(10,10)">
              <!-- White background circle -->
              <ellipse rx="195.69139" ry="195.69139" transform="matrix(1.029699 0 0 1.029699 240.53478 231.5)" fill="white" stroke-width="0"/>
              <!-- Logo paths -->
              <path d="M115.170448,367.37098l75.209552-41.95l34.570045,89.914073q-71.559193-7.964036-109.779597-47.964073Z" transform="translate(1.705203 0.000002)" fill="#059669" stroke="#059669" stroke-width="0.964"/>
              <path d="M115.170448,367.37098l75.209552-41.95l34.570045,89.914073q-71.559193-7.964036-109.779597-47.964073Z" transform="matrix(-1 0 0 1 477.488884 0.213954)" fill="#059669" stroke="#059669" stroke-width="0.964"/>
              <path d="M239.689307,333.842501l-11.989999,12.523368l7.640737,9.115074-9.00527,28.429999l13.354532,21.66l12.169999-21.66-8.276464-28.429999l7.683584-9.115074-11.577119-12.523368Z" transform="translate(.000003-8.207567)" fill="#059669" stroke-width="0.964"/>
              <path d="M277.027489,313.607575c2.10968-2.124145,2.109674-7.294472,2.10968-12.616701.000001-4.924048,3.734359-8.575732,5.993261-11.785502c6.850428-9.734066,17.425154-17.270326,32.509567-28.554392c19.581659-14.648281,38.363352-37.839451,38.363352-75.004322s-15.358165-77.557662-47.326267-97.060908-100.336835-21.863731-138.616835,11.230119q-38.28,33.09385-26.47094,84.615075q2.941471,5.424961-4.109265,16.914925c-7.050736,11.489964-5.790737,10.87-13.400737,20.07q-7.61,9.2,14.77,24.588001q8.081429,8.196065,4.040692,25.931176c-4.040737,17.735111,17.930782,25.351045,58.470045,26.015934c6.315019,0,10.285402,4.016302,9.820182,13.53245c2.318232,3.860567,45.195831,4.173208,63.847265,2.124145Z" transform="translate(-4.731067 2.174968)" fill="#059669" stroke-width="0.964"/>
            </g>
          </svg>
          <!-- Fallback for SVG rendering issues -->
          <span class="am-chat-logo-fallback" aria-hidden="true"></span>
        </div>
        <span class="am-chat-welcome-text">👋 ${welcome_message}</span>
      </div>
    </div>`;
  }
  if (hasPrompts) {
    html += '<div class="am-chat-message-prompts">';
    prompts.forEach((prompt, idx) => {
      if (prompt) {
        html += `<button class="am-chat-message-prompt" data-action="suggest" data-idx="${idx}">${prompt}</button>`;
      }
    });
    html += '</div>';
  }
  
  console.log('[DEBUG] Generated HTML:', html);
  return html;
}

/**
 * Attach click listeners to prompt buttons.
 */
private attachPromptListeners(): void {
  const promptBtns = this.element.querySelectorAll('.am-chat-message-prompt');
  promptBtns.forEach(btn => {
    btn.addEventListener('click', this.handlePromptClick);
  });
}

/**
 * Handle prompt button click: fill input and focus.
 */
private handlePromptClick = (e: Event): void => {
  if (e.target instanceof HTMLButtonElement) {
    const idx = e.target.getAttribute('data-idx');
    if (idx !== null) {
      const promptText = this.config.messagePrompts?.prompts[Number(idx)] || '';
      
      // Add visual feedback that the prompt was clicked
      const button = e.target;
      const originalBackground = button.style.backgroundColor;
      const originalColor = button.style.color;
      
      // Highlight effect
      button.style.backgroundColor = 'var(--chat-toggle-background-color, var(--chat-header-background-color, #059669))';
      button.style.color = 'white';
      
      // Open the chat first
      this.stateManager.setOpen(true);
      this.updateUI(this.stateManager.getState());
      
      // Send the message directly instead of filling the input
      if (promptText) {
        console.log('[DEBUG] Sending prompt message:', promptText);
        
        // Restore original styling after a short delay
        setTimeout(() => {
          button.style.backgroundColor = originalBackground;
          button.style.color = originalColor;
        }, 200);
        
        try {
          this.handleSendMessage(promptText);
        } catch (error) {
          console.error('[ERROR] Failed to send prompt message:', error);
          // Show error message to user
          this.addMessage({
            id: this.generateUUID(),
            sender: 'agent',
            content: 'Sorry, I encountered an error processing your request. Please try again.',
            timestamp: new Date().toISOString(),
            type: 'text'
          });
        }
      }
    }
  }
}


  public updateTheme(theme: Partial<ChatConfig['theme']>): void {
    this.config.theme = {
      ...this.config.theme,
      ...theme
    };

    if (this.element) {
      Object.entries(this.config.theme).forEach(([key, value]) => {
        this.element.style.setProperty(`--chat-${key}`, value);
      });
    }
  }

  public updateVariant(variant: ChatConfig['variant']): void {
    this.config.variant = variant;
    this.styleManager.updateStyles(variant);

    if (this.element) {
      this.element.className = `chat-widget chat-widget--${variant}`;
    }

    this.setupForCurrentDevice();
  }

  public updateColors(theme: Partial<ChatTheme>): void {
    if (this.element) {
      if (theme.textColor) this.element.style.setProperty('--chat-text-color', theme.textColor);
      if (theme.backgroundColor) this.element.style.setProperty('--chat-background-color', theme.backgroundColor);
      if (theme.buttonColor) this.element.style.setProperty('--chat-button-color', theme.buttonColor);
      if (theme.buttonTextColor) this.element.style.setProperty('--chat-button-text-color', theme.buttonTextColor);
      if (theme.agentBackgroundColor) this.element.style.setProperty('--chat-agent-background-color', theme.agentBackgroundColor);
      if (theme.userBackgroundColor) this.element.style.setProperty('--chat-user-background-color', theme.userBackgroundColor);
      if (theme.agentForegroundColor) this.element.style.setProperty('--chat-agent-foreground-color', theme.agentForegroundColor);
      if (theme.userForegroundColor) this.element.style.setProperty('--chat-user-foreground-color', theme.userForegroundColor);
      if (theme.headerBackgroundColor) this.element.style.setProperty('--chat-header-background-color', theme.headerBackgroundColor);
      if (theme.headerTextColor) this.element.style.setProperty('--chat-header-text-color', theme.headerTextColor);
      if (theme.agentIconColor) this.element.style.setProperty('--chat-agent-icon-color', theme.agentIconColor);
      if (theme.userIconColor) this.element.style.setProperty('--chat-user-icon-color', theme.userIconColor);
      // Add toggle button styling CSS variables
      if (theme.toggleBackgroundColor) this.element.style.setProperty('--chat-toggle-background-color', theme.toggleBackgroundColor);
      if (theme.toggleTextColor) this.element.style.setProperty('--chat-toggle-text-color', theme.toggleTextColor);
      if (theme.toggleIconColor) this.element.style.setProperty('--chat-toggle-icon-color', theme.toggleIconColor);
      
      // Update toggle button styling directly
      if (theme.toggleBackgroundColor || theme.toggleTextColor || theme.toggleIconColor) {
        this.updateToggleButtonStyling();
      }
    }
  }

  private createElements(): void {
    // Remove any existing widget for this container
    const existingWidget = document.querySelector(`.am-chat-widget[data-container="${this.containerId}"]`);
    if (existingWidget) {
      existingWidget.remove();
    }

    this.element = document.createElement('div');
    this.element.className = `am-chat-widget am-chat-widget--${this.config.variant}`;
    this.element.setAttribute('data-container', this.containerId);

    // Only show toggle button for corner variant
    const showToggle = this.config.variant === 'corner';

    this.element.innerHTML = this.generateTemplate(showToggle);

    this.applyInitialDimensions(this.config.initialHeight, this.config.initialWidth);

    // For inline variant, append to container, otherwise append to document.body
    if (this.config.variant === 'inline') {
      const container = document.getElementById(this.containerId);
      if (!container) {
        console.error(`Container with id "${this.containerId}" not found`);
        return;
      }
      // Clear the container
      container.innerHTML = '';
      container.appendChild(this.element);
    } else {
      document.body.appendChild(this.element);
    }
  }

  private generateTemplate(showToggle: boolean): string {
    return `
      ${showToggle ? `
        <button class="am-chat-toggle" style="background-color: ${this.theme.toggleBackgroundColor} !important;">
          <div class="am-chat-toggle-content">
            <div class="am-chat-logo" style="color: ${this.theme.toggleIconColor} !important;">
              ${this.assets.logo}
            </div>
            <span class="am-chat-toggle-text" style="color: ${this.theme.toggleTextColor} !important;">${this.config.toggleText || 'Ask Agentman'}</span>
          </div>
        </button>
      ` : ''}
      <div class="am-chat-container">
        <aside class="am-drawer" aria-label="Conversations">
          <header>Chats <button class="am-new" aria-label="New chat">＋</button></header>
          <ul>
            ${this.persistenceManager?.list().map(m =>
              `<li data-id="${m.id}" class="${m.id === this.conversationId ? "active" : ""}">${m.title}</li>`).join("") || ''}
          </ul>
          <button class="am-close">Close ▸</button>
        </aside>
        <div class="am-chat-header">
          <div class="am-chat-header-content">
            <div class="am-chat-logo-title">
              <button class="am-hamburger" aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="am-chat-header-logo">${this.assets.headerLogo}</div>
              <span>${this.config.title}</span>
            </div>
            <div class="am-chat-header-actions">
              <button class="am-chat-expand am-chat-header-button desktop-only">
                ${this.config.icons?.expandIcon || expand}
              </button>
              <button class="am-chat-minimize am-chat-header-button">
                ${this.config.icons?.minimizeIcon || minimize}
              </button>
            </div>
          </div>
        </div>
        <div class="am-chat-messages"></div>
        <div class="am-chat-input-container">
          <textarea class="am-chat-input" placeholder="${this.config.placeholder || 'Type your message...'}"></textarea>
          <button class="am-chat-send" disabled>
            ${this.config.icons?.sendIcon || send}
          </button>
        </div>
        <div class="am-chat-branding">Powered by ${this.config.hideBranding ? `<span style="color: #10b981;">Agentman.ai</span>` : `<a href="https://agentman.ai" target="_blank" rel="noopener noreferrer">Agentman.ai</a>`}</div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const toggle = this.element.querySelector('.am-chat-toggle');
    const minimize = this.element.querySelector('.am-chat-minimize');
    const send = this.element.querySelector('.am-chat-send');
    const input = this.element.querySelector('.am-chat-input') as HTMLTextAreaElement;

    if (toggle) {
      toggle.addEventListener('click', (e: Event) => {
        if (e instanceof MouseEvent) {
          this.handleToggleClick(e);
        }
      });
    }
    
    // Conversation drawer handlers
    const drawer = this.element.querySelector('.am-drawer') as HTMLElement;
    const hamburger = this.element.querySelector('.am-hamburger');
    const newConversationBtn = this.element.querySelector('.am-new');
    const closeDrawerBtn = this.element.querySelector('.am-close');
    
    // Open drawer with hamburger menu
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        if (drawer) drawer.classList.add('open');
      });
    }
    
    // Create new conversation
    if (newConversationBtn) {
      newConversationBtn.addEventListener('click', () => {
        this.newConversation();
        if (drawer) drawer.classList.remove('open');
      });
    }
    
    // Close drawer with button
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => {
        if (drawer) drawer.classList.remove('open');
      });
    }
    
    // Close drawer when clicking outside of it
    const messagesContainer = this.element.querySelector('.am-chat-messages');
    const headerContent = this.element.querySelector('.am-chat-header-content');
    const inputContainer = this.element.querySelector('.am-chat-input-container');
    
    // Add click handlers to main UI elements
    [messagesContainer, headerContent, inputContainer].forEach(element => {
      if (element) {
        element.addEventListener('click', (e: Event) => {
          // Only close if drawer is open and click didn't originate from hamburger button
          if (e instanceof MouseEvent && drawer && drawer.classList.contains('open')) {
            const target = e.target as HTMLElement;
            if (target && !target.closest('.am-hamburger') && !target.closest('.am-drawer')) {
              drawer.classList.remove('open');
              e.stopPropagation(); // Prevent other click handlers
            }
          }
        });
      }
    });
    
    // Switch conversation on click
    const conversationItems = this.element.querySelectorAll('.am-drawer li');
    conversationItems.forEach(li => {
      li.addEventListener('click', () => {
        const id = li.getAttribute('data-id');
        if (id) {
          this.switchConversation(id);
          if (drawer) drawer.classList.remove('open');
        }
      });
    });

    if (minimize) {
      minimize.addEventListener('click', (e: Event) => {
        if (e instanceof MouseEvent) {
          this.handleMinimizeClick(e);
        }
      });
    }

    if (send) {
      send.addEventListener('click', (e: Event) => {
        if (e instanceof MouseEvent) {
          this.handleSendClick(e);
        }
      });
    }

    if (input) {
      // Set initial height
      input.style.height = '44px';
      input.addEventListener('keydown', this.handleInputKeypress);
      input.addEventListener('input', this.handleInputChange);
    }

    const expandButton = this.element.querySelector('.am-chat-expand');
    if (expandButton) {
      expandButton.addEventListener('click', this.handleExpandClick);
    }

    // Use a single resize handler that also updates prompt visibility
    window.addEventListener('resize', () => {
      this.handleResize();
      // Update prompts visibility based on screen size
      if (this.isDesktopDevice()) {
        // Show prompts only on desktop
        const promptsContainer = document.querySelector('.am-chat-message-prompts-container') as HTMLElement;
        if (promptsContainer) {
          promptsContainer.style.display = '';
        }
      } else {
        // Hide prompts on mobile
        const promptsContainer = document.querySelector('.am-chat-message-prompts-container') as HTMLElement;
        if (promptsContainer) {
          promptsContainer.style.display = 'none';
        }
      }
    });
  }


  setupOnlineStatusMonitoring() {
    window.addEventListener('online', () => {
      if (this.isOffline) {
        this.loadDependencies()
          .then(() => {
            this.isOffline = false;
          })
          .catch(error => {
            console.warn('Failed to switch to online mode:', error);
          });
      }
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
    });
  }
  // Use arrow functions to preserve 'this' context
  private handleToggleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.toggleChat();
  };

  private handleInputChange = (e: Event): void => {
    const input = e.target as HTMLTextAreaElement;

    // Update send button state immediately
    const sendButton = this.element.querySelector('.am-chat-send') as HTMLButtonElement;
    if (sendButton) {
      sendButton.disabled = !input.value.trim();
    }

    // Debounce resize calculations
    if (this.resizeDebounceTimeout) {
      window.clearTimeout(this.resizeDebounceTimeout);
    }

    this.resizeDebounceTimeout = window.setTimeout(() => {
      // Reset height to recalculate
      input.style.height = '32px';
      // Set height to max of min-height and scroll height
      const newHeight = Math.max(32, Math.min(input.scrollHeight, 120));
      input.style.height = `${newHeight}px`;
    }, 100);
  };

  // In ChatWidget.ts - Add these methods
  private handleMinimizeClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.toggleChat();
  };

  private handleSendClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await this.handleSendMessage();
  };

  private handleInputKeypress = async (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const input = e.target as HTMLTextAreaElement;
      const message = input.value.trim();

      if (message) {
        await this.handleSendMessage();
      }
    }
  };

  public toggleChat(): void {
    if (this.config.variant === 'corner') {
      const newState = !this.stateManager.getState().isOpen;
      this.stateManager.setOpen(newState);
      this.updateUI(this.stateManager.getState());
    }
  }

  private async initializeChat(): Promise<void> {
    console.log('🌟 initializeChat() called');
    if (this.state.isInitialized || this.isInitializing) {
      console.log('⏭️ initializeChat() aborted - already initialized or initializing');
      return;
    }

    this.isInitializing = true;
    this.showInitializingMessage(true);
    this.lastMessageCount = 0;
    console.log('🚧 Starting chat initialization');

    try {
      // Use the initialMessage if provided, otherwise default to 'Hello'
      const initialMessage = this.config.initialMessage || 'Hello';
      console.log(`💬 Using initial message: "${initialMessage}"`);
      console.log(`🔗 Conversation ID: ${this.conversationId}`);
      
      const response = await fetch(`${this.config.apiUrl}/v2/agentman_runtime/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_token: this.config.agentToken,
          force_load: false,
          conversation_id: this.conversationId,
          user_input: initialMessage
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle the response directly
      if (data.response) {
        console.log('📡 Received initial response data');
        this.handleInitialResponse(data.response);
        
        // Check if persistenceManager is saving after welcome message
        if (this.persistenceManager) {
          console.log('🔍 Checking if welcome message is saved to persistence');
          const currentMessages = this.stateManager.getState().messages;
          console.log(`📊 Current message count after welcome: ${currentMessages.length}`);
        }
      }

      this.stateManager.setInitialized(true);
    } catch (error) {
      console.error('Chat initialization error:', error);
      this.stateManager.setError('Failed to initialize chat. Please try again.');
    } finally {
      this.isInitializing = false;
      this.showInitializingMessage(false);
    }
  }

  private handleInitialResponse(responseData: APIResponse[]): void {
    console.log('👋 handleInitialResponse() called');
    if (!Array.isArray(responseData)) {
      console.error('Invalid response format:', responseData);
      return;
    }

    // If this.lastMessageCount is undefined (e.g., not yet set), initialize it
    if (typeof this.lastMessageCount === 'undefined') {
      this.lastMessageCount = 0;
    }

    // Get only the new messages that appear after the last known count
    const newMessages = responseData.slice(this.lastMessageCount);
    console.log(`💬 Processing ${newMessages.length} new messages from initial response`);

    for (const msg of newMessages) {
      // Skip human messages since we already display them when sending
      if (msg.type !== 'ai') {
        console.log('⏭️ Skipping human message in initial response');
        continue;
      }

      if (this.isValidMessage(msg) && msg.content.trim()) {
        console.log('➕ Adding welcome message to UI');
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
  }


  private isValidMessage(msg: APIResponse): boolean {
    return (
      typeof msg === 'object' &&
      msg !== null &&
      'type' in msg &&
      'content' in msg &&
      typeof msg.content === 'string'
    );
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private showInitializingMessage(show: boolean): void {
    const initializingElement = this.element.querySelector('.am-chat-initializing') as HTMLElement;
    const sendButton = this.element.querySelector('.am-chat-send') as HTMLButtonElement;
    const inputElement = this.element.querySelector('.am-chat-input') as HTMLTextAreaElement;

    if (initializingElement) {
      initializingElement.style.display = show ? 'block' : 'none';
    }

    if (sendButton) {
      sendButton.disabled = show;
    }

    if (inputElement) {
      inputElement.disabled = show;
    }
  }

  private async sendMessage(message: string): Promise<void> {
    const messageId = this.generateUUID();
    const newMessage: Message = {
      id: messageId,
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    // Add user message
    this.addMessage(newMessage);

    // Show loading indicator
    this.showLoadingIndicator();

    try {
      const response = await fetch(
        `${this.config.apiUrl}/v2/agentman_runtime/agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_token: this.config.agentToken,
            force_load: false,
            conversation_id: this.conversationId,
            user_input: message
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Hide loading before showing response
      this.hideLoadingIndicator();



      // Process the response array
      if (Array.isArray(data.response)) {
        await this.handleResponse(data.response);
        
        // Save messages after response is processed
        if (this.persistenceManager && !this.isLoadingConversation) {
          console.log('💾 Saving messages after response processed');
          this.persistenceManager.saveMessages();
          
          // Update the conversation drawer to reflect new titles
          this.updateConversationDrawer();
        } else if (this.isLoadingConversation) {
          console.log('⏭️ Skipping save during conversation loading');
        }
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Message sending error:', error);
      this.hideLoadingIndicator();

      const errorMessage: Message = {
        id: this.generateUUID(),
        sender: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      this.addMessage(errorMessage);
    }
  }

  // Update handleSendMessage to properly handle state
  private async handleSendMessage(directMessage?: string): Promise<void> {
    let message: string;
    
    if (directMessage) {
      // Use the provided message directly
      message = directMessage.trim();
    } else {
      // Get message from input field
      const input = this.element.querySelector('.am-chat-input') as HTMLTextAreaElement;
      message = input.value.trim();
      
      // Clear input field if we're using it
      if (message) {
        input.value = '';
        input.style.height = 'auto';
      }
    }

    if (!message || this.state.isSending) {
      return;
    }

    // Set sending state
    this.stateManager.setSending(true);

    try {
      // Disable send button
      const sendButton = this.element.querySelector('.am-chat-send') as HTMLButtonElement;
      if (sendButton) {
        sendButton.disabled = true;
      }

      await this.sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      this.stateManager.setSending(false);
    }
  }

  public addMessage(message: Message): void {
    const messagesContainer = this.element.querySelector('.am-chat-messages');
    if (!messagesContainer) {
      console.error('Messages container not found');
      return;
    }

    this.stateManager.addMessage(message);
    
    // Save message to persistence storage
    if (this.persistenceManager && !this.isLoadingConversation) {
      console.log('💾 Saving message in addMessage() method');
      this.persistenceManager.saveMessages();
    } else if (this.isLoadingConversation) {
      console.log('⏭️ Skipping save in addMessage() during conversation loading');
    }

    const messageElement = document.createElement('div');
    messageElement.className = `am-message ${message.sender}`;

    const renderedContent = this.messageRenderer.render(message);
    const icon = message.sender === 'user' 
      ? this.config.icons?.userIcon || ChatWidget.defaultIcons.userIcon 
      : this.config.icons?.agentIcon || ChatWidget.defaultIcons.agentIcon;

    // For SVG icons, we need to ensure they're treated as SVG content
    const iconHtml = typeof icon === 'string' && (icon.includes('<svg') || isImageUrl(icon))
      ? getIconHtml(icon, `${message.sender} avatar`)
      : icon; // If it's already an SVG object, use it directly

    // Only show avatar for agent messages, not for user messages
    if (message.sender === 'user') {
      messageElement.innerHTML = `
        <div class="am-message-content">
          ${renderedContent}
        </div>
      `;
    } else {
      messageElement.innerHTML = `
        <div class="am-message-avatar ${message.sender}" style="color: ${this.theme.agentIconColor}">
          ${iconHtml}
        </div>
        <div class="am-message-content">
          ${renderedContent}
        </div>
      `;
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private async handleResponse(responseData: APIResponse[]): Promise<void> {
    if (!Array.isArray(responseData)) {
      console.error('Invalid response format:', responseData);
      return;
    }

    // If this.lastMessageCount is undefined (e.g., not yet set), initialize it
    if (typeof this.lastMessageCount === 'undefined') {
      this.lastMessageCount = 0;
    }
    
    console.log(`🔍 handleResponse: Processing response with ${responseData.length} messages, lastMessageCount=${this.lastMessageCount}`);

    // Get only the new messages that appear after the last known count
    const newMessages = responseData.slice(this.lastMessageCount);
    console.log(`🔄 handleResponse: Found ${newMessages.length} new messages`);
    
    // Get current messages to check for duplicates
    const currentMessages = this.stateManager.getState().messages;
    const existingContents = currentMessages.map(m => m.content.trim());
    
    for (const msg of newMessages) {
      // Skip human messages since we already display them when sending
      if (msg.type !== 'ai') {
        console.log('⏭️ handleResponse: Skipping human message');
        continue;
      }
      
      const content = msg.content.trim();
      
      // Skip if this message content already exists in the UI
      if (existingContents.includes(content)) {
        console.log('⏭️ handleResponse: Skipping duplicate message: ' + content.substring(0, 30) + '...');
        continue;
      }

      if (this.isValidMessage(msg) && content) {
        console.log('➕ handleResponse: Adding new message');
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
    console.log(`✅ handleResponse: Updated lastMessageCount to ${this.lastMessageCount}`);
  }


  private showLoadingIndicator(): void {
    if (this.loadingMessageElement) {
      return;
    }

    const messagesContainer = this.element.querySelector('.am-chat-messages');
    if (!messagesContainer) {
      return;
    }

    this.loadingMessageElement = document.createElement('div');
    this.loadingMessageElement.className = 'am-message agent am-chat-loading-message';

    const icon = this.config.icons?.agentIcon || ChatWidget.defaultIcons.agentIcon;
    
    // For SVG icons, we need to ensure they're treated as SVG content
    const iconHtml = typeof icon === 'string' && (icon.includes('<svg') || isImageUrl(icon))
      ? getIconHtml(icon, 'agent avatar')
      : icon; // If it's already an SVG object, use it directly

    this.loadingMessageElement.innerHTML = `
      <div class="am-message-avatar" style="color: ${this.theme.agentIconColor}">
        ${iconHtml}
      </div>
      <div class="am-message-content">
        <div class="loading-container">
          <div class="loading-bars">
            <span></span><span></span><span></span>
          </div>
          <div class="loading-text-wrapper">
            <span class="loading-text">${this.loadingStates[0]}...</span>
          </div>
        </div>
      </div>
    `;

    messagesContainer.appendChild(this.loadingMessageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    this.startLoadingAnimation();
  }

  private hideLoadingIndicator(): void {
    if (this.loadingMessageElement) {
      this.loadingMessageElement.classList.add('loading-fade-out');
      setTimeout(() => {
        this.loadingMessageElement?.remove();
        this.loadingMessageElement = null;
      }, 150);
    }

    if (this.loadingAnimationInterval) {
      window.clearInterval(this.loadingAnimationInterval);
      this.loadingAnimationInterval = null;
    }
  }
  
  // Conversation management methods for Stage 2
  public newConversation(): void {
    console.log('⭐ newConversation() called');
    
    if (!this.persistenceManager) {
      console.error('😱 persistenceManager is not available');
      return;
    }
    
    console.log('📝 Current conversation ID before new:', this.conversationId);
    
    // Explicitly clear the chat UI first
    console.log('🚮 Clearing chat UI messages');
    const messagesContainer = this.element.querySelector('.am-chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    
    console.log('🧹 Clearing messages from state manager');
    // Clear memory state
    this.stateManager.setMessages([]);
    this.stateManager.clearMessages();
    
    // Create new conversation with empty message array
    console.log('🆕 Creating new conversation');
    const id = this.persistenceManager.create();
    console.log('✅ New conversation created with ID:', id);
    
    // Switch to the new conversation
    console.log('🔄 Switching to new conversation');
    this.switchConversation(id);
    
    // Update just the conversation drawer instead of rebuilding entire UI
    console.log('🔄 Updating conversation drawer');
    this.updateConversationDrawer();
    
    // Initialize the new conversation with a welcome message
    console.log('📡 Initializing new conversation with welcome message');
    this.initializeChat();
    
    console.log('✨ newConversation() complete');
  }
  
  private updateConversationDrawer(): void {
    if (!this.persistenceManager) return;
    
    // Find the conversation list in the drawer
    const drawerList = this.element.querySelector('.am-drawer ul');
    if (!drawerList) return;
    
    // Get all conversations and generate the list items
    const conversations = this.persistenceManager.list();
    const listHTML = conversations.map(conv => {
      // Format the timestamp as a relative time (e.g., "2 min ago")
      const timeAgo = this.getRelativeTimeString(conv.lastUpdated);
      
      // Check if this conversation has unread messages (for badge)
      // This is a placeholder - implement actual unread count logic as needed
      const unreadCount = 0; // Replace with actual unread count
      const badgeHtml = unreadCount > 0 ? `<span class="badge">${unreadCount}</span>` : '';
      
      return `<li data-id="${conv.id}" class="${conv.id === this.conversationId ? 'active' : ''}">
        <span class="title">${conv.title}</span>
        <span class="time">${timeAgo}</span>
        ${badgeHtml}
      </li>`;
    }).join('');
    
    // Update the drawer list
    drawerList.innerHTML = listHTML;
    
    // Re-attach event listeners just for the conversation items
    const conversationItems = drawerList.querySelectorAll('li');
    conversationItems.forEach(li => {
      // Remove any existing click listeners to prevent duplicates
      const newLi = li.cloneNode(true) as HTMLElement;
      li.parentNode?.replaceChild(newLi, li);
      
      // Add click event listener with proper binding
      newLi.addEventListener('click', (e: Event) => {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event bubbling
        
        const id = newLi.getAttribute('data-id');
        console.log('🖱️ Conversation item clicked:', id);
        
        if (id) {
          // Close drawer first
          const drawer = this.element.querySelector('.am-drawer');
          if (drawer) drawer.classList.remove('open');
          
          // Then switch conversation
          setTimeout(() => {
            this.switchConversation(id);
          }, 50); // Small delay to ensure UI updates properly
        }
      });
    });
  }
  
  private isLoadingConversation = false;
  
  /**
   * Formats a timestamp into a relative time string (e.g., "2m ago", "5h ago")
   * @param timestamp The timestamp to format
   * @returns A formatted relative time string
   */
  private getRelativeTimeString(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return 'just now';
    }
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    
    // Convert to days
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days}d ago`;
    }
    
    // Format as date for older timestamps
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }

  public switchConversation(id: string): void {
    console.log('🔁 switchConversation() called with ID:', id);
    
    if (!this.persistenceManager) {
      console.error('😱 persistenceManager is not available');
      return;
    }
    
    if (id === this.conversationId) {
      console.log('⏸️ Already in this conversation, skipping switch');
      return;
    }
    
    console.log('🔄 Switching to conversation:', id);
    // Switch to new conversation
    this.persistenceManager.switchTo(id);
    this.conversationId = id;
    
    console.log('🗑 Clearing message DOM elements');
    // Clear both DOM and state - use innerHTML for complete clearing
    const messagesContainer = this.element.querySelector('.am-chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    } else {
      // Fallback to individual element removal if container not found
      this.element.querySelectorAll('.am-chat-message').forEach(el => el.remove());
    }
    
    console.log('🗑️ Clearing message state');
    this.stateManager.clearMessages();
    this.stateManager.setMessages([]);
    
    // Set loading flag to prevent saveMessages() from updating timestamps
    console.log('🚧 Setting isLoadingConversation flag to true');
    this.isLoadingConversation = true;
    
    console.log('📚 Loading messages for conversation:', id);
    // Reload messages from persistence
    const messages = this.persistenceManager.loadMessages();
    console.log('📃 Found', messages.length, 'messages to restore');
    
    console.log('📄 Updating state manager with messages');
    // Update state manager first
    messages.forEach(m => {
      this.stateManager.addMessage(m);
    });
    
    console.log('💬 Rendering messages in DOM');
    // Then update DOM
    messages.forEach(m => this.addMessage(m));
    
    console.log('🔄 Forcing UI refresh');
    // Force UI refresh
    this.init();
    
    // Update the conversation drawer to highlight the active conversation
    console.log('🔄 Updating conversation drawer to highlight active conversation');
    this.updateConversationDrawer();
    
    // Reset loading flag after everything is done
    console.log('🚧 Setting isLoadingConversation flag to false');
    this.isLoadingConversation = false;
    
    console.log('✨ switchConversation() complete');
  }

  private startLoadingAnimation(): void {
    this.currentLoadingStateIndex = 0;

    if (this.loadingAnimationInterval) {
      window.clearInterval(this.loadingAnimationInterval);
    }

    this.loadingAnimationInterval = window.setInterval(() => {
      if (!this.loadingMessageElement) return;

      this.currentLoadingStateIndex = (this.currentLoadingStateIndex + 1) % this.loadingStates.length;
      const loadingText = this.loadingMessageElement.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = `${this.loadingStates[this.currentLoadingStateIndex]}...`;
      }
    }, 2000);
  }

  private handleExpandClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isExpanded = this.element.classList.contains('am-chat-expanded');
    if (isExpanded) {
      this.element.classList.remove('am-chat-expanded');
      const expandButton = this.element.querySelector('.am-chat-expand');
      if (expandButton) {
        expandButton.innerHTML = this.config.icons?.expandIcon || expand;
      }
    } else {
      this.element.classList.add('am-chat-expanded');
      const expandButton = this.element.querySelector('.am-chat-expand');
      if (expandButton) {
        expandButton.innerHTML = this.config.icons?.collapseIcon || collapse;
      }
    }
  }
}

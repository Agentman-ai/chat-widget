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
  private workflowId!: string; // Mark as definitely assigned
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
        this.config.persistence,
        this.stateManager,
        this.containerId
      );
      
      // Check if we have a stored conversation ID
      const storedId = this.persistenceManager.getConversationId();
      if (storedId) {
        this.conversationId = storedId;
      }
      
      // Tell PersistenceManager about our current conversation ID
      this.persistenceManager.setConversationId(this.conversationId);
      
      // Cross-tab sync disabled to prevent refresh loops
      // TODO: Re-enable with proper debouncing/throttling mechanism
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

    if (container) {
      // For corner variant, handle show/hide
      if (this.config.variant === 'corner') {
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
        <div class="am-chat-header">
          <div class="am-chat-header-content">
            <div class="am-chat-logo-title">
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
          <textarea
            class="am-chat-input"
            placeholder="${this.config.placeholder || 'Type your message...'}">
          </textarea>
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

    window.addEventListener('resize', this.handleResize.bind(this));
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
    if (this.state.isInitialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    this.showInitializingMessage(true);
    this.lastMessageCount = 0;

    try {
      // Use the initialMessage if provided, otherwise default to 'Hello'
      const initialMessage = this.config.initialMessage || 'Hello';
      
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
      this.workflowId = data.workflow_id;
      
      // Handle the response directly
      if (data.response) {
        this.handleInitialResponse(data.response);
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
    if (!Array.isArray(responseData)) {
      console.error('Invalid response format:', responseData);
      return;
    }

    let lastAIMessage: APIResponse | undefined;
    for (let i = responseData.length - 1; i >= 0; i--) {
      const msg = responseData[i];
      if (this.isValidMessage(msg) && msg.type === 'ai' && msg.content.trim()) {
        lastAIMessage = msg;
        break;
      }
    }

    if (lastAIMessage) {
      this.addMessage({
        id: lastAIMessage.id ?? this.generateUUID(),
        sender: 'agent',
        content: lastAIMessage.content,
        timestamp: new Date().toISOString(),
        type: 'text'
      });
    } else {
      console.warn('No valid AI message found in the initial response');
    }

    // After processing the initial response, update lastMessageCount
    this.lastMessageCount = responseData.length;
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

      // Store workflow ID if present
      if (data.workflow_id) {
        this.workflowId = data.workflow_id;
      }

      // Process the response array
      if (Array.isArray(data.response)) {
        await this.handleResponse(data.response);
        
        // Save messages after response is processed
        if (this.persistenceManager) {
          this.persistenceManager.saveMessages();
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
  private async handleSendMessage(): Promise<void> {
    const input = this.element.querySelector('.am-chat-input') as HTMLTextAreaElement;
    const message = input.value.trim();

    if (!message || this.state.isSending) {
      return;
    }

    // Set sending state
    this.stateManager.setSending(true);

    try {
      // Clear input before sending
      input.value = '';
      input.style.height = 'auto';

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
    if (this.persistenceManager) {
      this.persistenceManager.saveMessages();
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

    // Get only the new messages that appear after the last known count
    const newMessages = responseData.slice(this.lastMessageCount);

    for (const msg of newMessages) {
      // Skip human messages since we already display them when sending
      if (msg.type !== 'ai') continue;

      if (this.isValidMessage(msg) && msg.content.trim()) {
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

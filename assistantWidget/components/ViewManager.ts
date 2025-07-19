// ViewManager.ts - Manages view transitions between welcome screen and conversation
import type { ChatConfig, ChatState, ChatTheme, ChatAssets } from '../types/types';
import { WelcomeScreen } from './WelcomeScreen';
import { ConversationView } from './ConversationView';
import * as icons from '../assets/icons';

/**
 * ViewManager - Handles view transitions and state management
 * 
 * Responsibilities:
 * - Switch between welcome screen and conversation view
 * - Manage view transitions and animations
 * - Coordinate event handling between views
 * - Maintain consistent state across view changes
 */
export class ViewManager {
  private config: ChatConfig;
  private theme: ChatTheme;
  private assets: ChatAssets;
  private container: HTMLElement;

  // Current view state
  private currentView: 'welcome' | 'conversation' = 'welcome';
  private isTransitioning: boolean = false;

  // View components
  private welcomeScreen: WelcomeScreen | null = null;
  private conversationView: ConversationView | null = null;
  
  // Toggle button for corner variant
  private toggleButton: HTMLElement | null = null;
  
  // Store attachment configuration for newly created views
  private lastConfiguredMimeTypes?: string[];
  private lastConfiguredSupportsAttachments?: boolean;

  // Event handlers passed from ChatWidget
  private eventHandlers: {
    onToggle: () => void;
    onExpand?: () => void;
    onSend: () => void;
    onInputKey: (e: KeyboardEvent) => void;
    onPromptClick: (prompt: string) => void;
    onAttachmentClick?: () => void;
    onFileSelect?: (files: FileList) => void;
    onAttachmentRemove?: (fileId: string) => void;
    onViewTransition?: (from: string, to: string) => void;
    onConversationsClick?: () => void;
  };

  constructor(
    config: ChatConfig,
    theme: ChatTheme,
    assets: ChatAssets,
    container: HTMLElement,
    eventHandlers: {
      onToggle: () => void;
      onExpand?: () => void;
      onSend: () => void;
      onInputKey: (e: KeyboardEvent) => void;
      onPromptClick: (prompt: string) => void;
      onAttachmentClick?: () => void;
      onFileSelect?: (files: FileList) => void;
      onAttachmentRemove?: (fileId: string) => void;
      onViewTransition?: (from: string, to: string) => void;
      onConversationsClick?: () => void;
    }
  ) {
    this.config = config;
    this.theme = theme;
    this.assets = assets;
    this.container = container;
    this.eventHandlers = eventHandlers;

    // Initialize with welcome screen
    this.showWelcomeScreen();
  }

  /**
   * Get the current view type
   */
  public getCurrentView(): 'welcome' | 'conversation' {
    return this.currentView;
  }

  /**
   * Check if currently transitioning between views
   */
  public isInTransition(): boolean {
    return this.isTransitioning;
  }

  /**
   * Transition to conversation view (from welcome screen)
   */
  public async transitionToConversation(): Promise<void> {
    if (this.currentView === 'conversation' || this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;

    try {
      // Notify listeners of transition start
      if (this.eventHandlers.onViewTransition) {
        this.eventHandlers.onViewTransition('welcome', 'conversation');
      }

      // Create conversation view
      if (!this.conversationView) {
        this.conversationView = new ConversationView(
          this.config,
          this.theme,
          this.assets,
          {
            onToggle: this.eventHandlers.onToggle,
            onExpand: this.eventHandlers.onExpand,
            onSend: this.eventHandlers.onSend,
            onInputKey: this.eventHandlers.onInputKey,
            onPromptClick: this.eventHandlers.onPromptClick,
            onAttachmentClick: this.eventHandlers.onAttachmentClick,
            onFileSelect: this.eventHandlers.onFileSelect,
            onAttachmentRemove: this.eventHandlers.onAttachmentRemove
          }
        );
      }

      // Update state BEFORE animation to allow message operations
      this.currentView = 'conversation';
      
      const conversationElement = this.conversationView.create();
      
      // Perform transition with animation
      await this.performViewTransition(
        this.welcomeScreen?.getRootElement() || null,
        conversationElement,
        'slideUp'
      );
      
      // Configure attachments for the newly created conversation view
      // This needs to be done after create() since that's when the input component is initialized
      if (this.lastConfiguredMimeTypes !== undefined && this.lastConfiguredSupportsAttachments !== undefined) {
        const conversationInput = this.conversationView.getInputComponent();
        if (conversationInput) {
          conversationInput.configureAttachments(this.lastConfiguredMimeTypes, this.lastConfiguredSupportsAttachments);
        }
      }

      // Clean up welcome screen
      if (this.welcomeScreen) {
        this.welcomeScreen.destroy();
        this.welcomeScreen = null;
      }

    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Transition back to welcome screen (for new conversation)
   */
  public async transitionToWelcome(): Promise<void> {
    if (this.currentView === 'welcome' || this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;

    try {
      // Notify listeners of transition start
      if (this.eventHandlers.onViewTransition) {
        this.eventHandlers.onViewTransition('conversation', 'welcome');
      }

      // Create welcome screen
      if (!this.welcomeScreen) {
        this.welcomeScreen = new WelcomeScreen(
          this.config,
          this.theme,
          this.assets,
          {
            onInputKey: this.eventHandlers.onInputKey,
            onSend: this.eventHandlers.onSend,
            onPromptClick: this.eventHandlers.onPromptClick,
            onConversationsClick: this.eventHandlers.onConversationsClick,
            onToggle: this.eventHandlers.onToggle
          }
        );
      }

      // Perform transition with animation
      await this.performViewTransition(
        this.conversationView?.getRootElement() || null,
        this.welcomeScreen.create(),
        'slideDown'
      );

      // Update state
      this.currentView = 'welcome';

      // Clean up conversation view
      if (this.conversationView) {
        this.conversationView.destroy();
        this.conversationView = null;
      }

    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Update the current view's UI state
   */
  public updateUI(state: ChatState): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.updateUI(state);
    }
    // Welcome screen doesn't need state updates
  }

  /**
   * Update theme for the current view
   */
  public updateTheme(theme: Partial<ChatTheme>): void {
    // Update stored theme
    this.theme = { ...this.theme, ...theme };

    // Update current view
    if (this.currentView === 'welcome' && this.welcomeScreen) {
      this.welcomeScreen.updateTheme(theme);
    } else if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.updateTheme(theme);
    }
  }

  /**
   * Get the current input value from active view
   */
  public getInputValue(): string {
    if (this.currentView === 'welcome' && this.welcomeScreen) {
      return this.welcomeScreen.getInputValue();
    } else if (this.currentView === 'conversation' && this.conversationView) {
      return this.conversationView.getInputValue();
    }
    return '';
  }

  /**
   * Clear the input in the active view
   */
  public clearInput(): void {
    if (this.currentView === 'welcome' && this.welcomeScreen) {
      this.welcomeScreen.clearInput();
    } else if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.clearInput();
    }
  }

  /**
   * Focus the input in the active view
   */
  public focusInput(): void {
    if (this.currentView === 'welcome' && this.welcomeScreen) {
      this.welcomeScreen.focusInput();
    } else if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.focusInput();
    }
  }

  /**
   * Get a DOM element from the current view
   */
  public getElement(selector: string): HTMLElement | null {
    if (this.currentView === 'conversation' && this.conversationView) {
      return this.conversationView.getElement(selector);
    }
    return null;
  }

  /**
   * Get the messages container (conversation view only)
   */
  public getMessagesContainer(): HTMLElement | null {
    if (this.currentView === 'conversation' && this.conversationView) {
      return this.conversationView.getMessagesContainer();
    }
    return null;
  }

  /**
   * Hide message prompts (conversation view only)
   */
  public hideMessagePrompts(): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.hideMessagePrompts();
    }
  }

  /**
   * Show message prompts (conversation view only)
   */
  public showMessagePrompts(): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.showMessagePrompts();
    }
  }

  /**
   * Update attachment preview (conversation view only)
   */
  public updateAttachmentPreview(attachments: Record<string, unknown>[]): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.updateAttachmentPreview(attachments);
    }
  }

  /**
   * Clear file input (conversation view only)
   */
  public clearFileInput(): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.clearFileInput();
    }
  }

  /**
   * Destroy the view manager and clean up
   */
  public destroy(): void {
    if (this.welcomeScreen) {
      this.welcomeScreen.destroy();
      this.welcomeScreen = null;
    }

    if (this.conversationView) {
      this.conversationView.destroy();
      this.conversationView = null;
    }

    // Clear container
    this.container.innerHTML = '';
  }

  /**
   * Initialize and show the welcome screen
   */
  private showWelcomeScreen(): void {
    this.welcomeScreen = new WelcomeScreen(
      this.config,
      this.theme,
      this.assets,
      {
        onInputKey: this.eventHandlers.onInputKey,
        onSend: this.eventHandlers.onSend,
        onPromptClick: this.eventHandlers.onPromptClick,
        onConversationsClick: this.eventHandlers.onConversationsClick,
        onToggle: this.eventHandlers.onToggle
      }
    );

    const welcomeElement = this.welcomeScreen.create();
    this.container.appendChild(welcomeElement);
    this.currentView = 'welcome';
  }

  /**
   * Perform animated transition between views
   */
  private async performViewTransition(
    oldElement: HTMLElement | null,
    newElement: HTMLElement,
    animationType: 'slideUp' | 'slideDown' | 'fade' = 'fade'
  ): Promise<void> {
    return new Promise((resolve) => {
      const duration = 300; // ms

      // Add transition classes
      newElement.style.opacity = '0';
      
      if (animationType === 'slideUp') {
        newElement.style.transform = 'translateY(20px)';
      } else if (animationType === 'slideDown') {
        newElement.style.transform = 'translateY(-20px)';
      }

      // Add new element to container
      this.container.appendChild(newElement);

      // Force reflow
      newElement.offsetHeight;

      // Start transition
      newElement.style.transition = `all ${duration}ms ease-out`;
      newElement.style.opacity = '1';
      newElement.style.transform = 'translateY(0)';

      // Fade out old element if it exists
      if (oldElement) {
        oldElement.style.transition = `all ${duration}ms ease-out`;
        oldElement.style.opacity = '0';
        
        if (animationType === 'slideUp') {
          oldElement.style.transform = 'translateY(-20px)';
        } else if (animationType === 'slideDown') {
          oldElement.style.transform = 'translateY(20px)';
        }
      }

      // Clean up after transition
      setTimeout(() => {
        if (oldElement && oldElement.parentNode) {
          oldElement.remove();
        }
        
        // Reset transition styles
        newElement.style.transition = '';
        newElement.style.transform = '';
        newElement.style.opacity = '1'; // Ensure it's fully visible
        newElement.style.display = 'flex'; // Ensure it's displayed
        
        resolve();
      }, duration);
    });
  }

  /**
   * Get the root element of the current view
   */
  public getRootElement(): HTMLElement | null {
    if (this.currentView === 'welcome' && this.welcomeScreen) {
      return this.welcomeScreen.getRootElement();
    } else if (this.currentView === 'conversation' && this.conversationView) {
      return this.conversationView.getRootElement();
    }
    return null;
  }

  /**
   * Create toggle button for corner variant
   */
  public createToggleButton(): HTMLElement | null {
    if (this.config.variant !== 'corner') return null;

    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'am-chat-toggle';
    // Don't set inline style - let CSS variable handle it
    // this.toggleButton.style.backgroundColor = `${this.theme.toggleBackgroundColor} !important`;
    
    this.toggleButton.innerHTML = `
      <div class="am-chat-toggle-content">
        <div class="am-chat-logo">
          ${this.assets.logo || icons.agentmanLogo}
        </div>
        <span class="am-chat-toggle-text">
          ${this.config.toggleText || 'Ask AI'}
        </span>
      </div>
    `;

    this.toggleButton.addEventListener('click', this.eventHandlers.onToggle);
    
    return this.toggleButton;
  }

  /**
   * Get the toggle button element
   */
  public getToggleButton(): HTMLElement | null {
    return this.toggleButton;
  }

  /**
   * Update toggle button visibility
   */
  public updateToggleButton(isOpen: boolean): void {
    if (this.toggleButton) {
      this.toggleButton.style.display = isOpen ? 'none' : 'flex';
    }
  }

  /**
   * Update expand button state
   */
  public updateExpandButton(isExpanded: boolean): void {
    const expandButton = this.getElement('.am-chat-expand');
    if (expandButton) {
      expandButton.innerHTML = isExpanded ? icons.collapse2 : icons.expand2;
      expandButton.setAttribute('title', isExpanded ? 'Exit fullscreen' : 'Expand chat');
    }
  }

  /**
   * Configure attachments for all input components
   */
  public configureAttachments(supportedMimeTypes: string[], supportsAttachments: boolean): void {
    // Store configuration for future views
    this.lastConfiguredMimeTypes = supportedMimeTypes;
    this.lastConfiguredSupportsAttachments = supportsAttachments;
    
    // Configure welcome screen input
    const welcomeInput = this.welcomeScreen?.getInputComponent();
    if (welcomeInput) {
      welcomeInput.configureAttachments(supportedMimeTypes, supportsAttachments);
    }
    
    // Configure conversation view input (if it exists)
    const conversationInput = this.conversationView?.getInputComponent();
    if (conversationInput) {
      conversationInput.configureAttachments(supportedMimeTypes, supportsAttachments);
    }
  }

  /**
   * Add message to current view (if conversation view)
   */
  public addMessage(message: any): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.addMessage(message);
    }
  }

  /**
   * Show loading indicator in conversation view
   */
  public showLoadingIndicator(): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.showLoadingIndicator();
    }
  }

  /**
   * Hide loading indicator in conversation view
   */
  public hideLoadingIndicator(): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.hideLoadingIndicator();
    }
  }

  /**
   * Clear messages in conversation view
   */
  public clearMessages(): void {
    if (this.conversationView) {
      this.conversationView.clearMessages();
    }
  }

  /**
   * Update conversation header buttons based on conversation state
   */
  public updateConversationHeader(conversationManager: any, hasConversations: boolean): void {
    if (this.currentView === 'conversation' && this.conversationView) {
      this.conversationView.updateHeaderButtons(conversationManager, hasConversations);
    }
  }

  /**
   * Get header element from current view
   */
  public getHeaderElement(): HTMLElement | null {
    if (this.currentView === 'conversation' && this.conversationView) {
      return this.conversationView.getHeaderElement();
    }
    return null;
  }

  /**
   * Get the main container element
   */
  public getContainer(): HTMLElement {
    return this.container;
  }
}

// Add extension method to WelcomeScreen for consistency
declare module './WelcomeScreen' {
  interface WelcomeScreen {
    getRootElement(): HTMLElement | null;
  }
}

// Add extension method to ConversationView for consistency  
declare module './ConversationView' {
  interface ConversationView {
    getRootElement(): HTMLElement | null;
  }
}
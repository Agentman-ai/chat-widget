// types.ts
export type ChatVariant = 'inline' | 'corner' | 'centered';

/**
 * AgentClosedView modes - How to display the widget when closed
 * - toggle-only: Just the chat button, no prompts shown externally
 * - floating-prompts: Traditional floating bubbles with prompts
 * - welcome-card: Glassmorphic card with prompts inside
 * - input-bar: Modern AI search bar at bottom of screen with typewriter effect
 */
export type ClosedViewMode = 'toggle-only' | 'floating-prompts' | 'welcome-card' | 'input-bar';

export interface ChatTheme {
  // Core Colors
  textColor: string;
  backgroundColor: string;

  // Buttons
  buttonColor: string;
  buttonTextColor: string;

  // Messages (No Bubbles - Text Only)
  agentForegroundColor: string;
  userForegroundColor: string;

  // Toggle Button (Including agentmanLogo)
  toggleBackgroundColor: string;
  toggleTextColor: string;
  toggleIconColor: string;

  // Input Bar Colors (Optional - defaults derive from toggle colors)
  inputBarBrandBackground?: string;     // Pill background color
  inputBarBrandText?: string;           // "Ask AI" text color
  inputBarLogoBackground?: string;      // Circular logo background
  inputBarLogoIcon?: string;            // Icon color inside logo
  inputBarButtonBackground?: string;    // Menu button background
  inputBarButtonIcon?: string;          // Menu button icon color
  inputBarGlowColor?: string;           // Ambient glow/gradient color around input bar
}

export interface ChatAssets {
  /** URL to image or SVG string for the main logo */
  logo: string;
  /** URL to image or SVG string for the header logo */
  headerLogo: string;
}

export interface ChatIcons {
  closeIcon?: string;
  sendIcon?: string;
  minimizeIcon?: string;
  maximizeIcon?: string;
  expandIcon?: string;
  collapseIcon?: string;
  reduceIcon?: string;
}

export interface ChatConfig {
  /**
   * Optional message prompts for the welcome area.
   * Content is shared between AgentClosedView and WelcomeScreen.
   */
  messagePrompts?: {
    /** @deprecated Use agentClosedView instead to control visibility */
    show?: boolean;
    welcome_message?: string;
    prompts?: [string?, string?, string?];
  };

  apiUrl: string;
  agentToken: string;
  variant: 'inline' | 'corner' | 'centered';
  containerId: string;
  title?: string;
  theme?: Partial<ChatTheme>;
  initiallyOpen?: boolean;
  logo?: string;
  headerLogo?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  initialHeight?: string;
  initialWidth?: string;
  /** Mobile-specific height (defaults to 100vh) */
  mobileHeight?: string;
  /** Mobile-specific max height (defaults to 100vh) */
  mobileMaxHeight?: string;
  assets?: Partial<ChatAssets>;
  icons?: Partial<ChatIcons>;
  toggleText?: string;
  /** Custom toggle button colors from WordPress settings */
  toggleStyle?: {
    /** Background color for the toggle button */
    backgroundColor?: string;
    /** Text color for the toggle button */
    textColor?: string;
    /** Icon color for the toggle button */
    iconColor?: string;
  };
  /** Initial message displayed by the agent */
  initialMessage?: string;
  placeholder?: string;
  persistence?: PersistenceConfig;
  /** Enable/disable file attachments (enabled by default) */
  enableAttachments?: boolean;
  /** Client metadata to send with API requests */
  clientMetadata?: Partial<ClientMetadata>;
  /** Enable automatic client metadata collection */
  collectClientMetadata?: boolean;
  /** Enable IP address collection (requires external API call) */
  collectIPAddress?: boolean;
  /** Debug configuration for development and troubleshooting */
  debug?: boolean | DebugConfig;
  /** Markdown configuration for customizing marked.js loading and options */
  markdownConfig?: {
    cdnUrls?: string[];
    timeout?: number;
    markedOptions?: {
      gfm?: boolean;
      breaks?: boolean;
      headerIds?: boolean;
      mangle?: boolean;
      pedantic?: boolean;
      smartLists?: boolean;
      smartypants?: boolean;
    };
  };
  /** Streaming configuration (default: enabled) */
  streaming?: {
    /** Enable streaming responses (default: true) */
    enabled?: boolean;
    /** Prefer streaming when available */
    preferStreaming?: boolean;
    /** Fallback to non-streaming on error */
    fallbackToNonStreaming?: boolean;
  };
  /** AI Disclaimer configuration */
  disclaimer?: {
    /** Enable disclaimer display */
    enabled: boolean;
    /** Disclaimer message text */
    message: string;
    /** Optional link text */
    linkText?: string;
    /** Optional link URL */
    linkUrl?: string;
  };
  /**
   * AgentClosedView mode - How to display the widget when closed
   * - 'toggle-only': Just the chat button, no prompts shown externally
   * - 'floating-prompts': Traditional floating bubbles with prompts
   * - 'welcome-card': Glassmorphic card with prompts inside
   *
   * If not specified, falls back to legacy messagePrompts.show logic
   */
  agentClosedView?: ClosedViewMode;
}

export interface DebugConfig {
  /** Enable debug logging */
  enabled: boolean;
  /** Log levels to include */
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  /** Include timestamps in logs */
  timestamps?: boolean;
  /** Log to console */
  console?: boolean;
  /** Custom logger function */
  logger?: (level: string, message: string, data?: any) => void;
}

export interface FileAttachment {
  file_id: string;
  filename: string;
  content_type: string;
  file_type: 'image' | 'document' | 'audio' | 'video' | 'text' | 'data';
  size_bytes: number;
  url?: string;
  upload_status: 'pending' | 'uploading' | 'success' | 'error';
  upload_progress?: number;
  error_message?: string;
  created_at?: string;
  expires_at?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  type?: 'text' | 'html' | 'custom' | 'svg' | 'tool' | 'system';
  data?: any;
  attachments?: FileAttachment[];
  isStreaming?: boolean;
}

export interface ChatState {
  isOpen: boolean;
  isExpanded: boolean;
  isInitialized: boolean;
  isSending: boolean;
  messages: Message[];
  error?: string;
  pendingAttachments: FileAttachment[];
  isUploadingFiles: boolean;
  
  // New view management properties
  currentView: 'welcome' | 'conversation';
  hasStartedConversation: boolean;
  isTransitioning?: boolean;
}

export interface APIResponse {
  id: string;
  type: 'ai' | 'user';
  content: string;
}

export interface PersistenceConfig {
  enabled?: boolean;
  days?: number;
  key?: string;
}

export interface AgentMetadata {
  supported_mime_types?: string[];
  supports_attachments?: boolean;
  model_name?: string;
  model_version?: string;
  capabilities?: string[];
  max_file_size?: number;
  max_attachments?: number;
  [key: string]: any;
}

export interface ClientMetadata {
  user_id?: string | number;
  user_email_address?: string;
  device_id?: string;
  browser_language?: string;
  browser_device?: string;
  browser_timezone?: string;
  ip_address?: string;
  session_id?: string;
  user_agent?: string;
  referer_url?: string;
  page_url?: string;
  geo_location?: string;
  is_authenticated?: boolean;
  custom_tags?: Record<string, any>;
}

/**
 * Welcome card state stored in WeakMap
 */
export interface WelcomeCardState {
  originalToggleParent: HTMLElement;
  originalToggleOnClick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
  closeButtonHandler: (e: Event) => void;
  keyboardHandler: (e: KeyboardEvent) => void;
}

// types.ts
export type ChatVariant = 'inline' | 'corner' | 'centered';

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
   * Only shown if at least one prompt is provided.
   */
  messagePrompts?: {
    show: boolean;
    welcome_message: string;
    prompts: [string?, string?, string?];
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
  type: 'text' | 'html' | 'custom' | 'svg';
  data?: any;
  attachments?: FileAttachment[];
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

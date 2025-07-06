// types.ts
export type ChatVariant = 'inline' | 'corner' | 'centered';

export interface ChatTheme {
  textColor: string;
  backgroundColor: string;
  buttonColor: string;
  buttonTextColor: string;
  agentBackgroundColor: string;
  userBackgroundColor: string;
  agentForegroundColor: string;
  userForegroundColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  agentIconColor: string;
  userIconColor: string;
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
  userIcon?: string;
  agentIcon?: string;
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
  agentBackgroundColor?: string;
  userBackgroundColor?: string;
  agentForegroundColor?: string;
  userForegroundColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  agentIconColor?: string;
  userIconColor?: string;
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
  hideBranding?: boolean;
  /** Enable/disable file attachments (disabled by default) */
  enableAttachments?: boolean;
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

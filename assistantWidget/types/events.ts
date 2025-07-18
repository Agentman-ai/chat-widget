// events.ts - Event schema definitions for ChatWidget communication
import type { Message, ChatState, ChatTheme } from './types';

/**
 * Event Schema for ChatWidget Event-Driven Architecture
 * 
 * This file defines all events that can be emitted and consumed
 * within the ChatWidget ecosystem for loose coupling between components.
 */

// Base event interface
export interface BaseEvent {
  timestamp: number;
  source?: string;
}

// User interaction events
export interface UserInputEvent extends BaseEvent {
  message: string;
  source: 'welcome' | 'conversation';
  isFirstMessage?: boolean;
}

export interface PromptClickEvent extends BaseEvent {
  prompt: string;
  source: 'welcome' | 'conversation';
  isFirstMessage?: boolean;
}

export interface ToggleEvent extends BaseEvent {
  isOpen: boolean;
}

export interface ExpandEvent extends BaseEvent {
  isExpanded: boolean;
}

// Message lifecycle events
export interface MessageSentEvent extends BaseEvent {
  message: Message;
  isFirstMessage: boolean;
}

export interface MessageReceivedEvent extends BaseEvent {
  messages: Message[];
  totalCount: number;
}

export interface MessageErrorEvent extends BaseEvent {
  error: Error;
  userMessage?: string;
}

// API events
export interface ApiRequestEvent extends BaseEvent {
  endpoint: string;
  method: string;
  params: any;
}

export interface ApiResponseEvent extends BaseEvent {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: Error;
}

export interface ApiErrorEvent extends BaseEvent {
  endpoint: string;
  error: Error;
  retry?: boolean;
}

// View transition events
export interface ViewTransitionEvent extends BaseEvent {
  from: 'welcome' | 'conversation';
  to: 'welcome' | 'conversation';
  reason: 'user_input' | 'prompt_click' | 'new_conversation' | 'reset';
}

export interface ViewChangedEvent extends BaseEvent {
  currentView: 'welcome' | 'conversation';
  previousView?: 'welcome' | 'conversation';
}

// State events
export interface StateChangedEvent extends BaseEvent {
  state: ChatState;
  changes: Partial<ChatState>;
}

export interface ThemeChangedEvent extends BaseEvent {
  theme: Partial<ChatTheme>;
}

// Loading events
export interface LoadingStartedEvent extends BaseEvent {
  operation: 'message_send' | 'agent_init' | 'file_upload' | 'conversation_load';
  message?: string;
}

export interface LoadingEndedEvent extends BaseEvent {
  operation: 'message_send' | 'agent_init' | 'file_upload' | 'conversation_load';
  success: boolean;
  duration: number;
}

// File attachment events
export interface FileSelectedEvent extends BaseEvent {
  files: FileList;
}

export interface FileUploadStartedEvent extends BaseEvent {
  file: File;
  fileId: string;
}

export interface FileUploadProgressEvent extends BaseEvent {
  fileId: string;
  progress: number;
}

export interface FileUploadCompletedEvent extends BaseEvent {
  fileId: string;
  success: boolean;
  error?: string;
}

export interface AttachmentRemovedEvent extends BaseEvent {
  fileId: string;
}

// Agent events
export interface AgentInitializedEvent extends BaseEvent {
  capabilities: any;
  metadata: any;
}

export interface AgentCapabilitiesUpdatedEvent extends BaseEvent {
  capabilities: any;
}

// Error events
export interface ErrorOccurredEvent extends BaseEvent {
  error: Error;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userVisible: boolean;
}

export interface ErrorResolvedEvent extends BaseEvent {
  error: Error;
  resolution: string;
}

// Persistence events
export interface ConversationSavedEvent extends BaseEvent {
  conversationId: string;
  messageCount: number;
}

export interface ConversationLoadedEvent extends BaseEvent {
  conversationId: string;
  messages: Message[];
}

export interface ConversationClearedEvent extends BaseEvent {
  conversationId: string;
}

// Widget lifecycle events
export interface WidgetInitializedEvent extends BaseEvent {
  config: any;
  variant: string;
}

export interface WidgetDestroyedEvent extends BaseEvent {
  reason: 'user_action' | 'page_unload' | 'error' | 'programmatic';
}

export interface WidgetResizedEvent extends BaseEvent {
  width: number;
  height: number;
  isMobile: boolean;
}

// Debug events
export interface DebugEvent extends BaseEvent {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

/**
 * Event Type Registry - Maps event names to their data types
 */
export interface EventTypeRegistry {
  // User interactions
  'user:input': UserInputEvent;
  'user:prompt_click': PromptClickEvent;
  'user:toggle': ToggleEvent;
  'user:expand': ExpandEvent;

  // Message lifecycle
  'message:sent': MessageSentEvent;
  'message:received': MessageReceivedEvent;
  'message:error': MessageErrorEvent;

  // API communication
  'api:request': ApiRequestEvent;
  'api:response': ApiResponseEvent;
  'api:error': ApiErrorEvent;

  // View management
  'view:transition_start': ViewTransitionEvent;
  'view:transition_end': ViewTransitionEvent;
  'view:changed': ViewChangedEvent;

  // State management
  'state:changed': StateChangedEvent;
  'theme:changed': ThemeChangedEvent;

  // Loading states
  'loading:start': LoadingStartedEvent;
  'loading:end': LoadingEndedEvent;

  // File handling
  'file:selected': FileSelectedEvent;
  'file:upload_start': FileUploadStartedEvent;
  'file:upload_progress': FileUploadProgressEvent;
  'file:upload_complete': FileUploadCompletedEvent;
  'file:attachment_removed': AttachmentRemovedEvent;

  // Agent management
  'agent:initialized': AgentInitializedEvent;
  'agent:capabilities_updated': AgentCapabilitiesUpdatedEvent;

  // Error handling
  'error:occurred': ErrorOccurredEvent;
  'error:resolved': ErrorResolvedEvent;
  'validation:error': ErrorOccurredEvent;
  'file:error': ErrorOccurredEvent;
  'config:error': ErrorOccurredEvent;
  'storage:error': ErrorOccurredEvent;
  'error:logged': ErrorOccurredEvent;
  'error:unknown': ErrorOccurredEvent;

  // Persistence
  'conversation:saved': ConversationSavedEvent;
  'conversation:loaded': ConversationLoadedEvent;
  'conversation:cleared': ConversationClearedEvent;

  // Conversation orchestration
  'conversation:started': {
    conversationId: string;
    hasInitialMessage: boolean;
    source: string;
    timestamp: number;
  };
  'conversation:message_sent': {
    conversationId: string;
    messageCount: number;
    hasAttachments: boolean;
    source: string;
    timestamp: number;
  };
  'conversation:error': {
    conversationId: string;
    error: Error;
    operation: string;
    source: string;
    timestamp: number;
  };
  'conversation:deleted': {
    conversationId: string;
    source: string;
    timestamp: number;
  };
  'conversation:switch_requested': {
    conversationId: string;
    source: string;
    timestamp: number;
  };
  'conversation:delete_requested': {
    conversationId: string;
    source: string;
    timestamp: number;
  };
  'conversation:new_requested': {
    source: string;
    timestamp: number;
  };

  // Widget lifecycle
  'widget:initialized': WidgetInitializedEvent;
  'widget:destroyed': WidgetDestroyedEvent;
  'widget:resized': WidgetResizedEvent;

  // Debug
  'debug:log': DebugEvent;
}

/**
 * Type helper for event emission
 */
export type EventName = keyof EventTypeRegistry;
export type EventData<T extends EventName> = EventTypeRegistry[T];

/**
 * Helper to create typed events
 */
export function createEvent<T extends EventName>(
  type: T, 
  data: Omit<EventData<T>, 'timestamp'> & { source?: string }
): EventData<T> {
  return {
    ...data,
    timestamp: Date.now()
  } as EventData<T>;
}

/**
 * Event priority levels for ordering
 */
export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Event categories for filtering and debugging
 */
export enum EventCategory {
  USER_INTERACTION = 'user_interaction',
  MESSAGE_LIFECYCLE = 'message_lifecycle',
  API_COMMUNICATION = 'api_communication',
  VIEW_MANAGEMENT = 'view_management',
  STATE_MANAGEMENT = 'state_management',
  FILE_HANDLING = 'file_handling',
  AGENT_MANAGEMENT = 'agent_management',
  ERROR_HANDLING = 'error_handling',
  PERSISTENCE = 'persistence',
  WIDGET_LIFECYCLE = 'widget_lifecycle',
  DEBUG = 'debug'
}

/**
 * Event metadata for enhanced debugging and monitoring
 */
export interface EventMetadata {
  category: EventCategory;
  priority: EventPriority;
  description: string;
  examples?: string[];
}

/**
 * Registry of event metadata for documentation and tooling
 */
export const EVENT_METADATA: Record<EventName, EventMetadata> = {
  'user:input': {
    category: EventCategory.USER_INTERACTION,
    priority: EventPriority.HIGH,
    description: 'User entered text input in chat',
    examples: ['User typed a message', 'User pressed enter']
  },
  'user:prompt_click': {
    category: EventCategory.USER_INTERACTION,
    priority: EventPriority.HIGH,
    description: 'User clicked a message prompt button',
    examples: ['Clicked "Tell me about...", "Help me with..."']
  },
  'user:toggle': {
    category: EventCategory.USER_INTERACTION,
    priority: EventPriority.NORMAL,
    description: 'User toggled widget open/closed state',
    examples: ['Clicked toggle button', 'Keyboard shortcut']
  },
  'user:expand': {
    category: EventCategory.USER_INTERACTION,
    priority: EventPriority.NORMAL,
    description: 'User expanded/collapsed widget',
    examples: ['Clicked expand button', 'Double-clicked header']
  },
  'message:sent': {
    category: EventCategory.MESSAGE_LIFECYCLE,
    priority: EventPriority.HIGH,
    description: 'User message was sent to API',
    examples: ['Message submitted successfully']
  },
  'message:received': {
    category: EventCategory.MESSAGE_LIFECYCLE,
    priority: EventPriority.HIGH,
    description: 'Agent response received from API',
    examples: ['API returned agent messages']
  },
  'message:error': {
    category: EventCategory.MESSAGE_LIFECYCLE,
    priority: EventPriority.HIGH,
    description: 'Error occurred during message processing',
    examples: ['API error', 'Network failure', 'Validation error']
  },
  'api:request': {
    category: EventCategory.API_COMMUNICATION,
    priority: EventPriority.NORMAL,
    description: 'API request initiated',
    examples: ['POST to agent endpoint', 'File upload request']
  },
  'api:response': {
    category: EventCategory.API_COMMUNICATION,
    priority: EventPriority.NORMAL,
    description: 'API response received',
    examples: ['Successful response', 'Error response']
  },
  'api:error': {
    category: EventCategory.API_COMMUNICATION,
    priority: EventPriority.HIGH,
    description: 'API request failed',
    examples: ['Network error', 'HTTP error', 'Timeout']
  },
  'view:transition_start': {
    category: EventCategory.VIEW_MANAGEMENT,
    priority: EventPriority.NORMAL,
    description: 'View transition animation started',
    examples: ['Welcome to conversation', 'Conversation to welcome']
  },
  'view:transition_end': {
    category: EventCategory.VIEW_MANAGEMENT,
    priority: EventPriority.NORMAL,
    description: 'View transition animation completed',
    examples: ['Transition finished', 'View fully loaded']
  },
  'view:changed': {
    category: EventCategory.VIEW_MANAGEMENT,
    priority: EventPriority.NORMAL,
    description: 'Active view changed',
    examples: ['Now showing conversation', 'Now showing welcome']
  },
  'state:changed': {
    category: EventCategory.STATE_MANAGEMENT,
    priority: EventPriority.NORMAL,
    description: 'Widget state updated',
    examples: ['Open state changed', 'Messages updated']
  },
  'theme:changed': {
    category: EventCategory.STATE_MANAGEMENT,
    priority: EventPriority.LOW,
    description: 'Widget theme updated',
    examples: ['Color scheme changed', 'Dark mode toggled']
  },
  'loading:start': {
    category: EventCategory.STATE_MANAGEMENT,
    priority: EventPriority.NORMAL,
    description: 'Loading operation started',
    examples: ['Message sending', 'Agent initialization']
  },
  'loading:end': {
    category: EventCategory.STATE_MANAGEMENT,
    priority: EventPriority.NORMAL,
    description: 'Loading operation completed',
    examples: ['Message sent successfully', 'Agent initialized']
  },
  'file:selected': {
    category: EventCategory.FILE_HANDLING,
    priority: EventPriority.NORMAL,
    description: 'User selected files for attachment',
    examples: ['File picker used', 'Drag and drop']
  },
  'file:upload_start': {
    category: EventCategory.FILE_HANDLING,
    priority: EventPriority.NORMAL,
    description: 'File upload initiated',
    examples: ['Upload to agent API started']
  },
  'file:upload_progress': {
    category: EventCategory.FILE_HANDLING,
    priority: EventPriority.LOW,
    description: 'File upload progress update',
    examples: ['50% uploaded', '90% uploaded']
  },
  'file:upload_complete': {
    category: EventCategory.FILE_HANDLING,
    priority: EventPriority.NORMAL,
    description: 'File upload finished',
    examples: ['Upload successful', 'Upload failed']
  },
  'file:attachment_removed': {
    category: EventCategory.FILE_HANDLING,
    priority: EventPriority.NORMAL,
    description: 'File attachment removed by user',
    examples: ['User clicked remove button']
  },
  'agent:initialized': {
    category: EventCategory.AGENT_MANAGEMENT,
    priority: EventPriority.HIGH,
    description: 'Agent successfully initialized',
    examples: ['First API call completed', 'Capabilities loaded']
  },
  'agent:capabilities_updated': {
    category: EventCategory.AGENT_MANAGEMENT,
    priority: EventPriority.NORMAL,
    description: 'Agent capabilities were updated',
    examples: ['New file types supported', 'Features enabled']
  },
  'error:occurred': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.HIGH,
    description: 'An error occurred in the widget',
    examples: ['API error', 'Validation error', 'UI error']
  },
  'error:resolved': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.NORMAL,
    description: 'A previous error was resolved',
    examples: ['Retry succeeded', 'Error condition cleared']
  },
  'validation:error': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.NORMAL,
    description: 'Validation error occurred',
    examples: ['Invalid input', 'Field validation failed']
  },
  'file:error': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.HIGH,
    description: 'File handling error occurred',
    examples: ['File too large', 'Invalid file type']
  },
  'config:error': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.HIGH,
    description: 'Configuration error occurred',
    examples: ['Invalid config', 'Missing required field']
  },
  'storage:error': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.NORMAL,
    description: 'Storage operation failed',
    examples: ['localStorage full', 'Save failed']
  },
  'error:logged': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.LOW,
    description: 'Error logged for debugging',
    examples: ['Non-critical error', 'Debug information']
  },
  'error:unknown': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.NORMAL,
    description: 'Unknown error occurred',
    examples: ['Unhandled exception', 'Unexpected error']
  },
  'conversation:saved': {
    category: EventCategory.PERSISTENCE,
    priority: EventPriority.LOW,
    description: 'Conversation saved to storage',
    examples: ['Auto-save triggered', 'Manual save']
  },
  'conversation:loaded': {
    category: EventCategory.PERSISTENCE,
    priority: EventPriority.NORMAL,
    description: 'Conversation loaded from storage',
    examples: ['Page reload', 'Conversation switch']
  },
  'conversation:cleared': {
    category: EventCategory.PERSISTENCE,
    priority: EventPriority.NORMAL,
    description: 'Conversation history cleared',
    examples: ['User reset', 'New conversation']
  },
  'widget:initialized': {
    category: EventCategory.WIDGET_LIFECYCLE,
    priority: EventPriority.HIGH,
    description: 'Widget initialization completed',
    examples: ['Widget ready for use']
  },
  'widget:destroyed': {
    category: EventCategory.WIDGET_LIFECYCLE,
    priority: EventPriority.NORMAL,
    description: 'Widget was destroyed and cleaned up',
    examples: ['Page unload', 'Programmatic destroy']
  },
  'widget:resized': {
    category: EventCategory.WIDGET_LIFECYCLE,
    priority: EventPriority.LOW,
    description: 'Widget size changed',
    examples: ['Window resize', 'Mobile orientation change']
  },
  'debug:log': {
    category: EventCategory.DEBUG,
    priority: EventPriority.LOW,
    description: 'Debug information logged',
    examples: ['Debug message', 'Performance timing']
  },
  'conversation:started': {
    category: EventCategory.PERSISTENCE,
    priority: EventPriority.HIGH,
    description: 'New conversation started',
    examples: ['User initiated conversation', 'Auto-started with message']
  },
  'conversation:message_sent': {
    category: EventCategory.MESSAGE_LIFECYCLE,
    priority: EventPriority.NORMAL,
    description: 'Message sent in conversation context',
    examples: ['User message processed', 'Prompt response sent']
  },
  'conversation:error': {
    category: EventCategory.ERROR_HANDLING,
    priority: EventPriority.HIGH,
    description: 'Error occurred in conversation flow',
    examples: ['Message send failed', 'Conversation load error']
  },
  'conversation:deleted': {
    category: EventCategory.PERSISTENCE,
    priority: EventPriority.NORMAL,
    description: 'Conversation was deleted',
    examples: ['User deleted conversation', 'Auto-cleanup']
  },
  'conversation:switch_requested': {
    category: EventCategory.USER_INTERACTION,
    priority: EventPriority.HIGH,
    description: 'User requested to switch conversations',
    examples: ['Clicked conversation in list', 'Keyboard shortcut']
  },
  'conversation:delete_requested': {
    category: EventCategory.USER_INTERACTION,
    priority: EventPriority.NORMAL,
    description: 'User requested to delete conversation',
    examples: ['Clicked delete button', 'Context menu action']
  },
  'conversation:new_requested': {
    category: EventCategory.USER_INTERACTION,
    priority: EventPriority.HIGH,
    description: 'User requested new conversation',
    examples: ['Clicked new conversation button', 'Keyboard shortcut']
  }
};
// constants.ts - Application constants to replace magic numbers
export const UI_CONSTANTS = {
  // Layout dimensions
  HEADER_HEIGHT: 54,
  INPUT_MIN_HEIGHT: 32,
  INPUT_MAX_HEIGHT: 120,
  TOGGLE_BUTTON_SIZE: 56,
  AVATAR_SIZE: 32,
  ICON_SIZE: 18,
  
  // Responsive breakpoints
  MOBILE_BREAKPOINT: 480,
  TABLET_BREAKPOINT: 768,
  DESKTOP_BREAKPOINT: 1024,
  
  // Animation durations (ms)
  TRANSITION_FAST: 150,
  TRANSITION_NORMAL: 300,
  TRANSITION_SLOW: 500,
  
  // Debounce delays (ms)
  RESIZE_DEBOUNCE: 100,
  INPUT_DEBOUNCE: 200,
  SEARCH_DEBOUNCE: 300,
  
  // Message limits
  MAX_MESSAGE_LENGTH: 4000,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ATTACHMENTS: 5,
  
  // UI spacing
  BUTTON_GAP: 2,
  CONTENT_PADDING: 16,
  SMALL_PADDING: 8,
  LARGE_PADDING: 24,
  
  // Timeouts
  LOADING_TIMEOUT: 30000, // 30 seconds
  PROMPT_DELAY: 200,
  ANIMATION_DELAY: 100,
  
  // Colors (as fallbacks)
  PRIMARY_COLOR: '#2563eb',
  SUCCESS_COLOR: '#10b981',
  ERROR_COLOR: '#ef4444',
  WARNING_COLOR: '#f59e0b',
  MUTED_COLOR: '#6b7280',
  
  // Z-index layers
  Z_INDEX_TOGGLE: 1000,
  Z_INDEX_WIDGET: 1001,
  Z_INDEX_MODAL: 1002,
  Z_INDEX_TOOLTIP: 1003,
} as const;

export const API_CONSTANTS = {
  // Endpoints
  CAPABILITIES_ENDPOINT: '/api/agent/capabilities',
  
  // Request timeouts
  DEFAULT_TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 120000,
  STREAM_TIMEOUT: 60000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_BACKOFF: 2,
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  RATE_LIMIT_WINDOW: 60000,
  
  // Response size limits
  MAX_RESPONSE_SIZE: 1024 * 1024, // 1MB
  MAX_JSON_SIZE: 512 * 1024, // 512KB
} as const;

export const STORAGE_CONSTANTS = {
  // LocalStorage keys
  CONVERSATIONS_KEY: 'am_conversations',
  THEME_KEY: 'am_theme',
  SETTINGS_KEY: 'am_settings',
  
  // Storage limits
  MAX_CONVERSATIONS: 100,
  MAX_MESSAGES_PER_CONVERSATION: 1000,
  STORAGE_CLEANUP_THRESHOLD: 80, // percentage
  
  // TTL (time to live) in milliseconds
  CONVERSATION_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const VALIDATION_CONSTANTS = {
  // Input validation
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 4000,
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  
  // File validation
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/json'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // URL validation
  URL_REGEX: /^https?:\/\/.+/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Type exports for better TypeScript support
export type UIConstants = typeof UI_CONSTANTS;
export type APIConstants = typeof API_CONSTANTS;
export type StorageConstants = typeof STORAGE_CONSTANTS;
export type ValidationConstants = typeof VALIDATION_CONSTANTS;
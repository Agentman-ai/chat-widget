// persistence-types.ts - Types for persistence operations

export type PersistenceErrorType = 
  | 'QUOTA_EXCEEDED'
  | 'INVALID_STATE'
  | 'PARSE_ERROR'
  | 'ACCESS_DENIED'
  | 'UNKNOWN_ERROR';

export interface PersistenceError {
  type: PersistenceErrorType;
  message: string;
  originalError?: Error;
  recoverable: boolean;
}

export interface PersistenceResult<T = void> {
  success: boolean;
  data?: T;
  error?: PersistenceError;
}

export interface StorageInfo {
  used: number;
  available?: number;
  quota?: number;
  percentUsed?: number;
}

// Callback for persistence events
export type PersistenceEventCallback = (event: PersistenceEvent) => void;

export interface PersistenceEvent {
  type: 'save_failed' | 'load_failed' | 'quota_warning' | 'corrupted_data';
  error?: PersistenceError;
  details?: any;
}
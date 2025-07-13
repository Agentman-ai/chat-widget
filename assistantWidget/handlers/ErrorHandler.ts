// ErrorHandler.ts - Centralized error handling and user feedback
import type { Message } from '../types/types';
import { MessageService } from '../services/MessageService';
import { Logger } from '../utils/logger';
import type { EventBus } from '../utils/EventBus';
import { createEvent } from '../types/events';

/**
 * ErrorHandler - Centralized error handling and user feedback
 * 
 * This class provides:
 * - Consistent error messaging and formatting
 * - Different error types (API, validation, network, etc.)
 * - User-friendly error messages
 * - Integration with EventBus for error events
 * - Recovery suggestions where applicable
 */
export class ErrorHandler {
  private logger: Logger;
  private messageService: MessageService;
  private eventBus: EventBus;

  constructor(
    messageService: MessageService,
    eventBus: EventBus,
    debug: boolean = false
  ) {
    this.logger = new Logger(debug, '[ErrorHandler]');
    this.messageService = messageService;
    this.eventBus = eventBus;
  }

  /**
   * Handle API errors with appropriate user feedback
   */
  public handleApiError(
    error: Error,
    endpoint?: string,
    context?: string
  ): Message {
    this.logger.error('API Error:', { error, endpoint, context });

    // Determine error type and create appropriate message
    let userMessage: string;
    let errorType: 'network' | 'server' | 'auth' | 'rate_limit' | 'unknown' = 'unknown';

    if (error.message.includes('fetch')) {
      errorType = 'network';
      userMessage = 'Network connection failed. Please check your internet connection and try again.';
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
      errorType = 'auth';
      userMessage = 'Authentication failed. Please refresh the page and try again.';
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorType = 'rate_limit';
      userMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      errorType = 'server';
      userMessage = 'Server error occurred. Please try again in a few moments.';
    } else {
      userMessage = 'An unexpected error occurred. Please try again.';
    }

    // Emit error event for telemetry/logging
    this.eventBus.emit('api:error', createEvent('api:error', {
      error,
      endpoint: endpoint || 'unknown',
      source: 'ErrorHandler'
    }));

    // Create user-facing error message
    return this.messageService.createErrorMessage(userMessage);
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(
    field: string,
    value: any,
    constraint: string
  ): Message {
    this.logger.warn('Validation Error:', { field, value, constraint });

    let userMessage: string;
    
    switch (constraint) {
      case 'required':
        userMessage = `${field} is required.`;
        break;
      case 'min_length':
        userMessage = `${field} is too short.`;
        break;
      case 'max_length':
        userMessage = `${field} is too long.`;
        break;
      case 'format':
        userMessage = `${field} format is invalid.`;
        break;
      default:
        userMessage = `Invalid ${field}.`;
    }

    // Emit validation error event
    this.eventBus.emit('validation:error', createEvent('validation:error', {
      error: new Error(`Invalid ${field}: ${constraint}`),
      context: `${field} validation`,
      severity: 'medium',
      userVisible: true,
      source: 'ErrorHandler'
    }));

    return this.messageService.createErrorMessage(userMessage);
  }

  /**
   * Handle file upload errors
   */
  public handleFileError(
    fileName: string,
    error: 'size' | 'type' | 'upload' | 'network',
    details?: { maxSize?: number; allowedTypes?: string[] }
  ): Message {
    this.logger.warn('File Error:', { fileName, error, details });

    let userMessage: string;

    switch (error) {
      case 'size':
        const maxSizeMB = details?.maxSize ? Math.round(details.maxSize / 1024 / 1024) : 10;
        userMessage = `File "${fileName}" is too large. Maximum size is ${maxSizeMB}MB.`;
        break;
      case 'type':
        const allowedTypes = details?.allowedTypes?.join(', ') || 'supported file types';
        userMessage = `File "${fileName}" type is not supported. Allowed types: ${allowedTypes}.`;
        break;
      case 'upload':
        userMessage = `Failed to upload "${fileName}". Please try again.`;
        break;
      case 'network':
        userMessage = `Network error while uploading "${fileName}". Please check your connection.`;
        break;
      default:
        userMessage = `Error processing file "${fileName}".`;
    }

    // Emit file error event
    this.eventBus.emit('file:error', createEvent('file:error', {
      error: new Error(`File error: ${error} for ${fileName}`),
      context: `file ${error}`,
      severity: 'medium',
      userVisible: true,
      source: 'ErrorHandler'
    }));

    return this.messageService.createErrorMessage(userMessage);
  }

  /**
   * Handle general application errors
   */
  public handleApplicationError(
    operation: string,
    error: Error,
    recoverable: boolean = true
  ): Message {
    this.logger.error('Application Error:', { operation, error, recoverable });

    let userMessage: string;

    if (recoverable) {
      userMessage = `Error during ${operation}. Please try again.`;
    } else {
      userMessage = `Critical error during ${operation}. Please refresh the page.`;
    }

    // Emit application error event
    this.eventBus.emit('error:occurred', createEvent('error:occurred', {
      error,
      context: operation,
      severity: recoverable ? 'medium' : 'high',
      userVisible: true,
      source: 'ErrorHandler'
    }));

    return this.messageService.createErrorMessage(userMessage);
  }

  /**
   * Handle configuration errors
   */
  public handleConfigurationError(
    configKey: string,
    expectedType: string,
    actualValue: any
  ): void {
    this.logger.error('Configuration Error:', { configKey, expectedType, actualValue });

    // Configuration errors are not user-visible but should be logged
    this.eventBus.emit('config:error', createEvent('config:error', {
      error: new Error(`Config error: ${configKey} expected ${expectedType}, got ${typeof actualValue}`),
      context: `config validation for ${configKey}`,
      severity: 'high',
      userVisible: false,
      source: 'ErrorHandler'
    }));
  }

  /**
   * Handle persistence/storage errors
   */
  public handleStorageError(
    operation: 'save' | 'load' | 'delete',
    error: Error,
    storageKey?: string
  ): Message {
    this.logger.error('Storage Error:', { operation, error, storageKey });

    let userMessage: string;

    switch (operation) {
      case 'save':
        if (error.message.includes('quota')) {
          userMessage = 'Storage space is full. Please clear some chat history to continue.';
        } else {
          userMessage = 'Failed to save conversation. Your message was sent but may not be saved.';
        }
        break;
      case 'load':
        userMessage = 'Failed to load conversation history. Please refresh the page.';
        break;
      case 'delete':
        userMessage = 'Failed to delete conversation. Please try again.';
        break;
      default:
        userMessage = 'Storage error occurred. Some data may not be saved.';
    }

    // Emit storage error event
    this.eventBus.emit('storage:error', createEvent('storage:error', {
      error,
      context: `storage ${operation}`,
      severity: 'medium',
      userVisible: true,
      source: 'ErrorHandler'
    }));

    return this.messageService.createErrorMessage(userMessage);
  }

  /**
   * Create a user-friendly error message for display
   */
  public createUserErrorMessage(content: string): Message {
    return this.messageService.createErrorMessage(content);
  }

  /**
   * Log error for debugging without user notification
   */
  public logError(
    context: string,
    error: Error,
    additionalData?: Record<string, any>
  ): void {
    this.logger.error(`[${context}]`, { error, ...additionalData });

    // Emit for telemetry but not user-visible
    this.eventBus.emit('error:logged', createEvent('error:logged', {
      error,
      context,
      severity: 'low',
      userVisible: false,
      source: 'ErrorHandler'
    }));
  }

  /**
   * Handle unknown/unexpected errors with fallback behavior
   */
  public handleUnknownError(
    error: unknown,
    context: string = 'unknown',
    showToUser: boolean = true
  ): Message | null {
    const errorObj = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'Unknown error');

    this.logger.error('Unknown Error:', { error: errorObj, context });

    if (showToUser) {
      return this.messageService.createErrorMessage(
        'An unexpected error occurred. Please try again or refresh the page.'
      );
    }

    // Just log the error
    this.eventBus.emit('error:unknown', createEvent('error:unknown', {
      error: errorObj,
      context,
      severity: 'medium',
      userVisible: false,
      source: 'ErrorHandler'
    }));

    return null;
  }

  /**
   * Get recovery suggestions for different error types
   */
  public getRecoverySuggestions(errorType: string): string[] {
    switch (errorType) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ];
      case 'auth':
        return [
          'Refresh the page to re-authenticate',
          'Clear browser cache and cookies',
          'Contact support if the problem persists'
        ];
      case 'storage':
        return [
          'Clear some chat history to free up space',
          'Enable cookies and local storage',
          'Try using a different browser'
        ];
      case 'file':
        return [
          'Check file size and format',
          'Try a different file',
          'Ensure stable internet connection'
        ];
      default:
        return [
          'Try again',
          'Refresh the page',
          'Contact support if the problem continues'
        ];
    }
  }
}
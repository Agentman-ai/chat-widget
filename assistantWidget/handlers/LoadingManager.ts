// LoadingManager.ts - Centralized loading state management
import type { ViewManager } from '../components/ViewManager';
import type { EventBus } from '../utils/EventBus';
import { Logger } from '../utils/logger';
import { createEvent } from '../types/events';

/**
 * Configuration options for LoadingManager
 */
export interface LoadingManagerConfig {
  debug?: boolean;
  defaultTimeout?: number;
  allowContinueAfterTimeout?: boolean;
}

/**
 * LoadingManager - Manages loading states and indicators
 * 
 * This handler manages:
 * - Loading indicator display
 * - Multiple concurrent loading operations
 * - Loading timeout handling
 * - Progress tracking for file uploads
 * - Loading state events
 */
export class LoadingManager {
  private logger: Logger;
  private activeLoadingOperations: Set<string> = new Set();
  private loadingTimeouts: Map<string, number> = new Map();
  private loadingStartTimes: Map<string, number> = new Map();
  private config: LoadingManagerConfig;

  constructor(
    private viewManager: ViewManager,
    private eventBus: EventBus,
    config: LoadingManagerConfig | boolean = {}
  ) {
    // Handle backward compatibility where third param was just debug boolean
    if (typeof config === 'boolean') {
      this.config = { debug: config };
    } else {
      this.config = {
        debug: false,
        defaultTimeout: 30000,
        allowContinueAfterTimeout: true,
        ...config
      };
    }
    
    this.logger = new Logger(this.config.debug || false, '[LoadingManager]');
  }

  /**
   * Start a loading operation
   */
  public startLoading(
    operation: 'message_send' | 'agent_init' | 'file_upload' | 'conversation_load',
    options: {
      timeout?: number;
      message?: string;
      showIndicator?: boolean;
      allowContinueAfterTimeout?: boolean;
    } = {}
  ): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { 
      timeout = this.config.defaultTimeout || 30000, 
      message, 
      showIndicator = true,
      allowContinueAfterTimeout = this.config.allowContinueAfterTimeout
    } = options;

    this.logger.debug(`Starting loading operation: ${operation} (${operationId})`);

    // Track operation
    this.activeLoadingOperations.add(operationId);
    this.loadingStartTimes.set(operationId, Date.now());

    // Show visual indicator if requested
    if (showIndicator) {
      this.showLoadingIndicator(operation, message);
    }

    // Set timeout if specified
    if (timeout > 0) {
      const timeoutId = window.setTimeout(() => {
        this.handleLoadingTimeout(operationId, operation, allowContinueAfterTimeout);
      }, timeout);
      this.loadingTimeouts.set(operationId, timeoutId);
    }

    // Emit loading start event
    this.eventBus.emit('loading:start', createEvent('loading:start', {
      operation,
      message,
      source: 'LoadingManager'
    }));

    return operationId;
  }

  /**
   * Complete a loading operation
   */
  public completeLoading(
    operationId: string,
    success: boolean = true,
    error?: Error
  ): void {
    if (!this.activeLoadingOperations.has(operationId)) {
      this.logger.warn(`Attempted to complete unknown loading operation: ${operationId}`);
      return;
    }

    this.logger.debug(`Completing loading operation: ${operationId} (success: ${success})`);

    // Calculate duration
    const startTime = this.loadingStartTimes.get(operationId) || Date.now();
    const duration = Date.now() - startTime;

    // Clear timeout
    const timeoutId = this.loadingTimeouts.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.loadingTimeouts.delete(operationId);
    }

    // Remove from active operations
    this.activeLoadingOperations.delete(operationId);
    this.loadingStartTimes.delete(operationId);

    // Hide indicator if no more loading operations
    if (this.activeLoadingOperations.size === 0) {
      this.hideLoadingIndicator();
    }

    // Emit loading end event
    this.eventBus.emit('loading:end', createEvent('loading:end', {
      operation: this.getOperationFromId(operationId),
      success,
      duration,
      source: 'LoadingManager'
    }));

    // Emit error if operation failed
    if (!success && error) {
      this.eventBus.emit('error:occurred', createEvent('error:occurred', {
        error,
        context: `Loading operation ${operationId}`,
        severity: 'medium',
        userVisible: false,
        source: 'LoadingManager'
      }));
    }
  }

  /**
   * Check if any loading operations are active
   */
  public isLoading(): boolean {
    return this.activeLoadingOperations.size > 0;
  }

  /**
   * Check if a specific operation type is loading
   */
  public isOperationLoading(operation: string): boolean {
    return Array.from(this.activeLoadingOperations).some(id => id.startsWith(operation));
  }

  /**
   * Get all active loading operations
   */
  public getActiveOperations(): string[] {
    return Array.from(this.activeLoadingOperations);
  }

  /**
   * Cancel a specific loading operation
   */
  public cancelLoading(operationId: string): void {
    if (!this.activeLoadingOperations.has(operationId)) {
      return;
    }

    this.logger.debug(`Cancelling loading operation: ${operationId}`);
    this.completeLoading(operationId, false, new Error('Operation cancelled'));
  }

  /**
   * Cancel all loading operations
   */
  public cancelAllLoading(): void {
    this.logger.debug('Cancelling all loading operations');
    
    const operations = Array.from(this.activeLoadingOperations);
    for (const operationId of operations) {
      this.cancelLoading(operationId);
    }
  }

  /**
   * Update loading progress (for file uploads, etc.)
   */
  public updateProgress(
    operationId: string,
    progress: number,
    message?: string
  ): void {
    if (!this.activeLoadingOperations.has(operationId)) {
      return;
    }

    this.logger.debug(`Progress update for ${operationId}: ${progress}%`);

    // Update UI if there's a progress indicator
    this.updateLoadingProgress(progress, message);

    // Emit progress event for file uploads
    if (operationId.includes('file_upload')) {
      this.eventBus.emit('file:upload_progress', createEvent('file:upload_progress', {
        fileId: operationId,
        progress,
        source: 'LoadingManager'
      }));
    }
  }

  /**
   * Set a custom loading message
   */
  public setLoadingMessage(message: string): void {
    this.updateLoadingMessage(message);
  }

  /**
   * Show loading indicator in the UI
   */
  private showLoadingIndicator(
    operation: string,
    message?: string
  ): void {
    // Delegate to ViewManager for UI updates
    this.viewManager?.showLoadingIndicator();
    
    if (message) {
      this.updateLoadingMessage(message);
    }
  }

  /**
   * Hide loading indicator in the UI
   */
  private hideLoadingIndicator(): void {
    // Delegate to ViewManager for UI updates
    this.viewManager?.hideLoadingIndicator();
  }

  /**
   * Update loading progress in the UI
   */
  private updateLoadingProgress(progress: number, message?: string): void {
    // This could be extended to show progress bars
    // For now, just update the message if provided
    if (message) {
      this.updateLoadingMessage(message);
    }
  }

  /**
   * Update loading message in the UI
   */
  private updateLoadingMessage(message: string): void {
    // This would update a loading message in the UI
    // Implementation depends on UI structure
    this.logger.debug(`Loading message: ${message}`);
  }

  /**
   * Handle loading timeout
   * @param operationId - The operation ID
   * @param operation - The type of operation
   * @param allowContinue - Whether to allow the operation to continue after timeout
   */
  private handleLoadingTimeout(
    operationId: string, 
    operation: string,
    allowContinue: boolean = true
  ): void {
    if (allowContinue) {
      // Only log warning, don't complete the loading operation
      // This allows streaming to continue even after timeout
      this.logger.warn(`Loading timeout reached for operation: ${operationId}, but allowing to continue`);
      
      // Remove the timeout but keep the operation active
      this.loadingTimeouts.delete(operationId);
      
      // Emit timeout event but don't complete
      this.eventBus.emit('loading:timeout', createEvent('loading:timeout', {
        operationId,
        operation,
        allowedToContinue: true,
        source: 'LoadingManager'
      }));
    } else {
      // Complete the operation with timeout error
      this.logger.error(`Loading timeout reached for operation: ${operationId}, terminating`);
      this.completeLoading(operationId, false, new Error('Operation timed out'));
      
      // Emit timeout event
      this.eventBus.emit('loading:timeout', createEvent('loading:timeout', {
        operationId,
        operation,
        allowedToContinue: false,
        source: 'LoadingManager'
      }));
    }
  }

  /**
   * Extract operation type from operation ID
   */
  private getOperationFromId(operationId: string): 'message_send' | 'agent_init' | 'file_upload' | 'conversation_load' {
    if (operationId.startsWith('message_send')) return 'message_send';
    if (operationId.startsWith('agent_init')) return 'agent_init';
    if (operationId.startsWith('file_upload')) return 'file_upload';
    if (operationId.startsWith('conversation_load')) return 'conversation_load';
    return 'message_send'; // Default fallback
  }

  /**
   * Get loading statistics
   */
  public getLoadingStats(): {
    activeCount: number;
    operations: { id: string; duration: number; operation: string }[];
  } {
    const now = Date.now();
    const operations = Array.from(this.activeLoadingOperations).map(id => ({
      id,
      duration: now - (this.loadingStartTimes.get(id) || now),
      operation: this.getOperationFromId(id)
    }));

    return {
      activeCount: this.activeLoadingOperations.size,
      operations
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.logger.debug('Destroying LoadingManager');
    
    // Cancel all active operations
    this.cancelAllLoading();
    
    // Clear all timeouts
    this.loadingTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    
    // Clear all maps and sets
    this.activeLoadingOperations.clear();
    this.loadingTimeouts.clear();
    this.loadingStartTimes.clear();
  }
}
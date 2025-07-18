// EventBus.ts - Centralized event management for component communication
import { Logger } from './logger';

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe(): void;
}

/**
 * EventBus - Centralized event system for decoupled component communication
 * 
 * Features:
 * - Type-safe event handling
 * - Async event support
 * - Automatic cleanup
 * - Debug logging
 * - Event history tracking
 */
export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private logger: Logger;
  private eventHistory: Array<{ event: string; timestamp: number; data?: any }> = [];
  private maxHistorySize: number = 100;

  constructor(debug?: boolean | import('../types/types').DebugConfig) {
    this.logger = new Logger(debug || false, '[EventBus]');
  }

  /**
   * Emit an event to all registered listeners
   */
  emit<T = any>(event: string, data?: T): void {
    this.logger.debug(`📢 Emitting event: ${event}`, data);
    
    // Add to history
    this.addToHistory(event, data);
    
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      this.logger.debug(`👂 No listeners for event: ${event}`);
      return;
    }

    this.logger.debug(`👂 Notifying ${eventListeners.size} listeners for event: ${event}`);
    
    // Execute all listeners
    eventListeners.forEach(async (handler) => {
      try {
        await handler(data);
      } catch (error) {
        this.logger.error(`❌ Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Register an event listener
   */
  on<T = any>(event: string, handler: EventHandler<T>): EventSubscription {
    this.logger.debug(`🎧 Registering listener for event: ${event}`);
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(handler);
    
    // Return subscription object for cleanup
    return {
      unsubscribe: () => {
        this.off(event, handler);
      }
    };
  }

  /**
   * Remove an event listener
   */
  off<T = any>(event: string, handler: EventHandler<T>): void {
    this.logger.debug(`🔇 Removing listener for event: ${event}`);
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(handler);
      
      // Clean up empty event sets
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.logger.debug(`🗑️ Removing all listeners for event: ${event}`);
      this.listeners.delete(event);
    } else {
      this.logger.debug('🗑️ Removing all event listeners');
      this.listeners.clear();
    }
  }

  /**
   * Get number of listeners for an event
   */
  getListenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }

  /**
   * Get all registered events
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if an event has listeners
   */
  hasListeners(event: string): boolean {
    return this.getListenerCount(event) > 0;
  }

  /**
   * Get recent event history for debugging
   */
  getEventHistory(limit: number = 20): Array<{ event: string; timestamp: number; data?: any }> {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Add event to history for debugging
   */
  private addToHistory(event: string, data?: any): void {
    this.eventHistory.push({
      event,
      timestamp: Date.now(),
      data: this.shouldLogData(data) ? data : '[Data not logged]'
    });

    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Determine if data should be logged (avoid logging sensitive info)
   */
  private shouldLogData(data: any): boolean {
    if (!data) return true;
    
    // Don't log large objects or potential sensitive data
    if (typeof data === 'object') {
      const str = JSON.stringify(data);
      if (str.length > 200) return false;
      if (str.toLowerCase().includes('token') || str.toLowerCase().includes('password')) return false;
    }
    
    return true;
  }

  /**
   * Create a namespaced event bus (useful for components)
   */
  createNamespace(namespace: string): NamespacedEventBus {
    return new NamespacedEventBus(this, namespace);
  }

  /**
   * Wait for a specific event to be emitted
   */
  waitForEvent<T = any>(event: string, timeout: number = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler);
        reject(new Error(`Event '${event}' timeout after ${timeout}ms`));
      }, timeout);

      const handler = (data: T) => {
        clearTimeout(timer);
        this.off(event, handler);
        resolve(data);
      };

      this.on(event, handler);
    });
  }

  /**
   * Emit event and wait for response
   */
  async request<TRequest = any, TResponse = any>(
    requestEvent: string, 
    responseEvent: string, 
    data?: TRequest, 
    timeout: number = 5000
  ): Promise<TResponse> {
    // Set up response listener first
    const responsePromise = this.waitForEvent<TResponse>(responseEvent, timeout);
    
    // Emit request
    this.emit(requestEvent, data);
    
    return responsePromise;
  }

  /**
   * Get debug information
   */
  getDebugInfo(): { 
    totalEvents: number; 
    totalListeners: number; 
    events: Array<{ event: string; listenerCount: number }>;
    recentHistory: Array<{ event: string; timestamp: number }>;
  } {
    const events = Array.from(this.listeners.entries()).map(([event, listeners]) => ({
      event,
      listenerCount: listeners.size
    }));

    return {
      totalEvents: this.listeners.size,
      totalListeners: events.reduce((sum, e) => sum + e.listenerCount, 0),
      events,
      recentHistory: this.getEventHistory(10).map(h => ({ event: h.event, timestamp: h.timestamp }))
    };
  }
}

/**
 * Namespaced EventBus for component-specific events
 */
class NamespacedEventBus {
  constructor(private eventBus: EventBus, private namespace: string) {}

  emit<T = any>(event: string, data?: T): void {
    this.eventBus.emit(`${this.namespace}:${event}`, data);
  }

  on<T = any>(event: string, handler: EventHandler<T>): EventSubscription {
    return this.eventBus.on(`${this.namespace}:${event}`, handler);
  }

  off<T = any>(event: string, handler: EventHandler<T>): void {
    this.eventBus.off(`${this.namespace}:${event}`, handler);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.eventBus.removeAllListeners(`${this.namespace}:${event}`);
    } else {
      // Remove all namespaced events
      const events = this.eventBus.getRegisteredEvents();
      events.forEach(e => {
        if (e.startsWith(`${this.namespace}:`)) {
          this.eventBus.removeAllListeners(e);
        }
      });
    }
  }
}

// Singleton instance for global use
export const globalEventBus = new EventBus();
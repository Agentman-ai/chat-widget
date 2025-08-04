// UnifiedLoadingManager.ts - Centralized loading state management to prevent conflicts
import type { EventBus } from '../utils/EventBus';
import { Logger } from '../utils/logger';
import { createEvent } from '../types/events';

/**
 * Loading state types
 */
export enum LoadingType {
  NONE = 'none',
  INITIAL = 'initial',      // Wave loading indicator (5 dots)
  STREAMING = 'streaming'   // Streaming dots indicator (●●●)
}

/**
 * Unified loading state configuration
 */
export interface UnifiedLoadingConfig {
  debug?: boolean;
  transitionDelay?: number; // Optional delay between transitions
}

/**
 * UnifiedLoadingManager - Manages loading states to prevent multiple indicators
 * 
 * This manager ensures only one loading indicator is shown at a time by:
 * - Tracking the current loading state
 * - Validating state transitions
 * - Coordinating with UI components
 * - Emitting events for state changes
 */
export class UnifiedLoadingManager {
  private logger: Logger;
  private currentState: LoadingType = LoadingType.NONE;
  private config: UnifiedLoadingConfig;
  private transitionTimeout: number | null = null;
  
  constructor(
    private eventBus: EventBus,
    config: UnifiedLoadingConfig = {}
  ) {
    this.config = {
      debug: false,
      transitionDelay: 0,
      ...config
    };
    this.logger = new Logger(this.config.debug || false, '[UnifiedLoadingManager]');
  }
  
  /**
   * Get the current loading state
   */
  public getLoadingState(): LoadingType {
    return this.currentState;
  }
  
  /**
   * Set the loading state with validation
   */
  public setLoadingState(newState: LoadingType): boolean {
    if (!this.isValidTransition(this.currentState, newState)) {
      this.logger.warn(`Invalid state transition: ${this.currentState} → ${newState}`);
      return false;
    }
    
    const oldState = this.currentState;
    
    // Clear any pending transitions
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
    
    // Apply transition delay if configured
    if (this.config.transitionDelay && this.config.transitionDelay > 0) {
      this.transitionTimeout = window.setTimeout(() => {
        this.applyStateTransition(oldState, newState);
      }, this.config.transitionDelay);
    } else {
      this.applyStateTransition(oldState, newState);
    }
    
    return true;
  }
  
  /**
   * Transition to a new state (convenience method)
   */
  public transitionTo(newState: LoadingType): boolean {
    return this.setLoadingState(newState);
  }
  
  /**
   * Check if currently in a loading state
   */
  public isLoading(): boolean {
    return this.currentState !== LoadingType.NONE;
  }
  
  /**
   * Check if in a specific loading state
   */
  public isInState(state: LoadingType): boolean {
    return this.currentState === state;
  }
  
  /**
   * Reset to no loading state
   */
  public reset(): void {
    this.setLoadingState(LoadingType.NONE);
  }
  
  /**
   * Validate state transitions
   */
  private isValidTransition(from: LoadingType, to: LoadingType): boolean {
    // Define valid transitions
    const validTransitions: Record<LoadingType, LoadingType[]> = {
      [LoadingType.NONE]: [LoadingType.INITIAL, LoadingType.STREAMING],
      [LoadingType.INITIAL]: [LoadingType.STREAMING, LoadingType.NONE],
      [LoadingType.STREAMING]: [LoadingType.NONE]
    };
    
    // Allow same state (no-op)
    if (from === to) {
      return true;
    }
    
    return validTransitions[from]?.includes(to) || false;
  }
  
  /**
   * Apply the state transition
   */
  private applyStateTransition(oldState: LoadingType, newState: LoadingType): void {
    this.logger.debug(`State transition: ${oldState} → ${newState}`);
    
    // Update state
    this.currentState = newState;
    
    // Emit state change event
    this.eventBus.emit('loading:stateChanged', createEvent('loading:stateChanged', {
      previousState: oldState,
      currentState: newState,
      source: 'UnifiedLoadingManager'
    }));
    
    // Emit specific events based on transitions
    if (oldState === LoadingType.INITIAL && newState === LoadingType.STREAMING) {
      // Transitioning from initial to streaming - hide wave indicator
      this.eventBus.emit('loading:hideInitial', createEvent('loading:hideInitial', {
        reason: 'streaming_started',
        source: 'UnifiedLoadingManager'
      }));
    }
    
    if (newState === LoadingType.NONE) {
      // Loading complete - hide all indicators
      this.eventBus.emit('loading:complete', createEvent('loading:complete', {
        previousState: oldState,
        source: 'UnifiedLoadingManager'
      }));
    }
  }
  
  /**
   * Get human-readable description of current state
   */
  public getStateDescription(): string {
    switch (this.currentState) {
      case LoadingType.NONE:
        return 'No loading';
      case LoadingType.INITIAL:
        return 'Sending message (wave indicator)';
      case LoadingType.STREAMING:
        return 'Streaming response (dots indicator)';
      default:
        return 'Unknown state';
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
    
    this.currentState = LoadingType.NONE;
    this.logger.debug('UnifiedLoadingManager destroyed');
  }
}
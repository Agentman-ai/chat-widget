// MessageRenderer.ts - Interface for message rendering strategies
import type { Message } from '../types/types';

/**
 * Interface for message rendering strategies
 * Allows switching between standard and streaming renderers
 */
export interface MessageRenderer {
  /**
   * Render a new message to the DOM
   */
  render(message: Message, container: HTMLElement): Promise<void>;
  
  /**
   * Update an existing message (used for streaming)
   */
  update(message: Message, container: HTMLElement): void;
  
  /**
   * Clean up any resources
   */
  cleanup(): void;
}

/**
 * Configuration for renderers
 */
export interface RendererConfig {
  debug?: boolean;
  preserveImages?: boolean;
  smoothTransitions?: boolean;
}
// AgentService.ts - Manages agent capabilities, metadata, and configuration
import type { AgentMetadata } from '../types/types';
import { Logger } from '../utils/logger';

export interface AgentCapabilities {
  supportedMimeTypes: string[];
  supportsAttachments: boolean;
  maxFileSize?: number;
  maxAttachments?: number;
  capabilities: string[];
  modelName?: string;
  modelVersion?: string;
}

export interface AgentConfig {
  initialized: boolean;
  capabilities: AgentCapabilities;
  metadata: AgentMetadata;
}

/**
 * AgentService - Manages agent capabilities and metadata
 * 
 * Responsibilities:
 * - Process agent capabilities from API metadata
 * - Validate file support and constraints
 * - Manage agent configuration state
 * - Handle capability-based feature enablement
 * - Track agent initialization status
 */
export class AgentService {
  private logger: Logger;
  private capabilities: AgentCapabilities | null = null;
  private metadata: AgentMetadata | null = null;
  private initialized: boolean = false;

  constructor(debug?: boolean | import('../types/types').DebugConfig) {
    this.logger = new Logger(debug || false, '[AgentService]');
  }

  /**
   * Process capabilities from API metadata response
   */
  processCapabilities(apiMetadata: any): AgentCapabilities {
    this.logger.verbose('🔍 Processing agent capabilities from metadata:', apiMetadata);

    if (!apiMetadata || typeof apiMetadata !== 'object') {
      this.logger.warn('⚠️ No metadata provided, using default capabilities');
      return this.getDefaultCapabilities();
    }

    const capabilities: AgentCapabilities = {
      supportedMimeTypes: apiMetadata.supported_mime_types || [],
      supportsAttachments: apiMetadata.supports_attachments || false,
      maxFileSize: apiMetadata.max_file_size || 10 * 1024 * 1024, // 10MB default
      maxAttachments: apiMetadata.max_attachments || 5,
      capabilities: apiMetadata.capabilities || [],
      modelName: apiMetadata.model_name,
      modelVersion: apiMetadata.model_version
    };

    // Store for future reference
    this.capabilities = capabilities;
    this.metadata = apiMetadata;
    this.initialized = true;

    this.logger.verbose('📋 Agent capabilities processed:', {
      supportedMimeTypes: capabilities.supportedMimeTypes,
      supportsAttachments: capabilities.supportsAttachments,
      maxFileSize: capabilities.maxFileSize,
      maxAttachments: capabilities.maxAttachments,
      capabilities: capabilities.capabilities
    });

    return capabilities;
  }

  /**
   * Check if a file type is supported by the agent
   */
  checkFileSupport(fileType: string, mimeType?: string): boolean {
    if (!this.capabilities || !this.capabilities.supportsAttachments) {
      this.logger.debug('❌ File attachments not supported by agent');
      return false;
    }

    // Check MIME type if provided
    if (mimeType && this.capabilities.supportedMimeTypes.length > 0) {
      const isSupported = this.capabilities.supportedMimeTypes.includes(mimeType);
      this.logger.debug(`📎 MIME type ${mimeType} supported: ${isSupported}`);
      return isSupported;
    }

    // Check file type
    const supportedTypes = ['image', 'document', 'text', 'audio', 'video', 'data'];
    const isSupported = supportedTypes.includes(fileType.toLowerCase());
    this.logger.debug(`📎 File type ${fileType} supported: ${isSupported}`);
    
    return isSupported;
  }

  /**
   * Validate file against agent constraints
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.capabilities) {
      return { valid: false, error: 'Agent capabilities not loaded' };
    }

    if (!this.capabilities.supportsAttachments) {
      return { valid: false, error: 'File attachments not supported' };
    }

    // Check file size
    if (this.capabilities.maxFileSize && file.size > this.capabilities.maxFileSize) {
      const maxSizeMB = Math.round(this.capabilities.maxFileSize / (1024 * 1024));
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${maxSizeMB}MB` 
      };
    }

    // Check MIME type
    if (this.capabilities.supportedMimeTypes.length > 0) {
      if (!this.capabilities.supportedMimeTypes.includes(file.type)) {
        return { 
          valid: false, 
          error: `File type not supported: ${file.type}` 
        };
      }
    }

    return { valid: true };
  }

  /**
   * Check if agent has a specific capability
   */
  hasCapability(capability: string): boolean {
    if (!this.capabilities) {
      return false;
    }
    
    return this.capabilities.capabilities.includes(capability);
  }

  /**
   * Get maximum number of attachments allowed
   */
  getMaxAttachments(): number {
    return this.capabilities?.maxAttachments || 5;
  }

  /**
   * Get maximum file size allowed
   */
  getMaxFileSize(): number {
    return this.capabilities?.maxFileSize || 10 * 1024 * 1024; // 10MB default
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return this.capabilities?.supportedMimeTypes || [];
  }

  /**
   * Check if attachments are supported
   */
  supportsAttachments(): boolean {
    return this.capabilities?.supportsAttachments || false;
  }

  /**
   * Get current agent configuration
   */
  getConfiguration(): AgentConfig | null {
    if (!this.initialized || !this.capabilities || !this.metadata) {
      return null;
    }

    return {
      initialized: this.initialized,
      capabilities: this.capabilities,
      metadata: this.metadata
    };
  }

  /**
   * Get default capabilities when no metadata is available
   */
  private getDefaultCapabilities(): AgentCapabilities {
    return {
      supportedMimeTypes: [],
      supportsAttachments: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxAttachments: 5,
      capabilities: [],
      modelName: 'unknown',
      modelVersion: 'unknown'
    };
  }

  /**
   * Reset agent capabilities (for new conversations)
   */
  reset(): void {
    this.logger.debug('🔄 Resetting agent capabilities');
    this.capabilities = null;
    this.metadata = null;
    this.initialized = false;
  }

  /**
   * Check if agent is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get agent model information
   */
  getModelInfo(): { name?: string; version?: string } {
    return {
      name: this.capabilities?.modelName,
      version: this.capabilities?.modelVersion
    };
  }

  /**
   * Get formatted capability summary for debugging
   */
  getCapabilitySummary(): string {
    if (!this.capabilities) {
      return 'Agent capabilities not loaded';
    }

    const summary = [
      `Attachments: ${this.capabilities.supportsAttachments ? 'Yes' : 'No'}`,
      `Max file size: ${Math.round((this.capabilities.maxFileSize || 0) / (1024 * 1024))}MB`,
      `Max attachments: ${this.capabilities.maxAttachments}`,
      `Supported types: ${this.capabilities.supportedMimeTypes.length} types`,
      `Capabilities: ${this.capabilities.capabilities.join(', ') || 'None'}`
    ];

    return summary.join(' | ');
  }

  /**
   * Update capabilities (for dynamic updates)
   */
  updateCapabilities(newMetadata: any): AgentCapabilities {
    this.logger.debug('🔄 Updating agent capabilities');
    return this.processCapabilities(newMetadata);
  }

  /**
   * Check if file count exceeds maximum
   */
  validateAttachmentCount(currentCount: number): boolean {
    const maxAttachments = this.getMaxAttachments();
    if (currentCount >= maxAttachments) {
      this.logger.warn(`❌ Too many attachments: ${currentCount} >= ${maxAttachments}`);
      return false;
    }
    return true;
  }

  /**
   * Get user-friendly error message for file validation
   */
  getFileValidationError(file: File): string | null {
    const validation = this.validateFile(file);
    return validation.valid ? null : validation.error || 'File validation failed';
  }
}
// APIClient.ts - Handles all API communications
import type { Message, ClientMetadata, AgentMetadata } from '../types/types';
import { Logger } from '../utils/logger';
import { API_CONSTANTS } from '../constants';

export interface APIConfig {
  apiUrl: string;
  websiteName: string;
  debug?: boolean | import('../types/types').DebugConfig;
}

export interface ChatInitResponse {
  messages: any[];
  metadata?: AgentMetadata;
}

export interface SendMessageRequest {
  website_name: string;
  conversation_id: string;
  messages: Message[];
  client_metadata?: ClientMetadata;
  attachments?: any[];
}

export interface SendMessageResponse {
  messages: any[];
  metadata?: AgentMetadata;
}

export class APIClient {
  private logger: Logger;

  constructor(private config: APIConfig) {
    this.logger = new Logger(config.debug || false, '[APIClient]');
  }

  /**
   * Initialize chat with the API
   */
  async initializeChat(conversationId: string, clientMetadata?: ClientMetadata): Promise<ChatInitResponse> {
    this.logger.debug('🚀 Initializing chat with API', { conversationId });

    try {
      const requestBody: any = {
        website_name: this.config.websiteName,
        conversation_id: conversationId,
        messages: [{
          id: `init_${Date.now()}`,
          sender: 'user',
          content: 'Hello',
          timestamp: new Date().toISOString()
        }]
      };

      if (clientMetadata && Object.keys(clientMetadata).length > 0) {
        requestBody.client_metadata = clientMetadata;
      }

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }

      // Extract metadata from response
      const metadata = this.extractMetadata(data);

      return {
        messages: data,
        metadata
      };

    } catch (error) {
      this.logger.error('Failed to initialize chat:', error);
      throw error;
    }
  }

  /**
   * Send message to the API
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    this.logger.debug('📤 Sending message to API', { 
      conversationId: request.conversation_id,
      messageCount: request.messages.length 
    });

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }

      // Extract metadata from response
      const metadata = this.extractMetadata(data);

      return {
        messages: data,
        metadata
      };

    } catch (error) {
      this.logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Fetch agent capabilities
   */
  async fetchAgentCapabilities(websiteName: string): Promise<AgentMetadata | null> {
    this.logger.debug('🔍 Fetching agent capabilities');

    try {
      const url = `${API_CONSTANTS.CAPABILITIES_ENDPOINT}?website_name=${encodeURIComponent(websiteName)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && typeof data === 'object') {
        return data as AgentMetadata;
      }

      return null;

    } catch (error) {
      this.logger.error('Failed to fetch agent capabilities:', error);
      return null;
    }
  }

  /**
   * Extract metadata from API response
   */
  private extractMetadata(data: any[]): AgentMetadata | undefined {
    // Look for metadata in the response
    // This could be in a special message or in response headers
    const lastMessage = data[data.length - 1];
    
    if (lastMessage && lastMessage.metadata) {
      this.logger.verbose('📋 Extracted metadata from response', lastMessage.metadata);
      return lastMessage.metadata;
    }

    // Check if any message has agent capabilities
    for (const msg of data) {
      if (msg.sender === 'agent' && msg.agent_capabilities) {
        this.logger.verbose('📋 Found agent capabilities in message', msg.agent_capabilities);
        return {
          agentId: msg.agent_id || 'default',
          capabilities: msg.agent_capabilities
        };
      }
    }

    return undefined;
  }

  /**
   * Format error for display
   */
  formatError(error: any): string {
    if (error.message?.includes('HTTP error! status: 404')) {
      return 'Service not found. Please check your configuration.';
    }
    if (error.message?.includes('HTTP error! status: 500')) {
      return 'Server error. Please try again later.';
    }
    if (error.message?.includes('Failed to fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    return 'Failed to connect to the server. Please try again.';
  }
}
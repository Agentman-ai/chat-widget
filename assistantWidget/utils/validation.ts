// utils/validation.ts
import type { AgentMetadata, ClientMetadata } from '../types/types';

/**
 * Validation utilities for data integrity
 */
export class ValidationUtils {
  /**
   * Validate AgentMetadata structure
   */
  static validateAgentMetadata(data: any): AgentMetadata | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const validated: AgentMetadata = {};

    // Validate supported_mime_types
    if (data.supported_mime_types) {
      if (Array.isArray(data.supported_mime_types)) {
        validated.supported_mime_types = data.supported_mime_types.filter(
          (type: any) => typeof type === 'string' && type.length > 0
        );
      }
    }

    // Validate supports_attachments
    if (typeof data.supports_attachments === 'boolean') {
      validated.supports_attachments = data.supports_attachments;
    }

    // Validate string fields
    const stringFields = ['model_name', 'model_version'];
    stringFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        (validated as any)[field] = data[field];
      }
    });

    // Validate number fields
    const numberFields = ['max_file_size', 'max_attachments'];
    numberFields.forEach(field => {
      if (data[field] && typeof data[field] === 'number' && data[field] > 0) {
        (validated as any)[field] = data[field];
      }
    });

    // Validate capabilities array
    if (data.capabilities && Array.isArray(data.capabilities)) {
      validated.capabilities = data.capabilities.filter(
        (cap: any) => typeof cap === 'string' && cap.length > 0
      );
    }

    return validated;
  }

  /**
   * Validate ClientMetadata structure
   */
  static validateClientMetadata(data: any): ClientMetadata | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const validated: ClientMetadata = {};

    // Validate user_id
    if (data.user_id !== undefined) {
      if (typeof data.user_id === 'string' || typeof data.user_id === 'number') {
        validated.user_id = data.user_id;
      }
    }

    // Validate email
    if (data.user_email_address && typeof data.user_email_address === 'string') {
      if (this.isValidEmail(data.user_email_address)) {
        validated.user_email_address = data.user_email_address;
      }
    }

    // Validate string fields
    const stringFields = [
      'device_id', 'browser_language', 'browser_device', 'browser_timezone',
      'ip_address', 'session_id', 'user_agent', 'referer_url', 'page_url', 'geo_location'
    ];

    stringFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        (validated as any)[field] = data[field];
      }
    });

    // Validate boolean fields
    if (typeof data.is_authenticated === 'boolean') {
      validated.is_authenticated = data.is_authenticated;
    }

    // Validate custom_tags
    if (data.custom_tags && typeof data.custom_tags === 'object') {
      validated.custom_tags = this.sanitizeCustomTags(data.custom_tags);
    }

    return validated;
  }

  /**
   * Basic email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Sanitize custom tags object
   */
  private static sanitizeCustomTags(tags: any): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.keys(tags).forEach(key => {
      // Limit key length and sanitize
      const sanitizedKey = key.substring(0, 50).replace(/[<>\"'&]/g, '');
      if (sanitizedKey.length === 0) return;
      
      const value = tags[key];
      
      // Only allow primitive values
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = value.substring(0, 200);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      }
    });
    
    return sanitized;
  }

  /**
   * Validate localStorage quota before saving
   */
  static checkStorageQuota(data: string): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, data);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage quota exceeded or unavailable:', error);
      return false;
    }
  }

  /**
   * Get safe localStorage usage stats
   */
  static getStorageStats(): { used: number; available: boolean } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      return {
        used: Math.round(used / 1024), // KB
        available: true
      };
    } catch {
      return {
        used: 0,
        available: false
      };
    }
  }
}
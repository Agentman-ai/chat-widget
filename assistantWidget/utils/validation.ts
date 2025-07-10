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

  /**
   * Sanitize user input text to prevent XSS and ensure safe processing
   */
  static sanitizeUserInput(input: string, maxLength: number = 4000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Trim and limit length
    let sanitized = input.trim().substring(0, maxLength);

    // Remove null bytes and control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Basic HTML escape for safety (will be processed by markdown parser)
    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };

    // Only escape if not already escaped
    if (!/&(?:amp|lt|gt|quot|#x27);/.test(sanitized)) {
      sanitized = sanitized.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
    }

    return sanitized;
  }

  /**
   * Validate and sanitize file upload data
   */
  static sanitizeFileData(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check file name
    if (!file.name || file.name.length > 255) {
      errors.push('Invalid file name');
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExt)) {
      errors.push('File type not allowed for security reasons');
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      errors.push('File size exceeds maximum limit');
    }

    // Check for zero-byte files
    if (file.size === 0) {
      errors.push('Empty files are not allowed');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate URL for safety
   */
  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow http, https, and mailto protocols
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Sanitize JSON payloads and prevent prototype pollution
   */
  static parseAndValidatePayload(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString);
      return this.sanitizeObject(parsed);
    } catch (error) {
      console.warn('JSON parse error:', error);
      return null;
    }
  }

  /**
   * Deep sanitize objects to prevent prototype pollution
   */
  private static sanitizeObject(obj: any, maxDepth: number = 10): any {
    if (maxDepth <= 0) {
      return null;
    }

    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
    }

    const sanitized: any = {};
    for (const key in obj) {
      // Skip prototype-polluting keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      if (obj.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeObject(obj[key], maxDepth - 1);
      }
    }

    return sanitized;
  }

  /**
   * Rate limiting for API calls
   */
  private static rateLimitMap = new Map<string, { count: number; lastReset: number }>();

  static checkRateLimit(key: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(key);

    if (!record || now - record.lastReset > windowMs) {
      this.rateLimitMap.set(key, { count: 1, lastReset: now });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }
}
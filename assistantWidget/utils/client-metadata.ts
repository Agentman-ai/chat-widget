// utils/client-metadata.ts
import type { ClientMetadata } from '../types/types';

/**
 * Utility class for collecting client metadata
 */
export class ClientMetadataCollector {
  /**
   * Generate a unique device ID for this browser/device
   */
  private static generateDeviceId(): string {
    const stored = localStorage.getItem('am_device_id');
    if (stored) return stored;
    
    const deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('am_device_id', deviceId);
    return deviceId;
  }

  /**
   * Generate a session ID for this browser session
   */
  private static generateSessionId(): string {
    const stored = sessionStorage.getItem('am_session_id');
    if (stored) return stored;
    
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('am_session_id', sessionId);
    return sessionId;
  }

  /**
   * Detect browser/device type from user agent
   */
  private static detectBrowserDevice(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    // Mobile detection
    if (/mobile|android|iphone|ipad|tablet/.test(ua)) {
      if (/android/.test(ua)) return 'Android Mobile';
      if (/iphone/.test(ua)) return 'iPhone';
      if (/ipad/.test(ua)) return 'iPad';
      return 'Mobile Device';
    }
    
    // Desktop browser detection
    if (/chrome/.test(ua) && !/edg/.test(ua)) return 'Chrome Desktop';
    if (/safari/.test(ua) && !/chrome/.test(ua)) return 'Safari Desktop';
    if (/firefox/.test(ua)) return 'Firefox Desktop';
    if (/edg/.test(ua)) return 'Edge Desktop';
    
    return 'Unknown Browser';
  }

  /**
   * Get timezone string
   */
  private static getTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      // Fallback to UTC offset
      const offset = new Date().getTimezoneOffset();
      const hours = Math.floor(Math.abs(offset) / 60);
      const minutes = Math.abs(offset) % 60;
      const sign = offset <= 0 ? '+' : '-';
      return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Fetch IP address and geolocation from external service with security measures
   */
  static async fetchIPAndGeoLocation(): Promise<{ ip_address?: string; geo_location?: string }> {
    // Trusted IP services only
    const TRUSTED_IP_SERVICES = [
      'https://api.ipify.org?format=json'
    ];
    
    const MAX_RESPONSE_SIZE = 1024; // 1KB max
    const MAX_RETRIES = 2;
    
    for (const service of TRUSTED_IP_SERVICES) {
      for (let retry = 0; retry < MAX_RETRIES; retry++) {
        try {
          const response = await fetch(service, {
            method: 'GET',
            headers: { 
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            signal: AbortSignal.timeout(3000),
            mode: 'cors',
            credentials: 'omit',
            referrerPolicy: 'no-referrer'
          });
          
          // Validate response
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          // Check response size
          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
            throw new Error('Response too large');
          }
          
          // Parse and validate JSON
          const text = await response.text();
          if (text.length > MAX_RESPONSE_SIZE) {
            throw new Error('Response too large');
          }
          
          const data = this.parseAndValidateIPResponse(text);
          return this.extractIPData(data);
          
        } catch (error) {
          console.warn(`IP service attempt ${retry + 1} failed:`, error);
          if (retry === MAX_RETRIES - 1) {
            console.warn(`All retries failed for ${service}`);
          } else {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 1000));
          }
        }
      }
    }
    
    return {};
  }
  
  /**
   * Safely parse and validate IP service response
   */
  private static parseAndValidateIPResponse(text: string): any {
    try {
      const data = JSON.parse(text);
      
      // Validate response structure
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid response format');
      }
      
      return data;
    } catch (error) {
      throw new Error(`Invalid JSON response: ${error}`);
    }
  }
  
  /**
   * Extract and sanitize IP data from validated response
   */
  private static extractIPData(data: any): { ip_address?: string; geo_location?: string } {
    const result: { ip_address?: string; geo_location?: string } = {};
    
    // Extract and validate IP address
    const ip = data.ip || data.query || data.ipAddress;
    if (typeof ip === 'string' && this.isValidIP(ip)) {
      result.ip_address = ip;
    }
    
    // Extract geo location if available (sanitized)
    if (data.city || data.country) {
      const parts = [];
      if (data.city && typeof data.city === 'string') {
        parts.push(this.sanitizeString(data.city));
      }
      if ((data.region || data.region_name) && typeof (data.region || data.region_name) === 'string') {
        parts.push(this.sanitizeString(data.region || data.region_name));
      }
      if ((data.country || data.country_name) && typeof (data.country || data.country_name) === 'string') {
        parts.push(this.sanitizeString(data.country || data.country_name));
      }
      
      if (parts.length > 0) {
        result.geo_location = parts.join(', ');
      }
    }
    
    return result;
  }
  
  /**
   * Validate IP address format
   */
  private static isValidIP(ip: string): boolean {
    // Basic IPv4/IPv6 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
  
  /**
   * Sanitize string values from external APIs
   */
  private static sanitizeString(value: string): string {
    return value
      .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
      .substring(0, 100) // Limit length
      .trim();
  }

  /**
   * Collect all available client metadata
   */
  static collect(overrides?: Partial<ClientMetadata>): ClientMetadata {
    const metadata: ClientMetadata = {};

    try {
      // Browser information
      metadata.user_agent = navigator.userAgent;
      metadata.browser_language = navigator.language || navigator.languages?.[0];
      metadata.browser_device = this.detectBrowserDevice(navigator.userAgent);
      metadata.browser_timezone = this.getTimezone();

      // Device and session IDs
      metadata.device_id = this.generateDeviceId();
      metadata.session_id = this.generateSessionId();

      // URLs (sanitized)
      metadata.page_url = this.sanitizeURL(window.location.href);
      metadata.referer_url = document.referrer ? this.sanitizeURL(document.referrer) : undefined;

      // Apply any overrides from config
      if (overrides) {
        Object.assign(metadata, overrides);
      }

      // Remove undefined values
      Object.keys(metadata).forEach(key => {
        if (metadata[key as keyof ClientMetadata] === undefined) {
          delete metadata[key as keyof ClientMetadata];
        }
      });

      return metadata;
    } catch (error) {
      console.error('Error collecting client metadata:', error);
      return overrides || {};
    }
  }
  
  /**
   * Sanitize URL to prevent XSS
   */
  private static sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      // Remove potential script content from hash/search
      parsed.hash = '';
      return parsed.toString().substring(0, 500); // Limit length
    } catch {
      return ''; // Invalid URL
    }
  }

  /**
   * Collect metadata including IP (async version)
   */
  static async collectWithIP(overrides?: Partial<ClientMetadata>): Promise<ClientMetadata> {
    // Get basic metadata first
    const metadata = this.collect(overrides);
    
    // Only fetch IP if not already provided and collection is enabled
    if (!metadata.ip_address && !metadata.geo_location) {
      const ipData = await this.fetchIPAndGeoLocation();
      
      // Only add if not overridden
      if (!metadata.ip_address && ipData.ip_address) {
        metadata.ip_address = ipData.ip_address;
      }
      if (!metadata.geo_location && ipData.geo_location) {
        metadata.geo_location = ipData.geo_location;
      }
    }
    
    return metadata;
  }

  /**
   * Merge metadata with custom tags
   */
  static mergeWithCustomTags(
    metadata: ClientMetadata, 
    customTags?: Record<string, any>
  ): ClientMetadata {
    if (!customTags || Object.keys(customTags).length === 0) {
      return metadata;
    }

    return {
      ...metadata,
      custom_tags: {
        ...(metadata.custom_tags || {}),
        ...customTags
      }
    };
  }
}
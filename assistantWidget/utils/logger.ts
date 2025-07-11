// logger.ts - Centralized logging system for ChatWidget

import type { DebugConfig } from '../types/types';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Logger class for controlled debug output
 * Provides different log levels and can be configured per instance
 */
export class Logger {
  private enabled: boolean = false;
  private logLevel: LogLevel = 'info';
  private timestamps: boolean = true;
  private useConsole: boolean = true;
  private customLogger?: (level: string, message: string, data?: any) => void;
  private prefix: string = '[ChatWidget]';

  // Numeric levels for comparison
  private readonly levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4
  };

  constructor(config?: boolean | DebugConfig, prefix?: string) {
    if (prefix) {
      this.prefix = prefix;
    }

    if (typeof config === 'boolean') {
      this.enabled = config;
    } else if (config) {
      this.enabled = config.enabled;
      this.logLevel = config.logLevel || 'info';
      this.timestamps = config.timestamps !== false;
      this.useConsole = config.console !== false;
      this.customLogger = config.logger;
    }

    // In production, default to error level only unless explicitly configured
    if (!config && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.logLevel = 'error';
    }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Format the log message with optional timestamp
   */
  private formatMessage(level: LogLevel, message: string, forConsole: boolean = false): string {
    const parts: string[] = [];
    
    // For console output, use simpler formatting
    if (forConsole && this.useConsole) {
      parts.push(this.prefix);
      if (level !== 'info') {
        parts.push(`[${level.toUpperCase()}]`);
      }
      parts.push(message);
      return parts.join(' ');
    }
    
    // For custom logger or when timestamps are explicitly requested
    if (this.timestamps) {
      const now = new Date();
      parts.push(`[${now.toISOString()}]`);
    }
    
    parts.push(this.prefix);
    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);
    
    return parts.join(' ');
  }

  /**
   * Output the log message
   */
  private output(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    // Use custom logger if provided
    if (this.customLogger) {
      const formattedMessage = this.formatMessage(level, message, false);
      this.customLogger(level, formattedMessage, data);
      return;
    }

    // Otherwise use console
    if (this.useConsole && typeof console !== 'undefined') {
      const formattedMessage = this.formatMessage(level, message, true);
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           'log';
      
      if (data !== undefined) {
        console[consoleMethod](formattedMessage, data);
      } else {
        console[consoleMethod](formattedMessage);
      }
    }
  }

  /**
   * Log error messages (always logged unless disabled)
   */
  error(message: string, error?: Error | any): void {
    this.output('error', message, error);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any): void {
    this.output('warn', message, data);
  }

  /**
   * Log info messages
   */
  info(message: string, data?: any): void {
    this.output('info', message, data);
  }

  /**
   * Log debug messages (for development)
   */
  debug(message: string, data?: any): void {
    this.output('debug', message, data);
  }

  /**
   * Log verbose messages (detailed debugging)
   */
  verbose(message: string, data?: any): void {
    this.output('verbose', message, data);
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    const childConfig: DebugConfig = {
      enabled: this.enabled,
      logLevel: this.logLevel,
      timestamps: this.timestamps,
      console: this.useConsole,
      logger: this.customLogger
    };
    return new Logger(childConfig, `${this.prefix} ${prefix}`);
  }

  /**
   * Update logger configuration at runtime
   */
  setConfig(config: DebugConfig): void {
    this.enabled = config.enabled;
    this.logLevel = config.logLevel || this.logLevel;
    this.timestamps = config.timestamps !== false;
    this.useConsole = config.console !== false;
    this.customLogger = config.logger;
  }

  /**
   * Enable/disable logger
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Create a singleton instance for backward compatibility
export const defaultLogger = new Logger(false);
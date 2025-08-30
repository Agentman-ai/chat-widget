/**
 * Configuration options for markdown loading
 */
export interface MarkdownConfig {
  cdnUrls?: string[];
  timeout?: number;
  markedOptions?: {
    gfm?: boolean;
    breaks?: boolean;
    headerIds?: boolean;
    mangle?: boolean;
    pedantic?: boolean;
    smartLists?: boolean;
    smartypants?: boolean;
  };
}

/**
 * Utility for dynamically loading the marked.js library
 * This keeps the bundle size small while providing full markdown support
 */
export class MarkdownLoader {
  private static loadPromise: Promise<boolean> | null = null;
  private static isLoaded = false;
  private static config: MarkdownConfig = {};
  
  // Default CDN URLs with fallback
  private static readonly DEFAULT_CDN_URLS = [
    'https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js',
    'https://unpkg.com/marked@12.0.0/marked.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.0/marked.min.js'
  ];
  
  private static readonly DEFAULT_TIMEOUT_MS = 5000; // 5 second timeout

  /**
   * Configure the markdown loader
   */
  public static configure(config: MarkdownConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dynamically load marked.js from CDN
   * Returns a promise that resolves to true if loaded successfully, false otherwise
   */
  public static async loadMarked(config?: MarkdownConfig): Promise<boolean> {
    // Apply configuration if provided
    if (config) {
      this.configure(config);
    }

    // Return cached result if already loaded
    if (this.isLoaded) {
      return true;
    }

    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Create new load promise
    this.loadPromise = this.performLoad();
    return this.loadPromise;
  }

  /**
   * Check if marked.js is available (either loaded dynamically or already present)
   */
  public static isAvailable(): boolean {
    return this.isLoaded || (typeof window !== 'undefined' && !!window.marked);
  }

  /**
   * Get the marked instance if available with proper typing
   */
  public static getMarked(): typeof window.marked | null {
    if (typeof window !== 'undefined' && window.marked) {
      // Apply configuration if marked is available and config exists
      if (this.config.markedOptions && window.marked.setOptions) {
        window.marked.setOptions(this.config.markedOptions);
      }
      return window.marked;
    }
    return null;
  }

  /**
   * Perform the actual loading of marked.js
   */
  private static async performLoad(): Promise<boolean> {
    try {
      // Check if marked is already available
      if (typeof window !== 'undefined' && window.marked) {
        this.isLoaded = true;
        return true;
      }

      // Get CDN URLs to try
      const cdnUrls = this.config.cdnUrls || this.DEFAULT_CDN_URLS;
      const timeout = this.config.timeout || this.DEFAULT_TIMEOUT_MS;

      // Try each CDN URL until one succeeds
      for (let i = 0; i < cdnUrls.length; i++) {
        const url = cdnUrls[i];
        
        const success = await this.tryLoadFromUrl(url, timeout);
        if (success) {
          this.isLoaded = true;
          return true;
        }
        
        // If this wasn't the last URL, log and try the next one
        if (i < cdnUrls.length - 1) {
          console.warn(`Failed to load from ${url}, trying next CDN...`);
        }
      }

      console.warn('Failed to load marked.js from all CDN URLs, falling back to OfflineParser');
      return false;
    } catch (error) {
      console.warn('Error loading marked.js:', error);
      return false;
    }
  }

  /**
   * Try to load marked.js from a specific URL
   */
  private static async tryLoadFromUrl(url: string, timeout: number): Promise<boolean> {
    // Check if script already exists to avoid duplicates
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      // Script already exists, wait a bit to see if it loads
      await new Promise(resolve => setTimeout(resolve, 100));
      if (typeof window !== 'undefined' && window.marked) {
        return true;
      }
      return false;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.setAttribute('data-marked-loader', 'true');

    // Create promise that resolves when script loads or fails
    const loadPromise = new Promise<boolean>((resolve) => {
      const timeoutId = setTimeout(() => {
        script.remove();
        resolve(false);
      }, timeout);

      script.onload = () => {
        clearTimeout(timeoutId);
        // Verify marked is actually available
        if (typeof window !== 'undefined' && window.marked) {
          resolve(true);
        } else {
          script.remove();
          resolve(false);
        }
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        script.remove();
        resolve(false);
      };
    });

    // Add script to document
    document.head.appendChild(script);

    return await loadPromise;
  }

  /**
   * Reset the loader state (useful for testing)
   */
  public static reset(): void {
    this.loadPromise = null;
    this.isLoaded = false;
    this.config = {};
  }

  /**
   * Clean up loaded scripts from the DOM
   */
  public static cleanup(): void {
    // Remove all scripts added by this loader
    const scripts = document.querySelectorAll('script[data-marked-loader="true"]');
    scripts.forEach(script => script.remove());
    
    // Also try to remove scripts by known URLs if data attribute is missing
    const cdnUrls = this.config.cdnUrls || this.DEFAULT_CDN_URLS;
    cdnUrls.forEach(url => {
      const script = document.querySelector(`script[src="${url}"]`);
      if (script) {
        script.remove();
      }
    });
    
    // Reset state
    this.reset();
  }

  /**
   * Get current configuration
   */
  public static getConfig(): Readonly<MarkdownConfig> {
    return { ...this.config };
  }
}

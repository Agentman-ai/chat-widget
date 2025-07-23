/**
 * Utility for dynamically loading the marked.js library
 * This keeps the bundle size small while providing full markdown support
 */
export class MarkdownLoader {
  private static loadPromise: Promise<boolean> | null = null;
  private static isLoaded = false;
  private static readonly CDN_URL = 'https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js';
  private static readonly TIMEOUT_MS = 5000; // 5 second timeout

  /**
   * Dynamically load marked.js from CDN
   * Returns a promise that resolves to true if loaded successfully, false otherwise
   */
  public static async loadMarked(): Promise<boolean> {
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
   * Get the marked instance if available
   */
  public static getMarked(): any {
    if (typeof window !== 'undefined' && window.marked) {
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

      // Create script element
      const script = document.createElement('script');
      script.src = this.CDN_URL;
      script.async = true;

      // Create promise that resolves when script loads or fails
      const loadPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Marked.js loading timed out, falling back to OfflineParser');
          resolve(false);
        }, this.TIMEOUT_MS);

        script.onload = () => {
          clearTimeout(timeout);
          this.isLoaded = true;
          console.log('Marked.js loaded successfully');
          resolve(true);
        };

        script.onerror = () => {
          clearTimeout(timeout);
          console.warn('Failed to load marked.js, falling back to OfflineParser');
          resolve(false);
        };
      });

      // Add script to document
      document.head.appendChild(script);

      return await loadPromise;
    } catch (error) {
      console.warn('Error loading marked.js:', error);
      return false;
    }
  }

  /**
   * Reset the loader state (useful for testing)
   */
  public static reset(): void {
    this.loadPromise = null;
    this.isLoaded = false;
  }
}

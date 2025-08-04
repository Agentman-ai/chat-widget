/**
 * CDN loader for morphdom library
 * Loads morphdom dynamically from CDN to reduce bundle size
 */

import { Logger } from './logger';

// CDN URLs for morphdom (in order of preference)
const MORPHDOM_CDN_URLS = [
  'https://unpkg.com/morphdom@2.7.7/dist/morphdom-umd.min.js',
  'https://cdn.jsdelivr.net/npm/morphdom@2.7.7/dist/morphdom-umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/morphdom/2.7.7/morphdom-umd.min.js'
];

let morphdomInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/**
 * Load morphdom from CDN with fallback URLs
 */
export async function loadMorphdom(debug?: boolean): Promise<any> {
  const logger = new Logger(debug || false, '[MorphdomLoader]');
  
  // Return cached instance if already loaded
  if (morphdomInstance) {
    return morphdomInstance;
  }
  
  // Return existing loading promise if already in progress
  if (loadingPromise) {
    return loadingPromise;
  }
  
  // Start loading process
  loadingPromise = loadMorphdomFromCDN(logger);
  
  try {
    morphdomInstance = await loadingPromise;
    return morphdomInstance;
  } finally {
    loadingPromise = null;
  }
}

/**
 * Try loading morphdom from CDN URLs in sequence
 */
async function loadMorphdomFromCDN(logger: Logger): Promise<any> {
  for (const url of MORPHDOM_CDN_URLS) {
    try {
      logger.debug(`Attempting to load morphdom from: ${url}`);
      
      // Check if morphdom is already available (e.g., from another widget instance)
      if (typeof window !== 'undefined' && (window as any).morphdom) {
        logger.debug('Morphdom already available in window');
        return (window as any).morphdom;
      }
      
      // Create script element
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      // Wait for script to load
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      
      // Check if morphdom is now available
      if (typeof window !== 'undefined' && (window as any).morphdom) {
        logger.info(`Successfully loaded morphdom from: ${url}`);
        return (window as any).morphdom;
      }
      
      throw new Error('Morphdom not found in window after script load');
      
    } catch (error) {
      logger.warn(`Failed to load morphdom from ${url}:`, error);
      // Continue to next URL
    }
  }
  
  // All CDN attempts failed
  throw new Error('Failed to load morphdom from all CDN sources');
}

/**
 * Check if morphdom is already loaded
 */
export function isMorphdomLoaded(): boolean {
  return morphdomInstance !== null || (typeof window !== 'undefined' && (window as any).morphdom);
}

/**
 * Get loaded morphdom instance without loading
 */
export function getMorphdomInstance(): any | null {
  if (morphdomInstance) {
    return morphdomInstance;
  }
  
  if (typeof window !== 'undefined' && (window as any).morphdom) {
    return (window as any).morphdom;
  }
  
  return null;
}

/**
 * Simple fallback DOM updater if morphdom fails to load
 * Provides basic functionality for streaming updates
 */
export function fallbackDomUpdate(fromNode: Element, toNode: Element | string): void {
  const targetNode = typeof toNode === 'string' 
    ? new DOMParser().parseFromString(toNode, 'text/html').body.firstChild as Element
    : toNode;
    
  if (!targetNode) return;
  
  // Preserve images that are already loaded
  const existingImages = new Map<string, HTMLImageElement>();
  fromNode.querySelectorAll('img').forEach(img => {
    if (img.src && img.complete) {
      existingImages.set(img.src, img);
    }
  });
  
  // Update content
  fromNode.innerHTML = targetNode.innerHTML;
  
  // Restore loaded images
  fromNode.querySelectorAll('img').forEach(img => {
    const existing = existingImages.get(img.src);
    if (existing) {
      img.parentNode?.replaceChild(existing, img);
    }
  });
}
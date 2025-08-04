/**
 * Simple ID generator to replace uuid dependency
 * Generates unique IDs using crypto.randomUUID when available,
 * falls back to timestamp + random string
 */

/**
 * Generate a unique ID
 * Uses crypto.randomUUID if available, otherwise generates a unique string
 */
export function generateId(): string {
  // Use native crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: timestamp + random string
  // Format: "timestamp-random" (e.g., "1703024400123-a1b2c3d4")
  const timestamp = Date.now().toString(36); // Base36 for shorter string
  const random = Math.random().toString(36).substring(2, 10); // 8 random chars
  
  return `${timestamp}-${random}`;
}

/**
 * Generate a shorter ID for cases where full UUID isn't needed
 * Useful for temporary IDs or when storage space is a concern
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 11); // 9 characters
}

/**
 * Check if a string is a valid ID (either UUID or our custom format)
 */
export function isValidId(id: string): boolean {
  // UUID v4 pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // Our custom pattern: "base36timestamp-base36random"
  const customPattern = /^[0-9a-z]+-[0-9a-z]+$/;
  
  return uuidPattern.test(id) || customPattern.test(id);
}
/**
 * Utility functions for styling
 */

/**
 * Convert camelCase to kebab-case for CSS variable names
 * @param str - The camelCase string
 * @returns The kebab-case string
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Apply theme variables to an element
 * @param element - The HTML element
 * @param theme - The theme object with camelCase properties
 */
export function applyThemeVariables(element: HTMLElement, theme: Record<string, string>): void {
  Object.entries(theme).forEach(([key, value]) => {
    if (value) {
      const cssVarName = `--chat-${camelToKebab(key)}`;
      element.style.setProperty(cssVarName, value);
    }
  });
}
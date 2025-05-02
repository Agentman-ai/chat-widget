// styles/style-manager.ts
import { baseStyles } from './base';
import { messageStyles } from './messages';
import { variantStyles } from './variants';
import { animationStyles } from './animations';
import { responsiveStyles } from './responsive';
import { svgStyles } from './svg';
import { loadingStyles } from './loading';
import { promptStyles } from './prompts';

export class StyleManager {
  private styleElement: HTMLStyleElement | null = null;
  private variant: 'corner' | 'centered' | 'inline';
  private styles: string;

  constructor(variant: 'corner' | 'centered' | 'inline') {
    this.variant = variant;
    this.styles = [
      baseStyles,
      messageStyles,
      svgStyles,
      loadingStyles,
      promptStyles,
      variantStyles[this.variant],
      animationStyles,
      responsiveStyles
    ].join('\n');
  }

  public injectStyles(): void {
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = this.styles;
    document.head.appendChild(this.styleElement);
  }

  public updateStyles(variant: 'corner' | 'centered' | 'inline'): void {
    this.variant = variant;
    if (this.styleElement) {
      this.styleElement.textContent = this.styles;
    }
  }

  public cleanup(): void {
    this.styleElement?.remove();
    this.styleElement = null;
  }
}
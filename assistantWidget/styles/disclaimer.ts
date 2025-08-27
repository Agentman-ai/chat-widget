/**
 * Disclaimer component styles with BEM naming convention
 * 
 * Provides styles for the AI disclaimer component with multiple variants:
 * - standalone: Full-width disclaimer with icon and link
 * - inline: Compact inline version for branding sections
 * - compact: Minimal version for space-constrained areas
 */

export const disclaimerStyles = `
  /* Base disclaimer styles */
  .am-disclaimer {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--disclaimer-text-color, rgba(0, 0, 0, 0.6));
    font-size: 10px;
    line-height: 1.4;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .am-disclaimer {
      color: var(--disclaimer-text-color-dark, rgba(255, 255, 255, 0.7));
    }
  }

  /* Standalone variant - for welcome screen */
  .am-disclaimer--standalone {
    background: var(--disclaimer-bg-color, rgba(0, 0, 0, 0.02));
    border: 1px solid var(--disclaimer-border-color, rgba(0, 0, 0, 0.06));
    border-radius: 8px;
    padding: 8px 12px;
    margin: 12px 0;
    justify-content: center;
    text-align: center;
    flex-wrap: wrap;
    font-size: 11px; /* Slightly larger for standalone visibility */
  }

  @media (prefers-color-scheme: dark) {
    .am-disclaimer--standalone {
      background: var(--disclaimer-bg-color-dark, rgba(255, 255, 255, 0.05));
      border-color: var(--disclaimer-border-color-dark, rgba(255, 255, 255, 0.1));
    }
  }

  /* Welcome screen specific styling */
  .am-disclaimer--welcome {
    max-width: 400px;
    margin: 12px auto;
  }

  /* Inline variant - for branding sections */
  .am-disclaimer--inline {
    display: inline-flex;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font-size: 10px; /* Match the powered by text size */
  }

  /* Compact variant - for limited space */
  .am-disclaimer--compact {
    font-size: 10px;
    gap: 4px;
  }

  /* Disclaimer text */
  .am-disclaimer__text {
    opacity: 0.9;
  }

  /* Separator for inline variant */
  .am-disclaimer__separator {
    margin: 0 6px;
    opacity: 0.4;
  }

  /* Disclaimer link */
  .am-disclaimer__link {
    color: var(--disclaimer-link-color, rgba(37, 99, 235, 0.8));
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    transition: color 0.2s ease, opacity 0.2s ease;
  }

  .am-disclaimer__link:hover {
    color: var(--disclaimer-link-hover-color, rgba(37, 99, 235, 1));
    text-decoration: underline;
  }

  .am-disclaimer__link:focus-visible {
    outline: 2px solid var(--disclaimer-link-color, rgba(37, 99, 235, 0.8));
    outline-offset: 2px;
    border-radius: 2px;
  }

  @media (prefers-color-scheme: dark) {
    .am-disclaimer__link {
      color: var(--disclaimer-link-color-dark, rgba(96, 165, 250, 0.9));
    }
    
    .am-disclaimer__link:hover {
      color: var(--disclaimer-link-hover-color-dark, rgba(96, 165, 250, 1));
    }
  }

  /* Inline link variant */
  .am-disclaimer__link--inline {
    margin-left: 4px;
  }

  /* Icons */
  .am-disclaimer__icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    opacity: 0.7;
  }

  /* Icon variants */
  .am-disclaimer__icon--info {
    color: currentColor;
  }

  .am-disclaimer__icon--warning {
    color: var(--disclaimer-warning-color, #f59e0b);
  }

  .am-disclaimer__icon--alert {
    color: var(--disclaimer-alert-color, #ef4444);
  }

  /* External link icon */
  .am-disclaimer__external-icon {
    width: 10px;
    height: 10px;
    opacity: 0.6;
    margin-left: 2px;
  }

  /* Accessibility - High contrast mode support */
  @media (prefers-contrast: high) {
    .am-disclaimer {
      border-width: 2px;
    }
    
    .am-disclaimer--standalone {
      background: transparent;
    }
    
    .am-disclaimer__text {
      opacity: 1;
    }
    
    .am-disclaimer__link {
      text-decoration: underline;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .am-disclaimer__link {
      transition: none;
    }
  }

  /* Mobile responsive adjustments */
  @media (max-width: 640px) {
    .am-disclaimer--standalone {
      font-size: 10px;
      padding: 6px 10px;
    }
    
    .am-disclaimer--welcome {
      max-width: 90%;
    }
    
    /* Inline disclaimer in mobile - reduce spacing */
    .am-disclaimer--inline {
      font-size: 9px;
      gap: 2px;
    }
    
    .am-disclaimer--inline .am-disclaimer__separator {
      margin: 0 3px;
    }
    
    .am-disclaimer--inline .am-disclaimer__text {
      white-space: nowrap;
    }
    
    .am-disclaimer--inline .am-disclaimer__link {
      white-space: nowrap;
    }
    
    .am-disclaimer__icon {
      width: 10px;
      height: 10px;
    }
    
    .am-disclaimer__external-icon {
      width: 8px;
      height: 8px;
      margin-left: 1px;
    }
  }
`;
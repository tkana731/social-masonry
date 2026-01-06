/**
 * Social Masonry - Utility Functions
 */

import type { ColumnConfig, SocialPost } from './types';

/**
 * Debounce function execution
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Get number of columns based on viewport width
 */
export function getColumnCount(
  columns: number | ColumnConfig[],
  containerWidth: number
): number {
  if (typeof columns === 'number') {
    return columns;
  }
  
  // Sort by minWidth descending
  const sorted = [...columns].sort((a, b) => b.minWidth - a.minWidth);
  
  for (const config of sorted) {
    if (containerWidth >= config.minWidth) {
      return config.columns;
    }
  }
  
  // Return smallest breakpoint's columns or default to 1
  return sorted[sorted.length - 1]?.columns ?? 1;
}

/**
 * Default responsive column configuration
 */
export const defaultColumnConfig: ColumnConfig[] = [
  { columns: 4, minWidth: 1200 },
  { columns: 3, minWidth: 900 },
  { columns: 2, minWidth: 600 },
  { columns: 1, minWidth: 0 },
];

/**
 * Format number with abbreviations (1K, 1M, etc.)
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return num.toString();
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }
  
  // Format as date for older posts
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Parse CSS value to pixels
 */
export function parseCSSValue(value: number | string, containerWidth?: number): number {
  if (typeof value === 'number') {
    return value;
  }
  
  const numMatch = value.match(/^([\d.]+)(px|rem|em|%|vw)?$/);
  if (!numMatch) {
    return 0;
  }
  
  const num = parseFloat(numMatch[1]);
  const unit = numMatch[2] || 'px';
  
  switch (unit) {
    case 'px':
      return num;
    case 'rem':
      return num * 16; // Assume 16px base
    case 'em':
      return num * 16;
    case '%':
      return containerWidth ? (num / 100) * containerWidth : 0;
    case 'vw':
      return (num / 100) * window.innerWidth;
    default:
      return num;
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `sm-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if element is in viewport
 */
export function isInViewport(
  element: { top: number; bottom: number },
  scrollTop: number,
  viewportHeight: number,
  overscan: number = 0
): boolean {
  const expandedTop = scrollTop - overscan;
  const expandedBottom = scrollTop + viewportHeight + overscan;
  
  return element.bottom >= expandedTop && element.top <= expandedBottom;
}

/**
 * Get scroll position
 */
export function getScrollPosition(scrollContainer: HTMLElement | Window | null): {
  scrollTop: number;
  viewportHeight: number;
} {
  if (!scrollContainer || scrollContainer === window) {
    return {
      scrollTop: window.scrollY || document.documentElement.scrollTop,
      viewportHeight: window.innerHeight,
    };
  }
  
  return {
    scrollTop: (scrollContainer as HTMLElement).scrollTop,
    viewportHeight: (scrollContainer as HTMLElement).clientHeight,
  };
}

/**
 * Type guard for Twitter posts
 */
export function isTwitterPost(post: SocialPost): post is import('./types').TwitterPost {
  return post.platform === 'twitter';
}

/**
 * Type guard for Instagram posts
 */
export function isInstagramPost(post: SocialPost): post is import('./types').InstagramPost {
  return post.platform === 'instagram';
}

/**
 * Clamp number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Merge objects deeply
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  const result = { ...target };
  
  for (const source of sources) {
    if (!source) continue;
    
    for (const key of Object.keys(source)) {
      const targetValue = result[key as keyof T];
      const sourceValue = source[key as keyof T];
      
      if (
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }
  
  return result;
}

/**
 * Create CSS custom properties from config
 */
export function createCSSVariables(prefix: string, config: Record<string, unknown>): string {
  const vars: string[] = [];
  
  function processValue(key: string, value: unknown): void {
    if (value === undefined || value === null) return;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
        processValue(`${key}-${subKey}`, subValue);
      }
    } else {
      const cssValue = typeof value === 'number' ? `${value}px` : String(value);
      vars.push(`--${prefix}-${key}: ${cssValue};`);
    }
  }
  
  for (const [key, value] of Object.entries(config)) {
    processValue(key, value);
  }
  
  return vars.join('\n');
}

/**
 * Request animation frame with fallback
 */
export const raf =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (callback: FrameRequestCallback) => setTimeout(callback, 16);

/**
 * Cancel animation frame with fallback
 */
export const cancelRaf =
  typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : (id: number) => clearTimeout(id);

/**
 * Check if we're in a browser environment
 */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Check if ResizeObserver is supported
 */
export const supportsResizeObserver = isBrowser && typeof ResizeObserver !== 'undefined';

/**
 * Check if IntersectionObserver is supported
 */
export const supportsIntersectionObserver =
  isBrowser && typeof IntersectionObserver !== 'undefined';

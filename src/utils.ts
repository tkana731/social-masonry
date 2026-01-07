/**
 * Social Masonry - Utility Functions
 */

import type { ColumnConfig, SocialPost, SocialPlatform } from './types';

// ============================================
// URL Parsing Utilities
// ============================================

/**
 * Extract tweet ID from Twitter/X URL
 */
export function extractTweetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract post ID from Instagram URL
 */
export function extractInstagramId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): SocialPlatform | null {
  if (/(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url)) {
    return 'twitter';
  }
  if (/instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+/.test(url)) {
    return 'instagram';
  }
  return null;
}

/**
 * Generate embed URL for Twitter
 */
export function getTwitterEmbedUrl(
  tweetId: string,
  options: { theme?: 'light' | 'dark'; hideCard?: boolean; hideThread?: boolean } = {}
): string {
  const params = new URLSearchParams();
  params.set('id', tweetId);
  if (options.theme) params.set('theme', options.theme);
  if (options.hideCard) params.set('cards', 'hidden');
  if (options.hideThread) params.set('conversation', 'none');
  return `https://platform.twitter.com/embed/Tweet.html?${params.toString()}`;
}

/**
 * Generate embed URL for Instagram
 */
export function getInstagramEmbedUrl(postId: string): string {
  return `https://www.instagram.com/p/${postId}/embed/`;
}

/**
 * Generate unique ID from post URL
 */
export function generatePostId(post: SocialPost): string {
  if (post.id) return post.id;

  if (post.platform === 'twitter') {
    const tweetId = extractTweetId(post.url);
    return tweetId ? `tw-${tweetId}` : `tw-${hashString(post.url)}`;
  }

  if (post.platform === 'instagram') {
    const igId = extractInstagramId(post.url);
    return igId ? `ig-${igId}` : `ig-${hashString(post.url)}`;
  }

  return `post-${hashString(post.url)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================
// Layout Utilities
// ============================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
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
 * Default embed heights
 */
export const DEFAULT_TWITTER_HEIGHT = 500;
export const DEFAULT_INSTAGRAM_HEIGHT = 600;

// ============================================
// Environment Checks
// ============================================

/**
 * Check if we're in a browser environment
 */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Check if ResizeObserver is supported
 */
export const supportsResizeObserver = isBrowser && typeof ResizeObserver !== 'undefined';

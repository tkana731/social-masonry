/**
 * Social Masonry - Type Definitions
 * Masonry layout for social media iframe embeds
 */

// ============================================
// Platform Types
// ============================================

export type SocialPlatform = 'twitter' | 'instagram';

// ============================================
// Post Types
// ============================================

export interface SocialPost {
  /** Unique identifier (auto-generated from URL if not provided) */
  id?: string;
  /** Social media platform */
  platform: SocialPlatform;
  /** Post URL */
  url: string;
}

// ============================================
// Layout Configuration
// ============================================

export interface ColumnConfig {
  /** Number of columns at this breakpoint */
  columns: number;
  /** Minimum viewport width for this config (px) */
  minWidth: number;
}

export interface MasonryConfig {
  /** Gap between items (px) */
  gap?: number;
  /** Responsive column configuration */
  columns?: number | ColumnConfig[];
  /** Padding around the container (px) */
  padding?: number;
  /** Animation duration for layout changes (ms) */
  animationDuration?: number;
  /** Enable/disable animations */
  animate?: boolean;
}

// ============================================
// Embed Configuration
// ============================================

export interface EmbedConfig {
  /** Theme for embeds: 'light' or 'dark' */
  theme?: 'light' | 'dark';
  /** Default height for Twitter embeds (px) */
  twitterHeight?: number;
  /** Default height for Instagram embeds (px) */
  instagramHeight?: number;
  /** Hide Twitter card (show only text) */
  twitterHideCard?: boolean;
  /** Hide Twitter conversation thread */
  twitterHideThread?: boolean;
}

// ============================================
// Event Handlers
// ============================================

export interface MasonryEvents {
  /** Called when layout is recalculated */
  onLayoutComplete?: (positions: ItemPosition[]) => void;
  /** Called when an embed loads */
  onEmbedLoad?: (post: SocialPost) => void;
  /** Called when an embed fails to load */
  onEmbedError?: (post: SocialPost, error: Error) => void;
}

// ============================================
// Internal Types
// ============================================

export interface ItemPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  column: number;
}

export interface LayoutState {
  positions: Map<string, ItemPosition>;
  columnHeights: number[];
  containerHeight: number;
  columnWidth: number;
}

// ============================================
// Main Options Interface
// ============================================

export interface SocialMasonryOptions extends MasonryConfig, EmbedConfig, MasonryEvents {
  /** Posts to display */
  posts: SocialPost[];
  /** Container element or selector (for vanilla JS) */
  container?: HTMLElement | string;
}

// ============================================
// React Component Props
// ============================================

export interface SocialMasonryProps extends Omit<SocialMasonryOptions, 'container'> {
  /** Additional CSS class for container */
  className?: string;
  /** Inline styles for container */
  style?: React.CSSProperties;
}

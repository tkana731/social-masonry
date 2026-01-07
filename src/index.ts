/**
 * Social Masonry
 * Masonry layout for X (Twitter) and Instagram iframe embeds
 *
 * @packageDocumentation
 */

// Layout Engine
export { LayoutEngine, createLayoutEngine } from './layout-engine';

// Types
export type {
  // Posts
  SocialPost,
  SocialPlatform,
  // Config
  SocialMasonryOptions,
  SocialMasonryProps,
  MasonryConfig,
  EmbedConfig,
  ColumnConfig,
  // Events
  MasonryEvents,
  // Internal
  ItemPosition,
  LayoutState,
} from './types';

// Utilities
export {
  // URL parsing
  extractTweetId,
  extractInstagramId,
  detectPlatform,
  getTwitterEmbedUrl,
  getInstagramEmbedUrl,
  generatePostId,
  // Layout
  defaultColumnConfig,
  getColumnCount,
  // Constants
  DEFAULT_TWITTER_HEIGHT,
  DEFAULT_INSTAGRAM_HEIGHT,
} from './utils';

/**
 * Social Masonry - Layout Engine
 * Calculates positions for masonry grid items
 */

import type {
  ItemPosition,
  LayoutState,
  MasonryConfig,
  SocialPost,
} from './types';
import {
  defaultColumnConfig,
  getColumnCount,
  generatePostId,
  DEFAULT_TWITTER_HEIGHT,
  DEFAULT_INSTAGRAM_HEIGHT,
} from './utils';

export interface LayoutEngineOptions extends MasonryConfig {
  containerWidth: number;
  itemHeights: Map<string, number>;
  twitterHeight?: number;
  instagramHeight?: number;
}

export class LayoutEngine {
  private options: Required<LayoutEngineOptions>;
  private state: LayoutState;

  constructor(options: LayoutEngineOptions) {
    this.options = {
      gap: 16,
      columns: defaultColumnConfig,
      padding: 0,
      animationDuration: 300,
      animate: true,
      twitterHeight: DEFAULT_TWITTER_HEIGHT,
      instagramHeight: DEFAULT_INSTAGRAM_HEIGHT,
      ...options,
    };

    this.state = {
      positions: new Map(),
      columnHeights: [],
      containerHeight: 0,
      columnWidth: 0,
    };
  }

  /**
   * Calculate layout for all posts
   */
  calculate(posts: SocialPost[]): LayoutState {
    const { containerWidth, itemHeights, gap, padding } = this.options;

    // Calculate column count and width
    const columnCount = getColumnCount(this.options.columns, containerWidth);
    const availableWidth = containerWidth - padding * 2;
    const totalGapWidth = gap * (columnCount - 1);
    const columnWidth = (availableWidth - totalGapWidth) / columnCount;

    // Initialize column heights
    const columnHeights = new Array(columnCount).fill(0);
    const positions = new Map<string, ItemPosition>();

    // Place each item in the shortest column
    for (const post of posts) {
      const postId = generatePostId(post);
      const itemHeight = itemHeights.get(postId) ?? this.getDefaultHeight(post);

      // Find shortest column
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

      // Calculate position
      const x = padding + shortestColumn * (columnWidth + gap);
      const y = columnHeights[shortestColumn];

      positions.set(postId, {
        id: postId,
        x,
        y,
        width: columnWidth,
        height: itemHeight,
        column: shortestColumn,
      });

      // Update column height
      columnHeights[shortestColumn] = y + itemHeight + gap;
    }

    // Remove last gap from column heights
    const containerHeight = Math.max(...columnHeights.map(h => h - gap), 0);

    this.state = {
      positions,
      columnHeights,
      containerHeight,
      columnWidth,
    };

    return this.state;
  }

  /**
   * Get default height for embed based on platform
   */
  private getDefaultHeight(post: SocialPost): number {
    if (post.platform === 'twitter') {
      return this.options.twitterHeight;
    }
    if (post.platform === 'instagram') {
      return this.options.instagramHeight;
    }
    return DEFAULT_TWITTER_HEIGHT;
  }

  /**
   * Update single item height
   */
  updateItemHeight(id: string, height: number): void {
    this.options.itemHeights.set(id, height);
  }

  /**
   * Get current layout state
   */
  getState(): LayoutState {
    return this.state;
  }

  /**
   * Get position for specific item
   */
  getPosition(id: string): ItemPosition | undefined {
    return this.state.positions.get(id);
  }

  /**
   * Update container width
   */
  setContainerWidth(width: number): void {
    this.options.containerWidth = width;
  }

  /**
   * Get current column count
   */
  getColumnCount(): number {
    return getColumnCount(this.options.columns, this.options.containerWidth);
  }
}

/**
 * Create a new layout engine instance
 */
export function createLayoutEngine(options: LayoutEngineOptions): LayoutEngine {
  return new LayoutEngine(options);
}

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
  parseCSSValue,
} from './utils';

export interface LayoutEngineOptions extends MasonryConfig {
  containerWidth: number;
  itemHeights: Map<string, number>;
}

export class LayoutEngine {
  private options: Required<LayoutEngineOptions>;
  private state: LayoutState;

  constructor(options: LayoutEngineOptions) {
    this.options = {
      gap: 16,
      columns: defaultColumnConfig,
      defaultColumns: 3,
      padding: 0,
      animationDuration: 300,
      animate: true,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
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
    const { containerWidth, itemHeights } = this.options;
    const gap = parseCSSValue(this.options.gap);
    const padding = parseCSSValue(this.options.padding);
    
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
      const itemHeight = itemHeights.get(post.id) ?? this.estimateHeight(post, columnWidth);
      
      // Find shortest column
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Calculate position
      const x = padding + shortestColumn * (columnWidth + gap);
      const y = columnHeights[shortestColumn];
      
      positions.set(post.id, {
        id: post.id,
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
   * Estimate item height based on content
   */
  private estimateHeight(post: SocialPost, columnWidth: number): number {
    let height = 0;

    // Header (avatar, name, etc.)
    height += 56;

    // Text content
    if (post.platform === 'twitter') {
      const textLength = post.content.text.length;
      const avgCharsPerLine = Math.floor(columnWidth / 8); // ~8px per char
      const lines = Math.ceil(textLength / avgCharsPerLine);
      height += lines * 24; // ~24px per line
    } else if (post.content.caption) {
      const captionLength = post.content.caption.length;
      const avgCharsPerLine = Math.floor(columnWidth / 8);
      const lines = Math.min(Math.ceil(captionLength / avgCharsPerLine), 4); // Max 4 lines
      height += lines * 20;
    }

    // Media
    if (post.platform === 'twitter' && post.media?.length) {
      const media = post.media[0];
      const aspectRatio = media.aspectRatio ?? 16 / 9;
      height += columnWidth / aspectRatio;
    } else if (post.platform === 'instagram') {
      const aspectRatio = post.media.aspectRatio ?? 1;
      height += columnWidth / aspectRatio;
    }

    // Footer (metrics, timestamp)
    height += 44;

    // Padding
    height += 24;

    return Math.round(height);
  }

  /**
   * Update single item height and recalculate affected items
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

  /**
   * Get CSS variables for animations
   */
  getCSSVariables(): Record<string, string> {
    return {
      '--sm-animation-duration': `${this.options.animationDuration}ms`,
      '--sm-easing': this.options.easing,
      '--sm-gap': typeof this.options.gap === 'number' 
        ? `${this.options.gap}px` 
        : this.options.gap,
      '--sm-column-width': `${this.state.columnWidth}px`,
      '--sm-container-height': `${this.state.containerHeight}px`,
    };
  }
}

/**
 * Create a new layout engine instance
 */
export function createLayoutEngine(options: LayoutEngineOptions): LayoutEngine {
  return new LayoutEngine(options);
}

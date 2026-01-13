/**
 * Social Masonry - React Component
 * Masonry layout for X (Twitter) and Instagram embeds using official widgets
 * Uses absolute positioning with FLIP animations for smooth transitions
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import type {
  SocialMasonryProps,
  SocialPost,
  ItemPosition,
} from '../types';
import {
  defaultColumnConfig,
  generatePostId,
  getColumnCount,
  DEFAULT_TWITTER_HEIGHT,
  DEFAULT_INSTAGRAM_HEIGHT,
} from '../utils';

// ============================================
// Animation Utilities
// ============================================

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// ============================================
// Script Loading
// ============================================

let twitterScriptLoaded = false;
let instagramScriptLoaded = false;

const loadTwitterScript = (): Promise<void> => {
  if (twitterScriptLoaded) return Promise.resolve();
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    if ((window as Window & { twttr?: unknown }).twttr) {
      twitterScriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => {
      twitterScriptLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
};

const loadInstagramScript = (): Promise<void> => {
  if (instagramScriptLoaded) return Promise.resolve();
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    if ((window as Window & { instgrm?: unknown }).instgrm) {
      instagramScriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => {
      instagramScriptLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
};

// ============================================
// Twitter Embed Component
// ============================================

interface TwitterEmbedProps {
  url: string;
  theme?: 'light' | 'dark';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onHeightChange?: (height: number) => void;
}

const TwitterEmbed: React.FC<TwitterEmbedProps> = ({
  url,
  theme = 'light',
  onLoad,
  onError,
  onHeightChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Store callbacks in refs to avoid re-running effect
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onHeightChangeRef = useRef(onHeightChange);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onHeightChangeRef.current = onHeightChange;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Watch for height changes with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          onHeightChangeRef.current?.(height);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const embedContainer = embedRef.current;
    if (!embedContainer) return;

    // Create a fresh container for the widget
    const widgetContainer = document.createElement('div');
    embedContainer.appendChild(widgetContainer);
    setLoading(true);

    loadTwitterScript().then(() => {
      if (!mountedRef.current) return;

      const twttr = (window as Window & { twttr?: { widgets: { createTweet: (id: string, el: HTMLElement, options: Record<string, unknown>) => Promise<HTMLElement | undefined> } } }).twttr;
      if (!twttr) {
        onErrorRef.current?.(new Error('Twitter widgets not loaded'));
        setLoading(false);
        return;
      }

      // Extract tweet ID from URL
      const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
      if (!match) {
        onErrorRef.current?.(new Error('Invalid Twitter URL'));
        setLoading(false);
        return;
      }

      twttr.widgets.createTweet(match[1], widgetContainer, {
        theme,
        conversation: 'none',
        dnt: true,
      }).then((el) => {
        if (!mountedRef.current) return;
        setLoading(false);
        if (el) {
          onLoadRef.current?.();
        } else {
          onErrorRef.current?.(new Error('Tweet not found or unavailable'));
        }
      }).catch((err: Error) => {
        if (!mountedRef.current) return;
        setLoading(false);
        onErrorRef.current?.(err);
      });
    });

    return () => {
      // Safely remove the widget container
      if (embedContainer && widgetContainer.parentNode === embedContainer) {
        embedContainer.removeChild(widgetContainer);
      }
    };
  }, [url, theme]);

  return (
    <div ref={containerRef} className="sm-twitter-embed">
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          backgroundColor: theme === 'dark' ? '#15202b' : '#f5f5f5',
          borderRadius: 12,
        }}>
          <div style={{ color: theme === 'dark' ? '#8899a6' : '#666' }}>
            Loading...
          </div>
        </div>
      )}
      <div ref={embedRef} />
    </div>
  );
};

// ============================================
// Instagram Embed Component
// ============================================

interface InstagramEmbedProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onHeightChange?: (height: number) => void;
}

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({
  url,
  onLoad,
  onError,
  onHeightChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Store callbacks in refs to avoid re-running effect
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onHeightChangeRef = useRef(onHeightChange);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onHeightChangeRef.current = onHeightChange;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Watch for height changes with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          onHeightChangeRef.current?.(height);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const embedContainer = embedRef.current;
    if (!embedContainer) return;

    // Extract post ID from URL
    const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (!match) {
      onErrorRef.current?.(new Error('Invalid Instagram URL'));
      setLoading(false);
      return;
    }

    // Create a fresh container for the widget
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = `
      <blockquote
        class="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink="https://www.instagram.com/p/${match[1]}/"
        data-instgrm-version="14"
        style="
          background:#FFF;
          border:0;
          border-radius:12px;
          box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);
          margin: 0;
          max-width:100%;
          min-width:100%;
          padding:0;
          width:100%;
        "
      >
      </blockquote>
    `;
    embedContainer.appendChild(widgetContainer);

    loadInstagramScript().then(() => {
      if (!mountedRef.current) return;
      const instgrm = (window as Window & { instgrm?: { Embeds: { process: () => void } } }).instgrm;
      if (instgrm) {
        instgrm.Embeds.process();
        setLoading(false);
        onLoadRef.current?.();
      }
    });

    return () => {
      // Safely remove the widget container
      if (embedContainer && widgetContainer.parentNode === embedContainer) {
        embedContainer.removeChild(widgetContainer);
      }
    };
  }, [url]);

  return (
    <div ref={containerRef} className="sm-instagram-embed">
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          backgroundColor: '#fafafa',
          borderRadius: 12,
        }}>
          <div style={{ color: '#666' }}>
            Loading...
          </div>
        </div>
      )}
      <div ref={embedRef} />
    </div>
  );
};

// ============================================
// Layout Calculator
// ============================================

interface LayoutResult {
  positions: Map<string, ItemPosition>;
  containerHeight: number;
  columnWidth: number;
}

// Max widths for embeds
const MAX_TWITTER_WIDTH = 550;
const MAX_INSTAGRAM_WIDTH = 540;
const MAX_EMBED_WIDTH = 550;

function calculateLayout(
  posts: SocialPost[],
  containerWidth: number,
  columnCount: number,
  gap: number,
  itemHeights: Map<string, number>
): LayoutResult {
  // Calculate raw column width
  const rawColumnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
  // Cap column width to max embed width
  const columnWidth = Math.min(rawColumnWidth, MAX_EMBED_WIDTH);

  // Calculate total grid width and offset for centering
  const totalGridWidth = columnWidth * columnCount + gap * (columnCount - 1);
  const offsetX = (containerWidth - totalGridWidth) / 2;

  const columnHeights = new Array(columnCount).fill(0);
  const positions = new Map<string, ItemPosition>();

  for (const post of posts) {
    const postId = generatePostId(post);
    const itemHeight = itemHeights.get(postId) ??
      (post.platform === 'twitter' ? DEFAULT_TWITTER_HEIGHT : DEFAULT_INSTAGRAM_HEIGHT);

    // Find shortest column
    const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

    // Calculate position with centering offset
    const x = offsetX + shortestColumn * (columnWidth + gap);
    const y = columnHeights[shortestColumn];

    // Get max width for this post type
    const maxWidth = post.platform === 'instagram' ? MAX_INSTAGRAM_WIDTH : MAX_TWITTER_WIDTH;
    const itemWidth = Math.min(columnWidth, maxWidth);

    positions.set(postId, {
      id: postId,
      x,
      y,
      width: itemWidth,
      height: itemHeight,
      column: shortestColumn,
    });

    // Update column height
    columnHeights[shortestColumn] = y + itemHeight + gap;
  }

  const containerHeight = Math.max(...columnHeights.map(h => Math.max(0, h - gap)), 0);

  return { positions, containerHeight, columnWidth };
}

// ============================================
// Main Component
// ============================================

export interface SocialMasonryRef {
  addPosts: (posts: SocialPost[]) => void;
  setPosts: (posts: SocialPost[]) => void;
  removePost: (id: string) => void;
  refresh: () => void;
}

export const SocialMasonry = forwardRef<SocialMasonryRef, SocialMasonryProps>(
  (props, ref) => {
    const {
      posts: initialPosts = [],
      gap = 16,
      columns = defaultColumnConfig,
      theme = 'light',
      animate = true,
      animationDuration = 300,
      animationEasing = 'ease-out',
      staggerDelay = 0,
      onEmbedLoad,
      onEmbedError,
      className,
      style,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
    const [containerWidth, setContainerWidth] = useState(0);
    const [columnCount, setColumnCount] = useState(3);
    const [itemHeights, setItemHeights] = useState<Map<string, number>>(new Map());
    const elementRefs = useRef<Map<string, HTMLElement>>(new Map());
    const previousPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    const isAnimatingRef = useRef(false);

    // Update posts when initialPosts changes
    useEffect(() => {
      setPosts(initialPosts);
    }, [initialPosts]);

    // Calculate column count based on container width
    useEffect(() => {
      const updateSize = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
        const count = getColumnCount(columns, width);
        setColumnCount(count);
      };

      updateSize();

      const resizeObserver = new ResizeObserver(updateSize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [columns]);

    // Calculate layout
    const layout = useMemo(() => {
      if (containerWidth === 0) {
        return { positions: new Map<string, ItemPosition>(), containerHeight: 0, columnWidth: 0 };
      }
      return calculateLayout(posts, containerWidth, columnCount, gap, itemHeights);
    }, [posts, containerWidth, columnCount, gap, itemHeights]);

    // Handle item height changes
    const handleHeightChange = useCallback((postId: string, height: number) => {
      setItemHeights(prev => {
        const next = new Map(prev);
        next.set(postId, height);
        return next;
      });
    }, []);

    // Apply FLIP animation when layout changes
    useEffect(() => {
      if (!animate || prefersReducedMotion() || isAnimatingRef.current) return;
      if (previousPositionsRef.current.size === 0) {
        // Store initial positions
        layout.positions.forEach((pos, id) => {
          previousPositionsRef.current.set(id, { x: pos.x, y: pos.y });
        });
        return;
      }

      isAnimatingRef.current = true;
      let animationIndex = 0;

      elementRefs.current.forEach((el, id) => {
        const prevPos = previousPositionsRef.current.get(id);
        const newPos = layout.positions.get(id);

        if (!newPos) return;

        if (!prevPos) {
          // New element - fade in
          el.style.opacity = '0';
          el.style.transform = `translate(${newPos.x}px, ${newPos.y}px) scale(0.95)`;
          const delay = animationIndex * staggerDelay;

          requestAnimationFrame(() => {
            el.style.transition = `opacity ${animationDuration}ms ${animationEasing} ${delay}ms, transform ${animationDuration}ms ${animationEasing} ${delay}ms`;
            el.style.opacity = '1';
            el.style.transform = `translate(${newPos.x}px, ${newPos.y}px) scale(1)`;
          });

          animationIndex++;
          return;
        }

        // Calculate movement
        const deltaX = prevPos.x - newPos.x;
        const deltaY = prevPos.y - newPos.y;

        // Skip if no significant movement
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
          el.style.transform = `translate(${newPos.x}px, ${newPos.y}px)`;
          animationIndex++;
          return;
        }

        // FLIP: Start from old position
        el.style.transition = 'none';
        el.style.transform = `translate(${prevPos.x}px, ${prevPos.y}px)`;

        // Force reflow
        void el.offsetHeight;

        // Animate to new position
        const delay = animationIndex * staggerDelay;
        requestAnimationFrame(() => {
          el.style.transition = `transform ${animationDuration}ms ${animationEasing} ${delay}ms`;
          el.style.transform = `translate(${newPos.x}px, ${newPos.y}px)`;
        });

        animationIndex++;
      });

      // Update stored positions after animation
      const totalDuration = animationDuration + (elementRefs.current.size * staggerDelay);
      setTimeout(() => {
        layout.positions.forEach((pos, id) => {
          previousPositionsRef.current.set(id, { x: pos.x, y: pos.y });
        });
        isAnimatingRef.current = false;
      }, totalDuration);

    }, [layout, animate, animationDuration, animationEasing, staggerDelay]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addPosts: (newPosts: SocialPost[]) => {
        setPosts(prev => [...prev, ...newPosts]);
      },
      setPosts: (newPosts: SocialPost[]) => {
        setPosts(newPosts);
      },
      removePost: (id: string) => {
        setPosts(prev => prev.filter(p => generatePostId(p) !== id));
      },
      refresh: () => {
        // Re-process embeds
        const instgrm = (window as Window & { instgrm?: { Embeds: { process: () => void } } }).instgrm;
        if (instgrm) {
          instgrm.Embeds.process();
        }
      },
    }), []);

    return (
      <div
        ref={containerRef}
        className={`sm-container ${className || ''}`}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: posts.length > 0 ? 200 : undefined,
          height: layout.containerHeight || undefined,
          ...style,
        }}
      >
        {posts.map(post => {
          const postId = generatePostId(post);
          const position = layout.positions.get(postId);

          const setRef = (el: HTMLDivElement | null) => {
            if (el) {
              elementRefs.current.set(postId, el);
            } else {
              elementRefs.current.delete(postId);
            }
          };

          // Before layout is calculated, hide items but keep them in DOM
          const itemStyle: React.CSSProperties = position ? {
            position: 'absolute',
            top: 0,
            left: 0,
            width: position.width,
            transform: `translate(${position.x}px, ${position.y}px)`,
            willChange: animate ? 'transform' : undefined,
          } : {
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            pointerEvents: 'none',
          };

          if (post.platform === 'twitter') {
            return (
              <div
                key={postId}
                ref={setRef}
                className="sm-embed sm-embed--twitter"
                style={itemStyle}
              >
                <TwitterEmbed
                  url={post.url}
                  theme={theme}
                  onLoad={() => onEmbedLoad?.(post)}
                  onError={(error) => onEmbedError?.(post, error)}
                  onHeightChange={(h) => handleHeightChange(postId, h)}
                />
              </div>
            );
          }

          if (post.platform === 'instagram') {
            return (
              <div
                key={postId}
                ref={setRef}
                className="sm-embed sm-embed--instagram"
                style={itemStyle}
              >
                <InstagramEmbed
                  url={post.url}
                  onLoad={() => onEmbedLoad?.(post)}
                  onError={(error) => onEmbedError?.(post, error)}
                  onHeightChange={(h) => handleHeightChange(postId, h)}
                />
              </div>
            );
          }

          return null;
        })}

        {posts.length === 0 && (
          <div
            className="sm-empty"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              color: '#666',
              fontSize: 14,
              width: '100%',
            }}
          >
            No posts to display
          </div>
        )}
      </div>
    );
  }
);

SocialMasonry.displayName = 'SocialMasonry';

export default SocialMasonry;

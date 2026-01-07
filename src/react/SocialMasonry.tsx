/**
 * Social Masonry - React Component
 * Masonry layout for X (Twitter) and Instagram embeds using official widgets
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type {
  SocialMasonryProps,
  SocialPost,
} from '../types';
import {
  defaultColumnConfig,
  generatePostId,
  getColumnCount,
} from '../utils';

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
}

const TwitterEmbed: React.FC<TwitterEmbedProps> = ({
  url,
  theme = 'light',
  onLoad,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
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
        onError?.(new Error('Twitter widgets not loaded'));
        setLoading(false);
        return;
      }

      // Extract tweet ID from URL
      const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
      if (!match) {
        onError?.(new Error('Invalid Twitter URL'));
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
          onLoad?.();
        } else {
          onError?.(new Error('Tweet not found or unavailable'));
        }
      }).catch((err: Error) => {
        if (!mountedRef.current) return;
        setLoading(false);
        onError?.(err);
      });
    });

    return () => {
      // Safely remove the widget container
      if (embedContainer && widgetContainer.parentNode === embedContainer) {
        embedContainer.removeChild(widgetContainer);
      }
    };
  }, [url, theme, onLoad, onError]);

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
}

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({
  url,
  onLoad,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const embedContainer = embedRef.current;
    if (!embedContainer) return;

    // Extract post ID from URL
    const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (!match) {
      onError?.(new Error('Invalid Instagram URL'));
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
        onLoad?.();
      }
    });

    return () => {
      // Safely remove the widget container
      if (embedContainer && widgetContainer.parentNode === embedContainer) {
        embedContainer.removeChild(widgetContainer);
      }
    };
  }, [url, onLoad, onError]);

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
      onEmbedLoad,
      onEmbedError,
      className,
      style,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
    const [columnCount, setColumnCount] = useState(3);

    // Update posts when initialPosts changes
    useEffect(() => {
      setPosts(initialPosts);
    }, [initialPosts]);

    // Calculate column count based on container width
    useEffect(() => {
      const updateColumnCount = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const count = getColumnCount(columns, width);
        setColumnCount(count);
      };

      updateColumnCount();

      const resizeObserver = new ResizeObserver(updateColumnCount);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [columns]);

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

    // Distribute posts into columns (CSS-based masonry simulation)
    const distributeToColumns = useCallback(() => {
      const cols: SocialPost[][] = Array.from({ length: columnCount }, () => []);
      posts.forEach((post, index) => {
        cols[index % columnCount].push(post);
      });
      return cols;
    }, [posts, columnCount]);

    const postColumns = distributeToColumns();

    return (
      <div
        ref={containerRef}
        className={`sm-container ${className || ''}`}
        style={{
          display: 'flex',
          gap,
          width: '100%',
          ...style,
        }}
      >
        {postColumns.map((columnPosts, colIndex) => (
          <div
            key={colIndex}
            className="sm-column"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap,
              minWidth: 0,
            }}
          >
            {columnPosts.map(post => {
              const postId = generatePostId(post);

              if (post.platform === 'twitter') {
                return (
                  <div key={postId} className="sm-embed sm-embed--twitter">
                    <TwitterEmbed
                      url={post.url}
                      theme={theme}
                      onLoad={() => onEmbedLoad?.(post)}
                      onError={(error) => onEmbedError?.(post, error)}
                    />
                  </div>
                );
              }

              if (post.platform === 'instagram') {
                return (
                  <div key={postId} className="sm-embed sm-embed--instagram">
                    <InstagramEmbed
                      url={post.url}
                      onLoad={() => onEmbedLoad?.(post)}
                      onError={(error) => onEmbedError?.(post, error)}
                    />
                  </div>
                );
              }

              return null;
            })}
          </div>
        ))}

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

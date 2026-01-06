/**
 * Social Masonry - React Component
 * Beautiful masonry layout for X (Twitter) and Instagram embeds
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type {
  SocialMasonryProps,
  SocialPost,
  ItemPosition,
  CardConfig,
  VirtualItem,
} from '../types';
import { LayoutEngine } from '../layout-engine';
import { VirtualizationEngine } from '../virtualization-engine';
import {
  defaultColumnConfig,
  formatNumber,
  formatRelativeTime,
  isTwitterPost,
  isInstagramPost,
  debounce,
} from '../utils';

// ============================================
// Icons
// ============================================

const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/>
  </svg>
);

const VerifiedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M8 5v14l11-7z"/>
  </svg>
);

// ============================================
// Card Component
// ============================================

interface CardProps extends CardConfig {
  post: SocialPost;
  position: ItemPosition;
  onPostClick?: (post: SocialPost, event: React.MouseEvent) => void;
  onAuthorClick?: (post: SocialPost, event: React.MouseEvent) => void;
  onMediaClick?: (post: SocialPost, mediaIndex: number, event: React.MouseEvent) => void;
  onHeightChange?: (id: string, height: number) => void;
}

const Card: React.FC<CardProps> = ({
  post,
  position,
  variant = 'default',
  theme = 'auto',
  borderRadius = 12,
  showPlatformIcon = true,
  showAuthor = true,
  showMetrics = true,
  showTimestamp = true,
  formatDate = formatRelativeTime,
  formatNumber: formatNum = formatNumber,
  className = '',
  hoverEffect = true,
  imageLoading = 'lazy',
  fallbackImage = '',
  onPostClick,
  onAuthorClick,
  onMediaClick,
  onHeightChange,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current && onHeightChange) {
      const height = cardRef.current.offsetHeight;
      if (height !== position.height) {
        onHeightChange(post.id, height);
      }
    }
  }, [post.id, position.height, onHeightChange]);

  const handlePostClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) return;
    onPostClick?.(post, e);
  }, [post, onPostClick]);

  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAuthorClick?.(post, e);
  }, [post, onAuthorClick]);

  const handleMediaClick = useCallback((index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onMediaClick?.(post, index, e);
  }, [post, onMediaClick]);

  const classes = [
    'sm-card',
    `sm-card--${post.platform}`,
    `sm-card--${variant}`,
    `sm-card--${theme}`,
    hoverEffect && 'sm-card--hover',
    className,
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: position.width,
    borderRadius: typeof borderRadius === 'number' ? borderRadius : borderRadius,
    cursor: onPostClick ? 'pointer' : undefined,
  };

  const date = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);

  return (
    <div
      ref={cardRef}
      className={classes}
      style={style}
      onClick={handlePostClick}
      data-post-id={post.id}
      data-platform={post.platform}
    >
      {/* Platform Icon */}
      {showPlatformIcon && (
        <div className="sm-card__platform-icon">
          {post.platform === 'twitter' ? (
            <TwitterIcon className="sm-platform-icon sm-platform-icon--twitter" />
          ) : (
            <InstagramIcon className="sm-platform-icon sm-platform-icon--instagram" />
          )}
        </div>
      )}

      {/* Header */}
      {showAuthor && (
        <div 
          className="sm-card__header"
          onClick={onAuthorClick ? handleAuthorClick : undefined}
          style={{ cursor: onAuthorClick ? 'pointer' : undefined }}
        >
          <img
            src={post.author.avatarUrl || fallbackImage}
            alt={post.author.displayName || post.author.username}
            className="sm-card__avatar"
            loading={imageLoading}
            onError={(e) => {
              if (fallbackImage) {
                (e.target as HTMLImageElement).src = fallbackImage;
              }
            }}
          />
          <div className="sm-card__author">
            <span className="sm-card__author-name">
              {post.author.displayName || post.author.username}
              {post.author.verified && <VerifiedIcon className="sm-card__verified" />}
            </span>
            <span className="sm-card__author-handle">@{post.author.username}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="sm-card__content">
        {isTwitterPost(post) && (
          <p className="sm-card__text">{post.content.text}</p>
        )}
        {isInstagramPost(post) && post.content.caption && (
          <p className="sm-card__caption">
            {post.content.caption.length > 150 
              ? `${post.content.caption.substring(0, 150)}...` 
              : post.content.caption}
          </p>
        )}
      </div>

      {/* Media */}
      {isTwitterPost(post) && post.media && post.media.length > 0 && (
        <div className={`sm-card__media ${post.media.length > 1 ? `sm-card__media-grid sm-card__media-grid--${Math.min(post.media.length, 4)}` : ''}`}>
          {post.media.slice(0, 4).map((media, index) => (
            <div
              key={index}
              className={`sm-card__media-item ${media.type !== 'image' ? 'sm-card__media-item--video' : ''}`}
              onClick={onMediaClick ? handleMediaClick(index) : undefined}
              style={{ cursor: onMediaClick ? 'pointer' : undefined }}
            >
              <img
                src={media.thumbnailUrl || media.url}
                alt="Post media"
                loading={imageLoading}
                onError={(e) => {
                  if (fallbackImage) {
                    (e.target as HTMLImageElement).src = fallbackImage;
                  }
                }}
              />
              {(media.type === 'video' || media.type === 'gif') && (
                <div className="sm-card__play-button">
                  <PlayIcon />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isInstagramPost(post) && (
        <div 
          className="sm-card__media"
          style={{ aspectRatio: post.media.aspectRatio || 1 }}
        >
          <img
            src={post.media.thumbnailUrl || post.media.url}
            alt="Post media"
            loading={imageLoading}
            onError={(e) => {
              if (fallbackImage) {
                (e.target as HTMLImageElement).src = fallbackImage;
              }
            }}
          />
          {post.media.type === 'video' && (
            <div className="sm-card__play-button">
              <PlayIcon />
            </div>
          )}
          {post.media.type === 'carousel' && (
            <div className="sm-card__carousel-indicator">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M6 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm12 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {(showMetrics || showTimestamp) && (
        <div className="sm-card__footer">
          {showMetrics && post.metrics && (
            <div className="sm-card__metrics">
              {isTwitterPost(post) && (
                <>
                  {post.metrics.replies !== undefined && (
                    <span className="sm-card__metric">
                      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>
                      {formatNum(post.metrics.replies)}
                    </span>
                  )}
                  {post.metrics.retweets !== undefined && (
                    <span className="sm-card__metric">
                      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
                      {formatNum(post.metrics.retweets)}
                    </span>
                  )}
                  {post.metrics.likes !== undefined && (
                    <span className="sm-card__metric">
                      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
                      {formatNum(post.metrics.likes)}
                    </span>
                  )}
                </>
              )}
              {isInstagramPost(post) && (
                <>
                  {post.metrics.likes !== undefined && (
                    <span className="sm-card__metric">
                      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218z"/></svg>
                      {formatNum(post.metrics.likes)}
                    </span>
                  )}
                  {post.metrics.comments !== undefined && (
                    <span className="sm-card__metric">
                      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22l-1.344-4.992zM10 12a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm-4 0a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm8 0a1 1 0 1 1 1 1 1 1 0 0 1-1-1z"/></svg>
                      {formatNum(post.metrics.comments)}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
          {showTimestamp && (
            <time className="sm-card__timestamp" dateTime={date.toISOString()}>
              {formatDate(date)}
            </time>
          )}
        </div>
      )}
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
  scrollToPost: (id: string, behavior?: ScrollBehavior) => void;
}

export const SocialMasonry = forwardRef<SocialMasonryRef, SocialMasonryProps>(
  (props, ref) => {
    const {
      posts: initialPosts = [],
      gap = 16,
      columns = defaultColumnConfig,
      padding = 0,
      animationDuration = 300,
      animate = true,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      virtualization,
      loadMoreThreshold = 500,
      onLoadMore,
      onLayoutComplete,
      className,
      style,
      ...cardProps
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
    const [positions, setPositions] = useState<Map<string, ItemPosition>>(new Map());
    const [containerHeight, setContainerHeight] = useState(0);
    const [itemHeights] = useState(() => new Map<string, number>());
    const [visibleItems, setVisibleItems] = useState<VirtualItem[]>([]);

    const layoutEngine = useMemo(() => {
      return new LayoutEngine({
        gap,
        columns,
        padding,
        animationDuration,
        animate,
        easing,
        containerWidth: containerRef.current?.clientWidth || 800,
        itemHeights,
      });
    }, [gap, columns, padding, animationDuration, animate, easing]);

    const virtualizationEngine = useMemo(() => {
      if (!virtualization?.enabled) return null;
      return new VirtualizationEngine({
        ...virtualization,
        posts,
        positions,
        onVisibleItemsChange: setVisibleItems,
      });
    }, [virtualization?.enabled]);

    // Calculate layout
    const calculateLayout = useCallback(() => {
      if (!containerRef.current) return;
      
      layoutEngine.setContainerWidth(containerRef.current.clientWidth);
      const state = layoutEngine.calculate(posts);
      
      setPositions(state.positions);
      setContainerHeight(state.containerHeight);
      
      if (virtualizationEngine) {
        virtualizationEngine.update(posts, state.positions);
        setVisibleItems(virtualizationEngine.calculateVisibleItems());
      }
      
      onLayoutComplete?.(Array.from(state.positions.values()));
    }, [posts, layoutEngine, virtualizationEngine, onLayoutComplete]);

    // Handle resize
    useEffect(() => {
      const handleResize = debounce(() => {
        calculateLayout();
      }, 150);

      const resizeObserver = new ResizeObserver(handleResize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, [calculateLayout]);

    // Initial layout
    useEffect(() => {
      calculateLayout();
    }, [posts, calculateLayout]);

    // Initialize virtualization
    useEffect(() => {
      if (virtualizationEngine) {
        virtualizationEngine.init();
        return () => virtualizationEngine.destroy();
      }
      return undefined;
    }, [virtualizationEngine]);

    // Handle height change
    const handleHeightChange = useCallback((id: string, height: number) => {
      itemHeights.set(id, height);
      calculateLayout();
    }, [itemHeights, calculateLayout]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addPosts: (newPosts: SocialPost[]) => {
        setPosts(prev => [...prev, ...newPosts]);
      },
      setPosts: (newPosts: SocialPost[]) => {
        itemHeights.clear();
        setPosts(newPosts);
      },
      removePost: (id: string) => {
        itemHeights.delete(id);
        setPosts(prev => prev.filter(p => p.id !== id));
      },
      refresh: () => {
        itemHeights.clear();
        calculateLayout();
      },
      scrollToPost: (id: string, behavior: ScrollBehavior = 'smooth') => {
        const position = positions.get(id);
        if (position) {
          window.scrollTo({ top: position.y, behavior });
        }
      },
    }), [positions, calculateLayout, itemHeights]);

    // Determine which posts to render
    const postsToRender = virtualizationEngine
      ? visibleItems.map(item => item.post)
      : posts;

    return (
      <div
        ref={containerRef}
        className={`sm-container ${className || ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: containerHeight,
          ...style,
        }}
      >
        {postsToRender.map(post => {
          const position = positions.get(post.id);
          if (!position) return null;

          // Extract event handlers and adapt types
          const { onPostClick, onAuthorClick, onMediaClick, ...restCardProps } = cardProps;

          return (
            <Card
              key={post.id}
              post={post}
              position={position}
              onHeightChange={handleHeightChange}
              onPostClick={onPostClick ? (p, e) => onPostClick(p, e.nativeEvent) : undefined}
              onAuthorClick={onAuthorClick ? (p, e) => onAuthorClick(p, e.nativeEvent) : undefined}
              onMediaClick={onMediaClick ? (p, i, e) => onMediaClick(p, i, e.nativeEvent) : undefined}
              {...restCardProps}
            />
          );
        })}
        
        {posts.length === 0 && (
          <div className="sm-empty">
            No posts to display
          </div>
        )}
      </div>
    );
  }
);

SocialMasonry.displayName = 'SocialMasonry';

export default SocialMasonry;

/**
 * Social Masonry - Card Renderer
 * Renders social media post cards with proper styling
 */

import type {
  CardConfig,
  InstagramPost,
  ItemPosition,
  SocialPost,
  TwitterPost,
} from './types';
import {
  formatNumber as defaultFormatNumber,
  formatRelativeTime,
  isTwitterPost,
  isInstagramPost,
} from './utils';

export interface CardRendererOptions extends CardConfig {
  onPostClick?: (post: SocialPost, event: MouseEvent) => void;
  onAuthorClick?: (post: SocialPost, event: MouseEvent) => void;
  onMediaClick?: (post: SocialPost, mediaIndex: number, event: MouseEvent) => void;
  onImageError?: (post: SocialPost, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<CardConfig> = {
  variant: 'default',
  theme: 'auto',
  borderRadius: 12,
  showPlatformIcon: true,
  showAuthor: true,
  showMetrics: true,
  showTimestamp: true,
  formatDate: (date: Date) => formatRelativeTime(date),
  formatNumber: defaultFormatNumber,
  className: '',
  hoverEffect: true,
  imageLoading: 'lazy',
  fallbackImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E',
};

export class CardRenderer {
  private options: Required<CardRendererOptions>;

  constructor(options: CardRendererOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      onPostClick: undefined,
      onAuthorClick: undefined,
      onMediaClick: undefined,
      onImageError: undefined,
      ...options,
    } as Required<CardRendererOptions>;
  }

  /**
   * Render a single card
   */
  render(post: SocialPost, position: ItemPosition): HTMLElement {
    const card = document.createElement('div');
    card.className = this.getCardClasses(post);
    card.setAttribute('data-post-id', post.id);
    card.setAttribute('data-platform', post.platform);
    
    // Apply position styles
    Object.assign(card.style, {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
      borderRadius: typeof this.options.borderRadius === 'number'
        ? `${this.options.borderRadius}px`
        : this.options.borderRadius,
    });

    // Build card content
    card.innerHTML = this.buildCardHTML(post);

    // Attach event listeners
    this.attachEventListeners(card, post);

    return card;
  }

  /**
   * Get CSS classes for card
   */
  private getCardClasses(post: SocialPost): string {
    const classes = [
      'sm-card',
      `sm-card--${post.platform}`,
      `sm-card--${this.options.variant}`,
      `sm-card--${this.options.theme}`,
    ];

    if (this.options.hoverEffect) {
      classes.push('sm-card--hover');
    }

    if (this.options.className) {
      classes.push(this.options.className);
    }

    return classes.join(' ');
  }

  /**
   * Build card HTML
   */
  private buildCardHTML(post: SocialPost): string {
    const parts: string[] = [];

    // Platform icon
    if (this.options.showPlatformIcon) {
      parts.push(this.renderPlatformIcon(post.platform));
    }

    // Header with author
    if (this.options.showAuthor) {
      parts.push(this.renderHeader(post));
    }

    // Content
    parts.push(this.renderContent(post));

    // Media
    parts.push(this.renderMedia(post));

    // Footer with metrics
    if (this.options.showMetrics || this.options.showTimestamp) {
      parts.push(this.renderFooter(post));
    }

    return parts.join('');
  }

  /**
   * Render platform icon
   */
  private renderPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      twitter: `<svg viewBox="0 0 24 24" class="sm-platform-icon sm-platform-icon--twitter"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      instagram: `<svg viewBox="0 0 24 24" class="sm-platform-icon sm-platform-icon--instagram"><path fill="currentColor" d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>`,
    };

    return `<div class="sm-card__platform-icon">${icons[platform] || ''}</div>`;
  }

  /**
   * Render card header
   */
  private renderHeader(post: SocialPost): string {
    const author = post.author;
    const avatarUrl = author.avatarUrl || this.options.fallbackImage;
    const verifiedBadge = author.verified
      ? `<svg class="sm-card__verified" viewBox="0 0 24 24"><path fill="currentColor" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>`
      : '';

    return `
      <div class="sm-card__header">
        <img 
          src="${avatarUrl}" 
          alt="${author.displayName || author.username}" 
          class="sm-card__avatar"
          loading="${this.options.imageLoading}"
          onerror="this.src='${this.options.fallbackImage}'"
        />
        <div class="sm-card__author">
          <span class="sm-card__author-name">
            ${author.displayName || author.username}
            ${verifiedBadge}
          </span>
          <span class="sm-card__author-handle">@${author.username}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render card content
   */
  private renderContent(post: SocialPost): string {
    if (isTwitterPost(post)) {
      return this.renderTwitterContent(post);
    } else if (isInstagramPost(post)) {
      return this.renderInstagramContent(post);
    }
    return '';
  }

  /**
   * Render Twitter content
   */
  private renderTwitterContent(post: TwitterPost): string {
    const text = post.content.html || this.linkifyText(post.content.text);
    
    let quotedPost = '';
    if (post.quotedPost) {
      quotedPost = `
        <div class="sm-card__quoted">
          <div class="sm-card__quoted-header">
            <span class="sm-card__quoted-name">${post.quotedPost.author.displayName}</span>
            <span class="sm-card__quoted-handle">@${post.quotedPost.author.username}</span>
          </div>
          <div class="sm-card__quoted-text">${post.quotedPost.content.text}</div>
        </div>
      `;
    }

    return `
      <div class="sm-card__content">
        <p class="sm-card__text">${text}</p>
        ${quotedPost}
      </div>
    `;
  }

  /**
   * Render Instagram content
   */
  private renderInstagramContent(post: InstagramPost): string {
    if (!post.content.caption) return '';
    
    // Truncate caption if too long
    const maxLength = 150;
    let caption = post.content.caption;
    let showMore = false;
    
    if (caption.length > maxLength) {
      caption = caption.substring(0, maxLength);
      showMore = true;
    }

    return `
      <div class="sm-card__content">
        <p class="sm-card__caption">
          ${this.linkifyText(caption)}${showMore ? '<span class="sm-card__more">... more</span>' : ''}
        </p>
      </div>
    `;
  }

  /**
   * Render media
   */
  private renderMedia(post: SocialPost): string {
    if (isTwitterPost(post)) {
      return this.renderTwitterMedia(post);
    } else if (isInstagramPost(post)) {
      return this.renderInstagramMedia(post);
    }
    return '';
  }

  /**
   * Render Twitter media
   */
  private renderTwitterMedia(post: TwitterPost): string {
    if (!post.media?.length) return '';

    const mediaCount = post.media.length;
    const gridClass = mediaCount > 1 ? `sm-card__media-grid sm-card__media-grid--${Math.min(mediaCount, 4)}` : '';

    const mediaItems = post.media.slice(0, 4).map((media, index) => {
      if (media.type === 'video' || media.type === 'gif') {
        return `
          <div class="sm-card__media-item sm-card__media-item--video" data-index="${index}">
            <img 
              src="${media.thumbnailUrl || media.url}" 
              alt="Video thumbnail"
              loading="${this.options.imageLoading}"
              onerror="this.src='${this.options.fallbackImage}'"
            />
            <div class="sm-card__play-button">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        `;
      }
      
      return `
        <div class="sm-card__media-item" data-index="${index}">
          <img 
            src="${media.url}" 
            alt="Post media"
            loading="${this.options.imageLoading}"
            onerror="this.src='${this.options.fallbackImage}'"
          />
        </div>
      `;
    }).join('');

    return `<div class="sm-card__media ${gridClass}">${mediaItems}</div>`;
  }

  /**
   * Render Instagram media
   */
  private renderInstagramMedia(post: InstagramPost): string {
    const media = post.media;
    const aspectRatio = media.aspectRatio || 1;
    
    if (media.type === 'carousel' && media.carouselItems?.length) {
      return `
        <div class="sm-card__media sm-card__carousel" style="aspect-ratio: ${aspectRatio}">
          <img 
            src="${media.carouselItems[0].url}" 
            alt="Post media"
            loading="${this.options.imageLoading}"
            onerror="this.src='${this.options.fallbackImage}'"
          />
          <div class="sm-card__carousel-indicator">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm12 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
          </div>
        </div>
      `;
    }

    if (media.type === 'video') {
      return `
        <div class="sm-card__media sm-card__media--video" style="aspect-ratio: ${aspectRatio}">
          <img 
            src="${media.thumbnailUrl || media.url}" 
            alt="Video thumbnail"
            loading="${this.options.imageLoading}"
            onerror="this.src='${this.options.fallbackImage}'"
          />
          <div class="sm-card__play-button">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      `;
    }

    return `
      <div class="sm-card__media" style="aspect-ratio: ${aspectRatio}">
        <img 
          src="${media.url}" 
          alt="Post media"
          loading="${this.options.imageLoading}"
          onerror="this.src='${this.options.fallbackImage}'"
        />
      </div>
    `;
  }

  /**
   * Render footer with metrics
   */
  private renderFooter(post: SocialPost): string {
    const parts: string[] = [];

    if (this.options.showMetrics && post.metrics) {
      parts.push(this.renderMetrics(post));
    }

    if (this.options.showTimestamp) {
      const date = post.createdAt instanceof Date 
        ? post.createdAt 
        : new Date(post.createdAt);
      parts.push(`
        <time class="sm-card__timestamp" datetime="${date.toISOString()}">
          ${this.options.formatDate(date)}
        </time>
      `);
    }

    return `<div class="sm-card__footer">${parts.join('')}</div>`;
  }

  /**
   * Render metrics
   */
  private renderMetrics(post: SocialPost): string {
    if (!post.metrics) return '';

    const formatNum = this.options.formatNumber;

    if (isTwitterPost(post)) {
      const metrics = post.metrics;
      return `
        <div class="sm-card__metrics">
          ${metrics.replies !== undefined ? `
            <span class="sm-card__metric">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>
              ${formatNum(metrics.replies)}
            </span>
          ` : ''}
          ${metrics.retweets !== undefined ? `
            <span class="sm-card__metric">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
              ${formatNum(metrics.retweets)}
            </span>
          ` : ''}
          ${metrics.likes !== undefined ? `
            <span class="sm-card__metric">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
              ${formatNum(metrics.likes)}
            </span>
          ` : ''}
          ${metrics.views !== undefined ? `
            <span class="sm-card__metric">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>
              ${formatNum(metrics.views)}
            </span>
          ` : ''}
        </div>
      `;
    }

    if (isInstagramPost(post)) {
      const metrics = post.metrics;
      return `
        <div class="sm-card__metrics">
          ${metrics.likes !== undefined ? `
            <span class="sm-card__metric">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218z"/></svg>
              ${formatNum(metrics.likes)}
            </span>
          ` : ''}
          ${metrics.comments !== undefined ? `
            <span class="sm-card__metric">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22l-1.344-4.992zM10 12a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm-4 0a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm8 0a1 1 0 1 1 1 1 1 1 0 0 1-1-1z"/></svg>
              ${formatNum(metrics.comments)}
            </span>
          ` : ''}
        </div>
      `;
    }

    return '';
  }

  /**
   * Linkify text (URLs, mentions, hashtags)
   */
  private linkifyText(text: string): string {
    // Escape HTML
    let result = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // URLs
    result = result.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="sm-card__link">$1</a>'
    );

    // Mentions
    result = result.replace(
      /@(\w+)/g,
      '<a href="#" class="sm-card__mention" data-username="$1">@$1</a>'
    );

    // Hashtags
    result = result.replace(
      /#(\w+)/g,
      '<a href="#" class="sm-card__hashtag" data-tag="$1">#$1</a>'
    );

    return result;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(card: HTMLElement, post: SocialPost): void {
    // Post click
    if (this.options.onPostClick) {
      card.addEventListener('click', (e) => {
        // Don't fire for links, buttons, etc.
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' || target.closest('a')) return;
        
        this.options.onPostClick?.(post, e);
      });
      card.style.cursor = 'pointer';
    }

    // Author click
    if (this.options.onAuthorClick) {
      const header = card.querySelector('.sm-card__header');
      if (header) {
        header.addEventListener('click', (e) => {
          e.stopPropagation();
          this.options.onAuthorClick?.(post, e as MouseEvent);
        });
        (header as HTMLElement).style.cursor = 'pointer';
      }
    }

    // Media click
    if (this.options.onMediaClick) {
      const mediaItems = card.querySelectorAll('.sm-card__media-item');
      mediaItems.forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const index = parseInt((item as HTMLElement).dataset.index || '0', 10);
          this.options.onMediaClick?.(post, index, e as MouseEvent);
        });
        (item as HTMLElement).style.cursor = 'pointer';
      });
    }

    // Image error handling
    if (this.options.onImageError) {
      const images = card.querySelectorAll('img');
      images.forEach((img) => {
        img.addEventListener('error', () => {
          this.options.onImageError?.(post, new Error('Image failed to load'));
        });
      });
    }
  }

  /**
   * Update card position
   */
  updatePosition(card: HTMLElement, position: ItemPosition): void {
    Object.assign(card.style, {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
    });
  }

  /**
   * Update options
   */
  setOptions(options: Partial<CardRendererOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Create a new card renderer instance
 */
export function createCardRenderer(options?: CardRendererOptions): CardRenderer {
  return new CardRenderer(options);
}

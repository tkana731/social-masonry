import { describe, it, expect } from 'vitest';
import {
  extractTweetId,
  extractInstagramId,
  detectPlatform,
  generatePostId,
  getColumnCount,
  getTwitterEmbedUrl,
  getInstagramEmbedUrl,
} from '../utils';
import type { SocialPost, ColumnConfig } from '../types';

describe('extractTweetId', () => {
  it('should extract tweet ID from twitter.com URL', () => {
    expect(extractTweetId('https://twitter.com/user/status/1234567890')).toBe('1234567890');
  });

  it('should extract tweet ID from x.com URL', () => {
    expect(extractTweetId('https://x.com/user/status/9876543210')).toBe('9876543210');
  });

  it('should return null for invalid URLs', () => {
    expect(extractTweetId('https://example.com')).toBeNull();
    expect(extractTweetId('')).toBeNull();
  });
});

describe('extractInstagramId', () => {
  it('should extract post ID from Instagram post URL', () => {
    expect(extractInstagramId('https://instagram.com/p/ABC123xyz')).toBe('ABC123xyz');
  });

  it('should extract post ID from Instagram reel URL', () => {
    expect(extractInstagramId('https://instagram.com/reel/XYZ789abc')).toBe('XYZ789abc');
  });

  it('should return null for invalid URLs', () => {
    expect(extractInstagramId('https://example.com')).toBeNull();
    expect(extractInstagramId('')).toBeNull();
  });
});

describe('detectPlatform', () => {
  it('should detect Twitter platform', () => {
    expect(detectPlatform('https://twitter.com/user/status/123')).toBe('twitter');
    expect(detectPlatform('https://x.com/user/status/123')).toBe('twitter');
  });

  it('should detect Instagram platform', () => {
    expect(detectPlatform('https://instagram.com/p/ABC123')).toBe('instagram');
    expect(detectPlatform('https://instagram.com/reel/ABC123')).toBe('instagram');
  });

  it('should return null for unknown URLs', () => {
    expect(detectPlatform('https://example.com')).toBeNull();
  });
});

describe('generatePostId', () => {
  it('should use provided id if available', () => {
    const post: SocialPost = { id: 'custom-id', platform: 'twitter', url: 'https://x.com/u/status/123' };
    expect(generatePostId(post)).toBe('custom-id');
  });

  it('should generate ID from Twitter URL', () => {
    const post: SocialPost = { platform: 'twitter', url: 'https://x.com/user/status/123456' };
    expect(generatePostId(post)).toBe('tw-123456');
  });

  it('should generate ID from Instagram URL', () => {
    const post: SocialPost = { platform: 'instagram', url: 'https://instagram.com/p/ABC123' };
    expect(generatePostId(post)).toBe('ig-ABC123');
  });
});

describe('getTwitterEmbedUrl', () => {
  it('should generate basic embed URL', () => {
    const url = getTwitterEmbedUrl('123456');
    expect(url).toContain('platform.twitter.com/embed/Tweet.html');
    expect(url).toContain('id=123456');
  });

  it('should include theme parameter', () => {
    const url = getTwitterEmbedUrl('123456', { theme: 'dark' });
    expect(url).toContain('theme=dark');
  });
});

describe('getInstagramEmbedUrl', () => {
  it('should generate embed URL', () => {
    const url = getInstagramEmbedUrl('ABC123');
    expect(url).toBe('https://www.instagram.com/p/ABC123/embed/');
  });
});

describe('getColumnCount', () => {
  const config: ColumnConfig[] = [
    { minWidth: 0, columns: 1 },
    { minWidth: 640, columns: 2 },
    { minWidth: 1024, columns: 3 },
  ];

  it('should return correct column count for width', () => {
    expect(getColumnCount(config, 320)).toBe(1);
    expect(getColumnCount(config, 640)).toBe(2);
    expect(getColumnCount(config, 800)).toBe(2);
    expect(getColumnCount(config, 1024)).toBe(3);
    expect(getColumnCount(config, 1920)).toBe(3);
  });

  it('should return number directly if columns is a number', () => {
    expect(getColumnCount(4, 320)).toBe(4);
    expect(getColumnCount(2, 1920)).toBe(2);
  });
});

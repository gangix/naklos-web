// src/content/loader.test.ts
import { describe, it, expect } from 'vitest';
import { listPosts, getPost, getPostWithFallback } from './loader';

describe('loader (reads src/content/blog/**/*.md)', () => {
  it('lists TR posts including yakit-takibi', () => {
    const posts = listPosts('tr');
    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(posts[0].frontmatter.slug).toBe('yakit-takibi-nasil-yapilir');
  });

  it('returns undefined for unknown slug', () => {
    expect(getPost('nonexistent', 'tr')).toBeUndefined();
  });

  it('falls back to TR when a locale has no post for the slug', () => {
    const result = getPostWithFallback('yakit-takibi-nasil-yapilir', 'en');
    expect(result).toBeDefined();
    expect(result!.usedFallback).toBe(true);
    expect(result!.post.frontmatter.locale).toBe('tr');
  });

  it('does not fall back when the post exists in the requested locale', () => {
    const result = getPostWithFallback('yakit-takibi-nasil-yapilir', 'tr');
    expect(result).toBeDefined();
    expect(result!.usedFallback).toBe(false);
  });
});

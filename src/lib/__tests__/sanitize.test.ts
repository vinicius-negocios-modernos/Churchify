import { sanitizeHtml } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('<p>Hello</p>');
    expect(result).toContain('<p>World</p>');
  });

  it('removes iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    expect(sanitizeHtml(input)).not.toContain('<iframe');
  });

  it('removes event handler attributes', () => {
    const input = '<img src="photo.jpg" onerror="alert(1)">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onerror');
    expect(result).toContain('src="photo.jpg"');
  });

  it('removes onclick attributes', () => {
    const input = '<div onclick="steal()">Click me</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('removes javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('preserves safe HTML', () => {
    const input = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('preserves image data URLs', () => {
    const input = '<img src="data:image/png;base64,abc123">';
    expect(sanitizeHtml(input)).toContain('data:image/png');
  });

  it('removes non-image data URLs', () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data:text/html');
  });

  it('removes object and embed tags', () => {
    const input = '<object data="x"><embed src="y"></object>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
  });

  it('handles empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});

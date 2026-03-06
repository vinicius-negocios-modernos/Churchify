/**
 * Lightweight HTML sanitizer that strips dangerous tags and attributes.
 * For production use with untrusted HTML, consider DOMPurify.
 */

const DANGEROUS_TAGS = /(<\s*\/?\s*(?:script|iframe|object|embed|form|input|button|link|meta|style|base|applet)\b[^>]*>)/gi;
const EVENT_ATTRS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URLS = /\s+(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;
const DATA_URLS = /\s+(?:href|src)\s*=\s*(?:"data:(?!image\/)[^"]*"|'data:(?!image\/)[^']*')/gi;

export function sanitizeHtml(html: string): string {
  let sanitized = html;

  // Remove dangerous tags (script, iframe, etc.)
  sanitized = sanitized.replace(DANGEROUS_TAGS, '');

  // Remove event handler attributes (onclick, onerror, etc.)
  sanitized = sanitized.replace(EVENT_ATTRS, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(JAVASCRIPT_URLS, '');

  // Remove non-image data: URLs
  sanitized = sanitized.replace(DATA_URLS, '');

  return sanitized;
}

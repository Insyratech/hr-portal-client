/** Plain-text extract for one-line previews. */
export function richTextToPlain(html: string): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = html;
    return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
  }
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isRichTextEmpty(html: string): boolean {
  return richTextToPlain(html).length === 0;
}

export function richTextPreview(html: string, maxLen = 110): string {
  const plain = richTextToPlain(html);
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trimEnd()}…`;
}

export function richTextStats(html: string): { words: number; chars: number } {
  const plain = richTextToPlain(html);
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  return { words, chars: plain.length };
}

const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'HR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'STRIKE',
  'SUB',
  'SUP',
  'UL',
  'OL',
  'LI',
  'A',
  'H2',
  'H3',
  'H4',
  'BLOCKQUOTE',
  'DIV',
  'SPAN',
]);

const ALLOWED_CLASSES = new Set([
  'list-check',
  'align-left',
  'align-center',
  'align-right',
  'align-justify',
]);

const LIST_STYLE_TYPES = new Set([
  'disc',
  'circle',
  'square',
  'decimal',
  'lower-alpha',
  'upper-alpha',
  'lower-roman',
  'upper-roman',
  'none',
]);

const TEXT_ALIGNS = new Set(['left', 'center', 'right', 'justify']);
const OL_TYPES = new Set(['1', 'a', 'A', 'i', 'I']);

function sanitizeStyle(el: HTMLElement) {
  const style = el.getAttribute('style') ?? '';
  const kept: string[] = [];
  const listMatch = style.match(/list-style-type\s*:\s*([a-z-]+)/i);
  if (listMatch && LIST_STYLE_TYPES.has(listMatch[1].toLowerCase())) {
    kept.push(`list-style-type: ${listMatch[1].toLowerCase()}`);
  }
  const alignMatch = style.match(/text-align\s*:\s*([a-z]+)/i);
  if (alignMatch && TEXT_ALIGNS.has(alignMatch[1].toLowerCase())) {
    kept.push(`text-align: ${alignMatch[1].toLowerCase()}`);
  }
  if (kept.length) el.setAttribute('style', kept.join('; '));
  else el.removeAttribute('style');
}

function sanitizeClass(el: HTMLElement) {
  const next = (el.getAttribute('class') ?? '')
    .split(/\s+/)
    .filter((name) => ALLOWED_CLASSES.has(name));
  if (next.length) el.setAttribute('class', next.join(' '));
  else el.removeAttribute('class');
}

/** Allowlist sanitizer for stored milestone HTML (editor + read views). */
export function sanitizeRichText(html: string): string {
  if (!html || typeof document === 'undefined') {
    return (html || '').trim();
  }
  const template = document.createElement('template');
  template.innerHTML = html;
  const walk = (node: Node) => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName;
        if (!ALLOWED_TAGS.has(tag)) {
          const text = document.createTextNode(el.textContent ?? '');
          el.replaceWith(text);
          continue;
        }
        if (tag === 'A') {
          const href = el.getAttribute('href')?.trim() ?? '';
          [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
          if (/^https?:\/\//i.test(href) || href.startsWith('mailto:')) {
            el.setAttribute('href', href);
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          } else {
            const text = document.createTextNode(el.textContent ?? '');
            el.replaceWith(text);
            continue;
          }
        } else if (tag === 'HR' || tag === 'BR') {
          [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
        } else if (
          tag === 'OL' ||
          tag === 'UL' ||
          tag === 'LI' ||
          tag === 'P' ||
          tag === 'DIV' ||
          tag === 'H2' ||
          tag === 'H3' ||
          tag === 'H4' ||
          tag === 'BLOCKQUOTE' ||
          tag === 'SPAN'
        ) {
          const type = tag === 'OL' ? el.getAttribute('type') ?? '' : '';
          const style = el.getAttribute('style');
          const className = el.getAttribute('class');
          [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
          if (tag === 'OL' && OL_TYPES.has(type)) el.setAttribute('type', type);
          if (style) {
            el.setAttribute('style', style);
            sanitizeStyle(el);
          }
          if (className) {
            el.setAttribute('class', className);
            sanitizeClass(el);
          }
        } else {
          [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
        }
        walk(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
  };
  walk(template.content);
  return template.innerHTML.trim();
}

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { isRichTextEmpty, richTextStats, sanitizeRichText } from '@/lib/rich-text';

type Props = {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
};

type MenuId = 'style' | 'bullets' | 'numbers' | null;

const RIBBON_BTN =
  'inline-flex h-8 min-w-8 items-center justify-center rounded border border-border bg-background px-2 text-xs text-foreground shadow-sm transition-colors hover:bg-surface';

function AlignIcon({ kind }: { kind: 'left' | 'center' | 'right' | 'justify' }) {
  const lines =
    kind === 'left'
      ? [
          [3, 6, 14],
          [3, 10, 18],
          [3, 14, 12],
          [3, 18, 16],
        ]
      : kind === 'center'
        ? [
            [5, 6, 14],
            [3, 10, 18],
            [6, 14, 12],
            [4, 18, 16],
          ]
        : kind === 'right'
          ? [
              [7, 6, 14],
              [3, 10, 18],
              [9, 14, 12],
              [5, 18, 16],
            ]
          : [
              [3, 6, 18],
              [3, 10, 18],
              [3, 14, 18],
              [3, 18, 18],
            ];
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {lines.map(([x, y, width], index) => (
        <line key={index} x1={x} y1={y} x2={x + width} y2={y} strokeLinecap="round" />
      ))}
    </svg>
  );
}

function IndentIcon({ direction }: { direction: 'in' | 'out' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
      <line x1="12" y1="12" x2="20" y2="12" strokeLinecap="round" />
      <line x1="12" y1="18" x2="20" y2="18" strokeLinecap="round" />
      {direction === 'in' ? (
        <polyline points="4,10 8,14 4,18" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <polyline points="8,10 4,14 8,18" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function ToolbarButton({
  label,
  title,
  onMouseDown,
  active,
  className,
}: {
  label: ReactNode;
  title: string;
  onMouseDown: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={cn(RIBBON_BTN, active ? 'border-foreground bg-surface' : null, className)}
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown();
      }}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 hidden h-6 w-px shrink-0 self-center bg-border sm:inline-block" aria-hidden />;
}

function ToolbarMenu({
  id,
  open,
  setOpen,
  label,
  title,
  children,
}: {
  id: Exclude<MenuId, null>;
  open: MenuId;
  setOpen: (id: MenuId) => void;
  label: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const isOpen = open === id;
  return (
    <div className="relative">
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
        className={cn(RIBBON_BTN, 'gap-1 px-2.5 font-medium', isOpen ? 'border-foreground bg-surface' : null)}
        onMouseDown={(event) => {
          event.preventDefault();
          setOpen(isOpen ? null : id);
        }}
      >
        {label}
        <span className="text-[0.65rem] text-muted" aria-hidden>
          ▾
        </span>
      </button>
      {isOpen ? (
        <div
          className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[11rem] overflow-hidden rounded-md border border-border bg-background py-1 shadow-card"
          onMouseDown={(event) => event.preventDefault()}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  label,
  hint,
  onSelect,
}: {
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm text-foreground hover:bg-surface"
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect();
      }}
    >
      <span>{label}</span>
      {hint ? <span className="font-mono text-xs text-muted">{hint}</span> : null}
    </button>
  );
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = 'Write a detailed description…',
  className,
  minHeightClassName = 'min-h-[9rem]',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuId>(null);
  const stats = richTextStats(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    const next = value || '';
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value]);

  useEffect(() => {
    if (!menu) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenu(null);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menu]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    const html = sanitizeRichText(el.innerHTML);
    onChange(isRichTextEmpty(html) ? '' : html);
  }

  function run(command: string, commandValue?: string) {
    ref.current?.focus();
    document.execCommand(command, false, commandValue);
    emit();
  }

  function closestBlock(tagNames: string[]): HTMLElement | null {
    const sel = window.getSelection();
    if (!sel?.anchorNode || !ref.current) return null;
    let node: Node | null = sel.anchorNode;
    const wanted = new Set(tagNames.map((t) => t.toUpperCase()));
    while (node && node !== ref.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (wanted.has(el.tagName)) return el;
      }
      node = node.parentNode;
    }
    return null;
  }

  function applyList(kind: 'ul' | 'ol', style: string, olType?: string) {
    setMenu(null);
    ref.current?.focus();
    document.execCommand(kind === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false);
    const list = closestBlock(kind === 'ul' ? ['UL'] : ['OL']);
    if (list) {
      list.classList.remove('list-check');
      if (style === 'check') {
        list.classList.add('list-check');
        list.style.listStyleType = 'none';
        list.removeAttribute('type');
      } else {
        list.style.listStyleType = style;
        if (kind === 'ol' && olType) list.setAttribute('type', olType);
        else list.removeAttribute('type');
      }
    }
    emit();
  }

  function applyAlign(align: 'left' | 'center' | 'right' | 'justify') {
    const command =
      align === 'left'
        ? 'justifyLeft'
        : align === 'center'
          ? 'justifyCenter'
          : align === 'right'
            ? 'justifyRight'
            : 'justifyFull';
    run(command);
  }

  function addLink() {
    setMenu(null);
    const current = window.getSelection()?.toString() || '';
    const url = window.prompt('Link URL (https://…)', current.startsWith('http') ? current : 'https://');
    if (!url) return;
    const href = /^https?:\/\//i.test(url) || url.startsWith('mailto:') ? url : `https://${url}`;
    run('createLink', href);
  }

  function insertRule() {
    setMenu(null);
    ref.current?.focus();
    document.execCommand('insertHorizontalRule', false);
    emit();
  }

  return (
    <div
      ref={rootRef}
      className={cn('overflow-hidden rounded-lg border border-border bg-background shadow-card', className)}
    >
      <div className="space-y-1.5 border-b border-border bg-surface/70 px-2 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            title="Bold"
            label={<span className="font-bold">B</span>}
            onMouseDown={() => run('bold')}
          />
          <ToolbarButton
            title="Italic"
            label={<span className="italic">I</span>}
            onMouseDown={() => run('italic')}
          />
          <ToolbarButton
            title="Underline"
            label={<span className="underline">U</span>}
            onMouseDown={() => run('underline')}
          />
          <ToolbarButton
            title="Strikethrough"
            label={<span className="line-through">S</span>}
            onMouseDown={() => run('strikeThrough')}
          />
          <ToolbarButton title="Subscript" label="X₂" onMouseDown={() => run('subscript')} />
          <ToolbarButton title="Superscript" label="X²" onMouseDown={() => run('superscript')} />

          <ToolbarDivider />

          <ToolbarMenu id="style" open={menu} setOpen={setMenu} title="Text style" label="Style">
            <MenuItem
              label="Paragraph"
              hint="P"
              onSelect={() => {
                setMenu(null);
                run('formatBlock', 'p');
              }}
            />
            <MenuItem
              label="Heading"
              hint="H2"
              onSelect={() => {
                setMenu(null);
                run('formatBlock', 'h2');
              }}
            />
            <MenuItem
              label="Subheading"
              hint="H3"
              onSelect={() => {
                setMenu(null);
                run('formatBlock', 'h3');
              }}
            />
            <MenuItem
              label="Quote"
              hint="“ ”"
              onSelect={() => {
                setMenu(null);
                run('formatBlock', 'blockquote');
              }}
            />
          </ToolbarMenu>

          <ToolbarMenu id="bullets" open={menu} setOpen={setMenu} title="Bullet lists" label="• Bullets">
            <MenuItem label="Filled dots" hint="●" onSelect={() => applyList('ul', 'disc')} />
            <MenuItem label="Hollow circles" hint="○" onSelect={() => applyList('ul', 'circle')} />
            <MenuItem label="Squares" hint="■" onSelect={() => applyList('ul', 'square')} />
            <MenuItem label="Checklist" hint="☐" onSelect={() => applyList('ul', 'check')} />
          </ToolbarMenu>

          <ToolbarMenu id="numbers" open={menu} setOpen={setMenu} title="Numbered lists" label="1. Numbers">
            <MenuItem label="Numbers" hint="1." onSelect={() => applyList('ol', 'decimal', '1')} />
            <MenuItem label="Lowercase letters" hint="a." onSelect={() => applyList('ol', 'lower-alpha', 'a')} />
            <MenuItem label="Uppercase letters" hint="A." onSelect={() => applyList('ol', 'upper-alpha', 'A')} />
            <MenuItem label="Roman (i, ii)" hint="i." onSelect={() => applyList('ol', 'lower-roman', 'i')} />
            <MenuItem label="Roman (I, II)" hint="I." onSelect={() => applyList('ol', 'upper-roman', 'I')} />
          </ToolbarMenu>

          <ToolbarDivider />

          <ToolbarButton title="Align left" label={<AlignIcon kind="left" />} onMouseDown={() => applyAlign('left')} />
          <ToolbarButton
            title="Align center"
            label={<AlignIcon kind="center" />}
            onMouseDown={() => applyAlign('center')}
          />
          <ToolbarButton
            title="Align right"
            label={<AlignIcon kind="right" />}
            onMouseDown={() => applyAlign('right')}
          />
          <ToolbarButton
            title="Justify"
            label={<AlignIcon kind="justify" />}
            onMouseDown={() => applyAlign('justify')}
          />

          <ToolbarDivider />

          <ToolbarButton title="Increase indent" label={<IndentIcon direction="in" />} onMouseDown={() => run('indent')} />
          <ToolbarButton
            title="Decrease indent"
            label={<IndentIcon direction="out" />}
            onMouseDown={() => run('outdent')}
          />
          <ToolbarButton title="Insert link" label="Link" className="font-medium" onMouseDown={addLink} />
          <ToolbarButton
            title="Remove link"
            label="Unlink"
            className="font-medium"
            onMouseDown={() => run('unlink')}
          />
          <ToolbarButton title="Horizontal line" label="Line" className="font-medium" onMouseDown={insertRule} />

          <ToolbarDivider />

          <ToolbarButton title="Undo" label="Undo" className="font-medium" onMouseDown={() => run('undo')} />
          <ToolbarButton title="Redo" label="Redo" className="font-medium" onMouseDown={() => run('redo')} />
          <ToolbarButton
            title="Clear formatting"
            label="Clear"
            className="px-2.5 font-medium text-muted"
            onMouseDown={() => run('removeFormat')}
          />
        </div>
      </div>

      <div className="relative">
        {isRichTextEmpty(value) ? (
          <p className="pointer-events-none absolute left-3 top-3 text-sm text-muted">{placeholder}</p>
        ) : null}
        <div
          id={id}
          ref={ref}
          role="textbox"
          aria-multiline
          contentEditable
          suppressContentEditableWarning
          className={cn(
            'prose-milestone max-h-72 overflow-y-auto px-3 py-3 text-sm text-foreground outline-none focus-visible:ring-0',
            minHeightClassName,
          )}
          onInput={() => {
            setMenu(null);
            emit();
          }}
          onBlur={emit}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
              event.preventDefault();
              run('bold');
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
              event.preventDefault();
              run('italic');
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'u') {
              event.preventDefault();
              run('underline');
            }
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-surface/40 px-3 py-1.5 text-[0.7rem] text-muted">
        <span>Tip: select text, then use the ribbon — ⌘/Ctrl+B I U for quick styles</span>
        <span className="shrink-0 tabular-nums">
          {stats.words}w · {stats.chars}c
        </span>
      </div>
    </div>
  );
}

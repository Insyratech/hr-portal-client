/** Shared accent tones — use sparingly: section vs field hierarchy, not rainbow UI. */
export type AccentTone = 'gold' | 'purple' | 'orange' | 'cyan';

export const ACCENT: Record<AccentTone, string> = {
  /** Managerial / default Meta */
  gold: 'var(--meta)',
  /** Form section heads, My project nav */
  purple: 'var(--accent-purple)',
  /** Employee nav & dashboard kickers */
  orange: 'var(--accent-orange)',
  /** Field labels / table column heads */
  cyan: 'var(--accent-cyan)',
};

/** Form section heading (e.g. “Documents to enclose”) */
export const FORM_SECTION_TONE: AccentTone = 'purple';
/** Form field labels */
export const FORM_FIELD_TONE: AccentTone = 'cyan';

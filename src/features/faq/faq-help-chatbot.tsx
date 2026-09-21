'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  faqCategoriesForRoles,
  faqRoleLabel,
  type FaqCategory,
  type FaqQuestion,
} from '@/features/faq/faq-content';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  useGetFaqContactTargetsQuery,
  useSendFaqContactMutation,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import type { FaqContactTarget } from '@/types/api';

type ChatTone = 'default' | 'success' | 'error' | 'info';

type ChatMessage = {
  id: string;
  from: 'bot' | 'user';
  text: string;
  tone?: ChatTone;
};

type Choice = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  accent?: 'cyan' | 'orange' | 'neutral';
};

type Phase =
  | { kind: 'categories' }
  | { kind: 'questions'; category: FaqCategory }
  | { kind: 'answer'; category: FaqCategory; question: FaqQuestion }
  | { kind: 'contact-role' }
  | { kind: 'contact-subject'; target: FaqContactTarget }
  | { kind: 'contact-message'; target: FaqContactTarget; subject: string }
  | { kind: 'contact-confirm'; target: FaqContactTarget; subject: string; message: string };

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function bubbleClass(from: 'bot' | 'user', tone: ChatTone = 'default'): string {
  if (from === 'user') {
    return 'ml-10 bg-foreground text-background shadow-sm';
  }
  if (tone === 'success') {
    return 'mr-6 border border-[color:var(--success)]/35 bg-[color:var(--success)]/12 text-foreground';
  }
  if (tone === 'error') {
    return 'mr-6 border border-[color:var(--danger)]/35 bg-[color:var(--danger)]/12 text-foreground';
  }
  if (tone === 'info') {
    return 'mr-6 border border-[color:var(--faq-help-header-border)] bg-[color:var(--faq-help-chip-bg)] text-foreground';
  }
  return 'mr-6 border border-border bg-surface text-foreground';
}

export function FaqHelpChatbot() {
  const user = useAppSelector((state) => state.auth.user);
  const roles = user?.roles ?? [];
  const categories = useMemo(() => faqCategoriesForRoles(roles), [roles]);
  const roleLabel = useMemo(() => faqRoleLabel(roles), [roles]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: 'categories' });
  const [draft, setDraft] = useState('');
  const [bootstrapped, setBootstrapped] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const { data: targetsData, isFetching: targetsLoading } = useGetFaqContactTargetsQuery(undefined, {
    skip: !open || !user,
  });
  const [sendContact, { isLoading: sending }] = useSendFaqContactMutation();

  const targets = targetsData?.data ?? [];

  useEffect(() => {
    if (!open || bootstrapped || !user) return;
    const firstName = user.name?.split(' ')[0] || 'there';
    setMessages([
      {
        id: uid(),
        from: 'bot',
        tone: 'info',
        text: `Hi ${firstName}. I’m the ERP Portal help guide for your ${roleLabel} workspace.`,
      },
      {
        id: uid(),
        from: 'bot',
        text: 'What kind of help do you need? Pick a topic below—I’ll show questions for that area, then answers. You can also email HR, CSO, GM, or Finance from here.',
      },
    ]);
    setPhase({ kind: 'categories' });
    setDraft('');
    setBootstrapped(true);
  }, [open, bootstrapped, user, roleLabel]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, phase, open, draft]);

  function push(from: 'bot' | 'user', text: string, tone?: ChatTone) {
    setMessages((prev) => [...prev, { id: uid(), from, text, tone }]);
  }

  function resetToHome() {
    setPhase({ kind: 'categories' });
    push('bot', 'What kind of help do you need next?');
  }

  function onPickCategory(category: FaqCategory) {
    push('user', category.label);
    push(
      'bot',
      `${category.description}. Here are questions related to “${category.label}”. Choose one, or go back to topics.`,
    );
    setPhase({ kind: 'questions', category });
  }

  function onPickQuestion(category: FaqCategory, question: FaqQuestion) {
    push('user', question.question);
    push('bot', question.answer);
    setPhase({ kind: 'answer', category, question });
  }

  function startContact() {
    push('user', 'Contact someone');
    push(
      'bot',
      'Who should receive your message? I’ll email everyone currently assigned to that role.',
      'info',
    );
    setPhase({ kind: 'contact-role' });
    setDraft('');
  }

  function onPickTarget(target: FaqContactTarget) {
    if (!target.available) {
      push(
        'bot',
        `No ${target.label} with a work email is available right now. Pick another role or try again later.`,
        'error',
      );
      return;
    }
    push('user', target.label);
    push('bot', `What is the subject of your message to ${target.label}?`);
    setPhase({ kind: 'contact-subject', target });
    setDraft('');
  }

  function submitSubject() {
    if (phase.kind !== 'contact-subject') return;
    const subject = draft.trim();
    if (subject.length < 3) {
      push('bot', 'Please enter a subject with at least 3 characters.', 'error');
      return;
    }
    push('user', subject);
    push(
      'bot',
      `Describe your concern or request for ${phase.target.label}. Include any dates, document numbers, or employee details that help.`,
    );
    setPhase({ kind: 'contact-message', target: phase.target, subject });
    setDraft('');
  }

  function submitMessageBody() {
    if (phase.kind !== 'contact-message') return;
    const message = draft.trim();
    if (message.length < 10) {
      push('bot', 'Please write a bit more detail (at least 10 characters).', 'error');
      return;
    }
    push('user', message);
    push(
      'bot',
      `Ready to email ${phase.target.label}?\n\nSubject: ${phase.subject}\n\nI’ll send this from your portal account.`,
      'info',
    );
    setPhase({
      kind: 'contact-confirm',
      target: phase.target,
      subject: phase.subject,
      message,
    });
    setDraft('');
  }

  async function confirmSend() {
    if (phase.kind !== 'contact-confirm') return;
    try {
      const result = await sendContact({
        roleCode: phase.target.roleCode,
        subject: phase.subject,
        message: phase.message,
      }).unwrap();
      push(
        'bot',
        `Sent to ${result.data.label}${result.data.recipientCount > 1 ? ` (${result.data.recipientCount} recipients)` : ''}. They can reply to your work email.`,
        'success',
      );
      setPhase({ kind: 'categories' });
      push('bot', 'Anything else? Pick another topic or contact someone again.');
    } catch (cause) {
      push('bot', apiErrorMessage(cause, 'Unable to send the message right now.'), 'error');
    }
  }

  const choices: Choice[] = (() => {
    if (phase.kind === 'categories') {
      return [
        ...categories.map((category) => ({
          id: category.id,
          label: category.label,
          description: category.description,
          accent: 'cyan' as const,
        })),
        {
          id: '__contact__',
          label: 'Contact someone',
          description: 'Email HR, CSO, GM, Finance, or Super Admin',
          accent: 'orange' as const,
        },
      ];
    }
    if (phase.kind === 'questions') {
      return [
        ...phase.category.questions.map((q) => ({
          id: q.id,
          label: q.question,
          accent: 'neutral' as const,
        })),
        { id: '__back__', label: '← Other topics', accent: 'neutral' as const },
        {
          id: '__contact__',
          label: 'Contact someone',
          description: 'Email a role instead',
          accent: 'orange' as const,
        },
      ];
    }
    if (phase.kind === 'answer') {
      return [
        {
          id: '__more__',
          label: `More in ${phase.category.label}`,
          accent: 'cyan' as const,
        },
        { id: '__home__', label: 'Other topics', accent: 'neutral' as const },
        {
          id: '__contact__',
          label: 'Contact someone',
          accent: 'orange' as const,
        },
      ];
    }
    if (phase.kind === 'contact-role') {
      if (targetsLoading) {
        return [{ id: '__wait__', label: 'Loading contacts…', disabled: true }];
      }
      return [
        ...targets.map((target) => ({
          id: target.roleCode,
          label: target.label,
          description: target.available
            ? `${target.recipientCount} recipient${target.recipientCount === 1 ? '' : 's'}`
            : 'No email on file',
          disabled: !target.available,
          accent: 'orange' as const,
        })),
        { id: '__home__', label: '← Cancel', accent: 'neutral' as const },
      ];
    }
    if (phase.kind === 'contact-confirm') {
      return [
        { id: '__send__', label: 'Send email', accent: 'orange' as const },
        { id: '__home__', label: 'Cancel', accent: 'neutral' as const },
      ];
    }
    return [];
  })();

  function onChoice(choice: Choice) {
    if (choice.disabled) return;
    if (choice.id === '__contact__') {
      startContact();
      return;
    }
    if (choice.id === '__back__' || choice.id === '__home__') {
      if (choice.id === '__back__' && phase.kind === 'questions') {
        push('user', 'Other topics');
      }
      resetToHome();
      return;
    }
    if (choice.id === '__more__' && phase.kind === 'answer') {
      push('user', `More in ${phase.category.label}`);
      push('bot', `Choose another question about “${phase.category.label}”.`);
      setPhase({ kind: 'questions', category: phase.category });
      return;
    }
    if (choice.id === '__send__') {
      void confirmSend();
      return;
    }
    if (phase.kind === 'categories') {
      const category = categories.find((item) => item.id === choice.id);
      if (category) onPickCategory(category);
      return;
    }
    if (phase.kind === 'questions') {
      const question = phase.category.questions.find((item) => item.id === choice.id);
      if (question) onPickQuestion(phase.category, question);
      return;
    }
    if (phase.kind === 'contact-role') {
      const target = targets.find((item) => item.roleCode === choice.id);
      if (target) onPickTarget(target);
    }
  }

  function closePanel() {
    setOpen(false);
    setBootstrapped(false);
    setMessages([]);
    setPhase({ kind: 'categories' });
    setDraft('');
  }

  function openPanel() {
    setOpen(true);
  }

  if (!user) return null;

  const needsText =
    phase.kind === 'contact-subject' || phase.kind === 'contact-message';
  const textPlaceholder =
    phase.kind === 'contact-subject' ? 'Subject line…' : 'Describe your concern…';

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={open ? 'Close help' : 'Open help'}
        className={cn(
          'faq-help-fab fixed z-[45] bottom-20 right-4 lg:bottom-6 lg:right-6',
          !open && 'faq-help-fab--float',
        )}
      >
        // eslint-disable-next-line @next/next/no-img-element -- static public asset for FAB
        <img
          src="/emoji-smile.png"
          alt=""
          width={56}
          height={56}
          draggable={false}
          className="faq-help-fab__face"
        />
      </button>

      {open ? (
        <section
          className={cn(
            'faq-help-panel fixed z-[46] flex w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-xl border border-border bg-background',
            'bottom-36 right-4 max-h-[min(36rem,calc(100vh-10rem))] lg:bottom-24 lg:right-6',
          )}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header className="faq-help-header flex shrink-0 items-center gap-3 px-4 py-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- static public asset */}
            <img
              src="/emoji-smile.png"
              alt=""
              width={36}
              height={36}
              draggable={false}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="truncate text-sm font-semibold tracking-wide">
                Portal help
              </h2>
              <p className="faq-help-header__muted truncate text-[11px] uppercase tracking-[0.14em]">
                {roleLabel} FAQ · guided answers
              </p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close help"
              className="faq-help-header__close inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-background px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-relaxed',
                  bubbleClass(message.from, message.tone),
                )}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-border bg-surface/90 px-3 py-3 backdrop-blur-[1px]">
            {choices.length > 0 ? (
              <div className="mb-1 flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-0.5">
                {choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={choice.disabled || sending}
                    onClick={() => onChoice(choice)}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-40',
                      choice.accent === 'orange'
                        ? 'border-[color:var(--accent-orange)]/40 bg-[color:var(--accent-orange)]/10 hover:bg-[color:var(--accent-orange)]/18'
                        : choice.accent === 'cyan'
                          ? 'faq-help-chip-cyan'
                          : 'border-border bg-background hover:bg-surface',
                    )}
                  >
                    <span className="font-medium text-foreground">{choice.label}</span>
                    {choice.description ? (
                      <span className="mt-0.5 block text-xs leading-snug text-muted">
                        {choice.description}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {needsText ? (
              <div className="mt-2 flex flex-col gap-2">
                {phase.kind === 'contact-message' ? (
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    placeholder={textPlaceholder}
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-card outline-none placeholder:text-muted focus:border-foreground"
                  />
                ) : (
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={textPlaceholder}
                    className="rounded-lg"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        submitSubject();
                      }
                    }}
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={resetToHome}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 rounded-lg"
                    style={{
                      background: 'var(--faq-help-header-bg)',
                      color: 'var(--faq-help-header-fg)',
                      borderColor: 'var(--faq-help-header-border)',
                    }}
                    onClick={() =>
                      phase.kind === 'contact-subject' ? submitSubject() : submitMessageBody()
                    }
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { ThreeDotsSpinner } from '@/components/ui/three-dots-spinner';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded border border-transparent text-sm font-medium tracking-wide shadow-card transition-colors disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-foreground text-background hover:bg-foreground/90',
        outline: 'border-border bg-background text-foreground hover:bg-surface',
        ghost: 'shadow-none text-foreground hover:bg-surface',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs uppercase tracking-[0.16em]',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows three-dot spinner and disables the control while true. */
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const isDisabled = Boolean(disabled || loading);

  if (asChild) {
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} disabled={isDisabled} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <ThreeDotsSpinner size="sm" label="Working" /> : null}
      {children}
    </Comp>
  );
}

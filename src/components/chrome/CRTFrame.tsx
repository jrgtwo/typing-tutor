import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Wraps content with a subtle CRT scanline overlay and a faint vignette.
 * Used on the typing surface only — applying it everywhere makes the UI
 * feel cluttered and hurts code/text readability.
 */
export const CRTFrame = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'crt-scanlines relative rounded-md border',
        'bg-[var(--color-paper)] border-[var(--color-paper-deep)]',
        'shadow-[inset_0_0_60px_rgba(43,36,25,0.08)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
CRTFrame.displayName = 'CRTFrame';

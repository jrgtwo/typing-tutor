import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const PaperPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md border shadow-sm',
        'bg-[var(--color-paper)] border-[var(--color-paper-deep)]',
        'p-6',
        className,
      )}
      {...props}
    />
  ),
);
PaperPanel.displayName = 'PaperPanel';

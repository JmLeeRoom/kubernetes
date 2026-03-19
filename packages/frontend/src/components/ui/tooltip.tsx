import * as React from 'react';
import { cn } from '@/lib/utils';

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-flex">{children}</div>;
}

function TooltipTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('cursor-default', className)} {...props}>
      {children}
    </span>
  );
}

const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
        className
      )}
      {...props}
    />
  )
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

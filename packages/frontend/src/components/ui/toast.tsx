import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
  )
);
Toast.displayName = 'Toast';

function ToastTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm font-semibold', className)} {...props} />;
}

function ToastDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm opacity-90', className)} {...props} />;
}

export { Toast, ToastTitle, ToastDescription, toastVariants };

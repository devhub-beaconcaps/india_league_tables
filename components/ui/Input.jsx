'use client';

import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({ 
  className, 
  type = 'text', 
  error, 
  label, 
  icon,
  helperText,
  ...props 
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'input',
            icon && 'pl-11',
            error && 'border-[var(--color-error-500)] focus:border-[var(--color-error-500)] focus:ring-[var(--color-error-500)]/10',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
      {helperText && !error && (
        <p className="text-xs text-[var(--color-muted)]">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--color-error-500)] font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

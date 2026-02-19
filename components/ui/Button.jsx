'use client';

import { cn } from '../../lib/utils';

const variants = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]',
  danger: 'btn bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30',
  outline: 'btn bg-transparent border-2 border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-accent)] hover:border-[var(--color-muted)]',
};

const sizes = {
  sm: 'px-3 py-2 text-sm h-9',
  md: 'px-5 py-2.5 text-sm h-11',
  lg: 'px-6 py-3 text-base h-12',
  icon: 'p-2.5 h-10 w-10',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  isLoading,
  leftIcon,
  rightIcon,
  ...props
}) {
  return (
    <button
      className={cn(
        variants[variant],
        sizes[size],
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}

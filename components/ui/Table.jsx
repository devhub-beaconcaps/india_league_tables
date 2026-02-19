'use client';

import { cn } from '../../lib/utils';

export function Table({ children, className }) {
  return (
    <div className="table-container">
      <table className={cn('data-table', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }) {
  return (
    <tr 
      className={cn(
        'transition-colors duration-150',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }) {
  return (
    <th className={cn('whitespace-nowrap', className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, align = 'left' }) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td className={cn(alignClasses[align], className)}>
      {children}
    </td>
  );
}

export function Badge({ children, variant = 'default', className, size = 'md' }) {
  const variants = {
    default: 'badge bg-[var(--color-accent)] text-[var(--color-muted)]',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    error: 'badge badge-error',
    primary: 'badge bg-[var(--color-primary-100)] text-[var(--color-primary-700)]',
    secondary: 'badge bg-[var(--color-secondary-500)]/10 text-[var(--color-secondary-600)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, description, icon: Icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[var(--color-muted)]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-muted)] max-w-sm mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}

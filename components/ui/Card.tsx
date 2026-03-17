'use client';

import { cn } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
    subtitle?: string;
}

interface CardDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

// ─── Components ───────────────────────────────────────────────────────────────

export function Card({ children, className, hover = true, ...props }: CardProps) {
    return (
        <div
            className={cn('card', hover && 'card-hover', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
    return (
        <div className={cn('flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]', className)}>
            <div className="flex-1">{children}</div>
            {action && <div className="ml-4 flex-shrink-0">{action}</div>}
        </div>
    );
}

export function CardTitle({ children, className, subtitle }: CardTitleProps) {
    return (
        <div>
            <h3 className={cn('text-lg font-semibold text-[var(--color-foreground)] tracking-tight', className)}>
                {children}
            </h3>
            {subtitle && (
                <p className="text-sm text-[var(--color-muted)] mt-0.5">{subtitle}</p>
            )}
        </div>
    );
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return (
        <p className={cn('text-sm text-[var(--color-muted)]', className)}>
            {children}
        </p>
    );
}

export function CardContent({ children, className }: CardContentProps) {
    return (
        <div className={cn('p-6', className)}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className }: CardFooterProps) {
    return (
        <div className={cn('px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-accent)]/50 rounded-b-[16px]', className)}>
            {children}
        </div>
    );
}
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-background)] flex items-center justify-center mb-4">
          <FileQuestion className="w-8 h-8 text-[var(--color-muted)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
          Page not found
        </h2>
        <p className="text-[var(--color-muted)] mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

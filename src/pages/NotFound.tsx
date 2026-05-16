import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1,#22d3ee,#a855f7)] text-white shadow-glow">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold">404 — page not found</h1>
        <p className="mt-1 text-sm text-ink-500">
          The page you're looking for doesn't exist. Try the dashboard.
        </p>
        <Link to="/" className="mt-4 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

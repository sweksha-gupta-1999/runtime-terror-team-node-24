import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Crumb {
  to?: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400"
    >
      <Link
        to="/"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-ink-100 dark:hover:bg-ink-800"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          {item.to ? (
            <Link
              to={item.to}
              className="rounded-md px-1.5 py-0.5 hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-ink-700 dark:text-ink-100">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

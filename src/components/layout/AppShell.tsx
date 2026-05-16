import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onCloseMobile={() => setOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setOpen((o) => !o)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-7xl px-4 pb-8 pt-4 text-center text-xs text-ink-500 dark:text-ink-400 sm:px-6 lg:px-8">
          Built with <span className="text-gradient font-semibold">Repo Onboarding AI</span> · all data is mock for demo purposes
        </footer>
      </div>
    </div>
  );
}

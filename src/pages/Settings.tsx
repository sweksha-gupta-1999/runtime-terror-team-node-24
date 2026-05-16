import { useState } from 'react';
import { Moon, RotateCcw, Save, Sun, Trash2 } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { usePrefsStore } from '@/store/prefsStore';
import { useProgressStore } from '@/store/progressStore';
import { useRepoStore } from '@/store/repoStore';
import { useChatStore } from '@/store/chatStore';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ONBOARDING_LEVELS } from '@/constants';
import type { OnboardingLevel } from '@/types';
import { cn } from '@/utils/cn';

export default function Settings() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const prefs = usePrefsStore();
  const resetProgress = useProgressStore((s) => s.reset);
  const clearArtifacts = useRepoStore((s) => s.clearArtifacts);
  const clearChat = useChatStore((s) => s.clear);

  const [displayName, setDisplayName] = useState(prefs.displayName);
  const [role, setRole] = useState(prefs.role);
  const [saved, setSaved] = useState(false);

  const save = () => {
    prefs.update({ displayName, role });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Settings' }]} />
      <SectionHeader
        eyebrow="Preferences"
        title="Settings"
        description="Personalize the experience. Everything is saved locally — no account required."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-sm font-semibold">Appearance</h3>
          <p className="mt-1 text-xs text-ink-500">Choose your color theme.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(['light', 'dark'] as const).map((m) => {
              const active = m === mode;
              const Icon = m === 'dark' ? Moon : Sun;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition',
                    active
                      ? 'border-brand-400 bg-brand-50/40 shadow-glow dark:bg-brand-500/5'
                      : 'border-ink-200 bg-white hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-display text-sm font-semibold capitalize">{m}</span>
                    </div>
                    {active && <Badge tone="brand">Active</Badge>}
                  </div>
                  <p className="mt-2 text-xs text-ink-500">
                    {m === 'light' ? 'Bright, focused, high contrast.' : 'Easy on the eyes.'}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Reduce motion</div>
                <div className="text-xs text-ink-500">Less animation for accessibility.</div>
              </div>
              <Switch
                checked={prefs.reduceMotion}
                onChange={(v) => prefs.update({ reduceMotion: v })}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Compact density</div>
                <div className="text-xs text-ink-500">Tighter spacing across the app.</div>
              </div>
              <Switch
                checked={prefs.density === 'compact'}
                onChange={(v) => prefs.update({ density: v ? 'compact' : 'comfortable' })}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Show AI confidence</div>
                <div className="text-xs text-ink-500">Display per-repo confidence scores.</div>
              </div>
              <Switch
                checked={prefs.showAiConfidence}
                onChange={(v) => prefs.update({ showAiConfidence: v })}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-sm font-semibold">Profile</h3>
          <p className="mt-1 text-xs text-ink-500">Used in the topbar and the AI greetings.</p>
          <div className="mt-3 space-y-3">
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input label="Role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>

          <div className="mt-4">
            <div className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-300">
              Default onboarding level
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ONBOARDING_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => prefs.update({ defaultLevel: l as OnboardingLevel })}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm transition',
                    prefs.defaultLevel === l
                      ? 'border-brand-400 bg-brand-500 text-white shadow-glow'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button onClick={save}>
              <Save className="h-4 w-4" /> Save
            </Button>
            {saved && <Badge tone="success">Saved ✓</Badge>}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-sm font-semibold">Danger zone</h3>
        <p className="mt-1 text-xs text-ink-500">
          These actions can't be undone. They wipe your local data only.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Button
            variant="outline"
            onClick={() => {
              resetProgress();
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset onboarding progress
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clearArtifacts();
            }}
          >
            <Trash2 className="h-4 w-4" /> Clear generated artifacts
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              prefs.resetPreferences();
              setDisplayName('New Joiner');
              setRole('Software Engineer');
              clearChat();
              resetProgress();
              clearArtifacts();
            }}
          >
            <Trash2 className="h-4 w-4" /> Reset everything
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
        checked ? 'bg-brand-500' : 'bg-ink-200 dark:bg-ink-700',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

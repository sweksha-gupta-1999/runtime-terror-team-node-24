import { useState } from 'react';
import { Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { Contact } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  contact?: Contact;
}

export function AskSMEModal({ open, onClose, contact }: Props) {
  const [subject, setSubject] = useState('Quick help: ');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSubject('Quick help: ');
      setMessage('');
      onClose();
    }, 1500);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? `Ask ${contact.name}` : 'Ask an SME'}
      description={
        contact
          ? `${contact.role} · ${contact.team} · ${contact.timezone}`
          : 'Reach the right expert without playing message tag.'
      }
    >
      {contact && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-ink-200 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-900/40 p-3">
          <Avatar name={contact.name} color={contact.avatar} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{contact.name}</div>
            <div className="truncate text-xs text-ink-500">{contact.email}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {contact.expertise.slice(0, 3).map((e) => (
                <Badge key={e} tone="info">
                  {e}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/5">
          <div className="font-display text-base font-semibold text-emerald-700 dark:text-emerald-300">
            Question sent
          </div>
          <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
            We've pinged them on Slack. Typical reply: under 2 hours.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-300">
              Question
            </span>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input min-h-[6rem] resize-y"
              placeholder="What you're trying to do, what you've tried, where you're stuck."
            />
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Send className="h-4 w-4" /> Send
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

import React, { useEffect, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { AdminProfileRow, ReviewDecision } from '@/lib/types';
import { roleById } from '@/data/constants';
import { cn } from '@/lib/utils';

const COPY: Record<ReviewDecision, { title: string; body: string; cta: string; tone: string }> = {
  approve: { title: 'Approve account', body: 'They will immediately be able to link patients and open the records their role allows.', cta: 'Approve', tone: 'bg-teal-700 hover:bg-teal-800' },
  decline: { title: 'Decline request', body: 'They keep their login but get no access. They will see your note on their status screen.', cta: 'Decline', tone: 'bg-coral-500 hover:bg-coral-600' },
  revoke: { title: 'Revoke access', body: 'Access to every patient record stops right away. The account goes back to pending review.', cta: 'Revoke access', tone: 'bg-stone-800 hover:bg-stone-900' },
};

interface Props {
  target: AdminProfileRow | null;
  decision: ReviewDecision | null;
  onClose: () => void;
  onConfirm: (note: string, notify: boolean) => Promise<void>;
}

const ReviewDialog: React.FC<Props> = ({ target, decision, onClose, onConfirm }) => {
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setNote(''); setNotify(true); }, [target, decision]);
  if (!target || !decision) return null;
  const c = COPY[decision];
  const canNotify = decision !== 'revoke';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await onConfirm(note.trim(), canNotify && notify); } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.body}</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-sm">
          <p className="font-semibold text-ink">{target.full_name || 'Unnamed user'}</p>
          <p className="text-stone-500 break-all">{target.email}</p>
          <p className="mt-1 text-xs font-mono text-teal-700">{roleById(target.role)?.label}{target.organization ? ` · ${target.organization}` : ''}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-xs font-semibold text-stone-500">
            Note {canNotify ? '(optional, shown to the user and included in the email/text)' : '(optional, shown to the user)'}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
              placeholder={decision === 'approve' ? 'e.g. NPI verified. Welcome aboard.' : 'e.g. Could not verify your organization'}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-teal-600" />
          </label>
          {canNotify && (
            <label className="flex items-start gap-2.5 rounded-xl border border-stone-200 p-3 cursor-pointer hover:bg-stone-50">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-700" />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-ink"><Mail className="h-3.5 w-3.5" /> Notify {target.full_name?.split(' ')[0] || 'them'}</span>
                <span className="block text-xs text-stone-500">
                  Sends an email, plus a text if they opted in to SMS, and tags their CRM contact{' '}
                  <span className="font-mono text-stone-700">{decision === 'approve' ? 'approved' : 'declined'}</span>.
                </span>
              </span>
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100">Cancel</button>
            <button type="submit" disabled={busy} className={cn('inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60', c.tone)}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{c.cta}{canNotify && notify ? ' & notify' : ''}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;

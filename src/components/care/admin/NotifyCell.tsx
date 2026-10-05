import React from 'react';
import { AlertTriangle, Loader2, Mail, MessageSquare, RotateCw } from 'lucide-react';
import type { AdminProfileRow } from '@/lib/types';
import { approvalState } from '@/lib/types';
import { cn } from '@/lib/utils';

export const ago = (d: string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 6e4);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

interface Props {
  row: AdminProfileRow;
  busy: boolean;
  onResend: (row: AdminProfileRow) => void;
}

const NotifyCell: React.FC<Props> = ({ row, busy, onResend }) => {
  const st = approvalState(row);
  const decidable = row.role !== 'admin' && (st === 'approved' || st === 'declined');
  const channels = row.last_notified_channels ?? [];
  // A notice is stale if it was about a different decision than the current one.
  const stale = !!row.last_notified_decision && decidable && row.last_notified_decision !== st;
  const failed = row.last_notify_status === 'failed' || row.last_notify_status === 'partial';

  return (
    <div className="min-w-[150px]">
      {row.last_notified_at ? (
        <>
          <p className="text-ink whitespace-nowrap" title={new Date(row.last_notified_at).toLocaleString()}>
            {new Date(row.last_notified_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
            <span className="text-stone-400">{ago(row.last_notified_at)}</span>
            {channels.includes('email') && <span title="Email" className="inline-flex items-center gap-0.5 rounded bg-teal-50 text-teal-700 px-1 py-0.5"><Mail className="h-3 w-3" /></span>}
            {channels.includes('sms') && <span title="Text message" className="inline-flex items-center gap-0.5 rounded bg-teal-50 text-teal-700 px-1 py-0.5"><MessageSquare className="h-3 w-3" /></span>}
            {row.last_notified_decision && <span className="font-mono capitalize">{row.last_notified_decision}</span>}
          </div>
        </>
      ) : (
        <p className="text-xs text-stone-400">{decidable ? 'Not notified' : '—'}</p>
      )}

      {(failed || stale) && (
        <p className={cn('mt-1 flex items-start gap-1 text-[11px] leading-tight', failed ? 'text-coral-600' : 'text-amber-700')} title={row.last_notify_error ?? undefined}>
          <AlertTriangle className="h-3 w-3 mt-px shrink-0" />
          {failed ? (row.last_notify_status === 'partial' ? 'Some messages failed' : 'Last attempt failed') : 'Notice is out of date'}
        </p>
      )}

      {decidable && (
        <button onClick={() => onResend(row)} disabled={busy}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-50">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
          {row.last_notified_at ? 'Resend' : 'Send notice'}
        </button>
      )}
    </div>
  );
};

export default NotifyCell;

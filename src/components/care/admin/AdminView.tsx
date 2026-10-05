import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, RefreshCw, Search, ShieldCheck, ShieldX, UserCheck, UserX, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminListProfiles, adminReviewProfile, errMsg, notifyReviewDecision } from '@/lib/api';
import { REVIEWED_ROLES, roleById } from '@/data/constants';
import { approvalState, type AdminProfileRow, type ApprovalState, type NotifyResult, type ReviewDecision } from '@/lib/types';
import { cn } from '@/lib/utils';
import ReviewDialog from './ReviewDialog';
import NotifyCell, { ago } from './NotifyCell';

type Tab = ApprovalState | 'all';
const TABS: { id: Tab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'declined', label: 'Declined' },
  { id: 'all', label: 'All' },
];

const STATE_BADGE: Record<ApprovalState, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-teal-100 text-teal-800',
  declined: 'bg-stone-200 text-stone-700',
};

const describeNotice = (r: NotifyResult) => {
  const via = r.channels.map((c) => (c === 'sms' ? 'text' : c)).join(' + ');
  const sms = r.sms_skipped ? ` (no text: ${r.sms_skipped})` : '';
  return `${via ? `Notice queued by ${via}` : 'No notice sent'}${sms}`;
};

const AdminView: React.FC = () => {
  const [rows, setRows] = useState<AdminProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('pending');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [target, setTarget] = useState<AdminProfileRow | null>(null);
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setRows(await adminListProfiles()); }
    catch (e) { toast.error(errMsg(e)); }
    finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reviewable = rows.filter((r) => r.role !== 'admin');
  const counts = useMemo(() => ({
    pending: reviewable.filter((r) => approvalState(r) === 'pending').length,
    approved: reviewable.filter((r) => approvalState(r) === 'approved').length,
    declined: reviewable.filter((r) => approvalState(r) === 'declined').length,
    all: rows.length,
  }), [rows, reviewable]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== 'all' && (r.role === 'admin' || approvalState(r) !== tab)) return false;
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.organization].some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, tab, q, roleFilter]);

  const open = (r: AdminProfileRow, d: ReviewDecision) => { setTarget(r); setDecision(d); };
  const close = () => { setTarget(null); setDecision(null); };

  // Sends the email/SMS + CRM tag, then refreshes so "Last notified" updates.
  const sendNotice = async (userId: string, resend: boolean) => {
    setNotifying(userId);
    try {
      const res = await notifyReviewDecision(userId, resend);
      if (res.status === 'failed') toast.error(`Notice failed: ${res.errors.join('; ') || 'unknown error'}`);
      else if (res.status === 'partial') toast.warning(`${describeNotice(res)}. Some messages failed: ${res.errors.join('; ')}`);
      else toast.success(describeNotice(res));
    } catch (e) {
      toast.error(`Could not notify: ${errMsg(e)}`);
    } finally {
      setNotifying(null);
      await load(true);
    }
  };

  const confirm = async (note: string, notify: boolean) => {
    if (!target || !decision) return;
    try {
      const updated = await adminReviewProfile(target.id, decision, note);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      toast.success(decision === 'approve' ? `${target.full_name || target.email} approved` : decision === 'decline' ? 'Request declined' : 'Access revoked');
      const id = target.id;
      close();
      if (notify && decision !== 'revoke') await sendNotice(id, false);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const exportCsv = () => {
    const head = ['name', 'email', 'role', 'organization', 'status', 'signed_up', 'approved_at', 'declined_at', 'note', 'last_notified_at', 'last_notified_decision', 'last_notified_channels', 'last_notify_status'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = visible.map((r) => [r.full_name, r.email, r.role, r.organization, approvalState(r), r.created_at, r.approved_at, r.declined_at, r.review_note, r.last_notified_at, r.last_notified_decision, (r.last_notified_channels ?? []).join('+'), r.last_notify_status].map(esc).join(','));
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kindred-accounts-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const stats = [
    { label: 'Waiting for review', value: counts.pending, icon: Clock, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Approved professionals', value: counts.approved, icon: ShieldCheck, tone: 'text-teal-700 bg-teal-50' },
    { label: 'Declined', value: counts.declined, icon: ShieldX, tone: 'text-stone-600 bg-stone-100' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Account approvals</h1>
          <p className="mt-1 text-stone-600 text-sm max-w-2xl">Clinician, care manager, payer and employer accounts get no access to any record until you approve them. Patients and caregivers are approved automatically.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!visible.length} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={() => load()} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-sm font-semibold"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 flex items-center gap-4">
            <span className={cn('grid place-items-center h-11 w-11 rounded-xl', s.tone)}><s.icon className="h-5 w-5" /></span>
            <div>
              <p className="text-2xl font-semibold text-ink font-mono">{s.value}</p>
              <p className="text-xs text-stone-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl bg-stone-100 p-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold', tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-ink')}>
                {t.label} <span className="font-mono text-xs text-stone-400">{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or organization" className="w-full rounded-xl border border-stone-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-stone-200 px-3 py-2 text-sm bg-white" aria-label="Filter by role">
            <option value="all">All roles</option>
            {REVIEWED_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            <option value="admin">Admin</option>
          </select>
        </div>

        {loading ? (
          <p className="p-12 text-center text-sm text-stone-500 font-mono">Loading accounts...</p>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-teal-600" />
            <p className="mt-3 font-semibold text-ink">{tab === 'pending' ? 'All caught up' : 'No accounts match'}</p>
            <p className="text-sm text-stone-500">{tab === 'pending' ? 'New professional sign-ups will appear here.' : 'Try a different tab, role or search.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Person</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Organization</th>
                  <th className="px-4 py-3 font-semibold">Signed up</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last notified</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visible.map((r) => {
                  const st = approvalState(r);
                  const isAdminRow = r.role === 'admin';
                  return (
                    <tr key={r.id} className="hover:bg-stone-50/60 align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{r.full_name || 'Unnamed user'}</p>
                        <p className="text-xs text-stone-500 break-all">{r.email}</p>
                        {r.review_note && <p className="mt-1 text-xs text-stone-500 italic">“{r.review_note}”</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-teal-800">{roleById(r.role)?.label ?? r.role}</td>
                      <td className="px-4 py-3 text-stone-600">{r.organization || '—'}</td>
                      <td className="px-4 py-3 text-stone-500 whitespace-nowrap" title={new Date(r.created_at).toLocaleString()}>{ago(r.created_at)}</td>
                      <td className="px-4 py-3"><span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', STATE_BADGE[st])}>{isAdminRow ? 'admin' : st}</span></td>
                      <td className="px-4 py-3"><NotifyCell row={r} busy={notifying === r.id} onResend={(row) => sendNotice(row.id, true)} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {!isAdminRow && st !== 'approved' && (
                            <button onClick={() => open(r, 'approve')} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 text-xs font-semibold"><UserCheck className="h-3.5 w-3.5" /> Approve</button>
                          )}
                          {!isAdminRow && st === 'pending' && (
                            <button onClick={() => open(r, 'decline')} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"><UserX className="h-3.5 w-3.5" /> Decline</button>
                          )}
                          {!isAdminRow && st === 'approved' && (
                            <button onClick={() => open(r, 'revoke')} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"><Undo2 className="h-3.5 w-3.5" /> Revoke</button>
                          )}
                          {isAdminRow && <span className="text-xs text-stone-400">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReviewDialog target={target} decision={decision} onClose={close} onConfirm={confirm} />
    </div>
  );
};

export default AdminView;

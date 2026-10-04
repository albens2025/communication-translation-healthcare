import React, { useState } from 'react';
import { Hourglass, ShieldX, RefreshCw, LogOut, CheckCircle2, Circle, CalendarDays, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { BOOKING_URL } from '@/data/constants';
import { approvalState } from '@/lib/types';
import { cn } from '@/lib/utils';

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const PendingApproval: React.FC = () => {
  const { profile, roleDef, reloadProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  if (!profile) return null;
  const state = approvalState(profile);
  const declined = state === 'declined';

  const check = async () => {
    setChecking(true);
    await reloadProfile();
    setChecking(false);
    toast.message('Status refreshed');
  };

  const steps = [
    { label: 'Account created', done: true, at: profile.created_at },
    { label: declined ? 'Reviewed — not approved' : 'Admin review', done: declined, at: profile.declined_at, current: !declined },
    { label: 'Access to assigned records', done: false },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className={cn('px-6 sm:px-10 py-8 sm:py-10 text-white', declined ? 'bg-gradient-to-br from-stone-700 to-stone-900' : 'bg-gradient-to-br from-teal-700 to-teal-900')}>
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-white/15">
              {declined ? <ShieldX className="h-6 w-6" /> : <Hourglass className="h-6 w-6" />}
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">{declined ? 'Not approved' : 'Pending approval'}</p>
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            {declined ? 'Your account was not approved' : `Thanks, ${profile.full_name?.split(' ')[0] || 'there'} — you're in the queue`}
          </h1>
          <p className="mt-3 text-white/80 max-w-xl">
            {declined
              ? 'An administrator reviewed your request and did not approve it. You have no access to patient records.'
              : `${roleDef?.label ?? 'Professional'} accounts can see protected health information, so an administrator checks each one before it can open any records.`}
          </p>
        </div>

        <div className="px-6 sm:px-10 py-8 grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Request details</p>
            <dl className="mt-3 space-y-2.5 text-sm">
              {[
                ['Name', profile.full_name || '—'],
                ['Email', profile.email || '—'],
                ['Role', roleDef?.label ?? profile.role],
                ['Organization', profile.organization || '—'],
                ['Submitted', fmt(profile.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-stone-100 pb-2">
                  <dt className="text-stone-500">{k}</dt>
                  <dd className="font-medium text-ink text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>
            {declined && profile.review_note && (
              <div className="mt-4 rounded-xl bg-stone-50 border border-stone-200 p-3 text-sm text-stone-700">
                <p className="text-xs font-semibold text-stone-500 mb-1">Note from the reviewer</p>
                {profile.review_note}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Progress</p>
            <ol className="mt-3 space-y-4">
              {steps.map((s) => (
                <li key={s.label} className="flex gap-3">
                  {s.done ? <CheckCircle2 className={cn('h-5 w-5 shrink-0', declined && s.at === profile.declined_at ? 'text-stone-500' : 'text-teal-600')} />
                    : <Circle className={cn('h-5 w-5 shrink-0', s.current ? 'text-coral-400 animate-pulse' : 'text-stone-300')} />}
                  <div>
                    <p className={cn('text-sm font-medium', s.done || s.current ? 'text-ink' : 'text-stone-400')}>{s.label}</p>
                    {s.at && <p className="text-xs text-stone-500 font-mono">{fmt(s.at)}</p>}
                    {s.current && <p className="text-xs text-stone-500">Usually within one business day.</p>}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-teal-50 border border-teal-100 p-3 text-xs text-teal-900">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" />
              Until approved, the database blocks this account from reading or changing any patient, conversation or billing record.
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-5 border-t border-stone-100 bg-stone-50/60 flex flex-wrap gap-3">
          <button onClick={check} disabled={checking} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            <RefreshCw className={cn('h-4 w-4', checking && 'animate-spin')} /> Check status
          </button>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-stone-50">
            <CalendarDays className="h-4 w-4" /> Talk to our team
          </a>
          <button onClick={signOut} className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

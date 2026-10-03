import React from 'react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/types';
import { pathwayById, STATUS_STYLES } from '@/data/constants';

export const ConfidenceBar: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-teal-600' : pct >= 60 ? 'bg-amber-500' : 'bg-coral-400';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 rounded-full bg-stone-200 overflow-hidden">
        <div className={cn('h-full rounded-full reveal-bar', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-stone-500 w-9 text-right">{pct}%</span>
    </div>
  );
};

export const CodeTag: React.FC<{ code: string; kind?: 'icd' | 'cpt'; className?: string }> = ({ code, kind = 'icd', className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold tracking-tight',
      kind === 'icd' ? 'bg-teal-900 text-teal-100' : 'bg-coral-100 text-coral-700',
      className
    )}
  >
    {code}
  </span>
);

export const PatientAvatar: React.FC<{ patient?: Patient; size?: number; className?: string }> = ({ patient, size = 40, className }) => {
  if (!patient) return null;
  const initials = patient.name.split(' ').map((s) => s[0]).join('').slice(0, 2);
  return patient.avatar_url ? (
    <img src={patient.avatar_url} alt={patient.name} style={{ width: size, height: size }} className={cn('rounded-full object-cover ring-2 ring-white', className)} />
  ) : (
    <div style={{ width: size, height: size }} className={cn('rounded-full bg-teal-700 text-white grid place-items-center text-sm font-semibold ring-2 ring-white', className)}>
      {initials}
    </div>
  );
};

export const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', STATUS_STYLES[status] ?? 'bg-stone-100')}>{status}</span>
);

export const PathwayPill: React.FC<{ id?: string | null }> = ({ id }) => {
  const p = pathwayById(id);
  if (!p) return null;
  const Icon = p.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', p.color)}>
      <Icon className="h-3.5 w-3.5" /> {p.label}
    </span>
  );
};

export const SectionHeader: React.FC<{ eyebrow: string; title: string; subtitle?: string; right?: React.ReactNode }> = ({ eyebrow, title, subtitle, right }) => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500 mb-2">{eyebrow}</p>
      <h1 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-stone-600 max-w-2xl">{subtitle}</p>}
    </div>
    {right}
  </div>
);

export const EmptyState: React.FC<{ title: string; body: string; action?: React.ReactNode }> = ({ title, body, action }) => (
  <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-10 text-center">
    <h3 className="text-lg font-semibold text-ink">{title}</h3>
    <p className="text-stone-600 mt-1 max-w-md mx-auto">{body}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

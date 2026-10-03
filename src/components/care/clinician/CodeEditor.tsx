import React, { useState } from 'react';
import { Check, X, Plus, Minus } from 'lucide-react';
import type { CptCode, IcdCode } from '@/lib/types';
import { feeFor } from '@/data/constants';
import { CodeTag, ConfidenceBar } from '../shared';
import { cn } from '@/lib/utils';

const StatusToggle: React.FC<{ status?: string; onAccept: () => void; onReject: () => void; disabled?: boolean }> = ({ status, onAccept, onReject, disabled }) => (
  <div className="flex gap-1">
    <button disabled={disabled} onClick={onAccept} aria-label="Accept"
      className={cn('h-7 w-7 rounded-lg grid place-items-center border transition', status === 'accepted' ? 'bg-teal-700 border-teal-700 text-white' : 'border-stone-200 text-stone-400 hover:text-teal-700 hover:border-teal-600')}>
      <Check className="h-4 w-4" />
    </button>
    <button disabled={disabled} onClick={onReject} aria-label="Reject"
      className={cn('h-7 w-7 rounded-lg grid place-items-center border transition', status === 'rejected' ? 'bg-coral-400 border-coral-400 text-white' : 'border-stone-200 text-stone-400 hover:text-coral-500 hover:border-coral-400')}>
      <X className="h-4 w-4" />
    </button>
  </div>
);

export const IcdEditor: React.FC<{ codes: IcdCode[]; onChange: (c: IcdCode[]) => void; locked?: boolean }> = ({ codes, onChange, locked }) => {
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const set = (i: number, patch: Partial<IcdCode>) => onChange(codes.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const add = () => {
    if (!code.trim() || !desc.trim()) return;
    onChange([...codes, { code: code.trim().toUpperCase(), description: desc.trim(), confidence: 1, type: codes.length ? 'secondary' : 'primary', rationale: 'Added by clinician', status: 'accepted' }]);
    setCode(''); setDesc('');
  };
  return (
    <div className="space-y-2">
      {codes.map((c, i) => (
        <div key={c.code + i} className={cn('rounded-xl border p-3 transition', c.status === 'rejected' ? 'border-stone-200 bg-stone-50 opacity-60' : c.status === 'accepted' ? 'border-teal-200 bg-teal-50/40' : 'border-stone-200 bg-white')}>
          <div className="flex items-center gap-2">
            <CodeTag code={c.code} />
            <span className={cn('text-sm flex-1 text-ink', c.status === 'rejected' && 'line-through')}>{c.description}</span>
            <select disabled={locked} value={c.type} onChange={(e) => set(i, { type: e.target.value as IcdCode['type'] })} className="text-[11px] rounded-md border border-stone-200 bg-white px-1.5 py-1">
              <option value="primary">primary</option><option value="secondary">secondary</option><option value="rule-out">rule-out</option>
            </select>
            <StatusToggle disabled={locked} status={c.status} onAccept={() => set(i, { status: 'accepted' })} onReject={() => set(i, { status: 'rejected' })} />
          </div>
          <ConfidenceBar value={c.confidence} className="mt-2" />
          {c.rationale && <p className="mt-1 text-xs text-stone-500">{c.rationale}</p>}
        </div>
      ))}
      {!locked && (
        <div className="flex gap-2 pt-1">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ICD-10" className="w-24 rounded-lg border border-stone-200 px-2 py-1.5 text-sm font-mono" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-sm" />
          <button onClick={add} className="rounded-lg bg-stone-900 text-white px-3 text-sm inline-flex items-center gap-1"><Plus className="h-3.5 w-3.5" />Add</button>
        </div>
      )}
    </div>
  );
};

export const CptEditor: React.FC<{ codes: CptCode[]; onChange: (c: CptCode[]) => void; locked?: boolean }> = ({ codes, onChange, locked }) => {
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const set = (i: number, patch: Partial<CptCode>) => onChange(codes.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const add = () => {
    if (!code.trim() || !desc.trim()) return;
    onChange([...codes, { code: code.trim().toUpperCase(), description: desc.trim(), category: 'Clinician added', units: 1, status: 'accepted' }]);
    setCode(''); setDesc('');
  };
  return (
    <div className="space-y-2">
      {codes.map((c, i) => {
        const fee = feeFor(c.code, c.est_fee_usd) * (c.units || 1);
        return (
          <div key={c.code + i} className={cn('rounded-xl border p-3', c.status === 'rejected' ? 'border-stone-200 bg-stone-50 opacity-60' : c.status === 'accepted' ? 'border-coral-200 bg-coral-50/40' : 'border-stone-200 bg-white')}>
            <div className="flex items-center gap-2 flex-wrap">
              <CodeTag code={c.code} kind="cpt" />
              <span className={cn('text-sm flex-1 min-w-[140px] text-ink', c.status === 'rejected' && 'line-through')}>{c.description}</span>
              <div className="flex items-center rounded-lg border border-stone-200 bg-white">
                <button disabled={locked} onClick={() => set(i, { units: Math.max(1, (c.units || 1) - 1) })} className="px-1.5 py-1 text-stone-500" aria-label="Decrease units"><Minus className="h-3 w-3" /></button>
                <span className="font-mono text-xs w-5 text-center">{c.units || 1}</span>
                <button disabled={locked} onClick={() => set(i, { units: (c.units || 1) + 1 })} className="px-1.5 py-1 text-stone-500" aria-label="Increase units"><Plus className="h-3 w-3" /></button>
              </div>
              <span className="font-mono text-xs w-14 text-right text-stone-600">${fee}</span>
              <StatusToggle disabled={locked} status={c.status} onAccept={() => set(i, { status: 'accepted' })} onReject={() => set(i, { status: 'rejected' })} />
            </div>
            <p className="mt-1 text-xs text-stone-500"><span className="font-medium text-stone-600">{c.category}</span>{c.rationale ? ` — ${c.rationale}` : ''}</p>
          </div>
        );
      })}
      {!locked && (
        <div className="flex gap-2 pt-1">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CPT" className="w-24 rounded-lg border border-stone-200 px-2 py-1.5 text-sm font-mono" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-sm" />
          <button onClick={add} className="rounded-lg bg-stone-900 text-white px-3 text-sm inline-flex items-center gap-1"><Plus className="h-3.5 w-3.5" />Add</button>
        </div>
      )}
    </div>
  );
};

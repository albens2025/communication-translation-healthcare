import React, { useEffect, useMemo, useState } from 'react';
import { Search, Save, PenLine, Receipt, Scale, CheckCheck, MessageSquareQuote, Stethoscope, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useCare } from '@/context/CareContext';
import { useAuth } from '@/context/AuthContext';
import { channelById, PATHWAYS } from '@/data/constants';
import { computeCharge, money } from '@/lib/api';
import type { CptCode, IcdCode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, PatientAvatar, SectionHeader, StatusPill, formatDate } from '../shared';
import { CptEditor, IcdEditor } from './CodeEditor';
import SuperbillDialog from './SuperbillDialog';

const TABS = ['all', 'decoded', 'signed', 'billed'] as const;

const ClinicianView: React.FC = () => {
  const { encounters, patientById, activeEncounterId, setActiveEncounterId, updateEncounter, setView, setSelectedPatientId } = useCare();
  const { roleDef } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>('all');
  const [q, setQ] = useState('');
  const [icd, setIcd] = useState<IcdCode[]>([]);
  const [cpt, setCpt] = useState<CptCode[]>([]);
  const [pathway, setPathway] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [billOpen, setBillOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => encounters.filter((e) => {
    if (tab !== 'all' && e.status !== tab) return false;
    if (!q) return true;
    const p = patientById(e.patient_id);
    const hay = `${p?.name} ${e.narrative} ${(e.icd_codes || []).map((c) => c.code + ' ' + c.description).join(' ')}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [encounters, tab, q, patientById]);

  const active = encounters.find((e) => e.id === activeEncounterId) ?? list[0] ?? null;
  const patient = patientById(active?.patient_id);
  const canSign = !!roleDef?.canSign;
  // Non-clinicians (care managers) get a read-only coding view; the DB trigger enforces this too.
  const locked = active?.status === 'billed' || !canSign;

  useEffect(() => {
    if (!active) return;
    setIcd(active.icd_codes || []);
    setCpt(active.cpt_codes || []);
    setPathway(active.pathway);
    setNote(active.clinician_note || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.status]);

  const charge = computeCharge(cpt);
  const recommended = active?.decoded?.pathways?.find((p) => p.recommended)?.type;

  const save = async (status?: 'signed' | 'billed') => {
    if (!active) return;
    if (status && !icd.some((c) => c.status !== 'rejected' && c.type !== 'rule-out')) { toast.error('Accept at least one diagnosis before signing.'); return; }
    if (status && !cpt.some((c) => c.status !== 'rejected')) { toast.error('Accept at least one CPT code before signing.'); return; }
    setBusy(true);
    const finalize = (arr: any[]) => (status ? arr.map((c) => ({ ...c, status: c.status === 'rejected' ? 'rejected' : 'accepted' })) : arr);
    const res = await updateEncounter(active.id, {
      icd_codes: finalize(icd), cpt_codes: finalize(cpt), pathway, clinician_note: note, charge_cents: charge,
      ...(status ? { status } : {}),
    });
    setBusy(false);
    if (res) {
      toast.success(status === 'signed' ? 'Encounter signed — billable record created' : status === 'billed' ? 'Claim submitted' : 'Draft saved');
      if (status === 'billed') setBillOpen(true);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeader eyebrow="Clinician decoder" title="Understand the person. Confirm the plan." subtitle="Review the decoded concerns, confirm ICD-10 and CPT codes, choose a care pathway and generate a billable, signed record." />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Queue */}
        <aside className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient, symptom or code" className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-600" />
          </div>
          <div className="flex gap-1 rounded-xl bg-stone-100 p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize', tab === t ? 'bg-white text-ink shadow-sm' : 'text-stone-500')}>
                {t} <span className="text-stone-400">{t === 'all' ? encounters.length : encounters.filter((e) => e.status === t).length}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {list.map((e) => {
              const p = patientById(e.patient_id);
              return (
                <button key={e.id} onClick={() => setActiveEncounterId(e.id)}
                  className={cn('w-full text-left rounded-2xl border p-3.5 transition', active?.id === e.id ? 'border-teal-700 bg-teal-50/60 shadow-sm' : 'border-stone-200 bg-white hover:border-teal-600/40')}>
                  <div className="flex items-center gap-3">
                    <PatientAvatar patient={p} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{p?.name}</p>
                      <p className="text-[11px] text-stone-500">{formatDate(e.created_at)} · {channelById(e.channel).label}</p>
                    </div>
                    <StatusPill status={e.status} />
                  </div>
                  <p className="mt-2 text-xs text-stone-600 line-clamp-2">&ldquo;{e.narrative}&rdquo;</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(e.icd_codes || []).slice(0, 3).map((c) => <span key={c.code} className="font-mono text-[10px] rounded bg-teal-900 text-teal-100 px-1.5 py-0.5">{c.code}</span>)}
                  </div>
                </button>
              );
            })}
            {list.length === 0 && <p className="text-sm text-stone-500 text-center py-8">No encounters match.</p>}
          </div>
        </aside>

        {/* Detail */}
        <section className="lg:col-span-8">
          {!active ? (
            <EmptyState title="No encounter selected" body="When a patient shares their experience through the filter, it lands here for review." action={<button onClick={() => setView('filter')} className="rounded-full bg-teal-700 text-white px-5 py-2 text-sm font-semibold">Open patient filter</button>} />
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl bg-white border border-stone-200 p-5 flex flex-wrap items-center gap-4">
                <PatientAvatar patient={patient} size={56} />
                <div className="flex-1 min-w-[180px]">
                  <p className="text-lg font-semibold text-ink">{patient?.name}</p>
                  <p className="text-sm text-stone-500 font-mono">{patient?.mrn} · {patient?.age}{patient?.sex} · {patient?.payer}</p>
                </div>
                <div className="text-right">
                  <StatusPill status={active.status} />
                  <p className="mt-1 font-mono text-lg font-semibold text-ink">{money(charge)}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-coral-50/60 border border-coral-100 p-5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-coral-600 mb-2"><MessageSquareQuote className="h-3.5 w-3.5" /> In their words</p>
                  <p className="text-[15px] text-ink leading-relaxed">{active.filtered_narrative || active.narrative}</p>
                  {active.filtered_narrative && <p className="mt-3 text-xs text-stone-500 italic">Original: &ldquo;{active.narrative}&rdquo;</p>}
                  {(active.decoded?.what_matters || active.decision?.patient_priority) && (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm"><span className="font-semibold text-coral-600">What matters:</span> {active.decoded?.what_matters || active.decision?.patient_priority}</p>
                  )}
                </div>
                <div className="rounded-3xl bg-teal-950 text-teal-50 p-5">
                  <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-2"><Stethoscope className="h-3.5 w-3.5" /> Decoded summary</p>
                  <p className="font-mono text-[13px] leading-relaxed">{active.decoded?.clinical_summary}</p>
                  {!!active.decoded?.red_flags?.length && (
                    <p className="mt-3 text-xs text-coral-200 flex gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {active.decoded.red_flags.slice(0, 3).join(' · ')}</p>
                  )}
                  {!!active.decoded?.clarifying_questions?.length && (
                    <ul className="mt-3 text-xs text-teal-100/70 list-disc pl-4 space-y-0.5">{active.decoded.clarifying_questions.slice(0, 3).map((x, i) => <li key={i}>{x}</li>)}</ul>
                  )}
                </div>
              </div>

              <div className="grid xl:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white border border-stone-200 p-5">
                  <h3 className="font-semibold text-ink mb-3">Diagnoses <span className="font-mono text-xs text-stone-400">ICD-10-CM</span></h3>
                  <IcdEditor codes={icd} onChange={setIcd} locked={locked} />
                </div>
                <div className="rounded-3xl bg-white border border-stone-200 p-5">
                  <h3 className="font-semibold text-ink mb-3">Services <span className="font-mono text-xs text-stone-400">CPT / HCPCS</span></h3>
                  <CptEditor codes={cpt} onChange={setCpt} locked={locked} />
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-stone-200 p-5">
                <h3 className="font-semibold text-ink mb-3">Care pathway</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {PATHWAYS.map((p) => (
                    <button key={p.id} disabled={locked} onClick={() => setPathway(p.id)}
                      className={cn('relative text-left rounded-xl border p-3 transition', pathway === p.id ? 'border-teal-700 ring-2 ring-teal-700/20 bg-teal-50/50' : 'border-stone-200 hover:border-teal-600/40')}>
                      {recommended === p.id && <span className="absolute -top-2 right-2 rounded-full bg-coral-400 text-white text-[9px] font-bold uppercase px-1.5 py-0.5">suggested</span>}
                      <p.icon className="h-4 w-4" style={{ color: p.hex }} />
                      <p className="mt-1.5 text-xs font-semibold text-ink">{p.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-stone-200 p-5">
                <h3 className="font-semibold text-ink mb-2">Clinician attestation</h3>
                <textarea disabled={locked} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Assessment, plan and medical decision-making notes..." className="w-full min-h-[90px] rounded-xl border border-stone-200 p-3 text-sm outline-none focus:ring-2 focus:ring-teal-600" />
              </div>

              <div className="flex flex-wrap gap-3 sticky bottom-4 rounded-2xl bg-white/90 backdrop-blur border border-stone-200 p-3 shadow-lg">
                {!locked && <button onClick={() => save()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold hover:bg-stone-50"><Save className="h-4 w-4" /> Save draft</button>}
                <button onClick={() => { setActiveEncounterId(active.id); setSelectedPatientId(active.patient_id); setView('decide'); }} className="inline-flex items-center gap-2 rounded-xl border border-teal-700/30 text-teal-800 px-4 py-2.5 text-sm font-semibold hover:bg-teal-50"><Scale className="h-4 w-4" /> Shared decision</button>
                <div className="flex-1" />
                {!canSign && <span className="self-center text-xs text-stone-500">Coding, signing and billing are reserved for clinicians.</span>}
                {canSign && active.status === 'decoded' && <button onClick={() => save('signed')} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-teal-800"><PenLine className="h-4 w-4" /> Sign encounter</button>}
                {canSign && active.status === 'signed' && <button onClick={() => save('billed')} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-coral-400 text-white px-4 py-2.5 text-sm font-semibold hover:bg-coral-500"><CheckCheck className="h-4 w-4" /> Submit claim</button>}
                <button onClick={() => setBillOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 text-white px-4 py-2.5 text-sm font-semibold"><Receipt className="h-4 w-4" /> Billable record</button>
              </div>
            </div>
          )}
        </section>
      </div>
      <SuperbillDialog open={billOpen} onOpenChange={setBillOpen} encounter={active ? { ...active, icd_codes: icd, cpt_codes: cpt, pathway, clinician_note: note, charge_cents: charge } : null} patient={patient} />
    </div>
  );
};

export default ClinicianView;

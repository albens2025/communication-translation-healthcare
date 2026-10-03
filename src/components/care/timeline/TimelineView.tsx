import React, { useMemo } from 'react';
import { Download, ArrowRight, Plus, Quote } from 'lucide-react';
import { useCare } from '@/context/CareContext';
import { channelById, pathwayById } from '@/data/constants';
import { money } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CodeTag, EmptyState, PathwayPill, PatientAvatar, SectionHeader, StatusPill, formatDate } from '../shared';

const TimelineView: React.FC = () => {
  const { patients, selectedPatientId, setSelectedPatientId, patientById, encountersFor, setActiveEncounterId, setView, encounters, canView } = useCare();
  const patient = patientById(selectedPatientId) ?? patients[0];
  const list = encountersFor(patient?.id);

  const problems = useMemo(() => {
    const m = new Map<string, { code: string; description: string; count: number; first: string; last: string }>();
    list.forEach((e) => (e.icd_codes || []).filter((c) => c.status !== 'rejected' && c.type !== 'rule-out').forEach((c) => {
      const cur = m.get(c.code);
      if (cur) { cur.count++; cur.last = e.created_at; } else m.set(c.code, { code: c.code, description: c.description, count: 1, first: e.created_at, last: e.created_at });
    }));
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [list]);

  const total = list.reduce((s, e) => s + (e.charge_cents || 0), 0);

  const exportCsv = () => {
    const rows = [['date', 'channel', 'status', 'pathway', 'icd', 'cpt', 'decision', 'charge_usd', 'narrative']];
    list.forEach((e) => rows.push([
      e.created_at, e.channel, e.status, e.pathway ?? '',
      (e.icd_codes || []).map((c) => c.code).join(' '), (e.cpt_codes || []).map((c) => c.code).join(' '),
      e.decision?.chosen ?? '', String((e.charge_cents || 0) / 100), e.narrative,
    ]));
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${patient?.mrn}-longitudinal.csv`;
    a.click();
  };

  if (!patient) return <div className="mx-auto max-w-7xl px-4 py-10"><EmptyState title="No patients yet" body="Add someone through the patient filter." /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeader eyebrow="Longitudinal timeline" title="A care story, told over time." subtitle="Every conversation, decision and code — threaded into a single trajectory." />

      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 space-y-2">
          {patients.map((p) => {
            const n = encounters.filter((e) => e.patient_id === p.id).length;
            return (
              <button key={p.id} onClick={() => setSelectedPatientId(p.id)} className={cn('w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition', p.id === patient.id ? 'border-teal-700 bg-teal-50/60' : 'border-stone-200 bg-white hover:border-teal-600/40')}>
                <PatientAvatar patient={p} size={36} />
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-ink truncate">{p.name}</p><p className="text-[11px] text-stone-500">{n} encounters</p></div>
              </button>
            );
          })}
        </aside>

        <section className="lg:col-span-9 space-y-6">
          <div className="rounded-3xl bg-white border border-stone-200 p-6">
            <div className="flex flex-wrap items-center gap-5">
              <PatientAvatar patient={patient} size={72} />
              <div className="flex-1 min-w-[200px]">
                <h2 className="text-2xl font-semibold text-ink">{patient.name}</h2>
                <p className="font-mono text-sm text-stone-500">{patient.mrn} · {patient.age} · {patient.sex} · {patient.payer}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setView('filter')} className="inline-flex items-center gap-1.5 rounded-xl bg-coral-400 hover:bg-coral-500 text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> New conversation</button>
                <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-50"><Download className="h-4 w-4" /> CSV</button>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Encounters', String(list.length)],
                ['Active problems', String(problems.length)],
                ['Total billed', money(total)],
                ['First seen', list[0] ? formatDate(list[0].created_at) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-cream border border-stone-200/70 p-3"><p className="text-xs text-stone-500">{k}</p><p className="text-lg font-semibold text-ink">{v}</p></div>
              ))}
            </div>

            {/* Trajectory strip */}
            {list.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-stone-500 mb-3">Care trajectory</p>
                <div className="relative flex items-center justify-between px-2">
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-teal-200 via-coral-200 to-teal-200" />
                  {list.map((e) => {
                    const p = pathwayById(e.pathway);
                    const Icon = p?.icon;
                    return (
                      <button key={e.id} onClick={() => document.getElementById(`enc-${e.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="relative flex flex-col items-center group" title={p?.label}>
                        <span className="h-9 w-9 rounded-full grid place-items-center text-white ring-4 ring-white shadow" style={{ background: p?.hex ?? '#0F766E' }}>{Icon && <Icon className="h-4 w-4" />}</span>
                        <span className="mt-2 text-[10px] font-mono text-stone-500">{new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              {list.length === 0 && <EmptyState title="No conversations yet" body="Their first conversation will start the thread." />}
              <ol className="relative border-l-2 border-dashed border-teal-200 ml-4 space-y-6">
                {[...list].reverse().map((e) => (
                  <li key={e.id} id={`enc-${e.id}`} className="ml-6">
                    <span className="absolute -left-[9px] mt-5 h-4 w-4 rounded-full bg-coral-400 ring-4 ring-cream" />
                    <div className="rounded-3xl bg-white border border-stone-200 p-5 hover:shadow-lg transition">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{formatDate(e.created_at)}</span>
                        <span className="text-xs text-stone-500">· {channelById(e.channel).label}</span>
                        <div className="flex-1" />
                        <StatusPill status={e.status} />
                      </div>
                      <p className="mt-3 text-[15px] text-stone-700 flex gap-2"><Quote className="h-4 w-4 text-coral-300 shrink-0" />{e.filtered_narrative || e.narrative}</p>
                      {e.decoded?.clinical_summary && <p className="mt-3 font-mono text-xs text-teal-800 bg-teal-50 rounded-xl p-3">{e.decoded.clinical_summary}</p>}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(e.icd_codes || []).filter((c) => c.status !== 'rejected').map((c) => <CodeTag key={c.code} code={c.code} />)}
                        {(e.cpt_codes || []).filter((c) => c.status !== 'rejected').map((c) => <CodeTag key={c.code} code={c.code} kind="cpt" />)}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <PathwayPill id={e.pathway} />
                        {e.decision?.chosen && <span className="text-xs text-stone-600"><span className="font-semibold">Decided:</span> {e.decision.chosen}</span>}
                        <div className="flex-1" />
                        <span className="font-mono text-xs text-stone-500">{money(e.charge_cents || 0)}</span>
                        <button onClick={() => { setActiveEncounterId(e.id); setView(canView('clinician') ? 'clinician' : 'decide'); }} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900">{canView('clinician') ? 'Open' : 'Decide'} <ArrowRight className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-teal-950 text-teal-50 p-5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-3">Problem list</p>
                <div className="space-y-3">
                  {problems.map((p) => (
                    <div key={p.code}>
                      <div className="flex items-center gap-2"><CodeTag code={p.code} className="bg-teal-700 text-white" /><span className="text-xs font-mono text-coral-300">x{p.count}</span></div>
                      <p className="text-sm mt-1">{p.description}</p>
                      <p className="text-[11px] text-teal-300/70 font-mono">{formatDate(p.first)} &rarr; {formatDate(p.last)}</p>
                    </div>
                  ))}
                  {problems.length === 0 && <p className="text-sm text-teal-200/60">No confirmed diagnoses yet.</p>}
                </div>
              </div>
              {list.some((e) => e.decision?.patient_priority) && (
                <div className="rounded-3xl bg-coral-50 border border-coral-100 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-coral-600 mb-2">What has mattered</p>
                  <ul className="space-y-1.5 text-sm text-stone-700">
                    {list.filter((e) => e.decision?.patient_priority).map((e) => <li key={e.id}>&ldquo;{e.decision.patient_priority}&rdquo;</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TimelineView;

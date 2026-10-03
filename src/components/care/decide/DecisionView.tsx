import React, { useEffect, useMemo, useState } from 'react';
import { Scale, ThumbsUp, AlertCircle, Hourglass, BadgeCheck, Handshake, FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import { useCare } from '@/context/CareContext';
import { useAuth } from '@/context/AuthContext';
import { DECISION_VALUES, pathwayById } from '@/data/constants';
import type { DecisionOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, PathwayPill, PatientAvatar, SectionHeader, formatDate } from '../shared';

const EVIDENCE: Record<string, string> = { high: 'bg-teal-100 text-teal-800', moderate: 'bg-amber-100 text-amber-800', low: 'bg-stone-200 text-stone-700' };

function fallbackOptions(pathwayId?: string | null): DecisionOption[] {
  const p = pathwayById(pathwayId);
  return [
    { title: p ? `${p.label} (recommended)` : 'Recommended plan', benefits: p?.blurb ?? 'Addresses the main concern directly.', risks: 'Depends on the specific intervention; discussed with your clinician.', burden: 'Moderate — follow-up visits required.', evidence: 'high' },
    { title: 'Watchful waiting with a check-in', benefits: 'Avoids unnecessary tests or treatment if symptoms settle.', risks: 'A problem could be found later.', burden: 'Low — a follow-up call in 2–4 weeks.', evidence: 'moderate' },
    { title: 'Second opinion or specialist input', benefits: 'More certainty before committing.', risks: 'Delays the start of care.', burden: 'Extra appointment and travel.', evidence: 'moderate' },
  ];
}

const DecisionView: React.FC = () => {
  const { encounters, patientById, activeEncounterId, setActiveEncounterId, updateEncounter, setView, canView } = useCare();
  const { roleDef } = useAuth();
  const enc = encounters.find((e) => e.id === activeEncounterId) ?? encounters[0];
  const patient = patientById(enc?.patient_id);
  const options = useMemo(() => (enc?.decoded?.decision_options?.length ? enc.decoded.decision_options : fallbackOptions(enc?.pathway)), [enc]);

  const [values, setValues] = useState<Record<string, number>>({});
  const [chosen, setChosen] = useState<string>('');
  const [questions, setQuestions] = useState('');
  const [priority, setPriority] = useState('');
  const [agreeP, setAgreeP] = useState(false);
  const [agreeC, setAgreeC] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enc) return;
    const d = enc.decision || {};
    setValues(d.values ?? Object.fromEntries(DECISION_VALUES.map((v) => [v.id, 5])));
    setChosen(d.chosen ?? '');
    setQuestions(d.questions ?? '');
    setPriority(d.patient_priority ?? enc.decoded?.what_matters ?? '');
    setAgreeP(!!d.agreed_by_patient);
    setAgreeC(!!d.agreed_by_clinician);
  }, [enc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enc) return <div className="mx-auto max-w-7xl px-4 py-10"><EmptyState title="No conversations yet" body="Start with the patient filter." action={<button onClick={() => setView('filter')} className="rounded-full bg-teal-700 text-white px-5 py-2 text-sm font-semibold">Open filter</button>} /></div>;

  const topValues = Object.entries(values).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => DECISION_VALUES.find((v) => v.id === id)?.label);
  const goalsOfCare = ['advance-directive', 'palliative', 'end-of-life'].includes(enc.pathway ?? '');

  const save = async () => {
    if (!chosen) { toast.error('Choose an option together first.'); return; }
    setSaving(true);
    const res = await updateEncounter(enc.id, {
      decision: { chosen, values, questions, patient_priority: priority, agreed_by_patient: agreeP, agreed_by_clinician: agreeC, decided_at: new Date().toISOString() },
    });
    setSaving(false);
    if (res) toast.success(agreeP && agreeC ? 'Shared decision documented' : 'Decision saved — awaiting agreement');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeader
        eyebrow="Shared decision"
        title="Decide together, on your terms."
        subtitle="Options in plain language, weighed against what matters most. Autonomy is the experience — decision and action are the outcome."
        right={
          <select value={enc.id} onChange={(e) => setActiveEncounterId(e.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm max-w-xs">
            {encounters.map((e) => <option key={e.id} value={e.id}>{patientById(e.patient_id)?.name} — {formatDate(e.created_at)}</option>)}
          </select>
        }
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-3xl bg-white border border-stone-200 p-5">
            <div className="flex items-center gap-3">
              <PatientAvatar patient={patient} size={48} />
              <div><p className="font-semibold text-ink">{patient?.name}</p><p className="text-xs text-stone-500">{formatDate(enc.created_at)}</p></div>
            </div>
            <p className="mt-4 text-sm text-stone-700 italic">&ldquo;{enc.filtered_narrative || enc.narrative}&rdquo;</p>
            <div className="mt-3"><PathwayPill id={enc.pathway} /></div>
          </div>

          <div className="rounded-3xl bg-white border border-stone-200 p-5">
            <h3 className="font-semibold text-ink">What matters most?</h3>
            <p className="text-xs text-stone-500 mb-4">Slide to show how important each is to you.</p>
            <div className="space-y-4">
              {DECISION_VALUES.map((v) => (
                <div key={v.id}>
                  <div className="flex justify-between text-sm"><span className="text-stone-700">{v.label}</span><span className="font-mono text-xs text-teal-700">{values[v.id] ?? 5}</span></div>
                  <input type="range" min={0} max={10} value={values[v.id] ?? 5} onChange={(e) => setValues((s) => ({ ...s, [v.id]: Number(e.target.value) }))} className="w-full accent-teal-700" />
                </div>
              ))}
            </div>
            <input value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="In your words, what matters most?" className="mt-4 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl bg-teal-50 border border-teal-100 px-4 py-3 text-sm text-teal-900 flex items-center gap-2">
            <Scale className="h-4 w-4" /> Top priorities: <span className="font-semibold">{topValues.join(' and ')}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {options.map((o) => (
              <button key={o.title} onClick={() => setChosen(o.title)}
                className={cn('text-left rounded-3xl border p-5 transition bg-white', chosen === o.title ? 'border-teal-700 ring-4 ring-teal-700/10' : 'border-stone-200 hover:border-teal-600/40')}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-ink">{o.title}</h3>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', EVIDENCE[o.evidence] ?? EVIDENCE.low)}>{o.evidence} evidence</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="flex gap-2 text-stone-700"><ThumbsUp className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />{o.benefits}</p>
                  <p className="flex gap-2 text-stone-700"><AlertCircle className="h-4 w-4 text-coral-400 shrink-0 mt-0.5" />{o.risks}</p>
                  <p className="flex gap-2 text-stone-700"><Hourglass className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />{o.burden}</p>
                </div>
                {chosen === o.title && <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700"><BadgeCheck className="h-4 w-4" /> Our choice</p>}
              </button>
            ))}
          </div>

          {goalsOfCare && (
            <div className="rounded-3xl bg-orange-50 border border-orange-100 p-5 flex gap-3">
              <FileSignature className="h-5 w-5 text-orange-600 shrink-0" />
              <div className="text-sm text-orange-900">
                <p className="font-semibold">Goals-of-care conversation</p>
                <p>Consider naming a healthcare proxy, completing a POLST/advance directive, and documenting time spent (CPT 99497 / 99498).</p>
              </div>
            </div>
          )}

          <div className="rounded-3xl bg-white border border-stone-200 p-5 space-y-4">
            <textarea value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="Questions or concerns still on your mind..." className="w-full min-h-[80px] rounded-xl border border-stone-200 p-3 text-sm" />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className={cn('flex items-center gap-3 rounded-xl border p-3 cursor-pointer', agreeP ? 'border-coral-300 bg-coral-50' : 'border-stone-200')}>
                <input type="checkbox" checked={agreeP} onChange={(e) => setAgreeP(e.target.checked)} className="accent-coral-500" />
                <span className="text-sm">I understand my options and this choice reflects my wishes</span>
              </label>
              <label className={cn('flex items-center gap-3 rounded-xl border p-3 cursor-pointer', agreeC ? 'border-teal-300 bg-teal-50' : 'border-stone-200')}>
                <input type="checkbox" checked={agreeC} disabled={!roleDef?.canSign} onChange={(e) => setAgreeC(e.target.checked)} className="accent-teal-700" />
                <span className="text-sm">Clinician: options, risks and alternatives were discussed{!roleDef?.canSign && <span className="block text-[11px] text-stone-400">Confirmed by your clinician</span>}</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"><Handshake className="h-4 w-4" /> {saving ? 'Saving...' : 'Document shared decision'}</button>
              {canView('clinician')
                ? <button onClick={() => setView('clinician')} className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold hover:bg-stone-50">Back to coding</button>
                : <button onClick={() => setView('timeline')} className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold hover:bg-stone-50">View my timeline</button>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DecisionView;

import React from 'react';
import { MessageSquareText, Binary, Scale, Receipt, ArrowUpRight, CalendarDays, Lock, ShieldCheck } from 'lucide-react';
import { useCare } from '@/context/CareContext';
import { useAuth } from '@/context/AuthContext';
import { BOOKING_URL, CHANNELS, PATHWAYS, SIGNUP_ROLES } from '@/data/constants';
import { money } from '@/lib/api';
import { PatientAvatar } from '../shared';
import SignupForm from '../SignupForm';

const STEPS = [
  { icon: MessageSquareText, title: 'Express', body: 'Patients, caregivers or members describe what they live with — typed or spoken — and choose a filter that helps them say it best.', tag: 'lived experience' },
  { icon: Binary, title: 'Decode', body: 'The decoder maps lay phrases to clinical concepts, probable ICD-10 codes with confidence, red flags and clarifying questions.', tag: 'ICD-10-CM' },
  { icon: Scale, title: 'Decide together', body: 'Options are laid out in plain language with benefits, risks and burden, weighed against what matters most to the patient.', tag: 'shared decision' },
  { icon: Receipt, title: 'Record & bill', body: 'The clinician confirms codes and CPT pathway. A signed, billable record joins the patient\u2019s longitudinal cohort.', tag: 'CPT / HCPCS' },
];

export const HowItWorks: React.FC = () => (
  <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">How it works</p>
      <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-ink">Two languages. One shared decision.</h2>
      <p className="mt-3 text-stone-600">Autonomy is the experience. Decision and action are the outcome.</p>
    </div>
    <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s, i) => (
        <div key={s.title} className="group relative rounded-3xl bg-white border border-stone-200/80 p-6 hover:shadow-xl hover:shadow-teal-900/5 hover:-translate-y-1 transition">
          <span className="absolute top-5 right-6 font-mono text-5xl font-semibold text-stone-100 group-hover:text-coral-100 transition">0{i + 1}</span>
          <div className="h-11 w-11 rounded-2xl bg-teal-700 text-white grid place-items-center"><s.icon className="h-5 w-5" /></div>
          <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">{s.body}</p>
          <span className="mt-4 inline-block font-mono text-[11px] text-teal-700 bg-teal-50 rounded px-2 py-0.5">{s.tag}</span>
        </div>
      ))}
    </div>
  </section>
);

export const ChannelsSection: React.FC = () => {
  const { setView } = useCare();
  return (
    <section className="bg-teal-950 text-teal-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-300">Every conversation</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-white">The filter adapts to who is listening.</h2>
            <p className="mt-4 text-teal-100/70">The same lived experience reads differently to a doctor, a care manager, an insurer or an employer. Kindred rewrites the message for each audience while protecting what is private.</p>
            <button onClick={() => setView('filter')} className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral-400 hover:bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white">Choose a channel <ArrowUpRight className="h-4 w-4" /></button>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
            {CHANNELS.map((c) => (
              <button key={c.id} onClick={() => setView('filter')} className="text-left rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-700 grid place-items-center"><c.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-white">{c.label}</p>
                    <p className="font-mono text-[11px] text-teal-300">{c.from} &rarr; {c.to}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-teal-100/70">{c.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const PathwaysSection: React.FC = () => {
  const { setView } = useCare();
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">Care pathways</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-ink">From reassurance to end-of-life — every path is a plan.</h2>
        </div>
        <button onClick={() => setView('decide')} className="text-sm font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1">Explore shared decisions <ArrowUpRight className="h-4 w-4" /></button>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PATHWAYS.map((p) => (
          <button key={p.id} onClick={() => setView('cohort')} className="text-left rounded-2xl bg-white border border-stone-200/80 p-5 hover:border-teal-700/30 hover:shadow-lg transition group">
            <div className={`h-10 w-10 rounded-xl grid place-items-center ${p.color}`}><p.icon className="h-5 w-5" /></div>
            <p className="mt-4 font-semibold text-ink">{p.label}</p>
            <p className="mt-1 text-sm text-stone-600">{p.blurb}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export const PatientsSection: React.FC = () => {
  const { patients, encounters, setView, setSelectedPatientId, canView } = useCare();
  const { profile, openAuth } = useAuth();

  if (!profile || patients.length === 0) {
    return (
      <section className="bg-white border-y border-stone-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">Role-based access</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-ink max-w-2xl">Everyone sees exactly what they should — nothing more.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SIGNUP_ROLES.map((r) => (
              <div key={r.id} className="rounded-3xl border border-stone-200 bg-cream p-5">
                <div className="flex items-center gap-2">
                  {r.seesCodes ? <Binary className="h-4 w-4 text-teal-700" /> : <Lock className="h-4 w-4 text-coral-500" />}
                  <p className="font-semibold text-ink">{r.label}</p>
                  {r.requiresApproval && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold"><ShieldCheck className="h-3 w-3" /> Admin-approved</span>}
                </div>
                <p className="mt-2 text-sm text-stone-600">{r.blurb}</p>
                <p className="mt-3 font-mono text-[11px] text-stone-500">{r.seesCodes ? 'ICD-10 / CPT visible' : 'Codes hidden by database policy'}</p>
              </div>
            ))}
          </div>
          {!profile ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => openAuth('signup')} className="rounded-full bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 text-sm font-semibold">Create an account</button>
              <button onClick={() => openAuth('signin')} className="rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold hover:border-teal-700/40">Sign in</button>
            </div>
          ) : profile.role === 'admin' ? (
            <button onClick={() => setView('admin')} className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 text-sm font-semibold"><ShieldCheck className="h-4 w-4" /> Review account approvals</button>
          ) : (
            <p className="mt-8 text-sm text-stone-600">No one is linked to your account yet. Use the account menu to link by share code or load the demo panel.</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border-y border-stone-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">Your longitudinal cohort</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-ink max-w-2xl">Every conversation adds a chapter to a living story.</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {patients.slice(0, 6).map((p) => {
            const list = encounters.filter((e) => e.patient_id === p.id);
            const total = list.reduce((s, e) => s + (e.charge_cents || 0), 0);
            const last = list[0];
            return (
              <button key={p.id} onClick={() => { setSelectedPatientId(p.id); setView(canView('timeline') ? 'timeline' : 'messages'); }} className="text-left rounded-3xl border border-stone-200 bg-cream p-5 hover:shadow-xl hover:-translate-y-0.5 transition">
                <div className="flex items-center gap-4">
                  <PatientAvatar patient={p} size={56} />
                  <div>
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-stone-500">{p.age ?? '—'} &middot; {p.sex ?? '—'} &middot; {p.payer ?? 'No payer'}</p>
                  </div>
                </div>
                {last?.decision?.patient_priority && (
                  <p className="mt-4 text-sm text-stone-700 italic">&ldquo;What matters: {last.decision.patient_priority}&rdquo;</p>
                )}
                {canView('timeline') && (
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-mono text-teal-700">{list.length} encounters</span>
                    <span className="font-mono text-stone-500">{money(total)} billed</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const PilotSection: React.FC = () => (
  <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
    <div className="rounded-[32px] bg-gradient-to-br from-teal-700 to-teal-900 p-8 md:p-12 grid lg:grid-cols-2 gap-10 text-white overflow-hidden relative">
      <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-coral-400/30 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-200">For clinics, plans &amp; employers</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Pilot Kindred with your care team.</h2>
        <p className="mt-4 text-teal-100/80">Turn every patient conversation into structured, billable, longitudinal data — without losing the human voice.</p>
        <ul className="mt-6 space-y-2 text-sm text-teal-50/90">
          <li className="flex gap-2"><Lock className="h-4 w-4 mt-0.5 text-coral-200" /> Diagnoses stay private in employer-facing messages</li>
          <li className="flex gap-2"><Receipt className="h-4 w-4 mt-0.5 text-coral-200" /> Superbill-ready ICD-10 + CPT output</li>
          <li className="flex gap-2"><Scale className="h-4 w-4 mt-0.5 text-coral-200" /> Documented shared decision-making</li>
        </ul>
        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-teal-800 px-5 py-2.5 text-sm font-semibold hover:bg-teal-50">
          <CalendarDays className="h-4 w-4" /> Book a 30-minute walkthrough
        </a>
      </div>
      <div className="relative rounded-2xl bg-white/10 border border-white/15 p-6 backdrop-blur">
        <h3 className="font-semibold mb-4">Request pilot access</h3>
        <SignupForm source="contact-form" tags={['pilot-request', 'waitlist']} withName withMessage dark cta="Request access" />
      </div>
    </div>
  </section>
);

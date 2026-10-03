import React, { useEffect, useMemo, useState } from 'react';
import { Mic, MicOff, Wand2, Send, UserPlus, RotateCcw, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useCare } from '@/context/CareContext';
import { useAuth } from '@/context/AuthContext';
import { CHANNELS, FILTER_STYLES, SAMPLE_NARRATIVES } from '@/data/constants';
import { liveDecode } from '@/data/lexicon';
import { decodeNarrative, computeCharge } from '@/lib/api';
import type { Decoded } from '@/lib/types';
import { useSpeech } from '@/hooks/useSpeech';
import { cn } from '@/lib/utils';
import { PatientAvatar, SectionHeader } from '../shared';
import DecoderPanel, { PatientVoiceCard } from './DecoderPanel';
import AddPatientDialog from '../AddPatientDialog';

const FilterView: React.FC = () => {
  const { patients, selectedPatientId, setSelectedPatientId, patientById, encountersFor, createEncounter, setActiveEncounterId, setView, canView } = useCare();
  const { profile, roleDef, openAuth } = useAuth();
  const [text, setText] = useState('');
  const [channel, setChannel] = useState(roleDef?.defaultChannel ?? CHANNELS[0].id);
  const [style, setStyle] = useState(FILTER_STYLES[0].id);
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => { if (roleDef) setChannel(roleDef.defaultChannel); }, [roleDef]);

  const patient = patientById(selectedPatientId);
  const speech = useSpeech((t) => setText((prev) => (prev ? prev + ' ' : '') + t));
  const liveHits = useMemo(() => liveDecode(text + ' ' + speech.interim), [text, speech.interim]);

  const applyFilter = async () => {
    if (text.trim().length < 10) { toast.error('Tell us a bit more — at least a sentence.'); return; }
    if (speech.listening) speech.stop();
    setLoading(true);
    setDecoded(null);
    try {
      const history = encountersFor(selectedPatientId).flatMap((e) => (e.icd_codes || []).map((c) => `${c.code} ${c.description}`));
      const res = await decodeNarrative({ narrative: text, filterStyle: style, channel, age: patient?.age, sex: patient?.sex, history: [...new Set(history)] });
      setDecoded(res);
    } catch (e) {
      console.error(e);
      toast.error('The decoder is unavailable right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendToClinician = async () => {
    if (!profile) { openAuth('signin'); toast.message('Sign in to share this with your care team'); return; }
    if (!decoded || !selectedPatientId) { toast.error('Select who this is for first.'); return; }
    setSending(true);
    const icd = (decoded.icd || []).map((c) => ({ ...c, status: 'pending' as const }));
    const cpt = (decoded.cpt || []).map((c) => ({ ...c, units: c.units || 1, status: 'pending' as const }));
    const rec = decoded.pathways?.find((p) => p.recommended)?.type ?? decoded.pathways?.[0]?.type ?? null;
    const created = await createEncounter({
      patient_id: selectedPatientId, channel, filter_style: style, narrative: text,
      filtered_narrative: decoded.filtered_text, decoded, icd_codes: icd, cpt_codes: cpt,
      pathway: rec, status: 'decoded', charge_cents: computeCharge(cpt),
      decision: { patient_priority: decoded.what_matters },
    });
    setSending(false);
    if (created) {
      toast.success('Shared with the care team');
      setActiveEncounterId(created.id);
      setView(canView('clinician') ? 'clinician' : 'timeline');
    }
  };

  const reset = () => { setText(''); setDecoded(null); };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeader
        eyebrow="Patient filter"
        title="Tell it the way you live it."
        subtitle="Speak or type in your own words. Pick a filter to help express yourself, and see how your story will be understood on the other side."
      />

      {/* Who + channel */}
      <div className="grid lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-5 rounded-2xl bg-white border border-stone-200 p-4">
          <p className="text-xs font-semibold text-stone-500 mb-2">{profile?.role === 'patient' ? 'Sharing as' : 'Who is this about?'}</p>
          {!profile ? (
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-teal-700 shrink-0" />
              <p className="text-sm text-stone-600 flex-1">Try the filter freely. <button onClick={() => openAuth('signin')} className="font-semibold text-teal-700 hover:underline">Sign in</button> to save it to a record.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {patients.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPatientId(p.id)} title={p.name}
                    className={cn('shrink-0 rounded-full p-0.5 transition', selectedPatientId === p.id ? 'ring-2 ring-coral-400' : 'opacity-60 hover:opacity-100')}>
                    <PatientAvatar patient={p} size={40} />
                  </button>
                ))}
                {roleDef?.canCreatePatients && (
                  <button onClick={() => setAddOpen(true)} className="shrink-0 h-10 w-10 rounded-full border-2 border-dashed border-stone-300 grid place-items-center text-stone-500 hover:border-teal-600 hover:text-teal-700" aria-label="Add person">
                    <UserPlus className="h-4 w-4" />
                  </button>
                )}
              </div>
              {patient && <p className="mt-2 text-sm text-ink"><span className="font-semibold">{patient.name}</span> <span className="text-stone-500">· {patient.age ?? '—'} · {patient.payer ?? 'No payer on file'}</span></p>}
              {!patient && patients.length === 0 && <p className="mt-1 text-sm text-stone-500">No one linked yet — add a person or use the account menu to link by share code.</p>}
            </>
          )}
        </div>
        <div className="lg:col-span-7 rounded-2xl bg-white border border-stone-200 p-4">
          <p className="text-xs font-semibold text-stone-500 mb-2">Who are you talking to?</p>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button key={c.id} onClick={() => setChannel(c.id)}
                className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition',
                  channel === c.id ? 'bg-teal-700 border-teal-700 text-white' : 'border-stone-200 text-stone-600 hover:border-teal-600')}>
                <c.icon className="h-3.5 w-3.5" /> {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 relative">
        {/* Left: narrative */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-coral-500">Your experience</span>
              <span className="text-xs text-stone-400">{text.length} chars</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I get winded walking to the mailbox and my ankles swell by evening..."
              className="w-full min-h-[180px] resize-y bg-transparent text-[17px] leading-relaxed text-ink placeholder:text-stone-400 outline-none"
            />
            {speech.interim && <p className="text-stone-400 italic text-sm">{speech.interim}</p>}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => (speech.listening ? speech.stop() : speech.supported ? speech.start() : toast.error('Voice input is not supported in this browser'))}
                className={cn('h-12 w-12 rounded-full grid place-items-center transition', speech.listening ? 'bg-coral-400 text-white listen-pulse' : 'bg-coral-50 text-coral-500 hover:bg-coral-100')}
                aria-label={speech.listening ? 'Stop listening' : 'Speak'}
              >
                {speech.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <span className="text-sm text-stone-500">{speech.listening ? 'Listening... speak naturally' : 'Tap to speak instead of typing'}</span>
              {text && <button onClick={reset} className="ml-auto text-stone-400 hover:text-ink" aria-label="Clear"><RotateCcw className="h-4 w-4" /></button>}
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-stone-500 mb-2">Filter</p>
              <div className="flex flex-wrap gap-2">
                {FILTER_STYLES.map((f) => (
                  <button key={f.id} onClick={() => setStyle(f.id)} title={f.desc}
                    className={cn('rounded-xl px-3.5 py-2 text-sm border transition text-left',
                      style === f.id ? 'border-coral-400 bg-coral-50 text-coral-700 font-semibold' : 'border-stone-200 text-stone-600 hover:border-coral-300')}>
                    {f.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-stone-500">{FILTER_STYLES.find((f) => f.id === style)?.desc}</p>
            </div>

            <button onClick={applyFilter} disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white py-3.5 font-semibold shadow-lg shadow-teal-700/20 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Apply filter &amp; decode
            </button>
          </div>

          {!decoded && (
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4">
              <p className="text-xs font-semibold text-stone-500 mb-2">Not sure how to start? Try one:</p>
              <div className="space-y-2">
                {SAMPLE_NARRATIVES.map((s) => (
                  <button key={s} onClick={() => setText(s)} className="block w-full text-left text-sm text-stone-700 rounded-xl bg-white border border-stone-200 px-3 py-2 hover:border-teal-600">
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {decoded && <PatientVoiceCard decoded={decoded} />}
          {decoded && (
            <button onClick={sendToClinician} disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-coral-400 hover:bg-coral-500 text-white py-3.5 font-semibold shadow-lg shadow-coral-400/30 disabled:opacity-60">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Share with my care team
            </button>
          )}
        </div>

        {/* Thread connector */}
        <svg className="hidden lg:block absolute left-1/2 top-24 -translate-x-1/2 w-10 h-40 pointer-events-none" viewBox="0 0 40 160" aria-hidden>
          <path d="M0 10 C 30 40, 10 120, 40 150" stroke="#FB7185" strokeWidth="2" fill="none" className={liveHits.length || decoded ? 'thread-flow' : ''} opacity={liveHits.length || decoded ? 1 : 0.2} />
        </svg>

        {/* Right: decoder */}
        <div className="lg:sticky lg:top-24 self-start">
          <DecoderPanel liveHits={liveHits} decoded={decoded} loading={loading} channel={channel} />
        </div>
      </div>

      <AddPatientDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
};

export default FilterView;

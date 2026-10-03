import React from 'react';
import { AlertTriangle, HelpCircle, Radio, Sparkles, Heart, Target, Mail, Loader2 } from 'lucide-react';
import type { Decoded } from '@/lib/types';
import type { LiveHit } from '@/data/lexicon';
import { channelById, URGENCY_STYLES } from '@/data/constants';
import { CodeTag, ConfidenceBar } from '../shared';
import { cn } from '@/lib/utils';

interface Props {
  liveHits: LiveHit[];
  decoded: Decoded | null;
  loading: boolean;
  channel: string;
}

const DecoderPanel: React.FC<Props> = ({ liveHits, decoded, loading, channel }) => {
  const ch = channelById(channel);

  return (
    <div className="rounded-3xl bg-teal-950 text-teal-50 p-6 shadow-2xl shadow-teal-900/20 min-h-[560px] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className={cn('h-4 w-4', loading ? 'text-coral-300 animate-pulse' : 'text-teal-300')} />
          <span className="font-mono text-xs uppercase tracking-widest text-teal-300">Clinical decoder</span>
        </div>
        {decoded?.urgency && (
          <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase', URGENCY_STYLES[decoded.urgency])}>{decoded.urgency}</span>
        )}
      </div>

      {loading && (
        <div className="flex-1 grid place-items-center text-center">
          <div>
            <Loader2 className="h-8 w-8 animate-spin text-coral-300 mx-auto" />
            <p className="mt-3 font-mono text-sm text-teal-200">Translating lived experience into clinical structure...</p>
          </div>
        </div>
      )}

      {!loading && !decoded && (
        <div className="mt-5 flex-1">
          <p className="text-sm text-teal-100/70">Live decoding as you speak or type. Apply the filter for the full translation.</p>
          <div className="mt-5 space-y-3">
            {liveHits.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-teal-100/50 font-mono">listening for clinical signals...</div>
            )}
            {liveHits.map((h) => (
              <div key={h.code} className="rounded-xl bg-white/5 border border-white/10 p-3 animate-slide-in">
                <div className="flex items-center gap-2">
                  <CodeTag code={h.code} className="bg-teal-700 text-white" />
                  <span className="text-sm text-white flex-1 truncate">{h.description}</span>
                </div>
                <p className="mt-1.5 text-xs text-teal-200/80"><span className="text-coral-300">&ldquo;{h.matched}&rdquo;</span> &rarr; <span className="font-mono">{h.clinical}</span></p>
                <ConfidenceBar value={h.confidence} className="mt-2 [&_span]:text-teal-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && decoded && (
        <div className="mt-5 space-y-5 animate-fade-in">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-1.5">HPI summary</p>
            <p className="font-mono text-[13px] leading-relaxed text-teal-50">{decoded.clinical_summary}</p>
          </div>

          {!!decoded.symptoms?.length && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-2">Lay &rarr; clinical</p>
              <div className="flex flex-wrap gap-2">
                {decoded.symptoms.map((s, i) => (
                  <span key={i} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs">
                    <span className="text-coral-200">{s.lay}</span> <span className="text-teal-400">&rarr;</span> <span className="font-mono text-teal-100">{s.clinical}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-2">Probable ICD-10-CM</p>
            <div className="space-y-2">
              {decoded.icd?.map((c) => (
                <div key={c.code} className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <CodeTag code={c.code} className="bg-teal-700 text-white" />
                    <span className="text-sm text-white flex-1">{c.description}</span>
                    <span className="text-[10px] uppercase font-semibold text-teal-300">{c.type}</span>
                  </div>
                  <ConfidenceBar value={c.confidence} className="mt-2 [&_span]:text-teal-300" />
                  {c.rationale && <p className="mt-1.5 text-xs text-teal-100/60">{c.rationale}</p>}
                </div>
              ))}
            </div>
          </div>

          {!!decoded.red_flags?.length && (
            <div className="rounded-xl bg-coral-500/10 border border-coral-400/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-coral-200 mb-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Red flags to watch</p>
              <ul className="text-xs text-coral-100/90 space-y-0.5 list-disc pl-4">{decoded.red_flags.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}

          {!!decoded.clarifying_questions?.length && (
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-1.5"><HelpCircle className="h-3.5 w-3.5" /> Clinician may ask</p>
              <ul className="text-sm text-teal-100/80 space-y-1 list-disc pl-4">{decoded.clarifying_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {!loading && decoded && (
        <div className="mt-6 rounded-2xl bg-white text-ink p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 mb-1.5"><Mail className="h-3.5 w-3.5" /> Message for {ch.to}</p>
          <p className="text-sm text-stone-700 leading-relaxed">{decoded.audience_message}</p>
        </div>
      )}
    </div>
  );
};

export const PatientVoiceCard: React.FC<{ decoded: Decoded }> = ({ decoded }) => (
  <div className="rounded-3xl bg-white border border-stone-200 p-6 animate-slide-in">
    <div className="flex items-center gap-2 mb-3">
      <Sparkles className="h-4 w-4 text-coral-400" />
      <span className="text-xs font-semibold uppercase tracking-wider text-coral-500">Your filtered voice</span>
      {decoded.emotion && <span className="ml-auto rounded-full bg-coral-50 text-coral-600 px-2.5 py-0.5 text-xs capitalize">feeling {decoded.emotion}</span>}
    </div>
    <p className="text-[17px] leading-relaxed text-ink">{decoded.filtered_text}</p>
    <div className="mt-5 grid sm:grid-cols-2 gap-4">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5"><Heart className="h-3.5 w-3.5 text-coral-400" /> Worries heard</p>
        <ul className="text-sm text-stone-700 space-y-1">{decoded.worries?.map((w, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 rounded-full bg-coral-400 shrink-0" />{w}</li>)}</ul>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5"><Target className="h-3.5 w-3.5 text-teal-600" /> Goals</p>
        <ul className="text-sm text-stone-700 space-y-1">{decoded.goals?.map((g, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 rounded-full bg-teal-600 shrink-0" />{g}</li>)}</ul>
      </div>
    </div>
    {decoded.what_matters && (
      <div className="mt-5 rounded-2xl bg-teal-50 p-4">
        <p className="text-xs font-semibold text-teal-700">What matters most to you</p>
        <p className="text-sm text-teal-900 mt-1">{decoded.what_matters}</p>
      </div>
    )}
  </div>
);

export default DecoderPanel;

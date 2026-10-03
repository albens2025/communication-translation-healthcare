import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { useCare } from '@/context/CareContext';
import { HERO_IMAGE } from '@/data/constants';
import { CodeTag } from '../shared';

const DEMOS = [
  {
    voice: 'I get winded walking to the mailbox and my ankles look like balloons by evening.',
    hpi: 'Exertional dyspnea with bilateral LE edema, progressive x4 wks.',
    codes: [{ c: 'R06.02', d: 'Shortness of breath', p: 0.9 }, { c: 'I50.9', d: 'Heart failure, unspecified', p: 0.78 }],
    cpt: '99214 · 93306',
  },
  {
    voice: 'Work stress is crushing me. I wake at 3am with my heart racing.',
    hpi: 'Early-morning awakening with nocturnal palpitations; psychosocial stressor.',
    codes: [{ c: 'G47.00', d: 'Insomnia, unspecified', p: 0.84 }, { c: 'R00.2', d: 'Palpitations', p: 0.77 }],
    cpt: '99214 · 93000',
  },
  {
    voice: 'The cancer doctor says more chemo, but I just want to be home with my garden.',
    hpi: 'Patient prioritizes home and quality of life over further chemotherapy.',
    codes: [{ c: 'Z71.89', d: 'Other specified counseling', p: 0.86 }, { c: 'Z51.5', d: 'Encounter for palliative care', p: 0.81 }],
    cpt: '99497 · 99215',
  },
];

const Hero: React.FC = () => {
  const { setView } = useCare();
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [decoded, setDecoded] = useState(false);
  const demo = DEMOS[idx];

  useEffect(() => {
    setTyped('');
    setDecoded(false);
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = setInterval(() => {
      i++;
      setTyped(demo.voice.slice(0, i));
      if (i >= demo.voice.length) {
        clearInterval(t);
        timers.push(setTimeout(() => setDecoded(true), 400));
        timers.push(setTimeout(() => setIdx((x) => (x + 1) % DEMOS.length), 5200));
      }
    }, 32);
    return () => { clearInterval(t); timers.forEach(clearTimeout); };
  }, [idx, demo.voice]);
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute top-20 right-0 h-[420px] w-[420px] rounded-full bg-coral-200/40 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 lg:pt-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-stone-200 px-3 py-1 text-xs font-medium text-teal-800 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-coral-400" /> A filter for how you feel, a decoder for how it is treated
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-ink leading-[1.05]">
            Say it your way.<br />
            <span className="text-teal-700">We make sure it is heard </span>
            <span className="font-mono text-coral-400 text-[0.82em]">clinically.</span>
          </h1>
          <p className="mt-6 text-lg text-stone-600 max-w-lg">
            Patients speak lived experience. Doctors speak ICD and CPT. Kindred translates both ways — so every visit ends in a shared decision, a billable record, and a story that grows over time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setView('filter')} className="inline-flex items-center gap-2 rounded-full bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 font-semibold shadow-lg shadow-teal-700/25 transition">
              Share your experience <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => setView('clinician')} className="inline-flex items-center gap-2 rounded-full bg-white border border-stone-200 hover:border-teal-700/40 px-6 py-3 font-semibold text-ink transition">
              <Play className="h-4 w-4 text-coral-400" /> Open clinician view
            </button>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-stone-500">
            <div><span className="block text-2xl font-semibold text-ink">12</span>care pathways</div>
            <div className="h-10 w-px bg-stone-200" />
            <div><span className="block text-2xl font-semibold text-ink">6</span>conversation channels</div>
            <div className="h-10 w-px bg-stone-200" />
            <div><span className="block text-2xl font-semibold text-ink">1</span>longitudinal record</div>
          </div>
        </div>

        <div className="lg:col-span-7 relative">
          <div className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-teal-900/10 aspect-[16/10]">
            <img src={HERO_IMAGE} alt="Doctor and patient in conversation" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-950/70 via-teal-950/10 to-transparent" />
          </div>

          {/* Patient bubble */}
          <div className="absolute -left-2 sm:-left-8 top-6 w-[62%] sm:w-[52%] rounded-2xl rounded-bl-sm bg-white p-4 shadow-xl float-y">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-coral-400 listen-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-coral-500">Patient voice</span>
            </div>
            <p className="text-[15px] leading-snug text-ink caret min-h-[66px]">{typed}</p>
          </div>

          {/* Thread */}
          <svg className="absolute left-[40%] top-[34%] w-[22%] h-[30%] hidden sm:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path d="M0 0 C 50 10, 40 90, 100 100" stroke="#FB7185" strokeWidth="2" fill="none" className="thread-flow" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Clinical card */}
          <div className={`absolute -right-2 sm:-right-6 bottom-12 w-[70%] sm:w-[58%] rounded-2xl bg-teal-950/95 backdrop-blur p-4 text-teal-50 shadow-2xl transition-all duration-700 ${decoded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-teal-300">Clinical decode</span>
              <span className="font-mono text-[11px] text-coral-300">CPT {demo.cpt}</span>
            </div>
            <p className="font-mono text-[12.5px] leading-relaxed text-teal-100">{demo.hpi}</p>
            <div className="mt-3 space-y-2">
              {demo.codes.map((c) => (
                <div key={c.c} className="flex items-center gap-2">
                  <CodeTag code={c.c} className="bg-teal-700 text-white" />
                  <span className="text-xs text-teal-100/80 flex-1 truncate">{c.d}</span>
                  <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-coral-400 reveal-bar" style={{ width: decoded ? `${c.p * 100}%` : '0%' }} />
                  </div>
                  <span className="font-mono text-[10px] text-teal-300 w-7">{Math.round(c.p * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            {DEMOS.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Example ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-teal-700' : 'w-3 bg-stone-300'}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

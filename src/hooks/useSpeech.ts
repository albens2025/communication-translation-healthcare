import { useCallback, useEffect, useRef, useState } from 'react';

// Browser speech-to-text via the Web Speech API (Chrome, Edge, Safari).
export function useSpeech(onText: (finalText: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recRef = useRef<any>(null);
  const cbRef = useRef(onText);
  cbRef.current = onText;

  const SR: any = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const supported = !!SR;

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (ev: any) => {
      let inter = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) cbRef.current(r[0].transcript.trim());
        else inter += r[0].transcript;
      }
      setInterim(inter);
    };
    rec.onend = () => { setListening(false); setInterim(''); };
    rec.onerror = () => { setListening(false); setInterim(''); };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [SR]);

  useEffect(() => () => recRef.current?.stop(), []);

  return { supported, listening, interim, start, stop };
}

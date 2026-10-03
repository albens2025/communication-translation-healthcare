import React, { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { subscribeToCrm } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Props {
  source: string;
  tags: string[];
  withName?: boolean;
  withMessage?: boolean;
  cta?: string;
  dark?: boolean;
}

const SignupForm: React.FC<Props> = ({ source, tags, withName, withMessage, cta = 'Subscribe', dark }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [org, setOrg] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email.'); return; }
    if (withName && !name.trim()) { setError('Please enter your name.'); return; }
    setLoading(true);
    try {
      await subscribeToCrm({ email, name: name || undefined, phone: phone.trim() || undefined, sms_opt_in: smsOptIn, source, tags: org ? [...tags, `org:${org}`] : tags });
      setDone(true);
      toast.success('Thank you — we will be in touch.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const input = cn(
    'w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2',
    dark ? 'bg-white/10 border border-white/15 text-white placeholder:text-teal-100/50 focus:ring-coral-400' : 'bg-white border border-stone-200 text-ink placeholder:text-stone-400 focus:ring-teal-600'
  );

  if (done) {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl p-4', dark ? 'bg-white/10 text-white' : 'bg-teal-50 text-teal-800')}>
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm">You are on the list. We will reach out shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {withName && (
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
          <input className={input} placeholder="Organization (optional)" value={org} onChange={(e) => setOrg(e.target.value)} aria-label="Organization" />
        </div>
      )}
      <input className={input} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
      <input className={input} type="tel" placeholder="Phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Phone number (optional)" />
      {withMessage && <textarea className={cn(input, 'min-h-[80px]')} placeholder="What would you like to pilot? (optional)" aria-label="Message" />}
      <label className={cn('flex items-start gap-2 text-xs leading-snug', dark ? 'text-teal-100/80' : 'text-stone-500')}>
        <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-0.5 accent-coral-400" />
        <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
      </label>
      {error && <p className="text-xs text-coral-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-coral-400 hover:bg-coral-500 text-white font-semibold px-4 py-2.5 text-sm transition disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} {cta}
      </button>
    </form>
  );
};

export default SignupForm;

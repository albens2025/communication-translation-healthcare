import React, { useEffect, useState } from 'react';
import { Loader2, Mail, Lock, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/data/constants';
import { subscribeToCrm } from '@/lib/api';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';

const field = 'w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-600';

const AuthModal: React.FC = () => {
  const { authOpen, authMode, closeAuth, openAuth, signIn, signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [role, setRole] = useState<Role>('patient');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => { setError(''); setConfirmSent(false); }, [authMode, authOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setBusy(true);
    try {
      if (authMode === 'signin') {
        await signIn(email, password);
        toast.success('Welcome back');
        closeAuth();
      } else {
        if (!fullName.trim()) { setError('Please enter your name.'); setBusy(false); return; }
        const { needsConfirmation } = await signUp({ email, password, fullName: fullName.trim(), role });
        // Add the new account to the CRM contact list (non-blocking).
        subscribeToCrm({
          email, name: fullName.trim(), phone: phone.trim() || undefined, sms_opt_in: smsOptIn,
          source: 'signup', tags: ['account-signup', `role:${role}`],
        }).catch(() => undefined);
        if (needsConfirmation) {
          setConfirmSent(true);
        } else {
          toast.success('Account created');
          closeAuth();
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={authOpen} onOpenChange={(o) => (o ? openAuth(authMode) : closeAuth())}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight">{authMode === 'signin' ? 'Welcome back' : 'Create your account'}</DialogTitle>
          <DialogDescription>
            {authMode === 'signin' ? 'Sign in to see the records your role allows.' : 'Your role decides what you can see. Payers and employers never see diagnoses.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-xl bg-stone-100 p-1">
          {(['signin', 'signup'] as const).map((m) => (
            <button key={m} type="button" onClick={() => openAuth(m)}
              className={cn('flex-1 rounded-lg py-2 text-sm font-semibold', authMode === m ? 'bg-white text-ink shadow-sm' : 'text-stone-500')}>
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {confirmSent ? (
          <div className="rounded-2xl bg-teal-50 border border-teal-100 p-5 text-sm text-teal-900">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-1">We sent a confirmation link to <span className="font-medium">{email}</span>. After confirming, come back and sign in — your {ROLES.find((r) => r.id === role)?.label.toLowerCase()} profile will be set up automatically.</p>
            <button onClick={() => openAuth('signin')} className="mt-4 rounded-xl bg-teal-700 text-white px-4 py-2 font-semibold">Go to sign in</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            {authMode === 'signup' && (
              <>
                <div>
                  <p className="text-xs font-semibold text-stone-500 mb-2">I am a...</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button key={r.id} type="button" onClick={() => setRole(r.id)}
                        className={cn('text-left rounded-xl border p-2.5 transition', role === r.id ? 'border-teal-700 bg-teal-50 ring-2 ring-teal-700/15' : 'border-stone-200 hover:border-teal-600/40')}>
                        <p className="text-sm font-semibold text-ink">{r.label}</p>
                        <p className="text-[11px] text-stone-500 leading-snug">{r.blurb}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input className={field} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-label="Full name" />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input className={field} type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input className={cn(field, 'pr-10')} type={showPw ? 'text' : 'password'} autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" aria-label="Toggle password visibility">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {authMode === 'signup' && (
              <>
                <input className={cn(field, 'pl-3')} type="tel" placeholder="Phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Phone number (optional)" />
                <label className="flex items-start gap-2 text-xs text-stone-500 leading-snug">
                  <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-0.5 accent-coral-400" />
                  <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
                </label>
              </>
            )}
            {error && <p className="text-sm text-coral-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white py-3 text-sm font-semibold disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {authMode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <p className="flex items-center gap-1.5 text-[11px] text-stone-500"><ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Access is enforced in the database with row-level security.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

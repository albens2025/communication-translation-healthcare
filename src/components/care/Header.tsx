import React, { useState } from 'react';
import { Menu, X, CalendarDays, LogIn } from 'lucide-react';
import { useCare } from '@/context/CareContext';
import { useAuth } from '@/context/AuthContext';
import { BOOKING_URL, BRAND, NAV } from '@/data/constants';
import { cn } from '@/lib/utils';
import AccountMenu from './auth/AccountMenu';

export const Logo: React.FC<{ light?: boolean }> = ({ light }) => (
  <div className="flex items-center gap-2.5">
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <rect width="34" height="34" rx="10" fill="#0F766E" />
      <path d="M9 12c0-2 1.6-3.5 3.6-3.5h4.8c2 0 3.6 1.5 3.6 3.5v3c0 2-1.6 3.5-3.6 3.5H14l-3 3v-3.2A3.5 3.5 0 0 1 9 15v-3Z" fill="#FAFAF8" />
      <path d="M17 18.5h3.4c2 0 3.6 1.5 3.6 3.5v.5c0 1.4-.8 2.6-2 3.2V28l-3-2.5h-.4" stroke="#FB7185" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
    <div className="leading-none">
      <span className={cn('block text-lg font-semibold tracking-tight', light ? 'text-white' : 'text-ink')}>{BRAND}</span>
      <span className={cn('block font-mono text-[10px] uppercase tracking-widest', light ? 'text-teal-200' : 'text-teal-700')}>care translator</span>
    </div>
  </div>
);

const Header: React.FC = () => {
  const { view, setView, encounters, sponsorMessages, canView } = useCare();
  const { profile, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const pending = encounters.filter((e) => e.status === 'decoded').length;
  const items = NAV.filter((n) => canView(n.id));

  const badge = (id: string) => {
    const n = id === 'clinician' ? pending : id === 'messages' ? sponsorMessages.length : 0;
    return n > 0 ? <span className="ml-1.5 inline-grid place-items-center min-w-[18px] h-[18px] rounded-full bg-coral-400 text-white text-[10px] font-bold px-1">{n}</span> : null;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-cream/85 backdrop-blur-md no-print">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button onClick={() => setView('home')} aria-label="Home"><Logo /></button>
        <nav className="hidden lg:flex items-center gap-1">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cn(
                'relative rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                view === n.id ? 'bg-teal-700 text-white' : 'text-stone-600 hover:text-ink hover:bg-stone-100'
              )}
            >
              {n.label}{badge(n.id)}
            </button>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          {!profile && (
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hidden xl:inline-flex items-center gap-2 rounded-full border border-teal-700/20 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50">
              <CalendarDays className="h-4 w-4" /> Book a demo
            </a>
          )}
          {profile ? (
            <AccountMenu />
          ) : (
            <button onClick={() => openAuth('signin')} className="inline-flex items-center gap-2 rounded-full bg-coral-400 hover:bg-coral-500 text-white px-4 py-2 text-sm font-semibold shadow-sm shadow-coral-400/30">
              <LogIn className="h-4 w-4" /> Sign in
            </button>
          )}
        </div>
        <div className="lg:hidden flex items-center gap-2">
          {profile ? <AccountMenu /> : (
            <button onClick={() => openAuth('signin')} className="rounded-full bg-coral-400 text-white px-3 py-1.5 text-sm font-semibold">Sign in</button>
          )}
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-stone-200 bg-cream px-4 py-3 space-y-1">
          {items.map((n) => (
            <button key={n.id} onClick={() => { setView(n.id); setOpen(false); }} className={cn('block w-full text-left rounded-lg px-3 py-2 text-sm', view === n.id ? 'bg-teal-700 text-white' : 'text-stone-700 hover:bg-stone-100')}>
              {n.label}
            </button>
          ))}
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-2 text-sm text-teal-800">Book a demo</a>
        </div>
      )}
    </header>
  );
};

export default Header;

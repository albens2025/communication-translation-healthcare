import React from 'react';
import { useCare } from '@/context/CareContext';
import { BOOKING_URL, NAV, CHANNELS } from '@/data/constants';
import { Logo } from './Header';
import SignupForm from './SignupForm';

const Footer: React.FC = () => {
  const { setView } = useCare();
  return (
    <footer className="bg-teal-950 text-teal-50 no-print">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-4">
          <Logo light />
          <p className="text-sm text-teal-100/70 max-w-sm">
            A communication filter between lived experience and clinical language. Patients feel heard. Clinicians get structure. Every conversation becomes a billable, longitudinal record.
          </p>
          <p className="text-xs text-teal-100/50">Decision support only. All diagnoses and codes require clinician confirmation.</p>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-sm font-semibold mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-teal-100/70">
            {NAV.filter((n) => n.id !== 'admin').map((n) => (
              <li key={n.id}><button onClick={() => setView(n.id)} className="hover:text-white">{n.label}</button></li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-sm font-semibold mb-4">Conversations</h4>
          <ul className="space-y-2 text-sm text-teal-100/70">
            {CHANNELS.map((c) => (
              <li key={c.id}><button onClick={() => setView('filter')} className="hover:text-white text-left">{c.label}</button></li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-4">
          <h4 className="text-sm font-semibold mb-1">Field notes newsletter</h4>
          <p className="text-sm text-teal-100/60 mb-4">Monthly insights on shared decision-making, coding and value-based care.</p>
          <SignupForm source="footer-signup" tags={['newsletter', 'footer-signup']} dark cta="Join the newsletter" />
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-coral-300 hover:text-coral-200">Prefer to talk? Book a 30-minute demo</a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-teal-100/50">
          <span>&copy; {new Date().getFullYear()} Kindred Care Translator. ICD-10-CM and CPT references for demonstration.</span>
          <span className="font-mono">HIPAA-ready architecture &middot; FHIR-aligned records</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React, { useState } from 'react';
import { Database, Link2, UserPlus } from 'lucide-react';
import { useCare } from '@/context/CareContext';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/care/Header';
import Footer from '@/components/care/Footer';
import Hero from '@/components/care/home/Hero';
import { HowItWorks, ChannelsSection, PathwaysSection, PatientsSection, PilotSection } from '@/components/care/home/HomeSections';
import FilterView from '@/components/care/filter/FilterView';
import ClinicianView from '@/components/care/clinician/ClinicianView';
import DecisionView from '@/components/care/decide/DecisionView';
import TimelineView from '@/components/care/timeline/TimelineView';
import CohortView from '@/components/care/cohort/CohortView';
import MessagesView from '@/components/care/messages/MessagesView';
import AuthModal from '@/components/care/auth/AuthModal';
import { LinkPatientDialog } from '@/components/care/auth/AccountMenu';
import AddPatientDialog from '@/components/care/AddPatientDialog';

const PANEL_VIEWS = ['clinician', 'decide', 'timeline', 'cohort'];

const EmptyPanel: React.FC = () => {
  const { loadDemoPanel } = useCare();
  const { roleDef } = useAuth();
  const [linkOpen, setLinkOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">Your panel is empty</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink tracking-tight">Who are you caring for?</h1>
      <p className="mt-3 text-stone-600">As a {roleDef?.label.toLowerCase()}, you only see people assigned to you. Link someone with their share code, add a new person, or load the demo panel to explore.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-stone-50"><Link2 className="h-4 w-4" /> Link by share code</button>
        {roleDef?.canCreatePatients && <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-stone-50"><UserPlus className="h-4 w-4" /> Add a person</button>}
        <button onClick={loadDemoPanel} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white px-5 py-3 text-sm font-semibold hover:bg-teal-800"><Database className="h-4 w-4" /> Load demo panel</button>
      </div>
      <LinkPatientDialog open={linkOpen} onOpenChange={setLinkOpen} />
      <AddPatientDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { view, loading, patients } = useCare();
  const { profile } = useAuth();
  const showEmptyPanel = !!profile && profile.role !== 'patient' && patients.length === 0 && PANEL_VIEWS.includes(view);

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />
      <main className="flex-1">
        {view === 'home' && (
          <>
            <Hero />
            <HowItWorks />
            <ChannelsSection />
            <PathwaysSection />
            <PatientsSection />
            <PilotSection />
          </>
        )}
        {view !== 'home' && loading && (
          <div className="mx-auto max-w-7xl px-6 py-24 text-center text-stone-500 font-mono text-sm">Loading care records...</div>
        )}
        {!loading && showEmptyPanel && <EmptyPanel />}
        {!loading && !showEmptyPanel && (
          <>
            {view === 'filter' && <FilterView />}
            {view === 'clinician' && <ClinicianView />}
            {view === 'decide' && <DecisionView />}
            {view === 'timeline' && <TimelineView />}
            {view === 'cohort' && <CohortView />}
            {view === 'messages' && <MessagesView />}
          </>
        )}
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
};

export default AppLayout;

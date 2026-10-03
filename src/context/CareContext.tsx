import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PUBLIC_VIEWS, type View } from '@/data/constants';
import type { Encounter, Patient, SponsorMessage } from '@/lib/types';
import {
  claimDemoPanel, createPatient, errMsg, fetchEncounters, fetchPatients, fetchSponsorMessages,
  insertEncounter, linkPatientByMrn, patchEncounter,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface CareCtx {
  patients: Patient[];
  encounters: Encounter[];
  sponsorMessages: SponsorMessage[];
  loading: boolean;
  view: View;
  setView: (v: View) => void;
  canView: (v: View) => boolean;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  activeEncounterId: string | null;
  setActiveEncounterId: (id: string | null) => void;
  refresh: () => Promise<void>;
  addPatient: (p: { name: string; age: number | null; sex: string; payer: string }) => Promise<Patient | null>;
  linkPatient: (mrn: string) => Promise<Patient | null>;
  loadDemoPanel: () => Promise<void>;
  createEncounter: (e: Partial<Encounter>) => Promise<Encounter | null>;
  updateEncounter: (id: string, patch: Partial<Encounter>) => Promise<Encounter | null>;
  patientById: (id?: string | null) => Patient | undefined;
  encountersFor: (patientId?: string | null) => Encounter[];
}

const Ctx = createContext<CareCtx | null>(null);

export const CareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, roleDef, loading: authLoading, openAuth } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [sponsorMessages, setSponsorMessages] = useState<SponsorMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setViewState] = useState<View>('home');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);

  const canView = useCallback(
    (v: View) => (roleDef ? roleDef.views.includes(v) : PUBLIC_VIEWS.includes(v)),
    [roleDef]
  );

  const setView = useCallback((v: View) => {
    if (!canView(v)) {
      if (!profile) { openAuth('signin'); toast.message('Please sign in to continue'); }
      else toast.error('Your role does not have access to that area');
      return;
    }
    setViewState(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [canView, profile, openAuth]);

  const refresh = useCallback(async () => {
    if (!profile) {
      setPatients([]); setEncounters([]); setSponsorMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const isSponsor = profile.role === 'payer' || profile.role === 'employer';
      const [p, e, s] = await Promise.all([
        fetchPatients(),
        isSponsor ? Promise.resolve([] as Encounter[]) : fetchEncounters(),
        isSponsor ? fetchSponsorMessages() : Promise.resolve([] as SponsorMessage[]),
      ]);
      setPatients(p);
      setEncounters(e);
      setSponsorMessages(s);
      setSelectedPatientId((cur) => {
        if (profile.role === 'patient') return profile.patient_id;
        return cur && p.some((x) => x.id === cur) ? cur : p[0]?.id ?? null;
      });
    } catch (err) {
      console.error(err);
      toast.error('Could not load care records');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (authLoading) return;
    setActiveEncounterId(null);
    refresh();
  }, [authLoading, refresh]);

  // If the role changes (sign in/out), bounce off views the user can no longer access.
  useEffect(() => {
    if (!authLoading && !canView(view)) setViewState('home');
  }, [authLoading, canView, view]);

  const addPatient = async (p: { name: string; age: number | null; sex: string; payer: string }) => {
    try {
      const created = await createPatient(p);
      setPatients((prev) => [...prev, created]);
      return created;
    } catch (e) {
      toast.error(errMsg(e));
      return null;
    }
  };

  const linkPatient = async (mrn: string) => {
    try {
      const linked = await linkPatientByMrn(mrn);
      await refresh();
      setSelectedPatientId(linked.id);
      return linked;
    } catch (e) {
      toast.error(errMsg(e));
      return null;
    }
  };

  const loadDemoPanel = async () => {
    try {
      const n = await claimDemoPanel();
      await refresh();
      toast.success(n > 0 ? `${n} demo patients added to your panel` : 'Demo panel already loaded');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const createEncounter = async (e: Partial<Encounter>) => {
    try {
      const created = await insertEncounter(e);
      setEncounters((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      toast.error(errMsg(err));
      return null;
    }
  };

  const updateEncounter = async (id: string, patch: Partial<Encounter>) => {
    try {
      const updated = await patchEncounter(id, patch);
      setEncounters((prev) => prev.map((x) => (x.id === id ? updated : x)));
      return updated;
    } catch (err) {
      toast.error(errMsg(err));
      return null;
    }
  };

  const patientById = useCallback((id?: string | null) => patients.find((p) => p.id === id), [patients]);
  const encountersFor = useCallback(
    (pid?: string | null) =>
      encounters.filter((e) => e.patient_id === pid).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [encounters]
  );

  const value = useMemo(
    () => ({
      patients, encounters, sponsorMessages, loading: loading || authLoading, view, setView, canView,
      selectedPatientId, setSelectedPatientId, activeEncounterId, setActiveEncounterId, refresh,
      addPatient, linkPatient, loadDemoPanel, createEncounter, updateEncounter, patientById, encountersFor,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patients, encounters, sponsorMessages, loading, authLoading, view, setView, canView, selectedPatientId, activeEncounterId, patientById, encountersFor, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCare = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCare must be used within CareProvider');
  return c;
};

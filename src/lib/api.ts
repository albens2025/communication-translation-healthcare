import { supabase } from '@/lib/supabase';
import { CRM_SUBSCRIBE_URL, feeFor } from '@/data/constants';
import type { CptCode, Decoded, Encounter, Patient, Role, SponsorMessage, UserProfile } from '@/lib/types';

// ---------- Auth & profiles ----------
export async function fetchMyProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as UserProfile) ?? null;
}

export async function ensureProfile(role: Role, fullName: string, email: string): Promise<UserProfile> {
  const { data, error } = await supabase.rpc('ensure_my_profile', { p_role: role, p_full_name: fullName, p_email: email });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as UserProfile;
}

// ---------- Patients (RLS-scoped) ----------
export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Patient[];
}

export async function createPatient(p: { name: string; age: number | null; sex: string; payer: string }): Promise<Patient> {
  const { data, error } = await supabase.rpc('create_patient', { p_name: p.name, p_age: p.age, p_sex: p.sex, p_payer: p.payer });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as Patient;
}

export async function linkPatientByMrn(mrn: string): Promise<Patient> {
  const { data, error } = await supabase.rpc('link_patient_by_mrn', { p_mrn: mrn });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as Patient;
}

export async function claimDemoPanel(): Promise<number> {
  const { data, error } = await supabase.rpc('claim_demo_panel');
  if (error) throw error;
  return Number(data ?? 0);
}

// ---------- Encounters (RLS-scoped; payers/employers cannot read) ----------
export async function fetchEncounters(): Promise<Encounter[]> {
  const { data, error } = await supabase.from('encounters').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Encounter[];
}

export async function fetchSponsorMessages(): Promise<SponsorMessage[]> {
  const { data, error } = await supabase.rpc('get_sponsor_messages');
  if (error) throw error;
  return (data ?? []) as SponsorMessage[];
}

export async function insertEncounter(e: Partial<Encounter>): Promise<Encounter> {
  const { data, error } = await supabase.from('encounters').insert(e).select().single();
  if (error) throw error;
  return data as Encounter;
}

export async function patchEncounter(id: string, patch: Partial<Encounter>): Promise<Encounter> {
  const { data, error } = await supabase.from('encounters').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Encounter;
}

export async function decodeNarrative(args: {
  narrative: string; filterStyle: string; channel: string; age?: number | null; sex?: string | null; history?: string[];
}): Promise<Decoded> {
  const { data, error } = await supabase.functions.invoke('decode-narrative', { body: args });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as Decoded;
}

export function computeCharge(cpts: CptCode[]): number {
  return cpts
    .filter((c) => c.status !== 'rejected')
    .reduce((sum, c) => sum + feeFor(c.code, c.est_fee_usd) * (c.units || 1) * 100, 0);
}

export async function subscribeToCrm(payload: {
  email: string; name?: string; phone?: string; sms_opt_in: boolean; source: string; tags: string[];
}) {
  const res = await fetch(CRM_SUBSCRIBE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      name: payload.name || undefined,
      phone: payload.phone || undefined,
      sms_opt_in: payload.sms_opt_in === true,
      source: payload.source,
      tags: payload.tags,
    }),
  });
  if (!res.ok) throw new Error('Subscription failed');
  return res.json().catch(() => ({}));
}

export const errMsg = (e: unknown) => (e as { message?: string })?.message ?? 'Something went wrong';

export const money = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

import {
  MessageCircleHeart, ShieldCheck, Share2, Microscope, Pill, Syringe, BedDouble,
  Activity, Dumbbell, FileSignature, HeartHandshake, Feather,
  Stethoscope, Users, ClipboardList, Building2, Landmark, Briefcase,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/lib/types';

export const HERO_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/6ac10c6b7bf70cd1633f34cb_1791036585429_d4404427.jpg';
export const BOOKING_URL = 'https://famous.ai/api/crm/6ac10c6b7bf70cd1633f34cb/calendar/public?calendarId=63da553e-ac63-46c5-9bf5-bd59ca8abc0a&view=booking';
export const CRM_SUBSCRIBE_URL = 'https://famous.ai/api/crm/6ac10c6b7bf70cd1633f34cb/subscribe';
export const BRAND = 'Kindred';

export type View = 'home' | 'filter' | 'clinician' | 'decide' | 'timeline' | 'cohort' | 'messages' | 'admin';

export const NAV: { id: View; label: string }[] = [
  { id: 'home', label: 'Overview' },
  { id: 'filter', label: 'Patient Filter' },
  { id: 'clinician', label: 'Clinician Decoder' },
  { id: 'decide', label: 'Shared Decision' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'cohort', label: 'Cohort' },
  { id: 'messages', label: 'Member Messages' },
  { id: 'admin', label: 'Admin' },
];

export interface RoleDef {
  id: Role;
  label: string;
  blurb: string;
  views: View[];
  defaultChannel: string;
  canCreatePatients: boolean;
  canLinkPatients: boolean;
  canSign: boolean;
  seesCodes: boolean;
  /** Can be chosen on the public sign-up form. */
  selfSignup: boolean;
  /** New accounts must be approved by an admin before getting any access. */
  requiresApproval: boolean;
}

export const ROLES: RoleDef[] = [
  { id: 'patient', label: 'Patient', blurb: 'Share your experience and see your own timeline.', views: ['home', 'filter', 'decide', 'timeline'], defaultChannel: 'patient-doctor', canCreatePatients: false, canLinkPatients: false, canSign: false, seesCodes: true, selfSignup: true, requiresApproval: false },
  { id: 'caregiver', label: 'Caregiver', blurb: 'Speak for a loved one you support.', views: ['home', 'filter', 'decide', 'timeline'], defaultChannel: 'caregiver-doctor', canCreatePatients: true, canLinkPatients: true, canSign: false, seesCodes: true, selfSignup: true, requiresApproval: false },
  { id: 'clinician', label: 'Clinician', blurb: 'Decode, code, sign and bill for your assigned patients.', views: ['home', 'filter', 'clinician', 'decide', 'timeline', 'cohort'], defaultChannel: 'patient-doctor', canCreatePatients: true, canLinkPatients: true, canSign: true, seesCodes: true, selfSignup: true, requiresApproval: true },
  { id: 'care_manager', label: 'Care Manager', blurb: 'Coordinate care and shared decisions for your panel.', views: ['home', 'filter', 'clinician', 'decide', 'timeline', 'cohort'], defaultChannel: 'care-manager-patient', canCreatePatients: true, canLinkPatients: true, canSign: false, seesCodes: true, selfSignup: true, requiresApproval: true },
  { id: 'payer', label: 'Payer / Health Plan', blurb: 'Receive member messages — never diagnoses or codes.', views: ['home', 'messages'], defaultChannel: 'patient-insurer', canCreatePatients: false, canLinkPatients: true, canSign: false, seesCodes: false, selfSignup: true, requiresApproval: true },
  { id: 'employer', label: 'Employer', blurb: 'Receive accommodation requests — diagnoses stay private.', views: ['home', 'messages'], defaultChannel: 'employer-patient', canCreatePatients: false, canLinkPatients: true, canSign: false, seesCodes: false, selfSignup: true, requiresApproval: true },
  { id: 'admin', label: 'Admin', blurb: 'Review and approve professional accounts.', views: ['home', 'admin'], defaultChannel: 'patient-doctor', canCreatePatients: false, canLinkPatients: false, canSign: false, seesCodes: false, selfSignup: false, requiresApproval: false },
];

export const SIGNUP_ROLES = ROLES.filter((r) => r.selfSignup);
export const REVIEWED_ROLES = ROLES.filter((r) => r.requiresApproval);

export const roleById = (id?: string | null) => ROLES.find((r) => r.id === id);

// Views available without signing in.
export const PUBLIC_VIEWS: View[] = ['home', 'filter'];

// Views available to signed-in accounts still waiting for admin approval.
export const PENDING_VIEWS: View[] = ['home'];

export interface PathwayDef {
  id: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  color: string; // tailwind bg/text classes
  hex: string;
}

export const PATHWAYS: PathwayDef[] = [
  { id: 'counseling', label: 'Counseling', blurb: 'Education, coaching and behavior change support.', icon: MessageCircleHeart, color: 'bg-teal-50 text-teal-700', hex: '#0F766E' },
  { id: 'reassurance', label: 'Reassurance', blurb: 'Evidence-backed explanation that no further action is needed.', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-700', hex: '#059669' },
  { id: 'referral', label: 'Referral', blurb: 'Connect to the right specialist or community resource.', icon: Share2, color: 'bg-sky-50 text-sky-700', hex: '#0284C7' },
  { id: 'workup', label: 'Deep-dive Workup', blurb: 'Labs, imaging and diagnostics to clarify the picture.', icon: Microscope, color: 'bg-indigo-50 text-indigo-700', hex: '#4F46E5' },
  { id: 'medication-trial', label: 'Medication Trial', blurb: 'Time-boxed therapeutic trial with clear success criteria.', icon: Pill, color: 'bg-violet-50 text-violet-700', hex: '#7C3AED' },
  { id: 'ambulatory-intervention', label: 'Ambulatory Intervention', blurb: 'Evidence-based procedure delivered in clinic.', icon: Syringe, color: 'bg-cyan-50 text-cyan-700', hex: '#0891B2' },
  { id: 'admission-procedure', label: 'Admission & Procedure', blurb: 'Inpatient stay to perform an invasive procedure.', icon: BedDouble, color: 'bg-rose-50 text-rose-700', hex: '#E11D48' },
  { id: 'rehabilitation', label: 'Rehabilitation', blurb: 'Restore function after illness or surgery.', icon: Activity, color: 'bg-lime-50 text-lime-700', hex: '#65A30D' },
  { id: 'prehabilitation', label: 'Prehabilitation', blurb: 'Build reserve before an invasive procedure.', icon: Dumbbell, color: 'bg-amber-50 text-amber-700', hex: '#D97706' },
  { id: 'advance-directive', label: 'Advance Directive', blurb: 'Document wishes and choose a healthcare proxy.', icon: FileSignature, color: 'bg-orange-50 text-orange-700', hex: '#EA580C' },
  { id: 'palliative', label: 'Palliative Care Plan', blurb: 'Comfort, symptom relief and quality of life first.', icon: HeartHandshake, color: 'bg-pink-50 text-pink-700', hex: '#DB2777' },
  { id: 'end-of-life', label: 'End-of-life Preparation', blurb: 'Dignity, legacy and family support.', icon: Feather, color: 'bg-stone-100 text-stone-700', hex: '#57534E' },
];

export const pathwayById = (id?: string | null) => PATHWAYS.find((p) => p.id === id);

export interface ChannelDef { id: string; label: string; from: string; to: string; icon: LucideIcon; hint: string }

export const CHANNELS: ChannelDef[] = [
  { id: 'patient-doctor', label: 'Patient to Doctor', from: 'Patient', to: 'Doctor', icon: Stethoscope, hint: 'Clinical decode with ICD-10 and CPT pathways.' },
  { id: 'caregiver-doctor', label: 'Caregiver to Doctor', from: 'Caregiver', to: 'Doctor', icon: Users, hint: 'Speaks on behalf of a loved one, preserving their wishes.' },
  { id: 'care-manager-patient', label: 'Patient to Care Manager', from: 'Patient', to: 'Care Manager', icon: ClipboardList, hint: 'Barriers, adherence and social needs come forward.' },
  { id: 'health-plan-patient', label: 'Patient to Health Plan', from: 'Patient', to: 'Health Plan', icon: Building2, hint: 'Benefits, navigation and network guidance.' },
  { id: 'patient-insurer', label: 'Patient to Insurer', from: 'Patient', to: 'Insurer', icon: Landmark, hint: 'Medical necessity language for prior auth and appeals.' },
  { id: 'employer-patient', label: 'Patient to Employer', from: 'Patient', to: 'Employer', icon: Briefcase, hint: 'Functional needs and accommodations — diagnosis kept private.' },
];

export const channelById = (id?: string | null) => CHANNELS.find((c) => c.id === id) ?? CHANNELS[0];

export const FILTER_STYLES = [
  { id: 'clear', label: 'Clear', desc: 'Organized and complete, your words tidied up.' },
  { id: 'gentle', label: 'Gentle', desc: 'Warm and emotionally honest.' },
  { id: 'concise', label: 'Concise', desc: 'Short and to the point for busy visits.' },
  { id: 'detailed', label: 'Detailed', desc: 'Timeline, triggers and impact on daily life.' },
  { id: 'assertive', label: 'Assertive', desc: 'Confidently states needs and preferences.' },
];

export const SAMPLE_NARRATIVES = [
  'I feel like an elephant is sitting on my chest when I climb stairs, and it goes away when I rest. My dad had a heart attack at 60.',
  'My mom keeps forgetting where she put things and last week she got lost driving home from the store she has gone to for 20 years.',
  'My back has been screaming since I lifted my grandson, and now my right leg feels like pins and needles down to my toes.',
  'I am so tired all the time, I am always thirsty and I get up four times a night to pee. I have lost weight without trying.',
  'The cancer doctor says more chemo, but I am exhausted. I just want to be home with my garden and my dog.',
];

export const DECISION_VALUES = [
  { id: 'longevity', label: 'Living as long as possible' },
  { id: 'comfort', label: 'Comfort and less pain' },
  { id: 'independence', label: 'Staying independent at home' },
  { id: 'cost', label: 'Keeping costs low' },
  { id: 'time', label: 'Less time in appointments' },
  { id: 'certainty', label: 'Knowing for sure what is wrong' },
];

// Approximate national Medicare physician fee schedule reference values (USD) for demo billing.
export const CPT_FEES: Record<string, number> = {
  '99202': 75, '99203': 115, '99204': 172, '99205': 228,
  '99212': 58, '99213': 92, '99214': 130, '99215': 184,
  '99497': 86, '99498': 75, '99490': 62, '99491': 84,
  '93000': 17, '93306': 210, '93350': 200, '73562': 40, '77066': 152,
  '83036': 13, '97161': 101, '97110': 30, 'G0108': 55, 'G0444': 20, '99406': 15,
};

export const feeFor = (code: string, fallback?: number) => CPT_FEES[code] ?? fallback ?? 60;

export const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600',
  decoded: 'bg-amber-100 text-amber-800',
  signed: 'bg-teal-100 text-teal-800',
  billed: 'bg-indigo-100 text-indigo-800',
};

export const URGENCY_STYLES: Record<string, string> = {
  routine: 'bg-teal-50 text-teal-700 border-teal-200',
  soon: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-orange-50 text-orange-700 border-orange-200',
  emergency: 'bg-coral-100 text-coral-700 border-coral-300',
};

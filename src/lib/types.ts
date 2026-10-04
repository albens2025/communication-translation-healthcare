export type Role = 'patient' | 'caregiver' | 'clinician' | 'care_manager' | 'payer' | 'employer' | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  patient_id: string | null;
  organization: string | null;
  approved: boolean;
  approved_at: string | null;
  declined_at: string | null;
  review_note: string | null;
  created_at: string;
}

// Row returned by the admin_list_profiles RPC (admins only).
export interface AdminProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  organization: string | null;
  approved: boolean;
  approved_at: string | null;
  declined_at: string | null;
  review_note: string | null;
  created_at: string;
}

export type ReviewDecision = 'approve' | 'decline' | 'revoke';
export type ApprovalState = 'approved' | 'pending' | 'declined';

export const approvalState = (p: { approved: boolean; declined_at: string | null }): ApprovalState =>
  p.approved ? 'approved' : p.declined_at ? 'declined' : 'pending';

// Payer / employer view: never includes ICD/CPT or clinical summary.
export interface SponsorMessage {
  encounter_id: string;
  member_id: string;
  member_name: string;
  conversation_channel: string;
  sent_at: string;
  record_status: string;
  audience_message: string;
}

export type CodeType = 'primary' | 'secondary' | 'rule-out';

export interface IcdCode {
  code: string;
  description: string;
  confidence: number;
  type: CodeType;
  rationale?: string;
  status?: 'accepted' | 'rejected' | 'pending';
}

export interface CptCode {
  code: string;
  description: string;
  category: string;
  rationale?: string;
  units: number;
  est_fee_usd?: number;
  status?: 'accepted' | 'rejected' | 'pending';
}

export interface Pathway {
  type: string;
  title: string;
  rationale: string;
  recommended: boolean;
}

export interface DecisionOption {
  title: string;
  benefits: string;
  risks: string;
  burden: string;
  evidence: 'high' | 'moderate' | 'low';
}

export interface Decoded {
  filtered_text?: string;
  emotion?: string;
  worries?: string[];
  goals?: string[];
  what_matters?: string;
  clinical_summary?: string;
  symptoms?: { lay: string; clinical: string }[];
  icd?: IcdCode[];
  cpt?: CptCode[];
  pathways?: Pathway[];
  decision_options?: DecisionOption[];
  red_flags?: string[];
  clarifying_questions?: string[];
  audience_message?: string;
  urgency?: 'routine' | 'soon' | 'urgent' | 'emergency';
}

export interface Decision {
  chosen?: string;
  patient_priority?: string;
  values?: Record<string, number>;
  questions?: string;
  agreed_by_patient?: boolean;
  agreed_by_clinician?: boolean;
  decided_at?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number | null;
  sex: string | null;
  mrn: string | null;
  avatar_url: string | null;
  payer: string | null;
  created_at: string;
}

export type EncounterStatus = 'draft' | 'decoded' | 'signed' | 'billed';

export interface Encounter {
  id: string;
  patient_id: string;
  channel: string;
  filter_style: string | null;
  narrative: string;
  filtered_narrative: string | null;
  decoded: Decoded;
  icd_codes: IcdCode[];
  cpt_codes: CptCode[];
  pathway: string | null;
  decision: Decision;
  clinician_note: string | null;
  status: EncounterStatus;
  charge_cents: number;
  created_at: string;
}

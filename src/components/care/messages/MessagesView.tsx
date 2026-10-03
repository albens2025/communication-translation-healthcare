import React, { useMemo, useState } from 'react';
import { Search, Copy, Lock, Link2, Database, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useCare } from '@/context/CareContext';
import { useAuth } from '@/context/AuthContext';
import { channelById } from '@/data/constants';
import { EmptyState, PatientAvatar, SectionHeader, formatDate } from '../shared';
import { LinkPatientDialog } from '../auth/AccountMenu';

// Payer / employer inbox. Data comes from the get_sponsor_messages() RPC, which
// returns ONLY the audience-facing message — never ICD/CPT codes or clinical summaries.
const MessagesView: React.FC = () => {
  const { sponsorMessages, patients, patientById, loadDemoPanel } = useCare();
  const { profile } = useAuth();
  const [q, setQ] = useState('');
  const [member, setMember] = useState('all');
  const [linkOpen, setLinkOpen] = useState(false);
  const isEmployer = profile?.role === 'employer';

  const list = useMemo(() => sponsorMessages.filter((m) =>
    (member === 'all' || m.member_id === member) &&
    (!q || `${m.member_name} ${m.audience_message}`.toLowerCase().includes(q.toLowerCase()))
  ), [sponsorMessages, member, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeader
        eyebrow={isEmployer ? 'Employer inbox' : 'Member messages'}
        title={isEmployer ? 'Accommodation requests, privately shared.' : 'What your members need from you.'}
        subtitle={isEmployer
          ? 'Employees share functional needs through Kindred. Diagnoses and medical codes are never disclosed to employers.'
          : 'Members explain needs in plain language for prior auth, appeals and navigation. Clinical codes stay with the care team.'}
        right={
          <div className="flex gap-2">
            <button onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-stone-50"><Link2 className="h-4 w-4" /> Link member</button>
            <button onClick={loadDemoPanel} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-teal-800"><Database className="h-4 w-4" /> Demo members</button>
          </div>
        }
      />

      <div className="rounded-2xl bg-teal-50 border border-teal-100 px-4 py-3 text-sm text-teal-900 flex items-center gap-2 mb-6">
        <Lock className="h-4 w-4 shrink-0" /> Privacy by design: your access is limited by the database to audience messages. ICD-10 and CPT codes are not readable by your role.
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 space-y-2">
          <button onClick={() => setMember('all')} className={`w-full text-left rounded-2xl border p-3 text-sm font-semibold ${member === 'all' ? 'border-teal-700 bg-teal-50/60' : 'border-stone-200 bg-white'}`}>
            All members <span className="text-stone-400 font-normal">({patients.length})</span>
          </button>
          {patients.map((p) => (
            <button key={p.id} onClick={() => setMember(p.id)} className={`w-full flex items-center gap-3 rounded-2xl border p-3 text-left ${member === p.id ? 'border-teal-700 bg-teal-50/60' : 'border-stone-200 bg-white hover:border-teal-600/40'}`}>
              <PatientAvatar patient={p} size={32} />
              <div className="min-w-0"><p className="text-sm font-semibold text-ink truncate">{p.name}</p><p className="text-[11px] text-stone-500">{p.payer ?? 'Member'}</p></div>
            </button>
          ))}
        </aside>

        <section className="lg:col-span-9 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-600" />
          </div>
          {list.length === 0 ? (
            <EmptyState title="No messages yet" body="Link a member with their share code, or load demo members to see how messages arrive." />
          ) : list.map((m) => (
            <article key={m.encounter_id} className="rounded-3xl bg-white border border-stone-200 p-5 hover:shadow-lg transition">
              <div className="flex flex-wrap items-center gap-3">
                <PatientAvatar patient={patientById(m.member_id)} size={40} />
                <div className="flex-1 min-w-[160px]">
                  <p className="font-semibold text-ink">{m.member_name}</p>
                  <p className="text-xs text-stone-500">{formatDate(m.sent_at)} · {channelById(m.conversation_channel).label}</p>
                </div>
                <span className="rounded-full bg-stone-100 text-stone-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase">{m.record_status === 'billed' || m.record_status === 'signed' ? 'reviewed by care team' : 'new'}</span>
              </div>
              <p className="mt-4 flex gap-2 text-[15px] leading-relaxed text-stone-800"><Mail className="h-4 w-4 text-coral-400 shrink-0 mt-1" />{m.audience_message}</p>
              <div className="mt-4 flex justify-end">
                <button onClick={() => { navigator.clipboard?.writeText(m.audience_message); toast.success('Message copied'); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"><Copy className="h-3.5 w-3.5" /> Copy</button>
              </div>
            </article>
          ))}
        </section>
      </div>
      <LinkPatientDialog open={linkOpen} onOpenChange={setLinkOpen} />
    </div>
  );
};

export default MessagesView;

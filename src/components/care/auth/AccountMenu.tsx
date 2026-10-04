import React, { useState } from 'react';
import { LogOut, Link2, Copy, Database, ChevronDown, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';

export const LinkPatientDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const { linkPatient } = useCare();
  const { roleDef } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const p = await linkPatient(code);
    setBusy(false);
    if (p) { toast.success(`Linked to ${p.name}`); setCode(''); onOpenChange(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link a {roleDef?.id === 'payer' || roleDef?.id === 'employer' ? 'member' : 'patient'}</DialogTitle>
          <DialogDescription>Enter the share code the person gave you (their MRN, e.g. MRN-204871).</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MRN-000000" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-teal-600" />
          <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white py-2.5 text-sm font-semibold disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Link
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AccountMenu: React.FC = () => {
  const { profile, roleDef, signOut, isPendingApproval, isAdmin } = useAuth();
  const { patientById, loadDemoPanel, setView } = useCare();
  const [linkOpen, setLinkOpen] = useState(false);
  if (!profile) return null;

  const me = patientById(profile.patient_id);
  const name = profile.full_name || profile.email || 'Account';
  const initials = name.split(/[\s@]/).filter(Boolean).map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const active = !isPendingApproval;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white pl-1 pr-3 py-1 hover:border-teal-700/40 outline-none">
          <span className="relative h-8 w-8 rounded-full bg-teal-700 text-white grid place-items-center text-xs font-semibold">
            {initials}
            {isPendingApproval && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white" aria-label="Pending approval" />}
          </span>
          <span className="hidden xl:block text-left leading-tight">
            <span className="block text-sm font-semibold text-ink max-w-[140px] truncate">{name}</span>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-teal-700">{roleDef?.label}{isPendingApproval ? ' · pending' : ''}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-stone-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs font-normal text-stone-500 truncate">{profile.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-teal-50 text-teal-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{roleDef?.label}</span>
            {isPendingApproval && (
              <span className="mt-1.5 ml-1 inline-block rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{profile.declined_at ? 'Declined' : 'Pending approval'}</span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin && (
            <DropdownMenuItem onClick={() => setView('admin')}><ShieldCheck className="h-4 w-4 mr-2" /> Account approvals</DropdownMenuItem>
          )}
          {profile.role === 'patient' && me?.mrn && (
            <DropdownMenuItem onClick={() => { navigator.clipboard?.writeText(me.mrn!); toast.success('Share code copied — give it to your care team'); }}>
              <Copy className="h-4 w-4 mr-2" /> Share code <span className="ml-auto font-mono text-xs">{me.mrn}</span>
            </DropdownMenuItem>
          )}
          {active && roleDef?.canLinkPatients && (
            <DropdownMenuItem onClick={() => setLinkOpen(true)}><Link2 className="h-4 w-4 mr-2" /> Link by share code</DropdownMenuItem>
          )}
          {active && profile.role !== 'patient' && profile.role !== 'admin' && (
            <DropdownMenuItem onClick={loadDemoPanel}><Database className="h-4 w-4 mr-2" /> Load demo panel</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => { await signOut(); setView('home'); toast.success('Signed out'); }} className="text-coral-600">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LinkPatientDialog open={linkOpen} onOpenChange={setLinkOpen} />
    </>
  );
};

export default AccountMenu;

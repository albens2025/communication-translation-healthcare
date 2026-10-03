import React from 'react';
import { Printer, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Encounter, Patient } from '@/lib/types';
import { channelById, feeFor, pathwayById } from '@/data/constants';
import { money } from '@/lib/api';
import { formatDate } from '../shared';

const SuperbillDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void; encounter: Encounter | null; patient?: Patient }> = ({ open, onOpenChange, encounter, patient }) => {
  if (!encounter) return null;
  const icd = (encounter.icd_codes || []).filter((c) => c.status !== 'rejected' && c.type !== 'rule-out');
  const cpt = (encounter.cpt_codes || []).filter((c) => c.status !== 'rejected');

  const downloadJson = () => {
    const claim = {
      resourceType: 'Claim',
      id: encounter.id,
      status: encounter.status,
      created: encounter.created_at,
      patient: { reference: `Patient/${patient?.mrn}`, display: patient?.name },
      insurer: { display: patient?.payer },
      diagnosis: icd.map((c, i) => ({ sequence: i + 1, diagnosisCodeableConcept: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: c.code, display: c.description }] } })),
      item: cpt.map((c, i) => ({ sequence: i + 1, productOrService: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: c.code, display: c.description }] }, quantity: { value: c.units || 1 }, net: { value: feeFor(c.code, c.est_fee_usd) * (c.units || 1), currency: 'USD' } })),
      total: { value: encounter.charge_cents / 100, currency: 'USD' },
      extension: [{ url: 'shared-decision', valueString: encounter.decision?.chosen ?? '' }, { url: 'care-pathway', valueString: encounter.pathway ?? '' }],
    };
    const blob = new Blob([JSON.stringify(claim, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `claim-${patient?.mrn}-${encounter.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Billable encounter record</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-stone-50 p-4">
            <div><p className="text-xs text-stone-500">Patient</p><p className="font-semibold">{patient?.name}</p><p className="font-mono text-xs text-stone-500">{patient?.mrn} · {patient?.age}{patient?.sex}</p></div>
            <div><p className="text-xs text-stone-500">Payer</p><p className="font-semibold">{patient?.payer}</p><p className="text-xs text-stone-500">DOS {formatDate(encounter.created_at)}</p></div>
            <div><p className="text-xs text-stone-500">Channel</p><p>{channelById(encounter.channel).label}</p></div>
            <div><p className="text-xs text-stone-500">Care pathway</p><p>{pathwayById(encounter.pathway)?.label ?? '—'}</p></div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Diagnoses (ICD-10-CM)</p>
            <table className="w-full font-mono text-xs">
              <tbody>{icd.map((c, i) => (<tr key={i} className="border-b border-stone-100"><td className="py-1.5 w-6 text-stone-400">{String.fromCharCode(65 + i)}</td><td className="w-20 font-semibold">{c.code}</td><td className="font-sans">{c.description}</td></tr>))}</tbody>
            </table>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Procedures (CPT / HCPCS)</p>
            <table className="w-full font-mono text-xs">
              <thead><tr className="text-stone-400 text-left"><th className="py-1">Code</th><th>Description</th><th>Dx ptr</th><th className="text-right">Units</th><th className="text-right">Charge</th></tr></thead>
              <tbody>{cpt.map((c, i) => (
                <tr key={i} className="border-b border-stone-100"><td className="py-1.5 font-semibold">{c.code}</td><td className="font-sans">{c.description}</td><td>{icd.map((_, j) => String.fromCharCode(65 + j)).slice(0, 4).join('')}</td><td className="text-right">{c.units || 1}</td><td className="text-right">${feeFor(c.code, c.est_fee_usd) * (c.units || 1)}</td></tr>
              ))}</tbody>
              <tfoot><tr><td colSpan={4} className="pt-2 text-right font-sans font-semibold">Total charge</td><td className="pt-2 text-right font-semibold">{money(encounter.charge_cents)}</td></tr></tfoot>
            </table>
          </div>
          {encounter.decision?.chosen && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
              <p className="text-xs font-semibold text-teal-800">Shared decision documented</p>
              <p className="text-teal-900">{encounter.decision.chosen}</p>
              {encounter.decision.patient_priority && <p className="text-xs text-teal-700 mt-1">Patient priority: {encounter.decision.patient_priority}</p>}
            </div>
          )}
          {encounter.clinician_note && <div><p className="text-xs font-semibold text-stone-500">Clinician attestation</p><p className="text-stone-700">{encounter.clinician_note}</p></div>}
          <div className="flex gap-2 no-print">
            <button onClick={() => window.print()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 py-2.5 font-semibold hover:bg-stone-50"><Printer className="h-4 w-4" /> Print superbill</button>
            <button onClick={downloadJson} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white py-2.5 font-semibold hover:bg-teal-800"><Download className="h-4 w-4" /> Export FHIR claim</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuperbillDialog;

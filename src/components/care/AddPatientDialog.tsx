import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCare } from '@/context/CareContext';
import { toast } from 'sonner';

const PAYERS = ['Medicare', 'Medicare Advantage', 'Medicaid Managed Care', 'Commercial PPO', 'Commercial HMO', 'Employer Self-Funded', 'Self-pay'];

const AddPatientDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const { addPatient, setSelectedPatientId } = useCare();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('F');
  const [payer, setPayer] = useState(PAYERS[0]);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const p = await addPatient({ name: name.trim(), age: age ? Number(age) : null, sex, payer });
    setSaving(false);
    if (p) {
      setSelectedPatientId(p.id);
      toast.success(`${p.name} added — share code ${p.mrn}`);
      setName(''); setAge('');
      onOpenChange(false);
    }
  };

  const field = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a person</DialogTitle>
          <DialogDescription>Creates a new longitudinal record in the cohort.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <input className={field} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={field} type="number" min={0} max={120} placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
            <select className={field} value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="F">Female</option><option value="M">Male</option><option value="X">Other / prefer not</option>
            </select>
          </div>
          <select className={field} value={payer} onChange={(e) => setPayer(e.target.value)}>
            {PAYERS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <button disabled={saving} className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white py-2.5 text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : 'Add to cohort'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientDialog;

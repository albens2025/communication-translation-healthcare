import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart } from 'recharts';
import { Users, Activity, DollarSign, Handshake, Download, Filter } from 'lucide-react';
import { useCare } from '@/context/CareContext';
import { CHANNELS, PATHWAYS, pathwayById } from '@/data/constants';
import { money } from '@/lib/api';
import { PatientAvatar, SectionHeader } from '../shared';

const CohortView: React.FC = () => {
  const { patients, encounters, patientById, setSelectedPatientId, setView } = useCare();
  const [payer, setPayer] = useState('all');
  const [channel, setChannel] = useState('all');
  const [icdQuery, setIcdQuery] = useState('');
  const [pathway, setPathway] = useState('all');

  const payers = [...new Set(patients.map((p) => p.payer).filter(Boolean))] as string[];

  const filtered = useMemo(() => encounters.filter((e) => {
    const p = patientById(e.patient_id);
    if (payer !== 'all' && p?.payer !== payer) return false;
    if (channel !== 'all' && e.channel !== channel) return false;
    if (pathway !== 'all' && e.pathway !== pathway) return false;
    if (icdQuery && !(e.icd_codes || []).some((c) => (c.code + ' ' + c.description).toLowerCase().includes(icdQuery.toLowerCase()))) return false;
    return true;
  }), [encounters, payer, channel, pathway, icdQuery, patientById]);

  const cohortPatientIds = [...new Set(filtered.map((e) => e.patient_id))];
  const revenue = filtered.filter((e) => e.status === 'signed' || e.status === 'billed').reduce((s, e) => s + (e.charge_cents || 0), 0);
  const sdmRate = filtered.length ? Math.round((filtered.filter((e) => e.decision?.chosen).length / filtered.length) * 100) : 0;

  const monthly = useMemo(() => {
    const m = new Map<string, { month: string; encounters: number; revenue: number }>();
    [...filtered].sort((a, b) => a.created_at.localeCompare(b.created_at)).forEach((e) => {
      const k = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const cur = m.get(k) ?? { month: k, encounters: 0, revenue: 0 };
      cur.encounters++; cur.revenue += (e.charge_cents || 0) / 100;
      m.set(k, cur);
    });
    return [...m.values()];
  }, [filtered]);

  const pathwayMix = useMemo(() => PATHWAYS.map((p) => ({ name: p.label, value: filtered.filter((e) => e.pathway === p.id).length, color: p.hex })).filter((x) => x.value > 0), [filtered]);

  const topIcd = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((e) => (e.icd_codes || []).filter((c) => c.status !== 'rejected').forEach((c) => m.set(c.code, (m.get(c.code) ?? 0) + 1)));
    return [...m.entries()].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filtered]);

  const exportCsv = () => {
    const rows = [['patient', 'mrn', 'payer', 'date', 'channel', 'pathway', 'icd', 'cpt', 'status', 'charge_usd']];
    filtered.forEach((e) => { const p = patientById(e.patient_id); rows.push([p?.name ?? '', p?.mrn ?? '', p?.payer ?? '', e.created_at, e.channel, e.pathway ?? '', (e.icd_codes || []).map((c) => c.code).join(' '), (e.cpt_codes || []).map((c) => c.code).join(' '), e.status, String((e.charge_cents || 0) / 100)]); });
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `cohort-export.csv`;
    a.click();
  };

  const sel = 'rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm';
  const KPIS = [
    { icon: Users, label: 'Patients in cohort', value: String(cohortPatientIds.length) },
    { icon: Activity, label: 'Encounters', value: String(filtered.length) },
    { icon: DollarSign, label: 'Signed / billed', value: money(revenue) },
    { icon: Handshake, label: 'Shared decisions', value: `${sdmRate}%` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeader eyebrow="Longitudinal cohort" title="Patterns across people, over time." subtitle="Every interaction builds the cohort. Slice by payer, channel, pathway or diagnosis to see trajectories and value."
        right={<button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-teal-800"><Download className="h-4 w-4" /> Export cohort</button>} />

      <div className="rounded-2xl bg-white border border-stone-200 p-3 flex flex-wrap items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-stone-400 ml-1" />
        <input value={icdQuery} onChange={(e) => setIcdQuery(e.target.value)} placeholder="ICD code or diagnosis (e.g. I50, diabetes)" className={`${sel} flex-1 min-w-[200px]`} />
        <select value={payer} onChange={(e) => setPayer(e.target.value)} className={sel}><option value="all">All payers</option>{payers.map((p) => <option key={p}>{p}</option>)}</select>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className={sel}><option value="all">All channels</option>{CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <select value={pathway} onChange={(e) => setPathway(e.target.value)} className={sel}><option value="all">All pathways</option>{PATHWAYS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-3xl bg-white border border-stone-200 p-5">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 grid place-items-center"><k.icon className="h-4 w-4" /></div>
            <p className="mt-3 text-2xl font-semibold text-ink">{k.value}</p>
            <p className="text-xs text-stone-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-white border border-stone-200 p-5">
          <h3 className="font-semibold text-ink mb-4">Encounters &amp; charges by month</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="l" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip />
                <Bar yAxisId="l" dataKey="encounters" fill="#0F766E" radius={[6, 6, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="revenue" stroke="#FB7185" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-stone-200 p-5">
          <h3 className="font-semibold text-ink mb-4">Care pathway mix</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pathwayMix} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {pathwayMix.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {pathwayMix.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} /><span className="flex-1 text-stone-600">{p.name}</span><span className="font-mono">{p.value}</span></div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-stone-200 p-5">
          <h3 className="font-semibold text-ink mb-4">Top diagnoses</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topIcd} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="code" width={60} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#134E4A" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl bg-white border border-stone-200 p-5">
          <h3 className="font-semibold text-ink mb-4">Cohort members</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-stone-500 border-b border-stone-100"><th className="py-2">Patient</th><th>Payer</th><th>Encounters</th><th>Latest pathway</th><th className="text-right">Charges</th></tr></thead>
              <tbody>
                {cohortPatientIds.map((id) => {
                  const p = patientById(id);
                  const es = filtered.filter((e) => e.patient_id === id);
                  const latest = es[0];
                  return (
                    <tr key={id} onClick={() => { setSelectedPatientId(id); setView('timeline'); }} className="border-b border-stone-50 hover:bg-cream cursor-pointer">
                      <td className="py-2.5"><div className="flex items-center gap-2"><PatientAvatar patient={p} size={28} /><span className="font-medium text-ink">{p?.name}</span></div></td>
                      <td className="text-stone-600">{p?.payer}</td>
                      <td className="font-mono">{es.length}</td>
                      <td className="text-stone-600">{pathwayById(latest?.pathway)?.label ?? '—'}</td>
                      <td className="text-right font-mono">{money(es.reduce((s, e) => s + (e.charge_cents || 0), 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {cohortPatientIds.length === 0 && <p className="text-sm text-stone-500 text-center py-6">No one matches these filters.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CohortView;

// Lived-experience phrase -> clinical concept -> probable ICD-10-CM. Used for instant, on-device
// "live decoding" while the patient types. The AI decoder refines these after submission.
export interface LexEntry {
  patterns: RegExp[];
  clinical: string;
  code: string;
  description: string;
  weight: number;
}

export const LEXICON: LexEntry[] = [
  { patterns: [/chest (pain|pressure|tight)/i, /elephant.*chest/i, /squeez.*chest/i], clinical: 'Chest pain / angina-like', code: 'R07.9', description: 'Chest pain, unspecified', weight: 0.72 },
  { patterns: [/climb.*stairs.*(chest|breath)/i, /goes away when i rest/i], clinical: 'Exertional symptoms relieved by rest', code: 'I20.9', description: 'Angina pectoris, unspecified', weight: 0.66 },
  { patterns: [/short of breath/i, /winded/i, /can'?t catch my breath/i, /out of breath/i], clinical: 'Dyspnea', code: 'R06.02', description: 'Shortness of breath', weight: 0.74 },
  { patterns: [/ankles? (swell|look like balloons|puff)/i, /swollen (legs|feet|ankles)/i], clinical: 'Peripheral edema', code: 'R60.0', description: 'Localized edema', weight: 0.7 },
  { patterns: [/(three|3|two|2) pillows/i, /can'?t lie flat/i], clinical: 'Orthopnea', code: 'R06.01', description: 'Orthopnea', weight: 0.68 },
  { patterns: [/heart (racing|pounding|flutter)/i, /palpitation/i, /skipp(ing|ed) beat/i], clinical: 'Palpitations', code: 'R00.2', description: 'Palpitations', weight: 0.7 },
  { patterns: [/forget(ting|ful)/i, /got lost/i, /memory/i, /confus/i], clinical: 'Cognitive decline', code: 'R41.81', description: 'Age-related cognitive decline', weight: 0.6 },
  { patterns: [/back (pain|hurts|is killing|screaming)/i, /lower back/i], clinical: 'Low back pain', code: 'M54.50', description: 'Low back pain, unspecified', weight: 0.72 },
  { patterns: [/pins and needles/i, /tingl/i, /numb/i], clinical: 'Paresthesia', code: 'R20.2', description: 'Paresthesia of skin', weight: 0.65 },
  { patterns: [/leg.*(pins|tingl|shoot|down to my toes)/i, /sciatica/i], clinical: 'Radiculopathy', code: 'M54.16', description: 'Radiculopathy, lumbar region', weight: 0.62 },
  { patterns: [/always thirsty/i, /thirst/i], clinical: 'Polydipsia', code: 'R63.1', description: 'Polydipsia', weight: 0.7 },
  { patterns: [/(pee|urinat).*(night|times)/i, /get up.*to pee/i], clinical: 'Nocturia / polyuria', code: 'R35.1', description: 'Nocturia', weight: 0.66 },
  { patterns: [/lost weight/i, /weight loss/i], clinical: 'Unintended weight loss', code: 'R63.4', description: 'Abnormal weight loss', weight: 0.68 },
  { patterns: [/tired all the time/i, /exhausted/i, /no energy/i, /fatigue/i], clinical: 'Fatigue', code: 'R53.83', description: 'Other fatigue', weight: 0.64 },
  { patterns: [/can'?t sleep/i, /wake (up )?at \d/i, /insomnia/i, /cannot get back to sleep/i], clinical: 'Insomnia', code: 'G47.00', description: 'Insomnia, unspecified', weight: 0.7 },
  { patterns: [/stress/i, /overwhelm/i, /anxious/i, /worried sick/i, /panic/i], clinical: 'Anxiety / stress reaction', code: 'F41.9', description: 'Anxiety disorder, unspecified', weight: 0.55 },
  { patterns: [/sad all the time/i, /hopeless/i, /depress/i, /no joy/i], clinical: 'Depressive symptoms', code: 'F32.A', description: 'Depression, unspecified', weight: 0.58 },
  { patterns: [/headache/i, /migraine/i, /head is pounding/i], clinical: 'Headache', code: 'R51.9', description: 'Headache, unspecified', weight: 0.68 },
  { patterns: [/knee (pain|hurts|is killing)/i, /can'?t get up from the chair/i], clinical: 'Knee pain / OA', code: 'M25.569', description: 'Pain in unspecified knee', weight: 0.66 },
  { patterns: [/lump in my breast/i, /breast lump/i], clinical: 'Breast mass', code: 'N63.0', description: 'Unspecified lump in unspecified breast', weight: 0.8 },
  { patterns: [/cough/i], clinical: 'Cough', code: 'R05.9', description: 'Cough, unspecified', weight: 0.66 },
  { patterns: [/fever/i, /burning up/i], clinical: 'Fever', code: 'R50.9', description: 'Fever, unspecified', weight: 0.66 },
  { patterns: [/dizz/i, /room spin/i, /lightheaded/i], clinical: 'Dizziness', code: 'R42', description: 'Dizziness and giddiness', weight: 0.66 },
  { patterns: [/stomach (pain|hurts|ache)/i, /belly (pain|hurts)/i], clinical: 'Abdominal pain', code: 'R10.9', description: 'Unspecified abdominal pain', weight: 0.64 },
  { patterns: [/chemo/i, /cancer/i, /tumou?r/i], clinical: 'Oncology context', code: 'Z92.21', description: 'Personal history of antineoplastic chemotherapy', weight: 0.55 },
  { patterns: [/just want to be home/i, /no machines/i, /do not want machines/i, /let me go/i], clinical: 'Goals-of-care preference', code: 'Z71.89', description: 'Other specified counseling', weight: 0.6 },
  { patterns: [/dad had a heart attack/i, /father had a heart attack/i, /family history.*heart/i], clinical: 'Family history of IHD', code: 'Z82.49', description: 'Family history of ischemic heart disease', weight: 0.82 },
  { patterns: [/forget.*(pills|meds|medication)/i, /miss(ing)? (my )?(pills|doses)/i], clinical: 'Medication non-adherence', code: 'Z91.14', description: "Patient's other noncompliance with medication regimen", weight: 0.66 },
  { patterns: [/fall|fell down/i], clinical: 'Fall risk', code: 'Z91.81', description: 'History of falling', weight: 0.6 },
  { patterns: [/can'?t afford/i, /too expensive/i], clinical: 'Financial strain', code: 'Z59.86', description: 'Financial insecurity', weight: 0.62 },
];

export interface LiveHit { code: string; description: string; clinical: string; confidence: number; matched: string }

export function liveDecode(text: string): LiveHit[] {
  if (!text || text.length < 4) return [];
  const hits: LiveHit[] = [];
  for (const e of LEXICON) {
    for (const p of e.patterns) {
      const m = text.match(p);
      if (m) {
        const lengthBoost = Math.min(0.12, text.length / 2500);
        hits.push({ code: e.code, description: e.description, clinical: e.clinical, confidence: Math.min(0.95, e.weight + lengthBoost), matched: m[0] });
        break;
      }
    }
  }
  return hits.sort((a, b) => b.confidence - a.confidence);
}

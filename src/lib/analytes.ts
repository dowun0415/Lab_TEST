import type { Source } from './types'

export type Kind =
  | 'molar' // mass <-> amount via molar mass (computed from formula)
  | 'ion' // mass/amount/equivalents; charge known
  | 'mass' // mass concentration scaling only
  | 'enzyme' // catalytic activity (U/L <-> ukat/L)
  | 'special'

export interface Analyte {
  id: string
  en: string
  ko: string
  synonyms: string[]
  kind: Kind
  /** Molecular/atomic formula used to compute molar mass. */
  formula?: string
  charge?: number
  /** Unit choices offered in the UI (UCUM codes unless kind === 'special'). */
  units: string[]
  note?: string
  /** Why a conversion that clinicians may expect is not offered. */
  refuse?: string
}

const IUPAC: Source = { label: 'IUPAC standard atomic weights', url: 'https://iupac.qmul.ac.uk/AtWt/' }
export const SRC = { IUPAC }


export const ANALYTES: Analyte[] = [
  { id: 'glucose', en: 'Glucose', ko: '포도당 (혈당)', synonyms: ['blood sugar', 'glu', '혈당'], kind: 'molar', formula: 'C6H12O6', units: ['mg/dL', 'mmol/L', 'g/L'] },
  { id: 'creatinine', en: 'Creatinine', ko: '크레아티닌', synonyms: ['cr', 'crea'], kind: 'molar', formula: 'C4H7N3O', units: ['mg/dL', 'umol/L', 'mmol/L'] },
  { id: 'uric-acid', en: 'Uric acid', ko: '요산', synonyms: ['urate', 'ua'], kind: 'molar', formula: 'C5H4N4O3', units: ['mg/dL', 'umol/L', 'mmol/L'] },
  { id: 'cholesterol', en: 'Total cholesterol', ko: '총콜레스테롤', synonyms: ['chol', 'tc', 'cholesterol', 'hdl', 'ldl', 'hdl-c', 'ldl-c', 'HDL 콜레스테롤', 'LDL 콜레스테롤'], kind: 'molar', formula: 'C27H46O', units: ['mg/dL', 'mmol/L', 'g/L'], note: 'Also applies to HDL-C / LDL-C (same molecule).' },
  { id: 'triglycerides', en: 'Triglycerides', ko: '중성지방', synonyms: ['tg', 'trig', 'triacylglycerol'], kind: 'special', units: ['mg/dL', 'mmol/L'] },
  { id: 'bilirubin', en: 'Bilirubin', ko: '빌리루빈', synonyms: ['bili', 'tbil', 'total bilirubin', 'direct bilirubin'], kind: 'molar', formula: 'C33H36N4O6', units: ['mg/dL', 'umol/L'] },
  { id: 'lactate', en: 'Lactate', ko: '젖산 (락테이트)', synonyms: ['lactic acid', 'lac'], kind: 'molar', formula: 'C3H6O3', units: ['mg/dL', 'mmol/L'] },
  { id: 'ammonia', en: 'Ammonia', ko: '암모니아', synonyms: ['nh3', 'nh4'], kind: 'molar', formula: 'NH3', units: ['ug/dL', 'umol/L'] },
  { id: 'iron', en: 'Iron', ko: '철 (혈청철)', synonyms: ['fe', 'serum iron'], kind: 'molar', formula: 'Fe', units: ['ug/dL', 'umol/L'] },
  { id: 'phosphate', en: 'Phosphate (inorganic phosphorus)', ko: '인 (무기인산)', synonyms: ['phosphorus', 'phos', 'pi', 'po4', '인산'], kind: 'molar', formula: 'P', units: ['mg/dL', 'mmol/L'], note: 'mg/dL is expressed as elemental phosphorus (P). mEq/L is not offered because phosphate valence depends on pH.' },
  { id: 'calcium', en: 'Calcium', ko: '칼슘', synonyms: ['ca', 'total calcium'], kind: 'ion', formula: 'Ca', charge: 2, units: ['mg/dL', 'mmol/L', 'mEq/L'] },
  { id: 'magnesium', en: 'Magnesium', ko: '마그네슘', synonyms: ['mg'], kind: 'ion', formula: 'Mg', charge: 2, units: ['mg/dL', 'mmol/L', 'mEq/L'] },
  { id: 'sodium', en: 'Sodium', ko: '나트륨', synonyms: ['na', 'na+'], kind: 'ion', formula: 'Na', charge: 1, units: ['mEq/L', 'mmol/L', 'mg/dL'] },
  { id: 'potassium', en: 'Potassium', ko: '칼륨 (포타슘)', synonyms: ['k', 'k+'], kind: 'ion', formula: 'K', charge: 1, units: ['mEq/L', 'mmol/L', 'mg/dL'] },
  { id: 'chloride', en: 'Chloride', ko: '염소 (클로라이드)', synonyms: ['cl', 'cl-'], kind: 'ion', formula: 'Cl', charge: 1, units: ['mEq/L', 'mmol/L', 'mg/dL'] },
  { id: 'bicarbonate', en: 'Bicarbonate', ko: '중탄산염', synonyms: ['hco3', 'co2', 'total co2', 'tco2'], kind: 'ion', formula: 'HCO3', charge: 1, units: ['mEq/L', 'mmol/L'] },
  { id: 'lithium', en: 'Lithium', ko: '리튬', synonyms: ['li'], kind: 'ion', formula: 'Li', charge: 1, units: ['mEq/L', 'mmol/L', 'mg/dL'] },
  { id: 'albumin', en: 'Albumin', ko: '알부민', synonyms: ['alb'], kind: 'mass', units: ['g/dL', 'g/L'], note: 'Mass concentration scaling only; mmol/L is not offered (no single agreed molar mass assumption verified).' },
  { id: 'total-protein', en: 'Total protein', ko: '총단백', synonyms: ['tp', 'protein'], kind: 'mass', units: ['g/dL', 'g/L'] },
  { id: 'hemoglobin', en: 'Hemoglobin', ko: '헤모글로빈', synonyms: ['hb', 'hgb'], kind: 'mass', units: ['g/dL', 'g/L'], note: 'mmol/L (monomer vs tetramer) is not offered: assumption not verified.' },
  { id: 'alt', en: 'ALT (alanine aminotransferase)', ko: 'ALT (GPT)', synonyms: ['sgpt', 'gpt', 'alat'], kind: 'enzyme', units: ['U/L', 'ukat/L'] },
  { id: 'ast', en: 'AST (aspartate aminotransferase)', ko: 'AST (GOT)', synonyms: ['sgot', 'got', 'asat'], kind: 'enzyme', units: ['U/L', 'ukat/L'] },
  { id: 'alp', en: 'ALP (alkaline phosphatase)', ko: '알칼리 포스파타제', synonyms: ['alkp'], kind: 'enzyme', units: ['U/L', 'ukat/L'] },
  { id: 'ggt', en: 'GGT (gamma-glutamyl transferase)', ko: '감마지티피', synonyms: ['gamma gt', 'γ-gt', 'ggtp'], kind: 'enzyme', units: ['U/L', 'ukat/L'] },
  { id: 'ldh', en: 'LDH (lactate dehydrogenase)', ko: '젖산탈수소효소', synonyms: ['ld'], kind: 'enzyme', units: ['U/L', 'ukat/L'] },
  { id: 'ck', en: 'CK (creatine kinase)', ko: '크레아틴 키나제', synonyms: ['cpk'], kind: 'enzyme', units: ['U/L', 'ukat/L'] },
  { id: 'bun', en: 'Urea nitrogen (BUN) / Urea', ko: '요소질소 (BUN) / 요소', synonyms: ['blood urea nitrogen', 'urea', 'bun', '요소'], kind: 'special', units: ['BUN mg/dL', 'urea mg/dL', 'urea mmol/L'] },
  { id: 'hba1c', en: 'HbA1c', ko: '당화혈색소', synonyms: ['a1c', 'glycated hemoglobin', 'glycosylated hemoglobin', 'hemoglobin a1c'], kind: 'special', units: ['% (NGSP)', 'mmol/mol (IFCC)'] },
  { id: 'uacr', en: 'Urine albumin-to-creatinine ratio (uACR)', ko: '요 알부민/크레아티닌 비 (uACR)', synonyms: ['acr', 'albumin creatinine ratio', 'microalbumin', '미세알부민'], kind: 'special', units: ['mg/g', 'mg/mmol'] },
  { id: 'upcr', en: 'Urine protein-to-creatinine ratio (uPCR)', ko: '요 단백/크레아티닌 비 (uPCR)', synonyms: ['pcr', 'protein creatinine ratio'], kind: 'special', units: ['mg/g', 'mg/mmol'] },
]

export const UNIT_LABEL: Record<string, string> = {
  'mg/dL': 'mg/dL', 'g/dL': 'g/dL', 'g/L': 'g/L', 'ug/dL': 'µg/dL', 'umol/L': 'µmol/L', 'mmol/L': 'mmol/L',
  'mEq/L': 'mEq/L', 'U/L': 'U/L', 'ukat/L': 'µkat/L',
}
export const unitLabel = (u: string) => UNIT_LABEL[u] ?? u

export function searchAnalytes(q: string): Analyte[] {
  const s = q.trim().toLowerCase()
  if (!s) return ANALYTES
  return ANALYTES.filter((a) =>
    [a.en, a.ko, a.id, ...a.synonyms].some((n) => n.toLowerCase().includes(s)),
  )
}


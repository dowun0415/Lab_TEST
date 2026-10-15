import { describe, expect, it } from 'vitest'
import { ANALYTES, searchAnalytes } from './analytes'
import { molarMass } from './atomic'
import { convert } from './convert'
import { classify, findIntervals, type RefInterval } from './reference'

const A = (id: string) => ANALYTES.find((a) => a.id === id)!
const val = (id: string, v: number, from: string, to: string) => {
  const r = convert(A(id), v, from, to)
  if (!r.ok) throw new Error(r.reason)
  return r.value
}

describe('molar mass from atomic weights', () => {
  it('computes glucose', () => expect(molarMass('C6H12O6')).toBeCloseTo(180.156, 2))
  it('rejects unknown elements', () => expect(() => molarMass('Xx')).toThrow())
})

// TODO(verify): reference values below are widely cited textbook factors, NOT yet compared with
// the Labcorp SI table / CMEinfo PDF / NBME PDF (not reachable from the build environment).
describe('mass <-> molar (computed, compared with approximate textbook factors)', () => {
  it('glucose 100 mg/dL ≈ 5.55 mmol/L', () => expect(val('glucose', 100, 'mg/dL', 'mmol/L')).toBeCloseTo(5.55, 1))
  it('creatinine 1 mg/dL ≈ 88.4 µmol/L', () => expect(val('creatinine', 1, 'mg/dL', 'umol/L')).toBeCloseTo(88.4, 0))
  it('cholesterol 200 mg/dL ≈ 5.17 mmol/L', () => expect(val('cholesterol', 200, 'mg/dL', 'mmol/L')).toBeCloseTo(5.17, 1))
  it('uric acid 6 mg/dL ≈ 357 µmol/L', () => expect(val('uric-acid', 6, 'mg/dL', 'umol/L')).toBeCloseTo(357, -0.5))
  it('bilirubin 1 mg/dL ≈ 17.1 µmol/L', () => expect(val('bilirubin', 1, 'mg/dL', 'umol/L')).toBeCloseTo(17.1, 0))
  it('triglycerides 150 mg/dL ≈ 1.69 mmol/L', () => expect(val('triglycerides', 150, 'mg/dL', 'mmol/L')).toBeCloseTo(1.69, 1))
  it('round trip glucose', () => expect(val('glucose', val('glucose', 7.2, 'mmol/L', 'mg/dL'), 'mg/dL', 'mmol/L')).toBeCloseTo(7.2, 9))
})

describe('ions and equivalents', () => {
  it('sodium mEq/L = mmol/L', () => expect(val('sodium', 140, 'mEq/L', 'mmol/L')).toBeCloseTo(140, 9))
  it('calcium 10 mg/dL ≈ 2.50 mmol/L ≈ 5.0 mEq/L', () => {
    expect(val('calcium', 10, 'mg/dL', 'mmol/L')).toBeCloseTo(2.495, 2)
    expect(val('calcium', 10, 'mg/dL', 'mEq/L')).toBeCloseTo(4.99, 1)
  })
  it('potassium 4 mEq/L ≈ 15.6 mg/dL', () => expect(val('potassium', 4, 'mEq/L', 'mg/dL')).toBeCloseTo(15.64, 1))
  it('magnesium 2 mg/dL ≈ 0.82 mmol/L', () => expect(val('magnesium', 2, 'mg/dL', 'mmol/L')).toBeCloseTo(0.823, 2))
  it('refuses mEq/L for phosphate (charge undefined)', () => {
    expect(convert(A('phosphate'), 1, 'mmol/L', 'mEq/L').ok).toBe(false)
  })
})

describe('enzymes', () => {
  it('60 U/L = 1 µkat/L', () => expect(val('alt', 60, 'U/L', 'ukat/L')).toBeCloseTo(1, 9))
  it('refuses mg/dL -> U/L with a reason', () => {
    const r = convert(A('alt'), 10, 'mg/dL', 'U/L')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/차원/)
  })
})

describe('special conversions', () => {
  it('HbA1c 6.5% ≈ 48 mmol/mol', () => expect(val('hba1c', 6.5, '% (NGSP)', 'mmol/mol (IFCC)')).toBeCloseTo(47.5, 0))
  it('HbA1c 48 mmol/mol ≈ 6.5%', () => expect(val('hba1c', 48, 'mmol/mol (IFCC)', '% (NGSP)')).toBeCloseTo(6.54, 1))
  it('uACR 30 mg/g ≈ 3 mg/mmol (KDIGO rounded)', () => expect(val('uacr', 30, 'mg/g', 'mg/mmol')).toBeCloseTo(3.39, 1))
  it('uPCR round trip', () => expect(val('upcr', val('upcr', 150, 'mg/g', 'mg/mmol'), 'mg/mmol', 'mg/g')).toBeCloseTo(150, 9))
  it('BUN 14 mg/dL ≈ 30 urea mg/dL ≈ 5.0 mmol/L', () => {
    expect(val('bun', 14, 'BUN mg/dL', 'urea mg/dL')).toBeCloseTo(30, 0)
    expect(val('bun', 14, 'BUN mg/dL', 'urea mmol/L')).toBeCloseTo(5.0, 1)
  })
  it('refuses unsupported pair', () => expect(convert(A('hba1c'), 1, '% (NGSP)', 'mg/dL').ok).toBe(false))
  it('every result carries a basis with method, formula and sources', () => {
    const r = convert(A('glucose'), 100, 'mg/dL', 'mmol/L')
    expect(r.ok && r.basis.sources.length > 0 && r.basis.formula.length > 0 && !!r.basis.factor).toBe(true)
  })
})

describe('search', () => {
  it('finds by English, Korean and synonym', () => {
    expect(searchAnalytes('glucose')[0].id).toBe('glucose')
    expect(searchAnalytes('혈당')[0].id).toBe('glucose')
    expect(searchAnalytes('sgpt')[0].id).toBe('alt')
  })
})

describe('reference interval lookup (synthetic TEST FIXTURE, not real published data)', () => {
  const fx: RefInterval[] = [
    { analyteId: 'x', specimen: 'serum/plasma', sex: 'F', ageMinYears: 18, ageMaxYears: 60, low: 1, high: 2, unit: 'u', source: 'fixture', sourceUrl: '' },
    { analyteId: 'x', specimen: 'serum/plasma', sex: 'any', ageMinYears: 60, ageMaxYears: null, low: null, high: 5, unit: 'u', source: 'fixture', sourceUrl: '' },
  ]
  const q = (ageYears: number, sex: 'M' | 'F') => findIntervals(fx, { analyteId: 'x', ageYears, sex, specimen: 'serum/plasma' })
  it('matches inside a band', () => expect(q(30, 'F')).toHaveLength(1))
  it('does not extrapolate below the lowest published age', () => expect(q(10, 'F')).toHaveLength(0))
  it('does not match another sex', () => expect(q(30, 'M')).toHaveLength(0))
  it('upper bound exclusive; open-ended band', () => {
    expect(q(60, 'F')[0].high).toBe(5)
  })
  it('classifies low/normal/high and one-sided limits', () => {
    expect(classify(0.5, fx[0])).toBe('low')
    expect(classify(1.5, fx[0])).toBe('normal')
    expect(classify(2.5, fx[0])).toBe('high')
    expect(classify(-100, fx[1])).toBe('normal')
  })
})

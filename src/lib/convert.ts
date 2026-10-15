import * as ucum from '@lhncbc/ucum-lhc'
import { ATOMIC_WEIGHTS, molarMass } from './atomic'
import { SRC, unitLabel, type Analyte } from './analytes'
import type { Basis, ConvertResult, Source } from './types'

const utils = ucum.UcumLhcUtils.getInstance()

const UCUM_SRC: Source = { label: 'UCUM (Unified Code for Units of Measure)', url: 'https://ucum.org/ucum' }
const UCUM_LHC: Source = { label: '@lhncbc/ucum-lhc (NLM)', url: 'https://github.com/lhncbc/ucum-lhc' }

export const NGSP_SRC: Source = { label: 'NGSP – HbA1c converter (IFCC)', url: 'https://www.ngsp.org/ifcc.asp' }
export const KDIGO_SRC: Source = {
  label: 'KDIGO 2024 CKD Guideline (Kidney Int 2024;105(4S))',
  url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
}

/** Display unit -> UCUM code. */
export function toUcum(u: string): string {
  return u.trim().replace(/^mEq/, 'meq').replace(/^µ/, 'u').replace(/\/µ/, '/u')
}

const fmt = (n: number) => Number(n.toPrecision(6)).toString()

interface UcumOut {
  ok: boolean
  value?: number
  code?: string
  msg?: string
}

function ucumConvert(from: string, value: number, to: string, opts: { molecularWeight?: number; charge?: number } = {}): UcumOut {
  const r = utils.convertUnitTo(toUcum(from), value, toUcum(to), opts)
  if (r.status === 'succeeded') return { ok: true, value: r.toVal as number }
  return { ok: false, code: r.code, msg: (r.msg ?? []).join(' ') }
}

function refusalFor(a: Analyte, from: string, to: string, out: UcumOut): string {
  const f = unitLabel(from)
  const t = unitLabel(to)
  if (out.code === 'incommensurable') {
    return `${f} → ${t} 변환을 거부합니다: 두 단위의 차원(물리량)이 다릅니다. 질량/몰 농도와 효소 활성(U/L) 등은 분석물 고유 정보(비활성도, 기질, 측정 조건)가 있어야만 연결될 수 있고, 이를 뒷받침하는 공표된 근거가 없습니다. (${out.msg})`
  }
  if (out.code === 'missing-molecular-weight') {
    return `${f} → ${t}: ${a.en}의 분자량 가정이 없어 질량↔몰 변환을 하지 않습니다.`
  }
  if (out.code === 'missing-charge') {
    return `${f} → ${t}: ${a.en}은(는) 당량(mEq) 변환에 필요한 이온 전하가 정의되어 있지 않아 변환하지 않습니다.${a.note ? ' ' + a.note : ''}`
  }
  return `${f} → ${t} 변환을 할 수 없습니다. ${out.msg ?? ''}`.trim()
}

function ucumBasis(a: Analyte, from: string, to: string, factor: number, mw?: number): Basis {
  const assumptions: string[] = []
  const isEq = /eq/i.test(from + to)
  let method = 'UCUM 차원 검사 및 스케일 변환'
  let formula = `값(${unitLabel(to)}) = 값(${unitLabel(from)}) × 계수`
  const sources: Source[] = [UCUM_SRC, UCUM_LHC]
  if (mw !== undefined) {
    method = 'UCUM 차원 검사 + 분자량(IUPAC 원자량으로 계산)'
    formula = `질량농도 ÷ M = 몰농도 (M = ${fmt(mw)} g/mol, ${a.formula} 원자량 합)`
    assumptions.push(`분자량 M = ${fmt(mw)} g/mol (${a.formula}, IUPAC 표준 원자량의 합으로 계산)`)
    sources.push(SRC.IUPAC)
  }
  if (isEq && a.charge) {
    formula += `; 당량(mEq) = 몰(mmol) × 전하(z = ${a.charge})`
    assumptions.push(`이온 전하 z = ${a.charge}`)
  }
  if (a.id === 'phosphate') assumptions.push('mg/dL은 원소 인(P) 기준으로 표기')
  if (a.id === 'cholesterol') assumptions.push('총콜레스테롤·HDL-C·LDL-C 모두 콜레스테롤 분자(C27H46O) 기준')
  return {
    method,
    factor: `1 ${unitLabel(from)} = ${fmt(factor)} ${unitLabel(to)}`,
    formula,
    assumptions,
    sources,
    todo: mw !== undefined ? ['TODO(verify): 원자량은 IUPAC 약식표 값을 입력했으며 이 환경에서 원문 재확인 불가'] : undefined,
  }
}

function special(a: Analyte, value: number, from: string, to: string): ConvertResult {
  if (from === to) return ok(value, to, simple('동일 단위', '값 그대로', [], []))
  switch (a.id) {
    case 'hba1c': {
      if (from === '% (NGSP)' && to === 'mmol/mol (IFCC)') {
        const v = (value - 2.15) * 10.929
        return ok(v, to, {
          method: 'NGSP 공식 변환식 (NGSP → IFCC)',
          formula: 'IFCC (mmol/mol) = (NGSP (%) − 2.15) × 10.929',
          factor: '기울기 10.929 mmol/mol per %, 절편 2.15 %',
          assumptions: ['IFCC 기준 측정법과 NGSP 인증 측정법의 마스터 방정식 기반(선형 근사)'],
          sources: [NGSP_SRC],
          todo: ['TODO(verify): 이 환경에서 ngsp.org 접속이 차단되어 식의 계수를 원문과 대조하지 못함'],
        })
      }
      if (from === 'mmol/mol (IFCC)' && to === '% (NGSP)') {
        const v = 0.09148 * value + 2.152
        return ok(v, to, {
          method: 'NGSP 공식 변환식 (IFCC → NGSP)',
          formula: 'NGSP (%) = 0.09148 × IFCC (mmol/mol) + 2.152',
          assumptions: ['정방향 식과 반올림 계수 때문에 왕복 변환 시 0.01%p 내외 차이가 있을 수 있음'],
          sources: [NGSP_SRC],
          todo: ['TODO(verify): 이 환경에서 ngsp.org 접속이 차단되어 식의 계수를 원문과 대조하지 못함'],
        })
      }
      break
    }
    case 'uacr':
    case 'upcr': {
      const M = molarMass('C4H7N3O') // creatinine g/mol == mg/mmol
      const k = M / 1000 // (mg/g) -> (mg/mmol)
      if (from === 'mg/g' && to === 'mg/mmol') return ok(value * k, to, ratioBasis(M, k, from, to))
      if (from === 'mg/mmol' && to === 'mg/g') return ok(value / k, to, ratioBasis(M, k, from, to))
      break
    }
    case 'bun': {
      const N2 = 2 * ATOMIC_WEIGHTS.N
      const ureaM = molarMass('CH4N2O')
      const bunToUrea = ureaM / N2
      const base = {
        assumptions: ['요소(urea, CH4N2O) 1분자에 질소 2원자', '요소질소(BUN)는 요소의 질소 질량만 표기하는 관행'],
        sources: [SRC.IUPAC],
        todo: ['TODO(verify): 표준 문헌/기관 변환표와 대조는 테스트의 근사 비교로만 수행'],
      }
      const toUreaMg = (b: number) => b * bunToUrea
      const toUreaMmol = (b: number) => (b * 10) / N2 // mg/dL -> mg/L ÷ (g/mol of N2)
      if (from === 'BUN mg/dL' && to === 'urea mg/dL')
        return ok(toUreaMg(value), to, { method: 'BUN ↔ 요소 질량 환산', formula: `요소 = BUN × M(urea) / (2×M(N)) = BUN × ${fmt(ureaM)} / ${fmt(N2)}`, factor: `1 BUN mg/dL = ${fmt(bunToUrea)} urea mg/dL`, ...base })
      if (from === 'urea mg/dL' && to === 'BUN mg/dL')
        return ok(value / bunToUrea, to, { method: '요소 ↔ BUN 질량 환산', formula: `BUN = 요소 × (2×M(N)) / M(urea)`, factor: `1 urea mg/dL = ${fmt(1 / bunToUrea)} BUN mg/dL`, ...base })
      if (from === 'BUN mg/dL' && to === 'urea mmol/L')
        return ok(toUreaMmol(value), to, { method: 'BUN → 요소 몰농도', formula: `요소(mmol/L) = BUN(mg/dL) × 10 / (2×M(N)) = BUN × 10 / ${fmt(N2)}`, factor: `1 BUN mg/dL = ${fmt(10 / N2)} urea mmol/L`, ...base })
      if (from === 'urea mmol/L' && to === 'BUN mg/dL')
        return ok((value * N2) / 10, to, { method: '요소 몰농도 → BUN', formula: `BUN(mg/dL) = 요소(mmol/L) × (2×M(N)) / 10`, factor: `1 urea mmol/L = ${fmt(N2 / 10)} BUN mg/dL`, ...base })
      if (from === 'urea mg/dL' && to === 'urea mmol/L')
        return ok((value * 10) / ureaM, to, { method: '요소 질량 → 몰농도', formula: `요소(mmol/L) = 요소(mg/dL) × 10 / M(urea) (${fmt(ureaM)} g/mol)`, ...base })
      if (from === 'urea mmol/L' && to === 'urea mg/dL')
        return ok((value * ureaM) / 10, to, { method: '요소 몰농도 → 질량', formula: `요소(mg/dL) = 요소(mmol/L) × M(urea) / 10`, ...base })
      break
    }
    case 'triglycerides': {
      const M = molarMass('C57H104O6')
      const res = ucumConvert(from, value, to, { molecularWeight: M })
      if (!res.ok) return fail(refusalFor(a, from, to, res))
      const f = ucumConvert(from, 1, to, { molecularWeight: M }).value as number
      return ok(res.value as number, to, {
        method: 'UCUM 스케일 + 평균 분자량 가정',
        factor: `1 ${unitLabel(from)} = ${fmt(f)} ${unitLabel(to)}`,
        formula: `질량농도 ÷ M = 몰농도 (M = ${fmt(M)} g/mol, 트리올레인 C57H104O6 가정)`,
        assumptions: ['중성지방은 지방산 조성이 다른 혼합물이므로 대표 분자(트리올레인)의 분자량을 가정한 근사', '관행적으로 쓰는 계수는 기관마다 약간 다를 수 있음'],
        sources: [UCUM_SRC, UCUM_LHC, SRC.IUPAC],
        todo: ['TODO(verify): 가정한 대표 분자량이 Labcorp/CMEinfo/NBME 표의 계수와 일치하는지 이 환경에서 확인하지 못함'],
      })
    }
  }
  return fail(`${unitLabel(from)} → ${unitLabel(to)}: ${a.en}에 대해 공표된 변환식이 없어 변환하지 않습니다.`)
}

function ratioBasis(M: number, k: number, from: string, to: string): Basis {
  return {
    method: 'KDIGO 2024 표기 단위 간 환산 (크레아티닌 분자량으로 계산)',
    factor: `1 mg/g = ${fmt(k)} mg/mmol`,
    formula: `(mg/mmol) = (mg/g) × M(creatinine) / 1000, M = ${fmt(M)} g/mol`,
    assumptions: [
      '분모의 크레아티닌만 질량(g) ↔ 몰(mmol)로 환산하고 분자(알부민/단백, mg)는 그대로 둠',
      'KDIGO 문서의 임계값은 반올림되어 있음 (예: 30 mg/g ≈ 3 mg/mmol)',
    ],
    sources: [KDIGO_SRC, SRC.IUPAC],
    todo: [`TODO(verify): ${unitLabel(from)}→${unitLabel(to)} 계수를 KDIGO 2024 원문과 직접 대조하지 못함 (kdigo.org 접속 차단)`],
  }
}

const simple = (method: string, formula: string, assumptions: string[], sources: Source[]): Basis => ({ method, formula, assumptions, sources })
const ok = (value: number, unit: string, basis: Basis): ConvertResult => ({ ok: true, value, unit, basis })
const fail = (reason: string): ConvertResult => ({ ok: false, reason })

export function convert(a: Analyte, value: number, from: string, to: string): ConvertResult {
  if (!Number.isFinite(value)) return fail('값을 숫자로 입력하세요.')
  if (a.kind === 'special') {
    if (!a.units.includes(from) || !a.units.includes(to)) {
      // triglycerides uses plain UCUM units
      if (a.id !== 'triglycerides') {
        return fail(`${a.en}는 ${a.units.map(unitLabel).join(', ')} 사이에서만 변환할 수 있습니다.`)
      }
    }
    return special(a, value, from, to)
  }

  // Validate that both strings are UCUM-parsable.
  for (const u of [from, to]) {
    const v = utils.validateUnitString(toUcum(u))
    if (v.status !== 'valid') return fail(`'${u}'는 유효한 UCUM 단위가 아닙니다.`)
  }

  if (a.kind === 'enzyme') {
    const r = ucumConvert(from, value, to)
    if (!r.ok) return fail(refusalFor(a, from, to, r))
    const f = ucumConvert(from, 1, to).value as number
    const b = ucumBasis(a, from, to, f)
    b.assumptions.push('1 U = 1 µmol/min (국제 효소 단위), 1 kat = 1 mol/s. 측정 온도·시약에 따른 참고구간 차이는 변환과 무관')
    return ok(r.value as number, to, b)
  }

  const mw = a.formula ? molarMass(a.formula) : undefined
  const opts = a.kind === 'mass' ? {} : { molecularWeight: mw, charge: a.kind === 'ion' ? a.charge : undefined }
  const r = ucumConvert(from, value, to, opts)
  if (!r.ok) return fail(refusalFor(a, from, to, r))
  const f = ucumConvert(from, 1, to, opts).value as number
  // molar mass is relevant whenever one side is molar/eq and the other is mass
  const isMolar = (u: string) => /mol|eq/i.test(u)
  const needsMw = mw !== undefined && isMolar(from) !== isMolar(to)
  return ok(r.value as number, to, ucumBasis(a, from, to, f, needsMw ? mw : undefined))
}

export type Sex = 'M' | 'F' | 'any'
export type Specimen = 'serum/plasma' | 'whole blood' | 'urine' | string

export interface RefInterval {
  analyteId: string
  specimen: Specimen
  sex: Sex
  /** Age range in years; min inclusive, max exclusive. null max = open ended as published. */
  ageMinYears: number
  ageMaxYears: number | null
  /** Published limits; null = not published (one-sided interval). */
  low: number | null
  high: number | null
  unit: string
  source: string
  sourceUrl: string
  note?: string
}

export type Flag = 'low' | 'normal' | 'high'

/** Return only intervals that were published for exactly this analyte/specimen/sex/age. No extrapolation. */
export function findIntervals(
  table: RefInterval[],
  q: { analyteId: string; ageYears: number; sex: 'M' | 'F'; specimen: Specimen },
): RefInterval[] {
  return table.filter(
    (r) =>
      r.analyteId === q.analyteId &&
      r.specimen === q.specimen &&
      (r.sex === 'any' || r.sex === q.sex) &&
      q.ageYears >= r.ageMinYears &&
      (r.ageMaxYears === null || q.ageYears < r.ageMaxYears),
  )
}

export function classify(value: number, r: Pick<RefInterval, 'low' | 'high'>): Flag {
  if (r.low !== null && value < r.low) return 'low'
  if (r.high !== null && value > r.high) return 'high'
  return 'normal'
}

export function ageLabel(r: RefInterval): string {
  return r.ageMaxYears === null ? `≥ ${r.ageMinYears} y` : `${r.ageMinYears} – <${r.ageMaxYears} y`
}

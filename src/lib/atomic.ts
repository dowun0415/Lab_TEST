// IUPAC conventional/abridged standard atomic weights (g/mol), used to compute molar masses.
// TODO(verify): values entered from the IUPAC abridged table; not re-fetched in this environment.
export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008,
  Li: 6.94,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Mg: 24.305,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
}

/** Parse a simple molecular formula such as "C6H12O6" and return its molar mass in g/mol. */
export function molarMass(formula: string): number {
  const re = /([A-Z][a-z]?)(\d*)/g
  let total = 0
  let consumed = 0
  for (const m of formula.matchAll(re)) {
    const w = ATOMIC_WEIGHTS[m[1]]
    if (w === undefined) throw new Error(`Unknown element ${m[1]} in ${formula}`)
    total += w * (m[2] ? Number(m[2]) : 1)
    consumed += m[0].length
  }
  if (consumed !== formula.length) throw new Error(`Cannot parse formula ${formula}`)
  return total
}

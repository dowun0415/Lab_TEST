export interface Source {
  label: string
  url?: string
}

export interface Basis {
  method: string
  /** Human readable factor, e.g. "1 mg/dL = 0.0555 mmol/L" */
  factor?: string
  formula: string
  assumptions: string[]
  sources: Source[]
  todo?: string[]
}

export type ConvertResult =
  | { ok: true; value: number; unit: string; basis: Basis }
  | { ok: false; reason: string }

declare module '@lhncbc/ucum-lhc' {
  interface ConvertResult {
    status: string
    toVal: number | null
    msg?: string[]
    code?: string
  }
  interface Utils {
    convertUnitTo(from: string, val: number, to: string, opts?: { molecularWeight?: number; charge?: number }): ConvertResult
    validateUnitString(u: string): { status: string }
  }
  export const UcumLhcUtils: { getInstance(): Utils }
}

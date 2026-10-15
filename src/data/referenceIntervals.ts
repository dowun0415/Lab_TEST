import type { RefInterval } from '../lib/reference'

export const RCPA_TABLE6_URL = 'https://www.rcpa.edu.au/Manuals/RCPA-Manual/General-Information/IG/Table-6-Harmonised-reference-intervals-for-chem'
export const CALIPER_URL = 'https://caliperproject.ca/'

/**
 * Published reference intervals entered ONLY by transcription from the primary source.
 *
 * Intentionally EMPTY: RCPA Table 6 (rcpa.edu.au) could not be retrieved in the build
 * environment (outbound requests to www.rcpa.edu.au were blocked by the egress proxy),
 * and values from search-engine snippets or memory are not acceptable substitutes.
 * Do not fill from secondary sources. See DATA_GAPS and README.
 *
 * TODO(verify): transcribe RCPA Table 6 (analyte, specimen, sex, age band, limits, unit, version/date).
 */
export const REFERENCE_INTERVALS: RefInterval[] = []

export interface DataGap {
  item: string
  reason: string
}

export const DATA_GAPS: DataGap[] = [
  { item: 'RCPA Harmonised Reference Intervals Table 6 (성인 참고구간)', reason: 'www.rcpa.edu.au 접속이 이 환경의 네트워크 정책(egress proxy)으로 차단되어 원문 표를 읽지 못했습니다. 검색 결과 요약문의 숫자는 출처 검증이 안 되므로 사용하지 않았습니다.' },
  { item: '소아 참고구간 (CALIPER)', reason: '요청대로 앱에는 값을 넣지 않고 CALIPER 사이트 안내만 제공합니다. 또한 caliperproject.ca 접속도 차단되어 있었습니다.' },
  { item: '교차 검증용 Labcorp / CMEinfo / NBME 표', reason: '해당 사이트·PDF에 접속하지 못해 직접 대조하지 못했습니다. 테스트는 널리 쓰이는 근사 계수(교과서 수준)와의 허용오차 비교로 대신했으며 TODO(verify)로 표시했습니다.' },
]

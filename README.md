# 임상검사 단위 변환 · 참고구간

React + TypeScript + Vite 정적 웹앱 (GitHub Pages).

**Pages URL: https://dowun0415.github.io/Lab_TEST/**

## 기능
- **변환 탭**: 분석물 검색(영문·한글·동의어) → 값/원본/대상 단위 → 결과 + "계산 근거"(방법·계수·수식·가정·출처), 단위 스왑, 복사. 근거가 없는 변환(예: mg/dL→U/L)은 이유와 함께 거부.
- **참고구간 탭**: 분석물+나이+성별+검체 → 공표된 구간만 표시(없는 나이는 외삽하지 않음), 결과 값 입력 시 low/normal/high 판정.

## 데이터 출처와 역할
| 역할 | 출처 | 상태 |
|---|---|---|
| 단위 변환 엔진 | UCUM (`@lhncbc/ucum-lhc`), IUPAC 원자량으로 계산한 분자량, 이온 전하 | 구현됨 (계수는 계산으로 산출) |
| 특수 변환 | HbA1c NGSP↔IFCC, uACR·uPCR mg/g↔mg/mmol, BUN↔요소, 중성지방 | 구현됨, 원문 대조는 TODO(verify) |
| 참고구간 | RCPA Harmonised Reference Intervals Table 6 / 소아 CALIPER 안내 | **데이터 없음** (아래 참고) |
| 교차 검증 | Labcorp, CMEinfo, NBME | **직접 대조 못함** (아래 참고) |

## 구하지 못한 자료와 사유
- **RCPA Table 6**: `www.rcpa.edu.au` 접속이 빌드 환경의 네트워크 정책으로 차단되어 원문 표를 읽지 못했습니다. 검색 요약문의 숫자는 검증 불가라 쓰지 않았고, `src/data/referenceIntervals.ts`의 데이터는 **빈 배열**입니다. 그래서 참고구간 탭은 현재 모든 조건에서 "공표된 참고구간이 없습니다"와 원문 링크를 보여줍니다.
- **CALIPER(소아)**: 요청대로 값은 넣지 않고 링크 안내만 하며, 사이트 접속도 차단되었습니다.
- **Labcorp / CMEinfo / NBME 교차 검증**: 접속 불가. 테스트는 널리 알려진 근사 계수와의 허용오차 비교로 대신했습니다.
- **ngsp.org / KDIGO 원문**: 접속 불가. 식(HbA1c: `IFCC=(NGSP−2.15)×10.929`, `NGSP=0.09148×IFCC+2.152`; uACR/uPCR은 크레아티닌 분자량 113.12 g/mol로 계산)은 기억 기반이므로 **TODO(verify)** 입니다.
- 원자량은 IUPAC 약식표 값을 입력했으며 **TODO(verify)**.

## 개발
```bash
npm install
npm test       # Vitest
npm run build  # tsc + vite build
npm run dev
```
배포: `main` push → GitHub Actions(`.github/workflows/deploy.yml`) → Pages.

교육·참고용이며 임상 판단의 근거로 단독 사용하지 마세요.

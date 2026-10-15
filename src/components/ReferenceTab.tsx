import { useMemo, useState } from 'react'
import { ANALYTES, unitLabel } from '../lib/analytes'
import { CALIPER_URL, DATA_GAPS, RCPA_TABLE6_URL, REFERENCE_INTERVALS } from '../data/referenceIntervals'
import { ageLabel, classify, findIntervals, type Flag } from '../lib/reference'

const FLAG: Record<Flag, string> = { low: 'LOW (낮음)', normal: 'NORMAL (정상)', high: 'HIGH (높음)' }

export default function ReferenceTab() {
  const [id, setId] = useState('glucose')
  const [age, setAge] = useState('40')
  const [sex, setSex] = useState<'M' | 'F'>('F')
  const [specimen, setSpecimen] = useState('serum/plasma')
  const [value, setValue] = useState('')

  const ageNum = Number(age)
  const found = useMemo(
    () => (age.trim() === '' || Number.isNaN(ageNum) ? [] : findIntervals(REFERENCE_INTERVALS, { analyteId: id, ageYears: ageNum, sex, specimen })),
    [id, ageNum, age, sex, specimen],
  )
  const v = Number(value)
  const hasValue = value.trim() !== '' && !Number.isNaN(v)

  return (
    <section>
      <div className="row">
        <label className="field grow">
          분석물
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {ANALYTES.map((a) => <option key={a.id} value={a.id}>{a.ko} / {a.en}</option>)}
          </select>
        </label>
        <label className="field">
          나이 (세)
          <input inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className="field">
          성별
          <select value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
            <option value="F">여</option>
            <option value="M">남</option>
          </select>
        </label>
        <label className="field">
          검체
          <select value={specimen} onChange={(e) => setSpecimen(e.target.value)}>
            <option value="serum/plasma">혈청/혈장</option>
            <option value="whole blood">전혈</option>
            <option value="urine">소변</option>
          </select>
        </label>
      </div>

      {found.length === 0 ? (
        <div className="result refused" role="status">
          <strong>공표된 참고구간이 없습니다</strong>
          <p>
            이 조건(분석물·나이·성별·검체)에 해당하는 구간이 앱의 데이터에 없습니다. 없는 나이 구간은 외삽하지 않으며 값을 임의로 채우지 않습니다.
            {REFERENCE_INTERVALS.length === 0 && ' 현재 앱에는 참고구간 데이터가 한 건도 들어 있지 않습니다 (아래 "데이터 공백" 참고).'}
          </p>
          <p>
            성인: <a href={RCPA_TABLE6_URL} target="_blank" rel="noreferrer">RCPA Harmonised Reference Intervals – Table 6</a> ·
            소아: <a href={CALIPER_URL} target="_blank" rel="noreferrer">CALIPER</a>
          </p>
        </div>
      ) : (
        <>
          <label className="field">
            결과 값
            <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={`단위: ${unitLabel(found[0].unit)}`} />
          </label>
          {found.map((r, i) => {
            const flag = hasValue ? classify(v, r) : null
            return (
              <div key={i} className="result">
                <div className="big">
                  {r.low ?? '—'} – {r.high ?? '—'} <span>{unitLabel(r.unit)}</span>
                </div>
                {flag && <p className={`flag ${flag}`}>{FLAG[flag]}</p>}
                <dl>
                  <dt>검체</dt><dd>{r.specimen}</dd>
                  <dt>나이 구간</dt><dd>{ageLabel(r)}</dd>
                  <dt>성별</dt><dd>{r.sex === 'any' ? '구분 없음' : r.sex === 'M' ? '남' : '여'}</dd>
                  <dt>출처</dt><dd><a href={r.sourceUrl} target="_blank" rel="noreferrer">{r.source}</a></dd>
                  {r.note && (<><dt>비고</dt><dd>{r.note}</dd></>)}
                </dl>
              </div>
            )
          })}
        </>
      )}

      <details className="basis" open>
        <summary>데이터 공백 (구하지 못한 자료와 사유)</summary>
        <ul>{DATA_GAPS.map((g) => <li key={g.item}><strong>{g.item}</strong> — {g.reason}</li>)}</ul>
      </details>
    </section>
  )
}

import { useMemo, useState } from 'react'
import { ANALYTES, searchAnalytes, unitLabel, type Analyte } from '../lib/analytes'
import { convert } from '../lib/convert'

const EXTRA = ['mg/dL', 'mmol/L', 'g/L', 'U/L']

function unitOptions(a: Analyte): string[] {
  return a.kind === 'special' && a.id !== 'triglycerides' ? a.units : [...new Set([...a.units, ...EXTRA])]
}

export function fmtNum(n: number): string {
  if (n === 0) return '0'
  const abs = Math.abs(n)
  return abs >= 1e6 || abs < 1e-4 ? n.toExponential(4) : Number(n.toPrecision(5)).toString()
}

export default function ConvertTab() {
  const [q, setQ] = useState('')
  const matches = useMemo(() => searchAnalytes(q), [q])
  const [id, setId] = useState('glucose')
  const analyte = ANALYTES.find((a) => a.id === id) ?? ANALYTES[0]
  const [value, setValue] = useState('100')
  const [from, setFrom] = useState('mg/dL')
  const [to, setTo] = useState('mmol/L')
  const [copied, setCopied] = useState(false)

  const opts = unitOptions(analyte)
  const pick = (a: Analyte) => {
    setId(a.id)
    setFrom(a.units[0])
    setTo(a.units[1] ?? a.units[0])
  }
  const result = useMemo(() => {
    const v = Number(value)
    if (value.trim() === '' || Number.isNaN(v)) return null
    return convert(analyte, v, from, to)
  }, [analyte, value, from, to])

  const swap = () => {
    if (result?.ok) setValue(String(Number(result.value.toPrecision(6))))
    setFrom(to)
    setTo(from)
  }
  const copy = async () => {
    if (!result?.ok) return
    try {
      await navigator.clipboard.writeText(`${fmtNum(result.value)} ${unitLabel(result.unit)}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section>
      <label className="field">
        분석물 검색 (영문 · 한글 · 동의어)
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: glucose, 혈당, sgpt, BUN" />
      </label>
      <ul className="chips" aria-label="분석물 목록">
        {matches.length === 0 && <li className="muted">검색 결과가 없습니다.</li>}
        {matches.map((a) => (
          <li key={a.id}>
            <button className={a.id === id ? 'chip on' : 'chip'} onClick={() => pick(a)}>
              {a.ko} <span className="muted">{a.en}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="row">
        <label className="field grow">
          값
          <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <label className="field">
          원본 단위
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {opts.map((u) => <option key={u} value={u}>{unitLabel(u)}</option>)}
          </select>
        </label>
        <button className="swap" onClick={swap} title="원본/대상 단위 교환" aria-label="단위 교환">⇄</button>
        <label className="field">
          대상 단위
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {opts.map((u) => <option key={u} value={u}>{unitLabel(u)}</option>)}
          </select>
        </label>
      </div>
      {analyte.note && <p className="muted small">참고: {analyte.note}</p>}

      {result && result.ok && (
        <div className="result">
          <div className="big" data-testid="result">
            {fmtNum(result.value)} <span>{unitLabel(result.unit)}</span>
            <button onClick={copy}>{copied ? '복사됨' : '복사'}</button>
          </div>
          <details open className="basis">
            <summary>계산 근거</summary>
            <dl>
              <dt>방법</dt><dd>{result.basis.method}</dd>
              {result.basis.factor && (<><dt>계수</dt><dd>{result.basis.factor}</dd></>)}
              <dt>수식</dt><dd>{result.basis.formula}</dd>
              {result.basis.assumptions.length > 0 && (<><dt>가정</dt><dd><ul>{result.basis.assumptions.map((s) => <li key={s}>{s}</li>)}</ul></dd></>)}
              <dt>출처</dt>
              <dd><ul>{result.basis.sources.map((s) => <li key={s.label}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : s.label}</li>)}</ul></dd>
              {result.basis.todo && (<><dt>미확인</dt><dd><ul>{result.basis.todo.map((s) => <li key={s}>{s}</li>)}</ul></dd></>)}
            </dl>
          </details>
        </div>
      )}
      {result && !result.ok && <div className="result refused" role="alert"><strong>변환 거부</strong><p>{result.reason}</p></div>}
      {!result && <p className="muted">값을 입력하세요.</p>}
    </section>
  )
}

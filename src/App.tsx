import { useState } from 'react'
import ConvertTab from './components/ConvertTab'
import ReferenceTab from './components/ReferenceTab'
import './index.css'

export default function App() {
  const [tab, setTab] = useState<'convert' | 'ref'>('convert')
  return (
    <main>
      <h1>임상검사 단위 변환 · 참고구간</h1>
      <p className="muted small">교육·참고용입니다. 임상 판단에 사용하기 전에 검사실의 공식 단위·참고구간을 확인하세요.</p>
      <div role="tablist" className="tabs">
        <button role="tab" aria-selected={tab === 'convert'} onClick={() => setTab('convert')}>변환</button>
        <button role="tab" aria-selected={tab === 'ref'} onClick={() => setTab('ref')}>참고구간</button>
      </div>
      {tab === 'convert' ? <ConvertTab /> : <ReferenceTab />}
    </main>
  )
}

import { useState } from 'react'
import { calculateSplit } from './lib/calculateSplit'

const baht = (satang) =>
  (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function App() {
  const [people, setPeople] = useState([])
  const [items, setItems] = useState([])
  const [config, setConfig] = useState({ servicePercent: 10, vatPercent: 7, discount: 0 })

  const [personName, setPersonName] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [sharedBy, setSharedBy] = useState([])
  const [copied, setCopied] = useState(false)

  const addPerson = () => {
    if (!personName.trim()) return
    setPeople([...people, { id: crypto.randomUUID(), name: personName.trim() }])
    setPersonName('')
  }

  const toggleShare = (id) =>
    setSharedBy(sharedBy.includes(id) ? sharedBy.filter((x) => x !== id) : [...sharedBy, id])

  const addItem = () => {
    const price = Math.round(parseFloat(itemPrice) * 100)
    if (!itemName.trim() || !price || sharedBy.length === 0) return
    setItems([...items, { id: crypto.randomUUID(), name: itemName.trim(), price, sharedBy }])
    setItemName('')
    setItemPrice('')
    setSharedBy([])
  }

  const result = calculateSplit({ people, items, config })

  const copyText = async () => {
    const lines = people.map((p) => `${p.name}: ${baht(result.totals[p.id] || 0)} บาท`)
    const text = `🧾 สรุปหารบิล\n${lines.join('\n')}\nรวม ${baht(result.grandTotal)} บาท`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(text)
    }
  }

  return (
    <div className="app">
      <h1>🧾 หารบิลกับเพื่อน</h1>

      <section className="card">
        <h2>1. คนในโต๊ะ</h2>
        <div className="row">
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPerson()}
            placeholder="ชื่อเพื่อน"
          />
          <button className="btn" onClick={addPerson}>เพิ่มคน</button>
        </div>
        <div className="chips">
          {people.map((p) => (
            <span key={p.id} className="chip on">{p.name}</span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>2. รายการอาหาร</h2>
        <div className="row">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="ชื่อรายการ"
          />
          <input
            type="number"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            placeholder="ราคา (บาท)"
          />
        </div>
        <div className="muted">ใครกินบ้าง?</div>
        <div className="chips">
          {people.map((p) => (
            <label key={p.id} className={`chip ${sharedBy.includes(p.id) ? 'on' : ''}`}>
              <input
                type="checkbox"
                checked={sharedBy.includes(p.id)}
                onChange={() => toggleShare(p.id)}
              />
              {p.name}
            </label>
          ))}
        </div>
        <button className="btn full" onClick={addItem}>+ เพิ่มรายการ</button>
        <ul className="list">
          {items.map((i) => (
            <li key={i.id}>
              <span>{i.name} <span className="muted">({i.sharedBy.length} คน)</span></span>
              <strong>{baht(i.price)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>3. ค่าบริการ / VAT / ส่วนลด</h2>
        <div className="field">
          <span>Service (%)</span>
          <input
            type="number"
            value={config.servicePercent}
            onChange={(e) => setConfig({ ...config, servicePercent: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <span>VAT (%)</span>
          <input
            type="number"
            value={config.vatPercent}
            onChange={(e) => setConfig({ ...config, vatPercent: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <span>ส่วนลด (บาท)</span>
          <input
            type="number"
            value={config.discount / 100}
            onChange={(e) =>
              setConfig({ ...config, discount: Math.round(Number(e.target.value) * 100) })
            }
          />
        </div>
      </section>

      <section className="card">
        <h2>4. สรุปยอด</h2>
        <ul className="list">
          {people.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <strong>{baht(result.totals[p.id] || 0)} บาท</strong>
            </li>
          ))}
        </ul>
        <div className="total">
          <span>รวมทั้งหมด</span>
          <span>{baht(result.grandTotal)} บาท</span>
        </div>
        <button className="btn full" style={{ marginTop: 12 }} onClick={copyText}>
          {copied ? '✓ ก๊อปแล้ว' : '📋 ก๊อปข้อความไปแปะในไลน์'}
        </button>
      </section>
    </div>
  )
}
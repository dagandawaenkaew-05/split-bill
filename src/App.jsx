import { useState } from 'react'
import { calculateSplit } from './lib/calculateSplit'
import { useLocalStorage } from './hooks/useLocalStorage'

const baht = (satang) =>
  (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function App() {
  // สามตัวนี้ถูกเก็บลงเครื่องอัตโนมัติ
  const [people, setPeople] = useLocalStorage('sb-people', [])
  const [items, setItems] = useLocalStorage('sb-items', [])
  const [config, setConfig] = useLocalStorage('sb-config', {
    servicePercent: 10,
    vatPercent: 7,
    discount: 0,
  })

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

  const removePerson = (id) => {
    setPeople(people.filter((p) => p.id !== id))
    // เอาคนนี้ออกจากทุกรายการ และลบรายการที่ไม่เหลือคนกินเลย
    setItems(
      items
        .map((i) => ({ ...i, sharedBy: i.sharedBy.filter((x) => x !== id) }))
        .filter((i) => i.sharedBy.length > 0)
    )
    setSharedBy(sharedBy.filter((x) => x !== id))
  }

  const toggleShare = (id) =>
    setSharedBy(sharedBy.includes(id) ? sharedBy.filter((x) => x !== id) : [...sharedBy, id])

  const allSelected = people.length > 0 && sharedBy.length === people.length

  const toggleAll = () => setSharedBy(allSelected ? [] : people.map((p) => p.id))

  const addItem = () => {
    const price = Math.round(parseFloat(itemPrice) * 100)
    if (!itemName.trim() || !price || sharedBy.length === 0) return
    setItems([...items, { id: crypto.randomUUID(), name: itemName.trim(), price, sharedBy }])
    setItemName('')
    setItemPrice('')
    setSharedBy([])
  }

  const removeItem = (id) => setItems(items.filter((i) => i.id !== id))

  const resetAll = () => {
    if (!confirm('ล้างข้อมูลบิลนี้ทั้งหมด?')) return
    setPeople([])
    setItems([])
    setConfig({ servicePercent: 10, vatPercent: 7, discount: 0 })
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
            <span key={p.id} className="chip on">
              {p.name}{' '}
              <button className="x" onClick={() => removePerson(p.id)} aria-label={`ลบ ${p.name}`}>
                ×
              </button>
            </span>
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
            inputMode="decimal"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            placeholder="ราคา (บาท)"
          />
        </div>
        <div className="muted">ใครกินบ้าง?</div>
        <div className="chips">
          {people.length > 0 && (
            <button
              type="button"
              className={`chip all ${allSelected ? 'on' : ''}`}
              onClick={toggleAll}
            >
              ✓ ทุกคน
            </button>
          )}
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
              <span>
                {i.name} <span className="muted">({i.sharedBy.length} คน)</span>
              </span>
              <span>
                <strong>{baht(i.price)}</strong>{' '}
                <button className="x dark" onClick={() => removeItem(i.id)} aria-label={`ลบ ${i.name}`}>
                  ×
                </button>
              </span>
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
            inputMode="decimal"
            value={config.servicePercent}
            onChange={(e) => setConfig({ ...config, servicePercent: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <span>VAT (%)</span>
          <input
            type="number"
            inputMode="decimal"
            value={config.vatPercent}
            onChange={(e) => setConfig({ ...config, vatPercent: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <span>ส่วนลด (บาท)</span>
          <input
            type="number"
            inputMode="decimal"
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
        <button className="btn ghost full" style={{ marginTop: 8 }} onClick={resetAll}>
          🗑 เริ่มบิลใหม่ (ล้างทั้งหมด)
        </button>
      </section>
    </div>
  )
}
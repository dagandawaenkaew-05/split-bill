import { describe, it, expect } from 'vitest'
import { calculateSplit } from './calculateSplit'

const people = [
  { id: 'a', name: 'ฉัน' },
  { id: 'b', name: 'แนน' },
  { id: 'c', name: 'บอส' },
]
const noExtra = { servicePercent: 0, vatPercent: 0, discount: 0 }

describe('calculateSplit', () => {
  it('2 คนแชร์ 100 บาท → คนละ 50 บาท', () => {
    const items = [{ id: 1, name: 'ส้มตำ', price: 10000, sharedBy: ['a', 'b'] }]
    const result = calculateSplit({ people, items, config: noExtra })
    expect(result.totals.a).toBe(5000)
    expect(result.totals.b).toBe(5000)
    expect(result.totals.c).toBe(0)
  })

  it('3 คนแชร์ 100 บาท → ยอดรวมต้องไม่มีเศษหาย', () => {
    const items = [{ id: 1, name: 'หมูกระทะ', price: 10000, sharedBy: ['a', 'b', 'c'] }]
    const result = calculateSplit({ people, items, config: noExtra })
    const sum = result.totals.a + result.totals.b + result.totals.c
    expect(sum).toBe(10000)
    expect(result.grandTotal).toBe(10000)
  })

  it('service 10% + VAT 7% → ตรงกับบิลทั้งใบ', () => {
    const items = [{ id: 1, name: 'สเต๊ก', price: 10000, sharedBy: ['a', 'b'] }]
    const config = { servicePercent: 10, vatPercent: 7, discount: 0 }
    const result = calculateSplit({ people, items, config })
    // 100 + service 10 = 110, VAT 7% ของ 110 = 7.70 → รวม 117.70 บาท
    expect(result.grandTotal).toBe(11770)
    expect(result.totals.a + result.totals.b).toBe(11770)
  })
})
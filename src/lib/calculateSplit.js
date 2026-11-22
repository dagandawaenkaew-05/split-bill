// ทุกจำนวนเงินเป็น "สตางค์" (จำนวนเต็ม) เพื่อเลี่ยงปัญหาทศนิยม
export function calculateSplit({ people, items, config }) {
  const { servicePercent = 0, vatPercent = 0, discount = 0 } = config

  // 1) ยอดอาหารของแต่ละคน
  const food = {}
  people.forEach((p) => (food[p.id] = 0))

  items.forEach((item) => {
    const n = item.sharedBy.length
    if (n === 0) return
    const base = Math.floor(item.price / n)
    const remainder = item.price - base * n
    item.sharedBy.forEach((id, i) => {
      // คนแรก ๆ รับเศษไปคนละ 1 สตางค์ จนเศษหมด
      food[id] += base + (i < remainder ? 1 : 0)
    })
  })

  const foodSum = Object.values(food).reduce((s, v) => s + v, 0)

  // 2) ยอดรวมทั้งบิล: อาหาร - ส่วนลด + service แล้วคิด VAT ทับ
  const afterDiscount = foodSum - discount
  const service = Math.round((afterDiscount * servicePercent) / 100)
  const vat = Math.round(((afterDiscount + service) * vatPercent) / 100)
  const grandTotal = afterDiscount + service + vat

  // 3) แบ่งยอดรวมให้แต่ละคนตามสัดส่วนอาหารที่กิน
  const totals = {}
  let allocated = 0
  people.forEach((p) => {
    const share = foodSum === 0 ? 0 : Math.floor((grandTotal * food[p.id]) / foodSum)
    totals[p.id] = share
    allocated += share
  })

  // 4) เศษที่เหลือ โยนให้คนที่กินแล้วมียอด ทีละ 1 สตางค์
  let leftover = grandTotal - allocated
  for (const p of people) {
    if (leftover <= 0) break
    if (food[p.id] > 0) {
      totals[p.id] += 1
      leftover -= 1
    }
  }

  return { totals, grandTotal }
}
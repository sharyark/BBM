/** Which paper challans and vouchers print on. Saved per device: the shop PC may have a thermal printer, a phone not. */
export type Paper = 'a5' | '80mm' | '58mm'

export const PAPERS: { value: Paper; label: string }[] = [
  { value: '80mm', label: 'Thermal 80mm' },
  { value: '58mm', label: 'Thermal 58mm' },
  { value: 'a5', label: 'A5 page (normal printer)' },
]

const KEY = 'hisaab.paper'

export function getPaper(): Paper {
  try {
    const v = localStorage.getItem(KEY)
    return v === '80mm' || v === '58mm' || v === 'a5' ? v : 'a5'
  } catch {
    return 'a5'
  }
}

export function setPaper(p: Paper) {
  try {
    localStorage.setItem(KEY, p)
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

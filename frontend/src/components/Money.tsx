import { formatBalance, formatMoney, type Sides } from '@/lib/format'

/** `sides` turns the amount into a khata balance ("Baqaya" / "Advance"); money still owed is shown in amber. */
export function Money({ value, sides, bold = false }: { value: string | number | null | undefined; sides?: Sides; bold?: boolean }) {
  const n = Number(value ?? 0)
  const word = sides && n !== 0 ? sides[n > 0 ? 0 : 1] : undefined
  const color = word === undefined ? undefined : word === 'Baqaya' || word === 'Overdraft' ? '#b45309' : '#1f4e79'
  return <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: bold ? 600 : undefined, color }}>{sides ? formatBalance(value, sides) : formatMoney(value)}</span>
}

import { formatBalance, formatCurrency, formatMoney, formatQty, formatShort, SIDES, toDecimalString, toNumber } from './format'

describe('format', () => {
  it('groups money with two decimals (lakh style for en-IN)', () => {
    expect(formatMoney('1234567.5')).toBe('12,34,567.50')
    expect(formatMoney(0)).toBe('0.00')
    expect(formatMoney(null)).toBe('0.00')
  })
  it('prefixes the currency', () => {
    expect(formatCurrency('1500')).toBe('Rs 1,500.00')
  })
  it('shows signed balances with khata words instead of Dr / Cr', () => {
    expect(formatBalance('1200', SIDES.customer)).toBe('1,200.00 Baqaya')
    expect(formatBalance('-300.5', SIDES.customer)).toBe('300.50 Advance')
    expect(formatBalance('-300.5', SIDES.supplier)).toBe('300.50 Baqaya')
    expect(formatBalance('500', SIDES.money)).toBe('500.00')
    expect(formatBalance(0, SIDES.staff)).toBe('0.00')
  })
  it('trims quantity decimals', () => {
    expect(formatQty('2.500')).toBe('2.5')
    expect(formatQty('10.000')).toBe('10')
  })
  it('tolerates junk numbers', () => {
    expect(toNumber('abc')).toBe(0)
    expect(toNumber(undefined)).toBe(0)
    expect(toNumber('12.5')).toBe(12.5)
  })
  it('rounds without float noise', () => {
    expect(toDecimalString(0.1 + 0.2)).toBe('0.30')
    expect(toDecimalString(1.005)).toBe('1.01')
    expect(toDecimalString(2.5, 3)).toBe('2.500')
  })
  it('shortens big amounts to lakh / crore for headlines', () => {
    expect(formatShort('3614122')).toBe('36.1 lakh')
    expect(formatShort('445665.45')).toBe('4.46 lakh')
    expect(formatShort('200000')).toBe('2 lakh')
    expect(formatShort('12500000')).toBe('1.25 crore')
    expect(formatShort('75000')).toBe('75,000')
    expect(formatShort('-150000')).toBe('-1.5 lakh')
  })
})

export type ResidentialCategory = "small" | "standard"
export type TariffStep = { upto: number | null; rate: number }
export type Tariff = {
  steps: TariffStep[]
  ftPerKWh: number
  serviceCharge: number
  vatRate: number
}

// Verified 9 October 2026. Sources and eligibility notes: docs/electricity-tariffs-2026-10.md.
export const TARIFF_SOURCES = {
  rates: "https://www.mea.or.th/our-services/service-rates/other/D5xEaEwgU",
  ft: "https://www.mea.or.th/our-services/service-rates/ft/statistics",
}

export const FT_PERIODS = [
  { from: "2025-09", to: "2025-12", rate: 0.1572, label: "กันยายน–ธันวาคม 2568" },
  { from: "2026-01", to: "2026-04", rate: 0.0972, label: "มกราคม–เมษายน 2569" },
  { from: "2026-05", to: "2026-08", rate: 0.1623, label: "พฤษภาคม–สิงหาคม 2569" },
  { from: "2026-09", to: "2026-12", rate: 0.1623, label: "กันยายน–ธันวาคม 2569" },
] as const

const OLD_STANDARD: TariffStep[] = [
  { upto: 150, rate: 3.2484 },
  { upto: 400, rate: 4.2218 },
  { upto: null, rate: 4.4217 },
]
const OLD_SMALL: TariffStep[] = [
  { upto: 15, rate: 2.3488 },
  { upto: 25, rate: 2.9882 },
  { upto: 35, rate: 3.2405 },
  { upto: 100, rate: 3.6237 },
  { upto: 150, rate: 3.7171 },
  { upto: 400, rate: 4.2218 },
  { upto: null, rate: 4.4217 },
]
const CURRENT_STANDARD: TariffStep[] = [
  { upto: 200, rate: 3 },
  { upto: 400, rate: 4.1584 },
  { upto: null, rate: 4.3583 },
]
const CURRENT_SMALL: TariffStep[] = [
  { upto: 15, rate: 2.3488 },
  { upto: 25, rate: 2.9882 },
  ...CURRENT_STANDARD,
]

export const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100

export function getFtPeriod(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return undefined
  return FT_PERIODS.find(period => month >= period.from && month <= period.to)
}

export function getResidentialTariff(
  month: string,
  category: ResidentialCategory
): Tariff | null {
  const period = getFtPeriod(month)
  if (!period) return null
  const current = month >= "2026-09"
  return {
    steps: (category === "small"
      ? current ? CURRENT_SMALL : OLD_SMALL
      : current ? CURRENT_STANDARD : OLD_STANDARD
    ).map(step => ({ ...step })),
    ftPerKWh: period.rate,
    serviceCharge: category === "small" ? 8.19 : 24.62,
    vatRate: 0.07,
  }
}

function requireNonNegative(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("กรุณากรอกตัวเลขที่ไม่ติดลบ")
  }
}

export function energyChargeBySteps(kwh: number, steps: TariffStep[]) {
  requireNonNegative(kwh)
  let previous = 0
  let total = 0
  for (const step of steps) {
    const cap = step.upto ?? Infinity
    total += Math.max(0, Math.min(kwh, cap) - previous) * step.rate
    if (kwh <= cap) break
    previous = cap
  }
  return total
}

export function calcBillFromUsage(kwh: number, tariff: Tariff, discount = 0) {
  requireNonNegative(kwh)
  requireNonNegative(discount)
  requireNonNegative(tariff.serviceCharge)
  requireNonNegative(tariff.ftPerKWh)
  requireNonNegative(tariff.vatRate)
  // Round line items to satang before VAT so displayed rows reconcile.
  const energy = round2(energyChargeBySteps(kwh, tariff.steps))
  const ft = round2(tariff.ftPerKWh * kwh)
  const service = round2(tariff.serviceCharge)
  const preVat = round2(energy + ft + service)
  const vat = round2(preVat * tariff.vatRate)
  const afterVat = round2(preVat + vat)
  const appliedDiscount = Math.min(round2(discount), Math.max(0, afterVat))
  return {
    kwh, energy, ft, service, preVat, vat, afterVat,
    discount: appliedDiscount,
    total: round2(Math.max(0, afterVat - appliedDiscount)),
  }
}

function validateApplianceUsage(totalKwh: number, acKwh: number) {
  requireNonNegative(totalKwh)
  requireNonNegative(acKwh)
  if (totalKwh <= 0 || acKwh > totalKwh) {
    throw new Error("หน่วยเครื่องใช้ไฟฟ้าต้องไม่เกินหน่วยรวม และหน่วยรวมต้องมากกว่า 0")
  }
}

export function estimateAcCostProRata(
  bill: { totalKwh: number; preVatAmount: number; vatRate: number },
  acKwh: number,
  discount = 0
) {
  validateApplianceUsage(bill.totalKwh, acKwh)
  requireNonNegative(bill.preVatAmount)
  requireNonNegative(bill.vatRate)
  requireNonNegative(discount)
  const preVat = round2(bill.preVatAmount)
  const vat = round2(preVat * bill.vatRate)
  const afterVat = round2(preVat + vat)
  const appliedDiscount = Math.min(round2(discount), afterVat)
  const total = round2(afterVat - appliedDiscount)
  return {
    preVat, vat, afterVat, discount: appliedDiscount, total,
    avgBahtPerKWh: preVat / bill.totalKwh,
    acPreVat: round2(preVat * acKwh / bill.totalKwh),
    acTotal: round2(total * acKwh / bill.totalKwh),
  }
}

// Household allocation policy; the utility bills the household as one meter.
export function estimateAcCostMarginal(
  totalKwh: number,
  acKwh: number,
  tariff: Tariff,
  allocateServiceProportionally = true,
  discount = 0
) {
  validateApplianceUsage(totalKwh, acKwh)
  const bill = calcBillFromUsage(totalKwh, tariff, discount)
  const withoutAc = calcBillFromUsage(totalKwh - acKwh, tariff)
  let acCost = bill.afterVat - withoutAc.afterVat
  if (allocateServiceProportionally) {
    acCost += tariff.serviceCharge * (1 + tariff.vatRate) * acKwh / totalKwh
  }
  // Share a manual after-VAT discount proportionally, never charging more than the bill.
  const discountedCost = bill.afterVat > 0 ? acCost * bill.total / bill.afterVat : 0
  return round2(Math.max(0, Math.min(bill.total, discountedCost)))
}

export function splitBill(
  total: number,
  applianceCost: number,
  friends: string[],
  applianceUsers: string[]
) {
  requireNonNegative(total)
  requireNonNegative(applianceCost)
  const people = [...new Set(friends)]
  if (people.length === 0) return []
  const users = people.filter(person => applianceUsers.includes(person))
  const totalSatang = Math.round(total * 100)
  const acSatang = users.length ? Math.min(totalSatang, Math.round(applianceCost * 100)) : 0
  const baseSatang = totalSatang - acSatang
  // Allocate each pool's remainder deterministically; shares always sum to the bill.
  return people.map((name, index) => {
    const userIndex = users.indexOf(name)
    const base = Math.floor(baseSatang / people.length) + (index < baseSatang % people.length ? 1 : 0)
    const ac = userIndex < 0 ? 0 : Math.floor(acSatang / users.length) + (userIndex < acSatang % users.length ? 1 : 0)
    return { name, total: (base + ac) / 100 }
  })
}

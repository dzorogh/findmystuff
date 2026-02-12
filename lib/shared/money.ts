/**
 * Fowler Money Pattern: утилиты для работы с ценой.
 * amount всегда в минимальных единицах валюты (копейки, центы).
 */

export const SUPPORTED_CURRENCIES = [
  { code: "RUB", label: "₽ RUB" },
  { code: "USD", label: "$ USD" },
  { code: "EUR", label: "€ EUR" },
  { code: "GBP", label: "£ GBP" },
  { code: "CNY", label: "¥ CNY" },
  { code: "JPY", label: "¥ JPY" },
] as const;

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

/** Число знаков после запятой (минимальных единиц: 10^minorUnits). */
const CURRENCY_MINOR_UNITS: Record<string, number> = {
  RUB: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  CNY: 2,
  JPY: 0,
};

export function getCurrencyMinorUnits(currency: string): number {
  return CURRENCY_MINOR_UNITS[currency] ?? 2;
}

/** Форматирует число для отображения (без валюты, с разделителями). */
export function formatAmountDisplay(amount: number, currency: string): string {
  const minorUnits = getCurrencyMinorUnits(currency);
  const majorUnits = amount / Math.pow(10, minorUnits);
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(majorUnits);
}

/** Преобразует amount (минимальные единицы) в строку для ввода в поле. */
export function minorUnitsToDisplayString(
  amount: number,
  currency: string
): string {
  const minorUnits = getCurrencyMinorUnits(currency);
  const majorUnits = amount / Math.pow(10, minorUnits);
  return majorUnits.toFixed(minorUnits);
}

/** Парсит строку ввода пользователя в amount (минимальные единицы). */
export function parseMoneyToMinorUnits(
  value: string,
  currency: string
): number | null {
  const trimmed = value.trim().replace(/\s/g, "");
  if (!trimmed) return null;

  const normalized = trimmed.replace(",", ".");
  const parsed = parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return null;

  const minorUnits = getCurrencyMinorUnits(currency);
  const amount = Math.round(parsed * Math.pow(10, minorUnits));
  return amount;
}

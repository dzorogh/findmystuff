import { NextResponse } from "next/server";
import { HTTP_STATUS } from "./http-status";
import type { ItemMoneyFields, ValidateItemMoneyInput } from "@/types/api";

export type { ItemMoneyFields, ValidateItemMoneyInput };

const PRICE_PAIR_MESSAGE = "Цена и валюта должны быть указаны вместе или оба опущены";
const CURRENT_VALUE_PAIR_MESSAGE =
  "Текущая стоимость и валюта должны быть указаны вместе или оба опущены";
const PRICE_AMOUNT_MESSAGE =
  "Сумма цены должна быть целым неотрицательным числом в минимальных единицах";
const CURRENT_VALUE_AMOUNT_MESSAGE =
  "Сумма текущей стоимости должна быть целым неотрицательным числом в минимальных единицах";

/**
 * Проверяет пару amount + currency: оба заданы или оба опущены.
 * Возвращает нормализованные значение или NextResponse с ошибкой.
 */
function validateMoneyPair(
  amount: unknown,
  currency: unknown,
  errorMessage: string
): NextResponse | { amount: number | null; currency: string | null } {
  const hasAmount = amount != null && amount !== "";
  const hasCurrency = currency != null && currency !== "";
  if (hasAmount !== hasCurrency) {
    return NextResponse.json({ error: errorMessage }, { status: HTTP_STATUS.BAD_REQUEST });
  }
  return {
    amount: hasAmount ? Number(amount) : null,
    currency: hasCurrency ? String(currency).trim() : null,
  };
}

/**
 * Проверяет, что сумма — целое неотрицательное число (в минимальных единицах).
 */
function validateAmountNonNegativeInteger(
  value: number | null,
  errorMessage: string
): NextResponse | null {
  if (value == null) return null;
  if (value < 0 || !Number.isInteger(value)) {
    return NextResponse.json({ error: errorMessage }, { status: HTTP_STATUS.BAD_REQUEST });
  }
  return null;
}

/**
 * Валидирует поля цены и текущей стоимости для вещи (POST/PUT items).
 * Возвращает либо ошибку 400, либо нормализованные значения.
 */
export function validateItemMoney(input: ValidateItemMoneyInput): NextResponse | ItemMoneyFields {
  const priceResult = validateMoneyPair(
    input.price_amount,
    input.price_currency,
    PRICE_PAIR_MESSAGE
  );
  if (priceResult instanceof NextResponse) return priceResult;

  const currentValueResult = validateMoneyPair(
    input.current_value_amount,
    input.current_value_currency,
    CURRENT_VALUE_PAIR_MESSAGE
  );
  if (currentValueResult instanceof NextResponse) return currentValueResult;

  const priceAmountError = validateAmountNonNegativeInteger(
    priceResult.amount,
    PRICE_AMOUNT_MESSAGE
  );
  if (priceAmountError) return priceAmountError;

  const currentValueAmountError = validateAmountNonNegativeInteger(
    currentValueResult.amount,
    CURRENT_VALUE_AMOUNT_MESSAGE
  );
  if (currentValueAmountError) return currentValueAmountError;

  return {
    price_amount: priceResult.amount,
    price_currency: priceResult.currency,
    current_value_amount: currentValueResult.amount,
    current_value_currency: currentValueResult.currency,
  };
}

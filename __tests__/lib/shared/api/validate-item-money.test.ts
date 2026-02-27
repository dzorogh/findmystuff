jest.mock("next/server");

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import {
  type ItemMoneyFields,
  type ValidateItemMoneyInput,
  validateItemMoney,
} from "@/lib/shared/api/validate-item-money";

const asResponse = (value: unknown): NextResponse | null =>
  value instanceof NextResponse ? value : null;

describe("validateItemMoney", () => {
  const makeInput = (
    overrides: Partial<ValidateItemMoneyInput> = {}
  ): ValidateItemMoneyInput => ({
    price_amount: null,
    price_currency: null,
    current_value_amount: null,
    current_value_currency: null,
    ...overrides,
  });

  it("возвращает нормализованные null-поля, когда деньги не заданы", () => {
    const result = validateItemMoney(makeInput()) as ItemMoneyFields;

    expect(result).toEqual({
      price_amount: null,
      price_currency: null,
      current_value_amount: null,
      current_value_currency: null,
    });
  });

  it("валидирует пару price_amount/price_currency: только amount → 400", async () => {
    const result = validateItemMoney(
      makeInput({ price_amount: 100, price_currency: null })
    );

    const res = asResponse(result)!;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body.error).toContain("Цена и валюта должны быть указаны вместе");
  });

  it("валидирует пару current_value_amount/current_value_currency: только currency → 400", async () => {
    const result = validateItemMoney(
      makeInput({ current_value_amount: null, current_value_currency: "RUB" })
    );

    const res = asResponse(result)!;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body.error).toContain(
      "Текущая стоимость и валюта должны быть указаны вместе"
    );
  });

  it("возвращает ошибку для отрицательной суммы", async () => {
    const result = validateItemMoney(
      makeInput({ price_amount: -1, price_currency: "RUB" })
    );

    const res = asResponse(result)!;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body.error).toContain(
      "Сумма цены должна быть целым неотрицательным числом"
    );
  });

  it("возвращает ошибку для нецелой суммы текущей стоимости", async () => {
    const result = validateItemMoney(
      makeInput({ current_value_amount: 10.5, current_value_currency: "RUB" })
    );

    const res = asResponse(result)!;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body.error).toContain(
      "Сумма текущей стоимости должна быть целым неотрицательным числом"
    );
  });

  it("возвращает нормализованные значения при корректных данных", () => {
    const result = validateItemMoney(
      makeInput({
        price_amount: 100,
        price_currency: " RUB ",
        current_value_amount: 50,
        current_value_currency: "USD",
      })
    ) as ItemMoneyFields;

    expect(result).toEqual({
      price_amount: 100,
      price_currency: "RUB",
      current_value_amount: 50,
      current_value_currency: "USD",
    });
  });
});


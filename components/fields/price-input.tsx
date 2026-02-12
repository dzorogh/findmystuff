"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  SUPPORTED_CURRENCIES,
  formatAmountDisplay,
  minorUnitsToDisplayString,
  parseMoneyToMinorUnits,
} from "@/lib/shared/money";
import { cn } from "@/lib/utils";

const DEFAULT_CURRENCY = "RUB";

export interface PriceValue {
  amount: number;
  currency: string;
}

interface PriceInputProps {
  value: PriceValue | null;
  onChange: (value: PriceValue | null) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function PriceInput({
  value,
  onChange,
  id = "price",
  label = "Цена (необязательно)",
  disabled = false,
  className,
}: PriceInputProps) {
  const [pendingCurrency, setPendingCurrency] = useState(DEFAULT_CURRENCY);
  const [isFocused, setIsFocused] = useState(false);
  const [localInput, setLocalInput] = useState("");
  const hasPrice = value != null;
  const currency = hasPrice ? value.currency : pendingCurrency;

  const displayValue = isFocused
    ? localInput
    : hasPrice
      ? formatAmountDisplay(value.amount, value.currency)
      : "";

  const handleFocus = () => {
    setIsFocused(true);
    setLocalInput(
      hasPrice ? minorUnitsToDisplayString(value.amount, value.currency) : ""
    );
  };

  const commitValue = () => {
    if (!isFocused) return;
    setIsFocused(false);
    const raw = localInput.trim();
    if (!raw) {
      setPendingCurrency(currency);
      onChange(null);
      setLocalInput("");
      return;
    }
    const parsed = parseMoneyToMinorUnits(raw, currency);
    if (parsed !== null) {
      onChange({ amount: parsed, currency });
    }
    setLocalInput("");
  };

  const handleBlur = () => commitValue();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitValue();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalInput(e.target.value);
  };

  const handleCurrencyChange = (newCurrency: string | null) => {
    const currencyVal = newCurrency ?? DEFAULT_CURRENCY;
    setPendingCurrency(currencyVal);
    const raw = isFocused ? localInput : displayValue;
    if (!raw.trim()) {
      onChange(null);
      return;
    }
    const parsed = parseMoneyToMinorUnits(raw, currencyVal);
    if (parsed !== null) {
      onChange({ amount: parsed, currency: currencyVal });
    } else {
      onChange({ amount: 0, currency: currencyVal });
    }
  };

  return (
    <Field className={cn(className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={displayValue}
          onChange={handleAmountChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
        <Select
          value={currency}
          onValueChange={handleCurrencyChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Валюта" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SUPPORTED_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </Field>
  );
}

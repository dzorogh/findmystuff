/**
 * Mock for nuqs (ESM-only) in Jest tests.
 */

import { useState } from "react";

const createParserWithDefault = <T>(defaultValue: T) => ({
  parse: () => defaultValue,
  serialize: () => "",
  withDefault: (v: T) => createParserWithDefault(v),
});

export const parseAsString = {
  withDefault: (v: string) => createParserWithDefault(v),
};

export const parseAsInteger = {
  parse: () => null as number | null,
  serialize: () => "",
  withDefault: (v: number) => createParserWithDefault(v),
};

export const parseAsBoolean = {
  withDefault: (v: boolean) => createParserWithDefault(v),
};

export const parseAsStringLiteral = <T extends readonly string[]>(_values: T) => ({
  withDefault: (v: T[number]) => createParserWithDefault(v),
});

export function createParser<T>(config: { parse: (v: string | null) => T; serialize: (v: T) => string }) {
  return config;
}

const defaultUrlState = {
  search: "",
  page: 1,
  sortBy: "created_at" as const,
  sortDirection: "desc" as const,
  showDeleted: false,
  buildingId: null as number | null,
  roomId: null as number | null,
  furnitureId: null as number | null,
  placeId: null as number | null,
  containerId: null as number | null,
  entityTypeId: null as number | null,
  locationType: null as "all" | "room" | "place" | "container" | null,
  hasPhoto: null as boolean | null,
  hasItems: null as boolean | null,
  hasContainers: null as boolean | null,
  hasPlaces: null as boolean | null,
};

export function useQueryStates<T extends Record<string, { parse: () => unknown }>>(
  parsers: T,
  _opts?: { shallow?: boolean }
): [{ [K in keyof T]: ReturnType<T[K]["parse"]> }, (updates: Partial<{ [K in keyof T]: ReturnType<T[K]["parse"]> }>) => void] {
  const [state, setState] = useState(() => {
    const result = { ...defaultUrlState } as { [K in keyof T]: ReturnType<T[K]["parse"]> };
    for (const key of Object.keys(parsers) as (keyof T)[]) {
      if (key in parsers && typeof (parsers[key] as { parse?: () => unknown }).parse === "function") {
        (result as Record<string, unknown>)[key as string] = (parsers[key] as { parse: () => unknown }).parse();
      }
    }
    return result;
  });

  const setUrlState = (updates: Partial<{ [K in keyof T]: ReturnType<T[K]["parse"]> }>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return [state, setUrlState];
}

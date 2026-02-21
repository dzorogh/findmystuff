"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getTenants, switchTenant } from "@/lib/tenants/api";
import type { Tenant } from "@/lib/tenants/types";

const TENANT_COOKIE = "tenant_id";
const TENANT_COOKIE_DAYS = 365;

function getTenantFromCookie(): number | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${TENANT_COOKIE}=([^;]+)`));
  return match ? parseInt(match[2], 10) : null;
}

function setTenantCookie(tenantId: number) {
  if (typeof document === "undefined") return;
  const maxAge = TENANT_COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${TENANT_COOKIE}=${tenantId}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

interface TenantContextType {
  tenants: Tenant[];
  activeTenantId: number | null;
  isLoading: boolean;
  setActiveTenant: (tenantId: number) => Promise<void>;
  refreshTenants: () => Promise<void>;
}

export const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantIdState] = useState<number | null>(
    () => getTenantFromCookie()
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshTenants = useCallback(async () => {
    try {
      const list = await getTenants();
      setTenants(list);
      const fromCookie = getTenantFromCookie();
      let nextId: number | null = fromCookie;
      if (list.length === 1) {
        nextId = list[0].id;
        setTenantCookie(list[0].id);
      } else if (list.length > 0) {
        const isValid = fromCookie != null && list.some((t) => t.id === fromCookie);
        if (!isValid) {
          nextId = list[0].id;
          setTenantCookie(list[0].id);
        }
      }
      setActiveTenantIdState(nextId);
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
      setTenants([]);
      setActiveTenantIdState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTenants();
  }, [refreshTenants]);

  const setActiveTenant = useCallback(async (tenantId: number) => {
    await switchTenant(tenantId);
    setActiveTenantIdState(tenantId);
    setTenantCookie(tenantId);
  }, []);

  const value: TenantContextType = {
    tenants,
    activeTenantId,
    isLoading,
    setActiveTenant,
    refreshTenants,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}

export function useTenantOptional() {
  return useContext(TenantContext);
}

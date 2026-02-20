/**
 * Базовый HTTP-клиент для API запросов
 */

const API_BASE_URL = "/api";
const TENANT_HEADER = "x-tenant-id";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  totalCount?: number;
}

export interface RequestOptions extends RequestInit {
  tenantId?: number | null;
}

export class HttpClient {
  protected async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { tenantId, ...restOptions } = options;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(restOptions.headers as Record<string, string>),
    };
    if (tenantId != null && !Number.isNaN(tenantId)) {
      headers[TENANT_HEADER] = String(tenantId);
    }
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        headers,
      });

      const jsonData = await response.json();

      if (!response.ok) {
        return {
          error: jsonData.error || `HTTP error! status: ${response.status}`,
        } as ApiResponse<T>;
      }

      return jsonData;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  protected get apiBaseUrl() {
    return API_BASE_URL;
  }
}

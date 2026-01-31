/**
 * Базовый HTTP-клиент для API запросов
 */

const API_BASE_URL = "/api";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  totalCount?: number;
}

export class HttpClient {
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
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

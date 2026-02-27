/**
 * API клиент для получения наименования товара по штрихкоду.
 * Конвенция именования: *ApiClient (см. CONTRIBUTING.md).
 */

import { HttpClient } from "@/lib/shared/api/http-client";

export interface BarcodeLookupResponse {
  productName: string | null;
  error?: string;
}

export class BarcodeLookupApiClient extends HttpClient {
  async lookup(barcode: string): Promise<BarcodeLookupResponse> {
    const result = await this.request<BarcodeLookupResponse>(
      `/barcode-lookup?barcode=${encodeURIComponent(barcode)}`
    );
    return result as unknown as BarcodeLookupResponse;
  }
}

export const barcodeLookupApiClient = new BarcodeLookupApiClient();

/** @deprecated Используйте barcodeLookupApiClient.lookup(barcode). */
export const barcodeLookupApi = (barcode: string) =>
  barcodeLookupApiClient.lookup(barcode);

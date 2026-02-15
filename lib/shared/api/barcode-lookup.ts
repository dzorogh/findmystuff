/**
 * API клиент для получения наименования товара по штрихкоду.
 */

import { HttpClient } from "@/lib/shared/api/http-client";

export interface BarcodeLookupResponse {
  productName: string | null;
  error?: string;
}

class BarcodeLookupClient extends HttpClient {
  async lookup(barcode: string): Promise<BarcodeLookupResponse> {
    const result = await this.request<BarcodeLookupResponse>(
      `/barcode-lookup?barcode=${encodeURIComponent(barcode)}`
    );
    return result as unknown as BarcodeLookupResponse;
  }
}

const barcodeLookupClient = new BarcodeLookupClient();

export const barcodeLookupApi = (barcode: string) =>
  barcodeLookupClient.lookup(barcode);

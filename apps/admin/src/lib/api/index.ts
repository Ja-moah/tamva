import {
  currencyConvertResponseSchema,
  currencyRatesResponseSchema,
  healthResponseSchema,
  type CurrencyConvertResponse,
  type CurrencyRatesResponse,
  type HealthResponse,
} from "../contracts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function getSystemHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health/`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Backend health check failed with status ${response.status}`);
  }

  return healthResponseSchema.parse(await response.json());
}

export async function getCurrencyRates(signal?: AbortSignal): Promise<CurrencyRatesResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/currency/rates/`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch live currency rates with status ${response.status}`);
  }

  return currencyRatesResponseSchema.parse(await response.json());
}

export async function convertCurrency(
  params: { from: string; to: string; amount: number },
  signal?: AbortSignal,
): Promise<CurrencyConvertResponse> {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    amount: params.amount.toString(),
  });

  const response = await fetch(`${apiBaseUrl}/api/v1/currency/convert/?${query.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Currency conversion failed with status ${response.status}`);
  }

  return currencyConvertResponseSchema.parse(await response.json());
}

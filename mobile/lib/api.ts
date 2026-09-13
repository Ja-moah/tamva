import { healthResponseSchema, type HealthResponse } from "@tamva/client-contracts";

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

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

import {
  actorContextEnvelopeSchema,
  capabilitiesResponseSchema,
  healthResponseSchema,
  type ActorContext,
  type CapabilitiesResponse,
  type HealthResponse,
  type LoginRequest,
} from "@tamva/client-contracts";

import { apiRequest } from "./client";

export { ApiError, apiRequest, getActiveInstitution, setActiveInstitution } from "./client";

export function getSystemHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest({ path: "/health/", unversioned: true, schema: healthResponseSchema, signal });
}

export async function login(credentials: LoginRequest): Promise<ActorContext> {
  const envelope = await apiRequest({
    method: "POST",
    path: "/auth/login/",
    body: credentials,
    schema: actorContextEnvelopeSchema,
  });
  return envelope.data;
}

export async function logout(): Promise<void> {
  await apiRequest({ method: "POST", path: "/auth/logout/" });
}

export async function getMe(signal?: AbortSignal): Promise<ActorContext> {
  const envelope = await apiRequest({ path: "/me/", schema: actorContextEnvelopeSchema, signal });
  return envelope.data;
}

export async function getCapabilities(signal?: AbortSignal): Promise<CapabilitiesResponse["data"]> {
  const envelope = await apiRequest({ path: "/capabilities/", schema: capabilitiesResponseSchema, signal });
  return envelope.data;
}

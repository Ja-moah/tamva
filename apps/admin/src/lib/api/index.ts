import {
  actorContextEnvelopeSchema,
  capabilitiesResponseSchema,
  healthResponseSchema,
  versionSchema,
  type ActorContext,
  type CapabilitiesResponse,
  type HealthResponse,
  type LoginRequest,
  type VersionInfo,
} from "@tamva/client-contracts";

import { apiRequest } from "./client";

export {
  ApiError,
  apiBlob,
  apiRequest,
  getActiveInstitution,
  setActiveInstitution,
  setUnauthenticatedHandler,
} from "./client";

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

export async function getVersion(signal?: AbortSignal): Promise<VersionInfo> {
  const envelope = await apiRequest({ path: "/meta/version/", schema: versionSchema, signal });
  return envelope.data;
}

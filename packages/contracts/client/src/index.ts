import { z } from "zod";

// Wire-level conventions shared by every TAMVA client.
export const API_VERSION_PREFIX = "/api/v1";
export const HEADER_INSTITUTION_ID = "X-Institution-ID";
export const HEADER_REQUEST_ID = "X-Request-ID";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  database: z.literal("ok"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    request_id: z.string(),
    details: z.unknown(),
  }),
});

export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;

// DRF PageNumberPagination (page, page_size <= 100).
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    count: z.number().int().nonnegative(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(item),
  });
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// GET /api/v1/capabilities/ — what the backend can honestly serve.
export const capabilityStateSchema = z.enum(["AVAILABLE", "PARTIAL", "NOT_AVAILABLE", "DISABLED"]);
export type CapabilityState = z.infer<typeof capabilityStateSchema>;

export const capabilitiesResponseSchema = z.object({
  data: z.record(z.string(), capabilityStateSchema),
});
export type CapabilitiesResponse = z.infer<typeof capabilitiesResponseSchema>;

// POST /api/v1/auth/login/, POST /api/v1/auth/refresh/, GET /api/v1/me/
export const actorContextSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    actor_type: z.string(),
    status: z.string(),
  }),
  tenant: z
    .object({
      institution_id: z.string(),
      institution_name: z.string(),
    })
    .nullable(),
  memberships: z.array(
    z.object({
      institution_id: z.string(),
      institution_name: z.string(),
    }),
  ),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});
export type ActorContext = z.infer<typeof actorContextSchema>;

export const actorContextEnvelopeSchema = z.object({ data: actorContextSchema });

export const loginRequestSchema = z.object({
  identifier: z.string(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

import { z } from "zod";

import { paginatedSchema } from "./wire";

// Customer-facing consent (GET /api/v1/consents/). A customer only ever sees
// and revokes their own consents.
export const CONSENT_STATUSES = ["GRANTED", "EXPIRED", "REVOKED"] as const;
export const consentStatusSchema = z.enum(CONSENT_STATUSES);
export type ConsentStatus = z.infer<typeof consentStatusSchema>;

export const consentSchema = z.object({
  id: z.string(),
  institution_id: z.string(),
  institution_name: z.string(),
  purpose_code: z.string(),
  purpose_name: z.string(),
  scope_codes: z.array(z.string()),
  status: consentStatusSchema,
  granted_at: z.string(),
  expires_at: z.string(),
  revoked_at: z.string().nullable(),
});
export type Consent = z.infer<typeof consentSchema>;
export const consentPageSchema = paginatedSchema(consentSchema);
export const consentEnvelopeSchema = z.object({ data: consentSchema });

// GET /api/v1/auth/csrf/
export const csrfEnvelopeSchema = z.object({ data: z.object({ csrf_token: z.string() }) });

// ---------------------------------------------------------------- auth
export const tokenPairSchema = z.object({
  token_type: z.literal("Bearer"),
  access_token: z.string(),
  refresh_token: z.string(),
  access_expires_at: z.string(),
  refresh_expires_at: z.string(),
});
export type TokenPair = z.infer<typeof tokenPairSchema>;
export const tokenEnvelopeSchema = z.object({
  data: tokenPairSchema.extend({ actor: z.record(z.string(), z.unknown()).optional() }),
});
export const refreshEnvelopeSchema = z.object({ data: tokenPairSchema });

export const registrationEnvelopeSchema = z.object({
  data: z.object({ id: z.string(), email: z.string() }),
});

// ------------------------------------------------------------ decimals
// DRF serialises decimals as strings; accept both and convert at the edge.
const num = z.union([z.string(), z.number()]);
const numOrNull = num.nullable();

// ---------------------------------------------------------------- home
export const confidenceScaleSchema = z.object({
  min: z.number(),
  max: z.number(),
  higher_is: z.string(),
  informational: z.boolean(),
  note: z.string(),
});

export const activityItemSchema = z.object({
  id: z.string(),
  occurred_at: z.string(),
  posted_at: z.string().nullable(),
  amount: num,
  currency: z.string(),
  direction: z.enum(["CREDIT", "DEBIT"]),
  status: z.string(),
  type: z.string(),
  category: z.string(),
  channel: z.string(),
  counterparty: z.string(),
  account: z.string(),
  institution_id: z.string(),
  institution_name: z.string(),
  connection_id: z.string().nullable(),
});
export type ActivityItem = z.infer<typeof activityItemSchema>;
export const activityPageSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(activityItemSchema),
});

export const customerHomeSchema = z.object({
  data: z.object({
    generated_at: z.string(),
    financial_confidence: z
      .object({
        score: num,
        band: z.string(),
        completeness: num,
        as_of: z.string(),
        version: z.string(),
        institution_name: z.string(),
        scale: confidenceScaleSchema,
      })
      .nullable(),
    profile: z
      .object({
        as_of: z.string(),
        coverage_ratio: num,
        data_confidence: z.string(),
        account_count: z.number(),
      })
      .nullable(),
    connections: z.object({ total: z.number(), active: z.number(), needs_attention: z.number() }),
    activity_30d: z.object({
      transaction_count: z.number(),
      inflow_by_currency: z.record(z.string(), num),
      outflow_by_currency: z.record(z.string(), num),
      latest: z.array(activityItemSchema),
    }),
    notifications: z.object({ unread: z.number() }),
    consents: z.object({ active: z.number(), expiring_within_30_days: z.number() }),
    passport: z.object({ active_shares: z.number() }),
    protection: z.object({ events_30d: z.number(), high_or_critical_30d: z.number() }),
  }),
});
export type CustomerHome = z.infer<typeof customerHomeSchema>["data"];

// ------------------------------------------------------------- profile
export const profileItemSchema = z.object({
  id: z.string(),
  institution_id: z.string(),
  institution_name: z.string(),
  as_of: z.string(),
  period_start: z.string(),
  computed_at: z.string(),
  data_confidence: z.string(),
  account_count: z.number(),
  covered_account_count: z.number(),
  coverage_ratio: num,
  cash_flow: z
    .object({
      total_inflows: num,
      total_outflows: num,
      net_cash_flow: num,
      transaction_count: z.number(),
    })
    .nullable(),
  income: z.object({ estimated_total: num, methodology: z.string() }).nullable(),
  expenses: z.object({ total: num, by_category: z.record(z.string(), z.unknown()) }).nullable(),
  savings: z.object({ net_savings: num, savings_rate: num }).nullable(),
  not_available: z.array(z.string()),
});
export type CustomerProfile = z.infer<typeof profileItemSchema>;
export const profileCurrentSchema = z.object({
  data: z.object({ institutions: z.array(profileItemSchema) }),
});

// ---------------------------------------------------------- confidence
export const confidenceItemSchema = z.object({
  id: z.string(),
  institution_id: z.string(),
  institution_name: z.string(),
  score: num,
  band: z.string(),
  completeness: num,
  as_of: z.string(),
  version: z.string(),
  is_current: z.boolean(),
  components: z
    .array(
      z.object({
        code: z.string(),
        weight: num,
        value: numOrNull,
        available: z.boolean(),
        unavailable_reason: z.string(),
      }),
    )
    .optional(),
});
export type ConfidenceItem = z.infer<typeof confidenceItemSchema>;
export const confidenceCurrentSchema = z.object({
  data: z.object({ scale: confidenceScaleSchema, institutions: z.array(confidenceItemSchema) }),
});
export const confidenceHistoryPageSchema = paginatedSchema(confidenceItemSchema);

// --------------------------------------------------------- connections
export const customerConnectionSchema = z.object({
  id: z.string(),
  institution_id: z.string(),
  institution_name: z.string(),
  provider: z.string(),
  provider_name: z.string(),
  purpose_code: z.string(),
  scope_code: z.string(),
  status: z.string(),
  state: z.string(),
  last_synced_at: z.string().nullable(),
  created_at: z.string(),
});
export type CustomerConnection = z.infer<typeof customerConnectionSchema>;
export const customerConnectionPageSchema = paginatedSchema(customerConnectionSchema);
export const customerConnectionEnvelopeSchema = z.object({ data: customerConnectionSchema });

// ------------------------------------------------------------- consent
export const consentCatalogueSchema = z.object({
  data: z.object({
    institutions: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        purposes: z.array(z.object({ code: z.string(), name: z.string(), description: z.string() })),
      }),
    ),
    scopes: z.array(z.object({ code: z.string(), name: z.string(), description: z.string() })),
    duration_days: z.object({ min: z.number(), default: z.number(), max: z.number() }),
  }),
});
export type ConsentCatalogue = z.infer<typeof consentCatalogueSchema>["data"];

// ------------------------------------------------------------ passport
export const passportSnapshotSchema = z.object({
  id: z.string(),
  schema_version: z.string(),
  sections: z.record(z.string(), z.unknown()),
  is_current: z.boolean(),
  created_at: z.string(),
});
export const passportCurrentSchema = z.object({
  data: z.object({
    institutions: z.array(
      z.object({
        institution_id: z.string(),
        institution_name: z.string(),
        snapshot: passportSnapshotSchema,
      }),
    ),
  }),
});
export const passportGenerateSchema = z.object({ data: passportSnapshotSchema });
export const passportShareSchema = z.object({
  id: z.string(),
  issuer_institution_id: z.string(),
  issuer_institution_name: z.string(),
  recipient_institution_id: z.string(),
  recipient_institution_name: z.string(),
  purpose_code: z.string(),
  allowed_sections: z.array(z.string()),
  status: z.string(),
  expires_at: z.string(),
  revoked_at: z.string().nullable(),
  created_at: z.string(),
});
export type PassportShareItem = z.infer<typeof passportShareSchema>;
export const passportSharePageSchema = paginatedSchema(passportShareSchema);
export const passportShareEnvelopeSchema = z.object({ data: passportShareSchema });
export const passportShareCreatedSchema = z.object({
  data: passportShareSchema.extend({ token: z.string() }),
});
export const PASSPORT_SECTIONS = [
  "FINANCIAL_SUMMARY",
  "INCOME_SUMMARY",
  "CASHFLOW_SUMMARY",
  "SAVINGS_SUMMARY",
  "ACCOUNT_COVERAGE",
  "PROFILE_COMPLETENESS",
] as const;

// ------------------------------------------------------------ security
export const securitySummarySchema = z.object({
  data: z.object({
    events_30d: z.number(),
    by_category_30d: z.record(z.string(), z.number()),
    latest_event: z
      .object({ category: z.string(), severity: z.string(), occurred_at: z.string() })
      .nullable(),
    devices: z.object({ known: z.number(), trusted: z.number(), flagged: z.number() }),
    locations: z.object({ countries_seen: z.number() }),
    active_consents: z.number(),
    active_passport_shares: z.number(),
    unread_notifications: z.number(),
    unsupported: z.record(z.string(), z.string()),
  }),
});
export type SecuritySummary = z.infer<typeof securitySummarySchema>["data"];

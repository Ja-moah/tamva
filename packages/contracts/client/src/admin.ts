import { z } from "zod";

import { paginatedSchema } from "./wire";

// DRF serialises DecimalFields as strings; accept both so a serializer change
// from string to number cannot break the client, and convert at the edge.
export const decimalSchema = z.union([z.string(), z.number()]).nullable();

export const RISK_DECISIONS = ["ALLOW", "CHALLENGE", "HOLD", "BLOCK"] as const;
export const riskDecisionSchema = z.enum(RISK_DECISIONS);
export type RiskDecision = z.infer<typeof riskDecisionSchema>;

// Backend vocabulary is authoritative: OPEN -> TRIAGED -> INVESTIGATING -> ACTIONED -> RESOLVED.
export const CASE_STATUSES = ["OPEN", "TRIAGED", "INVESTIGATING", "ACTIONED", "RESOLVED"] as const;
export const caseStatusSchema = z.enum(CASE_STATUSES);
export type CaseStatus = z.infer<typeof caseStatusSchema>;
export const CASE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const casePrioritySchema = z.enum(CASE_PRIORITIES);
export type CasePriority = z.infer<typeof casePrioritySchema>;

// ---------------------------------------------------------------- risk
export const riskEventSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  score: decimalSchema,
  decision: riskDecisionSchema,
  confidence: decimalSchema,
  reason_codes: z.array(z.string()),
  ruleset_version: z.string().nullable(),
  model_version: z.string().nullable(),
  policy_version: z.string(),
  evaluated_at: z.string(),
});
export type RiskEvent = z.infer<typeof riskEventSchema>;
export const riskEventDetailSchema = riskEventSchema.extend({
  reasons: z.array(z.object({ code: z.string(), source: z.string(), severity: z.string() })),
});
export type RiskEventDetail = z.infer<typeof riskEventDetailSchema>;
export const riskEventPageSchema = paginatedSchema(riskEventSchema);

// --------------------------------------------------------------- cases
export const caseSchema = z.object({
  id: z.string(),
  reference: z.string(),
  customer_id: z.string(),
  case_type: z.string(),
  priority: casePrioritySchema,
  status: caseStatusSchema,
  source: z.string(),
  current_assignee_id: z.string().nullable(),
  opened_at: z.string(),
  closed_at: z.string().nullable(),
});
export type CaseSummary = z.infer<typeof caseSchema>;
export const caseDetailSchema = caseSchema.extend({
  status_events: z.array(
    z.object({
      previous_status: z.string(),
      new_status: z.string(),
      actor_id: z.string().nullable(),
      note: z.string(),
      occurred_at: z.string(),
    }),
  ),
  assignments: z.array(
    z.object({
      assignee_id: z.string().nullable(),
      assigned_by_id: z.string().nullable(),
      note: z.string(),
      assigned_at: z.string(),
    }),
  ),
  notes: z.array(
    z.object({ id: z.string(), author_id: z.string().nullable(), body: z.string(), created_at: z.string() }),
  ),
  actions: z.array(
    z.object({
      id: z.string(),
      action_type: z.string(),
      actor_id: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
  resolution: z
    .object({
      outcome: z.string(),
      reason: z.string(),
      resolved_by_id: z.string().nullable(),
      resolved_at: z.string(),
    })
    .nullable(),
});
export type CaseDetail = z.infer<typeof caseDetailSchema>;
export const casePageSchema = paginatedSchema(caseSchema);
export const caseDetailEnvelopeSchema = z.object({ data: caseDetailSchema });

export const bulkResultSchema = z.object({
  data: z.object({
    summary: z.object({ requested: z.number(), succeeded: z.number(), failed: z.number() }),
    results: z.array(
      z.object({ id: z.string(), outcome: z.string(), code: z.string(), message: z.string() }),
    ),
  }),
});
export type BulkResult = z.infer<typeof bulkResultSchema>["data"];

// ------------------------------------------------------- notifications
export const notificationSchema = z.object({
  id: z.string(),
  category: z.string(),
  channel: z.string(),
  subject: z.string(),
  body: z.string(),
  status: z.string(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});
export type NotificationItem = z.infer<typeof notificationSchema>;
export const notificationPageSchema = paginatedSchema(notificationSchema);
export const notificationEnvelopeSchema = z.object({ data: notificationSchema });
export const notificationPreferenceSchema = z.object({
  id: z.string(),
  category: z.string(),
  channel: z.string(),
  enabled: z.boolean(),
});
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
export const notificationPreferencePageSchema = paginatedSchema(notificationPreferenceSchema);
export const notificationPreferenceEnvelopeSchema = z.object({ data: notificationPreferenceSchema });
export const bulkReadResultSchema = z.object({
  data: z.object({
    requested: z.number(),
    marked_read: z.number(),
    already_read: z.number(),
    not_found: z.number(),
  }),
});
export type BulkReadResult = z.infer<typeof bulkReadResultSchema>["data"];

// ----------------------------------------------------------- customers
export const customerSummarySchema = z.object({
  id: z.string(),
  display_name: z.string(),
  email_masked: z.string(),
  status: z.string(),
  last_login: z.string().nullable(),
  financial_confidence: z.object({
    score: decimalSchema,
    band: z.string().nullable(),
    completeness: decimalSchema,
    evaluated_at: z.string().nullable(),
  }),
  latest_risk: z.object({
    decision: z.string().nullable(),
    score: decimalSchema,
    evaluated_at: z.string().nullable(),
  }),
  connection_state: z.string(),
  active_connection_count: z.number(),
  consent_state: z.string(),
  active_consent_count: z.number(),
  case_count: z.number(),
  open_case_count: z.number(),
  active_passport_shares: z.number().nullable(),
});
export type CustomerSummary = z.infer<typeof customerSummarySchema>;
export const customerPageSchema = paginatedSchema(customerSummarySchema);
export const customerDetailSchema = z.object({
  data: customerSummarySchema.extend({
    recent_cases: z.array(
      z.object({
        id: z.string(),
        reference: z.string(),
        case_type: z.string(),
        priority: z.string(),
        status: z.string(),
        opened_at: z.string(),
      }),
    ),
    recent_risk_events: z.array(
      z.object({ id: z.string(), decision: z.string(), score: decimalSchema, evaluated_at: z.string() }),
    ),
  }),
});

// ------------------------------------------------------------ security
export const securityEventSchema = z.object({
  id: z.string(),
  customer_id: z.string().nullable(),
  category: z.string(),
  severity: z.string(),
  source: z.string(),
  occurred_at: z.string(),
  provenance_type: z.string(),
  provenance_id: z.string().nullable(),
});
export const securityEventPageSchema = paginatedSchema(securityEventSchema);
export const customerDeviceSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  device_ref: z.string(),
  source: z.string(),
  status: z.string(),
  first_seen_at: z.string(),
  last_seen_at: z.string(),
  observation_count: z.number(),
});
export const customerDevicePageSchema = paginatedSchema(customerDeviceSchema);
export const locationObservationSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  source: z.string(),
  country_code: z.string(),
  region: z.string(),
  city: z.string(),
  confidence: decimalSchema,
  observed_at: z.string(),
});
export const locationObservationPageSchema = paginatedSchema(locationObservationSchema);
export const auditEventSchema = z.object({
  id: z.string(),
  actor_id: z.string().nullable(),
  action: z.string(),
  outcome: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.string(),
});
export const auditEventPageSchema = paginatedSchema(auditEventSchema);

// ---------------------------------------------------------------- team
export const memberSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  email: z.string(),
  name: z.string(),
  actor_type: z.string(),
  status: z.string(),
  roles: z.array(z.string()),
  last_login: z.string().nullable(),
  created_at: z.string(),
});
export type Member = z.infer<typeof memberSchema>;
export const memberPageSchema = paginatedSchema(memberSchema);
export const memberEnvelopeSchema = z.object({ data: memberSchema });
export const roleSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
});
export const rolesEnvelopeSchema = z.object({ data: z.array(roleSchema) });
export const permissionSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
});
export const permissionsEnvelopeSchema = z.object({ data: z.array(permissionSchema) });

// -------------------------------------------------------- integrations
export const credentialSchema = z.object({
  id: z.string(),
  name: z.string(),
  client_id: z.string(),
  status: z.string(),
  scopes: z.array(z.string()),
  expires_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  last_used_at: z.string().nullable(),
  created_at: z.string(),
});
export type ApiCredentialMeta = z.infer<typeof credentialSchema>;
export const webhookSchema = z.object({
  id: z.string(),
  url: z.string(),
  event_types: z.array(z.string()),
  status: z.string(),
  verified_at: z.string().nullable(),
  created_at: z.string(),
});
export const environmentSchema = z.object({
  id: z.string(),
  kind: z.string(),
  status: z.string(),
  credentials: z.array(credentialSchema),
  webhooks: z.array(webhookSchema),
});
export const applicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  status: z.string(),
  environments: z.array(environmentSchema),
  created_at: z.string(),
});
export type PartnerApplication = z.infer<typeof applicationSchema>;
export const applicationPageSchema = paginatedSchema(applicationSchema);
export const applicationEnvelopeSchema = z.object({ data: applicationSchema });
export const environmentEnvelopeSchema = z.object({ data: environmentSchema });
export const webhookEnvelopeSchema = z.object({ data: webhookSchema });
export const credentialEnvelopeSchema = z.object({ data: credentialSchema });
export const issuedCredentialSchema = z.object({
  data: z.object({ credential: credentialSchema, secret: z.string(), secret_notice: z.string() }),
});
export const scopesEnvelopeSchema = z.object({
  data: z.array(z.object({ code: z.string(), name: z.string(), description: z.string() })),
});
export const connectionSchema = z.object({
  id: z.string(),
  provider: z.string(),
  provider_name: z.string(),
  customer_id: z.string(),
  purpose_code: z.string(),
  scope_code: z.string(),
  status: z.string(),
  last_synced_at: z.string().nullable(),
  created_at: z.string(),
});
export const connectionPageSchema = paginatedSchema(connectionSchema);

// ------------------------------------------------------------- network
export const graphNodeSchema = z.object({
  id: z.string(),
  node_type: z.string(),
  label: z.string(),
  reference_id: z.string().nullable(),
  created_at: z.string(),
});
export const graphNodePageSchema = paginatedSchema(graphNodeSchema);
export const graphEdgeSchema = z.object({
  id: z.string(),
  edge_type: z.string(),
  source_id: z.string(),
  target_id: z.string(),
  occurrence_count: z.number(),
  first_occurred_at: z.string(),
  last_occurred_at: z.string(),
});
export const graphEdgePageSchema = paginatedSchema(graphEdgeSchema);
export const networkSummarySchema = z.object({
  data: z.object({
    nodes_by_type: z.record(z.string(), z.number()),
    edges_by_type: z.record(z.string(), z.number()),
    customers_with_computed_graph: z.number(),
    unsupported: z.record(z.string(), z.string()),
  }),
});

// ----------------------------------------------- overview and analytics
const countMap = z.record(z.string(), z.number());
const windowSchema = z.object({ from: z.string(), to: z.string(), days: z.number() });
const riskSummarySchema = z.object({
  evaluations: z.number(),
  decisions: countMap,
  average_score: decimalSchema,
  score_scale: z.string(),
});
const caseSummarySchema = z.object({
  open: z.number(),
  by_status: countMap,
  by_priority_open: countMap,
  unresolved_high_severity: z.number(),
  unassigned_open: z.number(),
});
const confidenceSummarySchema = z.object({
  customers_scored: z.number(),
  average_score: decimalSchema,
  bands: countMap,
  score_scale: z.string(),
});
const connectorSummarySchema = z.object({
  connections_by_status: countMap,
  sync_runs_by_status: countMap,
});
const consentSummarySchema = z.object({
  by_status: countMap,
  active: z.number(),
  expiring_within_30_days: z.number(),
});
const passportSummarySchema = z.object({
  active_shares: z.number(),
  shares_created: z.number(),
  accesses_by_outcome: countMap,
});
const credentialSummarySchema = z.object({ active: z.number(), used_in_window: z.number() });

export const overviewSchema = z.object({
  data: z.object({
    generated_at: z.string(),
    window: windowSchema,
    risk: riskSummarySchema,
    cases: caseSummarySchema,
    financial_confidence: confidenceSummarySchema,
    connectors: connectorSummarySchema,
    consents: consentSummarySchema,
    notifications: z.object({ total: z.number(), unread: z.number(), by_status: countMap }),
    passport: passportSummarySchema,
    ledger: z.object({
      postings: z.number(),
      debit_volume_by_currency: z.record(z.string(), decimalSchema),
    }),
    credentials: credentialSummarySchema,
  }),
});
export type Overview = z.infer<typeof overviewSchema>["data"];

const dayCount = z.object({ day: z.string(), count: z.number() });
export const analyticsSchema = z.object({
  data: z.object({
    generated_at: z.string(),
    window: windowSchema,
    risk: riskSummarySchema.extend({
      daily: z.array(
        z.object({
          day: z.string(),
          evaluations: z.number(),
          blocked: z.number(),
          held: z.number(),
          challenged: z.number(),
        }),
      ),
      score_distribution: z.array(z.object({ min: z.number(), max: z.number(), count: z.number() })),
      top_reason_codes: z.array(z.object({ code: z.string(), count: z.number() })),
    }),
    cases: caseSummarySchema.extend({
      opened_daily: z.array(dayCount),
      resolved_daily: z.array(dayCount),
    }),
    profiles: z.object({
      current_snapshots: z.number(),
      by_confidence_level: countMap,
      average_coverage_ratio: decimalSchema,
    }),
    financial_confidence: confidenceSummarySchema,
    connectors: connectorSummarySchema,
    consents: consentSummarySchema,
    passport: passportSummarySchema,
    credentials: credentialSummarySchema,
    unavailable: z.record(z.string(), z.string()),
  }),
});
export type Analytics = z.infer<typeof analyticsSchema>["data"];

// ------------------------------------------------ HCI: views and exports
export const RESOURCE_TYPES = [
  "RISK_EVENTS",
  "CASES",
  "CUSTOMERS",
  "NOTIFICATIONS",
  "SECURITY_EVENTS",
  "AUDIT_EVENTS",
] as const;
export const resourceTypeSchema = z.enum(RESOURCE_TYPES);
export type ResourceType = z.infer<typeof resourceTypeSchema>;

export const resourceCatalogEntrySchema = z.object({
  resource_type: resourceTypeSchema,
  filters: z.array(
    z.object({
      param: z.string(),
      kind: z.string(),
      choices: z.array(z.string()),
      description: z.string(),
    }),
  ),
  search: z.array(z.string()),
  ordering: z.array(z.string()),
  columns: z.array(z.object({ key: z.string(), label: z.string() })),
});
export type ResourceCatalogEntry = z.infer<typeof resourceCatalogEntrySchema>;
export const resourceCatalogSchema = z.object({ data: z.array(resourceCatalogEntrySchema) });

export const savedViewSchema = z.object({
  id: z.string(),
  resource_type: resourceTypeSchema,
  name: z.string(),
  filters: z.record(z.string(), z.string()),
  ordering: z.string(),
  visible_columns: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SavedView = z.infer<typeof savedViewSchema>;
export const savedViewPageSchema = paginatedSchema(savedViewSchema);

export const exportJobSchema = z.object({
  id: z.string(),
  resource_type: resourceTypeSchema,
  format: z.enum(["CSV", "XLSX"]),
  filters: z.record(z.string(), z.string()),
  ordering: z.string(),
  columns: z.array(z.string()),
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "EXPIRED"]),
  row_count: z.number(),
  error_code: z.string(),
  artifact_size: z.number(),
  created_at: z.string(),
  completed_at: z.string().nullable(),
  expires_at: z.string(),
});
export type ExportJob = z.infer<typeof exportJobSchema>;
export const exportJobEnvelopeSchema = z.object({ data: exportJobSchema });
export const downloadLinkSchema = z.object({
  data: z.object({ path: z.string(), token: z.string(), expires_in_seconds: z.number() }),
});

// -------------------------------------------------- locale and version
export const localeSettingsSchema = z.object({
  data: z.object({
    country_code: z.string(),
    default_currency: z.string(),
    timezone: z.string(),
    locale: z.string(),
    is_default: z.boolean(),
  }),
});
export type LocaleSettings = z.infer<typeof localeSettingsSchema>["data"];
export const versionSchema = z.object({
  data: z.object({
    api_version: z.string(),
    application_version: z.string(),
    environment: z.string(),
    release: z.string(),
  }),
});
export type VersionInfo = z.infer<typeof versionSchema>["data"];

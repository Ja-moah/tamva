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

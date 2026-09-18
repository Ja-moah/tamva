# Partner

Owns institutions, memberships, partner applications, environments, scoped API
credentials, and webhook endpoint metadata. All tenant-scoped resources are
authorized server-side against a trusted institution context; UI filtering is
never a security boundary.

Each partner application owns an Identity service account and has distinct
Sandbox, Staging, and Production environments. Credentials and webhook
endpoints belong to exactly one environment and cannot be reused across
environments. Production webhooks require HTTPS.

API credential secrets are returned once when issued or rotated. PostgreSQL
stores only a SHA-256 digest of the high-entropy generated secret, so the secret
cannot be recovered later. Rotation creates a new credential and revokes the
previous credential atomically. Material changes are recorded in the shared
audit trail without secret values or secret digests.

This module does not own connector definitions, institution connections, sync
runs, ingestion, retries, quarantine, raw payloads, or normalisation.

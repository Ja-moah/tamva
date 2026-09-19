# Deployment runbook

Superseded by [`docs/operations/`](../operations/):

| Need | Read |
| --- | --- |
| Architecture, first deployment, health, upgrades | [DEPLOYMENT.md](../operations/DEPLOYMENT.md) |
| Every environment variable | [ENVIRONMENT_VARIABLES.md](../operations/ENVIRONMENT_VARIABLES.md) |
| Backups and the restore drill | [BACKUP_AND_RESTORE.md](../operations/BACKUP_AND_RESTORE.md) |
| Releasing and rolling back | [RELEASE_CHECKLIST.md](../operations/RELEASE_CHECKLIST.md) |
| Security posture | [SECURITY_CHECKLIST.md](../operations/SECURITY_CHECKLIST.md) |
| Known limitations and decisions | [KNOWN_LIMITATIONS.md](../operations/KNOWN_LIMITATIONS.md) |

Quick reference: `make deploy-config`, `make deploy-staging`, `make deploy-production`. Development
uses `make up` and `docker-compose.yml`.

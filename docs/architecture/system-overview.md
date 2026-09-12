# System overview

TAMVA is a modular monolith. The boxes below are logical ownership boundaries inside one Django deployment, not independent microservices.

```text
Customer / Institution
        ↓
Identity
        ↓
Authorization
        ↓
Consent
        ↓
Connectors
        ↓
Normalisation
        ↓
Canonical Transactions
        ↓
Ledger
        ↓
Profile / Features
        ↓
Rules / Models / Network
        ↓
Risk
        ↓
Cases
        ↓
Institution + Customer surfaces
        ↓
Audit
```

PostgreSQL owns transactional state and Redis supports short-lived caching and Celery. Modules expose typed services/contracts, own their migrations, and avoid direct access to another module's tables. Cross-domain workflows use application services and, where asynchronous delivery is justified, the transactional outbox.


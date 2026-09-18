# System overview

TAMVA is a modular monolith. The boxes below are logical ownership boundaries inside one Django deployment, not independent microservices.

```text
                          PostgreSQL
                        SOURCE OF TRUTH
                                ^
                                |
                        Django / DRF
                  BUSINESS LOGIC + APIs
                          ^         ^
                          |         |
            apps/admin     mobile
                 Admin Web       Customer App
                                     Android
                                     iOS
                                     Web
```

The backend is the authoritative application layer. Admin web and the customer
app are clients only: they request data, display responses, validate forms, and
manage navigation and presentation state. They do not own business, tenancy,
authorization, consent, risk, ledger, profile, passport, or case decisions.

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
Rules / Models
        ↓
Risk
        ↓
Cases
        ↓
Notifications
        ↓
Trust Graph / Financial Passport
        ↓
Institution + Customer surfaces
        ↓
Audit
```

PostgreSQL owns transactional state and Redis supports short-lived caching and Celery. Modules expose typed services/contracts, own their migrations, and avoid direct access to another module's tables. Cross-domain workflows use application services and, where asynchronous delivery is justified, the transactional outbox.


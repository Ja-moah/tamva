# API error contract

Errors use a stable envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "request_id": "c7af...",
    "details": []
  }
}
```

Clients may branch on `code`, never human-readable `message`. `request_id` supports operational correlation. Details must not expose secrets or internal traces. Public APIs are versioned beneath `/api/v1/`.


from django.contrib import admin

from .models import CanonicalTransaction


@admin.register(CanonicalTransaction)
class CanonicalTransactionAdmin(admin.ModelAdmin):
    list_display = ("source_event_id", "institution", "amount", "currency", "status", "occurred_at")
    list_filter = ("status", "direction", "currency")
    search_fields = ("source_event_id", "source_account_reference", "counterparty_name")
    readonly_fields = ("source_provenance", "raw_event", "normalisation_version")

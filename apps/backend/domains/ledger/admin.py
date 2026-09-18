from django.contrib import admin

from .models import Account, LedgerEntry, LedgerPosting, ReconciliationItem, ReconciliationRun


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("source_account_reference", "institution", "customer", "currency", "status")
    list_filter = ("status", "currency")


@admin.register(LedgerPosting)
class LedgerPostingAdmin(admin.ModelAdmin):
    list_display = ("transaction", "institution", "status", "posted_at")
    list_filter = ("status",)
    readonly_fields = ("transaction", "posted_at")


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("account", "amount", "currency", "direction", "entry_type", "effective_at")
    list_filter = ("direction", "entry_type", "currency")
    readonly_fields = ("posting", "account", "amount", "currency", "direction", "entry_type")


@admin.register(ReconciliationRun)
class ReconciliationRunAdmin(admin.ModelAdmin):
    list_display = ("institution", "connection", "status", "matched_count", "mismatch_count")
    list_filter = ("status",)


@admin.register(ReconciliationItem)
class ReconciliationItemAdmin(admin.ModelAdmin):
    list_display = ("source_event_id", "run", "status", "expected_amount", "ledger_amount")
    list_filter = ("status",)

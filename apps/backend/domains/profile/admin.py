from django.contrib import admin

from .models import (
    AccountSummary,
    CashFlowSummary,
    ExpenseSummary,
    FinancialProfile,
    FinancialProfileSnapshot,
    IncomeSummary,
    ProfileComputationRun,
    SavingsSummary,
)


@admin.register(FinancialProfile)
class FinancialProfileAdmin(admin.ModelAdmin):
    list_display = ("customer", "institution", "current_snapshot", "updated_at")


@admin.register(FinancialProfileSnapshot)
class FinancialProfileSnapshotAdmin(admin.ModelAdmin):
    list_display = ("profile", "period_start", "period_end", "confidence", "is_current")
    list_filter = ("confidence", "is_current", "computation_version")
    readonly_fields = ("provenance", "source_fingerprint")


@admin.register(ProfileComputationRun)
class ProfileComputationRunAdmin(admin.ModelAdmin):
    list_display = ("profile", "status", "period_start", "period_end", "created_at")
    list_filter = ("status",)


admin.site.register(AccountSummary)
admin.site.register(CashFlowSummary)
admin.site.register(IncomeSummary)
admin.site.register(ExpenseSummary)
admin.site.register(SavingsSummary)

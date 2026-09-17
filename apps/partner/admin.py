from django.contrib import admin

from apps.partner.models import (
    ApiCredential,
    CredentialScope,
    Institution,
    InstitutionMembership,
    PartnerApplication,
    PartnerEnvironment,
    WebhookEndpoint,
)

admin.site.register(Institution)
admin.site.register(InstitutionMembership)
admin.site.register(PartnerApplication)
admin.site.register(PartnerEnvironment)
admin.site.register(CredentialScope)
admin.site.register(ApiCredential)
admin.site.register(WebhookEndpoint)

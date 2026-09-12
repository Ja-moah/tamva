from django.contrib import admin

from apps.partner.models import Institution, InstitutionMembership

admin.site.register(Institution)
admin.site.register(InstitutionMembership)

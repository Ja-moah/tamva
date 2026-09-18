from django.contrib import admin

from domains.consent.models import Consent, ConsentEvent, ConsentPurpose, ConsentScope

admin.site.register(ConsentPurpose)
admin.site.register(ConsentScope)
admin.site.register(Consent)
admin.site.register(ConsentEvent)

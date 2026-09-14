from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.identity.models import Permission, Role, ServiceAccount, User

admin.site.register(User, UserAdmin)
admin.site.register(ServiceAccount)
admin.site.register(Permission)
admin.site.register(Role)

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, RegisterUser, Role, Specialism, Adviser


class RegisterUserInline(admin.StackedInline):
    model = RegisterUser
    can_delete = False


class UserAdmin(BaseUserAdmin):
    inlines = [RegisterUserInline]


admin.site.register(User, UserAdmin)
admin.site.register(Role)
admin.site.register(Specialism)
admin.site.register(Adviser)

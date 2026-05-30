from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            adviser = request.user.register_profile.adviser_profile
            return adviser.role.name == 'Administrador'
        except:
            return False


class IsSpiritualFather(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            adviser = request.user.register_profile.adviser_profile
            return adviser.role.name == 'Padre Espiritual'
        except:
            return False


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            adviser = request.user.register_profile.adviser_profile
            return adviser.role.name == 'Maestro'
        except:
            return False


class IsAdminOrRead(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        try:
            adviser = request.user.register_profile.adviser_profile
            return adviser.role.name == 'Administrador'
        except:
            return False

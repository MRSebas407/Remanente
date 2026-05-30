from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserViewSet, AdviserViewSet, RoleViewSet, SpecialismViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet)
router.register(r'advisers', AdviserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'specialisms', SpecialismViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

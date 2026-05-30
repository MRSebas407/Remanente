from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from .router import RoleBasedRouter

from accounts.views import AuthViewSet, UserViewSet, AdviserViewSet, RoleViewSet, SpecialismViewSet, ProfileViewSet
from core.views import CountryViewSet, CityViewSet, NeighborhoodViewSet, ChurchServiceViewSet
from persons.views import PersonViewSet
from calls.views import CallViewSet, CallDetailViewSet
from baptisms.views import (
    AttendantViewSet, CalendarViewSet, ModeViewSet,
    ClassViewSet, BaptismalRegisterViewSet
)
from dashboard.views import DashboardViewSet
from notifications.views import openwa_webhook, qr_view

router = RoleBasedRouter()

router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet)
router.register(r'advisers', AdviserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'specialisms', SpecialismViewSet)
router.register(r'profile', ProfileViewSet, basename='profile')

router.register(r'countries', CountryViewSet)
router.register(r'cities', CityViewSet)
router.register(r'neighborhoods', NeighborhoodViewSet)
router.register(r'services', ChurchServiceViewSet)

router.register(r'persons', PersonViewSet)
router.register(r'calls', CallViewSet)
router.register(r'call-details', CallDetailViewSet)

router.register(r'attendants', AttendantViewSet)
router.register(r'calendars', CalendarViewSet)
router.register(r'modes', ModeViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'baptisms', BaptismalRegisterViewSet)

router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/', include(router.urls)),
    path('api/openwa/webhook/', openwa_webhook),
    path('openwa/qr/', qr_view),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

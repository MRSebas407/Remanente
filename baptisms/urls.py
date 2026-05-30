from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttendantViewSet, CalendarViewSet, ModeViewSet,
    ClassViewSet, BaptismalRegisterViewSet
)

router = DefaultRouter()
router.register(r'attendants', AttendantViewSet)
router.register(r'calendars', CalendarViewSet)
router.register(r'modes', ModeViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'baptisms', BaptismalRegisterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

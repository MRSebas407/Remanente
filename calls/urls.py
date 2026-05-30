from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallViewSet, CallDetailViewSet

router = DefaultRouter()
router.register(r'calls', CallViewSet)
router.register(r'call-details', CallDetailViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

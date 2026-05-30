from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CountryViewSet, CityViewSet, NeighborhoodViewSet, ChurchServiceViewSet

router = DefaultRouter()
router.register(r'countries', CountryViewSet)
router.register(r'cities', CityViewSet)
router.register(r'neighborhoods', NeighborhoodViewSet)
router.register(r'services', ChurchServiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

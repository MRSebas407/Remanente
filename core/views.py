from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Country, City, Neighborhood, ChurchService
from .serializers import (
    CountrySerializer, CitySerializer,
    NeighborhoodSerializer, ChurchServiceSerializer
)


class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        country_id = self.request.query_params.get('country')
        if country_id:
            qs = qs.filter(country_id=country_id)
        return qs


class NeighborhoodViewSet(viewsets.ModelViewSet):
    queryset = Neighborhood.objects.all()
    serializer_class = NeighborhoodSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        city_id = self.request.query_params.get('city')
        if city_id:
            qs = qs.filter(city_id=city_id)
        return qs


class ChurchServiceViewSet(viewsets.ModelViewSet):
    queryset = ChurchService.objects.all()
    serializer_class = ChurchServiceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

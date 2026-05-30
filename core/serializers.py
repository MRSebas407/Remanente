from rest_framework import serializers
from .models import Country, City, Neighborhood, ChurchService


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = '__all__'


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = '__all__'


class NeighborhoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Neighborhood
        fields = '__all__'


class ChurchServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChurchService
        fields = '__all__'

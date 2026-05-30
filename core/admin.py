from django.contrib import admin
from .models import Country, City, Neighborhood, ChurchService

admin.site.register(Country)
admin.site.register(City)
admin.site.register(Neighborhood)
admin.site.register(ChurchService)

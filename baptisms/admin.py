from django.contrib import admin
from .models import Attendant, Calendar, Mode, Class, BaptismalRegister

admin.site.register(Attendant)
admin.site.register(Calendar)
admin.site.register(Mode)
admin.site.register(Class)
admin.site.register(BaptismalRegister)

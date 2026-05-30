from django.contrib import admin
from .models import Notification


class NotificationAdmin(admin.ModelAdmin):
    list_display = ['call_detail', 'notification_type', 'sent_at', 'status']
    list_filter = ['notification_type', 'status', 'sent_at']
    search_fields = ['call_detail__call__person__names', 'call_detail__call__person__lastname']
    readonly_fields = ['sent_at']


admin.site.register(Notification, NotificationAdmin)

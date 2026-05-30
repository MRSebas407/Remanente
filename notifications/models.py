from django.db import models
from calls.models import CallDetail


class Notification(models.Model):
    TYPE_CHOICES = [
        ('aviso_1', 'Primer aviso (50%)'),
        ('aviso_2', 'Segundo aviso (25%)'),
        ('aviso_3', 'Tercer aviso (12.5%)'),
    ]

    STATUS_CHOICES = [
        ('sent', 'Enviado'),
        ('failed', 'Fallido'),
    ]

    call_detail = models.ForeignKey(CallDetail, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=8, choices=TYPE_CHOICES)
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'Notification'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        unique_together = ['call_detail', 'notification_type']

    def __str__(self):
        return f'{self.call_detail} - {self.get_notification_type_display()}'

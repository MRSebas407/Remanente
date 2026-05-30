from django.db import models
from accounts.models import Adviser
from persons.models import Person


class Call(models.Model):
    CALL_NUMBER_CHOICES = [(1, 'Primera'), (2, 'Segunda'), (3, 'Tercera')]

    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='calls')
    call_number = models.IntegerField(choices=CALL_NUMBER_CHOICES)
    created_in = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Call'
        verbose_name = 'Llamada'
        verbose_name_plural = 'Llamadas'
        unique_together = ['person', 'call_number']

    def __str__(self):
        return f'{self.person} - Llamada #{self.call_number}'


class CallDetail(models.Model):
    STATE_CHOICES = [
        ('effective', 'Efectivo'),
        ('not_effective', 'No Efectivo'),
    ]

    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name='details')
    made_by = models.ForeignKey(Adviser, on_delete=models.CASCADE, related_name='call_details')
    scheduled_date = models.DateTimeField()
    date_made = models.DateTimeField(null=True, blank=True)
    made = models.BooleanField(default=False)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, blank=True, null=True)
    annotation = models.TextField(blank=True)
    signature = models.ImageField(upload_to='call_signatures/', blank=True, null=True)

    class Meta:
        db_table = 'call_details'
        verbose_name = 'Detalle de Llamada'
        verbose_name_plural = 'Detalles de Llamada'

    def __str__(self):
        return f'Detalle {self.call}'

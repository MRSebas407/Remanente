from django.db import models
from accounts.models import Adviser
from core.models import Country, City, Neighborhood, ChurchService


SPECIALISM_CHOICES = [
    ('joven', 'Joven'),
    ('normal', 'Normal'),
    ('other_church', 'Otra Iglesia'),
    ('distance', 'Distancia'),
]

SPECIALISM_MAP = {
    'joven': 'Joven',
    'normal': 'Normal',
    'other_church': 'Otra Iglesia',
    'distance': 'Distancia',
}


class Person(models.Model):
    ASSIGNMENT_STATE_CHOICES = [
        ('pending', 'Pendiente'),
        ('assigned', 'Asignado'),
        ('completed', 'Completado'),
        ('deactivated', 'Desactivado'),
    ]

    MEMBER_STATE_CHOICES = [
        ('effective', 'Efectivo'),
        ('not_effective', 'No Efectivo'),
    ]

    names = models.CharField(max_length=100)
    lastname = models.CharField(max_length=100)
    document = models.CharField(max_length=13, unique=True)
    phone = models.CharField(max_length=10)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    neighborhood = models.ForeignKey(Neighborhood, on_delete=models.CASCADE)
    address = models.TextField(blank=True)
    church_service = models.ForeignKey(ChurchService, on_delete=models.CASCADE)
    assignment_state = models.CharField(max_length=20, choices=ASSIGNMENT_STATE_CHOICES, default='pending')
    member_state = models.CharField(max_length=20, choices=MEMBER_STATE_CHOICES, default='not_effective')
    specialism = models.CharField(max_length=20, choices=SPECIALISM_CHOICES, default='normal')
    comes_from_church = models.CharField(max_length=100, blank=True, null=True)
    comes_from_details = models.TextField(blank=True, null=True)
    registered_by = models.ForeignKey(Adviser, on_delete=models.CASCADE, related_name='registered_persons')
    spiritual_father = models.ForeignKey(Adviser, on_delete=models.SET_NULL, null=True, blank=True, related_name='spiritual_children')
    gender = models.CharField(max_length=10, choices=[('M', 'Masculino'), ('F', 'Femenino')], null=True, blank=True)
    signature = models.ImageField(upload_to='person_signatures/', blank=True, null=True)
    photo = models.ImageField(upload_to='person_photos/', blank=True, null=True)
    register_date = models.DateTimeField(auto_now_add=True)
    enrollment_fund_1 = models.BooleanField(default=False)
    baptized = models.BooleanField(default=False)
    data_consent = models.BooleanField(default=False, verbose_name='Consentimiento de datos')
    is_active = models.BooleanField(default=True, verbose_name='Activo')

    class Meta:
        db_table = 'Person'
        verbose_name = 'Persona'
        verbose_name_plural = 'Personas'

    def __str__(self):
        return f'{self.names} {self.lastname}'

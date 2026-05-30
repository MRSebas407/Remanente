from django.db import models
from accounts.models import Adviser
from persons.models import Person


class Attendant(models.Model):
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=10)
    person = models.ForeignKey('persons.Person', on_delete=models.CASCADE, null=True, blank=True, related_name='attendants')

    class Meta:
        db_table = 'Attendant'
        verbose_name = 'Acudiente'
        verbose_name_plural = 'Acudientes'

    def __str__(self):
        return self.full_name


class Calendar(models.Model):
    day = models.CharField(max_length=20)
    hour = models.TimeField()
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'Calendar'
        verbose_name = 'Calendario'
        verbose_name_plural = 'Calendarios'

    def __str__(self):
        return f'{self.day} {self.hour}'


class Mode(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'Mode'
        verbose_name = 'Modalidad'
        verbose_name_plural = 'Modalidades'

    def __str__(self):
        return self.name


class Class(models.Model):
    calendar = models.ForeignKey(Calendar, on_delete=models.CASCADE, related_name='classes')
    professor = models.ForeignKey(Adviser, on_delete=models.CASCADE, related_name='classes')
    mode = models.ForeignKey(Mode, on_delete=models.CASCADE, related_name='classes')

    class Meta:
        db_table = 'Class'
        verbose_name = 'Clase'
        verbose_name_plural = 'Clases'

    def __str__(self):
        return f'Clase {self.calendar} - {self.mode}'


class BaptismalRegister(models.Model):
    BAPTISM_DECISION_CHOICES = [
        ('yes', 'Sí'),
        ('no', 'No'),
        ('undecided', 'Indeciso'),
    ]
    SHIRT_SIZE_CHOICES = [
        ('XS', 'XS'), ('S', 'S'), ('M', 'M'),
        ('L', 'L'), ('XL', 'XL'), ('XXL', 'XXL'),
    ]

    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='baptismal_registers')
    teacher = models.ForeignKey(Adviser, on_delete=models.CASCADE, related_name='baptismal_registers')
    age = models.IntegerField(null=True, blank=True)
    attendant = models.ForeignKey(Attendant, on_delete=models.CASCADE, null=True, blank=True)
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, null=True, blank=True, related_name='baptismal_registers')
    baptism_decision = models.CharField(max_length=20, choices=BAPTISM_DECISION_CHOICES, default='undecided')
    photo = models.ImageField(upload_to='baptism_photos/', blank=True, null=True)
    shirt_size = models.CharField(max_length=5, choices=SHIRT_SIZE_CHOICES, blank=True)
    time_in_church = models.CharField(max_length=100, blank=True)
    baptized = models.BooleanField(default=False)
    details = models.TextField(blank=True)
    registration_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'baptismal register'
        verbose_name = 'Registro Bautismal'
        verbose_name_plural = 'Registros Bautismales'

    def __str__(self):
        return f'Bautizo - {self.person}'

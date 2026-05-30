from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    must_change_password = models.BooleanField(default=True)

    class Meta:
        db_table = 'AuthUser'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'


class Role(models.Model):
    ADMIN = 'admin'
    SPIRITUAL_FATHER = 'padre_espiritual'
    TEACHER = 'maestro'

    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'Role'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name


class Specialism(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'specialism'
        verbose_name = 'Especialidad'
        verbose_name_plural = 'Especialidades'

    def __str__(self):
        return self.name


class RegisterUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='register_profile')
    names = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    document = models.CharField(max_length=13, unique=True)
    phone = models.CharField(max_length=10)
    photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Masculino'), ('F', 'Femenino')], default='M')
    theme = models.CharField(max_length=10, choices=[('light', 'Claro'), ('dark', 'Oscuro')], default='light')

    class Meta:
        db_table = 'RegisterUser'
        verbose_name = 'Usuario Registrado'
        verbose_name_plural = 'Usuarios Registrados'

    def __str__(self):
        return f'{self.names} {self.last_name}'


class Adviser(models.Model):
    profile = models.OneToOneField(RegisterUser, on_delete=models.CASCADE, related_name='adviser_profile')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='advisers')
    specialism = models.ForeignKey(Specialism, on_delete=models.SET_NULL, null=True, blank=True, related_name='advisers')
    signature = models.ImageField(upload_to='signatures/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    assigned_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'Adviser'
        verbose_name = 'Asesor'
        verbose_name_plural = 'Asesores'

    def __str__(self):
        return f'{self.profile.names} {self.profile.last_name} - {self.role.name}'

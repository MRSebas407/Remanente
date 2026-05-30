from django.core.management.base import BaseCommand
from accounts.models import Role, Specialism, User, RegisterUser, Adviser
from core.models import Country, City, Neighborhood, ChurchService


class Command(BaseCommand):
    help = 'Seed initial data'

    def handle(self, *args, **kwargs):
        if Role.objects.exists():
            self.stdout.write('Data already seeded')
            return

        roles = [
            ('Administrador', 'Administrador del sistema'),
            ('Padre Espiritual', 'Guía espiritual y responsable de llamadas'),
            ('Maestro', 'Maestro de fundamentos y bautizos'),
        ]
        for name, desc in roles:
            Role.objects.create(name=name, description=desc)

        specialisms = [
            ('Joven', 'Especializado en trabajar con jóvenes'),
            ('Normal', 'Especializado en personas normales'),
            ('Otra Iglesia', 'Especializado en personas de otras iglesias'),
            ('Distancia', 'Especializado en personas a distancia'),
        ]
        for name, desc in specialisms:
            Specialism.objects.create(name=name, description=desc)

        country, _ = Country.objects.get_or_create(name='Ecuador')
        city, _ = City.objects.get_or_create(name='Quito', country=country)
        Neighborhood.objects.get_or_create(name='Centro', city=city)

        ChurchService.objects.create(name='Domingo 10am', description='Servicio dominical 10am', is_active=True)

        if not User.objects.filter(username='admin').exists():
            user = User.objects.create_superuser('admin', 'admin@iglesia.com', 'admin123')
            reg = RegisterUser.objects.create(
                user=user,
                names='Admin',
                last_name='Sistema',
                document='0000000000',
                phone='0000000000',
                gender='M',
            )
            Adviser.objects.create(
                profile=reg,
                role=Role.objects.get(name='Administrador'),
            )
            self.stdout.write(self.style.SUCCESS('Admin user created: admin / admin123'))

        pf_role = Role.objects.get(name='Padre Espiritual')
        teacher_role = Role.objects.get(name='Maestro')

        if not User.objects.filter(username='padre1').exists():
            user = User.objects.create_user('padre1', 'padre1@iglesia.com', '123456')
            reg = RegisterUser.objects.create(
                user=user, names='Carlos', last_name='Gómez',
                document='1000000001', phone='0999000001', gender='M',
            )
            Adviser.objects.create(
                profile=reg, role=pf_role,
                specialism=Specialism.objects.get(name='Normal'),
            )
            self.stdout.write(self.style.SUCCESS('Padre espiritual creado: padre1 / 123456'))

        if not User.objects.filter(username='padre2').exists():
            user = User.objects.create_user('padre2', 'padre2@iglesia.com', '123456')
            reg = RegisterUser.objects.create(
                user=user, names='María', last_name='López',
                document='1000000002', phone='0999000002', gender='F',
            )
            Adviser.objects.create(
                profile=reg, role=pf_role,
                specialism=Specialism.objects.get(name='Joven'),
            )
            self.stdout.write(self.style.SUCCESS('Padre espiritual creado: padre2 / 123456'))

        if not User.objects.filter(username='maestro1').exists():
            user = User.objects.create_user('maestro1', 'maestro1@iglesia.com', '123456')
            reg = RegisterUser.objects.create(
                user=user, names='Pedro', last_name='Ramírez',
                document='1000000003', phone='0999000003', gender='M',
            )
            Adviser.objects.create(
                profile=reg, role=teacher_role,
            )
            self.stdout.write(self.style.SUCCESS('Maestro creado: maestro1 / 123456'))

        self.stdout.write(self.style.SUCCESS('Seed data loaded'))

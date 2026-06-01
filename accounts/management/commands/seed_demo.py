from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from accounts.models import Adviser, User, RegisterUser, Role, Specialism
from core.models import Country, City, Neighborhood, ChurchService
from persons.models import Person
from calls.models import Call, CallDetail


NAMES_M = [
    ('Carlos', 'Mendoza'), ('Luis', 'Martínez'), ('Andrés', 'Paredes'),
    ('Jorge', 'Valencia'), ('Miguel', 'Cruz'), ('David', 'Rivas'),
    ('Santiago', 'Ríos'), ('Felipe', 'Castro'), ('Pablo', 'Delgado'),
    ('Ricardo', 'Peña'), ('Héctor', 'Vargas'), ('Oscar', 'Navarro'),
    ('Javier', 'Cárdenas'), ('Diego', 'Salazar'), ('Manuel', 'Bravo'),
    ('Alberto', 'Mora'), ('Fernando', 'Rojas'), ('Roberto', 'Suárez'),
]

NAMES_F = [
    ('Ana', 'García'), ('María', 'Rodríguez'), ('Sofía', 'López'),
    ('Valentina', 'Díaz'), ('Camila', 'Torres'), ('Isabella', 'Ramírez'),
    ('Luciana', 'Morales'), ('Gabriela', 'Ortiz'), ('Daniela', 'Medina'),
    ('Paula', 'Castro'), ('Andrea', 'Vega'), ('Carolina', 'Peña'),
    ('Verónica', 'Soto'), ('Natalia', 'Reyes'), ('Patricia', 'Molina'),
    ('Alejandra', 'Guerrero'), ('Rosa', 'Iglesias'), ('Mónica', 'Pacheco'),
]

SPECIALISMS = ['joven', 'normal', 'other_church', 'distance']


class Command(BaseCommand):
    help = 'Seed demo data for graph testing'

    def handle(self, *args, **kwargs):
        if not Adviser.objects.filter(roles__name='Padre Espiritual').exists():
            self.stdout.write(self.style.WARNING('Run seed_data first'))
            return

        self.stdout.write('Cleaning old demo data...')
        deleted, _ = Person.objects.filter(document__startswith='2').delete()
        self.stdout.write(f'  Deleted {deleted} old demo persons')

        country, _ = Country.objects.get_or_create(name='Colombia')
        city, _ = City.objects.get_or_create(name='Bogotá', country=country)
        neighborhood, _ = Neighborhood.objects.get_or_create(name='Centro', city=city)
        service, _ = ChurchService.objects.get_or_create(name='Domingo 10am', defaults={'description': 'Servicio dominical', 'is_active': True})

        padres_m = list(Adviser.objects.filter(roles__name='Padre Espiritual', profile__gender='M'))
        padres_f = list(Adviser.objects.filter(roles__name='Padre Espiritual', profile__gender='F'))
        maestro = Adviser.objects.filter(roles__name='Maestro').first()

        now = timezone.now()
        doc_id = 20000000
        persons_created = 0

        self.stdout.write('Creating persons...')

        for i, (name, last) in enumerate(NAMES_M + NAMES_F):
            gender = 'M' if i < len(NAMES_M) else 'F'
            padre_pool = padres_m if gender == 'M' else padres_f
            padre = random.choice(padre_pool) if padre_pool else None

            specialism = random.choice(SPECIALISMS)
            member_state = random.choices(['effective', 'not_effective'], weights=[6, 4])[0]
            baptized_val = random.random() < 0.35
            enrollment = baptized_val or random.random() < 0.4

            days_ago = random.randint(0, 365)
            hours_ago = random.randint(0, 23)
            mins_ago = random.randint(0, 59)
            register_date = now - timedelta(days=days_ago, hours=hours_ago, minutes=mins_ago)

            doc_id += 1
            phone = f'320{random.randint(1000000, 9999999)}'

            person = Person.objects.create(
                names=name,
                lastname=last,
                document=str(doc_id),
                phone=phone,
                country=country,
                city=city,
                neighborhood=neighborhood,
                address=f'Calle {random.randint(1, 100)} #{random.randint(1, 50)}-{random.randint(1, 99)}',
                church_service=service,
                specialism=specialism,
                comes_from_church='Vida Nueva' if specialism == 'other_church' else None,
                comes_from_details='Visitó por invitación' if specialism == 'other_church' else None,
                registered_by=padre or random.choice(padres_m + padres_f) if (padres_m or padres_f) else None,
                spiritual_father=padre,
                gender=gender,
                assignment_state='assigned' if padre else 'pending',
                member_state=member_state,
                enrollment_fund_1=enrollment,
                baptized=baptized_val,
                data_consent=True,
            )

            Person.objects.filter(id=person.id).update(register_date=register_date)

            if padre:
                padre.assigned_count += 1
                padre.save(update_fields=['assigned_count'])

            call_state = 'effective' if member_state == 'effective' else random.choice(['effective', 'not_effective'])
            scheduled_offset = timedelta(hours=random.randint(1, 48))
            call_made_offset = scheduled_offset + timedelta(minutes=random.randint(1, 120))

            call1 = Call.objects.create(person=person, call_number=1)
            Call.objects.filter(id=call1.id).update(created_in=register_date)
            CallDetail.objects.create(
                call=call1,
                made_by=padre or person.registered_by,
                scheduled_date=register_date + scheduled_offset,
                date_made=register_date + call_made_offset,
                made=True,
                state=call_state,
                annotation=f'Primera llamada - {name}',
            )

            if random.random() < 0.7:
                call2 = Call.objects.create(person=person, call_number=2)
                Call.objects.filter(id=call2.id).update(created_in=register_date + timedelta(days=random.randint(1, 3)))
                scheduled_offset2 = timedelta(days=random.randint(1, 8))
                CallDetail.objects.create(
                    call=call2,
                    made_by=padre or person.registered_by,
                    scheduled_date=register_date + call_made_offset + scheduled_offset2,
                    date_made=register_date + call_made_offset + scheduled_offset2 + timedelta(hours=random.randint(1, 24)),
                    made=True,
                    state=call_state,
                    annotation=f'Segunda llamada - {name}',
                )

                if random.random() < 0.5:
                    call3 = Call.objects.create(person=person, call_number=3)
                    Call.objects.filter(id=call3.id).update(created_in=register_date + timedelta(days=random.randint(4, 10)))
                    CallDetail.objects.create(
                        call=call3,
                        made_by=padre or person.registered_by,
                        scheduled_date=register_date + timedelta(days=random.randint(5, 16)),
                        date_made=register_date + timedelta(days=random.randint(5, 16), hours=random.randint(1, 12)),
                        made=True,
                        state=call_state if member_state == 'effective' else 'not_effective',
                        annotation=f'Tercera llamada - {name}',
                    )

            persons_created += 1

            if persons_created % 10 == 0:
                self.stdout.write(f'  {persons_created} persons created...')

        self.stdout.write(self.style.SUCCESS(f'Created {persons_created} demo persons with calls'))

        if maestro:
            for p in Person.objects.filter(baptized=False, enrollment_fund_1=True, spiritual_father__isnull=False)[:5]:
                if p.spiritual_father.is_teacher():
                    continue
                old_father = p.spiritual_father
                p.spiritual_father = maestro
                p.assignment_state = 'assigned'
                p.save(update_fields=['spiritual_father', 'assignment_state'])
                if old_father and old_father.assigned_count > 0:
                    old_father.assigned_count -= 1
                    old_father.save(update_fields=['assigned_count'])

        self.stdout.write(self.style.SUCCESS('Demo data loaded'))

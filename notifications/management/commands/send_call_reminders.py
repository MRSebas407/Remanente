from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from calls.models import CallDetail
from notifications.models import Notification
from notifications.services import OpenWAService

REMINDER_FRACTIONS = [
    ('aviso_1', 0.50),
    ('aviso_2', 0.25),
    ('aviso_3', 0.125),
]

TEMPLATE = (
    '*Recordatorio de {call_number} llamada*\n'
    'Hola {adviser}, te recordamos que te faltan {tiempo} '
    'para llamar a *{person}*, su número es {phone}. '
    'Recuerda estar atento a este chat o al panel '
    'de la aplicación en el cual te saldrán las personas que se te asignaron, '
    'muchas gracias.'
)

CALL_NAMES = {1: 'Primera', 2: 'Segunda', 3: 'Tercera'}


def format_tiempo(delta):
    total_sec = int(delta.total_seconds())
    if total_sec <= 0:
        return '0d:0h:0min:0s'
    d = total_sec // 86400
    h = (total_sec % 86400) // 3600
    m = (total_sec % 3600) // 60
    s = total_sec % 60
    return f'{d}d:{h}h:{m}min:{s}s'


class Command(BaseCommand):
    help = 'Send WhatsApp reminders for upcoming calls via OpenWA'

    def handle(self, *args, **options):
        service = OpenWAService()

        if not service.health_check():
            self.stdout.write(self.style.ERROR('OpenWA is not reachable'))
            return

        now = timezone.now()
        sent_count = 0

        for call_detail in CallDetail.objects.filter(made=False):
            adviser = call_detail.made_by
            person = call_detail.call.person
            phone = adviser.profile.phone
            adviser_name = f'{adviser.profile.names} {adviser.profile.last_name}'
            person_name = f'{person.names} {person.lastname}'
            call_number = call_detail.call.call_number

            total = call_detail.scheduled_date - call_detail.call.created_in
            total_sec = total.total_seconds()
            if total_sec <= 0:
                continue

            elapsed = now - call_detail.call.created_in
            pct_elapsed = min(elapsed.total_seconds() / total_sec, 1.0)

            for reminder_type, fraction in REMINDER_FRACTIONS:
                required_elapsed = 1.0 - fraction

                if pct_elapsed < required_elapsed:
                    continue

                already_sent = Notification.objects.filter(
                    call_detail=call_detail,
                    notification_type=reminder_type,
                ).exists()
                if already_sent:
                    continue

                remaining = total * fraction
                tiempo = format_tiempo(remaining)
                person_phone = person.phone or ''
                message = TEMPLATE.format(
                    adviser=adviser_name,
                    person=person_name,
                    tiempo=tiempo,
                    phone=person_phone,
                    call_number=CALL_NAMES.get(call_number, call_number),
                )
                result = service.send_text(phone, message)

                Notification.objects.create(
                    call_detail=call_detail,
                    notification_type=reminder_type,
                    status='sent' if result['success'] else 'failed',
                    error_message=None if result['success'] else result.get('error'),
                )

                if result['success']:
                    sent_count += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'Sent {reminder_type} ({fraction*100:.0f}%) to {adviser_name} ({phone}) about {person_name}'
                    ))
                else:
                    self.stdout.write(self.style.ERROR(
                        f'Failed to send {reminder_type} to {adviser_name}: {result.get("error")}'
                    ))

        self.stdout.write(self.style.SUCCESS(f'Done. Sent {sent_count} reminders.'))

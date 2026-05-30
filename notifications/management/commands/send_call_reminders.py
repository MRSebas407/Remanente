from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from calls.models import CallDetail
from notifications.models import Notification
from notifications.services import OpenWAService

# Fracciones del tiempo total de la llamada para cada aviso.
# Ej: para 48h → aviso_1 = 24h (50%), aviso_2 = 12h (25%), aviso_3 = 6h (12.5%)
REMINDER_FRACTIONS = [
    ('aviso_1', 0.50),
    ('aviso_2', 0.25),
    ('aviso_3', 0.125),
]

TEMPLATE = (
    '*Recordatorio de {call_number} llamada*\n'
    'Hola {adviser}, te recordamos que tienes un plazo de {tiempo} '
    'para llamar a {person}, recuerda estar atento a este chat o al panel '
    'de la aplicación en el cual te saldrán las personas que se te asignaron, '
    'muchas gracias.'
)

CALL_NAMES = {1: 'Primera', 2: 'Segunda', 3: 'Tercera'}


def format_tiempo(delta):
    horas = delta.total_seconds() / 3600
    if horas >= 24 and horas % 24 == 0:
        dias = int(horas // 24)
        return f'{dias} día' if dias == 1 else f'{dias} días'
    return f'{int(horas)} horas'


class Command(BaseCommand):
    help = 'Send WhatsApp reminders for upcoming calls via OpenWA'

    def handle(self, *args, **options):
        service = OpenWAService()

        if not service.health_check():
            self.stdout.write(self.style.ERROR('OpenWA is not reachable'))
            return

        now = timezone.now()
        sent_count = 0

        for call_detail in CallDetail.objects.filter(made=False, scheduled_date__gt=now):
            adviser = call_detail.made_by
            person = call_detail.call.person
            phone = adviser.profile.phone
            adviser_name = f'{adviser.profile.names} {adviser.profile.last_name}'
            person_name = f'{person.names} {person.lastname}'
            call_number = call_detail.call.call_number

            total_window = call_detail.scheduled_date - call_detail.call.created_in
            margin = max(total_window * 0.05, timedelta(seconds=15))

            for reminder_type, fraction in REMINDER_FRACTIONS:
                delta = total_window * fraction
                threshold = call_detail.scheduled_date - delta

                if not (threshold - margin <= now <= threshold + margin):
                    continue

                already_sent = Notification.objects.filter(
                    call_detail=call_detail,
                    notification_type=reminder_type,
                ).exists()
                if already_sent:
                    continue

                tiempo = format_tiempo(delta)
                message = TEMPLATE.format(
                    adviser=adviser_name,
                    person=person_name,
                    tiempo=tiempo,
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

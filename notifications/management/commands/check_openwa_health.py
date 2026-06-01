from django.core.management.base import BaseCommand
from notifications.services import OpenWAService, READY


class Command(BaseCommand):
    help = 'Check OpenWA health and attempt session recovery if needed'

    def handle(self, *args, **options):
        service = OpenWAService()

        if not service.health_check():
            self.stdout.write(self.style.ERROR('OpenWA API not reachable'))
            return

        status = service.session_status()
        self.stdout.write(f'Session status: {status}')

        if status in READY:
            self.stdout.write(self.style.SUCCESS('Session is healthy'))
            return

        self.stdout.write('Attempting session recovery...')
        if service.ensure_ready():
            self.stdout.write(self.style.SUCCESS('Session recovered'))
        else:
            self.stdout.write(self.style.ERROR('Session recovery failed'))

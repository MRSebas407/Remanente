import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from accounts.models import Adviser
for a in Adviser.objects.all():
    p = a.profile
    s = a.specialism.name if a.specialism else "None"
    print(f"id={a.id} {p.names} role={a.role.name} spec={s} gender={p.gender} assigned={a.assigned_count}")

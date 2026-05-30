from django.contrib import admin
from .models import Person
from accounts.models import Adviser, Specialism, Role
from .serializers import SPECIALISM_MAP


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ['names', 'lastname', 'document', 'assignment_state', 'member_state', 'spiritual_father']
    list_filter = ['assignment_state', 'member_state', 'specialism', 'gender']
    search_fields = ['names', 'lastname', 'document']
    readonly_fields = ['assignment_state', 'member_state', 'register_date', 'registered_by']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.member_state = 'not_effective'
            obj.registered_by = request.user.register_profile.adviser_profile
        super().save_model(request, obj, form, change)
        if not change:
            self.auto_assign_spiritual_father(obj)
            self.create_first_call(obj)

    def auto_assign_spiritual_father(self, person):
        role_sf = Role.objects.get(name='Padre Espiritual')
        person_gender = person.gender or person.registered_by.profile.gender
        spec_name = SPECIALISM_MAP.get(person.specialism, 'Normal')

        try:
            specialism = Specialism.objects.get(name=spec_name, is_active=True)
        except Specialism.DoesNotExist:
            person.save()
            return

        candidates = Adviser.objects.filter(
            role=role_sf,
            specialism=specialism,
            is_active=True,
            assigned_count__lt=3,
            profile__gender=person_gender,
        )

        if candidates.exists():
            chosen = candidates.first()
            person.spiritual_father = chosen
            person.assignment_state = 'assigned'
            chosen.assigned_count += 1
            chosen.save()
            person.save()

    def create_first_call(self, person):
        from calls.models import Call, CallDetail
        from django.utils import timezone
        from datetime import timedelta

        if person.calls.exists():
            return
        call = Call.objects.create(person=person, call_number=1)
        CallDetail.objects.create(
            call=call,
            made_by=person.spiritual_father or person.registered_by,
            scheduled_date=timezone.now() + timedelta(minutes=5)
        )

import logging
from rest_framework import serializers
from .models import Person, SPECIALISM_MAP
from baptisms.models import BaptismalRegister
from accounts.models import Role, Specialism, Adviser


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = '__all__'
        read_only_fields = ['assignment_state', 'member_state', 'register_date', 'spiritual_father']

    def update(self, instance, validated_data):
        old_specialism = instance.specialism
        instance = super().update(instance, validated_data)
        new_specialism = validated_data.get('specialism', old_specialism)

        if new_specialism != old_specialism:
            self._reassign_for_specialism(instance)

        return instance

    def _reassign_for_specialism(self, person):
        from accounts.models import Role, Specialism as SpecialismModel, Adviser

        current_father = person.spiritual_father

        if current_father and current_father.role.name != 'Padre Espiritual':
            return

        spec_name = SPECIALISM_MAP.get(person.specialism, 'Normal')
        person_gender = person.gender
        if not person_gender and person.registered_by:
            person_gender = person.registered_by.profile.gender

        try:
            specialism_obj = SpecialismModel.objects.get(name=spec_name, is_active=True)
        except SpecialismModel.DoesNotExist:
            self._clear_assignment(person, current_father)
            return

        role_sf = Role.objects.get(name='Padre Espiritual')

        if current_father and current_father.specialism and current_father.specialism.name == spec_name:
            return

        candidates = Adviser.objects.filter(
            role=role_sf,
            specialism=specialism_obj,
            is_active=True,
            assigned_count__lt=3,
            profile__gender=person_gender,
        )

        if candidates.exists():
            new_father = candidates.first()
            if current_father:
                current_father.assigned_count = max(0, current_father.assigned_count - 1)
                current_father.save()
            person.spiritual_father = new_father
            person.assignment_state = 'assigned'
            new_father.assigned_count += 1
            new_father.save()
            person.save()
        else:
            self._clear_assignment(person, current_father)

    def _clear_assignment(self, person, current_father):
        if current_father:
            current_father.assigned_count = max(0, current_father.assigned_count - 1)
            current_father.save()
        person.spiritual_father = None
        person.assignment_state = 'pending'
        person.save()


class PersonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = [
            'names', 'lastname', 'document', 'phone', 'address',
            'specialism', 'comes_from_church', 'comes_from_details',
            'gender', 'signature', 'photo', 'data_consent',
            'country', 'city', 'neighborhood', 'church_service',
        ]

    def create(self, validated_data):
        adviser = self.context['request'].user.register_profile.adviser_profile
        validated_data['registered_by'] = adviser
        person = Person.objects.create(**validated_data)
        self.assign_spiritual_father(person)
        self.create_first_call(person)
        return person

    def assign_spiritual_father(self, person):
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

        if not person.spiritual_father:
            return

        call = Call.objects.create(person=person, call_number=1)
        detail = CallDetail.objects.create(
            call=call,
            made_by=person.spiritual_father,
            scheduled_date=timezone.now() + timedelta(minutes=5)
        )

        from notifications.services import OpenWAService
        result = OpenWAService().notify_assignment(person.spiritual_father, person, detail)
        if not result.get('success'):
            logger = logging.getLogger(__name__)
            logger.warning('Notification on person creation failed for %s: %s',
                           person.spiritual_father, result.get('error'))


class PersonListSerializer(serializers.ModelSerializer):
    spiritual_father_name = serializers.SerializerMethodField()
    registered_by_name = serializers.SerializerMethodField()
    has_baptism = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            'id', 'names', 'lastname', 'document', 'phone', 'gender',
            'assignment_state', 'member_state', 'specialism', 'register_date',
            'spiritual_father', 'spiritual_father_name',
            'registered_by', 'registered_by_name',
            'enrollment_fund_1', 'baptized', 'has_baptism', 'photo', 'data_consent'
        ]

    def get_spiritual_father_name(self, obj):
        if obj.spiritual_father:
            return f'{obj.spiritual_father.profile.names} {obj.spiritual_father.profile.last_name}'
        return None

    def get_registered_by_name(self, obj):
        return f'{obj.registered_by.profile.names} {obj.registered_by.profile.last_name}'

    def get_has_baptism(self, obj):
        return BaptismalRegister.objects.filter(person=obj).exists()


class PersonDetailSerializer(serializers.ModelSerializer):
    country_name = serializers.SerializerMethodField()
    city_name = serializers.SerializerMethodField()
    neighborhood_name = serializers.SerializerMethodField()
    church_service_name = serializers.SerializerMethodField()
    spiritual_father_name = serializers.SerializerMethodField()
    registered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = '__all__'
        extra_fields = [
            'country_name', 'city_name', 'neighborhood_name',
            'church_service_name', 'spiritual_father_name', 'registered_by_name',
        ]

    def get_country_name(self, obj):
        return obj.country.name if obj.country else None

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_neighborhood_name(self, obj):
        return obj.neighborhood.name if obj.neighborhood else None

    def get_church_service_name(self, obj):
        return obj.church_service.name if obj.church_service else None

    def get_spiritual_father_name(self, obj):
        if obj.spiritual_father:
            return f'{obj.spiritual_father.profile.names} {obj.spiritual_father.profile.last_name}'
        return None

    def get_registered_by_name(self, obj):
        return f'{obj.registered_by.profile.names} {obj.registered_by.profile.last_name}'

from rest_framework import serializers
from .models import Attendant, Calendar, Mode, Class, BaptismalRegister


class AttendantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendant
        fields = '__all__'


class CalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = '__all__'


class ModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mode
        fields = '__all__'


class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = '__all__'


class BaptismalRegisterSerializer(serializers.ModelSerializer):
    person_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    attendant_name = serializers.SerializerMethodField()
    class_info = serializers.SerializerMethodField()

    class Meta:
        model = BaptismalRegister
        fields = [
            'id', 'person', 'person_name', 'teacher', 'teacher_name',
            'age', 'attendant', 'attendant_name', 'class_ref', 'class_info',
            'baptism_decision', 'photo', 'shirt_size', 'time_in_church',
            'baptized', 'details', 'registration_date',
        ]
        read_only_fields = ['registration_date']

    def get_person_name(self, obj):
        return f'{obj.person.names} {obj.person.lastname}'

    def get_teacher_name(self, obj):
        return f'{obj.teacher.profile.names} {obj.teacher.profile.last_name}'

    def get_attendant_name(self, obj):
        return obj.attendant.full_name if obj.attendant else None

    def get_class_info(self, obj):
        if obj.class_ref:
            return {
                'id': obj.class_ref.id,
                'calendar': obj.class_ref.calendar.day if obj.class_ref.calendar else '',
                'mode': obj.class_ref.mode.name if obj.class_ref.mode else '',
            }
        return None

    def create(self, validated_data):
        register = super().create(validated_data)
        if register.baptized:
            self._sync_person(register)
        return register

    def update(self, instance, validated_data):
        old_baptized = instance.baptized
        register = super().update(instance, validated_data)
        if register.baptized and not old_baptized:
            self._sync_person(register)
        return register

    def _sync_person(self, register):
        person = register.person
        person.baptized = True
        if person.spiritual_father:
            person.spiritual_father.assigned_count = max(0, person.spiritual_father.assigned_count - 1)
            person.spiritual_father.save()
        person.spiritual_father = None
        person.assignment_state = 'completed'
        person.save()


class BaptismalRegisterListSerializer(serializers.ModelSerializer):
    person_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    attendant_name = serializers.SerializerMethodField()
    class_info = serializers.SerializerMethodField()

    class Meta:
        model = BaptismalRegister
        fields = [
            'id', 'person', 'person_name', 'teacher', 'teacher_name',
            'age', 'attendant', 'attendant_name', 'class_ref', 'class_info',
            'baptism_decision', 'photo', 'shirt_size', 'time_in_church',
            'baptized', 'details', 'registration_date',
        ]

    def get_person_name(self, obj):
        return f'{obj.person.names} {obj.person.lastname}'

    def get_teacher_name(self, obj):
        return f'{obj.teacher.profile.names} {obj.teacher.profile.last_name}'

    def get_attendant_name(self, obj):
        return obj.attendant.full_name if obj.attendant else None

    def get_class_info(self, obj):
        if obj.class_ref:
            return {
                'id': obj.class_ref.id,
                'calendar': obj.class_ref.calendar.day if obj.class_ref.calendar else '',
                'mode': obj.class_ref.mode.name if obj.class_ref.mode else '',
            }
        return None

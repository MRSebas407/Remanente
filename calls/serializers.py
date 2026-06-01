from rest_framework import serializers
from .models import Call, CallDetail
from persons.models import Person
from accounts.models import Adviser


class CallDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallDetail
        fields = '__all__'
        read_only_fields = ['call', 'made_by', 'scheduled_date', 'date_made']


class CallSerializer(serializers.ModelSerializer):
    details = CallDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Call
        fields = '__all__'
        read_only_fields = ['person', 'call_number']


class CallCreateSerializer(serializers.Serializer):
    person = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all())
    call_number = serializers.ChoiceField(choices=[(1, 'Primera'), (2, 'Segunda'), (3, 'Tercera')])
    made_by = serializers.PrimaryKeyRelatedField(queryset=Adviser.objects.all())
    scheduled_date = serializers.DateTimeField()

    def validate(self, attrs):
        person = attrs['person']
        call_number = attrs['call_number']
        if Call.objects.filter(person=person, call_number=call_number).exists():
            from rest_framework.serializers import ValidationError
            raise ValidationError(
                f'La persona ya tiene una llamada #{call_number}'
            )
        return attrs



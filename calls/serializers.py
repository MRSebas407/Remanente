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
    person = serializers.PrimaryKeyRelatedField(
        queryset=Person.objects.filter(member_state='not_effective', is_active=False)
    )
    call_number = serializers.ChoiceField(choices=[(1, 'Primera'), (2, 'Segunda'), (3, 'Tercera')])
    made_by = serializers.PrimaryKeyRelatedField(queryset=Adviser.objects.all())
    scheduled_date = serializers.DateTimeField()



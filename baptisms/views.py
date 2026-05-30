from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Attendant, Calendar, Mode, Class, BaptismalRegister
from .serializers import (
    AttendantSerializer, CalendarSerializer, ModeSerializer,
    ClassSerializer, BaptismalRegisterSerializer, BaptismalRegisterListSerializer
)
from accounts.permissions import IsAdmin, IsTeacher


class AttendantViewSet(viewsets.ModelViewSet):
    queryset = Attendant.objects.all()
    serializer_class = AttendantSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        person_id = self.request.query_params.get('person')
        if person_id:
            qs = qs.filter(person_id=person_id)
        return qs


class CalendarViewSet(viewsets.ModelViewSet):
    queryset = Calendar.objects.all()
    serializer_class = CalendarSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class ModeViewSet(viewsets.ModelViewSet):
    queryset = Mode.objects.all()
    serializer_class = ModeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class BaptismalRegisterViewSet(viewsets.ModelViewSet):
    queryset = BaptismalRegister.objects.all()
    serializer_class = BaptismalRegisterSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return BaptismalRegisterListSerializer
        return BaptismalRegisterSerializer

    def list(self, request, *args, **kwargs):
        from persons.models import Person
        from accounts.models import Adviser, Role
        baptized_no_register = Person.objects.filter(
            baptized=True
        ).exclude(
            id__in=BaptismalRegister.objects.values('person_id')
        )
        if baptized_no_register.exists():
            teacher = Adviser.objects.filter(
                role=Role.objects.get(name='Maestro'),
                is_active=True
            ).first()
            for person in baptized_no_register:
                BaptismalRegister.objects.create(
                    person=person,
                    teacher=teacher or request.user.register_profile.adviser_profile,
                    baptism_decision='yes',
                    baptized=True,
                )
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = BaptismalRegister.objects.all().select_related(
            'person', 'teacher', 'teacher__profile',
            'attendant', 'class_ref', 'class_ref__calendar', 'class_ref__mode'
        )
        user = self.request.user
        try:
            adviser = user.register_profile.adviser_profile
            if adviser.role.name == 'Maestro':
                qs = qs.filter(teacher=adviser)
        except:
            pass
        name = self.request.query_params.get('name')
        if name:
            terms = name.split()
            q = Q()
            for term in terms:
                q &= (Q(person__names__icontains=term) | Q(person__lastname__icontains=term))
            qs = qs.filter(q)
        decision = self.request.query_params.get('decision')
        if decision:
            qs = qs.filter(baptism_decision=decision)
        baptized = self.request.query_params.get('baptized')
        if baptized == 'true':
            qs = qs.filter(baptized=True)
        elif baptized == 'false':
            qs = qs.filter(baptized=False)
        return qs

    @action(detail=False, methods=['get'])
    def pending_persons(self, request):
        from persons.models import Person
        user = request.user
        adviser = user.register_profile.adviser_profile
        registered_ids = BaptismalRegister.objects.values_list('person_id', flat=True)
        persons = Person.objects.filter(
            baptized=False, enrollment_fund_1=True,
            member_state='effective',
        ).exclude(id__in=registered_ids)
        if adviser.role.name != 'Administrador':
            persons = persons.filter(spiritual_father=adviser)
        data = []
        for p in persons:
            data.append({
                'person_id': p.id,
                'person_name': f'{p.names} {p.lastname}',
                'document': p.document,
                'phone': p.phone,
            })
        return Response(data)

    @action(detail=False, methods=['get'])
    def teachers(self, request):
        from accounts.models import Adviser, Role
        role = Role.objects.filter(name='Maestro', is_active=True).first()
        if not role:
            return Response([])
        advisers = Adviser.objects.filter(role=role, is_active=True).select_related('profile')
        data = []
        for a in advisers:
            count = BaptismalRegister.objects.filter(teacher=a).count()
            data.append({
                'id': a.id,
                'full_name': f'{a.profile.names} {a.profile.last_name}',
                'registration_count': count,
            })
        return Response(data)

    @action(detail=False, methods=['post'])
    def quick_register(self, request):
        from persons.models import Person
        person_id = request.data.get('person_id')
        if not person_id:
            return Response({'error': 'person_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            person = Person.objects.get(id=person_id)
        except Person.DoesNotExist:
            return Response({'error': 'Persona no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        adviser = user.register_profile.adviser_profile
        if adviser.role.name == 'Maestro':
            teacher = adviser
        else:
            from accounts.models import Adviser, Role
            role = Role.objects.filter(name='Maestro', is_active=True).first()
            if not role:
                return Response({'error': 'No hay maestros activos'}, status=status.HTTP_400_BAD_REQUEST)
            teacher = Adviser.objects.filter(role=role, is_active=True).first()
            if not teacher:
                return Response({'error': 'No hay maestros activos'}, status=status.HTTP_400_BAD_REQUEST)

        if BaptismalRegister.objects.filter(person=person).exists():
            return Response({'error': 'Esta persona ya tiene un registro de bautizo'}, status=status.HTTP_400_BAD_REQUEST)

        register = BaptismalRegister.objects.create(
            person=person,
            teacher=teacher,
            baptism_decision='undecided',
        )
        serializer = BaptismalRegisterListSerializer(register)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

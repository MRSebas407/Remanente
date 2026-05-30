from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Person
from .serializers import PersonSerializer, PersonCreateSerializer, PersonListSerializer, PersonDetailSerializer, SPECIALISM_MAP


class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return PersonCreateSerializer
        if self.action == 'list':
            return PersonListSerializer
        if self.action == 'retrieve':
            return PersonDetailSerializer
        if self.action == 'metadata' and not self.kwargs.get('pk'):
            return PersonCreateSerializer
        return PersonSerializer

    def get_queryset(self):
        qs = Person.objects.all()
        user = self.request.user
        try:
            adviser = user.register_profile.adviser_profile
            role_name = adviser.role.name
        except:
            return Person.objects.none()

        if role_name == 'Padre Espiritual':
            qs = qs.filter(spiritual_father=adviser)
        elif role_name == 'Maestro':
            qs = qs.filter(spiritual_father=adviser)

        name = self.request.query_params.get('name')
        document = self.request.query_params.get('document')
        phone = self.request.query_params.get('phone')
        specialism = self.request.query_params.get('specialism')
        assignment_state = self.request.query_params.get('assignment_state')
        if name:
            terms = name.split()
            q = Q()
            for term in terms:
                q &= (Q(names__icontains=term) | Q(lastname__icontains=term))
            qs = qs.filter(q)
        if document:
            qs = qs.filter(document__icontains=document)
        if phone:
            qs = qs.filter(phone__icontains=phone)
        if specialism:
            qs = qs.filter(specialism=specialism)
        if assignment_state:
            qs = qs.filter(assignment_state=assignment_state)
        return qs

    @action(detail=True, methods=['post'])
    def assign_spiritual_father(self, request, pk=None):
        person = self.get_object()
        adviser_id = request.data.get('adviser_id')
        if not adviser_id:
            return Response({'error': 'adviser_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        from accounts.models import Adviser
        try:
            new_father = Adviser.objects.get(id=adviser_id, is_active=True)
        except Adviser.DoesNotExist:
            return Response({'error': 'Asesor no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        warnings = []
        spec_name = SPECIALISM_MAP.get(person.specialism, 'Normal')
        if new_father.specialism and new_father.specialism.name != spec_name:
            warnings.append(f'La especialidad del asesor ({new_father.specialism.name}) no coincide con la persona ({spec_name})')

        person_gender = person.gender or (person.registered_by.profile.gender if person.registered_by else None)
        if person_gender and new_father.profile.gender != person_gender:
            warnings.append(f'El género del asesor ({new_father.profile.get_gender_display()}) no coincide')

        if new_father.assigned_count >= 3:
            warnings.append('El asesor ya tiene 3 personas asignadas')

        override = request.data.get('override', False)
        if warnings and not override:
            return Response({'warnings': warnings, 'requires_override': True}, status=status.HTTP_409_CONFLICT)

        if person.spiritual_father:
            old_father = person.spiritual_father
            old_father.assigned_count = max(0, old_father.assigned_count - 1)
            old_father.save()

        person.spiritual_father = new_father
        person.assignment_state = 'assigned'
        new_father.assigned_count += 1
        new_father.save()
        person.save()

        from calls.models import Call, CallDetail
        from django.utils import timezone
        from datetime import timedelta

        pending = CallDetail.objects.filter(
            call__person=person, made=False
        ).select_related('call').order_by('call__call_number').first()

        if pending:
            pending.made_by = new_father
            pending.scheduled_date = timezone.now() + timedelta(minutes=5)
            pending.save()
            detail = pending
        else:
            existing_count = Call.objects.filter(person=person).count()
            if existing_count < 3:
                call = Call.objects.create(person=person, call_number=existing_count + 1)
                detail = CallDetail.objects.create(
                    call=call,
                    made_by=new_father,
                    scheduled_date=timezone.now() + timedelta(minutes=5)
                )
            else:
                detail = None

        if detail:
            from notifications.services import OpenWAService
            OpenWAService().notify_assignment(new_father, person, detail)

        return Response({'message': 'Asignado correctamente', 'warnings': warnings})

    @action(detail=True, methods=['post'])
    def enroll_fundamentals(self, request, pk=None):
        person = self.get_object()

        if person.member_state != 'effective':
            return Response({'error': 'Solo personas con 3 llamadas efectivas pueden inscribirse a fundamentos'}, status=status.HTTP_400_BAD_REQUEST)

        if person.enrollment_fund_1:
            return Response({'error': 'Ya está inscrito a fundamentos'}, status=status.HTTP_400_BAD_REQUEST)

        user = self.request.user
        adviser = user.register_profile.adviser_profile
        if adviser.role.name not in ('Administrador', 'Padre Espiritual'):
            return Response({'error': 'Solo el Padre Espiritual o Administrador pueden inscribir a fundamentos'}, status=status.HTTP_403_FORBIDDEN)

        if adviser.role.name == 'Padre Espiritual' and person.spiritual_father != adviser:
            return Response({'error': 'No eres el padre espiritual de esta persona'}, status=status.HTTP_403_FORBIDDEN)

        person.enrollment_fund_1 = True

        old_father = person.spiritual_father
        if old_father:
            try:
                if old_father.role.name == 'Padre Espiritual':
                    old_father.assigned_count = max(0, old_father.assigned_count - 1)
                    old_father.save()
            except:
                pass

        from accounts.models import Adviser, Role
        maestro_role = Role.objects.get(name='Maestro')
        maestro = Adviser.objects.filter(role=maestro_role, is_active=True).first()
        if maestro:
            person.spiritual_father = maestro
            person.assignment_state = 'assigned'
            person.save()
            from notifications.services import OpenWAService
            OpenWAService().notify_assignment(maestro, person, None)
        else:
            person.save()

        return Response({'message': 'Inscrito a Fundamentos 1'})

    @action(detail=True, methods=['post'])
    def mark_baptized(self, request, pk=None):
        from baptisms.models import BaptismalRegister
        person = self.get_object()
        person.baptized = True
        if person.spiritual_father:
            person.spiritual_father.assigned_count = max(0, person.spiritual_father.assigned_count - 1)
            person.spiritual_father.save()
        person.spiritual_father = None
        person.assignment_state = 'completed'
        person.save()
        register, created = BaptismalRegister.objects.get_or_create(
            person=person,
            defaults={
                'teacher': request.user.register_profile.adviser_profile,
                'baptism_decision': 'yes',
                'baptized': True,
            }
        )
        if not created and not register.baptized:
            register.baptized = True
            register.save()
        return Response({'message': 'Marcado como bautizado'})

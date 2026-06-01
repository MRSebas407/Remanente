import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Person
from .serializers import PersonSerializer, PersonCreateSerializer, PersonListSerializer, PersonDetailSerializer, SPECIALISM_MAP

logger = logging.getLogger(__name__)


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
        if self.action in ('stats',):
            return None
        if self.action == 'metadata' and not self.kwargs.get('pk'):
            return PersonCreateSerializer
        return PersonSerializer

    def get_queryset(self):
        qs = self._base_queryset()
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

        enrolled_not_baptized = self.request.query_params.get('enrolled_not_baptized')
        if enrolled_not_baptized == '1':
            qs = qs.filter(enrollment_fund_1=True, baptismal_registers__isnull=True)

        pending_fundamentals = self.request.query_params.get('pending_fundamentals')
        if pending_fundamentals == '1':
            qs = qs.filter(member_state='effective', enrollment_fund_1=False)

        baptized = self.request.query_params.get('baptized')
        if baptized == '1':
            qs = qs.filter(baptized=True)

        registered_baptism = self.request.query_params.get('registered_baptism')
        if registered_baptism == '1':
            qs = qs.filter(baptismal_registers__baptized=False).distinct()

        return qs

    def _base_queryset(self):
        qs = Person.objects.all()
        user = self.request.user
        try:
            adviser = user.register_profile.adviser_profile
            is_admin = adviser.is_admin()
            is_sf_or_teacher = adviser.is_spiritual_father() or adviser.is_teacher()
        except:
            return Person.objects.none()

        if not is_admin:
            if is_sf_or_teacher:
                qs = qs.filter(spiritual_father=adviser)

        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = self._base_queryset()
        total = qs.count()
        assigned = qs.filter(assignment_state='assigned', is_active=True).count()
        pending = qs.filter(assignment_state='pending', is_active=True).count()
        inactive = qs.filter(is_active=False).count()
        baptized = qs.filter(baptized=True).count()
        enrolled_not_baptized = qs.filter(
            enrollment_fund_1=True,
            baptismal_registers__isnull=True,
        ).count()
        pending_fundamentals = qs.filter(
            member_state='effective',
            enrollment_fund_1=False,
        ).count()
        registered_baptism = qs.filter(
            baptismal_registers__baptized=False,
        ).distinct().count()
        return Response({
            'total': total,
            'assigned': assigned,
            'pending': pending,
            'inactive': inactive,
            'baptized': baptized,
            'enrolled_not_baptized': enrolled_not_baptized,
            'pending_fundamentals': pending_fundamentals,
            'registered_baptism': registered_baptism,
        })

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        person = self.get_object()
        person.is_active = False
        if person.spiritual_father:
            person.spiritual_father.assigned_count = max(0, person.spiritual_father.assigned_count - 1)
            person.spiritual_father.save()
        person.spiritual_father = None
        person.assignment_state = 'deactivated'
        person.save()
        return Response({'message': 'Persona desactivada correctamente'})

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        person = self.get_object()
        person.is_active = True
        person.assignment_state = 'pending'
        person.save()
        return Response({'message': 'Persona activada correctamente'})

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

            from notifications.services import OpenWAService
            result = OpenWAService().notify_unassignment(old_father, person)
            if not result.get('success'):
                logger.warning('Notification unassignment failed for old_father %s: %s',
                               old_father.id, result.get('error'))

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
            pending.scheduled_date = timezone.now() + timedelta(minutes=4)
            pending.save()
            detail = pending
        else:
            existing_count = Call.objects.filter(person=person).count()
            if existing_count < 3:
                call = Call.objects.create(person=person, call_number=existing_count + 1)
                detail = CallDetail.objects.create(
                    call=call,
                    made_by=new_father,
                    scheduled_date=timezone.now() + timedelta(minutes=4)
                )
            else:
                detail = None

        if detail:
            from notifications.services import OpenWAService
            result = OpenWAService().notify_assignment(new_father, person, detail)
            if not result.get('success'):
                logger.warning('Notification assign_spiritual_father failed for adviser %s: %s',
                               new_father.id, result.get('error'))

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
        if not (adviser.is_admin() or adviser.is_spiritual_father()):
            return Response({'error': 'Solo el Padre Espiritual o Administrador pueden inscribir a fundamentos'}, status=status.HTTP_403_FORBIDDEN)

        if adviser.is_spiritual_father() and person.spiritual_father != adviser:
            return Response({'error': 'No eres el padre espiritual de esta persona'}, status=status.HTTP_403_FORBIDDEN)

        person.enrollment_fund_1 = True

        old_father = person.spiritual_father
        if old_father:
            try:
                if old_father.is_spiritual_father():
                    old_father.assigned_count = max(0, old_father.assigned_count - 1)
                    old_father.save()
            except:
                pass

            from notifications.services import OpenWAService
            result = OpenWAService().notify_unassignment(old_father, person)
            if not result.get('success'):
                logger.warning('Notification unassignment (enroll) failed for old_father %s: %s',
                               old_father.id, result.get('error'))

        from accounts.models import Adviser, Role
        maestro_role = Role.objects.get(name='Maestro')
        maestro = Adviser.objects.filter(roles__in=[maestro_role], is_active=True).first()
        if maestro:
            person.spiritual_father = maestro
            person.assignment_state = 'assigned'
            person.save()
            from notifications.services import OpenWAService
            result = OpenWAService().notify_assignment(maestro, person, None)
            if not result.get('success'):
                logger.warning('Notification enroll_fundamentals failed for maestro %s: %s',
                               maestro.id, result.get('error'))
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


def reassign_person_father(person):
    from accounts.models import Role, Specialism, Adviser

    old_father = person.spiritual_father
    if not old_father:
        return False

    is_maestro = old_father.is_teacher()

    if is_maestro:
        maestro_role = Role.objects.get(name='Maestro')
        candidates = Adviser.objects.filter(
            roles__in=[maestro_role],
            is_active=True,
        ).exclude(id=old_father.id)
        if candidates.exists():
            new_father = candidates.first()
            person.spiritual_father = new_father
            person.assignment_state = 'assigned'
            person.save()
            from calls.models import Call, CallDetail
            from django.utils import timezone
            from datetime import timedelta
            pending = CallDetail.objects.filter(
                call__person=person, made=False
            ).select_related('call').order_by('call__call_number').first()
            if pending:
                pending.made_by = new_father
                pending.scheduled_date = timezone.now() + timedelta(minutes=4)
                pending.save()
            else:
                existing_count = Call.objects.filter(person=person).count()
                if existing_count < 3:
                    call = Call.objects.create(person=person, call_number=existing_count + 1)
                    CallDetail.objects.create(
                        call=call,
                        made_by=new_father,
                        scheduled_date=timezone.now() + timedelta(minutes=4)
                    )
            return True
        else:
            person.spiritual_father = None
            person.assignment_state = 'pending'
            person.save()
            return False

    spec_name = SPECIALISM_MAP.get(person.specialism, 'Normal')
    person_gender = person.gender or (person.registered_by.profile.gender if person.registered_by else None)

    try:
        specialism_obj = Specialism.objects.get(name=spec_name, is_active=True)
    except Specialism.DoesNotExist:
        if old_father:
            old_father.assigned_count = max(0, old_father.assigned_count - 1)
            old_father.save()
        person.spiritual_father = None
        person.assignment_state = 'pending'
        person.save()
        return False

    role_sf = Role.objects.get(name='Padre Espiritual')
    candidates = Adviser.objects.filter(
        roles__in=[role_sf],
        specialism=specialism_obj,
        is_active=True,
        assigned_count__lt=3,
        profile__gender=person_gender,
    ).exclude(id=old_father.id if old_father else -1)

    if candidates.exists():
        new_father = candidates.first()
        if old_father:
            old_father.assigned_count = max(0, old_father.assigned_count - 1)
            old_father.save()
            from notifications.services import OpenWAService
            result = OpenWAService().notify_unassignment(old_father, person)
            if not result.get('success'):
                logger.warning('Notification unassignment (reassign) failed for old_father %s: %s',
                               old_father.id, result.get('error'))
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
            pending.scheduled_date = timezone.now() + timedelta(minutes=4)
            pending.save()
        else:
            existing_count = Call.objects.filter(person=person).count()
            if existing_count < 3:
                call = Call.objects.create(person=person, call_number=existing_count + 1)
                CallDetail.objects.create(
                    call=call,
                    made_by=new_father,
                    scheduled_date=timezone.now() + timedelta(minutes=4)
                )

        from notifications.services import OpenWAService
        detail_obj = pending or CallDetail.objects.filter(call__person=person, made=False).first()
        if detail_obj:
            result = OpenWAService().notify_assignment(new_father, person, detail_obj)
            if not result.get('success'):
                logger.warning('Notification reassign failed for adviser %s: %s',
                               new_father.id, result.get('error'))
        return True
    else:
        if old_father:
            old_father.assigned_count = max(0, old_father.assigned_count - 1)
            old_father.save()
        person.spiritual_father = None
        person.assignment_state = 'pending'
        person.save()
        return False

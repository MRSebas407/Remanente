import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS, BasePermission
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from config.pagination import FlexiblePageNumberPagination
from .models import Call, CallDetail
from .serializers import CallSerializer, CallDetailSerializer

logger = logging.getLogger(__name__)


class IsAdminOrSpiritualFather(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            adviser = request.user.register_profile.adviser_profile
            if adviser.is_admin():
                return True
            if adviser.is_spiritual_father() and request.method in SAFE_METHODS + ('POST', 'PUT', 'PATCH'):
                return True
            return False
        except:
            return False


class CallViewSet(viewsets.ModelViewSet):
    queryset = Call.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrSpiritualFather]

    def create(self, request, *args, **kwargs):
        try:
            adviser = request.user.register_profile.adviser_profile
            if not adviser.is_admin():
                return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
        except:
            return Response(status=status.HTTP_403_FORBIDDEN)

        from .serializers import CallCreateSerializer
        serializer = CallCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        person = serializer.validated_data['person']

        # Si es un reinicio de seguimiento para persona no efectiva:
        # borrar llamadas anteriores y reactivar
        if person.member_state == 'not_effective' and not person.is_active:
            person.calls.all().delete()
            person.is_active = True
            person.assignment_state = 'assigned'
            person.save(update_fields=['is_active', 'assignment_state'])

        call = Call.objects.create(
            person=person,
            call_number=serializer.validated_data['call_number'],
        )
        CallDetail.objects.create(
            call=call,
            made_by=serializer.validated_data['made_by'],
            scheduled_date=serializer.validated_data['scheduled_date'],
        )
        return Response(CallSerializer(call).data, status=status.HTTP_201_CREATED)

    def get_serializer_class(self):
        return CallSerializer

    def get_queryset(self):
        qs = Call.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            qs = qs.filter(person_id=person_id)
        return qs

    @action(detail=True, methods=['post'])
    def record_call(self, request, pk=None):
        call = self.get_object()
        detail = call.details.filter(made=False).first()
        if not detail:
            return Response({'error': 'No hay detalle pendiente para esta llamada'}, status=status.HTTP_400_BAD_REQUEST)

        adviser = request.user.register_profile.adviser_profile
        data = request.data.copy() if request.data else {}

        serializer = CallDetailSerializer(detail, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(made=True, date_made=timezone.now())

        if 'signature' not in request.data and adviser.signature:
            try:
                from django.core.files.base import ContentFile
                adviser.signature.open()
                content = adviser.signature.read()
                adviser.signature.close()
                detail.signature.save('signature.png', ContentFile(content))
                detail.save(update_fields=['signature'])
            except Exception as e:
                logger.warning(f'Could not copy adviser signature: {e}')

        warnings = []
        person = call.person
        state = serializer.validated_data.get('state', detail.state)

        # Solo crear siguiente llamada si fue efectiva
        next_delay = None
        if state == 'effective' and call.call_number < 3:
            next_number = call.call_number + 1
            delay = timedelta(minutes=10) if next_number == 2 else timedelta(minutes=15)
            next_delay = delay
            next_call = Call.objects.create(person=person, call_number=next_number)
            CallDetail.objects.create(
                call=next_call,
                made_by=detail.made_by,
                scheduled_date=timezone.now() + delay
            )

        if call.call_number in (1, 2):
            from notifications.services import OpenWAService
            recipient = person.spiritual_father or adviser
            logger.info('Sending call_recorded notification for call #%s to phone: %s (recipient %s)',
                        call.call_number, recipient.profile.phone, recipient.id)
            result = OpenWAService().notify_call_recorded(adviser, person, call.call_number, next_delay)
            if not result.get('success'):
                logger.warning('Notification record_call #%s failed for adviser %s: %s',
                               call.call_number, adviser.id, result.get('error'))
                warnings.append(f'No se pudo enviar notificación WhatsApp: {result.get("error")}')

        # La llamada #3 determina el estado final de la persona
        if call.call_number == 3:
            if state == 'effective':
                person.member_state = 'effective'
                if person.spiritual_father:
                    person.spiritual_father.assigned_count = max(0, person.spiritual_father.assigned_count - 1)
                    person.spiritual_father.save()
                person.save()
                from notifications.services import OpenWAService
                recipient = person.spiritual_father or adviser
                logger.info('Sending third_call_completed notification to phone: %s (recipient %s)',
                            recipient.profile.phone, recipient.id)
                result = OpenWAService().notify_third_call_completed(adviser, person)
                if not result.get('success'):
                    logger.warning('Notification third_call_completed failed for adviser %s: %s',
                                   adviser.id, result.get('error'))
                    warnings.append(f'No se pudo enviar notificación WhatsApp: {result.get("error")}')
            else:
                person.member_state = 'not_effective'
                person.assignment_state = 'deactivated'
                person.is_active = False
                if person.spiritual_father:
                    person.spiritual_father.assigned_count = max(0, person.spiritual_father.assigned_count - 1)
                    person.spiritual_father.save()
                    person.spiritual_father = None
                person.save()
                from notifications.services import OpenWAService
                result = OpenWAService().notify_call_recorded(adviser, person, call.call_number, None)
                if not result.get('success'):
                    logger.warning('Notification not_effective for call #%s failed for adviser %s: %s',
                                   call.call_number, adviser.id, result.get('error'))
                    warnings.append(f'No se pudo enviar notificación WhatsApp: {result.get("error")}')

        resp_data = serializer.data
        if detail.signature:
            resp_data['signature'] = request.build_absolute_uri(detail.signature.url)
        if warnings:
            resp_data['notification_warnings'] = warnings
        return Response(resp_data)

    @action(detail=False, methods=['get'])
    def pending_calls(self, request):
        user = request.user
        try:
            adviser = user.register_profile.adviser_profile
        except:
            return Response({'error': 'No eres asesor'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        if adviser.is_admin():
            details = CallDetail.objects.filter(
                made=False,
                scheduled_date__gte=now
            ).select_related('call', 'call__person')
        else:
            details = CallDetail.objects.filter(
                call__person__spiritual_father=adviser,
                made=False,
                scheduled_date__gte=now
            ).select_related('call', 'call__person')

        result = []
        for d in details:
            remaining = d.scheduled_date - now
            total = d.scheduled_date - d.call.created_in
            pct = remaining.total_seconds() / total.total_seconds() if total.total_seconds() > 0 else 0
            if pct > 0.5:
                color = 'green'
            elif pct > 0.25:
                color = 'yellow'
            elif pct > 0.0:
                color = 'orange'
            else:
                color = 'red'

            result.append({
                'detail_id': d.id,
                'call_id': d.call.id,
                'person_id': d.call.person.id,
                'person_name': f'{d.call.person.names} {d.call.person.lastname}',
                'call_number': d.call.call_number,
                'scheduled_date': d.scheduled_date,
                'created_in': d.call.created_in,
                'remaining_hours': remaining.total_seconds() / 3600,
                'color': color,
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def all_calls(self, request):
        user = request.user
        try:
            adviser = user.register_profile.adviser_profile
        except:
            return Response({'error': 'No eres asesor'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()

        if adviser.is_admin():
            details = CallDetail.objects.all().select_related('call', 'call__person', 'made_by', 'made_by__profile')
        else:
            details = CallDetail.objects.filter(
                call__person__spiritual_father=adviser,
                made_by=adviser,
            ).select_related('call', 'call__person')

        name = request.query_params.get('name')
        if name:
            terms = name.split()
            q = Q()
            for term in terms:
                q &= (Q(call__person__names__icontains=term) | Q(call__person__lastname__icontains=term))
            details = details.filter(q)

        made_by = request.query_params.get('made_by')
        if made_by:
            terms = made_by.split()
            q = Q()
            for term in terms:
                q &= (Q(made_by__profile__names__icontains=term) | Q(made_by__profile__last_name__icontains=term))
            details = details.filter(q)

        state_filter = request.query_params.get('state')
        if state_filter == 'pending':
            details = details.filter(made=False)
        elif state_filter == 'expired':
            details = details.filter(made=False, scheduled_date__lt=now)
        elif state_filter == 'effective':
            details = details.filter(made=True, state='effective')
        elif state_filter == 'not_effective':
            details = details.filter(made=True, state='not_effective')
        elif state_filter == 'made':
            details = details.filter(made=True)

        paginator = FlexiblePageNumberPagination()
        paginator.page_size = request.query_params.get('page_size', paginator.page_size)
        try:
            paginator.page_size = int(paginator.page_size)
        except (ValueError, TypeError):
            paginator.page_size = 20
        if paginator.page_size <= 0:
            paginator.page_size = paginator.max_page_size

        page = paginator.paginate_queryset(details, request)

        def _serialize(d):
            if d.made:
                color = 'green' if d.state == 'effective' else 'red'
            elif d.scheduled_date < now:
                color = 'red'
            else:
                remaining = d.scheduled_date - now
                total = d.scheduled_date - d.call.created_in
                pct = remaining.total_seconds() / total.total_seconds() if total.total_seconds() > 0 else 0
                if pct > 0.5:
                    color = 'green'
                elif pct > 0.25:
                    color = 'yellow'
                elif pct > 0.0:
                    color = 'orange'
                else:
                    color = 'red'

            return {
                'detail_id': d.id,
                'call_id': d.call.id,
                'person_id': d.call.person.id,
                'person_name': f'{d.call.person.names} {d.call.person.lastname}',
                'call_number': d.call.call_number,
                'scheduled_date': d.scheduled_date,
                'created_in': d.call.created_in,
                'date_made': d.date_made,
                'made': d.made,
                'state': d.state,
                'annotation': d.annotation,
                'signature': request.build_absolute_uri(d.signature.url) if d.signature else None,
                'made_by_id': d.made_by.id,
                'made_by_name': f'{d.made_by.profile.names} {d.made_by.profile.last_name}',
                'color': color,
            }

        if page is not None:
            result = [_serialize(d) for d in page]
            return paginator.get_paginated_response(result)

        result = [_serialize(d) for d in details]
        return Response(result)


class CallDetailViewSet(viewsets.ModelViewSet):
    queryset = CallDetail.objects.all()
    serializer_class = CallDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CallDetail.objects.all()
        call_id = self.request.query_params.get('call')
        if call_id:
            qs = qs.filter(call_id=call_id)
        user = self.request.user
        try:
            adviser = user.register_profile.adviser_profile
            if adviser.is_spiritual_father():
                qs = qs.filter(made_by=adviser)
        except:
            pass
        return qs

    def perform_update(self, serializer):
        old_state = serializer.instance.state
        detail = serializer.save()
        new_state = detail.state

        # Si cambió de no efectiva a efectiva, crear siguiente llamada si falta
        if old_state == 'not_effective' and new_state == 'effective':
            call = detail.call
            person = call.person
            call_number = call.call_number

            if call_number < 3:
                next_number = call_number + 1
                if not Call.objects.filter(person=person, call_number=next_number).exists():
                    delay = timedelta(minutes=10) if next_number == 2 else timedelta(minutes=15)
                    next_call = Call.objects.create(person=person, call_number=next_number)
                    CallDetail.objects.create(
                        call=next_call,
                        made_by=detail.made_by,
                        scheduled_date=timezone.now() + delay,
                    )
            elif call_number == 3:
                person.member_state = 'effective'
                person.is_active = True
                person.assignment_state = 'completed'
                if person.spiritual_father:
                    person.spiritual_father.assigned_count = max(0, person.spiritual_father.assigned_count - 1)
                    person.spiritual_father.save()
                person.save()

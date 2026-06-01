from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User, RegisterUser, Role, Specialism, Adviser
from .serializers import (
    UserSerializer, UserCreateSerializer, RoleSerializer,
    SpecialismSerializer, AdviserSerializer, AdviserListSerializer, LoginSerializer,
    ProfileSerializer,
)
from .permissions import IsAdmin, IsAdminOrRead


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        if not user:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            adviser = user.register_profile.adviser_profile
            if not adviser.is_active:
                return Response({'error': 'Tu cuenta está desactivada. Contacta al administrador.'}, status=status.HTTP_401_UNAUTHORIZED)
            role_name = ', '.join(adviser.roles.all().values_list('name', flat=True))
            adviser_id = adviser.id
            theme = user.register_profile.theme
            names = user.register_profile.names
            last_name = user.register_profile.last_name
        except:
            role_name = None
            adviser_id = None
            theme = 'light'
            names = None
            last_name = None
        refresh = RefreshToken.for_user(user)
        photo_url = request.build_absolute_uri(user.register_profile.photo.url) if user.register_profile.photo else None
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': role_name,
                'adviser_id': adviser_id,
                'must_change_password': user.must_change_password,
                'theme': theme,
                'photo': photo_url,
                'names': names,
                'last_name': last_name,
            }
        })

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class AdviserViewSet(viewsets.ModelViewSet):
    queryset = Adviser.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrRead]

    def get_serializer_class(self):
        if self.action == 'list':
            return AdviserListSerializer
        return AdviserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.exclude(roles__name='Administrador').prefetch_related('roles').distinct()
        search = self.request.query_params.get('search')
        name = self.request.query_params.get('name')
        document = self.request.query_params.get('document')
        phone = self.request.query_params.get('phone')
        role_name = self.request.query_params.get('role_name')
        is_active = self.request.query_params.get('is_active')
        if search:
            qs = qs.filter(
                Q(profile__names__icontains=search) |
                Q(profile__last_name__icontains=search) |
                Q(profile__document__icontains=search) |
                Q(profile__phone__icontains=search) |
                Q(roles__name__icontains=search)
            )
        if name:
            qs = qs.filter(
                Q(profile__names__icontains=name) |
                Q(profile__last_name__icontains=name)
            )
        if document:
            qs = qs.filter(profile__document__icontains=document)
        if phone:
            qs = qs.filter(profile__phone__icontains=phone)
        if role_name:
            qs = qs.filter(roles__name__icontains=role_name)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        from persons.models import Person, SPECIALISM_MAP as PERS_SPEC_MAP
        from persons.views import reassign_person_father

        adviser = self.get_object()
        adviser.is_active = False
        adviser.save(update_fields=['is_active'])

        assigned_persons = Person.objects.filter(
            spiritual_father=adviser,
            is_active=True,
            assignment_state='assigned',
        )
        reassigned = 0
        pending = 0
        for person in assigned_persons:
            result = reassign_person_father(person)
            if result:
                reassigned += 1
            else:
                pending += 1

        return Response({
            'message': 'Asesor desactivado correctamente',
            'reassigned': reassigned,
            'pending': pending,
        })

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        adviser = self.get_object()
        adviser.is_active = True
        adviser.save(update_fields=['is_active'])
        return Response({'message': 'Asesor activado correctamente'})

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        from django.contrib.auth.hashers import make_password
        adviser = self.get_object()
        user = adviser.profile.user
        new_password = adviser.profile.document
        user.password = make_password(new_password)
        user.must_change_password = True
        user.save(update_fields=['password', 'must_change_password'])
        return Response({'message': f'Contraseña restablecida a la cédula: {new_password}'})


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        obj = self.get_object()
        obj.is_active = False
        obj.save(update_fields=['is_active'])
        return Response({'message': 'Rol desactivado correctamente'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        obj = self.get_object()
        obj.is_active = True
        obj.save(update_fields=['is_active'])
        return Response({'message': 'Rol activado correctamente'})


class SpecialismViewSet(viewsets.ModelViewSet):
    queryset = Specialism.objects.all()
    serializer_class = SpecialismSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        obj = self.get_object()
        obj.is_active = False
        obj.save(update_fields=['is_active'])
        return Response({'message': 'Especialidad desactivada correctamente'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        obj = self.get_object()
        obj.is_active = True
        obj.save(update_fields=['is_active'])
        return Response({'message': 'Especialidad activada correctamente'})


class ProfileViewSet(viewsets.GenericViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return Adviser.objects.get(profile__user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        adviser = self.get_object()
        serializer = self.get_serializer(adviser)
        return Response(serializer.data)

    @me.mapping.put
    def me_put(self, request):
        return self._update_me(request)

    @me.mapping.patch
    def me_patch(self, request):
        return self._update_me(request)

    def _update_me(self, request):
        adviser = self.get_object()
        serializer = self.get_serializer(adviser, data=request.data, partial=request.method == 'PATCH')
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        from django.contrib.auth.hashers import make_password
        user = request.user
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not new_password or not confirm_password:
            return Response({'error': 'Ambos campos son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({'error': 'Las contraseñas no coinciden'}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        if len(new_password) < 8:
            errors.append('Mínimo 8 caracteres')
        if not any(c.isupper() for c in new_password):
            errors.append('Debe contener al menos una mayúscula')
        if not any(c.islower() for c in new_password):
            errors.append('Debe contener al menos una minúscula')
        if not any(c.isdigit() for c in new_password):
            errors.append('Debe contener al menos un número')
        if not any(c in '!@#$%^&*()_+-=[]{};\':"\\|,.<>/?`~' for c in new_password):
            errors.append('Debe contener al menos un carácter especial (!@#$%^&*)')
        if errors:
            return Response({'error': '; '.join(errors)}, status=status.HTTP_400_BAD_REQUEST)

        user.password = make_password(new_password)
        user.must_change_password = False
        user.save(update_fields=['password', 'must_change_password'])
        return Response({'message': 'Contraseña cambiada correctamente'})

from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.reverse import reverse


class RoleBasedRouter(DefaultRouter):
    def get_api_root_view(self, **kwargs):
        api_root_view = super().get_api_root_view(**kwargs)
        origin_root = api_root_view.cls

        class RoleBasedAPIRoot(origin_root):
            def get(self, request, *args, **kwargs):
                data = {}
                role_name = None
                try:
                    adviser = request.user.register_profile.adviser_profile
                    role_name = adviser.role.name
                except Exception:
                    role_name = None

                is_auth = request.user.is_authenticated

                for key, url_name in self.api_root_dict.items():
                    if role_name == 'Administrador':
                        use_entry = True
                    elif role_name == 'Padre Espiritual':
                        hidden = ['advisers', 'roles', 'users', 'dashboard']
                        use_entry = key not in hidden
                    elif role_name == 'Maestro':
                        allowed = ['specialisms', 'countries', 'cities',
                                   'neighborhoods', 'services',
                                   'baptisms', 'attendants',
                                   'calendars', 'modes', 'classes']
                        use_entry = key in allowed
                    elif is_auth:
                        use_entry = True
                    else:
                        use_entry = key == 'auth'

                    if use_entry:
                        data[key] = reverse(url_name, request=request, format=kwargs.get('format'))

                if not is_auth:
                    data['_login'] = request.build_absolute_uri('/api-auth/login/')

                return Response(data)

        return RoleBasedAPIRoot.as_view()

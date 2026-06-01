from rest_framework.routers import DefaultRouter, APIRootView
from rest_framework.response import Response
from rest_framework.reverse import reverse
from django.urls import NoReverseMatch


class RoleBasedRouter(DefaultRouter):
    def get_api_root_view(self, api_urls=None):
        api_root_dict = {}
        list_name = self.routes[0].name
        for prefix, viewset, basename in self.registry:
            api_root_dict[prefix] = list_name.format(basename=basename)

        class RoleBasedAPIRootView(APIRootView):
            def get(self, request, *args, **kwargs):
                data = {}
                role_names = []
                try:
                    adviser = request.user.register_profile.adviser_profile
                    role_names = list(adviser.roles.values_list('name', flat=True))
                except Exception:
                    pass

                is_admin = 'Administrador' in role_names
                is_sf = 'Padre Espiritual' in role_names
                is_teacher = 'Maestro' in role_names
                is_auth = request.user.is_authenticated

                for key, url_name in self.api_root_dict.items():
                    if is_admin:
                        use_entry = True
                    elif is_auth:
                        if not (is_sf or is_teacher):
                            use_entry = True
                        else:
                            allowed = set()
                            if is_sf:
                                sf_forbidden = {'advisers', 'roles', 'users', 'dashboard'}
                                for k in self.api_root_dict:
                                    if k not in sf_forbidden:
                                        allowed.add(k)
                            if is_teacher:
                                teacher_allowed = {'specialisms', 'countries', 'cities',
                                                   'neighborhoods', 'services',
                                                   'baptisms', 'attendants',
                                                   'calendars', 'modes', 'classes'}
                                allowed.update(teacher_allowed)
                            use_entry = key in allowed
                    else:
                        use_entry = key == 'auth'

                    if use_entry:
                        try:
                            data[key] = reverse(url_name, request=request, format=kwargs.get('format'))
                        except NoReverseMatch:
                            continue

                if not is_auth:
                    data['_login'] = request.build_absolute_uri('/api-auth/login/')

                return Response(data)

        return RoleBasedAPIRootView.as_view(api_root_dict=api_root_dict)

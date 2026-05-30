from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import get_dashboard_data, get_adviser_stats
from accounts.permissions import IsAdmin


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'report':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def list(self, request):
        return self.report(request)

    @action(detail=False, methods=['get'])
    def report(self, request):
        period = request.query_params.get('period', 'monthly')
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        data = get_dashboard_data(
            start_date=start,
            end_date=end,
            period=period,
        )
        return Response(data)

    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        try:
            adviser = request.user.register_profile.adviser_profile
        except:
            return Response({'error': 'No eres asesor'}, status=403)
        admin = adviser.role.name == 'Administrador'
        data = get_adviser_stats(None if admin else adviser)
        return Response(data)

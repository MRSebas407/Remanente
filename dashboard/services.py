from django.utils import timezone, dateparse
from datetime import timedelta, datetime
from django.db.models import Count, Q
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from persons.models import Person
from calls.models import Call, CallDetail
from baptisms.models import BaptismalRegister

TRUNC_MAP = {
    'weekly': TruncDate,
    'monthly': TruncMonth,
    'annual': TruncYear,
}


def get_dashboard_data(start_date=None, end_date=None, period='monthly'):
    now = timezone.now()

    # --- resolve start_date ---------------------------------------------------
    if not start_date:
        if period == 'weekly':
            start_date = now - timedelta(days=7)
        elif period == 'monthly':
            start_date = now - timedelta(days=30)
        elif period == 'annual':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)

    if isinstance(start_date, str):
        p = dateparse.parse_date(start_date)
        start_dt = datetime.combine(p, datetime.min.time()).replace(tzinfo=timezone.get_current_timezone()) if p else start_date
    elif isinstance(start_date, datetime):
        start_dt = start_date
    else:
        start_dt = start_date

    # --- resolve end_date -----------------------------------------------------
    if not end_date:
        end_dt = now
    elif isinstance(end_date, str):
        p = dateparse.parse_date(end_date)
        if p:
            # end_date inclusive → exclusive upper bound = < next day 00:00:00
            end_dt = datetime.combine(p + timedelta(days=1), datetime.min.time()).replace(tzinfo=timezone.get_current_timezone())
        else:
            end_dt = end_date
    elif isinstance(end_date, datetime):
        end_dt = end_date
    else:
        end_dt = end_date

    qs = Person.objects.filter(
        register_date__gte=start_dt,
        register_date__lt=end_dt,
    )

    total = qs.count()
    new_count = qs.exclude(specialism='other_church').count()
    effective = qs.filter(member_state='effective').count()
    baptized = qs.filter(baptized=True).count()

    trunc_fn = TRUNC_MAP.get(period, TruncDate)

    trend = (
        qs
        .annotate(date=trunc_fn('register_date'))
        .values('date')
        .annotate(
            total=Count('id'),
            new_people=Count('id', filter=~Q(specialism='other_church')),
            effective=Count('id', filter=Q(member_state='effective')),
            baptized=Count('id', filter=Q(baptized=True)),
        )
        .order_by('date')
    )

    trend_data = [
        {
            'date': str(entry['date']),
            'total': entry['total'],
            'new_people': entry['new_people'],
            'effective': entry['effective'],
            'baptized': entry['baptized'],
        }
        for entry in trend
    ]

    return {
        'summary': {
            'total_registered': total,
            'new_people': new_count,
            'effective': effective,
            'baptized': baptized,
        },
        'trend': trend_data,
        'period': period,
        'start_date': start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date),
        'end_date': end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date),
    }


def get_adviser_stats(adviser):
    if adviser is None:
        persons = Person.objects.all()
        call_details = CallDetail.objects.filter(call__person__in=persons)
    else:
        persons = Person.objects.filter(spiritual_father=adviser)
        person_ids = persons.values_list('id', flat=True)
        call_details = CallDetail.objects.filter(
            call__person_id__in=person_ids,
            made_by=adviser,
        )

    pending_calls = call_details.filter(made=False, scheduled_date__gte=timezone.now()).count()
    expired_calls = call_details.filter(made=False, scheduled_date__lt=timezone.now()).count()
    made_calls = call_details.filter(made=True).count()
    effective_calls = call_details.filter(made=True, state='effective').count()
    not_effective_calls = call_details.filter(made=True, state='not_effective').count()

    total_assigned = persons.count()
    baptized = persons.filter(baptized=True).count()

    stats = {
        'total_assigned': total_assigned,
        'pending_calls': pending_calls,
        'expired_calls': expired_calls,
        'made_calls': made_calls,
        'effective_calls': effective_calls,
        'not_effective_calls': not_effective_calls,
        'baptized': baptized,
    }

    if adviser and adviser.role.name == 'Maestro':
        pending_baptism = persons.filter(
            baptized=False,
            enrollment_fund_1=True,
        ).count()
        registered_baptism = BaptismalRegister.objects.filter(
            person_id__in=person_ids,
            baptized=False,
        ).count()
        baptized_count = BaptismalRegister.objects.filter(
            person_id__in=person_ids,
            baptized=True,
        ).count()
        stats['pending_baptism'] = pending_baptism
        stats['registered_baptism'] = registered_baptism
        stats['baptized_baptism'] = baptized_count

    return stats

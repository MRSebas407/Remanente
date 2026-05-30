from django.db import migrations, models


def migrate_state_to_split(apps, schema_editor):
    Person = apps.get_model('persons', 'Person')
    for p in Person.objects.all():
        old = p.state
        if old == 'effective':
            p.assignment_state = 'assigned'
            p.member_state = 'effective'
        elif old == 'not_effective':
            p.assignment_state = 'assigned'
            p.member_state = 'not_effective'
        elif old == 'assigned':
            p.assignment_state = 'assigned'
            p.member_state = 'not_effective'
        elif old == 'unassigned':
            p.assignment_state = 'unassigned'
            p.member_state = 'not_effective'
        else:
            p.assignment_state = 'pending'
            p.member_state = 'not_effective'
        p.save()


def reverse_func(apps, schema_editor):
    Person = apps.get_model('persons', 'Person')
    for p in Person.objects.all():
        asgn = p.assignment_state
        mem = p.member_state
        if mem == 'effective':
            p.state = 'effective'
        elif asgn == 'assigned':
            p.state = 'assigned'
        elif asgn == 'unassigned':
            p.state = 'unassigned'
        else:
            p.state = 'pending'
        p.save()


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0005_remove_person_comes_from_remove_person_is_young_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='person',
            name='assignment_state',
            field=models.CharField(choices=[('pending', 'Pendiente'), ('assigned', 'Asignado'), ('unassigned', 'Sin Asignar')], default='pending', max_length=20),
        ),
        migrations.AddField(
            model_name='person',
            name='member_state',
            field=models.CharField(choices=[('effective', 'Efectivo'), ('not_effective', 'No Efectivo')], default='not_effective', max_length=20),
        ),
        migrations.RunPython(migrate_state_to_split, reverse_func),
        migrations.RemoveField(
            model_name='person',
            name='state',
        ),
    ]

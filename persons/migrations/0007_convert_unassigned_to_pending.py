from django.db import migrations


def convert_unassigned_to_pending(apps, schema_editor):
    Person = apps.get_model('persons', 'Person')
    Person.objects.filter(assignment_state='unassigned').update(assignment_state='pending')


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0006_remove_person_state_person_assignment_state_and_more'),
    ]

    operations = [
        migrations.RunPython(convert_unassigned_to_pending, migrations.RunPython.noop),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0002_person_gender'),
    ]

    operations = [
        migrations.AddField(
            model_name='person',
            name='is_from_other_church',
            field=models.BooleanField(default=False),
        ),
    ]

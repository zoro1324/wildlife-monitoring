from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0005_add_annotated_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="avatar",
            field=models.ImageField(blank=True, null=True, upload_to="avatars/%Y/%m/%d/"),
        ),
    ]

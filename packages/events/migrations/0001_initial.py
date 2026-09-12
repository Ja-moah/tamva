import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="OutboxEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("event_type", models.CharField(max_length=200)),
                ("event_version", models.PositiveIntegerField(default=1)),
                ("occurred_at", models.DateTimeField()),
                ("producer", models.CharField(max_length=100)),
                ("tenant_id", models.UUIDField(blank=True, db_index=True, null=True)),
                ("correlation_id", models.UUIDField(db_index=True, default=uuid.uuid4)),
                ("payload", models.JSONField()),
                ("published_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("attempts", models.PositiveIntegerField(default=0)),
                ("last_error", models.TextField(blank=True)),
            ],
            options={
                "ordering": ["occurred_at"],
                "indexes": [models.Index(fields=["published_at", "occurred_at"], name="events_outb_publish_763dd1_idx")],
            },
        )
    ]

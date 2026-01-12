from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'Wildlife Monitoring API'
    
    def ready(self):
        """Import signals when the app is ready."""
        import api.signals  # noqa: F401


"""
Django Admin configuration for the Wildlife Monitoring API.

Provides admin interfaces for managing:
- IoT Devices
- Device Tokens
- Images
- Animal Detections
- Alerts
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import IoTDevice, DeviceToken, Image, AnimalDetection, Alert


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    """Admin for DeviceToken model."""
    
    list_display = ['device', 'key_preview', 'is_active', 'created', 'last_used']
    list_filter = ['is_active', 'created']
    search_fields = ['device__device_id', 'key']
    readonly_fields = ['key', 'created', 'last_used']
    
    def key_preview(self, obj):
        """Show partial token for security."""
        if obj.key:
            return f"{obj.key[:8]}...{obj.key[-4:]}"
        return "-"
    key_preview.short_description = "Token"


class DeviceTokenInline(admin.StackedInline):
    """Inline admin for DeviceToken within IoTDevice."""
    model = DeviceToken
    can_delete = False
    readonly_fields = ['key', 'created', 'last_used']
    extra = 0


@admin.register(IoTDevice)
class IoTDeviceAdmin(admin.ModelAdmin):
    """Admin for IoTDevice model."""
    
    list_display = [
        'device_id', 'owner', 'status_badge', 'location_display',
        'last_seen', 'image_count', 'created'
    ]
    list_filter = ['status', 'created', 'owner']
    search_fields = ['device_id', 'owner__username', 'owner__email']
    readonly_fields = ['last_seen', 'created']
    list_select_related = ['owner']
    inlines = [DeviceTokenInline]
    
    fieldsets = (
        ('Device Information', {
            'fields': ('device_id', 'owner', 'status')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude')
        }),
        ('Timestamps', {
            'fields': ('last_seen', 'created'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status as colored badge."""
        colors = {
            'active': 'green',
            'offline': 'red',
            'maintenance': 'orange',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"
    
    def location_display(self, obj):
        """Display location as clickable Google Maps link."""
        return format_html(
            '<a href="https://maps.google.com/?q={},{}" target="_blank">'
            '📍 {:.4f}, {:.4f}</a>',
            obj.latitude, obj.longitude, obj.latitude, obj.longitude
        )
    location_display.short_description = "Location"
    
    def image_count(self, obj):
        """Display count of images from this device."""
        count = obj.images.count()
        return format_html('<strong>{}</strong>', count)
    image_count.short_description = "Images"


class AnimalDetectionInline(admin.TabularInline):
    """Inline admin for detections within Image."""
    model = AnimalDetection
    extra = 0
    readonly_fields = ['animal_type', 'confidence', 'threat_level', 'detected_at']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    """Admin for Image model."""
    
    list_display = [
        'id', 'device_link', 'image_preview', 'captured', 'source',
        'processed_badge', 'threat_badge', 'detection_count'
    ]
    list_filter = ['processed', 'animal_detected', 'threat_level', 'source', 'captured']
    search_fields = ['device__device_id', 'primary_animal']
    readonly_fields = [
        'image_preview_large', 'processed', 'animal_detected',
        'primary_animal', 'max_confidence', 'threat_level', 'created'
    ]
    list_select_related = ['device']
    inlines = [AnimalDetectionInline]
    date_hierarchy = 'captured'
    
    fieldsets = (
        ('Image Information', {
            'fields': ('device', 'image', 'image_preview_large', 'captured', 'source')
        }),
        ('Detection Summary', {
            'fields': ('processed', 'animal_detected', 'primary_animal', 'max_confidence', 'threat_level')
        }),
        ('Metadata', {
            'fields': ('created',),
            'classes': ('collapse',)
        }),
    )
    
    def device_link(self, obj):
        """Link to device admin."""
        return format_html(
            '<a href="/admin/api/iotdevice/{}/change/">{}</a>',
            obj.device.id, obj.device.device_id
        )
    device_link.short_description = "Device"
    
    def image_preview(self, obj):
        """Small image preview in list."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 80px; '
                'object-fit: cover; border-radius: 3px;"/>',
                obj.image.url
            )
        return "-"
    image_preview.short_description = "Preview"
    
    def image_preview_large(self, obj):
        """Large image preview in detail view."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 400px; max-height: 300px; '
                'object-fit: contain; border: 1px solid #ddd; border-radius: 5px;"/>',
                obj.image.url
            )
        return "-"
    image_preview_large.short_description = "Image Preview"
    
    def processed_badge(self, obj):
        """Display processed status as badge."""
        if obj.processed:
            return format_html(
                '<span style="color: green;">✓ Processed</span>'
            )
        return format_html(
            '<span style="color: orange;">⏳ Pending</span>'
        )
    processed_badge.short_description = "Status"
    
    def threat_badge(self, obj):
        """Display threat level as colored badge."""
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#dc3545',
        }
        color = colors.get(obj.threat_level, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_threat_level_display()
        )
    threat_badge.short_description = "Threat"
    
    def detection_count(self, obj):
        """Count of detections in this image."""
        return obj.detections.count()
    detection_count.short_description = "Detections"


@admin.register(AnimalDetection)
class AnimalDetectionAdmin(admin.ModelAdmin):
    """Admin for AnimalDetection model."""
    
    list_display = [
        'id', 'image_link', 'animal_type', 'confidence_display',
        'threat_badge', 'detected_at'
    ]
    list_filter = ['animal_type', 'threat_level', 'detected_at']
    search_fields = ['animal_type', 'image__device__device_id']
    readonly_fields = ['detected_at', 'bounding_box_display']
    list_select_related = ['image', 'image__device']
    date_hierarchy = 'detected_at'
    
    def image_link(self, obj):
        """Link to image admin."""
        return format_html(
            '<a href="/admin/api/image/{}/change/">Image #{}</a>',
            obj.image.id, obj.image.id
        )
    image_link.short_description = "Image"
    
    def confidence_display(self, obj):
        """Display confidence as percentage with bar."""
        percentage = obj.confidence * 100
        return format_html(
            '<div style="width: 100px; background: #eee; border-radius: 3px;">'
            '<div style="width: {}%; background: #007bff; height: 15px; '
            'border-radius: 3px; text-align: center; color: white; font-size: 10px;">'
            '{:.1f}%</div></div>',
            percentage, percentage
        )
    confidence_display.short_description = "Confidence"
    
    def threat_badge(self, obj):
        """Display threat level as colored badge."""
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#dc3545',
        }
        color = colors.get(obj.threat_level, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_threat_level_display()
        )
    threat_badge.short_description = "Threat"
    
    def bounding_box_display(self, obj):
        """Display bounding box as formatted JSON."""
        import json
        return format_html(
            '<pre style="background: #f5f5f5; padding: 10px; border-radius: 3px;">{}</pre>',
            json.dumps(obj.bounding_box, indent=2)
        )
    bounding_box_display.short_description = "Bounding Box"


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    """Admin for Alert model."""
    
    list_display = [
        'id', 'user', 'alert_type_badge', 'message_preview',
        'read_status', 'created'
    ]
    list_filter = ['alert_type', 'read', 'created']
    search_fields = ['user__username', 'message', 'image__device__device_id']
    readonly_fields = ['created', 'image_preview']
    list_select_related = ['user', 'image', 'image__device']
    date_hierarchy = 'created'
    actions = ['mark_as_read', 'mark_as_unread']
    
    fieldsets = (
        ('Alert Information', {
            'fields': ('user', 'alert_type', 'message')
        }),
        ('Related Image', {
            'fields': ('image', 'image_preview')
        }),
        ('Status', {
            'fields': ('read', 'created')
        }),
    )
    
    def alert_type_badge(self, obj):
        """Display alert type as badge."""
        colors = {
            'high_threat': '#dc3545',
            'repeated_detection': '#ffc107',
            'unusual_activity': '#17a2b8',
        }
        color = colors.get(obj.alert_type, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_alert_type_display()
        )
    alert_type_badge.short_description = "Type"
    
    def message_preview(self, obj):
        """Truncated message preview."""
        if len(obj.message) > 50:
            return f"{obj.message[:50]}..."
        return obj.message
    message_preview.short_description = "Message"
    
    def read_status(self, obj):
        """Display read status as icon."""
        if obj.read:
            return format_html('<span style="color: green;">✓ Read</span>')
        return format_html('<span style="color: red; font-weight: bold;">● Unread</span>')
    read_status.short_description = "Status"
    
    def image_preview(self, obj):
        """Image preview in detail view."""
        if obj.image and obj.image.image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 200px; '
                'object-fit: contain; border: 1px solid #ddd; border-radius: 5px;"/>',
                obj.image.image.url
            )
        return "-"
    image_preview.short_description = "Related Image"
    
    @admin.action(description="Mark selected alerts as read")
    def mark_as_read(self, request, queryset):
        updated = queryset.update(read=True)
        self.message_user(request, f"{updated} alerts marked as read.")
    
    @admin.action(description="Mark selected alerts as unread")
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(read=False)
        self.message_user(request, f"{updated} alerts marked as unread.")


# Customize admin site header
admin.site.site_header = "Wildlife Monitoring System"
admin.site.site_title = "Wildlife Admin"
admin.site.index_title = "System Administration"


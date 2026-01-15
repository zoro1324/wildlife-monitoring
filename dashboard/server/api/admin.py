from django.contrib import admin
from .models import Device, DeviceMessage, CapturedImage, UserProfile


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("device_id", "lat", "lon", "owned_by", "created_at", "updated_at")
    search_fields = ("device_id",)
    list_filter = ("created_at", "owned_by")
    readonly_fields = ("created_at", "updated_at")


@admin.register(DeviceMessage)
class DeviceMessageAdmin(admin.ModelAdmin):
    list_display = ("device", "message", "timestamp")
    search_fields = ("device__device_id", "message")
    list_filter = ("timestamp", "device")
    readonly_fields = ("timestamp",)


@admin.register(CapturedImage)
class CapturedImageAdmin(admin.ModelAdmin):
    list_display = ("device", "animal_type", "confidence", "timestamp")
    search_fields = ("device__device_id", "animal_type")
    list_filter = ("animal_type", "timestamp", "device")
    readonly_fields = ("timestamp",)
    fields = ("device", "image", "animal_type", "confidence", "timestamp")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "mobile_number", "home_lat", "home_lon")
    search_fields = ("user__username", "mobile_number")
    list_filter = ("user__is_active",)

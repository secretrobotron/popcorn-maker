from storage.models import Project
from django.contrib import admin

"""
class TrackEventInline(admin.TabularInline):
  model = TrackEvent
  extra = 3

class TrackInline(admin.StackedInline):
  model = Track
  extra = 3

class MediaInline(admin.StackedInline):
  model = Media
  extra =2 

class TargetInline(admin.StackedInline):
  model = Target 
  extra = 3 
class ProjectAdmin(admin.ModelAdmin):
  inlines = [MediaInline, TargetInline]
class MediaAdmin(admin.ModelAdmin):
  inlines = [TrackInline]
class TrackAdmin(admin.ModelAdmin):
  inlines = [TrackEventInline]
class TrackEventAdmin(admin.ModelAdmin):
  inlines = []
class TargetAdmin(admin.ModelAdmin):
  inlines = []

admin.site.register(Project, ProjectAdmin)
admin.site.register(Media, MediaAdmin)
admin.site.register(Track, TrackAdmin)
admin.site.register(TrackEvent, TrackEventAdmin)
admin.site.register(Target, TargetAdmin)
"""

admin.site.register(Project)

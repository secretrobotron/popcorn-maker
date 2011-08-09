from django.conf.urls.defaults import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    (r'^storage$', 'storage.views.index'),
    (r'^storage/projects$', 'storage.views.index'),
    (r'^storage/projects/$', 'storage.views.index'),
    (r'^storage/projects/s/(?P<data>.+)', 'storage.views.save'),
    (r'^storage/projects/s/(?P<project_id>\d+)/(?P<data>.+)', 'storage.views.save'),
    (r'^storage/projects/(?P<project_id>\d+)/$', 'storage.views.detail'),
    # url(r'^$', 'pmserver.views.home', name='home'),
    # url(r'^pmserver/', include('pmserver.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

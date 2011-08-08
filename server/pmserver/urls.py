from django.conf.urls.defaults import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^storage$', 'storage.views.index', name='index'),
    (r'^storage/projects$', 'storage.views.index'),
    (r'^storage/projects/$', 'storage.views.index'),
    (r'^storage/projects/(?P<project_id>\d+)/$', 'storage.views.detail'),
    # url(r'^$', 'pmserver.views.home', name='home'),
    # url(r'^pmserver/', include('pmserver.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

from django.http import HttpResponse, HttpResponseRedirect
from storage.models import Project
from django.shortcuts import render_to_response
from django.core.urlresolvers import reverse
from urllib import unquote_plus

def index(request):
  projects = Project.objects.all()
  return render_to_response('projects.html', {
    'projects': projects
  })

def detail(request, project_id):
    projects = Project.objects.filter(id=project_id)
    if len(projects) > 0:
      project = projects[0]
      return HttpResponse(project.get_json())
    return HttpResponse("")

def save_new(request, data=None):
  save(request, None, data)

def save(request, project_id=None, data=None):
  project = None

  if project_id != None:
    projects = Project.objects.filter(id=project_id)
    if len(projects) != 0:
      project = projects[0]
  else:
    project = Project()
    
  if project != None:
    json_input = unquote_plus(data)
    project.put_json(json_input)

    return HttpResponseRedirect(reverse('storage.views.detail', args=(project.id,)))

  return HttpResponseRedirect(reverse('storage.views.index'))

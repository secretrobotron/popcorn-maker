from django.http import HttpResponse
from storage.models import Project, Target, Track, TrackEvent, Media
#from django.template import Context, loader
from django.shortcuts import render_to_response
import json

def index(request):
  projects = Project.objects.all()
  return render_to_response('projects.html', {
    'projects': projects
  })
  #template = loader.get_template('projects.html')
  #context = Context({
  #  'projects': projects
  #})
  #return HttpResponse(template.render(context))

def detail(request, project_id):
    projects = Project.objects.filter(id=project_id)
    if len(projects) > 0:
      project = projects[0]
      return HttpResponse(json.dumps(project.get_json()))
    return HttpResponse("")

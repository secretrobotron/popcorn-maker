from django.db import models

class Project(models.Model):
  name = models.CharField(max_length=250)
  store_date = models.DateTimeField('date stored')

  def __unicode__(self):
    return str(self.store_date)

  def get_json(self):

    medias = Media.objects.filter(project=self.id)
    media_json = []
    for media in medias:
      media_json.append(media.get_json())

    targets = Target.objects.filter(project=self.id)
    target_json = []
    for target in targets:
      target_json.append(target.get_json())

    return {
      'name': self.name,
      'date': str(self.store_date),
      'media': media_json,
      'targets': target_json
    }

class Blob(models.Model):
  project = models.ForeignKey(Project)
  data = models.CharField(max_length=2500)

  def __unicode__(self):
    return str(data)

class Target(models.Model):
  name = models.CharField(max_length=250)
  project = models.ForeignKey(Project)

  def __unicode__(self):
    return self.name

  def get_json(self):
    return {
      'name': self.name
    }


class Media(models.Model):
  project = models.ForeignKey(Project)
  name = models.CharField(max_length=250)

  def __unicode__(self):
    return self.name

  def get_json(self):
    tracks_json = []
    tracks = Track.objects.filter(media=self.id)
    for track in tracks:
      tracks_json.append(track.get_json())

    return {
      'name': self.name,
      'tracks': tracks_json
    }

class Track(models.Model):
  media = models.ForeignKey(Media)
  name = models.CharField(max_length=250)
  target = models.ForeignKey(Target)

  def __unicode__(self):
    return self.name

  def get_json(self):
    track_events_json = []
    track_events = TrackEvent.objects.filter(track=self.id)
    for track_event in track_events:
      track_events_json.append(track_event.get_json())

    return {
      'name': self.name,
      'trackEvents': track_events_json
    }


class TrackEvent(models.Model):
  track = models.ForeignKey(Track)
  name = models.CharField(max_length=250)
  properties = models.CharField(max_length=250)
  target = models.ForeignKey(Target)

  def __unicode__(self):
    return self.name

  def get_json(self):
    return {
      'name': self.name
    }


from django.db import models
import datetime

class Project(models.Model):
  data = models.CharField(max_length=2500)
  store_date = models.DateTimeField('date stored')

  def __unicode__(self):
    return str(self.store_date)

  def get_json(self):
    return self.data

  def put_json(self, data):
    self.data = data
    self.store_date = datetime.datetime.now()
    self.save()

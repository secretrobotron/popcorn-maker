from twisted.web.server import Site
from twisted.application.internet import TCPServer
from twisted.web.resource import Resource
from twisted.python.log import LogPublisher
from twisted.web import proxy, http
from recaptcha.client import captcha
import json
import os

class TemplateServer( TCPServer ):
  port = 9001
  captcha_public_key = "6Ld0hcUSAAAAAKMAdCZhi7Juv4nU6JsFIehmO83t"
  captcha_private_key = "6Ld0hcUSAAAAANT9Xhsrt608CgujtENLLAyLJT-N"
  log = None
  template_dir = "../layouts"
  templates = [
    "custom/default.html",
    "basic/default-basic.html"
  ]

  @classmethod
  def jsonp( cls, request, string ):
    callback = request.args[ 'callback' ][ 0 ]
    safe_string = string.replace( "\n", "\\\n" )
    safe_string = safe_string.replace( "\'", "\\\'" )
    safe_string = safe_string.replace( "\"", "\\\"" )
    return callback + "('" + safe_string + "')";

  class WelcomeResource( Resource ):
    def __init__( self, server ):
      self.server = server
      self.log = server.log
      Resource.__init__( self )
    def render( self, request ):
      return "Popcorn Maker Server v0.1"

  class CaptchaResource( Resource ):
    def __init__( self, server ):
      self.log = server.log
      Resource.__init__( self )
    def render( self, request ):
      head = """<!doctype html>
        <html>
          <head>
            <style>
              html, body { width: 100%; height: 100%; overflow: none; }
              div { margin: auto; width: 300px; }
              div input { float: right; }
            </style>
          </head>
          <body>
            <div>
              <form method="post" action="http://localhost:9001/submit">
        """
      foot = """
                <input type="submit" value="Submit" />
              </form>
            </div>
          </body>
        </html>"""
      return head + captcha.displayhtml( TemplateServer.captcha_public_key ) + foot

  class TemplatePackagerResource( Resource ):
    def __init__( self, server ):
      self.log = server.log
      self.server = server
      Resource.__init__( self )
    def package( self, request ):
      try:
        response = captcha.submit(
          request.args['recaptcha_challenge_field'][ 0 ],
          request.args['recaptcha_response_field'][ 0 ],
          TemplateServer.captcha_private_key,
          self.server.getPeer(),
        )
        if not response.is_valid:
          return TemplateServer.jsonp( request, "Error: Captcha is invalid." )
        else:
          project = json.loads( request.args[ "project" ][ 0 ] )
          template = project[ "layout" ]
          html = request.args[ "html" ][ 0 ]
          if template in TemplateServer.templates:
            template_path = TemplateServer.template_dir + "/" + template
            if os.path.exists( template_path ):
              return TemplateServer.jsonp( request, "Hooray!" )
          else:
            return TemplateServer.jsonp( request, "Error: Template " + str( template ) + " not found." )
        return TemplateServer.jsonp( request, "Error: Unknown error." )
      except KeyError:
        return TemplateServer.jsonp( request, "Error: Bad arguments." )
    def render_GET( self, request ):
      return self.package( request )
    def render_POST( self, request ):
      return self.package( request )

  def __init__( self, log ):
    self.log = LogPublisher()
    self.log.addObserver( log.emit )
    self.log.msg( "Started TemplateServer" )

    root = Resource()
    root.putChild( "", TemplateServer.WelcomeResource( self ) )
    root.putChild( "submit", TemplateServer.TemplatePackagerResource( self ) )
    root.putChild( "captcha", TemplateServer.CaptchaResource( self ) )
    TCPServer.__init__( self, TemplateServer.port, Site( root ) )



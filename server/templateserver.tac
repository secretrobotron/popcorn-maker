from twisted.application import service
from templateserver import TemplateServer
from twisted.python.log import ILogObserver, FileLogObserver
from twisted.python.logfile import DailyLogFile

application = service.Application( "Popcorn Maker Template Server" )
logfile = DailyLogFile( "templateserver.log", "." )
observer = FileLogObserver( logfile )
application.setComponent( ILogObserver, observer.emit )
template_server = TemplateServer( observer )
template_server.setServiceParent( application )

(function (window, document, undefined, Butter, debug) {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  if ( !Butter ) {
    Butter = window.Butter = {};
  } //if

  function processStartEvent( e, callback ) {
    var message = Butter.parseCommEvent( e, window );
    if ( message && message.type === "setup" ) {
      callback( message );
    } //if
  };

  function bootStrapper( e ) {
    processStartEvent( e, function ( message ) {
      window.removeEventListener( 'message', bootStrapper, false );
      var link = new Butter.StandardLink({
        defaultMedia: message.message.defaultMedia,
        popcornUrl: message.message.popcornUrl,
      });
    });
  } //bootStrapper
  window.addEventListener( 'message', bootStrapper, false );

  Butter.Template = function( options ) {
    var that = this, 
    link,
    importData;

    options = options || {};

    window.removeEventListener( 'message', bootStrapper, false );

    function captureStartEvent( e ) {
      processStartEvent( e, function ( message ) {
        window.removeEventListener( 'message', captureStartEvent, false );
        link = new Butter.Link({
          defaultMedia: message.message.defaultMedia,
          popcornUrl: message.message.popcornUrl,
          onmediachanged: options.onmediachanged || function() {},
          onmediaadded: options.onmediaadded || function() {},
          onmediaremoved: options.onmediaremoved || function() {},
          onmediatimeupdate: options.onmediatimeupdate || function() {},
          onfetchhtml: options.onfetchhtml || function() {}
        });
        if ( options.onsetup ) {
          options.onsetup({
            importData: importData
          });
        }
      });
    } //captureStartEvent

    window.addEventListener( 'message', captureStartEvent, false );

    Object.defineProperty( this, "link", {
      get: function() {
        return link;
      }
    });

    if ( options.loadFromData ) {
      var scripts = document.getElementsByTagName( "script" );
      for ( var i=0; i<scripts.length; ++i ) {
        if ( scripts[ i ].getAttribute( "data-butter" ) === "project-data" ) {
          try {
            importData = JSON.parse( scripts[ i ].text );
            if ( importData.media ) {
              options.loadFromData( importData );
            } //if
          }
          catch( e ) {
            console.log( "Error: Couldn't load baked butter project data." );
            console.log( e );
          } //if
        } //if
      } //for
    } //if

  }; //Template

  var TemplateMedia = Butter.TemplateMedia = function ( mediaData ) {
    var that = this;
    this.url = mediaData.url;
    this.target = mediaData.target;
    this.id = mediaData.id;
    this.duration = 0;
    this.popcorn = undefined;

    var handlers = {};

    this.setupPopcornHandlers = function( comm ) {
      that.popcorn.media.addEventListener( "timeupdate", function() {
        comm.send( that.popcorn.media.currentTime, "mediatimeupdate" );                
      },false);
      that.popcorn.media.addEventListener( "pause", function() {
        comm.send( that.id, "mediapaused" );
      }, false);
      that.popcorn.media.addEventListener( "playing", function() {
        comm.send( that.id, "mediaplaying" );
      }, false);
    }; //setupPopcornHandlers

    this.generatePopcornString = function( options ) {
      var regexResult = urlRegex.exec( that.url ) || "",
          players = [],
          popcornString = "";

      options = options || {};

      players[ "youtu" ] = function() {
        return "var popcorn = Popcorn( Popcorn.youtube( '" + that.target + "', '" +
          that.url + "', {\n" + 
          "width: 430, height: 300\n" + 
        "} ) );\n";
      };

      players[ "vimeo " ] = function() {
        return "var popcorn = Popcorn( Popcorn.vimeo( '" + that.target + "', '" +
        that.url + "', {\n" +
          "css: {\n" +
            "width: '430px',\n" +
            "height: '300px'\n" +
          "}\n" +
        "} ) );\n";
      };

      players[ "soundcloud" ] = function() {
        return "var popcorn = Popcorn( Popcorn.soundcloud( '" + that.target + "'," +
        " '" + that.url + "' ) );\n";
      };

      players[ "baseplayer" ] = function() {
        return "var popcorn = Popcorn( Popcorn.baseplayer( '" + that.target + "' ) );\n";
      };

      players[ undefined ] = function() {
        var video, mediaElement = document.getElementById( that.target );
        if ( !mediaElement || [ 'AUDIO', 'VIDEO' ].indexOf( mediaElement.nodeName ) === -1 ) {
          video = document.createElement( "video" );
          var src = document.createElement( "source" );

          src.src = that.url;
          video.style.width = document.getElementById( that.target ).style.width;
          video.style.height = document.getElementById( that.target ).style.height;
          video.appendChild( src );
          video.controls = true;
          video.id = that.target + "-butter";

          document.getElementById( that.target ).appendChild( video );
        }
        else {
          video = mediaElement;
        } //if

        var vidId = "#" + video.id;

        return "var popcorn = Popcorn( '" + vidId + "');\n";
      }; 

      // call certain player function depending on the regexResult
      popcornString += players[ regexResult[ 1 ] ]();

      if ( that.popcorn ) {
        var trackEvents = that.popcorn.getTrackEvents();
        if ( trackEvents ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            var popcornOptions = trackEvents[ i ]._natives.manifest.options;
            popcornString += "popcorn." + trackEvents[ i ]._natives.type + "({";
            for ( var option in popcornOptions ) {
              if ( popcornOptions.hasOwnProperty( option ) ) {
                popcornString += option + ":'" + trackEvents[ i ][ option ] + "',";
              } //if
            } //for
          } //for trackEvents
          popcornString += "})";
        } //if trackEvents
      } //if popcorn

      var method = options.method || "inline";

      if ( method === "event" ) {
        popcornString = "document.addEventListener('DOMContentLoaded',function(e){" + popcornString;
        popcornString += "},false);";
      }
      else {
        popcornString = "(function() {" + popcornString + "})();";
      } //if

      return popcornString;
    }; //generatePopcornString

    this.play = function( message ) {
      that.popcorn.play();
    };

    this.pause = function( message ) {
      that.popcorn.pause();
    };

    this.mute = function( message ) {
      that.popcorn.mute( message );
    };

    this.clearPopcorn = function() {
      if ( that.popcorn ) {
        popcorn.removeInstance( this.popcorn );
      } //if
    }; //clearPopcorn

    this.createPopcorn = function() {
      var popcornScript = that.popcornScript = document.createElement( "script" );
      popcornScript.innerHTML = that.popcornString;
      document.head.appendChild( popcornScript );
      that.popcorn = window.Popcorn.instances[ window.Popcorn.instances.length - 1 ];
      that.Popcorn = window.Popcorn;
    }; //createPopcorn

    this.destroyPopcorn = function() {
      if ( that.popcornScript ) {
        document.head.removeChild( that.popcornScript );
      }
      that.popcornScript = undefined;
    }; //destroyPopcorn

    this.addHandlers = function( comm, options ) {
      for ( var name in options ) {
        if ( options.hasOwnProperty( name ) ) {
          handlers[ name ] = options[ name ];
          comm.listen( name, handlers[ name ] );
        } //if
      } //for
    }; //addHandlers

    this.removeHandlers = function( comm ) {
      for ( var name in handlers ) {
        if ( handlers.hasOwnProperty( name ) ) {
          comm.forget( name, handlers[ name ] );
          delete handlers[ name ];
        } //if
      } //for
    }; //removeHandlers

    this.waitForPopcorn = function( callback ) {
      var popcorn = that.popcorn;
      var checkMedia = function() {
        if( popcorn.media.readyState >= 2 || popcorn.media.duration > 0 ) {
          that.duration = popcorn.media.duration;
          callback( popcorn );
        } else {
          setTimeout( function() {
            checkMedia();
          }, 100);
        }
      }
      checkMedia();
    }; //waitForPopcorn

  }; //TemplateMedia

  Butter.Link = function( options ) {
    var medias = {};
    var originalBody, originalHead,
        currentMedia, popcornScript;
    var popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js",
        defaultMedia = options.defaultMedia,
        importData = options.importData,
        that = this,
        comm = new Butter.CommClient( "link" );

    var mediaChangedHandler = options.onmediachanged || function() {},
        mediaAddedHandler = options.onmediaadded || function() {},
        mediaTimeUpdateHandler = options.onmediatimeupdate || function() {},
        mediaRemovedHandler = options.onmediaremoved || function() {},
        fetchHTMLHandler = options.onfetchhtml || function() {};

    comm.listen( 'mediachanged', mediaChangedHandler );
    comm.listen( 'mediaadded', mediaAddedHandler );
    comm.listen( 'mediaremoved', mediaRemovedHandler );
    comm.listen( 'mediatimeupdate', mediaTimeUpdateHandler );
    
    comm.returnAsync( 'html', fetchHTMLHandler );

    Object.defineProperty( this, "comm", {
      get: function() {
        return comm;
      }
    });

    this.getHTML = function() {
      var html = document.createElement( "html" ),
          head = originalHead.cloneNode( true ),
          body = originalBody.cloneNode( true );
      for ( var media in medias ) {
        if ( medias.hasOwnProperty( media ) ) {
          var script = document.createElement( "script" );
          script.innerHTML = medias[ media ].generatePopcornString( { method: "event" } );
          head.appendChild( script );
        } //if
      } //for
      html.appendChild( head );
      html.appendChild( body );
      return "<!doctype html>\n<html>\n  <head>" + head.innerHTML + "</head>\n  <body>" + body.innerHTML + "</body>\n</html>";
    }; //getHTML

    this.sendMedia = function( media, registry ) {
      comm.send( {
        registry: registry || media.Popcorn.registry,
        id: media.id,
        duration: media.duration,
      }, "build" );
    }; //sendMedia

    this.sendImportData = function( importData ) {
      comm.send( importData, "importData" );
    }; //sendImportData

    this.scrape = function() {
      function bodyReady() {

        originalBody = document.body.cloneNode( true );
        originalHead = document.head.cloneNode( true );

        var importMedia;
        if ( importData ) {
          importMedia = importData.media;
        } //if

        function scrapeChildren( rootNode ) {

          var children = rootNode.children;

          for( var i=0; i<children.length; i++ ) {

            var thisChild = children[ i ];

            if ( !thisChild ) {
              continue;
            }

            // if DOM element has an data-butter tag that is equal to target or media,
            // add it to butters target list with a respective type
            if ( thisChild.getAttribute ) {
              if( thisChild.getAttribute( "data-butter" ) === "target" ) {
                comm.send( { 
                  name: thisChild.id, 
                  type: "target"
                }, "addtarget" );
              }
              else if( thisChild.getAttribute( "data-butter" ) === "media" ) {
                if ( ["VIDEO", "AUDIO"].indexOf( thisChild.nodeName ) > -1 ) {
                  
                  comm.send({
                    target: thisChild.id,
                    url: thisChild.currentSrc,
                  }, "addmedia" );
                }
                else {
                  var vidUrl = defaultMedia;

                  if ( thisChild.getAttribute( "data-butter-source" ) ) {
                    vidUrl = thisChild.getAttribute( "data-butter-source" );
                  }

                  if ( importMedia ) {
                    for ( var m=0; m<importMedia.length; ++m ) {
                      if ( thisChild.id === importMedia[ m ].target ) {
                        vidUrl = importMedia[ m ].url;
                      }
                    }
                  }

                  comm.send( { 
                    target: thisChild.id, 
                    url: vidUrl 
                  }, "addmedia" );

                }
              } // else 
            } //if

            if ( thisChild.children && thisChild.children.length > 0 ) {
              scrapeChildren( thisChild );
            } // if
          } // for

        } //scrapeChildren

        scrapeChildren( document.body );
        /*
        if ( importData ) {
          that.importProject( importData );
        }
        */

      } // bodyReady

      var tries = 0;
      function ensureLoaded() {

        function fail() {
          ++tries;
          if ( tries < 10 ) {
            setTimeout( ensureLoaded, 500 );
          }
          else {
            throw new Error("Couldn't load iframe. Tried desperately.");
          }
        } //fail

        var body = document.getElementsByTagName( "BODY" );
        if ( body.length < 1 ) {
          fail();
          return;
        }
        else {
          bodyReady();
          comm.send( "loaded", "loaded" );
        } // else
      } // ensureLoaded

      ensureLoaded();

    }; //scrape

    this.play = function() {
      currentMedia.popcorn.media.play();
    };

    this.isPlaying = function() {
      return currentMedia.popcorn.media.paused;
    };

    this.pause = function() {
      currentMedia.popcorn.media.pause();
    };
      
    this.mute = function() {
      currentMedia.popcorn.media.muted = !currentMedia.popcorn.media.muted;
    };

    Object.defineProperty( this, "currentMedia", {
      get: function() {
        return currentMedia;
      },
      set: function( val ) {
        currentMedia = val;
      }
    });

    this.getMedia = function( id ) {
      return medias[ id ];
    }; //getMedia

    this.addMedia = function( media ) {
      medias[ media.id ] = media;
    }; //addMedia

    this.removeMedia = function( media ) {
      delete medias[ media.id ];
    };

    comm.send( "setup", "setup" );

  }; //Link

  Butter.StandardLink = function( options ) {
    var link, comm, butterMapping = {};

    var trackEventAddedHandler = function( message ) {
      var media = link.currentMedia;
      media.popcorn[ message.type ]( message.popcornOptions );
      butterMapping[ message.id ] = media.popcorn.getLastTrackEventId();
    }; //trackEventAddedHandler

    var trackEventUpdatedHandler = function( message ) {
      var media = link.currentMedia;
      console.log( message.id, butterMapping[ message.id ], message );
      if ( butterMapping[ message.id ] ) {
        media.popcorn.removeTrackEvent( butterMapping[ message.id ] );
      }
      media.popcorn[ message.type ]( message.popcornOptions );
      butterMapping[ message.id ] = media.popcorn.getLastTrackEventId();
    }; //trackEventUpdatedHandler

    var trackEventRemovedHandler = function( message ) {
      var media = link.currentMedia;
      if ( butterMapping[ message.id ] ) {
        media.popcorn.removeTrackEvent( butterMapping[ message.id ] );
      }
    }; //trackEventRemovedHandler

    var mediaChangedHandler = function( message ) {
      if ( link.currentMedia ) {
        link.currentMedia.removeHandlers( comm );
      }
      var currentMedia = link.currentMedia = link.getMedia( message.id );
      if ( currentMedia ) {
        currentMedia.addHandlers( comm, {
          'trackeventadded': trackEventAddedHandler,
          'trackeventupdated': trackEventUpdatedHandler,
          'trackeventremoved': trackEventRemovedHandler,
          'play': currentMedia.play,
          'pause': currentMedia.pause,
          'mute': currentMedia.mute
        });
      }
    }; //mediaChangedHandler

    var mediaAddedHandler = function( message ) {
      if ( !link.getMedia( message.id ) ) {
        var media = new TemplateMedia( message );
        link.addMedia( media );
        buildMedia( media, function( media ) {
          link.sendMedia( media );
        });
      }
      else {
        console.log('media', message.id, 'already exists');
      }
    }; //mediaAddedHandler

    var mediaRemovedHandler = function( message ) {
      link.removeMedia( link.getMedia( message.id ) );
    }; //mediaRemovedHandler

    var mediaTimeUpdateHandler = function( message ) {
      link.currentMedia.popcorn.currentTime( message );
    }; //mediaTimeUpdateHandler

    var fetchHTMLHandler = function( message ) {
      return link.getHTML();
    }; //fetchHTMLHandler

    link = new Butter.Link({
      onmediachanged: mediaChangedHandler,
      onmediaadded: mediaAddedHandler,
      onmediaremoved: mediaRemovedHandler,
      onmediatimeupdate: mediaTimeUpdateHandler,
      onfetchhtml: fetchHTMLHandler,
      defaultMedia: options.defaultMedia,
      importData: options.importData,
      popcornUrl: options.popcornUrl
    });
    comm = link.comm;

    var buildMedia = function( media, callback ) {

      function isPopcornReady( e, readyCallback ) {
        if ( !window.Popcorn ) {
          setTimeout( function() {
            isPopcornReady( e, readyCallback );
          }, 1000 );
        }
        else {
          readyCallback();
        } //if
      } //isPopcornReady

      function popcornIsReady() {
        media.clearPopcorn();
        media.destroyPopcorn();
        if ( media.target ) {
          document.getElementById( media.target ).innerHTML = "";
        } //if
        media.popcornString = media.generatePopcornString();
        media.createPopcorn();
        media.waitForPopcorn( function( popcorn ) {
          media.setupPopcornHandlers( comm );
          link.sendMedia( media );
        });
      } //popcornIsReady

      if ( !window.Popcorn ) {
        insertPopcorn();
        isPopcornReady( null, popcornIsReady );
      }
      else {
        popcornIsReady();
      } //if

    }; //buildMedia

    var insertPopcorn = function() {
      var popcornSourceScript = document.createElement( "script" );
      popcornSourceScript.src = popcornUrl;
      document.head.appendChild( popcornSourceScript );
    }; //insertPopcorn

    link.scrape();

  } //StandardLink

})(window, window.document, undefined, window.Butter, window.debug);

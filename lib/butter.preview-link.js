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
        importData: message.message.importData,
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
          importData: message.message.importData,
          popcornUrl: message.message.popcornUrl,
          onmediachanged: options.onmediachanged || function() {},
          onmediaadded: options.onmediaadded || function() {},
          onmediaremoved: options.onmediaremoved || function() {},
          onmediatimeupdate: options.onmediatimeupdate || function() {},
          onmediacontentchanged: options.onmediacontentchanged || function() {},
          onfetchhtml: options.onfetchhtml || function() {}
        });
        if ( options.onsetup ) {
          options.onsetup({
            importData: message.message.importData
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
            var text = scripts[ i ].text.replace(/^\s+|\s+$/g,"");
            if ( text.length > 0 ) {
              importData = JSON.parse( text );
              if ( importData.media ) {
                options.loadFromData( importData );
              } //if
            }
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
    this.type = undefined;
    this.mediaElement = undefined;

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

    this.prepareMedia = function( type ) {
      if ( type === "object" ) {
        var mediaElement = document.getElementById( that.target );
        if (  !mediaElement || [ 'AUDIO', 'VIDEO' ].indexOf( mediaElement.nodeName ) === -1 ) {
          var video = document.createElement( "video" ),
              src = document.createElement( "source" );

          src.src = that.url;
          video.style.width = document.getElementById( that.target ).style.width;
          video.style.height = document.getElementById( that.target ).style.height;
          video.appendChild( src );
          video.controls = true;
          if ( !video.id || video.id === "" ) {
            video.id = "butter-media-element-" + that.id;
          }
          video.setAttribute( "autobuffer", "true" );
          video.setAttribute( "preload", "auto" );

          document.getElementById( that.target ).appendChild( video );
          that.mediaElement = video;
          return video;
        }
        else {
          if ( !mediaElement.id || mediaElement.id === "" ) {
            mediaElement.id = "butter-media-element-" + that.id;
          } //if
          that.mediaElement = mediaElement;
          mediaElement.pause();
          mediaElement.src = "";
          while ( mediaElement.firstChild ) {
            mediaElement.removeChild( mediaElement.firstChild );
          } //while
          //if ( !mediaElement.firstChild || !mediaElement.currentSrc ) {
          mediaElement.removeAttribute( "src" );
          /*
          var src = document.createElement( "source" );
          src.src = that.url;
          mediaElement.appendChild( src );
          */
          mediaElement.src = that.url;
          mediaElement.load();
          //}
          return mediaElement;
        } //if
      }
    }; //prepareMedia

    function findNode( id, rootNode ) {
      var children = rootNode.childNodes;
      for ( var i=0, l=children.length; i<l; ++i ) {
        if ( children[ i ].id === id ) {
          return children [ i ];
        }
        else {
          var node = findNode( id, children[ i ] );
          if ( node ) {
            return node;
          } //if
        } //if 
      } //for
    } //findNode

    this.alterMediaHTML = function( rootNode ) {
      var targetElement = findNode( that.target, rootNode );
      if ( that.type === "object" ) {
        var parentNode = targetElement.parentNode,
            newNode = document.getElementById( that.target ).cloneNode( true );
        parentNode.removeChild( targetElement );
        parentNode.appendChild( newNode );
      } //if
    }; //getMediaHTML

    this.findMediaType = function() {
      var regexResult = urlRegex.exec( that.url )
      if ( regexResult ) {
        that.type = regexResult[ 1 ];
      }
      else {
         that.type = "object";
      }
      return that.type;
    }; //findMediaType

    this.generatePopcornString = function( options ) {
      var type = that.type || that.findMediaType();
          popcornString = "";

      options = options || {};

      var popcornOptions = ""
      if ( options.options ) {
        popcornOptions = ", " + JSON.stringify( options.options );
      } //if

      var players = {
        "youtu": function() {
          return "var popcorn = Popcorn.youtube( '" + that.target + "', '" +
            that.url + "', {\n" + 
            "width: 430, height: 300\n" + 
          "} );\n";
        },
        "vimeo": function() {
          return "var popcorn = Popcorn( Popcorn.vimeo( '" + that.target + "', '" +
          that.url + "', {\n" +
            "css: {\n" +
              "width: '430px',\n" +
              "height: '300px'\n" +
            "}\n" +
          "} )" + popcornOptions + " );\n";
        },
        "soundcloud": function() {
          return "var popcorn = Popcorn( Popcorn.soundcloud( '" + that.target + "'," +
          " '" + that.url + "') );\n";

        },
        "baseplayer": function() {
          return "var popcorn = Popcorn( Popcorn.baseplayer( '#" + that.target + "'" + popcornOptions + " ) );\n";
        },
        "object": function() {
          return "var popcorn = Popcorn( '#" + that.mediaElement.id + "'" + popcornOptions + ");\n";
        } 
      };

      // call certain player function depending on the regexResult
      popcornString += players[ type ]();

      if ( that.popcorn ) {
        var trackEvents = that.popcorn.getTrackEvents();
        if ( trackEvents ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            var popcornOptions = trackEvents[ i ]._natives.manifest.options;
            popcornString += "popcorn." + trackEvents[ i ]._natives.type + "({";
            for ( var option in popcornOptions ) {
              if ( popcornOptions.hasOwnProperty( option ) ) {
                popcornString += "\n" + option + ":'" + trackEvents[ i ][ option ] + "',";
              } //if
            } //for
            if ( popcornString[ popcornString.length - 1 ] === "," ) {
              popcornString = popcornString.substring( 0, popcornString.length - 1 );
            } //if
            popcornString += "});\n";
          } //for trackEvents
        } //if trackEvents
      } //if popcorn

      var method = options.method || "inline";

      if ( method === "event" ) {
        popcornString = "\ndocument.addEventListener('DOMContentLoaded',function(e){\n" + popcornString;
        popcornString += "\n},false);";
      }
      else {
        popcornString = popcornString + "\n return popcorn;"; 
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
        that.popcorn.destroy();
        that.popcorn = undefined;
      } //if
    }; //clearPopcorn

    this.createPopcorn = function( popcornString ) {
      var popcornFunction = new Function( "", popcornString );
          popcorn = popcornFunction();
      if ( !popcorn ) {
        var popcornScript = that.popcornScript = document.createElement( "script" );
        popcornScript.innerHTML = popcornString;
        document.head.appendChild( popcornScript );
        popcorn = window.Popcorn.instances[ window.Popcorn.instances.length - 1 ];
      }
      that.popcorn = popcorn;
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
        if ( that.type === "youtu" ) {
          popcorn.media.addEventListener( "durationchange", function( e ) {
            that.duration = popcorn.duration();
            setTimeout( function() {
              popcorn.pause( 0 );
              callback( popcorn );
            },1000 );
          });
        }
        else if( that.type === "vimeo" ) {
          popcorn.media.addEventListener( "durationchange", function( e ) {
            that.duration = popcorn.duration();
            callback( popcorn );
          });
        }
        else if( that.type === "soundcloud" ) {
          if ( popcorn.duration() === 0 ) {
            that.duration = popcorn.duration();
            callback( popcorn );
          }
          else {
            setTimeout( checkMedia, 100 );
          }
        }
        else {
          if( popcorn.media.readyState >= 2 || popcorn.media.duration > 0 ) {
            that.duration = popcorn.media.duration;
            callback( popcorn );
          } else {
            setTimeout( checkMedia, 100 );
          }
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
        mediaContentChangedHandler = options.onmediacontentchanged || function() {},
        mediaRemovedHandler = options.onmediaremoved || function() {},
        fetchHTMLHandler = options.onfetchhtml || function() {};

    comm.listen( 'mediachanged', mediaChangedHandler );
    comm.listen( 'mediaadded', mediaAddedHandler );
    comm.listen( 'mediaremoved', mediaRemovedHandler );
    comm.listen( 'mediatimeupdate', mediaTimeUpdateHandler );
    comm.listen( 'mediacontentchanged', mediaContentChangedHandler );
    
    comm.returnAsync( 'html', fetchHTMLHandler );

    Object.defineProperty( this, "comm", {
      get: function() {
        return comm;
      }
    });

    this.getHTML = function( projectData ) {
      var html = document.createElement( "html" ),
          head = originalHead.cloneNode( true ),
          body = originalBody.cloneNode( true );

      if ( typeof projectData === "object" ) {
        projectData = JSON.stringify( projectData );
      } //if

      var scripts = head.getElementsByTagName( "script" ),
          projectScript;
      for ( var i=0, l=scripts.length; i<l; ++i ) {
        if ( scripts[ i ].getAttribute( "data-butter" ) === "project-data" ) {
          projectScript = scripts[ i ];
          projectScript.innerHTML = projectData;
          break;
        } //if
      } //for

      for ( var media in medias ) {
        if ( medias.hasOwnProperty( media ) ) {
          if ( !projectScript ) {
            var script = document.createElement( "script" );
            script.innerHTML = medias[ media ].generatePopcornString( { method: "event" } );
            head.appendChild( script );
          }
          medias[ media ].alterMediaHTML( body );
        } //if
      } //for
      html.appendChild( head );
      html.appendChild( body );
      return "<!doctype html>\n<html>\n  <head>" + head.innerHTML + "</head>\n  <body>" + body.innerHTML + "</body>\n</html>";
    }; //getHTML

    this.sendMedia = function( media, registry ) {
      comm.send( {
        registry: registry || media.Popcorn.manifest,
        id: media.id,
        duration: media.duration,
      }, "build" );
    }; //sendMedia

    this.sendImportData = function( importData ) {
      comm.send( importData, "importData" );
    }; //sendImportData

    this.scrape = function() {
      comm.send( "Scraping template HTML", "log" );
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

                  var mediaSourceUrl = defaultMedia;
                  //var mediaSourceUrl = thisChild.currentSrc;
                  
                  comm.send({
                    target: thisChild.id,
                    url: mediaSourceUrl,
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
      if ( butterMapping[ message.id ] ) {
        media.popcorn.removeTrackEvent( butterMapping[ message.id ] );
      }
      media.popcorn[ message.type ]( message.popcornOptions );
      butterMapping[ message.id ] = media.popcorn.getLastTrackEventId();
      comm.send( "Created popcorn event" + message.id, "log" );
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

    var mediaContentChangedHandler = function( message ) {
      var container = link.currentMedia.mediaElement;

      while( container.firstChild ) {
        container.removeChild( container.firstChild );
      }

      if ( [ "AUDIO", "VIDEO" ].indexOf( container.nodeName ) > -1 ) {
        container.currentSrc = "";
        container.src = "";
      } //if

      link.currentMedia.url = message;
      var storedEvents = link.currentMedia.popcorn.getTrackEvents(),
          newEvents = [];
      for ( var i=0; i<storedEvents.length; ++i ) {
         var ev = storedEvents[ i ],
            manifestOptions = ev._natives.manifest.options
            newOptions = {},
            butterId = undefined;
        for ( var option in manifestOptions ) {
          if ( manifestOptions.hasOwnProperty( option ) ) {
            newOptions[ option ] = ev[ option ];
          } //if
        } //for
        for ( var id in butterMapping ) {
          if ( butterMapping.hasOwnProperty( id ) ) {
            if ( butterMapping[ id ] === ev._id ) {
              butterId = id;
            } //if
          } //if
        } //for
        newEvents.push({
          popcornId: ev._id,
          butterId: butterId,
          options: newOptions
        });
        link.currentMedia.popcorn.removeTrackEvent( ev._id );
      }
      buildMedia( link.currentMedia, function( media ) {
        for ( var i=0; i<newEvents.length; ++i ) {
          var newEvent = newEvents[ i ];
          link.currentMedia.popcorn[ ev._natives.type ]( newEvent.options );
          var newId = link.currentMedia.popcorn.getLastTrackEventId();
          butterMapping[ newEvent.butterId ] = newId;
        }
        comm.send( "mediacontentchanged", "mediacontentchanged" );
      });
    }; //mediaContentChangedHandler

    var fetchHTMLHandler = function( message ) {
      return link.getHTML( message );
    }; //fetchHTMLHandler

    link = new Butter.Link({
      onmediachanged: mediaChangedHandler,
      onmediaadded: mediaAddedHandler,
      onmediaremoved: mediaRemovedHandler,
      onmediatimeupdate: mediaTimeUpdateHandler,
      onmediacontentchanged: mediaContentChangedHandler,
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
        media.prepareMedia( media.findMediaType() );
        try {
          media.createPopcorn( media.generatePopcornString() );
          media.waitForPopcorn( function( popcorn ) {
            media.setupPopcornHandlers( comm );
            callback( media );
          });
        }
        catch( e ) {
          comm.send({
            message: "Couldn't instantiate popcorn instance: [" + e.fileName + ": " + e.message + "]",
            context: "previewer::buildMedia::popcornIsReady",
            type: "popcorn-initialization",
            error: JSON.stringify( e )
          }, "error" );
        } //try
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

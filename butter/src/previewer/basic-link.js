(function() {
  define( [ "core/logger", "core/eventmanager", "comm/comm", "previewer/link", "previewer/media" ], function( Logger, EventManager, Comm, Link, Media ) {
    var BasicLink = function( options ) {
      var link, comm, butterMapping = {};

      var trackEventAddedHandler = function( e ) {
        var media = link.currentMedia;
        media.popcorn[ e.data.type ]( e.data.popcornOptions );
        butterMapping[ e.data.id ] = media.popcorn.getLastTrackEventId();
      }; //trackEventAddedHandler

      var trackEventUpdatedHandler = function( e ) {
        var media = link.currentMedia;
        if ( butterMapping[ e.data.id ] ) {
          media.popcorn.removeTrackEvent( butterMapping[ e.data.id ] );
        }
        media.popcorn[ e.data.type ]( e.data.popcornOptions );
        butterMapping[ e.data.id ] = media.popcorn.getLastTrackEventId();
        comm.send( "Created popcorn event" + e.data.id, "log" );
      }; //trackEventUpdatedHandler

      var trackEventRemovedHandler = function( e ) {
        var media = link.currentMedia;
        if ( butterMapping[ e.data.id ] ) {
          media.popcorn.removeTrackEvent( butterMapping[ e.data.id ] );
        }
      }; //trackEventRemovedHandler

      var mediaChangedHandler = function( e ) {
        if ( link.currentMedia ) {
          link.currentMedia.removeHandlers( comm );
        }
        var currentMedia = link.currentMedia = link.getMedia( e.data.id );
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

      var mediaAddedHandler = function( e ) {
        if ( !link.getMedia( e.data.id ) ) {
          var media = new Media( e.data );
          link.addMedia( media );
          buildMedia( media, function( media ) {
            link.sendMedia( media );
          });
        }
        else {
          console.log('media', e.data.id, 'already exists');
        }
      }; //mediaAddedHandler

      var mediaRemovedHandler = function( e ) {
        link.removeMedia( link.getMedia( e.data.id ) );
      }; //mediaRemovedHandler

      var mediaTimeUpdateHandler = function( e ) {
        link.currentMedia.popcorn.currentTime( e.data );
      }; //mediaTimeUpdateHandler

      var mediaContentChangedHandler = function( e ) {
        var container = link.currentMedia.mediaElement;

        while( container.firstChild ) {
          container.removeChild( container.firstChild );
        }

        if ( [ "AUDIO", "VIDEO" ].indexOf( container.nodeName ) > -1 ) {
          container.currentSrc = "";
          container.src = "";
        } //if

        link.currentMedia.url = e.data;
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

      var fetchHTMLHandler = function( e ) {
        return link.getHTML( e.data );
      }; //fetchHTMLHandler

      link = new Link({
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
          media.prepareMedia( media.findMediaType(), link );
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

    }; //BasicLink

    return BasicLink;

  }); //define
})();

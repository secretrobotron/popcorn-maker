(function (window, document, undefined, Butter, debug) {

  Butter.prototype.previewer = function( options ) {
    var butter = this;
    var quietLogger = options.logger;
    var logger = new Butter.Logger( { name: "Previewer Module", quiet: quietLogger } );
    logger.debug( "Starting" );

    var popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js",
        butterUrl = options.butterUrl;

    var target = document.getElementById( options.target );
    if ( !target ) {
      logger.error( "Previewer target, " + options.target + " does not exist");
    }

    if ( !butterUrl ) {
      logger.error( "Previewer requires a valid buttter lib (butterUrl)." );
    } //if

    butter.Preview = function( options ) {

      var that = this,
          link,
          previewIframe,
          defaultMedia = options.defaultMedia,
          importData = options.importData,
          onload = options.onload;

      var logger = new Butter.Logger( { name: "Preview", object: this, quiet: quietLogger } );
      logger.debug( "Starting" );

      function PreviewerLink( options ) {
        var isPlaying = false,
            currentTime,
            server = new Butter.CommServer(),
            that = this;

        function setup( iframeWindow ) {

          server.bindClientWindow( "link", iframeWindow, function( message ) {
          });
          
          that.play = function() {
            logger.debug( 'Playing' );
            server.send( "link", "play", "play" );
          }; //play

          Object.defineProperty( that, "playing", {
            get: function() {
              return isPlaying;
            }
          });

          that.pause = function() {
            logger.debug( 'Pausing' );
            server.send( "link", "pause", "pause" );
          }; //pause

          that.mute = function() {
            logger.debug( 'Muting' );
            server.send( "link", "mute", "mute" );
          }; //mute

          server.listen( "link", "error", function( error ) {
            //logger.error( error.message );
            butter.trigger( "error", error );
          });

          server.listen( "link", "loaded", function( message ) {
            var numMedia = butter.media.length, numReady = 0;
            logger.debug( 'Loaded; waiting for ' + numMedia + ' media' );
            butter.trigger( "previewloaded", null );

            server.listen( "link", "build", function( message ) {
              var media = butter.getMedia( { id: message.id } );
              if ( media ) {
                logger.debug( 'Media '+ media.id + ' built' );
                media.registry = message.registry;
                media.duration = message.duration;
                butter.trigger( "mediaready", media, "previewer" );
              } //if
              ++numReady;
              if ( numMedia === numReady ) {
                if ( importData ) {
                  butter.importProject( importData );
                } //if
                butter.trigger( "previewready", that );
                onload && onload( that );
              } //if
            });
          });
          
          server.listen( "link", "mediapaused", function( message ) {
            logger.debug( "Received mediapaused" );
            isPlaying = false;
            butter.trigger( "mediaplaying", butter.getMedia( { id: message } ), "previewer" );
          });
          server.listen( "link", "mediaplaying", function( message ) {
            logger.debug( "Received mediaplaying" );
            isPlaying = true;
            butter.trigger( "mediapaused", butter.getMedia( { id: message } ), "previewer" );
          });
          server.listen( "link", "mediatimeupdate", function( message ) {
            logger.debug( "Received mediatimeupdate" );
            currentTime = butter.currentTime = message;
          });

          server.listen( "link", "addmedia", function( message ) {
            logger.debug( "Received addmedia request" );
            var media = butter.addMedia( message );
          });
          server.listen( "link", "addtarget", function( message ) {
            logger.debug( "Received addtarget request" );
            var target = butter.addTarget( message );
          });

          butter.listen( "mediaadded", function( e ) {
            logger.debug( "Sending mediaadded" );
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediaadded" );
          });

          butter.listen( "mediachanged", function( e ) {
            logger.debug( "Sending mediachanged" );
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediachanged" );
          });

          butter.listen( "mediaremoved", function( e ) {
            logger.debug( "Sending mediaremoved" );
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediaremoved" );
          });

          butter.listen( "mediatimeupdate", function( e ) {
            if ( e.data.currentTime !== currentTime ) {
              logger.debug( "Sending mediatimeupdate" );
              server.send( "link", e.data.currentTime, "mediatimeupdate" );
            } //if
          }, "timeline" );

          butter.listen( "mediacontentchanged", function( e ) {
            logger.debug( "Sending mediacontentchanged" );
            server.send( "link", e.data.url, "mediacontentchanged" );
          });

          butter.listen( "trackeventadded", function( e ) {
            logger.debug( "Sending trackeventadded" );
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventadded" );
          });
          butter.listen( "trackeventremoved", function( e ) {
            logger.debug( "Sending trackeventremoved" );
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventremoved" );
          });
          butter.listen( "trackeventupdated", function( e ) {
            logger.debug( "Sending trackeventupdated" );
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventupdated" );
          });

          server.listen( "link", "importData", function( message ) {
            logger.debug( "Received import data" );
            importData = message;
          });
        } //setup

        var iframeWindow = previewIframe.contentWindow || previewIframe.contentDocument;
        if ( options.independent ) {
          logger.debug( "IFRAME is independent" );
        }
        else {
          logger.debug( "IFRAME is dependent" );
          var linkScript = document.createElement( 'script' );
          linkScript.src = butterUrl;
          iframeWindow.document.head.appendChild( linkScript );
        } //if
        setup( iframeWindow );
        
        // Ugly hack to continue bootstrapping until Butter script is *actually* loaded.
        // Impossible to really tell when <script> has loaded (security).
        logger.debug( "Bootstrapping" );
        var setupInterval;
        function sendSetup() {
           server.send( "link", {
            defaultMedia: defaultMedia
          }, "setup" );
        } //sendSetup
        setupInterval = setInterval( sendSetup, 500 );
        server.listen( "link", "setup", function( message ) {
          clearInterval( setupInterval );
        });
        

        this.fetchHTML = function( callback ) {
          logger.debug( "Fetching HTML" );
          server.async( "link", null, "html", function( message ) {
            logger.debug( "Receiving HTML" );
            callback( message );
          });
        }; //fetchHTML

      } //PreviewLink

      Object.defineProperty( this, "independent", {
        get: function() {
          try {
            var iframeWindow = previewIframe.contentWindow || previewIframe.contentDocument;
            return !!( iframeWindow.Popcorn && iframeWindow.Butter );
          }
          catch( e ) {
            return true;
          }
        }
      });

      function loadIframe( iframe, template ) {
        previewIframe = iframe;
        logger.debug( "Starting IFRAME: " + iframe.src );
        function onLoad( e ) {
          logger.debug( "IFRAME Loaded: " + iframe.src );
          link = new PreviewerLink({
            independent: that.independent
          });
          iframe.removeEventListener( "load", onLoad, false ); 
        } //onLoad
        iframe.addEventListener( "load", onLoad, false ); 
      } //loadIfram

      if ( target.tagName === "DIV" ) {
        logger.debug( "Found DIV; Creating IFRAME" );
        var rect = target.getClientRects()[ 0 ];
        var iframe = document.createElement( "IFRAME" );
        iframe.width = rect.width;
        iframe.height = rect.height;
        loadIframe( iframe, options.template );
        target.appendChild( iframe );
        iframe.src = options.template;
      }
      else if ( target.tagName === "IFRAME" ) {
        logger.debug( "Found IFRAME" );
        loadIframe( target, options.template );
        target.src = options.template;
      } // else

      Object.defineProperty( this, "properties", {
        get: function() {
          return {
            independent: this.independent,
            target: link.target,
            template: link.template,
          };
        }
      });

      this.fetchHTML = function( callback ) {
        link.fetchHTML( callback );
      }; //fetchHTML

      Object.defineProperty( this, "playing", {
        get: function() {
          return link.playing;
        },
        set: function( val ) {
          if ( val ) {
            link.play();
          }
          else {
            link.pause();
          }
        }
      });

      this.play = function() {
        link.play();
      };

      this.pause = function() {
        link.pause();
      };
      
      this.mute = function() {
        link.mute();
      };

      this.destroy = function() {
        link.destroy();
      };

    }; //Preview

  }; //loadPreview

})(window, document, undefined, window.Butter, window.debug);


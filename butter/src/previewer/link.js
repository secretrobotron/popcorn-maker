(function() {
  define( [ "core/logger", "core/eventmanager", "comm/comm" ], function( Logger, EventManager, Comm ) {
    var Link = function( options ) {
      var medias = {},
          originalBody, originalHead,
          currentMedia, popcornScript,
          popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js",
          defaultMedia = options.defaultMedia,
          importData = options.importData,
          that = this,
          linkType = options.type || "basic",
          comm = new Comm.CommClient( "link" );

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

      comm.returnAsync( "linktype", function() {
        return linkType;
      });

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
            comm.send( { type: linkType }, "loaded" );
          } // else
        } // ensureLoaded

        ensureLoaded();

      }; //scrape

      var mediaTimeout;
      this.createMediaTimeout = function() {
        mediaTimeout = setTimeout( function() {
          comm.send({
            message: "Media timeout error",
            context: "previewer::buildMedia",
            type: "media-timeout"
          }, "error" );
        }, 10000 );
      };

      this.cancelMediaTimeout = function() {
        mediaTimeout && clearTimeout( mediaTimeout );
      };

      comm.unlisten( 'createmediatimeout' );
      comm.unlisten( 'cancelmediatimeout' );
      comm.listen( 'createmediatimeout', that.createMediaTimeout );
      comm.listen( 'cancelmediatimeout', that.cancelMediaTimeout );

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

    return Link;

  }); //define
})();

(function (window, document, undefined, Butter, debug) {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  if ( !Butter ) {
    Butter = window.Butter = {};
  } //if

  function bootStrapper( e ) {
    window.removeEventListener( 'message', bootStrapper, false );

    var client = new Butter.CommClient( "link", function( message ) {
    });

    client.listen( "start", function( message ) {
      var link = new Butter.Link({
        defaultMedia: message.defaultMedia,
        popcornUrl: message.popcornUrl,
        comm: client
      });
      link.scrape();
    });

    client.send( "ready", "setup" );
  }
  window.addEventListener( 'message', bootStrapper, false );

  function Media( mediaData ) {
    var that = this;
    this.url = mediaData.url;
    this.target = mediaData.target;
    this.id = mediaData.id;
    this.duration = 0;
    this.popcorn = undefined;

    this.generatePopcornString = function() {
      var regexResult = urlRegex.exec( that.url ) || "",
          players = [];

      var popcornString = "function startPopcorn" + that.id + " () {\n";

      players[ "youtu" ] = function() {
        return "popcorn = Popcorn( Popcorn.youtube( '" + that.target + "', '" +
          that.url + "', {\n" + 
          "width: 430, height: 300\n" + 
        "} ) );\n";
      };

      players[ "vimeo " ] = function() {
        return "popcorn = Popcorn( Popcorn.vimeo( '" + that.target + "', '" +
        that.url + "', {\n" +
          "css: {\n" +
            "width: '430px',\n" +
            "height: '300px'\n" +
          "}\n" +
        "} ) );\n";
      };

      players[ "soundcloud" ] = function() {
        return "popcorn = Popcorn( Popcorn.soundcloud( '" + that.target + "'," +
        " '" + that.url + "' ) );\n";
      };

      players[ "baseplayer" ] = function() {
        return "popcorn = Popcorn( Popcorn.baseplayer( '" + that.target + "' ) );\n";
      };

      players[ undefined ] = function() {
        var src = document.createElement( "source" ),
            video = document.createElement( "video" );

        src.src = that.url;
        video.style.width = document.getElementById( that.target ).style.width;
        video.style.height = document.getElementById( that.target ).style.height;
        video.appendChild( src );
        video.controls = true;
        video.id = that.target + "-butter";

        document.getElementById( that.target ).appendChild( video );

        originalBody = document.getElementsByTagName("body")[ 0 ].innerHTML;

        var vidId = "#" + video.id;

        return "popcorn = Popcorn( '" + vidId + "');\n";
      }; 

      // call certain player function depending on the regexResult
      popcornString += players[ regexResult[ 1 ] ]();

      /*
      var trackEvents = that.popcorn.getTrackEvents();

      if ( trackEvents ) {

        // loop through each track event
        for ( var k = 0; k < trackEvents.length; k++ ) {
          
          // obtain all of the options in the manifest
          var options = trackEvents[ k ]._natives.manifest.options;
          popcornString += " popcorn" + popcorn + "." + trackEvents[ k ]._natives.type + "({\n"; 

          // for each option
          for ( item in options ) {

            if ( options.hasOwnProperty( item ) ) {

              // add the data to the string so it looks like normal popcorn code
              // that someone would write
              popcornString += item + ": '" + trackEvents[ k ][ item ] + "',\n";
            } // if
          } // for

          popcornString += "});";

        } // for trackEvents
      } // if trackEvents
      */
      popcornString += "}; startPopcorn" + that.id + "();";  

      this.popcornString = popcornString;

    }; //generatePopcornString

  } //Media

  Butter.Link = function( options ) {

    var medias = {};

    var originalBody, originalHead,
        currentMedia, popcornScript;

    var popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js",
        defaultMedia = options.defaultMedia,
        linkUrl = options.linkUrl,
        forcePopcorn = options.forcePopcorn,
        that = this,
        comm = options.comm;

    comm.listen( "build", function( message ) {
      that.buildMedia( message, function( media ){
        comm.send({
          registry: media.Popcorn.registry
        }, "build" );
      });
    });

    this.scrape = function( iframe, importData ) {
      function bodyReady() {

        originalBody = document.body.innerHTML;
        originalHead = document.head.innerHTML;

        var importMedia;
        if ( importData ) {
          importMeda = importData.media;
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
            }

            // ensure we get every child, search recursively
            if ( thisChild.children && thisChild.children.length > 0 ) {
              scrapeChildren( thisChild );
            } // if
          } // for

        } //scrapeChildren

        scrapeChildren( document.body );
        if ( importData ) {
          that.importProject( importData );
        }
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
          comm.send("layoutloaded", "layoutloaded");
        } // else
      } // ensureLoaded

      ensureLoaded();

    }; //scrape

    this.buildMedia = function( inputMedia, callback, importData ) {

      if ( !inputMedia ) {
        throw new Error( "Can't build preview without a media target" );
      }

      var media;
      if ( !medias[ inputMedia.id ] ) {
        media = medias[ inputMedia.id ] = new Media( inputMedia );
      }
 
      // create a script within the iframe and populate it with our popcornString
      if ( forcePopcorn || forcePopcorn === undefined ) {

        if ( !window.Popcorn ) {
          insertPopcorn();
        } //if

        clearPopcorn();
        destroyPopcorn( media );
         
        if ( media.target ) {
          document.getElementById( media.target ).innerHTML = "";
        } //if

        media.generatePopcornString();

        function isPopcornReady( e, readyCallback ) {
          if ( !window.Popcorn ) {
            setTimeout( function() {
              isPopcornReady( e, readyCallback );
            }, 1000 );
          }
          else {
            createPopcorn( media );
            readyCallback && readyCallback();
          } //if
        } //isPopcornReady

        function isMediaReady() {
          var checkMedia = function() {
            var popcorn = media.popcorn;
            if( popcorn.media.readyState >= 2 || popcorn.media.duration > 0 ) {
              media.duration = popcorn.media.duration;
              comm.send( media, "mediaready" );
              popcorn.media.addEventListener( "timeupdate", function() {
                comm.send( popcorn.media.currentTime, "mediatimeupdate" );                
              },false);

              popcorn.media.addEventListener( "pause", function() {
                comm.send( "mediapaused", "mediapaused" );
              }, false);

              popcorn.media.addEventListener( "playing", function() {
                comm.send( "mediaplaying", "mediaplaying" );
              }, false);
              callback && callback( media );
            } else {
              setTimeout( function() {
                checkMedia();
              }, 10);
            }
          }
          checkMedia();
        } //popcornIsReady

        isPopcornReady( null, isMediaReady );
      }
      else {
        callback && callback( media );
      } //if forcePopcorn

    }; //buildMedia

    var insertPopcorn = function() {
      var popcornSourceScript = document.createElement( "script" );
      popcornSourceScript.src = popcornUrl;
      document.head.appendChild( popcornSourceScript );
    }; //insertPopcorn

    var clearPopcorn = function() {
      while( window.Popcorn && window.Popcorn.instances.length > 0 ) {
        window.removeInstance( window.Popcorn.instances[ 0 ] );
      } //while
    }; //clearPopcorn

    var createPopcorn = function( media ) {
      var popcornScript = media.popcornScript = document.createElement( "script" );
      popcornScript.innerHTML = media.popcornString;
      document.head.appendChild( popcornScript );
      media.popcorn = window.Popcorn.instances[ window.Popcorn.instances.length - 1 ];
      media.Popcorn = window.Popcorn;
    }; //createPopcorn

    var destroyPopcorn = function( media ) {
      if ( media.popcornScript ) {
        document.head.removeChild( media.popcornScript );
      }
      media.popcornScript = undefined;
    }; //destroyPopcorn

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

  } //Link

})(window, window.document, undefined, window.Butter, window.debug);

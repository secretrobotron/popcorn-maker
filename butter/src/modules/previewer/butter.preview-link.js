(function (window, document, undefined, Butter) {

  Butter.prototype.Link() {
    var originalBody, originalHead, iframeWindow, iframeDocument,
        currentPopcorn, popcornSource, popcornStrings, popcornScript;

    function fillIframe( callback, forcePopcorn ) {

      // create a script within the iframe and populate it with our popcornString
      if ( !iframeWindow.Popcorn ) {
        this.insertPopcorn();
      } //if

      if ( !forcePopcorn ) {
        this.clearPopcorn();
        if ( popcornScript ) {
          this.destroyPopcorn();
        } //if
      } //if

      function isPopcornReady( e, readyCallback ) {
        if ( !iframeWindow.Popcorn ) {
          setTimeout( function() {
            isPopcornReady( e, readyCallback );
          }, 1000 );
        }
        else {
          if ( forcePopcorn && iframeWindow.Popcorn && iframeWindow.Butter ) {
            commServer = new that.CommServer();
            commServer.bindClientWindow( "previewerCommClient", iframeWindow );
            commServer.listen( "previewerCommClient", "pong", function( message ) {
              framePopcorn = iframeWindow.Popcorn.instances[ 0 ];
              callback2 && callback2( iframeWindow.Popcorn.instances[ 0 ] );
            } );
            commServer.send( "previewerCommClient", "ping", "ping" );
          } else {

            if ( iframeWindow.Popcorn.instances.length === 0 ) {
              popcornScript = iframeDocument.createElement( "script" );
              popcornScript.innerHTML = popcornString;
              doc.head.appendChild( popcornScript );
            }
    
            framePopcorn = win.Popcorn.instances[ 0 ];
            readyCallback && readyCallback( win.Popcorn.instances[ 0 ] );
          } // else  
        } //if

      }

      function popcornIsReady() {
        var videoReady = function() {
          if( framePopcorn.media.readyState >= 2 || framePopcorn.media.duration > 0 ) {
            that.duration( framePopcorn.media.duration );
            
            that.trigger( "mediaready", media );
            framePopcorn.media.addEventListener( "timeupdate", function() {
              
              that.currentTime( framePopcorn.media.currentTime );
              that.trigger( "mediatimeupdate", media );                
            },false);

            framePopcorn.media.addEventListener( "pause", function() {
              that.trigger("mediapaused");
            }, false);

            framePopcorn.media.addEventListener( "playing", function() {
              that.trigger("mediaplaying");
            }, false);
            callback && callback();
          } else {
            setTimeout( function() {
              videoReady( );
            }, 10);
          }
        }
        videoReady( );
      }

      isPopcornReady( null, popcornIsReady );

      // create a new body element with our new data
      body = doc.body.innerHTML;

    } //fillIframe

    this.scrape = function( iframe, importData ) {
      function bodyReady() {

        iframeWindow = iframe.contentWindow || iframe.contentDocument,
        iframeDocument = iframeWindow.document;

        originalBody = iframeDocument.body.innerHTML;
        originalHead = iframeDocument.head.innerHTML;

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
                that.addTarget( { 
                  name: thisChild.id, 
                  type: "target"
                } );
              }
              else if( thisChild.getAttribute( "data-butter" ) === "media" ) {
                if ( ["VIDEO", "AUDIO"].indexOf( thisChild.nodeName ) > -1 ) {
                  that.addMedia({
                    target: thisChild.id,
                    url: thisChild.currentSrc,
                  });
                }
                else {
                  var vidUrl = userSetMedia;

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

                  that.addMedia( { 
                    target: thisChild.id, 
                    url: vidUrl 
                  } );

                }
              } // else
            }

            // ensure we get every child, search recursively
            if ( thisChild.children && thisChild.children.length > 0 ) {
              scrapeChildren( thisChild );
            } // if
          } // for

        } //scrapeChildren

        scrapeChildren( iframeDocument.body );
        that.importProject( importData );
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

        var win = iframe.contentWindow || iframe.contentDocument;
        if ( !win ) {
          fail();
          return;
        }
        
        var doc = win.document;
        if ( !doc ) {
          fail();
          return;
        }

        var body = doc.getElementsByTagName( "BODY" );
        if ( body.length < 1 ) {
          fail();
          return;
        }
        else {
          
          bodyReady();
          that.trigger( "layoutloaded", null );
        } // else
      } // ensureLoaded

      ensureLoaded();

    }; //scrape

    this.buildMedia = function( media, callback, forcePopcorn, importData ) {

      if ( !media ) {
        throw new Error( "Can't build preview without a media target" );
      }

      if ( forcePopcorn || forcePopcorn === undefined ) {
        var mediaUrl = media.getUrl(),
            mediaTarget = media.getTarget(),
            mediaId = media.getId(),
            popcornString = "function startPopcorn" + mediaId + " () {\n";
        
        if ( mediaTarget ) {
          iframeDocument.getElementById( mediaTarget ).innerHTML = "";
        }

        var regexResult = urlRegex.exec( mediaUrl ) || "",
            players = [];

        players[ "youtu" ] = function() {
          return "popcorn = Popcorn( Popcorn.youtube( '" + videoTarget + "', '" +
            mediaUrl + "', {\n" + 
            "width: 430, height: 300\n" + 
          "} ) );\n";
        };

        players[ "vimeo " ] = function() {
          return "popcorn = Popcorn( Popcorn.vimeo( '" + videoTarget + "', '" +
          mediaUrl + "', {\n" +
            "css: {\n" +
              "width: '430px',\n" +
              "height: '300px'\n" +
            "}\n" +
          "} ) );\n";
        };

        players[ "soundcloud" ] = function() {
          return "popcorn = Popcorn( Popcorn.soundcloud( '" + videoTarget + "'," +
          " '" + mediaUrl + "' ) );\n";
        };

        players[ "baseplayer" ] = function() {
          return "popcorn = Popcorn( Popcorn.baseplayer( '" + videoTarget + "' ) );\n";
        };

        players[ undefined ] = function() {
          var src = iframeDocument.createElement( "source" ),
              video = iframeDocument.createElement( "video" );

          src.src = mediaUrl;
          video.style.width = iframeDocument.getElementById( videoTarget ).style.width;
          video.style.height = iframeDocument.getElementById( videoTarget ).style.height;
          video.appendChild( src );
          video.controls = true;
          video.id = videoTarget + "-butter";

          iframeDocument.getElementById( videoTarget ).appendChild( video );

          if( !commServer ) {
            originalBody = iframeDocument.getElementsByTagName("body")[ 0 ].innerHTML;
          }

          var vidId = "#" + video.id;

          return "popcorn = Popcorn( '" + vidId + "');\n";
        }; 

        // call certain player function depending on the regexResult
        popcornString += players[ regexResult[ 1 ] ]();

        var trackEvents = popcorns[ popcorn ].getTrackEvents();

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

        popcornString += "}; startPopcorn" + mediaId + "();";  
      } //if forcePopcorn

      popcornStrings[ mediaId ] = popcornString;
      fillIframe( callback, forcePopcorn );
    };
  } //Link

})(window, document, undefined, Butter);

(function (window, document, undefined, Butter) {

  Butter.registerModule( "previewer", function( options ) {

    var urlRegex, videoURL,
        iframe, iframeBody,
        popcornString, butterId,
        userSetMedia, videoString,
        popcornURL, originalHead,
        popcorns, originalBody,
        popcornScript, commServer,
        framePopcorn;
      
    this.loadPreview = function( options ) {
      originalHead = {};
      popcornURL = options.popcornURL || "http://popcornjs.org/code/dist/popcorn-complete.js";
      urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;
      layout = options.layout;
      butterIds = {};
      userSetMedia = options.media;
      popcorns = {};
      videoString = {};
      popcornString = undefined;
      popcornScript = undefined;

      var that = this,
          targetSrc = document.getElementById( options.target );

        // check if target is a div or iframe
      if ( targetSrc.tagName === "DIV" ) {

        target = document.getElementById( options.target );

        // force iframe to fill parent and set source
        iframe = document.createElement( "IFRAME" );
        iframe.src = layout;
        iframe.width = target.style.width;
        iframe.height = target.style.height;
        target.appendChild( iframe );

        // begin scraping once iframe has loaded, remove listener when complete
        iframe.addEventListener( "load", function (e) {
          that.scraper( iframe, options.importMedia );
          this.removeEventListener( "load", arguments.callee, false );
        }, false);

      } else if ( targetSrc.tagName === "IFRAME" ) {

        iframe = targetSrc;
        iframe.src = options.layout;

        targetSrc.addEventListener( "load", function (e) {
          that.scraper( iframe, options.importMedia );
          this.removeEventListener( "load", arguments.callee, false );
        }, false);
      } // else
    };

    this.loadPreview( options );

    // scraper function that scrapes all DOM elements of the given layout,
    // only scrapes elements with the butter-data attribute
    this.scraper = function( iframe, importMedia ) {

      // obtain a reference to the iframes body
      var win, doc, body, ifrmBody, that = this;

      // function to ensure body is actually there
      var tries = 0;
      var ensureLoaded = function() {

        function fail() {
          ++tries;
          if ( tries < 10000 ) {
            setTimeout( function() {
              ensureLoaded();
            }, 5 );
          }
          else {
            throw new Error("Couldn't load iframe. Tried desperately.");
          }
        }

        win = iframe.contentWindow || iframe.contentDocument;
        if ( !win ) {
          fail();
          return;
        }
        
        doc = win.document;
        if ( !doc ) {
          fail();
          return;
        }

        body = doc.getElementsByTagName( "BODY" );
        if ( body.length < 1 ) {
          fail();
          return;
        } else {
          // begin scraping once body is actually there, call callback once done
          bodyReady( body[ 0 ].children );
          that.trigger( "layoutloaded", null );
        } // else
      } // ensureLoaded

      ensureLoaded();

      // scraping is done here
      function bodyReady( children ) {

        Butter.extend( originalHead, win.document.head );

        originalBody = body[ 0 ].innerHTML;

        //originalHead = iframe.contentWindow.document.head;

        // store original iframeBody incase we rebuild
        var ifrmBody = ( iframe.contentWindow || iframe.contentDocument ).document;
        iframeBody = "<body>" + ifrmBody.body.innerHTML + "</body>\n";


        // loop for every child of the body
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
            } else if( thisChild.getAttribute( "data-butter" ) === "media" ) {
              if ( ["VIDEO", "AUDIO"].indexOf( thisChild.nodeName ) > -1 ) {
                that.addMedia({
                  target: thisChild.id,
                  url: thisChild.currentSrc,
                });
              }
              else {
                var vidUrl = userSetMedia;

                if ( thisChild.getAttribute( "data-butter-soundcloud" ) ) {
                  vidUrl = thisChild.getAttribute( "data-butter-soundcloud" );
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
            bodyReady( thisChild.children );
          } // if
        } // for

      } // bodyReady

    }; // scraper

    this.popcornFlag = function() {
      var win = iframe.contentWindow || iframe.contentDocument;
      return !!( win.Popcorn && win.Butter );
    };

    // buildPopcorn function, builds an instance of popcorn in the iframe and also
    // a local version of popcorn
    this.buildPopcorn = function( media, callback, layoutPopcorn, importData ) {
      var that = this, bpIframe = ( iframe.contentWindow || iframe.contentDocument ).document;
      // default to first butter-media tagged object if none is specified
      if ( !media ) {
        return;  
      }

      if( !layoutPopcorn ) {

        videoURL = media.getUrl();

        // default to first butter-media tagged object if none is specified
        videoTarget = media.getTarget();

        bpIframe.getElementById( videoTarget ).innerHTML = "";

        // create a string that will create an instance of popcorn with the proper video source
        popcornString = "function startPopcorn () {\n";        

        var regexResult = urlRegex.exec( videoURL ) || "",
            players = [], that = this;

        players[ "youtu" ] = function() {
          bpIframe.getElementById( videoTarget ).innerHTML = "";
          videoString[ media.getId() ] = "popcorn" + media.getId() + " = Popcorn( Popcorn.youtube( '" + videoTarget + "', '" +
            videoURL + "', {\n" + 
            "width: 430, height: 300\n" + 
          "} ) );\n";
        };

        players[ "vimeo " ] = function() {
          bpIframe.getElementById( videoTarget ).innerHTML = "";
          videoString[ media.getId() ] = "popcorn" + media.getId() + " = Popcorn( Popcorn.vimeo( '" + videoTarget + "', '" +
          videoURL + "', {\n" +
            "css: {\n" +
              "width: '430px',\n" +
              "height: '300px'\n" +
            "}\n" +
          "} ) );\n";
        };

        players[ "soundcloud" ] = function() {
          bpIframe.getElementById( videoTarget ).innerHTML = "";
          videoString[ media.getId() ] = "popcorn" + media.getId() + " = Popcorn( Popcorn.soundcloud( '" + videoTarget + "'," +
          " '" + videoURL + "' ) );\n";
        };

        players[ "baseplayer" ] = function() {
          bpIframe.getElementById( videoTarget ).innerHTML = "";
          videoString[ media.getId() ] = "popcorn" + media.getId() + " = Popcorn( Popcorn.baseplayer( '" + videoTarget + "' ) );\n";
        };

        players[ undefined ] = function() {
          var src = bpIframe.createElement( "source" ),
              video = bpIframe.createElement( "video" );

          src.src = videoURL;

          video.style.width = bpIframe.getElementById( videoTarget ).style.width;
          video.style.height = bpIframe.getElementById( videoTarget ).style.height;
          video.appendChild( src );
          video.controls = true;
          video.id = videoTarget + "-butter";

          bpIframe.getElementById( videoTarget ).appendChild( video );


          var vidId = "#" + video.id;      

          videoString[ media.getId() ] = "popcorn" + media.getId() + " = Popcorn( '" + vidId + "');\n";
        }; 

        // call certain player function depending on the regexResult
        players[ regexResult[ 1 ] ]();

        for( video in videoString ) {
          popcornString += videoString[ video ];    
        }

        // if for some reason the iframe is refreshed, we want the most up to date popcorn code
        // to be represented in the head of the iframe, incase someone views source
        for( popcorn in popcorns ) {

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

            } // for
          } // if
        }

        popcornString += "}; startPopcorn();";  
      } 

      this.fillIframe( media, callback, layoutPopcorn );
    };

    //  Toggle a ui cue for one of the targets in the layout
    this.toggleUiCue = function( target, className ) {
       var doc, target, tempDiv;
     
      doc = ( iframe.contentWindow || iframe.contentDocument ).document;
      target = doc.getElementById( target );
      
      if ( !doc.getElementById( "tempUi-" + target.id ) ) {
        tempDiv = doc.createElement( "div" );
        tempDiv.id = "tempUi-" + target.id;
        target.parentNode.appendChild( tempDiv );
      } else {
        tempDiv = doc.getElementById( "tempUi-" + target.id );
      }

      tempDiv.innerHTML = className ? target.id : "";

      tempDiv.className = className;

      tempDiv.style.top = target.offsetTop + "px";
      tempDiv.style.left = target.offsetLeft + "px";
      tempDiv.style.position = "absolute";
      tempDiv.style.pointerEvents = "none";
      tempDiv.style.zIndex = target.style.zIndex + 1;
      
    };

    this.uiHighlighting = function( target, className ) {
      var doc, target, tempDiv;

      doc = ( iframe.contentWindow || iframe.contentDocument ).document;
      target = doc.getElementById( target );
      
      if ( !doc.getElementById( "temp-" + target.id ) ) {
        tempDiv = doc.createElement( "div" );
        tempDiv.id = "temp-" + target.id;
        target.parentNode.appendChild( tempDiv );
      } else {
        tempDiv = doc.getElementById( "temp-" + target.id );
      }

      tempDiv.className = className;
      tempDiv.style.display = "none";

      function mousing( event ) {

        tempDiv.style.width = target.offsetWidth;
        tempDiv.style.height = target.offsetHeight;
        tempDiv.style.top = target.offsetTop + "px";
        tempDiv.style.left = target.offsetLeft + "px";
        tempDiv.style.position = "absolute";
        tempDiv.style.pointerEvents = "none";
        tempDiv.style.zIndex = target.style.zIndex + 1;
        tempDiv.style.display = "block";

      }

      target.addEventListener( "mouseover", mousing, false );

      tempDiv.addEventListener( "mouseout", function( event ) {

        tempDiv.style.display = "none";
        target.addEventListener( "mousover", mousing, false );

      }, false );

      target.addEventListener( "mouseout", function( event ) {

        tempDiv.style.display = "none";
        target.addEventListener( "mousover", mousing, false );

      }, false );
    };

    this.getPopcorn = function( callback ) {
      var popcornz = "";
      
      for( video in videoString ) {
        popcornz += "var " + videoString[ video ] + "\n";
      }
      
      // if for some reason the iframe is refreshed, we want the most up to date popcorn code
      // to be represented in the head of the iframe, incase someone views source
      for( popcorn in popcorns ) {

        var trackEvents = popcorns[ popcorn ].getTrackEvents();

        if ( trackEvents ) {

          // loop through each track event
          for ( var k = 0; k < trackEvents.length; k++ ) {
            
            // obtain all of the options in the manifest
            var options = trackEvents[ k ]._natives.manifest.options;
            popcornz += "popcorn" + popcorn + "." + trackEvents[ k ]._natives.type + "({\n"; 

            // for each option
            for ( item in options ) {
            
              if ( options.hasOwnProperty( item ) ) {

                // add the data to the string so it looks like normal popcorn code
                // that someone would write
                popcornz += item + ": '" + trackEvents[ k ][ item ] + "',\n";
              } // if
            } // for

            popcornz += "});\n";

          } // for
        } // if
      }

      return popcornz;

    };

    this.getHTML = function() {
      var doc = ( iframe.contentWindow || iframe.contentDocument ).document,
          pcornString = this.getPopcorn();
      return "<html>\n<head>\n" + originalHead.innerHTML + "\n" + 
              "<script> document.addEventListener( 'DOMContentLoaded', function(){\n" + pcornString + "\n}, false); </script>\n" + 
              "<script src='" + popcornURL + "'></script>\n</head>\n<body>\n" +
              originalBody + "\n</body>\n</html>";
    };

    this.play = function() {
        framePopcorn.media.play();
    };

    this.isPlaying = function() {

        return framePopcorn.media.paused;
    };

    this.pause = function() {
        framePopcorn.media.pause();
    };
    
    this.mute = function() {
      var video = framePopcorn.media;
      video.muted = !video.muted;
    };

    this.getRegistry = function() {
      var ifrme = iframe.contentWindow || iframe.contentDocument;
      return ifrme.Popcorn.registry;
    };

    this.clearPopcorn = function() {

      var allPopcorn = ( iframe.contentWindow || iframe.contentDocument ).Popcorn.instances,
          popcorn = ( iframe.contentWindow || iframe.contentDocument ).Popcorn;

      for( var i = 0, l = allPopcorn.length; i < l; i ++ ) {
       popcorn.removeInstance( allPopcorn[ i ] ); 
      }

      videoString = {};
    };
  
    // fillIframe function used to populate the iframe with changes made by the user,
    // which is mostly managing track events added by the user
    this.fillIframe = function( media, callback, layoutPopcorn ) {
      
      var iframeHead = "", body,
          win = iframe.contentWindow || iframe.contentDocument,
          that = this, doc = win.document;

      // create a script within the iframe and populate it with our popcornString
      if ( !win.Popcorn ) {
        var popcornSourceScript = doc.createElement( "script" );
        popcornSourceScript.src = popcornURL;
        doc.head.appendChild( popcornSourceScript );
      }

      if ( !layoutPopcorn ) {
        while ( win.Popcorn && win.Popcorn.instances.length > 0 ) {
          win.Popcorn.removeInstance( win.Popcorn.instances[0] );
        }

        if ( popcornScript ) {
          doc.head.removeChild( popcornScript );
        }
      }

      // create a new body element with our new data
      body = doc.body.innerHTML;

      // open, write our changes to the iframe, and close it
      //doc.open();
      //doc.write( "<html>\n" + iframeHead + body + "\n</html>" );
      //doc.close();

      function $popcornReady ( ) {
  
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
      } //$popcornReady

      var popcornReady = function( e, callback2 ) {
        if ( !win.Popcorn ) {
          setTimeout( function() {
            popcornReady( e, callback2 );
          }, 1000 );
        } else {
          if ( layoutPopcorn && win.Popcorn && win.Butter ) {
            commServer = new that.CommServer();
            commServer.bindClientWindow( "previewerCommClient", ( iframe.contentWindow || iframe.contentDocument ), function(message) {
            } );

            commServer.listen( "previewerCommClient", "pong", function( message ) {
              framePopcorn = win.Popcorn.instances[ 0 ];
              callback2 && callback2( win.Popcorn.instances[ 0 ] );
            } );
            commServer.send( "previewerCommClient", "ping", "ping" );
          } else {

            if ( win.Popcorn.instances.length === 0 ) {
              popcornScript = doc.createElement( "script" );
              popcornScript.innerHTML = popcornString;
              doc.head.appendChild( popcornScript );
            }
    
            framePopcorn = win.Popcorn.instances[ 0 ];
            callback2 && callback2( win.Popcorn.instances[ 0 ] );
          } // else  
        } //if
      } //popcornReady

      popcornReady( null, $popcornReady );

      this.teAdded = function( event ) {
        var that = this, e = event.data;

        //popcornReady( e, function( framePopcorn ) { 

          if( !popcorns[ media.getId() ] ) {
              popcorns[ media.getId() ] = framePopcorn;
          } else {
            framePopcorn = popcorns[ media.getId() ]; 
          }
          framePopcorn.removeTrackEvent( butterIds[ e.getId() ] );

          // add track events to the iframe verison of popcorn
          framePopcorn[ e.type ]( ( iframe.contentWindow || iframe.contentDocument.parentWindow ).Popcorn.extend( {}, e.popcornOptions ) );
          
          butterIds[ e.getId() ] = framePopcorn.getLastTrackEventId();

          e.manifest = framePopcorn.getTrackEvent( butterIds[ e.getId() ] )._natives.manifest;

        //} );
      }

      function trackeventupdated( e ) {
        if ( commServer ) {
          commServer.send( "previewerCommClient", {
            id: e.data.getId(),
            type: e.data.type,
            popcornOptions: e.data.popcornOptions,
          }, "trackeventupdated" );
        }
        else {
          this.teAdded( e );
        }
      };
      this.listen( "trackeventupdated", trackeventupdated);

      function trackeventadded( e ) {
        e = e.data;
        if ( commServer ) {
          var $addReceived = function ( message ) {
            if ( message.butterId === e.getId() ) {
              butterIds[ message.butterId ] = message.popcornId;
              e.manifest = framePopcorn.getTrackEvent( message.popcornId )._natives.manifest;
              commServer.forget( "previewerCommClient", "trackeventadded", $addReceived );
            
              commServer.listen( "previewerCommClient", "trackeventremoved", function ( message ) {
              } );

              commServer.listen( "previewerCommClient", "trackeventupdated", function ( message ) {
              } );
            }
          }
          commServer.listen( "previewerCommClient", "trackeventadded", $addReceived );

          commServer.send( "previewerCommClient", {
            id: e.getId(),
            type: e.type,
            popcornOptions: e.popcornOptions,
          }, "trackeventadded" );
        } else {

          if ( !win.Popcorn ) {
            throw new Error("Popcorn Not Available");
          }

          if( !popcorns[ media.getId() ] ) {
            popcorns[ media.getId() ] = framePopcorn;
          } else {
            framePopcorn = popcorns[ media.getId() ]; 
          }
          framePopcorn[ e.type ]( ( iframe.contentWindow || iframe.contentDocument ).Popcorn.extend( {}, e.popcornOptions ) );

          // add track events to the iframe verison of popcorn
          
          butterIds[ e.getId() ] = framePopcorn.getLastTrackEventId();

          e.manifest = framePopcorn.getTrackEvent( butterIds[ e.getId() ] )._natives.manifest;
        }
      }
      this.listen( "trackeventadded", trackeventadded);

      function trackeventremoved( e ) {
        if( commServer ) {
          commServer.send( "previewerCommClient", {
            id: e.data.getId(),
            type: e.data.type,
            popcornOptions: e.data.popcornOptions,
          }, "trackeventremoved" );

        } else {
          var ifrme = iframe.contentWindow || iframe.contentDocument;
          ifrme[ "popcorn" + media.getId() ].removeTrackEvent( butterIds[ e.data.getId() ] );
        }
      }
      this.listen( "trackeventremoved", trackeventremoved );

      var lastMediaAdded;
      this.listen( "mediaadded", function ( event ) {
        lastMediaAdded = event.data;
      });

      function mediachanged( e ) {
        //if ( commServer ) {
        //  commServer.send( "previewerCommClient", e.data, "mediachanged" );
        //} else {
        if ( lastMediaAdded !== e.data ) {
          that.buildPopcorn( e.data );
        }
        //}
      }
      this.listen( "mediachanged", mediachanged );

      function trackupdated( e ) {
        if( commServer ) {
          commServer.send( "previewerCommClient", e.data, "trackupdated" );
        } else {
          
          var trackEvents = e.data.getTrackEvents();
          for( var i = 0, l = e.data.getTrackEvents().length; i < l; i ++ ) {
            trackEvents[ i ].popcornOptions.target = e.data.target;
          }
        }
      }
      this.listen( "trackupdated", trackupdated );

      function mediatimeupdate( e ) {
        //if ( commServer ) {
        //  commServer.send( "previewerCommClient", e.data, "mediatimeupdate" );
        //} else {
          framePopcorn.currentTime( e.data.currentTime() );
        //}
      }
      this.listen( "mediatimeupdate", mediatimeupdate, "timeline" );
      
      function mediacontentchanged( e ) {
        //if( commServer ) {
        //  commServer.send( "previewerCommClient", e.data, "mediacontentchanged" );
        //} else {
          that.buildPopcorn( e.data );
        //}
      }
      this.listen( "mediacontentchanged", mediacontentchanged );

      function mediaremoved( e ) {
        that.unlisten( "trackeventadded", trackeventadded);
        that.unlisten( "trackeventupdated", trackeventupdated);
        that.unlisten( "trackeventremoved", trackeventremoved);
        that.unlisten( "mediachanged", mediachanged);
        that.unlisten( "trackupdated", trackupdated);
        that.unlisten( "mediatimeupdate", mediatimeupdate, "timeline" );  
        that.unlisten( "medcontentchanged", mediacontentchanged);
        that.unlisten( "mediaremoved", mediaremoved );
      }

      this.listen( "mediaremoved", mediaremoved);

    } // fillIframe
    
  });
})(window, document, undefined, Butter);


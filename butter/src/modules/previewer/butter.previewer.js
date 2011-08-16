(function (window, document, undefined, Butter) {

  Butter.registerModule( "previewer", function( options ) {

    var urlRegex, videoURL,
        iframe, iframeBody,
        popcornString, butterId,
        userSetMedia, videoString,
        popcornURL, originalHead,
        popcorns, originalBody,
        popcornScript;
      
    originalHead = {};
    popcornURL = options.popcornURL || "http://popcornjs.org/code/dist/popcorn-complete.js";
    urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;
    layout = options.layout;
    butterIds = {};
    userSetMedia = options.media;
    popcorns = {};
    videoString = {};

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
        that.scraper( iframe, options.callback );
        this.removeEventListener( "load", arguments.callee, false );
      }, false);

    } else if ( targetSrc.tagName === "IFRAME" ) {

      iframe = targetSrc;
      iframe.src = options.layout;

      targetSrc.addEventListener( "load", function (e) {
        that.scraper( iframe, options.callback );
        this.removeEventListener( "load", arguments.callee, false );
      }, false);
    } // else

    // scraper function that scrapes all DOM elements of the given layout,
    // only scrapes elements with the butter-data attribute
    this.scraper = function( iframe, callback ) {

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
          callback();
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
        for( var i = 0; i < children.length; i++ ) {
          
          // if DOM element has an data-butter tag that is equal to target or media,
          // add it to butters target list with a respective type
          if( children[ i ].getAttribute( "data-butter" ) === "target" ) {
            that.addTarget( { 
              name: children[ i ].id, 
              type: "target"
            } );
          } else if( children[ i ].getAttribute( "data-butter" ) === "media" ) {
            if ( ["VIDEO", "AUDIO"].indexOf( children[ i ].nodeName ) > -1 ) {
              that.addMedia({
                target: children[ i ].id,
                url: children[ i ].currentSrc,
              });
            }
            else {
              that.addMedia( { 
                target: children[ i ].id, 
                url: userSetMedia
              } );
            }
          } // else

          // ensure we get every child, search recursively
          var child = children[ i ].children;
          if ( child && child.length > 0 ) {

            bodyReady( children[ i ].children );
          } // if
        } // for
      } // bodyReady

    }; // scraper

    // buildPopcorn function, builds an instance of popcorn in the iframe and also
    // a local version of popcorn
    this.buildPopcorn = function( media, callback ) {
      var that = this;
console.log(media.getUrl());
      // default to first butter-media tagged object if none is specified
      if ( !media ) {
        return;  
      }
      
      videoURL = media.getUrl();

      var bpIframe = ( iframe.contentWindow || iframe.contentDocument ).document;
      
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

      this.fillIframe( media, callback );
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
        ( iframe.contentWindow || iframe.contentDocument ).Popcorn.instances[ this.getCurrentMedia().getId() ].media.play();
    };

    this.isPlaying = function() {
       var video = ( iframe.contentWindow || iframe.contentDocument ).Popcorn.instances[ this.getCurrentMedia().getId() ].video;

        video.paused = !video.paused;
        return video.paused;
    };

    this.pause = function() {
        ( iframe.contentWindow || iframe.contentDocument ).Popcorn.instances[ this.getCurrentMedia().getId() ].media.pause();
    };
    
    this.mute = function() {
      var video = ( iframe.contentWindow || iframe.contentDocument ).Popcorn.instances[ this.getCurrentMedia().getId() ].media;
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
    this.fillIframe = function( media, callback ) {
      
      var iframeHead = "", body,
          win = iframe.contentWindow || iframe.contentDocument,
          that = this, doc = win.document;

      // create a script within the iframe and populate it with our popcornString
      if ( !win.Popcorn ) {
        var popcornSourceScript = doc.createElement( "script" );
        popcornSourceScript.src = popcornURL;
        doc.head.appendChild( popcornSourceScript );
      }

      while ( win.Popcorn && win.Popcorn.instances.length > 0 ) {
        win.Popcorn.removeInstance( win.Popcorn.instances[0] );
      }

      if ( popcornScript ) {
        doc.head.removeChild( popcornScript );
      }

      // create a new body element with our new data
      body = doc.body.innerHTML;

      // open, write our changes to the iframe, and close it
      //doc.open();
      //doc.write( "<html>\n" + iframeHead + body + "\n</html>" );
      //doc.close();

      var instancesBefore = win.Popcorn ? win.Popcorn.instances.length : 0;
      var popcornReady = function( e, callback2 ) {
console.log("HERE");        
        if ( !win.Popcorn ) {
          setTimeout( function() {
            popcornReady( e, callback2 );
          }, 10 );
        } else {

          if ( !win.Popcorn.instances[ 0 ] ) {
            popcornScript = doc.createElement( "script" );
            popcornScript.innerHTML = popcornString;
            doc.head.appendChild( popcornScript );
          }
  
          framePopcorn = win.Popcorn.instances[ 0 ];
          callback2 && callback2( win.Popcorn.instances[ 0 ] );
        } // else  
      }

      popcornReady( null, function( framePopcorn ) {
  
        var videoReady = function() {
            console.log(framePopcorn.media.readyState, framePopcorn.media.duration );
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
              videoReady( framePopcorn );
            }, 10);
          }
        }
        videoReady( framePopcorn );
      } );

      this.teAdded = function( event ) {
        var that = this, e = event.data;

        popcornReady( e, function( framePopcorn ) { 

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

        } );
      }

      // listen for a trackeventadded
      this.listen( "trackeventupdated", function ( e ) {
        this.teAdded( e ); 
      }); // listener

      this.listen( "trackeventadded", function ( e ) {
        e = e.data;

          if ( !win.Popcorn ) {
            throw new Error("Popcorn Not Available");
          }

          if( !popcorns[ media.getId() ] ) {
            popcorns[ media.getId() ] = framePopcorn;
          } else {
            framePopcorn = popcorns[ media.getId() ]; 
          }

          console.log(that.getPopcorn());
          // add track events to the iframe verison of popcorn
          framePopcorn[ e.type ]( ( iframe.contentWindow || iframe.contentDocument ).Popcorn.extend( {}, e.popcornOptions ) );
          
          butterIds[ e.getId() ] = framePopcorn.getLastTrackEventId();

          e.manifest = framePopcorn.getTrackEvent( butterIds[ e.getId() ] )._natives.manifest;
      }); // listener

      this.listen( "trackeventremoved", function( e ) {
        var ifrme = iframe.contentWindow || iframe.contentDocument;
        ifrme[ "popcorn" + media.getId() ].removeTrackEvent( butterIds[ e.data.getId() ] );
      } );

      this.listen( "mediachanged", function( e ) {
        console.log(e.data.getId());
        that.buildPopcorn( e.data );
        
      } );

      this.listen( "mediatimeupdate", function( e ) {
        iframe.contentWindow[ "popcorn" + media.getId() ].currentTime( e.data.currentTime() );
      }, "timeline" );
      
      this.listen( "mediacontentchanged", function( e ) {
        console.log(e.data.getId());
        that.buildPopcorn( e.data, function(){ console.log(that.getPopcorn()); }  );

      } );

    } // fillIframe
    
  });
})(window, document, undefined, Butter);


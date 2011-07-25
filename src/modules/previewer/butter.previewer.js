(function (window, document, undefined, Butter) {

  var urlRegex, videoURL,
    iframe, iframeBody,
    popcornString, butterId,
    userSetMedia, videoString,
    popcornURL, originalHead,
    popcorns;

  Butter.registerModule( "previewer", {

    // setup function used to set default values, as well as setting up the iframe
    setup: function( options ) {
      
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
    }, // setup

    extend: {
    
      

      // scraper function that scrapes all DOM elements of the given layout,
      // only scrapes elements with the butter-data attribute
      scraper: function( iframe, callback ) {

        // obtain a reference to the iframes body
        var body = iframe.contentWindow.document.getElementsByTagName( "BODY" ),
            that = this;
        
        Butter.extend( originalHead, iframe.contentWindow.document.head );

        //originalHead = iframe.contentWindow.document.head;

        // store original iframeBody incase we rebuild
        iframeBody = "<body>" + iframe.contentWindow.document.body.innerHTML + "</body>\n";

        // function to ensure body is actually there
        var ensureLoaded = function() {

          if ( body.length < 1 ) {
            setTimeout( function() {
              ensureLoaded();
            }, 5 );      
          } else {

            // begin scraping once body is actually there, call callback once done
            bodyReady( body[ 0 ].children );
            callback();
          } // else
        } // ensureLoaded

        ensureLoaded();

        // scraping is done here
        function bodyReady( children ) {

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
              that.addMedia( { 
                name: children[ i ].id, 
                media: userSetMedia
              } );
            } // else

            // ensure we get every child, search recursively
            if ( children[ i ].children.length > 0 ) {

              bodyReady( children[ i ].children );
            } // if
          } // for
        } // ok

      }, // scraper

      // buildPopcorn function, builds an instance of popcorn in the iframe and also
      // a local version of popcorn
      buildPopcorn: function( videoTarget, callback ) {

        videoURL = this.getCurrentMedia().getMedia();

        // default to first butter-media tagged object if none is specified
        videoTarget = videoTarget || this.getAllMedia()[ 0 ].getName();

        iframe.contentWindow.document.body.innerHTML = iframeBody;
        
        // create a string that will create an instance of popcorn with the proper video source
        popcornString = "document.addEventListener('DOMContentLoaded', function () {\n";        

        var regexResult = urlRegex.exec( videoURL ) || "",
            players = [], that = this;

        players[ "youtu" ] = function() {
          iframe.contentWindow.document.getElementById( videoTarget ).innerHTML = "";
          videoString[ that.getCurrentMedia().getId() ] = "popcorn" + that.getCurrentMedia().getId() + " = Popcorn( Popcorn.youtube( '" + videoTarget + "', '" +
            videoURL + "', {\n" + 
            "width: 430, height: 300\n" + 
          "} ) );\n";
        };

        players[ "vimeo " ] = function() {
          iframe.contentWindow.document.getElementById( videoTarget ).innerHTML = "";
          videoString[ that.getCurrentMedia().getId() ] = "popcorn" + that.getCurrentMedia().getId() + " = Popcorn( Popcorn.vimeo( '" + videoTarget + "', '" +
          videoURL + "', {\n" +
            "css: {\n" +
              "width: '430px',\n" +
              "height: '300px'\n" +
            "}\n" +
          "} ) );\n";
        };

        players[ "soundcloud" ] = function() {
          iframe.contentWindow.document.getElementById( videoTarget ).innerHTML = "";
          videoString[ that.getCurrentMedia().getId() ] = "popcorn" + that.getCurrentMedia().getId() + " = Popcorn( Popcorn.soundcloud( '" + videoTarget + "'," +
          " '" + videoURL + "' ) );\n";
        };

        players[ "baseplayer" ] = function() {
          iframe.contentWindow.document.getElementById( videoTarget ).innerHTML = "";
          videoString[ that.getCurrentMedia().getId() ] = "popcorn" + that.getCurrentMedia().getId() + " = Popcorn( Popcorn.baseplayer( '" + videoTarget + "' ) );\n";
        };

        players[ undefined ] = function() {
          var src = document.createElement( "source" ),
          video = document.createElement( "video" );
          src.src = videoURL;

          video.style.width = videoTarget.width;
          video.style.height = videoTarget.height;
          video.appendChild( src );
          video.controls = true;
          video.id = videoTarget + "-butter";
          
          
          iframe.contentWindow.document.getElementById( videoTarget ).appendChild( video );

          var vidId = "#" + video.id;      

          videoString[ that.getCurrentMedia().getId() ] = "popcorn" + that.getCurrentMedia().getId() + " = Popcorn( '" + vidId + "');\n";
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

        popcornString += "}, false);";  

        this.fillIframe( callback );
      },

      getPopcorn: function( callback ) {
        var popcornz = "var " + videoString;
        
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

      },
    
      // fillIframe function used to populate the iframe with changes made by the user,
      // which is mostly managing track events added by the user
      fillIframe: function( callback ) {
        
        var popcornScript, iframeHead, body,
            that = this, doc = iframe.contentWindow.document; 

        // create a script within the iframe and populate it with our popcornString
        popcornScript = doc.createElement( "script" );
        popcornScript.innerHTML = popcornString;

        doc.head.appendChild( popcornScript );

        // create a new head element with our new data
        iframeHead = "<head>" + originalHead.innerHTML + "\n<script src='" + popcornURL + "'>" + 
          "</script>\n<script>\n" + popcornString + "</script>";

        iframeHead += "\n</head>\n";

        // create a new body element with our new data
        body = doc.body.innerHTML;

        // open, write our changes to the iframe, and close it
        doc.open();
        doc.write( "<html>\n" + iframeHead + body + "\n</html>" );
        doc.close();

        var popcornReady = function( e, callback2 ) {
            
          var framePopcorn = iframe.contentWindow[ "popcorn" + that.getCurrentMedia().getId() ];

          if ( !framePopcorn ) {
            setTimeout( function() {
              popcornReady( e, callback2 );
            }, 10 );
          } else {
            callback2 && callback2( framePopcorn );
          } // else  
        }

        popcornReady( null, function( framePopcorn ) {
    
          var videoReady = function() {

            if( framePopcorn.media.readyState >= 2 || framePopcorn.media.duration > 0 ) {
              that.duration = framePopcorn.media.duration;
              that.trigger( "videoReady", that.getCurrentMedia() );
            } else {
              setTimeout( function() {
                videoReady( framePopcorn );
              }, 10);
            }
          }
          videoReady( framePopcorn );
        } );

        this.teAdded = function( e ) {
          var that = this;

          popcornReady( e, function( framePopcorn ) { 
          
            if( !popcorns[ that.getCurrentMedia().getId() ] ) {
                popcorns[ that.getCurrentMedia().getId() ] = framePopcorn;
            } else {
              framePopcorn = popcorns[ that.getCurrentMedia().getId() ]; 
            }

            // add track events to the iframe verison of popcorn
            framePopcorn[ e.type ]( iframe.contentWindow.Popcorn.extend( {},
              e.popcornOptions ) );
            
            butterIds[ e.getId() ] = framePopcorn.getLastTrackEventId();

            e.manifest = framePopcorn.getTrackEvent( butterIds[ e.getId() ] )._natives.manifest;

            callback && callback();
          } );
        }

        // listen for a trackeventadded
        this.listen( "trackeventadded", this.teAdded ); // listener

        this.listen( "trackeventremoved", function( e ) {
          iframe.contentWindow.popcorn.removeTrackEvent( butterIds[ e.getId() ] );
        } );

        this.listen( "mediachanged", function( e ) {
          that.buildPopcorn( e.getName() );
        } );

        this.listen( "timeupdate", function( e ) {
          iframe.contentWindow[ "popcorn" + that.getCurrentMedia().getId() ].video.currentTime = e; 
          that.currentTime = iframe.contentWindow[ "popcorn" + that.getCurrentMedia().getId() ].video.currentTime;
        } );

      } // fillIframe
    }, // exnteds
    
  });
})(window, document, undefined, Butter);

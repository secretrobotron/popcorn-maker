(function ( window, document, Butter, undefined ) {

  Butter.registerModule( "timeline", function ( options ) {
  
    var mediaInstances = {},
        currentMediaInstance,
        target = document.getElementById( options.target ) || options.target,
        b = this, targettedEvent;

    this.findAbsolutePosition = function (obj) {
	    var curleft = curtop = 0;
	    if (obj.offsetParent) {
		    do {
			    curleft += obj.offsetLeft;
			    curtop += obj.offsetTop;
		    } while (obj = obj.offsetParent);
	    }
	    return [curleft,curtop];
    //returns an array
    };

    this.moveFrameLeft = function() {

      if ( targettedEvent ) {

        var cornOptions = targettedEvent.options.popcornOptions;
        cornOptions.start > 0.25 ? cornOptions.start -= 0.25 : cornOptions.start = 0;
        cornOptions.end -= 0.25;
        this.trigger( "trackeventupdated", targettedEvent.options );
      }
    };

    this.moveFrameRight = function() {

      if ( targettedEvent ) {

        var cornOptions = targettedEvent.options.popcornOptions;
        cornOptions.end > 0.25 ? cornOptions.end += 0.25 : cornOptions.end = 0;
        cornOptions.start += 0.25;
        this.trigger( "trackeventupdated", targettedEvent.options );
      }
    };
    // Convert an SMPTE timestamp to seconds
    this.smpteToSeconds = function( smpte ) {
      var t = smpte.split(":");

      if ( t.length === 1 ) {
        return parseFloat( t[0], 10 );
      }

      if (t.length === 2) {
        return parseFloat( t[0], 10 ) + parseFloat( t[1] / 12, 10 );
      }

      if (t.length === 3) {
        return parseInt( t[0] * 60, 10 ) + parseFloat( t[1], 10 ) + parseFloat( t[2] / 12, 10 );
      }

      if (t.length === 4) {
        return parseInt( t[0] * 3600, 10 ) + parseInt( t[1] * 60, 10 ) + parseFloat( t[2], 10 ) + parseFloat( t[3] / 12, 10 );
      }
    }; //smpteToSeconds

    this.secondsToSMPTE = function( time ) {

      var timeStamp = new Date( 1970,0,1 ),
          seconds;

      timeStamp.setSeconds( time );

      seconds = timeStamp.toTimeString().substr( 0, 8 );

      if ( seconds > 86399 )  {

        seconds = Math.floor( (timeStamp - Date.parse("1/1/70") ) / 3600000) + seconds.substr(2);

      }
      return seconds;
    }; //secondsToSMPTE
    
    var createContainer = function() {
      var container = document.createElement( "div" );
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.position = "relative";
      container.style.MozUserSelect = "none";
      container.style.webkitUserSelect = "none";
      container.style.oUserSelect = "none";
      container.style.userSelect = "none";
      container.id = "funbagofcontainers";
      return container;
    };

    var MediaInstance = function( media ) {

      // capturing self to be used inside element event listeners
      var self = this;
      
      this.initialized = false;
      
      target.appendChild( this.container = createContainer() );

      this.tracks = document.createElement( "div" );
      this.tracks.style.width = "100%";
      this.tracks.style.height = "100%";
      this.tracks.id = "funbags";

      this.init = function() {
      
        this.initialized = true;
        this.duration = media.duration();
        
        //target.appendChild( this.container = createContainer() );

        this.trackLine = new TrackLiner({
          element: this.tracks,
          dynamicTrackCreation: true,
          scale: 1,
          duration: this.duration,
          restrictToKnownPlugins: true
        });

        this.lastTrack;
        this.butterTracks = {};
        this.trackLinerTracks = {};
        this.butterTrackEvents = {};
        this.trackLinerTrackEvents = {};
        this.container.appendChild( this.tracks );
        //this.container.style.display = "none";

      };

      this.destroy = function() {
        target.removeChild( this.container );
      };

      this.hide = function() {

        this.container.style.display = "none";
      };

      this.show = function() {

        this.container.style.display = "block";
      };
      
      this.media = media;
    };

    TrackLiner.plugin( "butterapp", {
      // called when a new track is created
      trackMoved: function( track, index ) {

        currentMediaInstance.butterTracks[ track.id() ].newPos = index;
        b.trigger( "trackmoved", currentMediaInstance.butterTracks[ track.id() ] );
      },
      setup: function( track, trackEventObj, event, ui ) {

        // setup for data-trackliner-type
        if ( ui ) {

          var trackLinerTrack = track;

          // if the track is not registered in butter
          // remove it, and call b.addTrack
          if ( !currentMediaInstance.butterTracks[ track.id() ] ) {

            currentMediaInstance.trackLine.removeTrack( trackLinerTrack );

            b.addTrack( new Butter.Track() );
            trackLinerTrack = currentMediaInstance.lastTrack;
          }
          currentMediaInstance.lastTrack = trackLinerTrack;

          var start = trackEventObj.left / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration,
              end = start + 4;

          b.addTrackEvent( currentMediaInstance.butterTracks[ currentMediaInstance.lastTrack.id() ], new Butter.TrackEvent({ popcornOptions: {start: start, end: end }, type: ui.draggable[ 0 ].id }) );
        // setup for createTrackEvent()
        } else {

          var start = trackEventObj.popcornOptions.start,
              end = trackEventObj.popcornOptions.end,
              width = ( end - start ) / currentMediaInstance.duration * track.getElement().offsetWidth,
              left = start / currentMediaInstance.duration * track.getElement().offsetWidth;

          return { left: left, innerHTML: trackEventObj.type, classes: [ "track-event", "butter-track-event", trackEventObj.type ], width: width };
        }
      },
      // called when an existing track is moved
      moved: function( track, trackEventObj, event, ui ) {

        var trackLinerTrack = track;

        trackEventObj.options.popcornOptions.start = trackEventObj.element.offsetLeft / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration;
        trackEventObj.options.popcornOptions.end = ( trackEventObj.element.offsetLeft + trackEventObj.element.offsetWidth ) / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration;

        // if the track is not registered in butter
        // remove it, and call b.addTrack
        if ( !currentMediaInstance.butterTracks[ track.id() ] ) {

          currentMediaInstance.trackLine.removeTrack( trackLinerTrack );

          b.addTrack( new Butter.Track() );
          trackLinerTrack = currentMediaInstance.lastTrack;
          trackLinerTrack.addTrackEvent( trackEventObj );
        }// else {
          //trackEventObj.options.track.removeTrackEvent( trackEventObj.options );
          //currentMediaInstance.butterTracks[ track.id() ].addTrackEvent( trackEventObj.options );
        //}

        currentMediaInstance.lastTrack = trackLinerTrack;

        b.trigger( "trackeventupdated", trackEventObj.options );
      },
      // called when a track event is clicked
      click: function ( track, trackEventObj, event, ui ) {
        targettedEvent = trackEventObj;
      },

      // called when a track event is double clicked
      dblclick: function( track, trackEventObj, event, ui ) {

        b.editTrackEvent && b.editTrackEvent( trackEventObj.options );
      }
    });
    
    var addTrack = function( track ) {

      if( !currentMediaInstance.trackLine ) {
        return;
      }

      var trackLinerTrack = currentMediaInstance.trackLine.createTrack( undefined, "butterapp");
      currentMediaInstance.trackLinerTracks[ track.getId() ] = trackLinerTrack;
      currentMediaInstance.lastTrack = trackLinerTrack;
      currentMediaInstance.butterTracks[ trackLinerTrack.id() ] = track;
    };

    this.listen( "trackadded", function( event ) {
    
      if ( !currentMediaInstance ) {
        return;
      }

       addTrack( event.data );

    });

    this.listen( "trackremoved", function( event ) {

      var track = event.data;
      var trackLinerTrack = currentMediaInstance.trackLinerTracks[ track.getId() ],
          trackEvents = trackLinerTrack.getTrackEvents(),
          trackEvent;

      currentMediaInstance.trackLine.removeTrack( trackLinerTrack );
      delete currentMediaInstance.butterTracks[ trackLinerTrack.id() ];
      delete currentMediaInstance.trackLinerTracks[ track.getId() ];
    });

    var addTrackEvent = function( trackEvent ) {
      if( !currentMediaInstance.trackLinerTracks ) {
        return;
      }

      var trackLinerTrackEvent = currentMediaInstance.trackLinerTracks[ trackEvent.track.getId() ].createTrackEvent( "butterapp", trackEvent );
      currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ] = trackLinerTrackEvent;
      currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ]
    };

    this.listen( "trackeventadded", function( event ) {
    
      if ( !currentMediaInstance ) {
        return;
      }

      addTrackEvent( event.data );
      
    });

    this.listen( "trackeventremoved", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ],
          trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId );
      currentMediaInstance.lastTrack = trackLinerTrack;
      trackLinerTrack && trackLinerTrack.removeTrackEvent( trackLinerTrackEvent.element.id );
      delete currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];
      delete currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ];
    });

    var butter = this;

    this.listen( "mediaadded", function( event ) {
      
      mediaInstances[ event.data.getId() ] = new MediaInstance( event.data );

      function mediaChanged( event ) {

        if ( currentMediaInstance !== mediaInstances[ event.data.getId() ] ) {
          currentMediaInstance && currentMediaInstance.hide();
          currentMediaInstance = mediaInstances[ event.data.getId() ];
          currentMediaInstance && currentMediaInstance.show();
          butter.trigger( "timelineready", {}, "timeline" );
        }
      }

      function mediaReady ( event ) {
        var mi = mediaInstances[ event.data.getId() ];
        if ( !mi.initialized ) {
          mi.init();
          
          var media = event.data,
          tracks = media.getTracks();
          
          for ( var i = 0, tlength = tracks.length; i < tlength; i++ ) {
            var t = tracks[ i ],
            trackEvents = t.getTrackEvents();
            
            addTrack ( t );
            
            for ( var j = 0, teLength = trackEvents.length; j < teLength; j++ ) {
              addTrackEvent( trackEvents [ j ] );
            } // add Track Events per Track
          } //add Tracks
          butter.trigger( "timelineready", {}, "timeline" );
        }
      };

      function mediaRemoved( event ) {
      
        if ( mediaInstances[ event.data.getId() ] ) {
          mediaInstances[ event.data.getId() ].destroy();
        }

        delete mediaInstances[ event.data.getId() ];
        
        
        if ( event.data.getId() === currentMediaInstance.media.getId() ) {
          currentMediaInstance = undefined;
        }

        butter.unlisten( "mediachanged", mediaChanged );
        butter.unlisten( "mediaremoved", mediaRemoved );
        butter.unlisten( "mediaready", mediaReady );
      }

      butter.listen( "mediachanged", mediaChanged );
      butter.listen( "mediaremoved", mediaRemoved );
      butter.listen( "mediaready", mediaReady );

    });


    this.listen( "trackeventupdated", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ],
          elem = trackLinerTrackEvent.element,
          trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId ),      
          start = trackEvent.popcornOptions.start,
          end = trackEvent.popcornOptions.end;
          
      trackLinerTrackEvent.element.style.width = ( end - start ) / currentMediaInstance.duration * target.offsetWidth + "px";
      trackLinerTrackEvent.element.style.left = start / currentMediaInstance.duration * target.offsetWidth + "px";

      //trackEvent.track.removeTrackEvent( trackEvent );
      //currentMediaInstance.butterTracks[ currentMediaInstance.lastTrack.id() ].addTrackEvent( trackEvent );
    });

    this.currentTimeInPixels = function( pixel ) {

      if ( pixel != null) {

        b.currentTime( pixel / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration );
        b.trigger( "mediatimeupdate", currentMediaInstance.media, "timeline" );
      } //if
      return b.currentTime() / currentMediaInstance.duration * ( currentMediaInstance.container.offsetWidth );
    };

    var trackLinerEvent;
    var start;
    var end;
    var originalWidth = target.offsetWidth;
    var currentZoom = 1;
    this.zoom = function( detail ) {

      if ( detail < 0 && currentZoom < 6 ) {

        currentZoom++;
      } else if ( detail > 0 && currentZoom > 1 ) {

        currentZoom--;
      }

      target.style.width = originalWidth * currentZoom + "px";

      for ( var i in currentMediaInstance.trackLinerTrackEvents ) {

        trackLinerEvent = currentMediaInstance.trackLinerTrackEvents[ i ];
        start = trackLinerEvent.options.popcornOptions.start;
        end = trackLinerEvent.options.popcornOptions.end;
        trackLinerEvent.element.style.width = ( end - start ) / currentMediaInstance.duration * target.offsetWidth + "px";
        trackLinerEvent.element.style.left = start / currentMediaInstance.duration * target.offsetWidth + "px";
      }
      //b.trigger( "mediatimeupdate", currentMediaInstance.media, "timeline" );
    };
  });

})( window, window.document, Butter );


/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function() {

  define( [ "core/logger", "core/eventmanager", "core/trackevent", "comm/comm" ], function( Logger, EventManager, TrackEvent, Comm ) {

    var Timeline = function( butter, options ) {

      var mediaInstances = {},
          currentMediaInstance,
          target = document.getElementById( options.target ) || options.target;

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

      this.moveFrameLeft = function( event ) {

        if ( butter.targettedEvent ) {

          event.preventDefault();
          var cornOptions = butter.targettedEvent.popcornOptions;
          var inc = event.shiftKey ? 2.5 : 0.25;

          if ( cornOptions.start > inc ) {

            cornOptions.start -= inc;
            if ( !event.ctrlKey && !event.metaKey ) {

              cornOptions.end -= inc;
            }
          } else {

            if ( !event.ctrlKey ) {

              cornOptions.end = cornOptions.end - cornOptions.start;
            }
            cornOptions.start = 0;
          }

          butter.dispatch( "trackeventupdated", butter.targettedEvent );
        }
      };

      this.moveFrameRight = function( event ) {

        if ( butter.targettedEvent ) {

          event.preventDefault();
          var cornOptions = butter.targettedEvent.popcornOptions;
          var inc = event.shiftKey ? 2.5 : 0.25;

          if ( cornOptions.end < butter.duration - inc ) {

            cornOptions.end += inc;
            if ( !event.ctrlKey && !event.metaKey ) {

              cornOptions.start += inc;
            }
          } else {

            if ( !event.ctrlKey ) {

              cornOptions.start += butter.duration - cornOptions.end;
            }
            cornOptions.end = butter.duration;
          }

          butter.dispatch( "trackeventupdated", butter.targettedEvent );
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
        container.id = "timeline-container";
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
        this.tracks.id = "tracks-container";

        this.init = function() {
        
          this.initialized = true;
          this.duration = media.duration;
          
          //target.appendChild( this.container = createContainer() );

          this.trackLine = new TrackLiner({
            element: this.tracks,
            dynamicTrackCreation: true,
            scale: 1,
            duration: this.duration//,
            //restrictToKnownPlugins: true
          });

          this.trackLine.listen( "trackupdated", function( event ) {

            var track = event.data.track,
                index = event.data.index;

            currentMediaInstance.butterTracks[ track.id() ].newPos = index;
            butter.dispatch( "trackmoved", currentMediaInstance.butterTracks[ track.id() ] );
          });

          this.trackLine.listen( "trackeventupdated", function( e ) {

            var track = e.data.track,
                trackEventObj = e.data.trackEvent,
                event = e.data.event,
                ui = e.data.ui,
                trackLinerTrack = track;

            trackEventObj.options.popcornOptions.start = Math.max( 0, trackEventObj.element.offsetLeft / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration );
            trackEventObj.options.popcornOptions.end = Math.max( 0, ( trackEventObj.element.offsetLeft + trackEventObj.element.offsetWidth ) / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration );

            // if the track is not registered in butter
            // remove it, and call b.addTrack
            if ( !currentMediaInstance.butterTracks[ track.id() ] ) {

              currentMediaInstance.trackLine.removeTrack( trackLinerTrack );

              butter.addTrack( new Butter.Track() );
              trackLinerTrack = currentMediaInstance.lastTrack;
              trackLinerTrack.addTrackEvent( trackEventObj );
            }

            currentMediaInstance.lastTrack = trackLinerTrack;

            butter.dispatch( "trackeventupdated", trackEventObj.options );
          });

          this.trackLine.listen( "trackeventcreated", function( e ) {

            var track = e.data.track,
                trackEventObj = e.data.trackEvent,
                event = e.data.event,
                ui = e.data.ui;

            if ( trackEventObj.popcornOptions ) {

              var start = trackEventObj.popcornOptions.start,
                  end = trackEventObj.popcornOptions.end,
                  width = Math.max( 3, ( end - start ) / currentMediaInstance.duration * track.getElement().offsetWidth ),
                  left = start / currentMediaInstance.duration * track.getElement().offsetWidth;

              trackEventObj.left = left;
              trackEventObj.innerHTML = trackEventObj.type;
              trackEventObj.classes = [ "track-event", "butter-track-event", trackEventObj.type ];
              trackEventObj.width = width;
            }
          });

          this.trackLine.listen( "trackeventdropped", function( e ) {

            var track = e.data.track,
                trackEventObj = e.data.trackEvent,
                event = e.data.event,
                ui = e.data.ui;

            if ( ui ) {

              var trackLinerTrack = track;

              // if the track is not registered in butter
              // remove it, and call b.addTrack
              if ( !currentMediaInstance.butterTracks[ track.id() ] ) {

                currentMediaInstance.trackLine.removeTrack( trackLinerTrack );

                butter.addTrack( new Butter.Track() );
                trackLinerTrack = currentMediaInstance.lastTrack;
              }
              currentMediaInstance.lastTrack = trackLinerTrack;

              var start = trackEventObj.left / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration,
                  end = start + 4;

              var elementId = ui.draggable[ 0 ].id,
                  extractedType = elementId.substring( butter.pluginmanager.pluginElementPrefix.length );

              butter.addTrackEvent( currentMediaInstance.butterTracks[ currentMediaInstance.lastTrack.id() ], new Butter.TrackEvent({ popcornOptions: {start: start, end: end }, type: extractedType }) );
            }
          });

          this.trackLine.listen( "trackeventclicked", function( e ) {

            var track = e.data.track,
                trackEventObj = e.data.trackEvent,
                event = e.data.event,
                ui = e.data.ui;

            butter.targettedEvent = trackEventObj.options;
          });

          this.trackLine.listen( "trackeventdoubleclicked", function( e ) {

            var track = e.data.track,
                trackEventObj = e.data.trackEvent,
                event = e.data.event,
                ui = e.data.ui;

            if ( butter.eventeditor ) {
              butter.eventeditor.editTrackEvent( trackEventObj.options );
            }
          });

          this.lastTrack;
          this.butterTracks = {};
          this.trackLinerTracks = {};
          this.butterTrackEvents = {};
          this.trackLinerTrackEvents = {};
          this.container.appendChild( this.tracks );
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
      
      var addTrack = function( track ) {

        if( !currentMediaInstance.trackLine ) {
          return;
        }

        var trackLinerTrack = currentMediaInstance.trackLine.createTrack();
        currentMediaInstance.trackLinerTracks[ track.id ] = trackLinerTrack;
        currentMediaInstance.lastTrack = trackLinerTrack;
        currentMediaInstance.butterTracks[ trackLinerTrack.id() ] = track;
      };

      butter.listen( "trackadded", function( event ) {
      
        if ( !currentMediaInstance ) {
          return;
        }

         addTrack( event.data );

      });

      butter.listen( "trackremoved", function( event ) {

        var track = event.data;
        var trackLinerTrack = currentMediaInstance.trackLinerTracks[ track.id ],
            trackEvents = trackLinerTrack.trackEvents,
            trackEvent;

        currentMediaInstance.trackLine.removeTrack( trackLinerTrack );
        delete currentMediaInstance.butterTracks[ trackLinerTrack.id() ];
        delete currentMediaInstance.trackLinerTracks[ track.id ];
      });

      var addTrackEvent = function( trackEvent ) {
        if( !currentMediaInstance.trackLinerTracks ) {
          return;
        }

        var trackLinerTrackEvent = currentMediaInstance.trackLinerTracks[ trackEvent.track.id ].createTrackEvent( trackEvent );
        currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ] = trackLinerTrackEvent;
        currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ]
      };

      butter.listen( "trackeventadded", function( event ) {
      
        if ( !currentMediaInstance ) {
          return;
        }

        addTrackEvent( event.data );
        butter.targettedEvent = event.data;

      });

      butter.listen( "trackeventremoved", function( event ) {

        var trackEvent = event.data;
        var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ],
            trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId );
        currentMediaInstance.lastTrack = trackLinerTrack;
        trackLinerTrack && trackLinerTrack.removeTrackEvent( trackLinerTrackEvent.element.id );
        delete currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];
        delete currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ];
      });

      butter.listen( "mediaadded", function( event ) {
        
        mediaInstances[ event.data.id ] = new MediaInstance( event.data );

        function mediaChanged( event ) {

          if ( currentMediaInstance !== mediaInstances[ event.data.id ] ) {
            currentMediaInstance && currentMediaInstance.hide();
            currentMediaInstance = mediaInstances[ event.data.id ];
            currentMediaInstance && currentMediaInstance.show();
            butter.dispatch( "timelineready", {}, "timeline" );
          }
        }

        function mediaReady ( event ) {
          var mi = mediaInstances[ event.data.id ];
          if ( !mi.initialized ) {
            mi.init();
            
            var media = event.data,
            tracks = media.tracks;
            
            for ( var i = 0, tlength = tracks.length; i < tlength; i++ ) {
              var t = tracks[ i ],
              trackEvents = t.trackEvents;
              
              addTrack ( t );
              
              for ( var j = 0, teLength = trackEvents.length; j < teLength; j++ ) {
                addTrackEvent( trackEvents [ j ] );
              } // add Track Events per Track
            } //add Tracks
            butter.dispatch( "timelineready", {}, "timeline" );
          }
        };

        function mediaRemoved( event ) {
        
          if ( mediaInstances[ event.data.id ] ) {
            mediaInstances[ event.data.id ].destroy();
          }

          delete mediaInstances[ event.data.id ];
          
          
          if ( currentMediaInstance && ( event.data.id === currentMediaInstance.media.id ) ) {
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


      butter.listen( "trackeventupdated", function( event ) {

        var trackEvent = event.data;
        var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ],
            elem = trackLinerTrackEvent.element,
            trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId ),      
            start = trackEvent.popcornOptions.start,
            end = trackEvent.popcornOptions.end;
            
        trackLinerTrackEvent.element.style.width = Math.max( 3, ( end - start ) / currentMediaInstance.duration * target.offsetWidth ) + "px";
        trackLinerTrackEvent.element.style.left = start / currentMediaInstance.duration * target.offsetWidth + "px";
      });

      this.currentTimeInPixels = function( pixel ) {
        if ( pixel != null) {

          butter.currentTime = pixel / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration;
          butter.dispatch( "mediatimeupdate", currentMediaInstance.media, "timeline" );
        } //if
        return butter.currentTime / currentMediaInstance.duration * ( currentMediaInstance.container.offsetWidth );
      };

      var trackLinerEvent;
      var start;
      var end;
      var originalWidth = target.offsetWidth;
      var currentZoom = 1;
      this.zoom = function( detail ) {
        if ( originalWidth === 0 ) {
          //in case target is invisible or something first
          originalWidth = target.offsetWidth;
        }

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
          trackLinerEvent.element.style.width = Math.max( 3, ( end - start ) / currentMediaInstance.duration * target.offsetWidth ) + "px";
          trackLinerEvent.element.style.left = start / currentMediaInstance.duration * target.offsetWidth + "px";
        }
      };

    }; //Timeline

    return {
      name: "timeline",
      init: function( butter, options ) {
        return new Timeline( butter, options );
      }
    };

  }); //define

})();


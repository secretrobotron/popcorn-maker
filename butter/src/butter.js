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

(function ( window, document, undefined ) {

  define( [ "core/logger", 
            "core/eventmanager", 
            "core/track", 
            "core/trackevent", 
            "core/target", 
            "core/media" ],
          function( Logger, EventManager, Track, TrackEvent, Target, Media ) {

    var Butter = function ( options ) {

      var events = {},
          medias = [],
          currentMedia,
          targets = [],
          projectDetails = {},
          id = "Butter" + Butter.guid++,
          logger = new Logger( id ),
          em = new EventManager( { logger: logger } ),
          that = this;

      em.apply( "Butter", this );

      options = options || {};
          
      Object.defineProperty( this, "id", { get: function() { return id; } } );

      function checkMedia() {
        if ( !currentMedia ) {
          throw new Error("No media object is selected");
        } //if
      }

      this.getManifest = function ( name ) {
        checkMedia();
        return currentMedia.getManifest( name );
      }; //getManifest

      /****************************************************************
       * TrackEvent methods
       ****************************************************************/
      //addTrackEvent - Creates a new Track Event
      this.addTrackEvent = function ( track, trackEvent ) {
        checkMedia();
        if ( typeof(track) === "string" ) {
          track = currentMedia.getTrack( track );
        } //if
        if ( track ) {
          if ( !(trackEvent instanceof TrackEvent) ) {
            trackEvent = new TrackEvent( trackEvent );
          } //if
          track.addTrackEvent( trackEvent );
          return trackEvent;
        }
        else {
          throw new Error("No valid track specified");
        } //if
      }; //addTrackEvents

      Object.defineProperty( this, "trackEvents", {
        get: function() {
          checkMedia();
          var tracks = currentMedia.tracks, trackEvents = {};
          for ( var i=0, l=tracks.length; i<l; ++i ) {
            var track = tracks[i];
            trackEvents[ track.name ] = track.trackEvents;
          } //for
          return trackEvents;
        }
      });

      //flattenTrackEvents - Get a list of Track Events
      this.flattenTrackEvents = function ( flatten ) {
        checkMedia();
        var tracks = currentMedia.tracks, trackEvents = [];
        for ( var i=0, l=tracks.length; i<l; ++i ) {
          var track = tracks[i];
          trackEvents = trackEvents.concat( track.trackEvents );
        } //for
        return trackEvents;
      }; //flattenTrackEvents

      this.getTrackEvent = function ( track, trackEvent ) {
        checkMedia();
        if ( track && trackEvent ) {
          if ( typeof(track) === "string" ) {
            track = that.getTrack( track );
          } //if
          return track.getTrackEvent( trackEvent );
        }
        else {
          var events = that.trackEvents;
          for ( var trackName in events ) {
            var t = events[ trackName ];
            for ( var i=0, l=t.length; i<l; ++i ) {
              if ( t[ i ].name === track ) {
                return t[ i ];
              }
            }
          } //for
        } //if
      }; //getTrackEvent

      //removeTrackEvent - Remove a Track Event
      this.removeTrackEvent = function ( track, trackEvent ) {

        checkMedia();

        // one param given
        if ( !trackEvent ) {
          if ( track instanceof TrackEvent ) {
            trackEvent = track;
            track = trackEvent.track;
          }
          else if ( typeof(track) === "string" ) {
            trackEvent = that.getTrackEvent( track );
            track = trackEvent.track;
          }
          else {
            throw new Error("Invalid parameters for removeTrackEvent");
          }
        } //if

        if ( typeof( track ) === "string") {
          track = that.getTrack( track );
        }

        if ( typeof( trackEvent ) === "string" ) {
          trackEvent = track.getTrackEvent( trackEvent );
        }

        track.removeTrackEvent( trackEvent );
        return trackEvent;
      };

      /****************************************************************
       * Track methods
       ****************************************************************/
      //addTrack - Creates a new Track
      this.addTrack = function ( track ) {
        checkMedia();
        return currentMedia.addTrack( track );
      }; //addTrack

      //tracks - Get a list of Tracks
      Object.defineProperty( this, "tracks", {
        get: function() {
          return currentMedia.tracks;
        }
      });

      //getTrack - Get a Track by its id
      this.getTrack = function ( name ) {
        checkMedia();
        return currentMedia.getTrack( name );
      }; //getTrack

      //removeTrack - Remove a Track
      this.removeTrack = function ( track ) {
        checkMedia();
        return currentMedia.removeTrack( track );
      };

      /****************************************************************
       * Target methods
       ****************************************************************/
      //addTarget - add a target object
      this.addTarget = function ( target ) {
        if ( !(target instanceof Target ) ) {
          target = new Target( target );
        } //if

        targets.push( target );

        logger.log( "Target added: " + target.name );
        em.dispatch( "targetadded", target );

        return target;
      }; //addTarget

      //removeTarget - remove a target object
      this.removeTarget = function ( target ) {
        if ( typeof(target) === "string" ) {
          target = that.getTarget( target );
        } //if
        var idx = targets.indexOf( target );
        if ( idx > -1 ) {
          targets.splice( idx, 1 );
          delete targets[ target.name ]; 
          em.dispatch( "targetremoved", target );
          return target;
        } //if
        return undefined;
      }; //removeTarget

      Object.defineProperty( this, "targets", {
        get: function() {
          return targets;
        }
      });

      //serializeTargets - get a list of targets objects
      this.serializeTargets = function () {
        var sTargets = [];
        for ( var i=0, l=targets.length; i<l; ++i ) {
          sTargets.push( targets[ i ].json );
        } 
        return sTargets;
      }; //serializeTargets

      //getTarget - get a target object by its id
      this.getTarget = function ( target ) {
        for ( var i=0; i<targets.length; ++i ) {
          if (  ( target.id !== undefined && targets[ i ].id === target.id ) ||
                ( target.name && targets[ i ].name === target.name ) ||
                targets[ i ].name === target ) {
            return targets[ i ];
          }
        } 
        return undefined;
      }; //getTaget

      /****************************************************************
       * Project methods
       ****************************************************************/
      //importProject - Import project data
      this.importProject = function ( projectData ) {
        projectDetails = projectData.project;
        if ( projectData.targets ) {
          for ( var i=0, l=projectData.targets.length; i<l; ++i ) {

            var t, targets = that.targets, targetData = projectData.targets[ i ];
            for ( var k=0, j=targets.length; k<j; ++k ) {
              if ( targets[ k ].name === targetData.name ) {
                t = targets[ k ];
                break;
              }
            }

            if ( !t ) {
              t = new Target();
              t.json = projectData.targets[ i ];
              that.addTarget( t );
            }
            else {
              t.json = projectData.targets[ i ];
            }
          }
        }
        if ( projectData.media ) {
          for ( var i=0, l=projectData.media.length; i<l; ++i ) {

            var mediaData = projectData.media[ i ],
                m = that.getMedia( { target: mediaData.target } );
            
            if ( !m ) {
              m = new Media();
              m.json = projectData.media[ i ];
              that.addMedia( m );
            }
            else {
              m.json = projectData.media[ i ];
            }
            
          } //for
        } //if projectData.media
      }; //importProject

      //exportProject - Export project data
      this.exportProject = function () {
        var exportJSONMedia = [];
        for ( var m=0, lm=medias.length; m<lm; ++m ) {
          exportJSONMedia.push( medias[ m ].json );
        }
        var projectData = {
          project: projectDetails,
          targets: that.serializeTargets(),
          media: exportJSONMedia
        };
        return projectData;
      };

      //setProjectDetails - set the details of the project
      this.setProjectDetails = function ( key, value ) {
        projectDetails[ key ] = value;
      };

      //getProjectDetails - get the projects details
      this.getProjectDetails = function ( key ) {
        if ( key ) {
          return projectDetails[ key ];
        }
        else {
          return projectDetails;
        }
      };
      
      this.clearProject = function() {
        while ( targets.length > 0 ) {
          that.removeTarget( targets[ 0 ] );
        }
        while ( medias.length > 0 ) {
          that.removeMedia( medias[ 0 ] );
        }
      };

      /****************************************************************
       * Media methods
       ****************************************************************/

      //currentTime - Gets and Sets the media's current time.
      Object.defineProperty( this, "currentTime", {
        get: function() {
          checkMedia();
          return currentMedia.currentTime;
        },
        set: function( time ) {
          checkMedia();
          currentMedia.currentTime = time;
        }
      });

      //duration - Gets and Sets the media's duration.
      Object.defineProperty( this, "duration", {
        get: function() {
          checkMedia();
          return currentMedia.duration;
        },
        set: function( time ) {
          checkMedia();
          currentMedia.duration = time;
        }
      });

      Object.defineProperty( this, "media", {
        get: function() {
          return medias;
        }
      });

      Object.defineProperty( this, "currentMedia", {
        get: function() {
          return currentMedia;
        },
        set: function( media ) {
          if ( typeof( media ) === "string" ) {
            media = that.getMedia( media );
          } //if

          if ( media && medias.indexOf( media ) > -1 ) {
            currentMedia = media;
            logger.log( "Media Changed: " + media.name );
            em.dispatch( "mediachanged", media );
            return currentMedia;
          } //if
        }
      });

      //getMedia - get the media's information
      this.getMedia = function ( media ) {
        for ( var i=0,l=medias.length; i<l; ++i ) {
          if (  ( media.id !== undefined && medias[ i ].id === media.id ) || 
                ( media.name && medias[ i ].name === media.name ) ||
                ( media.target && medias[ i ].target === media.target ) ||
                medias[ i ].name === media ) {
            return medias[ i ];
          }
        }

        return undefined;
      };

       var onMediaContentChanged = em.repeat,
          onMediaDurationChanged = em.repeat,
          onMediaTargetChanged = em.repeat,
          onMediaTimeUpdate = em.repeat,
          onTrackAdded = em.repeat,
          onTrackRemoved = em.repeat,
          onTrackEventAdded = em.repeat,
          onTrackEventRemoved = em.repeat;

      //addMedia - add a media object
      this.addMedia = function ( media ) {
        if ( !( media instanceof Media ) ) {
          media = new Media( media );
        } //if

        var mediaName = media.name;
        medias.push( media );

        media.listen( "mediacontentchanged", onMediaContentChanged );
        media.listen( "mediadurationchanged", onMediaDurationChanged );
        media.listen( "mediatargetchanged", onMediaTargetChanged );
        media.listen( "mediatimeupdate", onMediaTimeUpdate );
        media.listen( "trackadded", onTrackAdded );
        media.listen( "trackremoved", onTrackRemoved );
        media.listen( "trackeventadded", onTrackEventAdded );
        media.listen( "trackeventremoved", onTrackEventRemoved );

        if ( media.tracks.length > 0 ) {
          for ( var ti=0, tl=media.tracks.length; ti<tl; ++ti ) {
            var track = media.tracks[ ti ];
                trackEvents = track.trackEvents;
                media.dispatch( "trackadded", track );
            if ( trackEvents.length > 0 ) {
              for ( var i=0, l=trackEvents.length; i<l; ++i ) {
                track.dispatch( "trackeventadded", trackEvents[ i ] );
              } //for
            } //if
          } //for
        } //if

        em.dispatch( "mediaadded", media );
        if ( !currentMedia ) {
          that.currentMedia = media;
        } //if
        return media;
      }; //addMedia

      //removeMedia - forget a media object
      this.removeMedia = function ( media ) {
        if ( typeof( media ) === "string" ) {
          media = that.getMedia( media );
        } //if

        var idx = medias.indexOf( media );
        if ( idx > -1 ) {
          medias.splice( idx, 1 );
          media.unlisten( "mediacontentchanged", onMediaContentChanged );
          media.unlisten( "mediadurationchanged", onMediaDurationChanged );
          media.unlisten( "mediatargetchanged", onMediaTargetChanged );
          media.unlisten( "mediatimeupdate", onMediaTimeUpdate );
          media.unlisten( "trackadded", onTrackAdded );
          media.unlisten( "trackremoved", onTrackRemoved );
          media.unlisten( "trackeventadded", onTrackEventAdded );
          media.unlisten( "trackeventremoved", onTrackEventRemoved );
          var tracks = media.tracks;
          for ( var i=0, l=tracks.length; i<l; ++i ) {
            em.dispatch( "trackremoved", tracks[i] );
          } //for
          if ( media === currentMedia ) {
            currentMedia = undefined;
          } //if
          em.dispatch( "mediaremoved", media );
          return media;
        } //if
        return undefined;
      }; //removeMedia

      this.extend = function () {
        Butter.extend( that, [].slice.call( arguments, 1 ) );
      };

      this.registerModule = function( modules, modulesOptions, callback ) {
        if ( typeof modules !== "object" ) {
          modules = [ modules ];
        }
        if ( typeof modules !== "object" ) {
          modulesOptions = [ modulesOptions ];
        }
        require( modules, function() {
          for ( var i=0, l=arguments.length; i<l; ++i ) {
            var loadedModule = arguments[ i ];
            that[ loadedModule.name ] = loadedModule.init( that, modulesOptions[ i ] );
          } //for
          callback( loadedModule );
        });
      }; //registerModule

      if ( options.ready ) {
        em.listen( "ready", options.ready );
      } //if

      if ( options.modules ) {
        var numModulesLoaded = 0,
            modulesToLoad = [];
            optionsToGive = [];
        for ( var moduleName in options.modules ) {
          modulesToLoad.push( moduleName + "/module" );
          optionsToGive.push( options.modules[ moduleName ] );
        } //for

        that.registerModule( modulesToLoad, optionsToGive, function( loadedModule ) {
          ++numModulesLoaded;
          if ( numModulesLoaded === modulesToLoad.length ) {
            em.dispatch( "ready", that );
          } //if
        });
      }
      else {
        em.dispatch( "ready", that );
      } //if

    }; //Butter
    Butter.guid = 0;

    Butter.getScriptLocation = function () {
      var scripts = document.querySelectorAll( "script" );
      for ( var i=0; i<scripts.length; ++i ) {
        var pos = scripts[ i ].src.lastIndexOf( 'butter.js' );
        if ( pos > -1 ) {
          return scripts[ i ].src.substr( 0, pos ) + "/";
        } //if
      } //for
    }; //getScriptLocation

    Butter.extend = function ( obj /* , extra arguments ... */) {
      var dest = obj, src = [].slice.call( arguments, 1 );
      src.forEach( function( copy ) {
        for ( var prop in copy ) {
          dest[ prop ] = copy[ prop ];
        }
      });
    }; //extend

    Butter.Media = Media;
    Butter.Track = Track;
    Butter.TrackEvent = TrackEvent;
    Butter.Target = Target;
    Butter.Logger = Logger;
    Butter.EventManager = EventManager;

    window.Butter = Butter;
    return Butter;
  });

})( window, window.document );


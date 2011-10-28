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

  var modules = {};

  /****************************************************************************
   * Track
   ****************************************************************************/
  var numTracks = 0;
  var Track = function ( options ) {
    var trackEvents = [],
        id = numTracks++,
        butter = undefined,
        that = this;

    options = options || {};
    var name = options.name || 'Track' + Date.now();

    Object.defineProperty( this, "name", {
      get: function() {
        return name;
      }
    });

    Object.defineProperty( this, "id", {
      get: function() {
        return id;
      }
    });


    Object.defineProperty( this, "butter", {
      get: function() {
        return butter;
      },
      set: function( b ) {
        butter = b;
        if ( butter ) {
          butter.logger.debug( "Track added" );
          butter.trigger( "trackadded", that );
          var events = that.trackEvents;
          for ( var i=0, l=events.length; i<l; ++i ) {
            events[i].butter =  butter;
          } //for
        }
      }
    });

    Object.defineProperty( this, "json", {
      get: function() {
        var exportJSONTrackEvents = [];
        for ( var i=0, l=trackEvents.length; i<l; ++i ) {
          exportJSONTrackEvents.push( trackEvents[ i ].json );
        }
        return {
          name: name,
          id: id,
          trackEvents: exportJSONTrackEvents
        };
      },
      set: function( importData ) {
        if ( importData.name ) {
          name = importData.name;
        }
        if ( importData.trackEvents ) {
          var importTrackEvents = importData.trackEvents;
          for ( var i=0, l=importTrackEvents.length; i<l; ++i ) {
            var newTrackEvent = new TrackEvent();
            newTrackEvent.json = importTrackEvents[ i ];
            that.addTrackEvent( newTrackEvent );
          }
        }
      }
    });

    this.getTrackEvent = function ( trackEvent ) {
      for ( var i=0, l=trackEvents.length; i<l; ++i) {
        if (  ( trackEvent.id !== undefined && trackEvents[ i ].id === trackEvent.id ) || 
              ( trackEvent.name && trackEvents[ i ].name === trackEvent.name ) ||
              trackEvents[ i ].name === trackEvent ) {
          return trackEvents[i];
        } //if
      } //for
    }; //getTrackEvent

    Object.defineProperty( this, "trackEvents", {
      get: function() {
        return trackEvents;
      }
    });

    this.removeTrackEvent = function ( trackEvent ) {
      if ( typeof(trackEvent) === "string" ) {
        trackEvent = that.getTrackEvent( trackEvent );
      } //if

      var idx = trackEvents.indexOf( trackEvent );

      if ( idx > -1 ) {
        trackEvents.splice( idx, 1 );
        trackEvent.track = undefined;
        trackEvent.butter = undefined;
        butter.trigger( "trackeventremoved", trackEvent );
      } //if
    }; //removeTrackEvent

    this.addTrackEvent = function ( trackEvent ) {
      if ( !( trackEvent instanceof TrackEvent ) ) {
        trackEvent = new TrackEvent( trackEvent );
      } //if
      trackEvents.push( trackEvent );

      trackEvent.track = that;
      if ( butter ) {
        trackEvent.butter = butter;
      }
      return trackEvent;
    }; //addTrackEvent

  }; //Track

  /****************************************************************************
   * TrackEvent
   ****************************************************************************/
  var numTrackEvents = 0;
  var TrackEvent = function ( options ) {
    var id = numTrackEvents++,
        butter = undefined,
        that = this;

    options = options || {};
    var name = options.name || 'Track' + Date.now();
    this.start = options.start || 0;
    this.end = options.end || 0;
    this.type = options.type;
    this.popcornOptions = options.popcornOptions;
    this.popcornEvent = options.popcornEvent;
    this.track = options.track;

    Object.defineProperty( this, "name", {
      get: function() {
        return name;
      }
    });

    Object.defineProperty( this, "id", {
      get: function() {
        return id;
      }
    });

    Object.defineProperty( this, "butter", {
      get: function() {
        return butter;
      },
      set: function( b ) {
        butter = b;
        if ( butter ) {
          butter.logger.debug( "TrackEvent added" );
          butter.trigger( "trackeventadded", that );
        }
      }
    });

    Object.defineProperty( this, "json", {
      get: function() {
        return {
          id: id,
          start: this.start,
          end: this.end,
          type: this.type,
          popcornOptions: this.popcornOptions,
          track: this.track ? this.track.name : undefined,
          name: name
        };
      },
      set: function( importData ) {
        this.start = importData.start || 0;
        this.end = importData.end || 0;
        this.type = importData.type;
        if ( importData.name ) {
          name = importData.name;
        }
        this.popcornOptions = importData.popcornOptions;
      }
    });

  }; //TrackEvent

  /****************************************************************************
   * Target 
   ****************************************************************************/
  var numTargets = 0;
  var Target = function ( options ) {
    var id = numTargets++;

    options = options || {};
    var name = options.name || "Target" + id + Date.now();
    this.object = options.object;

    Object.defineProperty( this, "name", {
      get: function() {
        return name;
      },
    });

    Object.defineProperty( this, "id", {
      get: function() {
        return id;
      },
    });

    Object.defineProperty( this, "json", {
      get: function() {
        var obj;
        try {
          obj = JSON.stringify( this.object );
        }
        catch ( e ) {
          obj = this.object.toString();
        }
        return {
          id: id,
          name: name,
          object: obj
        };
      },
      set: function( importData ) {
        if ( importData.name ) {
          name = importData.name
        }
        this.object = importData.object
      }
    });
  }; //Target

  /****************************************************************************
   * Media
   ****************************************************************************/
  var numMedia = 0;
  var Media = function ( options ) {
    options = options || {};

    var tracks = [],
        id = numMedia++,
        name = options.name || "Media" + id + Date.now(),
        url,
        target,
        registry,
        butter = undefined,
        currentTime = 0,
        duration = 0,
        that = this;

    Object.defineProperty( this, "url", {
      get: function() {
        return url;
      },
      set: function( val ) {
        if ( url !== val ) {
          url = val;
          if ( butter ) {
            butter.logger.debug( "Media url changed to " + url );
            butter.trigger( "mediacontentchanged", that );
          }
        }
      }
    });

    Object.defineProperty( this, "target", {
      get: function() {
        return target;
      },
      set: function( val ) {
        if ( target !== val ) {
          target = val;
          if ( butter ) {
            butter.logger.debug( "Media target changed to " + target );
            butter.trigger( "mediatargetchanged", that );
          }
        }
      }
    });

    Object.defineProperty( this, "name", {
      get: function() {
        return name;
      }
    });

    Object.defineProperty( this, "id", {
      get: function() {
        return id;
      }
    });

    Object.defineProperty( this, "tracks", {
      get: function() {
        return tracks;
      }
    });

    Object.defineProperty( this, "butter", {
      get: function() {
        return butter;
      },
      set: function( b ) {
        if ( b !== butter ) {      
          butter = b;
          if ( butter ) {
            butter.logger.debug( "Media added" );
            butter.trigger( "mediaadded", that );
            var tracks = that.tracks;
            for ( var i=0, l=tracks.length; i<l; ++i ) {
              tracks[i].butter = butter;
            } //for
          }
        } //if
      }
    });

    Object.defineProperty( this, "currentTime", {
      get: function() {
        return currentTime;
      },
      set: function( time ) {
        if ( time !== undefined ) {
          currentTime = time;
          if ( currentTime < 0 ) {
            currentTime = 0;
          }
          if ( currentTime > duration ) {

            currentTime = duration;
          }
          if ( butter ) {
            butter.trigger("mediatimeupdate", that);
          }
        } //if
      }
    });

    Object.defineProperty( this, "duration", {
      get: function() {
        return duration;
      },
      set: function( time ) {
        if ( time ) {
          duration = time;
          if ( butter ) {
            butter.trigger("mediadurationchanged", that);
          }
        }
      }
    });

    this.addTrack = function ( track ) {
      if ( !(track instanceof Track) ) {
        track = new Track( track );
      } //if
      tracks.push( track );
      if ( butter ) {
        track.butter = butter;
      }
      return track;
    }; //addTrack

    this.getTrack = function ( track ) {
      for ( var i=0, l=tracks.length; i<l; ++i ) {
        if (  ( track.id !== undefined && tracks[ i ].id === track.id ) ||
              ( track.name && tracks[ i ].name === track.name ) ||
              tracks[ i ] === track ) {
          return tracks[i];
        } //if
      } //for
      return undefined;
    }; //getTrack

    this.removeTrack = function ( track ) {
      if ( typeof(track) === "string" ) {
        track = that.getTrack( track );
      } //if
      var idx = tracks.indexOf( track );
      if ( idx > -1 ) {
        tracks.splice( idx, 1 );
        track.butter = undefined;
        var events = track.trackEvents;
        for ( var i=0, l=events.length; i<l; ++i ) {
          butter.trigger( "trackeventremoved", events[i] );
        } //for
        if ( butter ) {
          butter.trigger( "trackremoved", track );
        }
        return track;
      } //if
      return undefined;    
    }; //removeTrack


    Object.defineProperty( this, "json", {
      get: function() {
        var exportJSONTracks = [];
        for ( var i=0, l=tracks.length; i<l; ++i ) {
          exportJSONTracks.push( tracks[ i ].json );
        }
        return {
          id: id,
          name: name,
          url: url,
          target: target,
          duration: duration,
          tracks: exportJSONTracks
        };
      },
      set: function( importData ) {
        if ( importData.name ) {
          name = importData.name;
        }
        if ( importData.target ) {
          that.target = importData.target;
        }
        if ( importData.url ) {
          that.url = importData.url;
        }
        if ( importData.tracks ) {
          var importTracks = importData.tracks;
          for ( var i=0, l=importTracks.length; i<l; ++i ) {
            var newTrack = new Track();
            newTrack.json = importTracks[ i ];
            that.addTrack( newTrack );
          }
        }
      }
    }); //json

    Object.defineProperty( this, "registry", {
      get: function() {
        return registry;
      },
      set: function( val ) {
        registry = val;
      }
    });

    this.getManifest = function( name ) {
      return registry[ name ];
    }; //getManifest

    if ( options.url ) {
      this.url = options.url;
    }
    if ( options.target ) {
      this.target = options.target;
    }

  }; //Media

  var Logger = function ( options ) {
    options = options || {};
    var name = options.name || "NoName";
    var quiet = options.quiet !== undefined ? options.quiet : false;
    var debugFn = function( message ) {
      Logger.logFunction( "[" + name + "]: " + message );
    };
    var errorFn = function( message ) {
      Logger.errorFunction( "[" + name + "]: " + message );
    };
    var that = this;
    this.debug = !quiet && ( Logger.level & Logger.DEBUG ) ? debugFn : function() {};
    this.error = !quiet && ( Logger.level & Logger.ERROR ) ? errorFn : function() {};
    if ( options.object && !options.object.log ) {
      options.object.log = function( message ) {
        that.debug( message );
      };
    }
  };
  Logger.NONE = 0x0;
  Logger.DEBUG = 0x1;
  Logger.ERROR = 0x2;
  Logger.level = Logger.DEBUG | Logger.ERROR;
  Logger.logFunction = function() {
    console.log.apply( console, arguments );
  };
  Logger.errorFunction = function( error ) { throw new Error( error ) };

  /****************************************************************************
   * Butter
   ****************************************************************************/
  var numButters = 0;
  var Butter = function ( options ) {

    var events = {},
        medias = [],
        currentMedia,
        targets = [],
        projectDetails = {},
        that = this;

    options = options || {};
        
    this.id = "Butter" + numButters++;

    var logger = this.logger = new Logger( { 
      name: "Butter", 
      object: this, 
      quiet: options.logger
    } );
    logger.debug( "Starting" );

    function checkMedia() {
      if ( !currentMedia ) {
        throw new Error("No media object is selected");
      } //if
    }

    /****************************************************************
     * Event methods
     ****************************************************************/
    //trigger - Triggers an event indicating a change of state in the core
    this.trigger = function ( name, options, domain ) {
      var eventObj = {
        type: name,
        domain: domain,
        data: options
      };

      if ( events[ name ] ) {
        //for (var i=0, l=events[ name ].length; i<l; ++i) {
        for ( var i=events[ name ].length - 1; i>=0; --i ) {
          events[ name ][ i ].call( that, eventObj, domain );
        } //for
      } //if
      if ( domain ) {
        name = name + domain;
        if ( events[ name ] ) {
          for ( var i=events[ name ].length - 1; i>=0; --i ) {
          //for (var i=0, l=events[ name ].length; i<l; ++i) {
            events[ name ][ i ].call( that, eventObj, domain );
          } //for
        } //if
      } //if
    }; //trigger

    //listen - Listen for events triggered by the core
    this.listen = function ( name, handler, domain ) {
      domain = domain || "";
      name = name + domain;
      if ( !events[ name ] ) {
        events[ name ] = [];
      } //if
      events[ name ].push( handler );
    }; //listen

    //unlisten - Stops listen for events triggered by the core
    this.unlisten = function ( name, handler, domain ) {
      domain = domain || "";
      name = name + domain;
      var handlerList = events[ name ];
      if ( handlerList ) {
        if ( handler ) {
          var idx = handlerList.indexOf( handler );
          if ( idx > -1 ) {
            handlerList.splice( idx, 1 );
          }
        }
        else {
          events[ name ] = [];
        } //if
      } //if
    }; //unlisten

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
      if ( !(target instanceof Target) ) {
        target = new Target( target );
      } //if

      targets.push( target );

      logger.debug( "Target added" );
      that.trigger( "targetadded", target );

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
        that.trigger( "targetremoved", target );
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
        sTargets.push( targets[i].json );
      } 
      return sTargets;
    }; //serializeTargets

    //getTarget - get a target object by its id
    this.getTarget = function ( target ) {
      for ( var i=0; i<targets.length; ++i ) {
        if (  ( target.id !== undefined && target[ i ].id === target.id ) ||
              ( target.name && targets[ i ].name === target.name ) ||
              targets[i].name === target ) {
          return targets[ target ];
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
          logger.debug( "Media Changed" );
          that.trigger( "mediachanged", media );
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

    //addMedia - add a media object
    this.addMedia = function ( media ) {
      if ( !( media instanceof Media ) ) {
        media = new Media( media );
      } //if

      var mediaName = media.name;
      medias.push( media );

      media.butter = that;
      if ( !currentMedia ) {
        that.currentMedia = media;
      } //if
      return media;
    };

    //removeMedia - forget a media object
    this.removeMedia = function ( media ) {
      if ( typeof( media ) === "string" ) {
        media = that.getMedia( media );
      } //if

      var idx = medias.indexOf( media );
      if ( idx > -1 ) {
        medias.splice( idx, 1 );
        var tracks = media.tracks;
        for ( var i=0, l=tracks.length; i<l; ++i ) {
          that.trigger( "trackremoved", tracks[i] );
        } //for
        media.butter = undefined;
        if ( media === currentMedia ) {
          
          currentMedia = undefined;
        } //if
        that.trigger( "mediaremoved", media );
        return media;
      } //if
      return undefined;
    };

    this.extend = function () {
      Butter.extend( that, [].slice.call( arguments, 1 ) );
    };

  }; //Butter

  Butter.getScriptLocation = function () {
    var scripts = document.querySelectorAll( "script" );
    for (var i=0; i<scripts.length; ++i) {
      var pos = scripts[i].src.lastIndexOf('butter.js');
      if ( pos > -1 ) {
        return scripts[i].src.substr(0, pos) + "/";
      } //if
    } //for
  };

  //registerModule - Registers a Module into the Butter core
  Butter.registerModule = Butter.prototype.registerModule = function ( name, module ) {

    Butter.prototype[name] = function( options ) {
      module.call( this, options );
      return this;
    };
    if ( module.extend ) {
      Butter.extendAPI( module.extend );
    } //if
  };

  Butter.extendAPI = function ( functions ) {
    for ( var fn in functions ) {
      if ( functions.hasOwnProperty( fn ) ) {
        Butter[fn] = functions[ fn ];
        Butter.prototype[ fn ] = functions[ fn ];
      } //if
    } //for
  };

  Butter.extend = function ( obj /* , extra arguments ... */) {
    var dest = obj, src = [].slice.call( arguments, 1 );
    src.forEach( function( copy ) {
      for ( var prop in copy ) {
        dest[ prop ] = copy[ prop ];
      }
    });
  };

  Butter.Media = Media;
  Butter.Track = Track;
  Butter.TrackEvent = TrackEvent;
  Butter.Target = Target;
  Butter.Logger = Logger;

  window.Butter = Butter;

})( window, document, undefined );

(function (window, document, Butter, undefined) {

  var MESSAGE_PREFIX = "BUTTER", MESSAGE_PREFIX_LENGTH = MESSAGE_PREFIX.length;

  if ( !Butter ) {
    Butter = window.Butter = {};
  } //if

  var parseEvent = Butter.parseCommEvent = function ( e, win ) {
    if ( e.source !== win && e.data.indexOf( MESSAGE_PREFIX ) === 0 ) {
      return JSON.parse( e.data.substring( MESSAGE_PREFIX_LENGTH ) );
    } //if
  }; //parseEvent

  Butter.CommClient = function ( name, onmessage ) {

    var listeners = {},
        that = this;

    window.addEventListener('message', function ( e ) {
      var data = parseEvent( e, window );
      if ( data ) {
        if ( data.type && listeners[ data.type ] ) {
          var list = listeners[ data.type ];
          for ( var i=0; i<list.length; ++i ) {
            list[i]( data.message );
          } //for
        } //if
        onmessage && onmessage( data );
      } //if
    }, false);

    this.listen = function ( type, callback ) {
      if (type && callback) {
        if ( !listeners[ type ] ) {
          listeners[ type ] = [];
        } //if
        listeners[ type ].push( callback );
        return callback;
      }
      else {
        throw new Error('Must provide a type and callback for CommClient listeners');
      } //if
    };

    this.forget = function ( type, callback ) {
      if ( !callback ) {
        delete listeners[ type ];
      }
      else {
        var idx = listeners[ type ].indexOf( callback );
        if ( idx > -1 ) {
          var callback = listeners[ type ][ idx ];
          listeners[ type ].splice( idx, 1 );
          return callback;
        } //if
      } //if
    };

    this.send = function ( message, type ) {
      if ( !type ) {
        postMessage( MESSAGE_PREFIX + JSON.stringify( message ), "*" );
      }
      else {
        postMessage( MESSAGE_PREFIX + JSON.stringify( { type: type, message: message } ), "*" );
      } //if
    }; //send

    this.async = function( message, type, handler ) {
      var wrapper = function( message ) {
        that.forget( type, wrapper );
        handler( message );
      }; //wrapper
      that.listen( type, wrapper ); 
      that.send( message, type );
    }; //async

    this.returnAsync = function( type, handler ) {
      that.listen( type, function( message ) {
        that.send( handler( message ), type );
      });
    }; //returnAsync

  }; //CommClient

  Butter.CommServer = function () {

    var clients = {},
        that = this;

    function Client ( name, client, callback ) {

      var listeners = {},
          that = this;

      this.getName = function () {
        return name;
      };

      this.listen = function ( type, callback ) {
        if (type && callback) {
          if ( !listeners[ type ] ) {
            listeners[ type ] = [];
          } //if
          listeners[ type ].push( callback );
          return callback;
        }
        else {
          throw new Error('Must provide a type and callback for CommServer listeners');
        } //if
      }; //listen

      this.forget = function ( type, callback ) {
        if ( !callback ) {
          delete listeners[ type ];
        }
        else {
          var idx = listeners[ type ].indexOf( callback );
          if ( idx > -1 ) {
            var callback = listeners[ type ][ idx ];
            listeners[ type ].splice( idx, 1 );
            return callback;
          } //if
        } //if
      }; //forget

      this.send = function ( message, type ) {
        if ( !type ) {
          client.postMessage( MESSAGE_PREFIX + JSON.stringify( message ), "*" );
        }
        else {
          client.postMessage( MESSAGE_PREFIX + JSON.stringify( { type: type, message: message } ), "*" );
        } //if
      }; //send

      this.async = function( message, type, handler ) {
        var wrapper = function( message ) {
          that.forget( type, wrapper );
          handler( message );
        }; //wrapper
        that.listen( type, wrapper ); 
        that.send( message, type );
      }; //async

      client.addEventListener( "message", function ( e ) {
        var data = parseEvent( e, window );
        if ( data ) {
          if ( data.type && listeners[ data.type ] ) {
            var list = listeners[ data.type ];
            for ( var i=0; i<list.length; ++i ) {
              list[i]( data.message );
            } //for
          } //if
          callback && callback( data );
        } //if
      }, false );

      this.destroy = function() {
        delete listeners;
      }; //destroy

    } //Client

    this.bindFrame = function ( name, frame, readyCallback, messageCallback ) {
      frame.addEventListener( "load", function (e) {
        that.bindClientWindow( name, frame.contentWindow, messageCallback );
        readyCallback && readyCallback( e );
      }, false );
    };

    this.bindWindow = function ( name, win, readyCallback, messageCallback ) {
      win.addEventListener( "load", function (e) {
        that.bindClientWindow( name, win, messageCallback );
        readyCallback && readyCallback( e );
      }, false );
    };

    this.bindClientWindow = function ( name, client, callback ) {
      clients[ name ] = new Client( name, client, callback );
    };

    this.listen = function ( name, type, callback ) {
      clients[ name ] && clients[ name ].listen( type, callback );
    };

    this.forget = function ( name, type, callback ) {
      clients[ name ] && clients[ name ].forget( type, callback );
    };

    this.send = function ( name, message, type ) {
      clients[ name ] && clients[ name ].send( message, type );
    };

    this.async = function( name, message, type, handler ) {
      clients[ name ] && clients[ name ].async( message, type, handler );
    };

    this.destroy = function( name ) {
      if ( name ) {
        clients[ name ] && clients[ name ].destroy();
        delete clients[ name ];
      }
      else {
        for ( var clientName in clients ) {
          if ( clients.hasOwnProperty( clientName ) ) {
            clients[ clientName ].destroy();
            delete clients[ clientName ];
          } //if
        } //for
      } //if
    }; //destroy

  } //CommServer

  Butter.registerModule( "comm", function( options ) {
    this.CommClient = Butter.CommClient;
    this.CommServer = Butter.CommServer;
  });
})(window, document, Butter);
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

(function( window, document, undefined, Butter ) {

  Butter.registerModule( "plugintray", function ( options ) {
    
    var plugins = [],
        numPlugins = 0,
        container,
        pluginElementPrefix = "butter-plugin-",
        pattern;
    
    var Plugin = function ( options ) {
      var id = numPlugins++,
          that = this,
          butter = undefined;

      options = options || {};
      var name = options.name || 'Plugin' + Date.now();
      this.type = options.type;
      this.element = undefined;
      
      this.getName = function () {
        return name;
      };

      this.getId = function () {
        return id;
      }; //getId

      this.setButter = function ( b ) {
        butter = b;
      };

      this.getButter = function ()  {
        return butter;
      };

      this.createElement = function ( pattern ) {
        var pluginElement;
        if ( !pattern ) {
          pluginElement = document.createElement( "span" );
          pluginElement.innerHTML = that.type + " ";
        }
        else {
          var patternInstance = pattern.replace( /\$type/g, that.type );
          var $pluginElement = $( patternInstance );
          pluginElement = $pluginElement[ 0 ];
        }
        pluginElement.id = pluginElementPrefix + that.type;
        pluginElement.setAttribute( "data-trackliner-type", "butterapp" );
        $( pluginElement ).draggable({ helper: "clone", appendTo: "body", zIndex: 9001, revert: true, revertDuration: 0 });
        this.element = pluginElement;
        return pluginElement;
      };

    };

    options = options || {};
    container = document.getElementById( options.target ) || options.target;
    pattern = options.pattern;

    this.addPlugin = function( plugin ) {

      if ( !( plugin instanceof Plugin ) ) {
        plugin = new Plugin( plugin );
      } //if
      plugins.push( plugin );

      plugin.setButter( this );
      this.trigger( "pluginadded", plugin );

      container.appendChild( plugin.createElement( pattern ) );
      
      return plugin;
    }; //addPlugin
        
    this.getPlugins = function () {
      return plugins;
    }; //getPlugins

    this.clearPlugins = function () {
      while ( plugins.length > 0 ) {
        var plugin = plugins.pop();
        container.removeChild( plugin.element );
        this.trigger( "pluginremoved", plugin );
      }
    }; //clearPlugins

    Object.defineProperty( this, "pluginElementPrefix", {
      get: function() {
        return pluginElementPrefix;
      }
    });

  }); //plugintray

})( window, document, undefined, Butter );

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

(function( window, document, Butter, undefined ) {

  Butter.registerModule( "eventeditor", function ( options ) {

    options = options || {};

    var defaultEditor = options.defaultEditor || "defaultEditor.html",
        editors = {},
        butter = this,
        numEditors = 0,
        commServer = new Butter.CommServer();

    function Editor( options ) {
      var target = options.target,
          type = options.type,
          source = options.source,
          editorHeight,
          editorWidth,
          targetContainer,
          targetWindow,
          that = this;

      ++numEditors;

      var editorLinkName = "editorLink" + numEditors;

      editorWidth = options.editorWidth || 400;
      editorHeight = options.editorHeight || 400;

      function clearTarget() {
        while ( targetContainer.firstChild ) {
          targetContainer.removeChild( targetContainer.firstChild );
        }
      } //clearTarget

      if ( typeof target === "string" && target !== "window" ) {
        targetContainer = document.getElementById( target );
      } //if

      this.construct = function( trackEvent ) {
        var updateEditor = function( e ){
          commServer.send( editorLinkName, {
            "id": e.data.id, 
            "options": e.data.popcornOptions
          }, "trackeventupdated" );
        };
        var checkRemoved = function( e ) {
          commServer.send( editorLinkName, e.data.id, "trackeventremoved" );
        };
        var targetAdded = function( e ) {
          commServer.send( editorLinkName, butter.targets, "domtargetsupdated" );
        };
        var clientDimsUpdated = function( dims ) {
          editorHeight = dims.height;
          editorWidth = dims.width;
          butter.trigger( "clientdimsupdated", that, "eventeditor" );
        };
        var undoListeners = function() {
          butter.unlisten ( "trackeventupdated", updateEditor );
          butter.unlisten ( "targetadded", targetAdded );
          butter.unlisten ( "trackeventremoved", checkRemoved );
          butter.unlisten ( "clientdimsupdated", clientDimsUpdated );
          commServer.forget( editorLinkName, "okayclicked" );
          commServer.forget( editorLinkName, "applyclicked" );
          commServer.forget( editorLinkName, "deleteclicked" );
          commServer.forget( editorLinkName, "cancelclicked" );
          commServer.forget( editorLinkName, "clientdimsupdated" );
          commServer.destroy( editorLinkName );
        };

        function setupServer( bindingType ) {
          var binding = bindingType === "window" ? "bindWindow" : "bindFrame";
          commServer[ binding ]( editorLinkName, targetWindow, function() {
            butter.listen( "trackeventupdated", updateEditor );
            butter.listen( "targetadded", targetAdded );
            butter.listen( "trackeventremoved", checkRemoved );
            
            commServer.listen( editorLinkName, "okayclicked", function( newOptions ){
              trackEvent.popcornOptions = newOptions;
              if ( targetWindow.close ) {
                targetWindow.close();
              }
              if ( targetWindow && targetWindow.parentNode ) {
                targetWindow.parentNode.removeChild( targetWindow );
              }
              undoListeners();
              targetWindow = undefined;
              butter.trigger( "trackeventupdated", trackEvent );
              butter.trigger( "trackeditclosed", that );
            });

            commServer.listen( editorLinkName, "applyclicked", function( newOptions ) {
              trackEvent.popcornOptions = newOptions;
              butter.trigger( "trackeventupdated", trackEvent );
            });

            commServer.listen( editorLinkName, "deleteclicked", function() {
              butter.removeTrackEvent( trackEvent );
              if ( targetWindow.close ) {
                targetWindow.close();
              }
              if ( targetWindow && targetWindow.parentNode ) {
                targetWindow.parentNode.removeChild( targetWindow );
              }
              undoListeners();
              targetWindow = undefined;
              butter.trigger( "trackeditclosed", that );
            });

            commServer.listen( editorLinkName, "cancelclicked", function() {
              if ( targetWindow.close ) {
                targetWindow.close();
              }
              if ( targetWindow && targetWindow.parentNode ) {
                targetWindow.parentNode.removeChild( targetWindow );
              }
              undoListeners();
              targetWindow = undefined;
              butter.trigger( "trackeditclosed", that );
            });

            commServer.listen( editorLinkName, "clientdimsupdated", clientDimsUpdated );

            var targetCollection = butter.targets, targetArray = [];
            for ( var i=0, l=targetCollection.length; i<l; ++i ) {
              targetArray.push( [ targetCollection[ i ].name, targetCollection[ i ].id ] );
            }

            trackEvent.manifest = butter.getManifest( trackEvent.type );
            commServer.send( editorLinkName, {
              "trackEvent": trackEvent, 
              "targets": targetArray,
              "id": trackEvent.id
            }, "edittrackevent");
          });
        } //setupServer

        if ( target === "window" ) {
          if ( !targetWindow ) {
            targetWindow = window.open( source, "", "width=" + editorWidth + ",height=" + editorHeight + ",menubar=no,toolbar=no,location=no,status=no" );
            setupServer( "window" );
            targetWindow.addEventListener( "beforeunload", function() {
              undoListeners();
              butter.trigger( "trackeditclosed", that );
              targetWindow = undefined;
            }, false );
          }
        }
        else {
          if ( targetContainer ) {
            clearTarget();
          }
          targetWindow = document.createElement( "iframe" );
          targetWindow.id = "butter-editor-iframe";
          targetWindow.style.width = editorWidth;
          targetWindow.style.height = editorHeight;
          setupServer( "iframe" );
          targetWindow.src = source;
          targetContainer.appendChild( targetWindow );
        } //if

        butter.trigger( "trackeditstarted", that );

      }; //construct

      this.setDimensions = function( width, height ) {
        if ( !height ) {
          height = width.height;
          width = width.width;
        }
        editorWidth = width;
        editorHeight = height;
      }; //setDimensions

      Object.defineProperty( this, "type", {
        get: function() { return target === "window" ? "window" : "iframe"; }
      });

      Object.defineProperty( this, "size", {
        get: function() { return { width: editorWidth, height: editorHeight }; }
      });

      Object.defineProperty( this, "window", {
        get: function() { return targetWindow; }
      });
      
    } //Editor

    if ( !options || typeof options !== "object" ) {
      throw new Error( "Invalid Argument" );
    }

    /************************
     * instance methods
     ************************/
    this.editTrackEvent = function( trackEvent ) {
      if ( !trackEvent || !( trackEvent instanceof Butter.TrackEvent ) ) {
        return false;
      }

      var type = trackEvent.type;
      if ( !editors[ type ] ) {
        type = "default";
      }
      editors[ type ].construct( trackEvent );
      return true;
    }; //editTrackEvent

    this.addEditor = function( editorSource, pluginType, target ) {
      if ( !pluginType || !editorSource ) {
        return false;
      }
      return editors[ pluginType ] = new Editor({
        source: editorSource,
        type: pluginType,
        target: target
      });
    }; //addCustomEditor
          
    this.removeCustomEditor = function( pluginType ) {
      if ( !pluginType ) {
        return false;
      }
      var oldSource = editors[ pluginType ];
      editors[ pluginType ] = undefined;
      return oldSource;
    }; //removeCustomEditor

  }); //eventeditor

})( window, window.document, Butter );

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

        function onMediaAdded( e ) {
          logger.debug( "Sending mediaadded" );
          var mediaExport = e.data.json;
          server.send( "link", mediaExport, "mediaadded" );
        }
        function onMediaChanged( e ) {
          logger.debug( "Sending mediachanged" );
          var mediaExport = e.data.json;
          server.send( "link", mediaExport, "mediachanged" );
        }
        function onMediaRemoved( e ) {
          logger.debug( "Sending mediaremoved" );
          var mediaExport = e.data.json;
          server.send( "link", mediaExport, "mediaremoved" );
        }
        function onMediaTimeUpdate( e ) {
          if ( e.data.currentTime !== currentTime ) {
            //logger.debug( "Sending mediatimeupdate" );
            server.send( "link", e.data.currentTime, "mediatimeupdate" );
          } //if
        }
        function onMediaContentChanged( e ) {
          logger.debug( "Sending mediacontentchanged" );
          server.send( "link", e.data.url, "mediacontentchanged" );
        }
        function onTrackEventAdded( e ) {
          logger.debug( "Sending trackeventadded" );
          var trackEventExport = e.data.json;
          server.send( "link", trackEventExport, "trackeventadded" );
        }
        function onTrackEventRemoved( e ) {
          logger.debug( "Sending trackeventremoved" );
          var trackEventExport = e.data.json;
          server.send( "link", trackEventExport, "trackeventremoved" );
        }
        function onTrackEventUpdated( e ) {
          logger.debug( "Sending trackeventupdated" );
          var trackEventExport = e.data.json;
          server.send( "link", trackEventExport, "trackeventupdated" );
        }

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
            //logger.debug( "Received mediatimeupdate" );
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

          butter.listen( "mediaadded", onMediaAdded );
          butter.listen( "mediachanged", onMediaChanged );
          butter.listen( "mediaremoved", onMediaRemoved );
          butter.listen( "mediatimeupdate", onMediaTimeUpdate, "timeline" );
          butter.listen( "mediacontentchanged", onMediaContentChanged );
          butter.listen( "trackeventadded", onTrackEventAdded );
          butter.listen( "trackeventremoved", onTrackEventRemoved );
          butter.listen( "trackeventupdated", onTrackEventUpdated );

          server.listen( "link", "importData", function( message ) {
            logger.debug( "Received import data" );
            importData = message;
          });

          server.listen( "link", "log", function( message ) {
            logger.debug( message );
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
            defaultMedia: defaultMedia,
            importData: importData
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

        this.destroy = function() {
          server.destroy();
          butter.unlisten( "mediaadded", onMediaAdded );
          butter.unlisten( "mediachanged", onMediaChanged );
          butter.unlisten( "mediaremoved", onMediaRemoved );
          butter.unlisten( "mediatimeupdate", onMediaTimeUpdate, "timeline" );
          butter.unlisten( "mediacontentchanged", onMediaContentChanged );
          butter.unlisten( "trackeventadded", onTrackEventAdded );
          butter.unlisten( "trackeventremoved", onTrackEventRemoved );
          butter.unlisten( "trackeventupdated", onTrackEventUpdated );
        }; //destroy

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
      }); //playing

      this.play = function() {
        link.play();
      }; //play

      this.pause = function() {
        link.pause();
      }; //pause
      
      this.mute = function() {
        link.mute();
      }; //mute

      this.destroy = function() {
        link.destroy();
        if ( previewIframe ) {
          previewIframe.setAttribute( "src", "about:blank" );
        }
      }; //destroy

    }; //Preview

  }; //loadPreview

})(window, document, undefined, window.Butter, window.debug);

(function ( window, document, Butter, undefined ) {

  Butter.registerModule( "timeline", function ( options ) {
  
    var mediaInstances = {},
        currentMediaInstance,
        target = document.getElementById( options.target ) || options.target,
        b = this;

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

      if ( b.targettedEvent ) {

        var cornOptions = b.targettedEvent.popcornOptions;
        var inc = event.shiftKey ? 2.5 : 0.25;

        if ( cornOptions.start > inc ) {

          cornOptions.start -= inc;
          if ( !event.ctrlKey ) {

            cornOptions.end -= inc;
          }
        } else {

          if ( !event.ctrlKey ) {

            cornOptions.end = cornOptions.end - cornOptions.start;
          }
          cornOptions.start = 0;
        }

        this.trigger( "trackeventupdated", b.targettedEvent );
      }
    };

    this.moveFrameRight = function( event ) {

      if ( b.targettedEvent ) {

        var cornOptions = b.targettedEvent.popcornOptions;
        var inc = event.shiftKey ? 2.5 : 0.25;

        if ( cornOptions.end < b.duration - inc ) {

          cornOptions.end += inc;
          if ( !event.ctrlKey ) {

            cornOptions.start += inc;
          }
        } else {

          if ( !event.ctrlKey ) {

            cornOptions.start += b.duration - cornOptions.end;
          }
          cornOptions.end = b.duration;
        }

        this.trigger( "trackeventupdated", b.targettedEvent );
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

          var elementId = ui.draggable[ 0 ].id,
              extractedType = elementId.substring( b.pluginElementPrefix.length );

          b.addTrackEvent( currentMediaInstance.butterTracks[ currentMediaInstance.lastTrack.id() ], new Butter.TrackEvent({ popcornOptions: {start: start, end: end }, type: extractedType }) );
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
        b.targettedEvent = trackEventObj.options;
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
      currentMediaInstance.trackLinerTracks[ track.id ] = trackLinerTrack;
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

      var trackLinerTrackEvent = currentMediaInstance.trackLinerTracks[ trackEvent.track.id ].createTrackEvent( "butterapp", trackEvent );
      currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ] = trackLinerTrackEvent;
      currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ]
    };

    this.listen( "trackeventadded", function( event ) {
    
      if ( !currentMediaInstance ) {
        return;
      }

      addTrackEvent( event.data );
      b.targettedEvent = event.data;

    });

    this.listen( "trackeventremoved", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ],
          trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId );
      currentMediaInstance.lastTrack = trackLinerTrack;
      trackLinerTrack && trackLinerTrack.removeTrackEvent( trackLinerTrackEvent.element.id );
      delete currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];
      delete currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ];
    });

    var butter = this;

    this.listen( "mediaadded", function( event ) {
      
      mediaInstances[ event.data.id ] = new MediaInstance( event.data );

      function mediaChanged( event ) {

        if ( currentMediaInstance !== mediaInstances[ event.data.id ] ) {
          currentMediaInstance && currentMediaInstance.hide();
          currentMediaInstance = mediaInstances[ event.data.id ];
          currentMediaInstance && currentMediaInstance.show();
          butter.trigger( "timelineready", {}, "timeline" );
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
          butter.trigger( "timelineready", {}, "timeline" );
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


    this.listen( "trackeventupdated", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ],
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

        b.currentTime = pixel / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration;
        b.trigger( "mediatimeupdate", currentMediaInstance.media, "timeline" );
      } //if
      return b.currentTime / currentMediaInstance.duration * ( currentMediaInstance.container.offsetWidth );
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
        trackLinerEvent.element.style.width = ( end - start ) / currentMediaInstance.duration * target.offsetWidth + "px";
        trackLinerEvent.element.style.left = start / currentMediaInstance.duration * target.offsetWidth + "px";
      }
      //b.trigger( "mediatimeupdate", currentMediaInstance.media, "timeline" );
    };
  });

})( window, window.document, Butter );

(function (window, document, undefined, Butter, debug) {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  if ( !Butter ) {
    Butter = window.Butter = {};
  } //if

  function processStartEvent( e, callback ) {
    var message = Butter.parseCommEvent( e, window );
    if ( message && message.type === "setup" ) {
      callback( message );
    } //if
  };

  function bootStrapper( e ) {
    processStartEvent( e, function ( message ) {
      window.removeEventListener( 'message', bootStrapper, false );
      var link = new Butter.StandardLink({
        defaultMedia: message.message.defaultMedia,
        importData: message.message.importData,
        popcornUrl: message.message.popcornUrl,
      });
    });
  } //bootStrapper
  window.addEventListener( 'message', bootStrapper, false );

  Butter.Template = function( options ) {
    var that = this, 
    link,
    importData;

    options = options || {};

    window.removeEventListener( 'message', bootStrapper, false );

    function captureStartEvent( e ) {
      processStartEvent( e, function ( message ) {
        window.removeEventListener( 'message', captureStartEvent, false );
        link = new Butter.Link({
          defaultMedia: message.message.defaultMedia,
          importData: message.message.importData,
          popcornUrl: message.message.popcornUrl,
          onmediachanged: options.onmediachanged || function() {},
          onmediaadded: options.onmediaadded || function() {},
          onmediaremoved: options.onmediaremoved || function() {},
          onmediatimeupdate: options.onmediatimeupdate || function() {},
          onmediacontentchanged: options.onmediacontentchanged || function() {},
          onfetchhtml: options.onfetchhtml || function() {}
        });
        if ( options.onsetup ) {
          options.onsetup({
            importData: importData
          });
        }
      });
    } //captureStartEvent

    window.addEventListener( 'message', captureStartEvent, false );

    Object.defineProperty( this, "link", {
      get: function() {
        return link;
      }
    });

    if ( options.loadFromData ) {
      var scripts = document.getElementsByTagName( "script" );
      for ( var i=0; i<scripts.length; ++i ) {
        if ( scripts[ i ].getAttribute( "data-butter" ) === "project-data" ) {
          try {
            importData = JSON.parse( scripts[ i ].text );
            if ( importData.media ) {
              options.loadFromData( importData );
            } //if
          }
          catch( e ) {
            console.log( "Error: Couldn't load baked butter project data." );
            console.log( e );
          } //if
        } //if
      } //for
    } //if

  }; //Template

  var TemplateMedia = Butter.TemplateMedia = function ( mediaData ) {
    var that = this;
    this.url = mediaData.url;
    this.target = mediaData.target;
    this.id = mediaData.id;
    this.duration = 0;
    this.popcorn = undefined;
    this.type = undefined;
    this.mediaElement = undefined;

    var handlers = {};

    this.setupPopcornHandlers = function( comm ) {
      that.popcorn.media.addEventListener( "timeupdate", function() {
        comm.send( that.popcorn.media.currentTime, "mediatimeupdate" );                
      },false);
      that.popcorn.media.addEventListener( "pause", function() {
        comm.send( that.id, "mediapaused" );
      }, false);
      that.popcorn.media.addEventListener( "playing", function() {
        comm.send( that.id, "mediaplaying" );
      }, false);
    }; //setupPopcornHandlers

    this.prepareMedia = function( type ) {
      if ( type === "object" ) {
        var mediaElement = document.getElementById( that.target );
        if (  !mediaElement || [ 'AUDIO', 'VIDEO' ].indexOf( mediaElement.nodeName ) === -1 ) {
          var video = document.createElement( "video" ),
              src = document.createElement( "source" );

          src.src = that.url;
          video.style.width = document.getElementById( that.target ).style.width;
          video.style.height = document.getElementById( that.target ).style.height;
          video.appendChild( src );
          video.controls = true;
          video.id = that.target + "-butter";

          document.getElementById( that.target ).appendChild( video );
          that.mediaElement = video;
          return video;
        }
        else {
          that.mediaElement = mediaElement;
          return mediaElement;
        } //if
      }
    }; //prepareMedia

    this.findMediaType = function() {
      var regexResult = urlRegex.exec( that.url )
      if ( regexResult ) {
        that.type = regexResult[ 1 ];
      }
      else {
         that.type = "object";
      }
      return that.type;
    }; //findMediaType

    this.generatePopcornString = function( options ) {
      var type = that.type || that.findMediaType();
          popcornString = "";

      options = options || {};

      var popcornOptions = ""
      if ( options.options ) {
        popcornOptions = ", " + JSON.stringify( options.options );
      } //if

      var players = {
        "youtu": function() {
          return "var popcorn = Popcorn.youtube( '" + that.target + "', '" +
            that.url + "', {\n" + 
            "width: 430, height: 300\n" + 
          "} );\n";
        },
        "vimeo": function() {
          return "var popcorn = Popcorn( Popcorn.vimeo( '" + that.target + "', '" +
          that.url + "', {\n" +
            "css: {\n" +
              "width: '430px',\n" +
              "height: '300px'\n" +
            "}\n" +
          "} )" + popcornOptions + " );\n";
        },
        "soundcloud": function() {
          return "var popcorn = Popcorn( Popcorn.soundcloud( '" + that.target + "'," +
          " '" + that.url + "') );\n";

        },
        "baseplayer": function() {
          return "var popcorn = Popcorn( Popcorn.baseplayer( '#" + that.target + "'" + popcornOptions + " ) );\n";
        },
        "object": function() {
          return "var popcorn = Popcorn( '#" + that.mediaElement.id + "'" + popcornOptions + ");\n";
        } 
      };

      // call certain player function depending on the regexResult
      popcornString += players[ type ]();

      if ( that.popcorn ) {
        var trackEvents = that.popcorn.getTrackEvents();
        if ( trackEvents ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            var popcornOptions = trackEvents[ i ]._natives.manifest.options;
            popcornString += "popcorn." + trackEvents[ i ]._natives.type + "({";
            for ( var option in popcornOptions ) {
              if ( popcornOptions.hasOwnProperty( option ) ) {
                popcornString += option + ":'" + trackEvents[ i ][ option ] + "',";
              } //if
            } //for
          } //for trackEvents
          popcornString += "})";
        } //if trackEvents
      } //if popcorn

      var method = options.method || "inline";

      if ( method === "event" ) {
        popcornString = "document.addEventListener('DOMContentLoaded',function(e){" + popcornString;
        popcornString += "},false);";
      }
      else {
        popcornString = popcornString + "\n return popcorn;"; 
      } //if

      return popcornString;
    }; //generatePopcornString

    this.play = function( message ) {
      that.popcorn.play();
    };

    this.pause = function( message ) {
      that.popcorn.pause();
    };

    this.mute = function( message ) {
      that.popcorn.mute( message );
    };

    this.clearPopcorn = function() {
      if ( that.popcorn ) {
        popcorn.removeInstance( this.popcorn );
      } //if
    }; //clearPopcorn

    this.createPopcorn = function( popcornString ) {
      var popcornFunction = new Function( "", popcornString );
          popcorn = popcornFunction();
      if ( !popcorn ) {
        var popcornScript = that.popcornScript = document.createElement( "script" );
        popcornScript.innerHTML = popcornString;
        document.head.appendChild( popcornScript );
        popcorn = window.Popcorn.instances[ window.Popcorn.instances.length - 1 ];
      }
      that.popcorn = popcorn;
      that.Popcorn = window.Popcorn;
    }; //createPopcorn

    this.destroyPopcorn = function() {
      if ( that.popcornScript ) {
        document.head.removeChild( that.popcornScript );
      }
      that.popcornScript = undefined;
    }; //destroyPopcorn

    this.addHandlers = function( comm, options ) {
      for ( var name in options ) {
        if ( options.hasOwnProperty( name ) ) {
          handlers[ name ] = options[ name ];
          comm.listen( name, handlers[ name ] );
        } //if
      } //for
    }; //addHandlers

    this.removeHandlers = function( comm ) {
      for ( var name in handlers ) {
        if ( handlers.hasOwnProperty( name ) ) {
          comm.forget( name, handlers[ name ] );
          delete handlers[ name ];
        } //if
      } //for
    }; //removeHandlers

    this.waitForPopcorn = function( callback ) {
      var popcorn = that.popcorn;

      var checkMedia = function() {
        if ( that.type === "youtu" ) {
          popcorn.media.addEventListener( "durationchange", function( e ) {
            that.duration = popcorn.duration();
            setTimeout( function() {
              popcorn.pause( 0 );
              callback( popcorn );
            },1000 );
          });
        }
        else if( that.type === "vimeo" ) {
          popcorn.media.addEventListener( "durationchange", function( e ) {
            that.duration = popcorn.duration();
            callback( popcorn );
          });
        }
        else if( that.type === "soundcloud" ) {
          if ( popcorn.duration() === 0 ) {
            that.duration = popcorn.duration();
            callback( popcorn );
          }
          else {
            setTimeout( checkMedia, 100 );
          }
        }
        else {
          if( popcorn.media.readyState >= 2 || popcorn.media.duration > 0 ) {
            that.duration = popcorn.media.duration;
            callback( popcorn );
          } else {
            setTimeout( checkMedia, 100 );
          }
        }
      }
      checkMedia();
    }; //waitForPopcorn

  }; //TemplateMedia

  Butter.Link = function( options ) {
    var medias = {};
    var originalBody, originalHead,
        currentMedia, popcornScript;
    var popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js",
        defaultMedia = options.defaultMedia,
        importData = options.importData,
        that = this,
        comm = new Butter.CommClient( "link" );

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
    
    comm.returnAsync( 'html', fetchHTMLHandler );

    Object.defineProperty( this, "comm", {
      get: function() {
        return comm;
      }
    });

    this.getHTML = function() {
      var html = document.createElement( "html" ),
          head = originalHead.cloneNode( true ),
          body = originalBody.cloneNode( true );
      for ( var media in medias ) {
        if ( medias.hasOwnProperty( media ) ) {
          var script = document.createElement( "script" );
          script.innerHTML = medias[ media ].generatePopcornString( { method: "event" } );
          head.appendChild( script );
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
          comm.send( "loaded", "loaded" );
        } // else
      } // ensureLoaded

      ensureLoaded();

    }; //scrape

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

  Butter.StandardLink = function( options ) {
    var link, comm, butterMapping = {};

    var trackEventAddedHandler = function( message ) {
      var media = link.currentMedia;
      media.popcorn[ message.type ]( message.popcornOptions );
      butterMapping[ message.id ] = media.popcorn.getLastTrackEventId();
    }; //trackEventAddedHandler

    var trackEventUpdatedHandler = function( message ) {
      var media = link.currentMedia;
      if ( butterMapping[ message.id ] ) {
        media.popcorn.removeTrackEvent( butterMapping[ message.id ] );
      }
      media.popcorn[ message.type ]( message.popcornOptions );
      butterMapping[ message.id ] = media.popcorn.getLastTrackEventId();
      comm.send( "Created popcorn event" + message.id, "log" );
    }; //trackEventUpdatedHandler

    var trackEventRemovedHandler = function( message ) {
      var media = link.currentMedia;
      if ( butterMapping[ message.id ] ) {
        media.popcorn.removeTrackEvent( butterMapping[ message.id ] );
      }
    }; //trackEventRemovedHandler

    var mediaChangedHandler = function( message ) {
      if ( link.currentMedia ) {
        link.currentMedia.removeHandlers( comm );
      }
      var currentMedia = link.currentMedia = link.getMedia( message.id );
      if ( currentMedia ) {
        currentMedia.addHandlers( comm, {
          'trackeventadded': trackEventAddedHandler,
          'trackeventupdated': trackEventUpdatedHandler,
          'trackeventremoved': trackEventRemovedHandler,
          'play': currentMedia.play,
          'pause': currentMedia.pause,
          'mute': currentMedia.mute
        });
      }
    }; //mediaChangedHandler

    var mediaAddedHandler = function( message ) {
      if ( !link.getMedia( message.id ) ) {
        var media = new TemplateMedia( message );
        link.addMedia( media );
        buildMedia( media, function( media ) {
          link.sendMedia( media );
        });
      }
      else {
        console.log('media', message.id, 'already exists');
      }
    }; //mediaAddedHandler

    var mediaRemovedHandler = function( message ) {
      link.removeMedia( link.getMedia( message.id ) );
    }; //mediaRemovedHandler

    var mediaTimeUpdateHandler = function( message ) {
      link.currentMedia.popcorn.currentTime( message );
    }; //mediaTimeUpdateHandler

    var mediaContentChangedHandler = function( message ) {
      var media = link.currentMedia.popcorn.media,
          currentSrc = media.currentSrc,
          sources = media.getElementsByTagName( "source" );
      if ( sources ) {
        for ( var i=0; i<sources.length; ++i ) {
          media.removeChild( sources[ i ] );
        } //for
      } //if
      media.removeAttribute( "src" );
      var newSource = document.createElement( "source" );
      newSource.src = message;
      media.appendChild( newSource );
      media.load();
    }; //mediaContentChangedHandler

    var fetchHTMLHandler = function( message ) {
      return link.getHTML();
    }; //fetchHTMLHandler

    link = new Butter.Link({
      onmediachanged: mediaChangedHandler,
      onmediaadded: mediaAddedHandler,
      onmediaremoved: mediaRemovedHandler,
      onmediatimeupdate: mediaTimeUpdateHandler,
      onmediacontentchanged: mediaContentChangedHandler,
      onfetchhtml: fetchHTMLHandler,
      defaultMedia: options.defaultMedia,
      importData: options.importData,
      popcornUrl: options.popcornUrl
    });
    comm = link.comm;

    var buildMedia = function( media, callback ) {

      function isPopcornReady( e, readyCallback ) {
        if ( !window.Popcorn ) {
          setTimeout( function() {
            isPopcornReady( e, readyCallback );
          }, 1000 );
        }
        else {
          readyCallback();
        } //if
      } //isPopcornReady

      function popcornIsReady() {
        media.clearPopcorn();
        media.destroyPopcorn();
        if ( media.target ) {
          document.getElementById( media.target ).innerHTML = "";
        } //if
        media.prepareMedia( media.findMediaType() );
        try {
          media.createPopcorn( media.generatePopcornString() );
          media.waitForPopcorn( function( popcorn ) {
            media.setupPopcornHandlers( comm );
            link.sendMedia( media );
          });
        }
        catch( e ) {
          comm.send({
            message: "Couldn't instantiate popcorn instance: [" + e.fileName + ": " + e.message + "]",
            context: "previewer::buildMedia::popcornIsReady",
            type: "popcorn-initialization",
            error: JSON.stringify( e )
          }, "error" );
        } //try
      } //popcornIsReady

      if ( !window.Popcorn ) {
        insertPopcorn();
        isPopcornReady( null, popcornIsReady );
      }
      else {
        popcornIsReady();
      } //if

    }; //buildMedia

    var insertPopcorn = function() {
      var popcornSourceScript = document.createElement( "script" );
      popcornSourceScript.src = popcornUrl;
      document.head.appendChild( popcornSourceScript );
    }; //insertPopcorn

    link.scrape();

  } //StandardLink

})(window, window.document, undefined, window.Butter, window.debug);
(function() {

  Butter.registerModule( "trackeditor", function( options ) {

    // target is the div that contains the editor
    var target = document.getElementById( options.target ) || options.target,
        b = this;

    b.TrackEditor = function( track ) {
      var that = this;
      
      b.listen( "trackremoved", function( event ) {
        if ( event.data.id === track.id ) {
          that.close();
        }
      });

      Object.defineProperty( this, "track", {
        get: function() {
          return track;
        }
      });

      this.close = function() {
      };

      this.remove = function() {
        b.removeTrack( track );
      };

      this.clear = function() {
        var trackEvents = track.trackEvents;
        while ( trackEvents.length ) {
          b.removeTrackEvent( track, trackEvents[ 0 ] );
        } //while
      };

      Object.defineProperty( this, "json", {
        get: function() {
          var trackEvents = track.trackEvents,
              returnArray = [];
          for ( var i = 0, l = trackEvents.length; i < l; i++ ) {
            returnArray.push( JSON.stringify( { type: trackEvents[ i ].type, options: trackEvents[ i ].popcornOptions } ) );
          }
          return returnArray;
        },
        set: function( val ) {
          that.clear();
          var newArray = JSON.parse( "[" + val + "]" );
          for ( var i = 0, l = newArray.length; i < l; i++ ) {
            track.addTrackEvent( new Butter.TrackEvent({ popcornOptions: newArray[ i ].options, type: newArray[ i ].type }) )
          }
        }
      });

      Object.defineProperty( this, "target", {
        get: function() {
          return track.target;
        },
        set: function( val ) {
          track.target = val;
          var trackEvents = track.trackEvents;
          for( var i = 0, l = trackEvents.length; i < l; i ++ ) {
            trackEvents[ i ].popcornOptions.target = val;
            b.trigger( "trackeventupdated", trackEvents[ i ], "trackeditor" );
          }
          b.trigger( "trackupdated", track, "trackeditor" );
        }
      });

    }; //TrackEditor
  });
}());


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
      for ( var i=0, l=registry.length; i<l; ++i ) {
        if ( registry[ i ].type === name ) {
          return registry[ i ].base.manifest;
        } //if
      } //for
      return undefined;
    };

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
  Logger.logFunction = console.log;
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
          handlerList.splice( idx, 1 );
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


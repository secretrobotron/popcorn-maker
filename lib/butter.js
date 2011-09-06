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
        importData.target && that.setTarget( importData.target );
        importData.url && that.setUrl( importData.url );
        if ( importData.tracks ) {
          var importTracks = importData.tracks;
          for ( var i=0, l=importTracks.length; i<l; ++i ) {
            var newTrack = new Track();
            newTrack.json = importTracks[ i ];
            that.addTrack( newTrack );
          }
        }
      }
    });

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
        
    this.id = "Butter" + numButters++;

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

      that.trigger( "targetadded", target );

      return target;
    };

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
    };

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
    };

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

          var m, medias = that.media, mediaData = projectData.media[ i ];
          for( var k = 0, j = medias.length; k < j; k++ ) { 
            if( medias[ k ].getTarget() === mediaData.target && medias[ k ].url === mediaData.url ) {
              m = medias[ k ];  
            }
          }

          if ( !m ) {
            m = new Media();
            m.json = projectData.media[ i ];
            that.addMedia( m );
          }
          else {
            m.json = projectData.media[ i ];
          }
          
        }
      }
    };

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

  window.Butter = Butter;

})( window, document, undefined );

(function (window, document, Butter, undefined) {

  if ( !Butter ) {
    Butter = window.Butter = {};
  } //if

  Butter.CommClient = function ( name, onmessage ) {

    var listeners = {},
    self = this;

    window.addEventListener('message', function (e) {
      if ( e.source !== window ) {
        var data = JSON.parse( e.data );
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
        postMessage( JSON.stringify( message ), "*" );
      }
      else {
        postMessage( JSON.stringify( { type: type, message: message } ), "*" );
      } //if
    };

  }; //CommClient

  Butter.CommServer = function () {

    var clients = {};
    var that = this;

    function Client ( name, client, callback ) {

      var listeners = {};

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
          client.postMessage( JSON.stringify( message ), "*" );
        }
        else {
          client.postMessage( JSON.stringify( { type: type, message: message } ), "*" );
        } //if
        
      }; //send

      client.addEventListener( "message", function (e) {
        if ( e.source === client ) {
          var data = JSON.parse( e.data );
          if ( data.type && listeners[ data.type ] ) {
            var list = listeners[ data.type ];
            for ( var i=0; i<list.length; ++i ) {
              list[i]( data.message );
            } //for
          } //if
          callback && callback( data );
        } //if
      }, false );

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
        pluginElement.id = that.type;
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
    var editorTarget,
        defaultEditor,
        binding,
        commServer,
        editorHeight,
        editorWidth,
        targetWindow,
        customEditors = {},
        butter = this;

    function constructEditor( trackEvent ) {

      var editorWindow,
          butter = this,
          editorSrc,
          manifest = butter.getManifest( trackEvent.type );
        
      if ( manifest && manifest.customEditor ) {
        editorSrc = manifest.customEditor;
      } 
      else {
        editorSrc =  customEditors[ trackEvent.type ] || defaultEditor;
      }

      var updateEditor = function( e ){
          commServer.send( "link", { "id": e.data.id, "options": e.data.popcornOptions }, "trackeventupdated" );
      };
      var checkRemoved = function( e ) {
          commServer.send( "link", e.data.id, "trackeventremoved" );
      };
      var targetAdded = function( e ) {
          commServer.send( "link", butter.targets, "domtargetsupdated" );
      };
      var undoListeners = function() {
          butter.unlisten ( "trackeventupdated", updateEditor );
          butter.unlisten ( "targetadded", targetAdded );
          butter.unlisten ( "trackeventremoved", checkRemoved );
      };

      editorTarget && clearTarget();

      if ( binding === "bindWindow" ) {

        editorWindow = targetWindow || window.open( editorSrc, "", "width=" + editorWidth + ",height=" + editorHeight + ",menubar=no,toolbar=no,location=no,status=no" );
        setupServer();
        editorWindow.addEventListener( "beforeunload", function() {
          undoListeners();
          butter.trigger( "trackeditclosed" );
        }, false );
      } else if ( binding === "bindFrame" ) {

        editorWindow = document.createElement( "iframe" );
        editorWindow.id = "butter-editor-iframe";
        editorWindow.style.width = editorWidth;
        editorWindow.style.height = editorHeight;
        setupServer();
        editorWindow.src = editorSrc;
        editorTarget.appendChild( editorWindow );
      }

      function setupServer() {

        commServer[ binding ]( "link", editorWindow, function() {

          butter.listen( "trackeventupdated", updateEditor );
          butter.listen( "targetadded", targetAdded );
          butter.listen( "trackeventremoved", checkRemoved );
          
          commServer.listen( "link", "okayclicked", function( newOptions ){

            trackEvent.popcornOptions = newOptions;
            editorWindow.close && editorWindow.close();
            editorWindow && editorWindow.parentNode && editorWindow.parentNode.removeChild( editorWindow );
            undoListeners();
            butter.trigger( "trackeditclosed" );
            butter.trigger( "trackeventupdated", trackEvent );
          });
          commServer.listen( "link", "applyclicked", function( newOptions ) {

            trackEvent.popcornOptions = newOptions;
            butter.trigger( "trackeventupdated", trackEvent );
          });
          commServer.listen( "link", "deleteclicked", function() {

            butter.removeTrackEvent( trackEvent );
            editorWindow.close && editorWindow.close();
            editorWindow && editorWindow.parentNode && editorWindow.parentNode.removeChild( editorWindow );
            undoListeners();
            butter.trigger( "trackeditclosed" );
          });
          commServer.listen( "link", "cancelclicked", function() {

            editorWindow.close && editorWindow.close();
            editorWindow && editorWindow.parentNode && editorWindow.parentNode.removeChild( editorWindow );
            undoListeners();
            butter.trigger( "trackeditclosed" );
          });
          commServer.listen( "link", "clientdimsupdated", function( dims ) {
            butter.trigger( "clientdimsupdated", dims, "eventeditor" );
          });

          var targetCollection = butter.targets, targetArray = [];
          for ( var i=0, l=targetCollection.length; i<l; ++i ) {
            targetArray.push( [ targetCollection[ i ].name, targetCollection[ i ].id ] );
          }

          trackEvent.manifest = manifest;
          commServer.send( "link", { "trackEvent": trackEvent, "targets": targetArray, "id": trackEvent.id }, "edittrackevent");
        });
      }

    } //constructEditor

    function clearTarget() {

      while ( editorTarget.firstChild ) {
        editorTarget.removeChild( editorTarget.firstChild );
      }
    } //clearTarget

    function setTarget( newTarget, type ) {

      var setTheTarget = {

        "domtarget": function( targ ) {
          if ( typeof targ === "string" ) {

             return editorTarget = document.getElementById( targ ) || {};
          } else if ( targ ) {

             return editorTarget = targ;
          }
        },

        "window": function( targ ) {
          if ( targ ){
            return targetWindow = targ;
          }
        }

      };

      return setTheTarget[ type ]( newTarget );

    } //setTarget

    if ( !options || typeof options !== "object" ) {
      throw new Error( "Invalid Argument" );
    }

    editorWidth = options.editorWidth || 400;
    editorHeight = options.editorHeight || 400;

    ( options.target && setTarget( options.target, "domtarget" ) ) || ( options.targetWindow && setTarget( options.targetWindow, "window" ) );

    binding = editorTarget ? "bindFrame" : "bindWindow";

    defaultEditor = options.defaultEditor || "defaultEditor.html";

    commServer = new butter.CommServer();

    /************************
     * instance methods
     ************************/
    this.editTrackEvent = function( trackEvent ) {
       
      if ( !trackEvent || !( trackEvent instanceof Butter.TrackEvent ) ) {
        return false;
      }
      
      this.trigger( "trackeditstarted" );
      constructEditor.call( this, trackEvent );
      return true;
    }; //editTrackEvent

    this.addCustomEditor = function( editorSource, pluginType ) {

      if ( !pluginType || !editorSource ) {
        return false;
      }

      return customEditors[ pluginType ] = editorSource;
    }; //addCustomEditor
          
    this.removeCustomEditor = function( editorSource, pluginType ) {
      if ( !pluginType || !editorSource ) {
        return false;
      }
      
      var oldSource = customEditors[ pluginType ];
      
      customEditors[ pluginType ] = undefined;
      return oldSource;
    }; //removeCustomEditor

    this.changeEditorTarget = function( newTarget, type ) {

      var types = [ "domtarget", "window" ],
        lowerCaseType;
      
      //will target a new Window
      if ( !newTarget ) {
        editorTarget = undefined;
        binding = "bindWindow";
        return true;
      }

      if ( !type || types.indexOf( lowerCaseType = type.toLowerCase() ) === -1 ) {

        return false;
      }

      return setTarget( newTarget, lowerCaseType );
    }; //changeEditorTarget

    this.setDefaultEditor = function( newEditor ) {
      if ( !newEditor || typeof newEditor !== "string" ) {

        return false;
      }

      defaultEditor = newEditor;

      return defaultEditor;
    }; //setDefaultEditor

    this.setEditorDims = function ( dims ) {

      if ( !dims || ( !dims.height && !dims.width ) ) {

        return false;
      }

      editorWidth = dims.width || editorWidth;
      editorHeight = dims.height || editorHeight;

      return dims;
    }; //setEditorDims

  }); //eventeditor

})( window, window.document, Butter );

(function (window, document, undefined, Butter, debug) {

  Butter.prototype.previewer = function( options ) {
    var butter = this;

    var popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js";
        butterUrl = options.butterUrl;

    var target = document.getElementById( options.target );
    if ( !target ) {
      throw new Error( "Previewer target, " + options.target + " does not exist");
    }

    if ( !butterUrl ) {
      throw new Error( "Previewer requires a valid buttter lib (butterUrl)." );
    } //if

    butter.Preview = function( options ) {

      var that = this,
          link,
          previewIframe,
          defaultMedia = options.defaultMedia,
          forcePopcorn = options.forcePopcorn || false,
          onload = options.onload;

      function PreviewerLink( options ) {
        var isPlaying = false,
            server = new Butter.CommServer(),
            that = this;

        function setup( iframeWindow ) {

          server.bindClientWindow( "link", iframeWindow, function( message ) {
          });
          
          that.play = function() {
            server.send( "link", "play", "controls" );
          }; //play

          Object.defineProperty( this, "playing", {
            get: function() {
              return isPlaying;
            }
          });

          that.pause = function() {
            server.send( "link", "pause", "controls" );
          }; //pause

          that.mute = function() {
            server.send( "link", "mute", "controls" );
          }; //mute

          that.scrape = function() {
            server.send( "link", "scrape", "setup" );
          }; //scrape

          server.listen( "link", "controls", function( message ) {
            console.log( 'controls', message );
          });

          server.listen( "link", "setup", function( message ) {
            if ( message === "ready" ) {
              server.send( "link", {
                defaultMedia: defaultMedia,
                forcePopcorn: forcePopcorn
              }, "start" );
            }
          });

          server.listen( "link", "loaded", function( message ) {
            var numMedia = butter.media.length, numReady = 0;
            butter.trigger( "previewloaded", null );

            server.listen( "link", "build", function( message ) {
              var media = butter.getMedia( { id: message.id } );
              if ( media ) {
                media.registry = message.registry;
                media.duration = message.duration;
                butter.trigger( "mediaready", media, "previewer" );
              } //if
              ++numReady;
              if ( numMedia === numReady ) {
                butter.trigger( "previewready", that );
                onload && onload( that );
              } //if
            });
          });
          
          server.listen( "link", "mediaready", function( message ) {
          });
          server.listen( "link", "mediapaused", function( message ) {
          });
          server.listen( "link", "mediaplaying", function( message ) {
          });
          server.listen( "link", "mediatimeupdate", function( message ) {
            butter.currentTime = message;
          });

          server.listen( "link", "addmedia", function( message ) {
            var media = butter.addMedia( message );
          });
          server.listen( "link", "addtarget", function( message ) {
            var target = butter.addTarget( message );
          });

          butter.listen( "mediaadded", function( e ) {
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediaadded" );
          });

          butter.listen( "mediachanged", function( e ) {
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediachanged" );
          });

          butter.listen( "mediaremoved", function( e ) {
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediaremoved" );
          });

          butter.listen( "mediatimeupdate", function( e ) {
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediatimeupdate" );
          });

          butter.listen( "trackeventadded", function( e ) {
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventadded" );
          });
          butter.listen( "trackeventremoved", function( e ) {
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventremoved" );
          });
          butter.listen( "trackeventupdated", function( e ) {
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventupdated" );
          });

          butter.listen( "trackupdated", function( e ) {
            var trackExport = e.data.json;
            server.send( "link", trackExport, "trackupdated" );
          });

        } //setup

        this.insertLink = function() {
          var iframeWindow = previewIframe.contentWindow || previewIframe.contentDocument;
          var linkScript = document.createElement( 'script' );
          linkScript.src = butterUrl;
          iframeWindow.document.head.appendChild( linkScript );
          setup( iframeWindow );
          server.send( "link", "ready", "setup" );
        };
      } //PreviewLink

      Object.defineProperty( this, "independent", {
        get: function() {
          var iframeWindow = previewIframe.contentWindow || previewIframe.contentDocument;
          return !!( iframeWindow.Popcorn && iframeWindow.Butter );
        }
      });

      function loadIframe( iframe, template ) {
        previewIframe = iframe;
        iframe.src = template;
        function onLoad( e ) {
          if ( this.independent ) {
            link = new PreviewerLink();
          }
          else {
            link = new PreviewerLink();
          }
          link.insertLink();
          //link.scrape( iframe, options.importData );
          iframe.removeEventListener( "load", onLoad, false ); 
        } //onLoad
        iframe.addEventListener( "load", onLoad, false ); 
      } //loadIfram

      if ( target.tagName === "DIV" ) {
        var rect = target.getClientRects()[ 0 ];
        var iframe = document.createElement( "IFRAME" );
        iframe.width = rect.width;
        iframe.height = rect.height;
        loadIframe( iframe, options.template );
        target.appendChild( iframe );
      }
      else if ( target.tagName === "IFRAME" ) {
        loadIframe( target, options.template );
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
      });

      this.play = function() {
        link.play();
      };

      this.pause = function() {
        link.pause();
      };
      
      this.mute = function() {
        link.mute();
      };

      this.destroy = function() {
        link.destroy();
      };

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

    var butterMapping = {};

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

    this.trackEventAddedHandler = function( message ) {
      that.popcorn[ message.type ]( message.popcornOptions );
      butterMapping[ message.id ] = that.popcorn.getLastTrackEventId();
    }; //trackEventAddedHandler
    this.trackEventUpdatedHandler = function( message ) {
      if ( butterMapping[ message.id ] ) {
        that.popcorn.removeTrackEvent( butterMapping[ message.id ] );
      }
      that.popcorn[ message.type ]( message.popcornOptions );
    }; //trackEventUpdatedHandler
    this.trackEventRemovedHandler = function( message ) {
      if ( butterMapping[ message.id ] ) {
        that.popcorn.removeTrackEvent( butterMapping[ message.id ] );
      }
    }; //trackEventRemovedHandler

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

    var mediaChangedHandler = function( message ) {
      if ( currentMedia ) {
        comm.forget( 'trackeventadded', currentMedia.trackEventAddedHandler );
        comm.forget( 'trackeventupdated', currentMedia.trackEventUpdatedHandler );
        comm.forget( 'trackeventremoved', currentMedia.trackEventRemovedHandler );
      }
      currentMedia = medias[ message.id ];
      if ( currentMedia ) {
        comm.listen( 'trackeventadded', currentMedia.trackEventAddedHandler );
        comm.listen( 'trackeventupdated', currentMedia.trackEventUpdatedHandler );
        comm.listen( 'trackeventremoved', currentMedia.trackEventRemovedHandler );
      }
    };

    var mediaAddedHandler = function( message ) {

      if ( !medias[ message.id ] ) {
        var media = medias[ message.id ] = new Media( message );
        buildMedia( media, function( media ) {
          comm.send({
            registry: media.Popcorn.registry,
            id: media.id,
            duration: media.duration,
          }, "build");
        });
      }
      else {
        console.log('media', message.id, 'already exists');
      }
    };

    var mediaRemovedHandler = function( message ) {
      console.log('media removed!');
    };

    var mediaTimeUpdateHandler = function( message ) {
      currentMedia.popcorn.currentTime( message.currentTime );
    };

    comm.listen( 'mediachanged', mediaChangedHandler );
    comm.listen( 'mediaadded', mediaAddedHandler );
    comm.listen( 'mediaremoved', mediaRemovedHandler );
    comm.listen( 'mediatimeupdate', mediaTimeUpdateHandler );

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
          comm.send("loaded", "loaded");
        } // else
      } // ensureLoaded

      ensureLoaded();

    }; //scrape

    var buildMedia = function( media, callback, importData ) {

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
          var newArray = JSON.parse( "[" + data + "]" );
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
          var trackEvents = track.getTrackEvents();
          for( var i = 0, l = track.getTrackEvents().length; i < l; i ++ ) {
            trackEvents[ i ].popcornOptions.target = val;
            b.trigger( "trackeventupdated", trackEvents[ i ], "trackeditor" );
          }
          b.trigger( "trackupdated", track, "trackeditor" );
        }
      });

    }; //TrackEditor
  });
}());


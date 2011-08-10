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

    this.getName = function () {
      return name;
    }; //getName

    this.getId = function () {
      return id;
    }; //getId

    this.getTrackEvent = function ( trackId ) {
      for ( var i=0, l=trackEvents.length; i<l; ++i) {
        if ( trackEvents[i].getId() === trackId || trackEvents[i].getName() === trackId ) {
          return trackEvents[i];
        } //if
      } //for
    }; //getTrackEvent

    this.getTrackEvents = function () {
      return trackEvents;
    }; //getTrackEvents

    this.removeTrackEvent = function ( trackEvent ) {
      if ( typeof(trackEvent) === "string" ) {
        trackEvent = that.getTrackEvent( trackEvent );
      } //if

      var idx = trackEvents.indexOf( trackEvent );

      if ( idx > -1 ) {
        trackEvents.splice( idx, 1 );
        trackEvent.track = undefined;
        trackEvent.setButter( undefined );
        butter.trigger( "trackeventremoved", trackEvent );
      } //if
    }; //removeTrackEvent

    this.addTrackEvent = function ( trackEvent ) {
      if ( !( trackEvent instanceof TrackEvent ) ) {
        trackEvent = new TrackEvent( trackEvent );
      } //if
      trackEvents.push( trackEvent );

      trackEvent.track = that;
      butter && trackEvent.setButter( butter );
      return trackEvent;
    }; //addTrackEvent

    this.setButter = function ( b ) {
      butter = b;
      if ( butter ) {
        butter.trigger( "trackadded", that );
        var events = that.getTrackEvents();
        for ( var i=0, l=events.length; i<l; ++i ) {
          events[i].setButter( butter );
        } //for
      }
    };

    this.getButter = function ()  {
      return butter;
    };

    this.importJSON = function ( importData ) {
      if ( importData.name ) {
        name = importData.name;
      }
      if ( importData.trackEvents ) {
        var importTrackEvents = importData.trackEvents;
        for ( var i=0, l=importTrackEvents.length; i<l; ++i ) {
          var newTrackEvent = new TrackEvent();
          newTrackEvent.importJSON( importTrackEvents[ i ] );
          that.addTrackEvent( newTrackEvent );
        }
      }
    };

    this.exportJSON = function () {
      var exportJSONTrackEvents = [];
      for ( var i=0, l=trackEvents.length; i<l; ++i ) {
        exportJSONTrackEvents.push( trackEvents[ i ].exportJSON() );
      }
      return {
        name: name,
        trackEvents: exportJSONTrackEvents
      };
    };

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
    
    this.getName = function () {
      return name;
    };

    this.getId = function () {
      return id;
    }; //getId

    this.setButter = function ( b ) {
      butter = b;
      butter && butter.trigger( "trackeventadded", that );
    };

    this.getButter = function ()  {
      return butter;
    };

    this.importJSON = function ( importData ) {
      this.start = importData.start || 0;
      this.end = importData.end || 0;
      this.type = importData.type;
      if ( importData.name ) {
        name = importData.name;
      }
      this.popcornOptions = importData.popcornOptions;
    };

    this.exportJSON = function () {
      return {
        start: this.start,
        end: this.end,
        type: this.type,
        popcornOptions: this.popcornOptions,
        track: this.track ? this.track.getName() : undefined,
        name: name
      };
    };

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

    this.getName = function () {
      return name;
    }; //getName

    this.getId = function () {
      return id;
    }; //getId

    this.importJSON = function ( importData ) {
      if ( importData.name ) {
        name = importData.name
      }
      this.object = importData.object
    };

    this.exportJSON = function () {
      var obj;
      try {
        obj = JSON.stringify( this.object );
      }
      catch ( e ) {
        obj = this.object.toString();
      }
      return {
        name: name,
        object: obj
      };
    };
  }; //Target

  /****************************************************************************
   * Media
   ****************************************************************************/
  var numMedia = 0;
  var Media = function ( options ) {
    options = options || {};

    var tracksByName = {},
        tracks = [],
        id = numMedia++,
        name = options.name || "Media" + id + Date.now(),
        url,
        target,
        butter = undefined,
        currentTime = 0,
        duration = 0,
        that = this;

    this.getUrl = function () {
      return url;
    };

    this.getTarget = function () {
      return target;
    };

    this.setUrl = function ( newUrl ) {
      url = newUrl;
      butter && butter.trigger( "mediacontentchanged", that );
    };

    this.setTarget = function ( newTarget ) {
      target = newTarget;
      butter && butter.trigger( "mediatargetchanged", that );
    };

    this.getName = function () {
      return name;
    };

    this.getId = function () {
      return id;
    };

    this.getTracks = function () {
      return tracks;
    };

    this.setButter = function ( b ) {
      butter = b;
      if ( butter ) {
        butter.trigger( "mediaadded", that );
        var tracks = that.getTracks();
        for ( var i=0, l=tracks.length; i<l; ++i ) {
          tracks[i].setButter( butter );
        } //for
      }
    };

    this.getButter = function ()  {
      return butter;
    };

    this.addTrack = function ( track ) {
      if ( !(track instanceof Track) ) {
        track = new Track( track );
      } //if
      tracksByName[ track.getName() ] = track;
      tracks.push( track );
      butter && track.setButter( butter );
      return track;
    }; //addTrack

    this.getTrack = function ( name ) {
      var track = tracksByName[ name ];
      if ( track ) {
         return track;
      } //if

      for ( var i=0, l=tracks.length; i<l; ++i ) {
        if ( tracks[i].getName() === name ) {
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
        track.setButter( undefined );
        delete tracksByName[ track.getName() ];
        var events = track.getTrackEvents();
        for ( var i=0, l=events.length; i<l; ++i ) {
          butter.trigger( "trackeventremoved", events[i] );
        } //for
        butter && butter.trigger( "trackremoved", track );
        return track;
      } //if
      return undefined;    
    }; //removeTrack

    this.currentTime = function ( time ) {
      if ( time !== undefined ) {
        currentTime = time;
        butter && butter.trigger("mediatimeupdate", that);
      } //if
      return currentTime;
    }; //currentTime

    this.duration = function ( time ) {
      if ( time ) {
        duration = time;
        butter && butter.trigger("mediadurationchanged", that);
      }
      return duration;
    }; //duration

    this.importJSON = function ( importData ) {
      if ( importData.name ) {
        name = importData.name;
      }

      importData.target && that.setTarget( importData.target );
      importData.url && that.setUrl( importData.url );
      
      if ( importData.tracks ) {
        var importTracks = importData.tracks;
        for ( var i=0, l=importTracks.length; i<l; ++i ) {
          var newTrack = new Track();
          newTrack.importJSON( importTracks[ i ] );
          that.addTrack( newTrack );
        }
      }
    };

    this.exportJSON = function () {
      var exportJSONTracks = [];
      for ( var i=0, l=tracks.length; i<l; ++i ) {
        exportJSONTracks.push( tracks[ i ].exportJSON() );
      }
      return {
        name: name,
        url: url,
        target: target,
        duration: duration,
        tracks: exportJSONTracks
      };
    };

    options.url && this.setUrl( options.url );
    options.target && this.setTarget( options.target );

  }; //Media

  /****************************************************************************
   * Butter
   ****************************************************************************/
  var numButters = 0;
  var Butter = function ( options ) {

    var events = {},
        medias = [],
        mediaByName = {},
        currentMedia,
        targets = [],
        targetsByName = {},
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
        for (var i=0, l=events[ name ].length; i<l; ++i) {
          events[ name ][ i ].call( that, eventObj, domain );
        } //for
      } //if
      if ( domain ) {
        name = name + domain;
        if ( events[ name ] ) {
          for (var i=0, l=events[ name ].length; i<l; ++i) {
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

    //getTrackEvents - Get a list of Track Events
    this.getTrackEvents = function () {
      checkMedia();
      var tracks = currentMedia.getTracks();
      var trackEvents = {};
      for ( var i=0, l=tracks.length; i<l; ++i ) {
        var track = tracks[i];
        trackEvents[ track.getName() ] = track.getTrackEvents();
      } //for
      return trackEvents;
    }; //getTrackEvents

    this.getTrackEvent = function ( track, trackEvent ) {
      checkMedia();
      if ( track && trackEvent ) {
        if ( typeof(track) === "string" ) {
          track = that.getTrack( track );
        } //if
        return track.getTrackEvent( trackEvent );
      }
      else {
        var events = that.getTrackEvents();
        for ( var trackName in events ) {
          var t = events[ trackName ];
          for ( var i=0, l=t.length; i<l; ++i ) {
            if ( t[ i ].getName() === track ) {
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

    //getTracks - Get a list of Tracks
    this.getTracks = function () {
      checkMedia();
      return currentMedia.getTracks();
    }; //getTracks

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

      targetsByName[ target.getName() ] = target;
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
        delete targets[ target.getName() ]; 
        that.trigger( "targetremoved", target );
        return target;
      } //if
      return undefined;
    };

    //getTargets - get a list of targets objects
    this.getTargets = function ( serialize ) {
      if ( serialize ) {
        var sTargets = [];
        for ( var i=0, l=targets.length; i<l; ++i ) {
          sTargets.push( targets[i].exportJSON() );
        } 
        return sTargets;
      }
      else {
        return targets;
      }
    };

    //getTarget - get a target object by its id
    this.getTarget = function ( name ) {
      return targetsByName[ name ];
    };

    /****************************************************************
     * Project methods
     ****************************************************************/
    //importProject - Import project data
    this.importProject = function ( projectData ) {
      projectDetails = projectData.project;
      if ( projectData.targets ) {
        for ( var i=0, l=projectData.targets.length; i<l; ++i ) {
          var t = new Target();
          t.importJSON( projectData.targets[ i ] );
          that.addTarget( t );
        }
      }
      if ( projectData.media ) {
        for ( var i=0, l=projectData.media.length; i<l; ++i ) {
          var m = new Media();
          m.importJSON( projectData.media[ i ] );
          that.addMedia( m );          
        }
      }
    };

    //exportProject - Export project data
    this.exportProject = function () {
      var exportJSONMedia = [];
      for ( var m=0, lm=medias.length; m<lm; ++m ) {
        exportJSONMedia.push( medias[ m ].exportJSON() );
      }
      var projectData = {
        project: projectDetails,
        targets: that.getTargets( true ),
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
      var allTracks = that.getTracks(),
      allTargets = that.getTargets(),
      allMedias = that.getAllMedia();
      for ( var i = 0, l = allTracks.length; i < l; i++ ) {
        that.removeTrack( allTracks[ i ] );
      }
      for ( var i = 0, l = allTargets.length; i < l; i++ ) {
        that.removeTarget( allTargets[ i ] );
      }
      for ( var i = 0, l = allMedias.length; i < l; i++ ) {
        that.removeMedia( allMedias[ i ] );
      }
    };

    /****************************************************************
     * Media methods
     ****************************************************************/
    //currentTime - Gets and Sets the media's current time.
    this.currentTime = function ( time ) {
      checkMedia();
      return currentMedia.currentTime( time );
    };

    //duration - Gets and Sets the media's duration.
    this.duration = function ( time ) {
      checkMedia();
      return currentMedia.duration( time );
    };

    //getAllMedia - returns all stored media objects
    this.getAllMedia = function () {
      return medias;
    };

    //getMedia - get the media's information
    this.getMedia = function ( media ) {
      if ( mediaByName[ media ] ) {
        return mediaByName[ media ];
      }

      for ( var i=0,l=medias.length; i<l; ++i ) {
        if ( medias[i].getName() === media ) {
          return medias[i];
        }
      }

      return undefined;
    };

    //getCurrentMedia - returns the current media object
    this.getCurrentMedia = function () {
      return currentMedia;
    };

    //setMedia - set the media's information
    this.setMedia = function ( media ) {
      if ( typeof( media ) === "string" ) {
        media = that.getMedia( media );
      } //if

      if ( media && medias.indexOf( media ) > -1 ) {
        currentMedia = media;
        that.trigger( "mediachanged", media );
        return currentMedia;
      } //if
    };

    //addMedia - add a media object
    this.addMedia = function ( media ) {
      if ( !( media instanceof Media ) ) {
        media = new Media( media );
      } //if

      var mediaName = media.getName();
      medias.push( media );
      mediaByName[ mediaName ] = media;

      media.setButter( that );
      if ( !currentMedia ) {
        that.setMedia( media );
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
        delete mediaByName[ media.getName() ];
        media.setButter( undefined );
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

    /****************************************************************
     * Init Modules for this instance
     ****************************************************************/
    /*
    for ( var moduleName in modules ) {
      modules[moduleName].setup && modules[moduleName].setup.call(this);
    } //for
    */

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

  Butter.registerModule( "comm", {

    setup: function ( options ) {
    },

    extend: {

      CommClient: function ( name, onmessage ) {

        var listeners = {};

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
              listeners.splice( idx, 1 );
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

      }, //CommClient

      CommServer: function () {

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
                listeners.splice( idx, 1 );
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

    } //extend

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
      
      var pluginElement = document.createElement( "span" );
      pluginElement.innerHTML = plugin.type + " ";
      pluginElement.id = plugin.type;
      pluginElement.setAttribute( "data-trackliner-type", "butterapp" );
      $( pluginElement ).draggable({ helper: "clone", appendTo: "body", zIndex: 9001, revert: true, revertDuration: 0 });
      container.appendChild( pluginElement );
      
      return plugin;
    }; //addPlugin
        
    this.getPlugins = function () {
      return plugins;
    }; //getPlugins

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
        editorSrc =  customEditors[ trackEvent.type ] || trackEvent.manifest.customEditor || defaultEditor,
        updateEditor = function( trackEvent ){
          commServer.send( "editorCommLink", trackEvent.data.popcornOptions, "updatetrackevent" );
        };

      editorTarget && clearTarget();

      if ( binding === "bindWindow" ) {

        editorWindow = targetWindow || window.open( editorSrc, "", "width=" + editorWidth + ",height=" + editorHeight + ",menubar=no,toolbar=no,location=no,status=no" );
        setupServer();
        editorWindow.addEventListener( "beforeunload", function() {
          butter.unlisten ( "trackeventupdated", updateEditor );
          butter.trigger( "trackeditforcedclosed" );
        }, false );
      } else if ( binding === "bindFrame" ) {

        editorWindow = document.createElement( "iframe" );
        editorWindow.style.width = editorWidth;
        editorWindow.style.height = editorHeight;
        setupServer();
        editorWindow.src = editorSrc;
        editorTarget.appendChild( editorWindow );
      }

      function setupServer() {

        commServer[ binding ]( "editorCommLink", editorWindow, function() {

          butter.listen( "trackeventupdated", updateEditor );
          butter.listen( "targetadded", function() {
            commServer.send( "editorCommLink", butter.getTargets(), "domtargetsupdated" );
          });
          commServer.listen( "editorCommLink", "okayclicked", function( newOptions ){

            trackEvent.popcornOptions = newOptions;
            editorWindow.close && editorWindow.close();
            editorWindow && editorWindow.parentNode && editorWindow.parentNode.removeChild( editorWindow );
            butter.unlisten ( "trackeventupdated", updateEditor );
            butter.trigger( "trackeditclosed" );
            butter.trigger( "trackeventupdated", trackEvent );
          });
          commServer.listen( "editorCommLink", "applyclicked", function( newOptions ) {

            trackEvent.popcornOptions = newOptions;
            butter.trigger( "trackeventupdated", trackEvent );
          });
          commServer.listen( "editorCommLink", "deleteclicked", function() {

            butter.removeTrackEvent( trackEvent );
            editorWindow.close && editorWindow.close();
            editorWindow && editorWindow.parentNode && editorWindow.parentNode.removeChild( editorWindow );
            butter.unlisten ( "trackeventupdated", updateEditor );
            butter.trigger( "trackeditclosed" );
          });
          commServer.listen( "editorCommLink", "cancelclicked", function() {

            editorWindow.close && editorWindow.close();
            editorWindow && editorWindow.parentNode && editorWindow.parentNode.removeChild( editorWindow );
            butter.unlisten ( "trackeventupdated", updateEditor );
            butter.trigger( "trackeditclosed" );
          });

          var targetCollection = butter.getTargets(), targetArray = [];
          for ( var i=0, l=targetCollection.length; i<l; ++i ) {
            targetArray.push( [ targetCollection[ i ].getName(), targetCollection[ i ].getId() ] );
          }
          
          commServer.send( "editorCommLink", { trackEvent: trackEvent, targets: targetArray }, "edittrackevent");
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

    commServer = new Butter.CommServer();

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

(function (window, document, Butter, undefined) {

  Butter.registerModule( "previewer", function ( options ) {

    var urlRegex, videoURL,
        iframe, iframeBody,
        popcornString, butterId,
        userSetMedia, videoString,
        popcornURL, originalHead,
        layout,
        popcorns;

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
      var doc = ( iframe.contentWindow || iframe.contentDocument ).document;
      var body = doc.getElementsByTagName( "BODY" );
          that = this;

      Butter.extend( originalHead, ( iframe.contentWindow || iframe.contentDocument ).document.head );

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
              target: children[ i ].id, 
              url: userSetMedia
            } );
          } // else

          // ensure we get every child, search recursively
          if ( children[ i ].children.length > 0 ) {

            bodyReady( children[ i ].children );
          } // if
        } // for
      } // bodyReady

    }; // scraper

    // buildPopcorn function, builds an instance of popcorn in the iframe and also
    // a local version of popcorn
    this.buildPopcorn = function( media, callback ) {

      videoURL = media.getUrl();
      
      if ( !videoURL ) {
        return;
      }

      var bpIframe = ( iframe.contentWindow || iframe.contentDocument ).document;
      
      // default to first butter-media tagged object if none is specified
      videoTarget = media.getTarget();

      bpIframe.getElementById( videoTarget ).innerHTML = "";

      // create a string that will create an instance of popcorn with the proper video source
      popcornString = "document.addEventListener('DOMContentLoaded', function () {\n";        

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
      } //for

      popcornString += "}, false);";  

      this.fillIframe( media, callback );
    }; //buildPopcorn

    this.getPopcorn = function( callback ) {
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

    }; //getPopcorn

    this.getRegistry = function() {
      var ifrme = iframe.contentWindow || iframe.contentDocument;
      return ifrme.Popcorn.registry;
    }; //getRegistry
  
    // fillIframe function used to populate the iframe with changes made by the user,
    // which is mostly managing track events added by the user
    this.fillIframe = function( media, callback ) {
      
      var popcornScript, iframeHead, body,
          that = this, doc = ( iframe.contentWindow || iframe.contentDocument ).document;

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

        var popcornIframe = iframe.contentWindow || iframe.contentDocument;
        var framePopcorn = popcornIframe[ "popcorn" + media.getId() ];
        
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
            that.duration( framePopcorn.media.duration );
            
            that.trigger( "mediaready", media );
            framePopcorn.media.addEventListener( "timeupdate", function() {
              
              that.currentTime( framePopcorn.media.currentTime );
              that.trigger( "mediatimeupdate", media );                
            },false);
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

          callback && callback();
        } );
      };

      // listen for a trackeventadded
      this.listen( "trackeventupdated", function ( e ) {
        this.teAdded( e ); 
      }); // listener


      this.listen( "trackeventadded", function ( e ) {
        e = e.data;

        popcornReady( e, function( framePopcorn ) {

          if( !popcorns[ media.getId() ] ) {
            popcorns[ media.getId() ] = framePopcorn;
          } else {
            framePopcorn = popcorns[ media.getId() ]; 
          }

          // add track events to the iframe verison of popcorn
          framePopcorn[ e.type ]( ( iframe.contentWindow || iframe.contentDocument ).Popcorn.extend( {},
            e.popcornOptions ) );
          
          butterIds[ e.getId() ] = framePopcorn.getLastTrackEventId();

          e.manifest = framePopcorn.getTrackEvent( butterIds[ e.getId() ] )._natives.manifest;
        } );
      }); // listener

      this.listen( "trackeventremoved", function( e ) {
        var ifrme = iframe.contentWindow || iframe.contentDocument;
        ifrme[ "popcorn" + media.getId() ].removeTrackEvent( butterIds[ e.data.getId() ] );
      } );

      this.listen( "mediatimeupdate", function( event ) {
        iframe.contentWindow[ "popcorn" + media.getId() ].currentTime( event.data.currentTime() );
      }, "timeline" );

      this.listen( "mediachanged", function( e ) {
        that.buildPopcorn( e.data );
      } );
      
      this.listen( "mediacontentchanged", function( e ) {
        that.buildPopcorn( e.data );
      } );
      
    }; // fillIframe

  }); //registerModule

})(window, document, Butter);
(function ( window, document, Butter, undefined ) {

  Butter.registerModule( "timeline", function ( options ) {

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

    var MediaInstance = function( media ) {

      // capturing self to be used inside element event listeners
      var self = this;

      this.container = document.createElement( "div" );
      this.container.style.width = "100%";
      this.container.style.height = "100%";
      this.container.style.position = "relative";
      this.container.style.MozUserSelect = "none";
      this.container.style.webkitUserSelect = "none";
      this.container.style.oUserSelect = "none";
      this.container.style.userSelect = "none";

      target.appendChild( this.container );

      this.tracks = document.createElement( "div" );
      this.tracks.style.width = "100%";
      this.tracks.style.height = "100%";

      this.init = function() {

        this.duration = media.duration();

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
        this.container.style.display = "none";

      };

      this.hide = function() {

        this.container.style.display = "none";
      };

      this.show = function() {

        this.container.style.display = "block";
      };
      
      this.media = media;
    };

    var mediaInstances = [],
        currentMediaInstance,
        target = document.getElementById( options.target ) || options.target,
        b = this;

    TrackLiner.plugin( "butterapp", {
      // called when a new track is created
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

          return { left: left, innerHTML: trackEventObj.type, width: width };
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
        }
        currentMediaInstance.lastTrack = trackLinerTrack;

        b.trigger( "trackeventupdated", trackEventObj.options );
      },
      // called when a track event is clicked
      click: function ( track, trackEventObj, event, ui ) {},
      // called when a track event is double clicked
      dblclick: function( track, trackEventObj, event, ui ) {

        b.editTrackEvent && b.editTrackEvent( trackEventObj.options );
      }
    });

    this.listen( "trackadded", function( event ) {

      var track = event.data;
      var trackLinerTrack = currentMediaInstance.trackLine.createTrack();
      currentMediaInstance.trackLinerTracks[ track.getId() ] = trackLinerTrack;
      currentMediaInstance.lastTrack = trackLinerTrack;
      currentMediaInstance.butterTracks[ trackLinerTrack.id() ] = track;
    });

    this.listen( "trackremoved", function( event ) {

      var track = event.data;
      var trackLinerTrack = currentMediaInstance.trackLinerTracks[ track.getId() ],
          trackEvents = trackLinerTrack.getTrackEvents(),
          trackEvent;
      for ( trackEvent in trackEvents ) {
        if ( trackEvents.hasOwnProperty( trackEvent ) ) {
          b.removeTrackEvent( track, currentMediaInstance.butterTrackEvents[ trackEvents[ trackEvent ].element.id ] );
        }
      }
      currentMediaInstance.trackLine.removeTrack( trackLinerTrack );
      delete currentMediaInstance.butterTracks[ trackLinerTrack.id() ];
      delete currentMediaInstance.trackLinerTracks[ track.getId() ];
    });

    this.listen( "trackeventadded", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.lastTrack.createTrackEvent( "butterapp", trackEvent );
      currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ] = trackLinerTrackEvent;
      currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ] = trackEvent;
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
    });

    this.listen( "mediaready", function( event ) {

      mediaInstances[ event.data.getId() ].init();
      butter.trigger( "timelineready", {}, "timeline" );
    });

    this.listen( "mediachanged", function( event ) {

      currentMediaInstance && currentMediaInstance.hide();
      currentMediaInstance = mediaInstances[ event.data.getId() ];
      currentMediaInstance && currentMediaInstance.show();
      butter.trigger( "timelineready", {}, "timeline" );
    });

    this.listen( "mediaremoved", function( event ) {

      delete mediaInstances[ event.data.getId() ];
      if ( event.data.getId() === currentMediaInstance.media.getId() ) {
        currentMediaInstance = undefined;
      }
    });

    this.listen( "trackeventupdated", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ];
          trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId );
      delete currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];
      trackLinerTrack.removeTrackEvent( trackLinerTrackEvent.element.id );
      trackLinerTrackEvent = trackLinerTrack.createTrackEvent( "butterapp", trackEvent );
      currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ] = trackEvent;
      currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ] = trackLinerTrackEvent;
    });

    this.currentTimeInPixels = function( pixel ) {

      if ( pixel != null) {

        b.currentTime( pixel / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration );
      } //if
      return b.currentTime() / currentMediaInstance.duration * ( currentMediaInstance.container.offsetWidth );
    };
  });

})( window, window.document, Butter );


/*!
 * Popcorn.sequence
 *
 * Copyright 2011, Rick Waldron
 * Licensed under MIT license.
 *
 */

/* jslint forin: true, maxerr: 50, indent: 4, es5: true  */
/* global Popcorn: true */

// Requires Popcorn.js
(function( global, Popcorn ) {

  // TODO: as support increases, migrate to element.dataset 
  var doc = global.document, 
      location = global.location,
      rprotocol = /:\/\//, 
      // TODO: better solution to this sucky stop-gap
      lochref = location.href.replace( location.href.split("/").slice(-1)[0], "" ), 
      // privately held
      range = function(start, stop, step) {

        start = start || 0;
        stop = ( stop || start || 0 ) + 1;
        step = step || 1;
            
        var len = Math.ceil((stop - start) / step) || 0,
            idx = 0,
            range = [];

        range.length = len;

        while (idx < len) {
         range[idx++] = start;
         start += step;
        }
        return range;
      };

  Popcorn.sequence = function( parent, list ) {
    return new Popcorn.sequence.init( parent, list );
  };

  Popcorn.sequence.init = function( parent, list ) {
    
    // Video element
    this.parent = doc.getElementById( parent );
    
    // Store ref to a special ID
    this.seqId = Popcorn.guid( "__sequenced" );

    // List of HTMLVideoElements 
    this.queue = [];

    // List of Popcorn objects
    this.playlist = [];

    // Lists of in/out points
    this.inOuts = {

      // Stores the video in/out times for each video in sequence
      ofVideos: [], 

      // Stores the clip in/out times for each clip in sequences
      ofClips: []

    };

    // Store first video dimensions
    this.dims = {
      width: 0, //this.video.videoWidth,
      height: 0 //this.video.videoHeight
    };

    this.active = 0;
    this.cycling = false;
    this.playing = false;

    this.times = {
      last: 0
    };

    // Store event pointers and queues
    this.events = {

    };

    var self = this, 
        clipOffset = 0;

    // Create `video` elements
    Popcorn.forEach( list, function( media, idx ) {

      var video = doc.createElement( "video" );

      video.preload = "auto";

      // Setup newly created video element
      video.controls = true;

      // If the first, show it, if the after, hide it
      video.style.display = ( idx && "none" ) || "" ;

      // Seta registered sequence id
      video.id = self.seqId + "-" + idx ;

      // Push this video into the sequence queue
      self.queue.push( video );

      var //satisfy lint
       mIn = media["in"], 
       mOut = media["out"];
       
      // Push the in/out points into sequence ioVideos
      self.inOuts.ofVideos.push({ 
        "in": ( mIn !== undefined && mIn ) || 1,
        "out": ( mOut !== undefined && mOut ) || 0
      });

      self.inOuts.ofVideos[ idx ]["out"] = self.inOuts.ofVideos[ idx ]["out"] || self.inOuts.ofVideos[ idx ]["in"] + 2;
      
      // Set the sources
      video.src = !rprotocol.test( media.src ) ? lochref + media.src : media.src;

      // Set some squence specific data vars
      video.setAttribute("data-sequence-owner", parent );
      video.setAttribute("data-sequence-guid", self.seqId );
      video.setAttribute("data-sequence-id", idx );
      video.setAttribute("data-sequence-clip", [ self.inOuts.ofVideos[ idx ]["in"], self.inOuts.ofVideos[ idx ]["out"] ].join(":") );

      // Append the video to the parent element
      self.parent.appendChild( video );
      

      self.playlist.push( Popcorn("#" + video.id ) );      

    });

    self.inOuts.ofVideos.forEach(function( obj ) {

      var clipDuration = obj["out"] - obj["in"], 
          offs = {
            "in": clipOffset,
            "out": clipOffset + clipDuration
          };

      self.inOuts.ofClips.push( offs );
      
      clipOffset = offs["out"] + 1;
    });

    Popcorn.forEach( this.queue, function( media, idx ) {

      function canPlayThrough( event ) {

        // If this is idx zero, use it as dimension for all
        if ( !idx ) {
          self.dims.width = media.videoWidth;
          self.dims.height = media.videoHeight;
        }
        
        media.currentTime = self.inOuts.ofVideos[ idx ]["in"] - 0.5;

        media.removeEventListener( "canplaythrough", canPlayThrough, false );

        return true;
      }

      // Hook up event listeners for managing special playback 
      media.addEventListener( "canplaythrough", canPlayThrough, false );

      // TODO: consolidate & DRY
      media.addEventListener( "play", function( event ) {

        self.playing = true;

      }, false );

      media.addEventListener( "pause", function( event ) {

        self.playing = false;

      }, false );

      media.addEventListener( "timeupdate", function( event ) {

        var target = event.srcElement || event.target, 
            seqIdx = +(  (target.dataset && target.dataset.sequenceId) || target.getAttribute("data-sequence-id") ), 
            floor = Math.floor( media.currentTime );

        if ( self.times.last !== floor && 
              seqIdx === self.active ) {

          self.times.last = floor;
          
          if ( floor === self.inOuts.ofVideos[ seqIdx ]["out"] ) {

            Popcorn.sequence.cycle.call( self, seqIdx );
          }
        }
      }, false );
    });

    return this;
  };

  Popcorn.sequence.init.prototype = Popcorn.sequence.prototype;

  //  
  Popcorn.sequence.cycle = function( idx ) {

    if ( !this.queue ) {
      Popcorn.error("Popcorn.sequence.cycle is not a public method");
    }

    var // Localize references
    queue = this.queue, 
    ioVideos = this.inOuts.ofVideos, 
    current = queue[ idx ], 
    nextIdx = 0, 
    next, clip;

    
    var // Popcorn instances
    $popnext, 
    $popprev;


    if ( queue[ idx + 1 ] ) {
      nextIdx = idx + 1;
    }

    // Reset queue
    if ( !queue[ idx + 1 ] ) {

      nextIdx = 0;
      this.playlist[ idx ].pause();
      
    } else {
    
      next = queue[ nextIdx ];
      clip = ioVideos[ nextIdx ];

      // Constrain dimentions
      Popcorn.extend( next, {
        width: this.dims.width, 
        height: this.dims.height
      });

      $popnext = this.playlist[ nextIdx ];
      $popprev = this.playlist[ idx ];

      // When not resetting to 0
      current.pause();

      this.active = nextIdx;
      this.times.last = clip["in"] - 1;

      // Play the next video in the sequence
      $popnext.currentTime( clip["in"] );

      $popnext[ nextIdx ? "play" : "pause" ]();

      // Trigger custom cycling event hook
      this.trigger( "cycle", { 

        position: {
          previous: idx, 
          current: nextIdx
        }
        
      });
      
      // Set the previous back to it's beginning time
      // $popprev.currentTime( ioVideos[ idx ].in );

      if ( nextIdx ) {
        // Hide the currently ending video
        current.style.display = "none";
        // Show the next video in the sequence    
        next.style.display = "";    
      }

      this.cycling = false;
    }

    return this;
  };

  var excludes = [ "timeupdate", "play", "pause" ];
  
  // Sequence object prototype
  Popcorn.extend( Popcorn.sequence.prototype, {

    // Returns Popcorn object from sequence at index
    eq: function( idx ) {
      return this.playlist[ idx ];
    }, 
    // Remove a sequence from it's playback display container
    remove: function() {
      this.parent.innerHTML = null;
    },
    // Returns Clip object from sequence at index
    clip: function( idx ) {
      return this.inOuts.ofVideos[ idx ];
    },
    // Returns sum duration for all videos in sequence
    duration: function() {

      var ret = 0, 
          seq = this.inOuts.ofClips, 
          idx = 0;

      for ( ; idx < seq.length; idx++ ) {
        ret += seq[ idx ]["out"] - seq[ idx ]["in"] + 1;
      }

      return ret - 1;
    },

    play: function() {

      this.playlist[ this.active ].play();

      return this;
    },
    // Attach an event to a single point in time
    exec: function ( time, fn ) {

      var index = this.active;
      
      this.inOuts.ofClips.forEach(function( off, idx ) {
        if ( time >= off["in"] && time <= off["out"] ) {
          index = idx;
        }
      });

      //offsetBy = time - self.inOuts.ofVideos[ index ].in;
      
      time += this.inOuts.ofVideos[ index ]["in"] - this.inOuts.ofClips[ index ]["in"];

      // Creating a one second track event with an empty end
      Popcorn.addTrackEvent( this.playlist[ index ], {
        start: time - 1,
        end: time,
        _running: false,
        _natives: {
          start: fn || Popcorn.nop,
          end: Popcorn.nop,
          type: "exec"
        }
      });

      return this;
    },
    // Binds event handlers that fire only when all 
    // videos in sequence have heard the event
    listen: function( type, callback ) {

      var self = this, 
          seq = this.playlist,
          total = seq.length, 
          count = 0, 
          fnName;

      if ( !callback ) {
        callback = Popcorn.nop;
      }

      // Handling for DOM and Media events
      if ( Popcorn.Events.Natives.indexOf( type ) > -1 ) {
        Popcorn.forEach( seq, function( video ) {

          video.listen( type, function( event ) {

            event.active = self;
            
            if ( excludes.indexOf( type ) > -1 ) {

              callback.call( video, event );

            } else {
              if ( ++count === total ) {
                callback.call( video, event );
              }
            }
          });
        });

      } else {

        // If no events registered with this name, create a cache
        if ( !this.events[ type ] ) {
          this.events[ type ] = {};
        }

        // Normalize a callback name key
        fnName = callback.name || Popcorn.guid( "__" + type );

        // Store in event cache
        this.events[ type ][ fnName ] = callback;
      }

      // Return the sequence object
      return this;
    }, 
    unlisten: function( type, name ) {
      // TODO: finish implementation
    },
    trigger: function( type, data ) {
      var self = this;

      // Handling for DOM and Media events
      if ( Popcorn.Events.Natives.indexOf( type ) > -1 ) {

        //  find the active video and trigger api events on that video.
        return;

      } else {

        // Only proceed if there are events of this type
        // currently registered on the sequence
        if ( this.events[ type ] ) {

          Popcorn.forEach( this.events[ type ], function( callback, name ) {
            callback.call( self, { type: type }, data );
          });

        }
      }

      return this;
    }
  });


  Popcorn.forEach( Popcorn.manifest, function( obj, plugin ) {

    // Implement passthrough methods to plugins
    Popcorn.sequence.prototype[ plugin ] = function( options ) {

      // console.log( this, options );
      var videos = {}, assignTo = [], 
      idx, off, inOuts, inIdx, outIdx, keys, clip, clipInOut, clipRange;

      for ( idx = 0; idx < this.inOuts.ofClips.length; idx++  ) {
        // store reference 
        off = this.inOuts.ofClips[ idx ];
        // array to test against
        inOuts = range( off["in"], off["out"] );

        inIdx = inOuts.indexOf( options.start );
        outIdx = inOuts.indexOf( options.end );

        if ( inIdx > -1 ) {
          videos[ idx ] = Popcorn.extend( {}, off, {
            start: inOuts[ inIdx ],
            clipIdx: inIdx
          });
        }

        if ( outIdx > -1 ) {
          videos[ idx ] = Popcorn.extend( {}, off, {
            end: inOuts[ outIdx ], 
            clipIdx: outIdx
          });
        }
      }

      keys = Object.keys( videos ).map(function( val ) {
                return +val;
              });

      assignTo = range( keys[ 0 ], keys[ 1 ] );

      //console.log( "PLUGIN CALL MAPS: ", videos, keys, assignTo );
      for ( idx = 0; idx < assignTo.length; idx++ ) {

        var compile = {},
        play = assignTo[ idx ], 
        vClip = videos[ play ];

        if ( vClip ) {

          // has instructions
          clip = this.inOuts.ofVideos[ play ];
          clipInOut = vClip.clipIdx;
          clipRange = range( clip["in"], clip["out"] );

          if ( vClip.start ) {
            compile.start = clipRange[ clipInOut ];
            compile.end = clipRange[ clipRange.length - 1 ];
          }

          if ( vClip.end ) {
            compile.start = clipRange[ 0 ];
            compile.end = clipRange[ clipInOut ];
          }

          //compile.start += 0.1;
          //compile.end += 0.9;
          
        } else {

          compile.start = this.inOuts.ofVideos[ play ]["in"];
          compile.end = this.inOuts.ofVideos[ play ]["out"];

          //compile.start += 0.1;
          //compile.end += 0.9;
          
        }

        // Handling full clip persistance 
        //if ( compile.start === compile.end ) {
          //compile.start -= 0.1;
          //compile.end += 0.9;
        //}

        // Call the plugin on the appropriate Popcorn object in the playlist
        // Merge original options object & compiled (start/end) object into
        // a new fresh object
        this.playlist[ play ][ plugin ]( 

          Popcorn.extend( {}, options, compile )

        );
        
      }

      // Return the sequence object
      return this;
    };
    
  });
})( this, Popcorn );
// A global callback for youtube... that makes me angry
var onYouTubePlayerReady = function( containerId ) {

  onYouTubePlayerReady[ containerId ] && onYouTubePlayerReady[ containerId ]();
};
onYouTubePlayerReady.stateChangeEventHandler = {};

Popcorn.player( "youtube", {
  _setup: function( options ) {

    var media = this,
        youtubeObject,
        container = document.createElement( "div" ),
        currentTime = 0,
        seekTime = 0,
        seeking = false,

        // state code for volume changed polling
        volumeChanged = false,
        lastMuted = false,
        lastVolume = 0;

    container.id = media.id + Popcorn.guid();

    media.appendChild( container );

    var youtubeInit = function() {

      var flashvars,
          params,
          attributes,
          src;

      // expose a callback to this scope, that is called from the global callback youtube calls
      onYouTubePlayerReady[ container.id ] = function() {

        youtubeObject = document.getElementById( container.id );

        // more youtube callback nonsense
        onYouTubePlayerReady.stateChangeEventHandler[ container.id ] = function( state ) {

          // playing is state 1
          // paused is state 2
          if ( state === 1 ) {

            media.paused && media.play();
          // youtube fires paused events while seeking
          // this is the only way to get seeking events
          } else if ( state === 2 ) {

            // silly logic forced on me by the youtube API
            // calling youtube.seekTo triggers multiple events
            // with the second events getCurrentTime being the old time
            if ( seeking && seekTime === currentTime && seekTime !== youtubeObject.getCurrentTime() ) {

              seeking = false;
              youtubeObject.seekTo( currentTime );
              return;
            }

            currentTime = youtubeObject.getCurrentTime();
            media.dispatchEvent( "timeupdate" );
            !media.paused && media.pause();
          }
        };

        // youtube requires callbacks to be a string to a function path from the global scope
        youtubeObject.addEventListener( "onStateChange", "onYouTubePlayerReady.stateChangeEventHandler." + container.id );

        var timeupdate = function() {

          if ( !media.paused ) {

            currentTime = youtubeObject.getCurrentTime();
            media.dispatchEvent( "timeupdate" );
            setTimeout( timeupdate, 10 );
          }
        };

        var volumeupdate = function() {

          if ( lastMuted !== youtubeObject.isMuted() ) {

            lastMuted = youtubeObject.isMuted();
            media.dispatchEvent( "volumechange" );
          }

          if ( lastVolume !== youtubeObject.getVolume() ) {

            lastVolume = youtubeObject.getVolume();
            media.dispatchEvent( "volumechange" );
          }

          setTimeout( volumeupdate, 250 );
        };

        media.play = function() {

          media.paused = false;
          media.dispatchEvent( "play" );

          media.dispatchEvent( "playing" );
          timeupdate();
          youtubeObject.playVideo();
        };

        media.pause = function() {

          if ( !media.paused ) {

            media.paused = true;
            media.dispatchEvent( "pause" );
            youtubeObject.pauseVideo();
          }
        };

        Popcorn.player.defineProperty( media, "currentTime", {
          set: function( val ) {

            // make sure val is a number
            currentTime = seekTime = +val;
            seeking = true;
            media.dispatchEvent( "seeked" );
            media.dispatchEvent( "timeupdate" );
            youtubeObject.seekTo( currentTime );
            return currentTime;
          },
          get: function() {

            return currentTime;
          }
        });

        Popcorn.player.defineProperty( media, "muted", {
          set: function( val ) {

            if ( youtubeObject.isMuted() !== val ) {

              if ( val ) {

                youtubeObject.mute();
              } else {

                youtubeObject.unMute();
              }

              lastMuted = youtubeObject.isMuted();
              media.dispatchEvent( "volumechange" );
            }

            return youtubeObject.isMuted();
          },
          get: function() {

            return youtubeObject.isMuted();
          }
        });

        Popcorn.player.defineProperty( media, "volume", {
          set: function( val ) {

            if ( youtubeObject.getVolume() !== val ) {

              youtubeObject.setVolume( val );
              lastVolume = youtubeObject.getVolume();
              media.dispatchEvent( "volumechange" );
            }

            return youtubeObject.getVolume();
          },
          get: function() {

            return youtubeObject.getVolume();
          }
        });

        media.readyState = 4;
        media.dispatchEvent( "load" );
        media.duration = youtubeObject.getDuration();
        media.dispatchEvent( "durationchange" );
        volumeupdate();

        media.dispatchEvent( "loadeddata" );
      };

      options.controls = +options.controls === 0 || +options.controls === 1 ? options.controls : 1;
      options.annotations = +options.annotations === 1 || +options.annotations === 3 ? options.annotations : 1;

      flashvars = {
        playerapiid: container.id,
        controls: options.controls,
        iv_load_policy: options.annotations
      };

      params = {
        wmode: "transparent",
        allowScriptAccess: "always"
      };

      attributes = {
        id: container.id
      };

      src = /^.*[\/=](.{11})/.exec( media.src )[ 1 ];

      swfobject.embedSWF( "http://www.youtube.com/e/" + src + "?enablejsapi=1&playerapiid=" + container.id + "&version=3",
                          container.id, media.offsetWidth, media.offsetHeight, "8", null,
                          flashvars, params, attributes );
    };

    if ( !window.swfobject ) {

      Popcorn.getScript( "http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js", youtubeInit );
    } else {

      youtubeInit();
    }
  }
});

// Popcorn Vimeo Player Wrapper
( function( Popcorn, global ) {
  /**
  * Vimeo wrapper for Popcorn.
  * This player adds enables Popcorn.js to handle Vimeo videos. It does so by masking an embedded Vimeo video Flash object
  * as a video and implementing the HTML5 Media Element interface.
  *
  * You can specify the video in four ways:
  *  1. Use the embed code path supplied by Vimeo as a div's src, and pass the div id into a new Popcorn.vimeo object
  *
  *    <div id="player_1" width="500" height="281" src="http://player.vimeo.com/video/11127501" ></div>
  *    <script type="text/javascript">
  *      document.addEventListener("DOMContentLoaded", function() {
  *        var popcorn = Popcorn( Popcorn.vimeo( "player_1" ) );
  *      }, false);
  *    </script>
  &
  *  2. Pass the div id and the embed code path supplied by Vimeo into a new Popcorn.vimeo object
  *
  *    <div id="player_1" width="500" height="281" ></div>
  *    <script type="text/javascript">
  *      document.addEventListener("DOMContentLoaded", function() {
  *        var popcorn = Popcorn( Popcorn.vimeo( "player_1", "http://player.vimeo.com/video/11127501" ) );
  *      }, false);
  *    </script>
  *
  *  3. Use a web url as a div's src, and pass the div id into a new Popcorn.vimeo object
  *
  *    <div id="player_1" width="500" height="281" src="http://vimeo.com/11127501" ></div>
  *    <script type="text/javascript">
  *      document.addEventListener("DOMContentLoaded", function() {
  *        var popcorn = Popcorn( Popcorn.vimeo( "player_1" ) );
  *      }, false);
  *    </script>
  *
  *  4. Pass the div id and the web url into a new Popcorn.vimeo object
  *
  *    <div id="player_1" width="500" height="281" ></div>
  *    <script type="text/javascript">
  *      document.addEventListener("DOMContentLoaded", function() {
  *        var popcorn = Popcorn( Popcorn.vimeo( "player_1", "http://vimeo.com/11127501" ) );
  *      }, false);
  *    </script>
  *
  * Due to Vimeo's API, certain events must be subscribed to at different times, and some not at all.
  * These events are completely custom-implemented and may be subscribed to at any time:
  *   canplaythrough
  *   durationchange
  *   load
  *   loadedmetadata
  *   loadstart
  *   play
  *   readystatechange
  *   volumechange
  *
  * These events are related to player functionality and must be subscribed to during or after the load event:
  *   abort
  *   emptied
  *   ended
  *   pause
  *   playing
  *   progress
  *   seeked
  *   timeupdate
  *
  * These events are not supported:
  *   canplay
  *   error
  *   loadeddata
  *   ratechange
  *   seeking
  *   stalled
  *   suspend
  *   waiting
  *
  * Due to Vimeo's API, some attributes are be supported while others are not.
  * Supported media attributes:
  *   autoplay ( via Popcorn )
  *   currentTime
  *   duration ( get only )
  *   ended ( get only )
  *   initialTime ( get only, always 0 )
  *   loop ( get only, set by calling setLoop() )
  *   muted ( get only )
  *   paused ( get only )
  *   readyState ( get only )
  *   volume
  *
  *   load() function
  *   mute() function ( toggles on/off )
  *
  * Unsupported media attributes:
  *   buffered
  *   defaultPlaybackRate
  *   networkState
  *   playbackRate
  *   played
  *   preload
  *   seekable
  *   seeking
  *   src
  *   startOffsetTime
  */

  // Trackers
  var timeupdateInterval = 33,
      timeCheckInterval = 0.75,
      abs = Math.abs,
      registry = {};

  // base object for DOM-related behaviour like events
  var EventManager = function ( owner ) {
    var evts = {};

    function makeHandler( evtName ) {
      if ( !evts[evtName] ) {
        evts[evtName] = [];

        // Create a wrapper function to all registered listeners
        this["on"+evtName] = function( args ) {
          Popcorn.forEach( evts[evtName], function( fn ) {
            if ( fn ) {
              fn.call( owner, args );
            }
          });
        };
      }
    }

    return {
      addEventListener: function( evtName, fn, doFire ) {
        evtName = evtName.toLowerCase();

        makeHandler.call( this, evtName );
        evts[evtName].push( fn );

        if ( doFire ) {
          dispatchEvent( evtName );
        }

        return fn;
      },
      // Add many listeners for a single event
      // Takes an event name and array of functions
      addEventListeners: function( evtName, events ) {
        evtName = evtName.toLowerCase();

        makeHandler.call( this, evtName );
        evts[evtName] = evts[evtName].concat( events );
      },
      removeEventListener: function( evtName, fn ) {
        var evtArray = this.getEventListeners( evtName ),
            i,
            l;

        // Find and remove from events array
        for ( i = 0, l = evtArray.length; i < l; i++) {
          if ( evtArray[i] === fn ) {
            var removed = evtArray[i];
            evtArray[i] = 0;
            return removed;
          }
        }
      },
      getEventListeners: function( evtName ) {
        if( evtName ) {
          return evts[ evtName.toLowerCase() ] || [];
        } else {
          return evts;
        }
      },
      dispatchEvent: function( evt, args ) {
        // If event object was passed in, toString will yield event type as string (timeupdate)
        // If a string, toString() will return the string itself (timeupdate)
        evt = "on"+evt.toString().toLowerCase();
        this[evt] && this[evt]( args );
      }
    };
  };

  Popcorn.vimeo = function( mediaId, list, options ) {
    return new Popcorn.vimeo.init( mediaId, list, options );
  };

  Popcorn.vimeo.onLoad = function( playerId ) {
    var player = registry[ playerId ];

    player.swfObj = document.getElementById( playerId );

    // For calculating position relative to video (like subtitles)
    player.offsetWidth = player.swfObj.offsetWidth;
    player.offsetHeight = player.swfObj.offsetHeight;
    player.offsetParent = player.swfObj.offsetParent;
    player.offsetLeft = player.swfObj.offsetLeft;
    player.offsetTop = player.swfObj.offsetTop;

    player.dispatchEvent( "load" );
  };

  Popcorn.getScript( "http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js" );

  // A constructor, but we need to wrap it to allow for "static" functions
  Popcorn.vimeo.init = (function() {
    var rPlayerUri = /^http:\/\/player\.vimeo\.com\/video\/[\d]+/i,
        rWebUrl = /vimeo\.com\/[\d]+/,
        hasAPILoaded = false;

    // Extract the numeric video id from container uri: 'http://player.vimeo.com/video/11127501' or 'http://player.vimeo.com/video/4282282'
    // Expect id to be a valid 32/64-bit unsigned integer
    // Returns string, empty string if could not match
    function extractIdFromUri( uri ) {
      if ( !uri ) {
        return;
      }

      var matches = uri.match( rPlayerUri );
      return matches ? matches[0].substr(30) : "";
    }

    // Extract the numeric video id from url: 'http://vimeo.com/11127501' or simply 'vimeo.com/4282282'
    // Ignores protocol and subdomain, but one would expecct it to be http://www.vimeo.com/#######
    // Expect id to be a valid 32/64-bit unsigned integer
    // Returns string, empty string if could not match
    function extractIdFromUrl( url ) {
      if ( !url ) {
        return;
      }

      var matches = url.match( rWebUrl );
      return matches ? matches[0].substr(10) : "";
    }

    function makeSwf( self, vidId, containerId ) {
      if ( !window.swfobject ) {
        setTimeout( function() {
          makeSwf( self, vidId, containerId );
        }, 1);
        return;
      }

      var params,
          flashvars,
          attributes = {};

      flashvars = {
        clip_id: vidId,
        show_portrait: 1,
        show_byline: 1,
        show_title: 1,
        // required in order to use the Javascript API
        js_api: 1,
        // moogaloop will call this JS function when it's done loading (optional)
        js_onLoad: 'Popcorn.vimeo.onLoad',
        // this will be passed into all event methods so you can keep track of multiple moogaloops (optional)
        js_swf_id: containerId
      };
      params = {
        allowscriptaccess: 'always',
        allowfullscreen: 'true',
        // This is so we can overlay html ontop o fFlash
        wmode: 'transparent'
      };

      swfobject.embedSWF( "http://vimeo.com/moogaloop.swf", containerId, self.offsetWidth, self.offsetHeight, "9.0.0", "expressInstall.swf", flashvars, params, attributes );
    }

    // If container id is not supplied, assumed to be same as player id
    var ctor = function ( containerId, videoUrl, options ) {
      if ( !containerId ) {
        throw "Must supply an id!";
      } else if ( /file/.test( location.protocol ) ) {
        throw "Must run from a web server!";
      }

      var vidId,
          that = this,
          tmp;

      this._container = document.createElement( "div" );
      this._container.id = containerId + "object";
      this._target = document.getElementById( containerId );
      this._target.appendChild( this._container );

      options = options || {};

      options.css && Popcorn.extend( this._target.style, options.css );

      this.addEventFn = null;
      this.evtHolder = null;
      this.paused = true;
      this.duration = Number.MAX_VALUE;
      this.ended = 0;
      this.currentTime = 0;
      this.volume = 1;
      this.loop = 0;
      this.initialTime = 0;
      this.played = 0;
      this.readyState = 0;
      this.parentNode = this._target.parentNode;

      this.previousCurrentTime = this.currentTime;
      this.previousVolume = this.volume;
      this.evtHolder = new EventManager( this );

      // For calculating position relative to video (like subtitles)
      this.width = this._target.style.width || "504px";
      this.height = this._target.style.height || "340px";

      if ( !/[\d]%/.test( this.width ) ) {
        this.offsetWidth = parseInt( this.width, 10 );
        this._target.style.width = this.width + "px";
      } else {
        // convert from pct to abs pixels
        tmp = this._target.style.width;
        this._target.style.width = this.width;
        this.offsetWidth = this._target.offsetWidth;
        this._target.style.width = tmp;
      }

      if ( !/[\d]%/.test( this.height ) ) {
        this.offsetHeight = parseInt( this.height, 10 );
        this._target.style.height = this.height + "px";
      } else {
        // convert from pct to abs pixels
        tmp = this._target.style.height;
        this._target.style.height = this.height;
        this.offsetHeight = this._target.offsetHeight;
        this._target.style.height = tmp;
      }

      this.offsetLeft = 0;
      this.offsetTop = 0;

      // Try and get a video id from a vimeo site url
      // Try either from ctor param or from iframe itself
      vidId = extractIdFromUrl( videoUrl ) || extractIdFromUri( videoUrl );

      if ( !vidId ) {
        throw "No video id";
      }

      registry[ this._container.id ] = this;

      makeSwf( this, vidId, this._container.id );

      // Set up listeners to internally track state as needed
      this.addEventListener( "load", function() {
        var hasLoaded = false;

        that.duration = that.swfObj.api_getDuration();
        that.evtHolder.dispatchEvent( "durationchange" );
        that.evtHolder.dispatchEvent( "loadedmetadata" );

        // Chain events and calls together so that this.currentTime reflects the current time of the video
        // Done by Getting the Current Time while the video plays
        that.addEventListener( "timeupdate", function() {
          that.currentTime = that.swfObj.api_getCurrentTime();
        });

        // Add pause listener to keep track of playing state

        that.addEventListener( "pause", function() {
          that.paused = true;
        });

        // Add play listener to keep track of playing state
        that.addEventListener( "playing", function() {
          that.paused = false;
          that.ended = 0;
        });

        // Add ended listener to keep track of playing state
        that.addEventListener( "ended", function() {
          if ( that.loop !== "loop" ) {
            that.paused = true;
            that.ended = 1;
          }
        });

        // Add progress listener to keep track of ready state
        that.addEventListener( "progress", function( data ) {
          if ( !hasLoaded ) {
            hasLoaded = 1;
            that.readyState = 3;
            that.evtHolder.dispatchEvent( "readystatechange" );
          }

          // Check if fully loaded
          if ( data.percent === 100 ) {
            that.readyState = 4;
            that.evtHolder.dispatchEvent( "readystatechange" );
            that.evtHolder.dispatchEvent( "canplaythrough" );
          }
        });
      });
    };
    return ctor;
  })();

  Popcorn.vimeo.init.prototype = Popcorn.vimeo.prototype;

  // Sequence object prototype
  Popcorn.extend( Popcorn.vimeo.prototype, {
    // Do everything as functions instead of get/set
    setLoop: function( val ) {
      if ( !val ) {
        return;
      }

      this.loop = val;
      var isLoop = val === "loop" ? 1 : 0;
      // HTML convention says to loop if value is 'loop'
      this.swfObj.api_setLoop( isLoop );
    },
    // Set the volume as a value between 0 and 1
    setVolume: function( val ) {
      if ( !val && val !== 0 ) {
        return;
      }

      // Normalize in case outside range of expected values
      if ( val < 0 ) {
        val = -val;
      }

      if ( val > 1 ) {
        val %= 1;
      }

      // HTML video expects to be 0.0 -> 1.0, Vimeo expects 0-100
      this.volume = this.previousVolume = val;
      this.swfObj.api_setVolume( val*100 );
      this.evtHolder.dispatchEvent( "volumechange" );
    },
    // Seeks the video
    setCurrentTime: function ( time ) {
      if ( !time && time !== 0 ) {
        return;
      }

      this.currentTime = this.previousCurrentTime = time;
      this.ended = time >= this.duration;
      this.swfObj.api_seekTo( time );

      // Fire events for seeking and time change
      this.evtHolder.dispatchEvent( "seeked" );
      this.evtHolder.dispatchEvent( "timeupdate" );
    },
    // Play the video
    play: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.play );
        return;
      }

      if ( !this.played ) {
        this.played = 1;
        this.startTimeUpdater();
        this.evtHolder.dispatchEvent( "loadstart" );
      }

      this.evtHolder.dispatchEvent( "play" );
      this.swfObj.api_play();
    },
    // Pause the video
    pause: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.pause );
        return;
      }

      this.swfObj.api_pause();
    },
    // Toggle video muting
    // Unmuting will leave it at the old value
    mute: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.mute );
        return;
      }

      if ( !this.muted() ) {
        this.oldVol = this.volume;

        if ( this.paused ) {
          this.setVolume( 0 );
        } else {
          this.volume = 0;
        }
      } else {
        if ( this.paused ) {
          this.setVolume( this.oldVol );
        } else {
          this.volume = this.oldVol;
        }
      }
    },
    muted: function() {
      return this.volume === 0;
    },
    // Force loading by playing the player. Pause afterwards
    load: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.load );
        return;
      }

      this.play();
      this.pause();
    },
    unload: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.unload );
        return;
      }

      this.pause();

      this.swfObj.api_unload();
      this.evtHolder.dispatchEvent( "abort" );
      this.evtHolder.dispatchEvent( "emptied" );
    },
    // Hook an event listener for the player event into internal event system
    // Stick to HTML conventions of add event listener and keep lowercase, without prependinng "on"
    addEventListener: function( evt, fn ) {
      var playerEvt,
          that = this;

      // In case event object is passed in
      evt = evt.type || evt.toLowerCase();

      // If it's an HTML media event supported by player, map
      if ( evt === "seeked" ) {
        playerEvt = "onSeek";
      } else if ( evt === "timeupdate" ) {
        playerEvt = "onProgress";
      } else if ( evt === "progress" ) {
        playerEvt = "onLoading";
      } else if ( evt === "ended" ) {
        playerEvt = "onFinish";
      } else if ( evt === "playing" ) {
        playerEvt = "onPlay";
      } else if ( evt === "pause" ) {
        // Direct mapping, CamelCase the event name as vimeo API expects
        playerEvt = "on"+evt[0].toUpperCase() + evt.substr(1);
      }

      // Vimeo only stores 1 callback per event
      // Have vimeo call internal collection of callbacks
      this.evtHolder.addEventListener( evt, fn, false );

      // Link manual event structure with Vimeo's if not already
      if( playerEvt && this.evtHolder.getEventListeners( evt ).length === 1 ) {
        // Setup global functions on Popcorn.vimeo to sync player events to an internal collection
        // Some events expect 2 args, some only one (the player id)
        if ( playerEvt === "onSeek" || playerEvt === "onProgress" || playerEvt === "onLoading" ) {
          Popcorn.vimeo[playerEvt] = function( arg1, arg2 ) {
            var player = registry[arg2];

            player.evtHolder.dispatchEvent( evt, arg1 );
          };
        } else {
          Popcorn.vimeo[playerEvt] = function( arg1 ) {
            var player = registry[arg1];
            player.evtHolder.dispatchEvent( evt );
          };
        }

        this.swfObj.api_addEventListener( playerEvt, "Popcorn.vimeo."+playerEvt );
      }
    },
    removeEventListener: function( evtName, fn ) {
      return this.evtHolder.removeEventListener( evtName, fn );
    },
    dispatchEvent: function( evtName ) {
      return this.evtHolder.dispatchEvent( evtName );
    },
    getBoundingClientRect: function() {
      return this._target.getBoundingClientRect();
    },
    startTimeUpdater: function() {
      var self = this,
          seeked = 0;

      if ( abs( this.currentTime - this.previousCurrentTime ) > timeCheckInterval ) {
        // Has programatically set the currentTime
        this.setCurrentTime( this.currentTime );
        seeked = 1;
      } else {
        this.previousCurrentTime = this.currentTime;
      }

      if ( this.volume !== this.previousVolume ) {
        this.setVolume( this.volume );
      }

      if ( !self.paused || seeked ) {
        this.dispatchEvent( 'timeupdate' );
      }

      if( !self.ended ) {
        setTimeout( function() {
          self.startTimeUpdater.call(self);
        }, timeupdateInterval);
      }
    }
  });
})( Popcorn, window );
(function( global, doc ) {
  Popcorn.baseplayer = function() {
    return new Popcorn.baseplayer.init();
  };

  Popcorn.baseplayer.init = function() {
    this.readyState = 0;
    this.currentTime = 0;
    this.baselineTime = new Date();
    this.duration = 0;
    this.paused = 1;
    this.ended = 0;
    this.volume = 1;
    this.muted = 0;
    this.playbackRate = 1;

    // These are considered to be "on" by being defined. Initialize to undefined
    this.autoplay = null;
    this.loop = null;

    // List of events
    this._events = {};

    // The underlying player resource. May be <canvas>, <iframe>, <object>, array, etc
    this._resource = null;
    // The container div of the resource
    this._container = null;

    this.offsetWidth = this.width = 0;
    this.offsetHeight = this.height = 0;
    this.offsetLeft = 0;
    this.offsetTop = 0;
    this.offsetParent = null;
  };

  Popcorn.baseplayer.init.prototype = {
    load: function() {},

    play: function() {
      this.paused = 0;
      this.timeupdate();
    },

    pause: function() {
      this.paused = 1;
    },

    timeupdate: function() {

      // So we can refer to the instance when setTimeout is run
      var self = this;

      if( !this.paused ) {
        this.currentTime += ( new Date() - this.baselineTime ) / 1000;
        this.dispatchEvent( "timeupdate" );
      }

      this.baselineTime = new Date();

      setTimeout(function() {
        self.timeupdate.call( self );
      }, 50 );
    },

    // By default, assumes this.resource is a DOM Element
    // Changing the type of this.resource requires this method to be overridden
    getBoundingClientRect: function() {
			return Popcorn.position( this._resource || this._container );
	  },

    // Add an event listener to the object
    addEventListener: function( evtName, fn ) {
      if ( !this._events[ evtName ] ) {
        this._events[ evtName ] = [];
      }

      this._events[ evtName ].push( fn );
      return fn;
    },

    // Can take event object or simple string
    dispatchEvent: function( oEvent ) {
      var evt,
          self = this,
          eventInterface,
          eventName = oEvent.type;

      // A string was passed, create event object
      if ( !eventName ) {
        eventName = oEvent;
        eventInterface  = Popcorn.events.getInterface( eventName );

        if ( eventInterface ) {
          evt = document.createEvent( eventInterface );
          evt.initEvent( eventName, true, true, window, 1 );
        }
      }

      Popcorn.forEach( this._events[ eventName ], function( val ) {
        val.call( self, evt, self );
      });
    },

    // Extracts values from container onto this object
    extractContainerValues: function( id ) {
      this._container = document.getElementById( id );

      if ( !this._container ) {
        return;
      }

      var bounds = this._container.getBoundingClientRect();

      this.offsetWidth = this.width = this.getStyle( "width" ) || 0;
      this.offsetHeight = this.height = this.getStyle( "height" ) || 0;
      this.offsetLeft = bounds.left;
      this.offsetTop = bounds.top;
      this.offsetParent = this._container.offsetParent;

      return this._container;
    },

    // By default, assumes this.resource is a DOM Element
    // Changing the type of this.resource requires this method to be overridden
    // Returns the computed value for CSS style 'prop' as computed by the browser
    getStyle: function( prop ) {

      var elem = this._resource || this._container;

      if ( elem.currentStyle ) {
        // IE syntax
        return elem.currentStyle[ prop ];
      } else if ( global.getComputedStyle ) {
        // Firefox, Chrome et. al
        return doc.defaultView.getComputedStyle( elem, null ).getPropertyValue( prop );
      } else {
        // Fallback, just in case
        return elem.style[ prop ];
      }
    }
  };
})( window, document );
// Popcorn Soundcloud Player Wrapper
( function( Popcorn, global ) {
  /**
  * Soundcloud wrapper for Popcorn.
  * This player adds enables Popcorn.js to handle Soundcloud audio. It does so by masking an embedded Soundcloud Flash object
  * as a video and implementing the HTML5 Media Element interface.
  *
  * You can configure the video source and dimensions in two ways:
  *  1. Use the embed code path supplied by Soundcloud the id of the desired location into a new Popcorn.soundcloud object.
  *     Width and height can be configured throughh CSS.
  *
  *    <div id="player_1" style="width: 500px; height: 81px"></div>
  *    <script type="text/javascript">
  *      document.addEventListener("DOMContentLoaded", function() {
  *        var popcorn = Popcorn( Popcorn.soundcloud( "player_1", "http://soundcloud.com/forss/flickermood" ));
  *      }, false);
  *    </script>
  *
  *  2. Width and height may also be configured directly with the player; this will override any CSS. This is useful for
  *     when different sizes are desired. for multiple players within the same parent container.
  *
  *     <div id="player_1"></div>
  *     <script type="text/javascript">
  *       document.addEventListener("DOMContentLoaded", function() {
  *       var popcorn = Popcorn( Popcorn.soundcloud( "player_1", "http://soundcloud.com/forss/flickermood", {
  *         width: "500",                                     // Optional, will default to CSS values
  *         height: "81"                                      // Optional, will default to CSS values
  *       }));
  *       }, false);
  *     </script>
  *
  * The player can be further configured to integrate with the SoundCloud API:
  *
  * var popcorn = Popcorn( Popcorn.soundcloud( "player_1", "http://soundcloud.com/forss/flickermood", {
  *   width: "100%",                                    // Optional, the width for the player. May also be as '##px'
  *                                                     //           Defaults to the maximum possible width
  *   height: "81px",                                   // Optional, the height for the player. May also be as '###%'
  *                                                     //           Defaults to 81px
  *   api: {                                            // Optional, information for Soundcloud API interaction
  *     key: "abcdefsdfsdf",                            // Required for API interaction. The Soundcloud API key
  *     commentdiv: "divId_for_output",                 // Required for comment retrieval, the Div Id for outputting comments.
  *     commentformat: function( comment ) {}           // Optional, a function to format a comment. Returns HTML string
  *   }
  * }));
  *
  * Comments are retrieved from Soundcloud when the player is registered with Popcorn by calling the registerWithPopcorn()
  * function. For this to work, the api_key and commentdiv attributes must be set. Comments are output by default similar to
  * how Soundcloud formats them in-player, but a custom formatting function may be supplied. It receives a comment object and
  * the current date. A comment object has:
  *
  * var comment = {
  *   start: 0,                           // Required. Start time in ms.
  *   date: new Date(),                   // Required. Date comment wasa posted.
  *   text: "",                           // Required. Comment text
  *   user: {                             // Required. Describes the user who posted the comment
  *     name: "",                         // Required. User name
  *     profile: "",                      // Required. User profile link
  *     avatar: ""                        // Required. User avatar link
  *   }
  * }
  *
  * These events are completely custom-implemented and may be subscribed to at any time:
  *   canplaythrough
  *   durationchange
  *   load
  *   loadedmetadata
  *   loadstart
  *   play
  *   readystatechange
  *   volumechange
  *
  * These events are related to player functionality and must be subscribed to during or after the load event:
  *   canplay
  *   ended
  *   error
  *   pause
  *   playing
  *   progress
  *   seeked
  *   timeupdate
  *
  * These events are not supported:
  *   abort
  *   emptied
  *   loadeddata
  *   ratechange
  *   seeking
  *   stalled
  *   suspend
  *   waiting
  *
  * Supported media attributes:
  *   autoplay ( via Popcorn )
  *   currentTime
  *   defaultPlaybackRate ( get only )
  *   duration ( get only )
  *   ended ( get only )
  *   initialTime ( get only, always 0 )
  *   loop ( get only, set by calling setLoop() )
  *   muted ( get only )
  *   paused ( get only )
  *   playbackRate ( get only )
  *   played ( get only, 0/1 only )
  *   readyState ( get only )
  *   src ( get only )
  *   volume
  *
  *   load() function
  *   mute() function ( toggles on/off )
  *   play() function
  *   pause() function
  *
  * Unsupported media attributes:
  *   buffered
  *   networkState
  *   preload
  *   seekable
  *   seeking
  *   startOffsetTime
  *
  *   canPlayType() function
  */

  // Trackers
  var timeupdateInterval = 33,
      timeCheckInterval = 0.25,
      abs = Math.abs,
      floor = Math.floor,
      round = Math.round,
      registry = {};

  function hasAllDependencies() {
    return global.swfobject && global.soundcloud;
  }

  // Borrowed from: http://www.quirksmode.org/dom/getstyles.html
  // Gets the style for the given element
  function getStyle( elem, styleProp ) {
    if ( elem.currentStyle ) {
      // IE way
      return elem.currentStyle[styleProp];
    } else if ( global.getComputedStyle ) {
      // Firefox, Chrome, et. al
      return document.defaultView.getComputedStyle( elem, null ).getPropertyValue( styleProp );
    }
  }

  function formatComment( comment ) {
    // Calclate the difference between d and now, express as "n units ago"
    function ago( d ) {
      var diff = ( ( new Date() ).getTime() - d.getTime() )/1000;

      function pluralize( value, unit ) {
        return value + " " + unit + ( value > 1 ? "s" : "") + " ago";
      }

      if ( diff < 60 ) {
        return pluralize( round( diff ), "second" );
      }
      diff /= 60;

      if ( diff < 60 ) {
        return pluralize( round( diff ), "minute" );
      }
      diff /= 60;

      if ( diff < 24 ) {
        return pluralize( round( diff ), "hour" );
      }
      diff /= 24;

      // Rough approximation of months
      if ( diff < 30 ) {
        return pluralize( round( diff ), "day" );
      }

      if ( diff < 365 ) {
        return pluralize( round( diff/30 ), "month" );
      }

      return pluralize( round( diff/365 ), "year" );
    }

    // Converts sec to min.sec
    function timeToFraction ( totalSec ) {
      var min = floor( totalSec / 60 ),
          sec = round( totalSec % 60 );

      return min + "." + ( sec < 10 ? "0" : "" ) + sec;
    }

    return '<div><a href="' + comment.user.profile + '">' +
           '<img width="16px height="16px" src="' + comment.user.avatar + '"></img>' +
           comment.user.name + '</a> at ' + timeToFraction( comment.start ) + ' '  +
           ago( comment.date )  +
           '<br />' + comment.text + '</span>';
  }

  function isReady( self ) {
    if ( !hasAllDependencies() ) {
      setTimeout( function() {
        isReady( self );
      }, 15 );
      return;
    }

    var flashvars = {
      enable_api: true,
      object_id: self._playerId,
      url: self.src,
      // Hide comments in player if showing them elsewhere
      show_comments: !self._options.api.key && !self._options.api.commentdiv
    },
    params = {
      allowscriptaccess: "always",
      // This is so we can overlay html ontop of Flash
      wmode: 'transparent'
    },
    attributes = {
      id: self._playerId,
      name: self._playerId
    },
    actualTarget = document.createElement( 'div' );

    actualTarget.setAttribute( "id", self._playerId );
    self._container.appendChild( actualTarget );

    swfobject.embedSWF( "http://player.soundcloud.com/player.swf", self._playerId, self.offsetWidth, self.height, "9.0.0", "expressInstall.swf", flashvars, params, attributes );
  }

  Popcorn.getScript( "http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js" );

  // Source file originally from 'https://github.com/soundcloud/Widget-JS-API/raw/master/soundcloud.player.api.js'
  Popcorn.getScript( "http://popcornjs.org/code/players/soundcloud/lib/soundcloud.player.api.js", function() {
    // Play event is fired twice when player is first started. Ignore second one
    var ignorePlayEvt = 1;

    // Register the wrapper's load event with the player
    soundcloud.addEventListener( 'onPlayerReady', function( object, data ) {
      var wrapper = registry[object.api_getFlashId()];

      wrapper.swfObj = object;
      wrapper.duration = object.api_getTrackDuration();
      wrapper.currentTime = object.api_getTrackPosition();
      // This eliminates volumechangee event from firing on load
      wrapper.volume = wrapper.previousVolume =  object.api_getVolume()/100;

      // The numeric id of the track for use with Soundcloud API
      wrapper._mediaId = data.mediaId;

      wrapper.dispatchEvent( 'load' );
      wrapper.dispatchEvent( 'canplay' );
      wrapper.dispatchEvent( 'durationchange' );

      wrapper.timeupdate();
    });

    // Register events for when the flash player plays a track for the first time
    soundcloud.addEventListener( 'onMediaStart', function( object, data ) {
      var wrapper = registry[object.api_getFlashId()];
      wrapper.played = 1;
      wrapper.dispatchEvent( 'playing' );
    });

    // Register events for when the flash player plays a track
    soundcloud.addEventListener( 'onMediaPlay', function( object, data ) {
      if ( ignorePlayEvt ) {
        ignorePlayEvt = 0;
        return;
      }

      var wrapper = registry[object.api_getFlashId()];
      wrapper.dispatchEvent( 'play' );
    });

    // Register events for when the flash player pauses a track
    soundcloud.addEventListener( 'onMediaPause', function( object, data ) {
      var wrapper = registry[object.api_getFlashId()];
      wrapper.dispatchEvent( 'pause' );
    });

    // Register events for when the flash player is buffering
    soundcloud.addEventListener( 'onMediaBuffering', function( object, data ) {
      var wrapper = registry[object.api_getFlashId()];

      wrapper.dispatchEvent( 'progress' );

      if ( wrapper.readyState === 0 ) {
        wrapper.readyState = 3;
        wrapper.dispatchEvent( "readystatechange" );
      }
    });

    // Register events for when the flash player is done buffering
    soundcloud.addEventListener( 'onMediaDoneBuffering', function( object, data ) {
      var wrapper = registry[object.api_getFlashId()];
      wrapper.dispatchEvent( 'canplaythrough' );
    });

    // Register events for when the flash player has finished playing
    soundcloud.addEventListener( 'onMediaEnd', function( object, data ) {
      var wrapper = registry[object.api_getFlashId()];
      wrapper.paused = 1;
      //wrapper.pause();
      wrapper.dispatchEvent( 'ended' );
    });

    // Register events for when the flash player has seeked
    soundcloud.addEventListener( 'onMediaSeek', function( object, data ) {
      var wrapper = registry[object.api_getFlashId()];

      wrapper.setCurrentTime( object.api_getTrackPosition() );

      if ( wrapper.paused ) {
        wrapper.dispatchEvent( "timeupdate" );
      }
    });

    // Register events for when the flash player has errored
    soundcloud.addEventListener( 'onPlayerError', function( object, data ) {
      var wrapper = registry[object.api_getFlashId()];
      wrapper.dispatchEvent( 'error' );
    });
  });

  Popcorn.soundcloud = function( containerId, src, options ) {
    return new Popcorn.soundcloud.init( containerId, src, options );
  };

  // A constructor, but we need to wrap it to allow for "static" functions
  Popcorn.soundcloud.init = (function() {
    function pullFromContainer( that ) {
      var options = that._options,
          container = that._container,
          bounds = container.getBoundingClientRect(),
          tmp,
          undef;

      that.width = options.width || getStyle( container, "width" ) || "100%";
      that.height = options.height || getStyle( container, "height" ) || "81px";
      that.src = options.src;
      that.autoplay = options.autoplay;

      if ( parseFloat( that.height, 10 ) !== 81 ) {
        that.height = "81px";
      }

      that.offsetLeft = bounds.left;
      that.offsetTop = bounds.top;
      that.offsetHeight = parseFloat( that.height, 10 );
      that.offsetWidth = parseFloat( that.width, 10 );

      // Width and height may've been specified as a %, find the value now in case a plugin needs it (like subtitle)
      if ( /[\d]+%/.test( that.width ) ) {
        tmp = getStyle( container, "width" );
        that._container.style.width = that.width;
        that.offsetWidth = that._container.offsetWidth;
        that._container.style.width = tmp;
      }

      if ( /[\d]+%/.test( that.height ) ) {
        tmp = getStyle( container, "height" );
        that._container.style.height = that.height;
        that.offsetHeight = that._container.offsetHeight;
        that._container.style.height = tmp;
      }
    }

    // If container id is not supplied, assumed to be same as player id
    var ctor = function ( containerId, src, options ) {
      if ( !containerId ) {
        throw "Must supply an id!";
      } else if ( !src ) {
        throw "Must supply a source!";
      } else if ( /file/.test( location.protocol ) ) {
        throw "Must run from a web server!";
      }

      var container = this._container = document.getElementById( containerId );

      if ( !container ) {
        throw "Could not find that container in the DOM!";
      }

      options = options || {};
      options.api = options.api || {};
      options.target = containerId;
      options.src = src;
      options.api.commentformat = options.api.commentformat || formatComment;

      this._mediaId = 0;
      this._listeners = {};
      this._playerId = Popcorn.guid( options.target );
      this._containerId = options.target;
      this._options = options;
      this._comments = [];
      this._popcorn = null;

      pullFromContainer( this );

      this.duration = 0;
      this.volume = 1;
      this.currentTime = 0;
      this.ended = 0;
      this.paused = 1;
      this.readyState = 0;
      this.playbackRate = 1;

      this.top = 0;
      this.left = 0;

      this.autoplay = null;
      this.played = 0;

      this.addEventListener( "load", function() {
        var boundRect = this.getBoundingClientRect();

        this.top = boundRect.top;
        this.left = boundRect.left;

        this.offsetWidth = this.swfObj.offsetWidth;
        this.offsetHeight = this.swfObj.offsetHeight;
        this.offsetLeft = this.swfObj.offsetLeft;
        this.offsetTop = this.swfObj.offsetTop;
      });

      registry[ this._playerId ] = this;
      isReady( this );
    };
    return ctor;
  })();

  Popcorn.soundcloud.init.prototype = Popcorn.soundcloud.prototype;

  // Sequence object prototype
  Popcorn.extend( Popcorn.soundcloud.prototype, {
    // Set the volume as a value between 0 and 1
    setVolume: function( val ) {
      if ( !val && val !== 0 ) {
        return;
      }

      // Normalize in case outside range of expected values of 0 .. 1
      if ( val < 0 ) {
        val = -val;
      }

      if ( val > 1 ) {
        val %= 1;
      }

      // HTML video expects to be 0.0 -> 1.0, Flash object expects 0-100
      this.volume = this.previousVolume = val;
      this.swfObj.api_setVolume( val*100 );
      this.dispatchEvent( "volumechange" );
    },
    // Seeks the video
    setCurrentTime: function ( time ) {
      if ( !time && time !== 0 ) {
        return;
      }

      this.currentTime = this.previousCurrentTime = time;
      this.ended = time >= this.duration;

      // Fire events for seeking and time change
      this.dispatchEvent( "seeked" );
    },
    // Play the video
    play: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.play );
        return;
      } else if ( !this.paused ) {
        // No need to process if already playing
        return;
      }

      this.paused = 0;
      this.swfObj.api_play();
    },
    // Pause the video
    pause: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.pause );
        return;
      } else if ( this.paused ) {
        // No need to process if already playing
        return;
      }

      this.paused = 1;
      this.swfObj.api_pause();
    },
    // Toggle video muting
    // Unmuting will leave it at the old value
    mute: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.mute );
        return;
      }

      if ( !this.muted() ) {
        this.oldVol = this.volume;

        if ( this.paused ) {
          this.setVolume( 0 );
        } else {
          this.volume = 0;
        }
      } else {
        if ( this.paused ) {
          this.setVolume( this.oldVol );
        } else {
          this.volume = this.oldVol;
        }
      }
    },
    muted: function() {
      return this.volume === 0;
    },
    // Force loading by playing the player. Pause afterwards
    load: function() {
      // In case someone is cheeky enough to try this before loaded
      if ( !this.swfObj ) {
        this.addEventListener( "load", this.load );
        return;
      }

      this.play();
      this.pause();
    },
    // Hook an event listener for the player event into internal event system
    // Stick to HTML conventions of add event listener and keep lowercase, without prepending "on"
    addEventListener: function( evt, fn ) {
      if ( !this._listeners[evt] ) {
        this._listeners[evt] = [];
      }

      this._listeners[evt].push( fn );
      return fn;
    },
    dispatchEvent: function( evt ) {
      var self = this,
          evtName = evt.type || evt;

      // Manually triggered a UI event, have it invoke rather than just the event handlers
      if ( evtName === "play" && this.paused || evtName === "pause" && !this.paused ) {
        this[evtName]();
        return;
      }

      Popcorn.forEach( this._listeners[evtName], function( fn ) {
        fn.call( self );
      });
    },
    timeupdate: function() {
      var self = this,
          checkedVolume = this.swfObj.api_getVolume()/100,
          seeked = 0;

      // If has been changed through setting currentTime attribute
      if ( abs( this.currentTime - this.previousCurrentTime ) > timeCheckInterval ) {
        // Has programatically set the currentTime
        this.swfObj.api_seekTo( this.currentTime );
        seeked = 1;
      } else {
        this.previousCurrentTime = this.currentTime = this.swfObj.api_getTrackPosition();
      }

      // If has been changed throughh volume attribute
      if ( checkedVolume !== this.previousVolume ) {
        this.setVolume( checkedVolume );
      } else if ( this.volume !== this.previousVolume ) {
        this.setVolume( this.volume );
      }

      if ( !this.paused ) {
        this.dispatchEvent( 'timeupdate' );
      }

      if( !self.ended ) {
        setTimeout( function() {
          self.timeupdate.call( self );
        }, timeupdateInterval);
      }
    },

    getBoundingClientRect: function() {
      var b,
          self = this;

      if ( this.swfObj ) {
        b = this.swfObj.getBoundingClientRect();

        return {
          bottom: b.bottom,
          left: b.left,
          right: b.right,
          top: b.top,

          //  These not guaranteed to be in there
          width: b.width || ( b.right - b.left ),
          height: b.height || ( b.bottom - b.top )
        };
      } else {
        //container = document.getElementById( this.playerId );
        tmp = this._container.getBoundingClientRect();

        // Update bottom, right for expected values once the container loads
        return {
          left: tmp.left,
          top: tmp.top,
          width: self.offsetWidth,
          height: self.offsetHeight,
          bottom: tmp.top + this.width,
          right: tmp.top + this.height
        };
      }
    },

    registerPopcornWithPlayer: function( popcorn ) {
      if ( !this.swfObj ) {
        this.addEventListener( "load", function() {
          this.registerPopcornWithPlayer( popcorn );
        });
        return;
      }

      this._popcorn = popcorn;

      var api = this._options.api;

      if ( api.key && api.commentdiv ) {
        var self = this;

        Popcorn.xhr({
          url: "http://api.soundcloud.com/tracks/" + self._mediaId + "/comments.js?consumer_key=" + api.key,
          success: function( data ) {
            Popcorn.forEach( data.json, function ( obj ) {
              self.addComment({
                start: obj.timestamp/1000,
                date: new Date( obj.created_at ),
                text: obj.body,
                user: {
                  name: obj.user.username,
                  profile: obj.user.permalink_url,
                  avatar: obj.user.avatar_url
                }
              });
            });
          }
        });
      }
    }
  });

  Popcorn.extend( Popcorn.soundcloud.prototype, {
    addComment: function( obj, displayFn ) {
      var self = this,
          comment = {
            start: obj.start || 0,
            date: obj.date || new Date(),
            text: obj.text || "",
            user: {
              name: obj.user.name || "",
              profile: obj.user.profile || "",
              avatar: obj.user.avatar || ""
            },
            display: function() {
              return ( displayFn || self._options.api.commentformat )( comment );
            }
          };

      this._comments.push( comment );

      if ( !this._popcorn ) {
        return;
      }

      this._popcorn.subtitle({
        start: comment.start,
        target: this._options.api.commentdiv,
        display: 'inline',
        language: 'en',
        text: comment.display()
      });
    }
  });
})( Popcorn, window );
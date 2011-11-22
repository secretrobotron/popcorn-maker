(function(window) {
  //<script src="http://code.jquery.com/jquery-1.5.js"></script>
  //<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.js"></script>

  var Logger = function( name ) {

    this.log = function( message ) {
      console.log( "[" + name + "] " + message );
    }; //log

    this.error = function( message ) {
      throw new Error( "[" + name + "]" + message ); 
    }; //error

  }; //Logger

  var EventManager = function( emOptions ) {

    var emOptions = emOptions || {}
        listeners = {},
        related = {},
        id = "EventManager" + EventManager.guid++,
        logger = emOptions.logger || new Logger( id ),
        targetName = id,
        that = this;
    
    this.listen = function( type, listener, relatedObject ) {
      if ( type && listener ) {
        if ( !listeners[ type ] ) {
          listeners[ type ] = [];
        } //if
        listeners[ type ].push( listener );
        if ( relatedObject ) {
          if ( !related[ relatedObject ] ) {
            related[ relatedObject ] = [];
          } //if
          related[ relatedObject ].push( listener );
        } //if
      }
      else {
        logger.error( "type and listener required to listen for event." );
      } //if
    }; //listen

    this.unlisten = function( type, listener ) {
      if ( type && listener ) {
        var theseListeners = listeners[ type ];
        if ( theseListeners ) {
          var idx = theseListeners.indexOf( listener );
          if ( idx > -1 ) {
            theseListeners.splice( idx, 1 );
          } //if
        } //if
      }
      else if ( type ) {
        if ( listeners[ type ] ) {
          listeners[ type ] = [];
        } //if
      }
      else {
        logger.error( "type and listener required to unlisten for event" );
      } //if
    }; //unlisten

    this.unlistenByType = function( type, relatedObject ) {
      var relatedListeners = related[ relatedObject ];
      for ( var i=0, l=relatedListeners; i<l; ++i ) {
        that.unlisten( type, relatedListeners[ i ] );
      } //for
      delete related[ relatedObject ];
    }; //unlistenByType

    this.dispatch = function( type, data, tempTarget ) {
      if ( type ) {
        var theseListeners = listeners[ type ];
        if ( theseListeners ) {
          var e = {
            target: tempTarget || targetName,
            type: type,
            data: data
          };
          for ( var i=0, l=theseListeners.length; i<l; ++i ) {
            theseListeners[ i ]( e );
          } //for
        } //if
      }
      else {
        logger.error( "type required to dispatch event" );
      } //if
    }; //dispatch

    this.apply = function( name, to ) {
      to.listen = that.listen;
      to.unlisten = that.unlisten;
      to.dispatch = that.dispatch;
      targetName = name;
    }; //apply

    this.repeat = function( e ) {
      that.dispatch( e.type, e.data, e.target );
    }; //repeat

  }; //EventManager
  EventManager.guid = 0;

  //var plugins = {};

  /*function addPlugin ( name, def ) {
    def.setup = def.setup || function (){};
    def.moved = def.moved || function (){};
    def.click = def.click || function (){};
    def.dblclick = def.dblclick || function (){};
    def.select = def.select || function (){};
    def.deselect = def.deselect || function (){};
    def.trackMoved = def.trackMoved || function (){};
    if ( name ) {
      plugins[name] = def;
    } //if
  } //addPlugin*/

  var TrackLiner = this.TrackLiner = function( options ) {

    var tracks = {},
        trackCount = 0,
        eventCount = 0,
        userElement,
        dynamicTrackCreation = options.dynamicTrackCreation,
        duration = options && options.duration ? options.duration : 1,
        scale = options && options.scale ? options.scale : 1,
        parent = document.createElement( "div" ),
        container = document.createElement( "div" ),
        self = this;

    var eventManager = new EventManager();
    eventManager.apply( "trackLiner", this );

    if ( this !== window ) {

      if ( typeof(options) === 'string' ) {
        userElement = document.getElementById(options);
      }
      else {
        userElement = document.getElementById(options.element) || options.element;
      } //if

      userElement.appendChild( parent );
      parent.style.height = "100%";
      parent.appendChild( container );

      $( container ).sortable( { containment: "parent", tolerance: 'pointer', update: function( event, ui ) {

        //var type = ui.item[ 0 ].type;

        //plugins[ type ].trackMoved( self.getTrack( ui.item[ 0 ].id ), ui.item.index() );
        eventManager.dispatch( "trackupdated", {track: self.getTrack( ui.item[ 0 ].id ), index: ui.item.index() } );
      } } ).droppable( { greedy: true } );

      $( parent ).droppable({
        // this is dropping an event on empty space
        drop: function( event, ui ) {
  
          if ( dynamicTrackCreation && ui.draggable[ 0 ].className.indexOf( "ui-draggable" ) > -1 ) {
  
            var eventId = ui.draggable[ 0 ].id,
                //type = ui.draggable[ 0 ].getAttribute('data-trackliner-type'),
                parentId = ui.draggable[ 0 ].parentNode.id,
                //newTrack = self.createTrack( undefined, type );
                newTrack = self.createTrack();

            if ( self.getTrack( parentId ) ) {

              newTrack.addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
            } else {

              var clientRects = parent.getClientRects();
              //newTrack.createTrackEvent( type, { left: (event.clientX - clientRects[0].left)/scale }, event, ui );
              
              eventManager.dispatch( "trackeventdropped", {track: newTrack, trackEvent: { left: (event.clientX - clientRects[0].left)/scale }, event: event, ui: ui} );
            } //if

          } //if
        }
      });

      this.clear = function () {
        while ( container.children.length ) {
          container.removeChild( container.children[0] );
        } //while
        tracks = [];
        trackCount = 0;
        eventCount = 0;
      };

      this.createTrack = function( name ) {

        //index = ~index || ~trackArray.length;
        var track = new Track(),
            element = track.getElement();
        
        container.appendChild( element );

        if ( name ) {
          var titleElement = document.createElement('span');
          titleElement.style.postion = 'absolute';
          titleElement.style.left = '5px';
          titleElement.style.top = '50%';
          titleElement.innerHTML = name;
          titleElement.className = 'track-title';
          
          element.appendChild( titleElement );
        } //if

        //element.type = type;

        tracks[ track.getElement().id ] = track;//.splice( ~index, 0, track );
        return track;
      };

      this.getTracks = function () {

        return tracks;
      };

      this.getTrack = function( id ) {

        return tracks[ id ];
      };

      this.addTrack = function( track ) {

        container.appendChild( track.getElement() );
        tracks[ track.getElement().id ] = track;
      };

      this.removeTrack = function( track ) {

        container.removeChild( track.getElement() );
        delete tracks[ track.getElement().id ];
        return track;
      };

      this.deselectOthers = function() {
        for (var j in tracks) {
          var events = tracks[j].getTrackEvents();
          for (var i in events) {
            if (events[i].selected) {
              events[i].deselect();
            } //if
          } //for
        } //for
        return self;
      };

      this.setScale = function ( scale ) {
        userElement.style.width = userElement.style.width || duration * scale + "px";
        userElement.style.minWidth = duration * scale + "px";
      };

      this.setScale(scale);

      var Track = function(inc) {

        var trackId = "trackLiner" + trackCount++,
            events = {},
            that = this,
            element = document.createElement( "div" );

        element.className = 'trackliner-track';
        element.id = trackId;

        $( element ).droppable( { 
          greedy: true,

          // this is dropping an event on a track
          drop: function( event, ui ) {

            var eventId = ui.draggable[ 0 ].id,
                trackId = this.id,
                //type = ui.draggable[ 0 ].getAttribute('data-trackliner-type'),
                parentId = ui.draggable[ 0 ].parentNode.id;

            if ( self.getTrack( parentId ) ) {

              that.addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
            }
            else {

              //if ( type && plugins[ type ]) {
                var clientRects = parent.getClientRects();
                //that.createTrackEvent( type, { left: (event.clientX - clientRects[0].left)/scale }, event, ui );
                //that.createTrackEvent( type, { left: (event.clientX - clientRects[0].left)/scale }, event, ui );
                eventManager.dispatch( "trackeventdropped", {track: that, trackEvent: { left: (event.clientX - clientRects[0].left)/scale }, event: event, ui: ui} );
              //} //if

            } //if
          }
        });

        this.getElement = function() {
          return element;
        };

        this.createEventElement = function ( options ) {
          var element = document.createElement('div');

          // set options if they exist
          options.cursor && (element.style.cursor = options.cursor);
          options.background && (element.style.background = options.background);
          options.opacity && (element.style.opacity = options.opacity);
          options.height && (element.style.height = options.height);
          options.width && (element.style.width = options.width*scale + "px");
          options.position && (element.style.position = options.position);
          options.top && (element.style.top = options.top);
          options.left && (element.style.left = options.left*scale + "px");
          options.innerHTML && (element.innerHTML = options.innerHTML);
          element.style.position = options.position ? options.position : 'absolute';
          // add css options if they exist
          if ( options.css ) {
            $(element).css( options.css );
          } //if

          element.className = 'trackliner-event';

          if (options.classes) {
            for ( var i=0; i<options.classes.length; ++i) {
              $(element).addClass(options.classes[i]);
            } //for
          } //if
          return element;
        } //createEventElement

        //this.createTrackEvent = function( type, inputOptions, event, ui ) {
        this.createTrackEvent = function( inputOptions, event, ui ) {

          var trackEvent = {},
              eventId = "trackEvent" + eventCount++;
              //inputOptions = typeof(type) === 'string' ? inputOptions : type,
              //type = typeof(type) === 'string' ? type : (restrictToKnownPlugins ? undefined : 'default'),
              //pluginDef = plugins[ type ];
              
          //if (pluginDef) {

            //var trackOptions = plugins[ type ].setup( that, inputOptions, event, ui );
            eventManager.dispatch( "trackeventcreated", { track: that, trackEvent: inputOptions, event: event, ui: ui } );
console.log( inputOptions );
            var trackOptions = inputOptions;

            if (trackOptions) {
              trackEvent.start = inputOptions.left || 0;
              trackEvent.end = inputOptions.width || 0;
              trackEvent.end += trackEvent.start;

              var movedCallback = function( event, ui ) {
                var eventElement = trackEvent.element,
                    track = self.getTrack( this.parentNode.id );
                eventElement.style.top = "0px";
                trackEvent.start = $(eventElement).offset().left;
                trackEvent.end = $(eventElement).width() + trackEvent.start;
                trackEvent.start /= scale;
                trackEvent.end /= scale;

                eventManager.dispatch( "trackeventupdated", { track: track, trackEvent: trackEvent, event: event, ui: ui } );
                //pluginDef.moved( track, trackEvent, event, ui );
              };

              trackEvent.options = inputOptions;
              //trackEvent.pluginOptions = trackOptions;
console.log( trackOptions );
              trackEvent.element = trackOptions.element || this.createEventElement ( trackOptions );
              trackEvent.element.id = eventId;
              trackEvent.element.addEventListener('click', function (e) {
                eventManager.dispatch( "trackeventclicked", { track: self.getTrack( this.parentNode.id ), trackEvent: trackEvent, event: e});
                //pluginDef.click( self.getTrack( this.parentNode.id ), trackEvent, e );
              }, false);
              trackEvent.element.addEventListener('dblclick', function (e) {
                eventManager.dispatch( "trackeventdoubleclicked", { track: self.getTrack( this.parentNode.id ), trackEvent: trackEvent, event: e});
                //pluginDef.dblclick( self.getTrack( this.parentNode.id ), trackEvent, e );
              }, false);
              //trackEvent.type = type;
              //trackEvent.element = element;

              trackEvent.selected = false;
              trackEvent.select = function (e) {
                self.deselectOthers();
                trackEvent.selected = true;
                eventManager.dispatch( "trackeventselecteded", { track: that, trackEvent: trackEvent } );
                //plugins[ type ].select(that, trackEvent, null);
              };

              trackEvent.deselect = function (e) {
                trackEvent.selected = false;
                eventManager.dispatch( "trackeventdeselecteded", { track: that, trackEvent: trackEvent } );
                //plugins[ type ].deselect(that, trackEvent, null);
              };

              $( trackEvent.element ).draggable( { /*grid: [ 1, 36 ],*/ containment: parent, zIndex: 9001, scroll: true,
                // this is when an event stops being dragged
                start: function ( event, ui ) {
                },
                stop: movedCallback
              }).resizable({ 
                autoHide: true, 
                containment: "parent", 
                handles: 'e, w', 
                scroll: false,
                stop: movedCallback
              });

              return this.addTrackEvent( trackEvent );
            } //if
          //} //if
        };

        this.addTrackEvent = function( trackEvent ) {

          events[ trackEvent.element.id ] = trackEvent;
          element.appendChild( trackEvent.element );
          trackEvent.trackId = trackId;
          //eventManager.dispatch( "trackeventcreated", trackEvent );
          return trackEvent;
        };

        this.getTrackEvent = function( id ) {
          return events[ id ];
        };

        this.getTrackEvents = function () {
          return events;
        };

        this.removeTrackEvent = function( id ) {

          var trackEvent = events[ id ];
          delete events[ id ];
          element.removeChild( trackEvent.element );
          eventManager.dispatch( "trackeventremoved", trackEvent );
          return trackEvent;
        };
        
        /*this.length = function() {

          return eventArray.length;
        };*/

        this.toString = this.id = function() {

          return trackId;
        };

      };

      /*this.length = function() {

        return trackArray.length;
      };*/

      return this;

    } //if (this !== window)

  }; //TrackLiner

  /*TrackLiner.plugin = addPlugin;

  window.TrackLiner = TrackLiner;

  TrackLiner.plugin( 'default', {
    setup: function ( track, options, event, ui ) {
      var left = options.left || options.x || options.start || 0;
      var width = options.width || options.end ? options.end - left : 1;
      return {
        left: left,
        width: width,
        innerHTML: options.label || '',
        classes: options.classes || '',
        css: options.css
      };
    },
    moved: function (track, trackEventObj, event, ui) {
    },
    click: function (track, trackEventObj, event) {
      trackEventObj.select();
    },
    dblclick: function (track, trackEventObj, event) {
    },
    select: function (track, trackEventObj, event) {
      $(trackEventObj.element).addClass('trackliner-event-selected');
    },
    deselect: function (track, trackEventObj, event) {
      $(trackEventObj.element).removeClass('trackliner-event-selected');
    }
  });*/

}(window));


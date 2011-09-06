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


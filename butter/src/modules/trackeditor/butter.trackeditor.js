(function() {

  var target = document.createElement( "div" ),
      b = {},
      display,
      currentTrack;

  Butter.registerModule( "trackeditor", function( options ) {
    //setup: function( options ) {

      // target is the div that contains the editor
      target = document.getElementById( options.target ) || options.target;
      b = this;
      display = target.style.display;

      target.style.display = "none";

      b.listen( "trackremoved", function( event ) {

        if ( currentTrack && event.data.getId() === currentTrack.getId() ) {

          b.closeEditTrack();
        }
      });
    //},
    //extend: {
      // displays the editor div
      // sets focus on the track being requested edit
      this.openEditTrack = function( track ) {

        target.style.display = display;
        currentTrack = track;
      };
      // returns the track that is currently being editied
      this.getEditTrack = function() {

        return currentTrack;
      };
      // hides the editor div
      this.closeEditTrack = function() {

        currentTrack = null;
        display = target.style.display;
        target.style.display = "none";
      };
      // deletes the track
      // this will also distroy all events on it
      this.deleteTrack = function() {

        b.removeTrack && b.removeTrack( currentTrack );
      };
      // destroys all events on the track
      this.clearTrack = function() {

        var trackEvents = currentTrack.getTrackEvents();

        while ( trackEvents.length ) {

          b.removeTrackEvent( currentTrack, trackEvents[ 0 ] );
        }
      };
      // gets a string of JSON containing the track
      this.getTrackJSON = function() {

        var trackEvents = currentTrack.getTrackEvents(),
            returnArray = [];

        for ( var i = 0, l = trackEvents.length; i < l; i++ ) {

          returnArray.push( JSON.stringify( { type: trackEvents[ i ].type, options: trackEvents[ i ].popcornOptions } ) );
        }

        return "[" + returnArray + "]";
      };
      // clears the track of all events
      // parses data into events
      this.setTrackJSON = function( data ) {

        newArray = JSON.parse( data );
        b.clearTrack();

        for ( var i = 0, l = newArray.length; i < l; i++ ) {

          b.addTrackEvent( currentTrack, new Butter.TrackEvent({ popcornOptions: newArray[ i ].options, type: newArray[ i ].type }) )
        }
      };
      // sets the current track's target
      // triggers a track updated
      this.setTrackTarget = function( target ) {

        currentTrack.target = target;
        b.trigger( "trackupdated", currentTrack, "trackeditor" );
      };
    //}
  });
}());


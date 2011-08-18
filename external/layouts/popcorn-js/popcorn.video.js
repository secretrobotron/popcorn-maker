// PLUGIN: VIDEO

(function (Popcorn) {

  Popcorn.plugin( "spawnvideo", {
      manifest: {
        about:{
          name: "Popcorn video Plugin",
          version: "0.1",
          author: "Bobby Richter",
        },
        options: {
          start: {
            elem: "input",
            type: "number",
            label: "In"
          },
          end: {
            elem: "input",
            type: "number",
            label: "Out"
          },
          src: {
            elem: "input", 
            type: "text",   
            label: "Source URL"
          },
          videoOptions: {
            elem: "input",
            type: "text",
            label: "Video Tag Options"
          },
          target: {
            elem: "input", 
            type: "text",   
            label: "Target"
          },
        }
      },
      _setup: function( options ) {
        var video = document.createElement( "video" );
        if ( options.src ) {
          var src = document.createElement( "src" );
          video.appendChild( src );
        }
        options.video = video;
      },

      start: function( event, options ) {
        options.video.style.display = "block";
      },

      end: function( event, options ) {
        options.video.style.display = "none";
      },

      _teardown: function( options ) {
        if ( document.getElementById( options.target ) ) {
          document.getElementById( options.target ).removeChild( options.video );
        }
      }
  });
})( Popcorn );

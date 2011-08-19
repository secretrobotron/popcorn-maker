// PLUGIN: VIDEO

(function (Popcorn) {

  var videoOptionsRegex = /(\w+)="([\w\%]*)"/;

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
            label: "Video Tag Options",
            default: 'controls="true" width="300" height="200" autobuffer="true" preload="auto"'
          },
          target: "video-container"
        }
      },
      _setup: function( options ) {
        if ( options.target ) {
          var targetElement = document.getElementById( options.target );
          if ( targetElement ) {
            var video = document.createElement( "video" );
            if ( options.src ) {
              var src = document.createElement( "source" );
              src.src = options.src;
              video.appendChild( src );
            }
            options.video = video;
            targetElement.appendChild( video );
            options.video.style.display = "none";
            if ( options.videoOptions ) {
              var splitOptions = options.videoOptions.split(" ");
              for ( var opt in splitOptions ) {
                var matches = splitOptions[opt].match( videoOptionsRegex ),
                    attr = matches[1],
                    val = matches[2];
                video.setAttribute( attr, val );
              } //for
            } //if
          } //if
        } //if
      }, //setup

      start: function( event, options ) {
        if ( options.video ) {
          document.getElementById( options.target ).style.backgroundColor = "black";
          options.video.style.display = "block";
          options.video.play();
        }
      },

      end: function( event, options ) {
        if ( options.video ) {
          document.getElementById( options.target ).style.backgroundColor = "";
          options.video.style.display = "none";
          options.video.pause();
        }
      },

      _teardown: function( options ) {
        if ( options.target && document.getElementById( options.target ) ) {
          document.getElementById( options.target ).removeChild( options.video );
        }
      }
  });
})( Popcorn );

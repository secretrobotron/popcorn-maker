(function () {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

    var Media = function ( mediaData ) {
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
          comm.send( "paused", "log" );
          comm.send( that.id, "mediapaused" );
        }, false);
        that.popcorn.media.addEventListener( "playing", function() {
          comm.send( "playing", "log" );
          comm.send( that.id, "mediaplaying" );
        }, false);
      }; //setupPopcornHandlers

      this.prepareMedia = function( type, link ) {
        if ( type === "object" ) {
          var mediaElement = document.getElementById( that.target );
          if (  !mediaElement || [ 'AUDIO', 'VIDEO' ].indexOf( mediaElement.nodeName ) === -1 ) {
            var video = document.createElement( "video" ),
                src = document.createElement( "source" );
            link.attachLoadFailListener( src );

            src.src = that.url;
            video.style.width = document.getElementById( that.target ).style.width;
            video.style.height = document.getElementById( that.target ).style.height;
            video.appendChild( src );
            video.controls = true;
            if ( !video.id || video.id === "" ) {
              video.id = "butter-media-element-" + that.id;
            }
            video.setAttribute( "autobuffer", "true" );
            video.setAttribute( "preload", "auto" );

            document.getElementById( that.target ).appendChild( video );
            that.mediaElement = video;
            return video;
          }
          else {
            if ( !mediaElement.id || mediaElement.id === "" ) {
              mediaElement.id = "butter-media-element-" + that.id;
            } //if
            that.mediaElement = mediaElement;
            mediaElement.pause();
            mediaElement.src = "";
            while ( mediaElement.firstChild ) {
              mediaElement.removeChild( mediaElement.firstChild );
            } //while
            mediaElement.removeAttribute( "src" );
            link.attachLoadFailListener( mediaElement );
            mediaElement.src = that.url;
            mediaElement.load();
            //}
            return mediaElement;
          } //if
        }
      }; //prepareMedia

      function findNode( id, rootNode ) {
        var children = rootNode.childNodes;
        for ( var i=0, l=children.length; i<l; ++i ) {
          if ( children[ i ].id === id ) {
            return children [ i ];
          }
          else {
            var node = findNode( id, children[ i ] );
            if ( node ) {
              return node;
            } //if
          } //if
        } //for
      } //findNode

      this.alterMediaHTML = function( rootNode ) {
        var targetElement = findNode( that.target, rootNode );
        if ( that.type === "object" ) {
          var parentNode = targetElement.parentNode,
              newNode = document.getElementById( that.target ).cloneNode( true );
          parentNode.removeChild( targetElement );
          parentNode.appendChild( newNode );
        } //if
      }; //getMediaHTML

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
              that.url + "'" + popcornOptions + " );\n";
          },
          "vimeo": function() {
            return "var popcorn = Popcorn.vimeo( '" + that.target + "', '" +
            that.url + "'" + popcornOptions + " );\n";
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
                  popcornString += "\n" + option + ":'" + trackEvents[ i ][ option ] + "',";
                } //if
              } //for
              if ( popcornString[ popcornString.length - 1 ] === "," ) {
                popcornString = popcornString.substring( 0, popcornString.length - 1 );
              } //if
              popcornString += "});\n";
            } //for trackEvents
          } //if trackEvents
        } //if popcorn

        var method = options.method || "inline";

        if ( method === "event" ) {
          popcornString = "\ndocument.addEventListener('DOMContentLoaded',function(e){\n" + popcornString;
          popcornString += "\n},false);";
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
          that.popcorn.destroy();
          that.popcorn = undefined;
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
            comm.unlisten( name, handlers[ name ] );
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

    }; //Media

    return Media;

  }); //define

})();

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
            registry,
            that = this;

        function setup( iframeWindow ) {

          server.bindClientWindow( "link", iframeWindow, function( message ) {
          });
          
          that.play = function() {
            server.send( "link", "play", "controls" );
          }; //play

          Object.defineProperty( this, "isPlaying", {
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

          that.build = function( media, onready ) {
            function ready( message ) {
              registry = message.registry;
              onready && onready();
              server.forget( "link", "build", ready );
            } //ready
            server.listen( "link", "build", ready );
            server.send( "link", media.exportJSON(), "build" );
          }; //build

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

          server.listen( "link", "layoutloaded", function( message ) {
            butter.trigger( "layoutloaded", null );
            if ( onload ) {
              onload();
            } //if
          });
          server.listen( "link", "mediaready", function( message ) {
          });
          server.listen( "link", "mediapaused", function( message ) {
          });
          server.listen( "link", "mediaplaying", function( message ) {
          });
          server.listen( "link", "mediatimeupdate", function( message ) {
            butter.currentTime( message );
          });

          server.listen( "link", "addmedia", function( message ) {
            var media = butter.addMedia( message );
          });
          server.listen( "link", "addtarget", function( message ) {
            var target = butter.addTarget( message );
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

        Object.defineProperty( this, "registry", {
          get: function() {
            return registry;
          }
        });
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
            registry: link.registry
          };
        }
      });

      this.build = function( media, onready ) {
        link.build( media, onready );
      };

      this.play = function() {
        link.play();
      };

      this.isPlaying = function() {
        return link.isPlaying();
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


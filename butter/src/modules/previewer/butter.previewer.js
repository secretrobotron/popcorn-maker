(function (window, document, undefined, Butter) {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  Butter.prototype.Preview = function( options ) {
    var that = this;

    var target = document.getElementById( options.target );
    if ( !target ) {
      throw new Error( "Previewer target, " + options.target + " does not exist");
    }

    var popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js";

    function StandardLink() {
      var currentPopcorn,
          link = new Butter.Link();

      this.play = function() {
        currentPopcorn.media.play();
      };

      this.isPlaying = function() {
        return currentPopcorn.media.paused;
      };

      this.pause = function() {
        currentPopcorn.media.pause();
      };
      
      this.mute = function() {
        currentPopcorn.media.muted = !currentPopcorn.media.muted;
      };

      this.scrape = link.scrape;

    } //StandardLink

    function CommLink() {
      var commServer;     
    } //CommLink

    function loadIframe( iframe ) {
      function onLoad( e ) {
        link = new StandardLink();
        link.scrape( iframe, options.importData );
        iframe.removeEventListener( "load", onLoad, false ); 
      } //onLoad
      iframe.addEventListener( "load", onLoad, false ); 
    } //loadIfram

    if ( target.tagName === "DIV" ) {

      var rect = target.getClientRects()[ 0 ];

      var iframe = document.createElement( "IFRAME" );
      iframe.src = options.template;
      iframe.width = rect.width;
      iframe.height = rect.height;
      target.appendChild( iframe );

      loadIframe( iframe );

    }
    else if ( target.tagName === "IFRAME" ) {
      target.src = options.template;
      loadIframe( target );
    } // else

    Object.defineProperty( this. "independent", {
      get: function() {
        return !!( iframeWindow.Popcorn && iframeWindow.Butter );
      }
    });

    Object.defineProperty( this, "properties", {
      get: function() {
        return {
          independent: that.independent,
          target: options.target,
          template: options.template,
          registry: currentPopcorn ? currentPopcorn.registry : undefined
        };
      }
    });

    this.insertPopcorn = function() {
      var popcornSourceScript = iframeDocument.createElement( "script" );
      popcornSourceScript.src = popcornUrl;
      iframeDocument.head.appendChild( popcornSourceScript );
    };

    this.clearPopcorn = function() {
      while( iframeWindow.Popcorn && iframeWindow.Popcorn.instances.length > 0 ) {
        iframeWindow.removeInstance( iframeWindow.Popcorn.instances[ 0 ] );
      }     
    };

    this.destroyPopcorn = function() {
      iframeDocument.head.removeChild( popcornScript );
    };

    this.play = function() {
      this.link.play();
    };

    this.isPlaying = function() {
      return this.link.isPlaying();
    };

    this.pause = function() {
      this.link.pause();
    };
    
    this.mute = function() {
      this.link.mute();
    };


  }; //Preview

  Butter.previewer = function( options ) {
  };

})(window, document, undefined, Butter);


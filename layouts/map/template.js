(function() {

  var popcorn;

  function addTrackEvent(trackEvent) {
    var options = trackEvent.popcornOptions;

    if (trackEvent.type === 'map') {
    }

    if (typeof popcorn[ trackEvent.type ] === 'function') {
      popcorn[ trackEvent.type ]( trackEvent.popcornOptions );
    }
  }

  function prepareVideoPlayer(video) {
    /*
    VideoJS unfortunately checks for <source> elements
    in the video to validate that it can play, which is
    a bad idea on many levels. Butter removes any <source>
    elements and sets a single src attribute.

    In general, we should be using a different player, but
    for now, making this work by putting the source element
    back in place.
    */

    var source, src, i, re,
      types = ['webm', 'mp4', 'ogg'];

    if (typeof video === 'string') {
      video = document.getElementById(video);
    }

    if (!video) {
      return;
    }

    if (!video.children|| !video.children.length) {
      re = new RegExp('\\.(' + types.join('|') + ')$');
      source = document.createElement('source');
      source.setAttribute('src', video.src);
      src = re.exec(video.src);
      if (src && src.length > 1) {
        source.setAttribute('type', 'video/' + src[1]);
      }

      video.appendChild(source);

      for (i = 0; i < types.length; i++) {
        src = video.src.replace(re, '.' + types[i]);
        if (src !== video.src) {
          source = document.createElement('source');
          source.setAttribute('src', src);
          source.setAttribute('type', 'video/' + types[i]);
          video.appendChild(source);
        }
      }
    }

    var player = new VideoJS( video );
  }

  var butterMapping = [];

  ButterTemplate( function() {
    var template = new ButterTemplate.Custom({
      loadFromData: function( importData ) {
        var medias = importData.media;
        if ( medias ) {
          for ( var m=0; m<medias.length; ++m ) {
            var media = medias[ m ];
            popcorn = Popcorn( '#' + media.target, { frameAnimation: true } );
            prepareVideoPlayer(media.target);
            if ( media.tracks ) {
              for ( var t=0; t<media.tracks.length; ++t ) {
                var track = media.tracks[ t ];
                if ( track.trackEvents ) {
                  for ( var e=0; e<track.trackEvents.length; ++e ) {
                    var trackEvent = track.trackEvents[ e ];
                    addTrackEvent(trackEvent);
                  } //for trackEvents
                } //if trackEvents
              } //for tracks
            } //if tracks
          } //for medias
        } //if medias
      },
      onfetchhtml: function( e ) {
        return template.link.getHTML( e.data );
      },
      onmediaremoved: function( e ) {
        template.link.removeMedia( template.link.getMedia( e.data.id ) );
      },
      onmediatimeupdate: function( e ) {
        template.link.currentMedia.popcorn.currentTime( e.data );
      },
      onmediachanged: function( e ) {
        if ( template.link.currentMedia ) {
          template.link.removeMediaHandlers();
        }
        var currentMedia = template.link.currentMedia = template.link.getMedia( e.data.id );
        if ( currentMedia ) {
          template.link.addMediaHandlers({
            'trackeventadded': function( e ) {
              var media = template.link.currentMedia;
              addTrackEvent( e.data );
              butterMapping[ e.data.id ] = media.popcorn.getLastTrackEventId();
            },
            'trackeventupdated': function( e ) {
              var media = template.link.currentMedia;
              if ( butterMapping[ e.data.id ] ) {
                media.popcorn.removeTrackEvent( butterMapping[ e.data.id ] );
              }
              addTrackEvent( e.data );
              butterMapping[ e.data.id ] = media.popcorn.getLastTrackEventId();
            },
            'trackeventremoved': function( e ) {
              var media = template.link.currentMedia;
              if ( butterMapping[ e.data.id ] ) {
                media.popcorn.removeTrackEvent( butterMapping[ e.data.id ] );
              }
            },
            'play': currentMedia.play,
            'pause': currentMedia.pause,
            'mute': currentMedia.mute
          });
        }
      },
      onmediaadded: function( e ) {
        var link = template.link;
        if ( !link.getMedia( e.data.id ) ) {
          var media = new ButterTemplate.Media( e.data );
          link.addMedia( media );

          media.prepare({
            popcornOptions: {
              frameAnimation: true
            },
            success: function( successOptions ) {
              popcorn = successOptions.popcorn;
              link.setupPopcornHandlers();
              link.sendMedia( media );
            },
            timeout: function() {
              link.sendTimeoutError( media );
            },
            error: function( e ) {
              link.sendLoadError( e );
            }
          });

          prepareVideoPlayer( media.target );
        }
      },
      onsetup: function( options ) {
        template.link.scrape();
      }
    });

  });

})();


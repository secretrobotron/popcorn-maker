ButterTemplate(function() {
  //custom stuff for setting up Seriously
  var video, seriouslyEvents = 0, defaultSeriously, canvas;

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
    return player;
  }

  function setUpVideoSize(id) {
    var time = parseFloat(window.location.hash.substr(1));
    if (!isNaN(time) && time > 0 && time < video.duration) {
      video.currentTime = time;
    }

    //var videoJS = VideoJS.setup(video.id);
    var videoJS = prepareVideoPlayer(video.id);
    videoJS.width(940);
    videoJS.height(940 * video.videoHeight / video.videoWidth);

    var c, webgl = false;

    if (window.WebGLRenderingContext) {
      c = document.createElement('canvas');
      try {
        webgl = !!c.getContext('experimental-webgl');
      } catch (e) {
      }
    }

    canvas = document.getElementById('canvas');
    if (webgl) {
      video.style.visibility = 'hidden';
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      canvas.style.display = 'block';
      defaultSeriously = Seriously();
      defaultSeriously.target('canvas').source = video;
      if (!seriouslyEvents) {
        defaultSeriously.go();
      }
    } else {
      canvas.style.display = 'none';
      video.style.cssText = 'display: inline';
      videoJS.width(940);
      videoJS.height(940 * video.videoHeight / video.videoWidth);
    }
  }

  function updateSeriously() {
    if (defaultSeriously) {
      if (seriouslyEvents) {
        defaultSeriously.stop();
      } else {
        defaultSeriously.start();
      }
    }
  }

  function setUpSeriouslyEvent(options) {
    seriouslyEvents++;
    updateSeriously();
  }

  function teardownUpSeriouslyEvent(options) {
    seriouslyEvents--;
    updateSeriously();
  }

  var butterMapping = [];
  var template = new ButterTemplate.Custom({
    loadFromData: function( importData ) {
      var medias = importData.media;
      if ( medias ) {
        for ( var m=0; m<medias.length; ++m ) {
          var media = medias[ m ];
          video = document.getElementById(media.target);
          if (video.videoWidth) {
            setUpVideoSize();
          } else {
            video.addEventListener('loadedmetadata', setUpVideoSize, false);
          }

          popcorn = Popcorn( '#' + media.target, { frameAnimation: true } );
          if ( media.tracks ) {
            for ( var t=0; t<media.tracks.length; ++t ) {
              var track = media.tracks[ t ];
              if ( track.trackEvents ) {
                for ( var e=0; e<track.trackEvents.length; ++e ) {
                  var trackEvent = track.trackEvents[ e ];
                  if (trackEvent.type === 'key') {
                    trackEvent.popcornOptions.onSetup = setUpSeriouslyEvent;
                    trackEvent.popcornOptions.onTeardown = teardownUpSeriouslyEvent;
                  }
                  popcorn[ trackEvent.type ]( trackEvent.popcornOptions );
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
      video = document.getElementById('video');
      if (video.videoWidth) {
        setUpVideoSize();
      } else {
        video.addEventListener('loadedmetadata', setUpVideoSize, false);
      }

      if ( template.link.currentMedia ) {
        template.link.removeMediaHandlers();
      }
      var currentMedia = template.link.currentMedia = template.link.getMedia( e.data.id );
      if ( currentMedia ) {
        link.addMediaHandlers({
          'trackeventadded': function( e ) {
            var media = template.link.currentMedia;
            if (e.data.type === 'key') {
              e.data.popcornOptions.onSetup = setUpSeriouslyEvent;
              e.data.popcornOptions.onTeardown = teardownUpSeriouslyEvent;
            }
            media.popcorn[ e.data.type ]( e.data.popcornOptions );
            butterMapping[ e.data.id ] = media.popcorn.getLastTrackEventId();
          },
          'trackeventupdated': function( e ) {
            var media = template.link.currentMedia;
            if ( butterMapping[ e.data.id ] ) {
              media.popcorn.removeTrackEvent( butterMapping[ e.data.id ] );
            }
            if (e.data.type === 'key') {
              e.data.popcornOptions.onSetup = setUpSeriouslyEvent;
              e.data.popcornOptions.onTeardown = teardownUpSeriouslyEvent;
            }
            media.popcorn[ e.data.type ]( e.data.popcornOptions );
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
      }
    },
    onsetup: function( options ) {
      template.link.scrape();
    }
  });
});


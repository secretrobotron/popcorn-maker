ButterTemplate(function() {
  var butterMapping = [];
  var template = new ButterTemplate.Custom({
    loadFromData: function( importData ) {
      var medias = importData.media;
      if ( medias ) {
        for ( var m=0; m<medias.length; ++m ) {
          var media = medias[ m ],
            //todo: load media here
            popcorn = Popcorn( '#' + media.target, { frameAnimation: true } );
          if ( media.tracks ) {
            for ( var t=0; t<media.tracks.length; ++t ) {
              var track = media.tracks[ t ];
              if ( track.trackEvents ) {
                for ( var e=0; e<track.trackEvents.length; ++e ) {
                  var trackEvent = track.trackEvents[ e ];
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
      if ( template.link.currentMedia ) {
        template.link.currentMedia.removeHandlers( template.link.comm );
      }
      var currentMedia = template.link.currentMedia = template.link.getMedia( e.data.id );
      if ( currentMedia ) {
        currentMedia.addHandlers( template.link.comm, {
          'trackeventadded': function( e ) {
            var media = template.link.currentMedia;
            media.popcorn[ e.data.type ]( e.data.popcornOptions );
            butterMapping[ e.data.id ] = media.popcorn.getLastTrackEventId();
          },
          'trackeventupdated': function( e ) {
            var media = template.link.currentMedia;
            if ( butterMapping[ e.data.id ] ) {
              media.popcorn.removeTrackEvent( butterMapping[ e.data.id ] );
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
        link.createMediaTimeout();
        media.prepareMedia( media.findMediaType(), function( e ) {
          link.comm.send({
            message: "Error loading media.",
            context: "previewer::buildMedia::popcornIsReady",
            type: "media-loading",
            error: JSON.stringify( e )
          }, "error" );
        });
        media.createPopcorn( media.generatePopcornString({
          options: {
            frameAnimation: true
          }
        }) );
        media.waitForPopcorn( function( popcorn ) {
        media.setupPopcornHandlers( link.comm );
          link.sendMedia( media );
        });
      }
    },
    onsetup: function( options ) {
      template.link.scrape();
    }
  });
});


(function(){

  define( [], function() {

    var Preview = function( pm ) {

      var butter = pm.butter
          buttonManager = pm.buttonManager
          popupManager = pm.popupManager;

      var previewIframe = document.getElementById( 'main' ),
          header = document.getElementsByTagName( 'header' )[ 0 ];
      previewIframe.style.height = window.innerHeight - header.clientHeight - 15 + "px";

      // force the iframe's source to be nothing
      previewIframe.src = '';

      var failureState = false;

      pm.butter.listen( "previewerfail", function() {
        failureState = true;
        pm.toggleLoadingScreen( false );
        popupManager.hidePopups();
        popupManager.showPopup( "load-failed" );
      });

      var timedOutMedia;
      pm.butter.listen( "previewertimeout", function( e ) {
        if ( !failureState ) {
          pm.currentProject.mediaErrorState[ e.data.media.id ] = "timeout";
          timedOutMedia = e.data.media;
          pm.toggleLoadingScreen( false );
          popupManager.hidePopups();
          popupManager.showPopup( "load-timeout" );
        } //if
      });

      pm.butter.listen( "mediaadded", function( e ) {
        failureState = false;
      });

      pm.butter.listen( "mediacontentchanged", function( e ) {
        pm.currentProject.mediaErrorState = {};
        failureState = false;
      });

      pm.butter.listen( "mediaready", function( e ) {
        pm.currentProject.mediaErrorState = {};
        // can't use this because id has advanced :/
        //delete pm.currentProject.mediaErrorState[ e.data.id ];
        pm.state = "ready";
        failureState = false;
      });

      buttonManager.add( "retry-load", $( "#retry-load" ), {
        click: function() {
          popupManager.hidePopups();
          if ( !pm.currentProject.initialized ) {
            pm.destroyCurrentPreview();
          } //if
          if ( pm.state === "change-media" ) {
            popupManager.showPopup( "change-media" );
          }
          else {
            popupManager.showPopup( "add-project" );
          }
        }
      });

      buttonManager.add( "timeout-retry-load", $( "#timeout-retry-load" ), {
        click: function() {
          popupManager.hidePopups();
          if ( !pm.currentProject.initialized ) {
            pm.destroyCurrentPreview();
          } //if
          if ( pm.state === "change-media" ) {
            popupManager.showPopup( "change-media" );
          }
          else {
            popupManager.showPopup( "add-project" );
          }
        }
      });

      buttonManager.add( "timeout-keep-waiting", $( "#timeout-keep-waiting" ), {
        click: function() {
          pm.currentProject.preview.waitForMedia( timedOutMedia );
          delete timedOutMedia;
          popupManager.hidePopups();
          pm.toggleLoadingScreen( true );
        }
      });

    }; //Preview

    return Preview;

  }); //define

})();

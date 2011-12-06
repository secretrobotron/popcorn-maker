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

      pm.butter.listen( "previewerfail", function() {
        pm.toggleLoadingScreen( false );
        popupManager.showPopup( "load-failed" );
      });

      var timedOutMedia;
      pm.butter.listen( "previewertimeout", function( e ) {
        timedOutMedia = e.data;
        pm.toggleLoadingScreen( false );
        popupManager.showPopup( "load-timeout" );
      });

      buttonManager.add( "retry-load", $( "#retry-load" ), {
        click: function() {
          pm.destroyCurrentPreview();
          pm.toggleLoadingScreen( false );
          popupManager.hidePopups();
          popupManager.showPopup( "add-project" );
        }
      });

      buttonManager.add( "timeout-retry-load", $( "#timeout-retry-load" ), {
        click: function() {
          pm.destroyCurrentPreview();
          pm.toggleLoadingScreen( false );
          popupManager.hidePopups();
          popupManager.showPopup( "add-project" );
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

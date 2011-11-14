(function() {
  define( [], function() {
    var Editor = function( pm ) {

      var butter = pm.butter,
          popupManager = pm.popupManager;

      popupManager.addPopup( "editor", "#editor-popup" );
      popupManager.addPopup( "edit-target", "#edit-target-popup" );

      butter.listen( "clientdimsupdated", function( e ) {
        var size = e.data.size;
        if ( e.data.type === "window" ) {
          e.data.window.resizeTo( size.width, size.height );
        }
        else {
          popupManager.showPopup( "editor", {
            width: size.width,
            height: size.height
          });
          $('#butter-editor-iframe')
            .css("height", size.height + "px")
            .css("width", size.width + "px" );
            //.css( "margin-left", ( window.innerWidth / 2 ) - ( $("#butter-editor-iframe").width() / 2 ) );
        }
      });
      
      butter.listen ( "trackeditstarted", function( message ) {
        if ( message.data.type !== "window" ) {
          popupManager.showPopup( "editor" );
        }
      });

      butter.listen( "trackeditfailed", function( message ) {
        if ( message.data.type !== "window" ) {
          popupManager.hidePopup( "editor" );
          alert( "Failed to open editor. Check editor configurations." );
        }
      });
      
      butter.listen ( "trackeditclosed", function( message ) {
        if ( message.data.type !== "window" ) {
          popupManager.hidePopup( "editor" );
        }
      });
    };

    return Editor;

  }); //define

})();

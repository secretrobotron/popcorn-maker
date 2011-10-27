(function() {
  PopcornMaker.Editor = function( pm ) {

    var butter = pm.butter,
        popupManager = pm.popupManager;

    popupManager.addPopup( "editor", "#editor-popup" );
    popupManager.addPopup( "edit-target", "#edit-target-popup" );

    butter.listen( "clientdimsupdated", function( e ) {
      if ( e.data.type !== "window" ) {
        var size = e.data.size;
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
    
    butter.listen ( "trackeditclosed", function( message ) {
      if ( message.data.type !== "window" ) {
        popupManager.hidePopup( "editor" );
      }
    });
  };

})();

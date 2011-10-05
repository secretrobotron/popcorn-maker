(function() {
  PopcornMaker.Editor = function( pm ) {

    var butter = pm.butter,
        popupManager = pm.popupManager;

    popupManager.addPopup( "editor", "#editor-popup" );

    butter.listen( "clientdimsupdated", function( e ) {
      popupManager.showPopup( "editor", {
        width: e.data.width,
        height: e.data.height
      });
      $('#butter-editor-iframe')
        .css("height", e.data.height + "px")
        .css("width", e.data.width + "px" )
        .css( "margin-left", ( window.innerWidth / 2 ) - ( $("#butter-editor-iframe").width() / 2 ) );
    });
    
    butter.listen ( "trackeditstarted", function() {
      popupManager.hidePopup( "editor" );
    });
    
    butter.listen ( "trackeditclosed", function() {
      popupManager.hidePopup( "editor" );
    });
  };

})();

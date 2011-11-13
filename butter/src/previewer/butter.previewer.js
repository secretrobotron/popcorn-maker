(function () {

  require.config({
    baseUrl: "../../src"
  });

  define( [ "core/logger", "core/eventmanager", "comm/comm", "previewer/basic-link", "previewer/custom-link", "previewer/media" ], function( Logger, EventManager, Comm, BasicLink, CustomLink, Media ) {

    function processStartEvent( e, callback ) {
      var message = Comm.parseStartEvent( e, window );
      if ( message && message.type === "setup" ) {
        callback( message );
      } //if
    };

    function bootStrapper( e ) {
      processStartEvent( e, function ( message ) {
        window.removeEventListener( 'message', bootStrapper, false );
        var link = new BasicLink({
          defaultMedia: message.message.defaultMedia,
          importData: message.message.importData,
          popcornUrl: message.message.popcornUrl,
        });
      });
    } //bootStrapper

    window.ButterBootstrapper = bootStrapper;
    window.addEventListener( 'message', window.ButterBootstrapper, false );

    window.ButterBasicLink = BasicLink;
    window.ButterCustomLink = CustomLink;
    window.ButterMedia = Media;

  }); //define

})();

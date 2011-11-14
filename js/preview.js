(function(){

  define( [], function() {

    var Preview = function( pm ) {

      var butter = pm.butter;

      var previewIframe = document.getElementById( 'main' ),
          header = document.getElementsByTagName( 'header' )[ 0 ];
      previewIframe.style.height = window.innerHeight - header.clientHeight - 15 + "px";

      // force the iframe's source to be nothing
      previewIframe.src = '';

    }; //Preview

    return Preview;

  }); //define

})();

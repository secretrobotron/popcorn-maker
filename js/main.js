(function() {

  var rctx = require.config({
    baseUrl: "js",
    paths: {
      context: "popcorn-maker"
    }
  });

  rctx( [ "external" ], function() {

    rctx( [ "popcorn-maker" ], function( PopcornMaker ) {

      var pm = new PopcornMaker();

      $(function() {
        $( ".draggable" ).draggable();
      });

      var d = {
        links: {
          position: {
            at: "top right",
            my: "bottom left",
            viewport: $(window)
          }
        },
      },
      c = $("#contentheader");

      $('a[title!=""]', c).qtip(d.links);

      $(window).bind("beforeunload", function( event ) {
        return "Are you sure you want to leave Popcorn Maker?";
      });

      $(window).keypress( function( event ) {
        var elem = event.srcElement || event.target;
        if ( (event.which === 46 || event.which === 8) &&
             (elem.nodeName !== "INPUT" && elem.nodeName !== "TEXTAREA") ) {
          event.preventDefault();
        }
      });

    }); //require

  }); //require
})();

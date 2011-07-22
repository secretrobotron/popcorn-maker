(function(){

  window.addEventListener("DOMContentLoaded", function(){
    
    var b  = new Butter();

    b.eventeditor( { target: "butter-editor-div" } );

    b.previewer({
      layout: "layouts/default.html",
      target: "previewer-iframe",
      media: "http://robothaus.org/bugs/video/brendan1.ogv",
      callback: function() {
        b.buildPopcorn( "outerVideo" );
      }
    });
    
    b.timeline({ target: "butter-timeline-div", duration: 80.25 });
    
    new pluginTray({ target: "butter-plug-in-div", plugins: [ "footnote" ] })
  
    b.listen ( "edittrackevent", function() {
      overlay( "visible" );
      console.log("sdfsdf");
    });
    b.listen ( "trackeditcancelled", function() {
      overlay( "hidden" );
      console.log("sdfsdf");
    });
    b.listen ( "trackeditcomplete", function() {
      overlay( "hidden" );
      console.log("sdfsdf");
    });
    
  }, false);

  function overlay( style ) {
    el = document.getElementById( "overlay-div" );
    el.style.visibility = style;
  }
  
  function pluginTray( options ) {

    options = options || {};
    var container = document.getElementById( options.target ) || options.target;

    this.addPlugin = function( type ) {

      var pluginElement = document.createElement( "span" );
      pluginElement.innerHTML = type + " ";
      pluginElement.id = type;
      pluginElement.setAttribute( "data-trackliner-type", "butterapp" );
      $( pluginElement ).draggable({ helper: "clone", appendTo: "body", zIndex: 9001, revert: true, revertDuration: 0 });
      container.appendChild( pluginElement );
    };

    for ( var i = 0, l = options.plugins.length; i < l; i++ ) {

      this.addPlugin( options.plugins[ i ] );
    }
  };

})();


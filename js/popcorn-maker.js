(function(){

  window.addEventListener("DOMContentLoaded", function(){
    
    var b  = new Butter();

    b.eventeditor( { target: "butter-editor-div", defaultEditor: "lib/defaultEditor.html", editorWidth: "98%", editorHeight: "98%"  } );

    b.previewer({
      layout: "layouts/default.html",
      target: "previewer-iframe",
      media: "http://robothaus.org/bugs/video/brendan1.ogv",
      callback: function() {
        b.buildPopcorn( "outerVideo", function() {

          b.plugintray({ target: "butter-plug-in-div" });
          var registry = b.getRegistry();

          for( var i = 0, l = registry.length; i < l; i++ ) {
            b.addPlugin( { type: registry[ i ].type } );
          } 
        } );
      }
    });
    
    b.timeline({ target: "butter-timeline-div"});
  
    b.listen ( "trackeditstarted", function() {
      overlay( "visible" );
    });
    b.listen ( "trackeditclosed", function() {
      overlay( "hidden" );
    });
    
  }, false);

  function overlay( style ) {
    el = document.getElementById( "overlay-div" );
    el.style.visibility = style;
  }

})();


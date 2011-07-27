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

          var registry = b.getRegistry();
        } );
      }
    });
    
    b.plugintray({ target: "butter-plug-in-div" });
    b.addPlugin( { type: "footnote" } );
    b.addPlugin( { type: "twitter" } );
    b.addPlugin( { type: "webpage" } );
    b.addPlugin( { type: "subtitle" } );
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


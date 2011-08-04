(function(){

  window.addEventListener("DOMContentLoaded", function(){
    
    var b  = new Butter();

    b.eventeditor( { target: "popup-trackeditor", defaultEditor: "lib/defaultEditor.html", editorWidth: "98%", editorHeight: "98%"  } );

    b.previewer({
      layout: "layouts/default.html",
      target: "main",
      media: "http://robothaus.org/bugs/video/brendan1.ogv",
      callback: function() {
        b.buildPopcorn( b.getCurrentMedia() , function() {

          var registry = b.getRegistry();
        } );
      }
    });
    
    b.plugintray({ target: "plugin-tray" });
    b.addPlugin( { type: "footnote" } );
    b.addPlugin( { type: "twitter" } );
    b.addPlugin( { type: "webpage" } );
    b.addPlugin( { type: "subtitle" } );
    b.addPlugin( { type: "googlenews" } );
    
    b.timeline({ target: "timeline-div"});
    
  }, false);


})();


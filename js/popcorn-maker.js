(function(){

  var LAYOUTS_DIR = "./layouts",
      TEMPLATES_CONFIG = LAYOUTS_DIR + "/conf.json",
      PACKAGE_SERVER_ADDR = "http://localhost:8888";
  
  function PopcornMaker() {

    this.currentPreview = undefined;
    this.currentTemplate = undefined;

    Butter.Logger.logFunction = function( logMessage ) {
      console.log( "From Butter", logMessage );
    };
    var butter = new Butter();
  
    var templateManager = new TemplateManager({
          config: TEMPLATES_CONFIG,
          container: "layout-select",
          layoutsDir: LAYOUTS_DIR,
        }),
        popupManager = new PopupManager(),
        buttonManager = new ButtonManager();

    butter.comm();
    butter.eventeditor({ target: "editor-popup", defaultEditor: "lib/popcornMakerEditor.html" });
    butter.plugintray({ target: "plugin-tray", pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>' });
    butter.timeline({ target: "timeline-div" });
    butter.trackeditor({ target: "edit-target-popup" });
    butter.addCustomEditor( "external/layouts/city-slickers/editor.html", "slickers" );
    butter.addCustomEditor( "external/layouts/cgg/editor.html", "fkb" );
    butter.addCustomEditor( "external/layouts/blackpanthers/editor.html", "googlestreets" );
    butter.addCustomEditor( "layouts/knell/editors/editor-lumakey.html", "lumakey" );
    butter.addCustomEditor( "layouts/shared/editors/editor-words.html", "words" );
    butter.addCustomEditor( "layouts/knell/editors/editor-tweet-chapter.html", "tweetChapter" );
    butter.addCustomEditor( "layouts/knell/editors/editor-lightbox.html", "lightbox" );
    butter.addCustomEditor( "layouts/shared/editors/editor-pop.html", "pop" );
    butter.setProjectDetails("title", "Untitled Project" );
    butter.previewer({
      target: "main",
      popcornUrl: "../lib/popcorn-complete.js",
      butterUrl: Butter.getScriptLocation() + "butter.js"
    });

    //popupManager.addPopup( "captcha", "#captcha-popup" );
    popupManager.addPopup( "change-media", "#change-media-popup" );
    popupManager.addPopup( "edit-track", "#edit-track-popup" );
    popupManager.addPopup( "delete-track", "#delete-track-popup" );

    var loadingOverlay = $( "#loading-overlay" );
    loadingOverlay.hide();

    Object.defineProperty( this, "popupManager", { get: function() { return popupManager; } } );
    Object.defineProperty( this, "templateManager", { get: function() { return templateManager; } } );
    Object.defineProperty( this, "buttonManager", { get: function() { return buttonManager; } } );
    Object.defineProperty( this, "butter", { get: function() { return butter; } } );

    templateManager.init();
    popupManager.init();
    buttonManager.init();

    templateManager.buildList();

    var menu = new PopcornMaker.Menu( this ),
        timeline = new PopcornMaker.Timeline( this ),
        editor = new PopcornMaker.Editor( this ),
        preview = new PopcornMaker.Preview( this ),
        welcome = new PopcornMaker.Welcome( this );
 
    timeline.showTools(); 
    popupManager.hidePopups();
    popupManager.showPopup( "welcome" );

    function onKeyPress( event ) {
      var inc = event.shiftKey ? 1 : 0.1;

      if( event.keyCode === 39 ) {
        if ( butter.targettedEvent ) {
          butter.moveFrameRight( event );
        } else {
          butter.currentTime = butter.currentTime + inc;
        }
      }
      else if( event.keyCode === 37 ) {
        if ( butter.targettedEvent ) {
          butter.moveFrameLeft( event );
        } else {
          butter.currentTime = butter.currentTime - inc;
        }
      }
      else if ( event.charCode === 32 ) {
        if ( !popupManager.open ) {
          event.preventDefault();
          this.currentPreview.playing ? this.currentPreview.pause() : this.currentPreview.play();
        }
      }
    } //onKeyPress

    this.toggleLoadingScreen = function( state ) {
      if ( state ) {
        loadingOverlay.show();
      }
      else {
        loadingOverlay.hide();
      }
    }; //toggleLoadingScreen

	  this.toggleKeyboardFunctions = function( state ) {
      if ( state ) {
        document.addEventListener( "keypress", onKeyPress, false);
      }
      else {
        document.removeEventListener( "keypress", onKeyPress, false);
      }
    } //toggleKeyboardFunctions

    this.buildRegistry = function( registry ) {
      for( var manifest in registry ) {
        if ( registry.hasOwnProperty( manifest ) ) {
          butter.addPlugin( { type: manifest } );
        }
      } //for
    } //buildRegistry

  } //PopcornMaker

  PopcornMaker.getJSON = function( src, successCallback, errorCallback ) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', src, false);
    xmlHttp.send(null);
    if ( xmlHttp.status === 200 || xmlHttp.status === 0 ) {
      return JSON.parse( xmlHttp.responseText );
    }
    else {
      return
    }
  }; //getJSON

  window.PopcornMaker = PopcornMaker;

  window.addEventListener("DOMContentLoaded", function() {
   
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

  }, false);

})();


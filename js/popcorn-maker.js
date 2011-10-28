(function(){

  var LAYOUTS_DIR = "./layouts",
      EDITORS_DIR = "./editors",
      TEMPLATES_CONFIG = LAYOUTS_DIR + "/conf.json",
      EDITORS_CONFIG = EDITORS_DIR + "/conf.json",
      PACKAGE_SERVER_ADDR = "http://localhost:8888";

  if ( window.location.href.indexOf( "resetSavedProjects=true" ) > -1 ) {
    localStorage.setItem( "PopcornMaker.SavedProjects", "" );
  } //if
  
  function PopcornMaker() {

    var that = this;

    this.currentProject = {
      guid: PopcornMaker.getUUID(),
      preview: undefined,
      template: undefined
    };

    Butter.Logger.logFunction = function( logMessage ) {
      console.log( "From Butter", logMessage );
    };
    var _butter = new Butter();
  
    var _templateManager = new TemplateManager({
          config: TEMPLATES_CONFIG,
          container: "layout-select",
          layoutsDir: LAYOUTS_DIR
        }),
        _editorManager = new EditorManager({
          config: EDITORS_CONFIG,
          editorsDir: EDITORS_DIR
        }),
        _popupManager = new PopupManager(),
        _buttonManager = new ButtonManager();

    _butter.comm();
    _butter.eventeditor({ target: "editor-popup" });
    _butter.plugintray({ target: "plugin-tray", pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>' });
    _butter.timeline({ target: "timeline-div" });
    _butter.trackeditor({ target: "edit-target-popup" });
    //_butter.addCustomEditor( "external/layouts/city-slickers/editor.html", "slickers" );
    //_butter.addCustomEditor( "external/layouts/cgg/editor.html", "fkb" );
    //_butter.addCustomEditor( "external/layouts/blackpanthers/editor.html", "googlestreets" );
    _editorManager.initEditors( _butter );
    _butter.setProjectDetails("title", "Untitled Project" );
    _butter.previewer({
      target: "main",
      popcornUrl: "../lib/popcorn-complete.js",
      butterUrl: Butter.getScriptLocation() + "butter.js"
    });

    //_popupManager.addPopup( "captcha", "#captcha-popup" );
    _popupManager.addPopup( "change-media", "#change-media-popup" );
    _popupManager.addPopup( "edit-track", "#edit-track-popup" );
    _popupManager.addPopup( "delete-track", "#delete-track-popup" );

    var loadingOverlay = $( "#loading-overlay" );
    loadingOverlay.hide();

    Object.defineProperty( this, "popupManager", { get: function() { return _popupManager; } } );
    Object.defineProperty( this, "templateManager", { get: function() { return _templateManager; } } );
    Object.defineProperty( this, "buttonManager", { get: function() { return _buttonManager; } } );
    Object.defineProperty( this, "butter", { get: function() { return _butter; } } );

    _templateManager.init();
    _popupManager.init();
    _buttonManager.init();

    _templateManager.buildList();

    var _menu = new PopcornMaker.Menu( this ),
        _timeline = new PopcornMaker.Timeline( this ),
        _editor = new PopcornMaker.Editor( this ),
        _preview = new PopcornMaker.Preview( this ),
        _welcome = new PopcornMaker.Welcome( this );
 
    _timeline.showTools(); 
    _popupManager.hidePopups();
    _popupManager.showPopup( "welcome" );

    function onKeyPress( event ) {
      var inc = event.shiftKey ? 1 : 0.1;

      if( event.keyCode === 39 ) {
        if ( _butter.targettedEvent ) {
          _butter.moveFrameRight( event );
        } else {
          _butter.currentTime = _butter.currentTime + inc;
        }
      }
      else if( event.keyCode === 37 ) {
        if ( _butter.targettedEvent ) {
          _butter.moveFrameLeft( event );
        } else {
          _butter.currentTime = _butter.currentTime - inc;
        }
      }
      else if ( event.charCode === 32 ) {
        if ( !_popupManager.open ) {
          event.preventDefault();
          that.currentProject.preview.playing ? that.currentProject.preview.pause() : that.currentProject.preview.play();
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
          _butter.addPlugin( { type: manifest } );
        }
      } //for
    }; //buildRegistry

    this.destroyCurrentPreview = function() {
      if ( that.currentProject.preview ) {
        that.currentProject.preview.destroy();
        delete that.currentProject.preview;
      } //if
    }; //destroyCurrentPreview

    this.getProjectExport = function() {
      return {
        template: that.currentProject.template.root,
        title: that.currentProject.title,
        guid: that.currentProject.guid || PopcornMaker.getUUID(),
        project: _butter.exportProject()
      };
    }; //getProjectExport

    this.saveProject = function() {
      try {
        var localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
        localProjects = localProjects ? JSON.parse( localProjects ) : {};

        var overwrite =    localProjects[ that.currentProject.guid ]
                        && localProjects[ that.currentProject.guid ].title === that.currentProject.title;

        if ( !overwrite ) {
          that.currentProject.guid = PopcornMaker.getUUID();
        } //if
 
        var projectToSave = that.getProjectExport();
        localProjects[ projectToSave.guid ] = projectToSave;
        localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
        _menu.populateSavedProjectsList();
        _popupManager.hidePopups();
      }
      catch ( e ) {
        throw new Error("Saving Failed...");
      }
    }; //saveProject

    this.loadProject = function( guid ) {
      var localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
      localProjects = localProjects ? JSON.parse( localProjects ) : {};
      if ( localProjects && localProjects[ guid ] ) {
        var projectData = localProjects[ guid ],
            template = _templateManager.find( { root: projectData.template } );
        _butter.clearProject();         
        _butter.clearPlugins();
        that.toggleLoadingScreen( true );
        that.toggleKeyboardFunctions( false );
        _popupManager.hidePopups();
        that.createPreview({
          template: template,
          projectData: projectData.project,
          onload: function( preview ) {
            that.currentProject.title = projectData.title;
            that.currentProject.guid = projectData.guid;
          }
        });
      } //if
    }; //loadProject

    this.newProject = function( projectOptions ) {
      _butter.clearProject();
      _butter.clearPlugins();
      _butter.setProjectDetails( "title", projectOptions.title );
      that.toggleLoadingScreen( true );
      that.toggleKeyboardFunctions( false );
      that.destroyCurrentPreview();
      that.createPreview({
        template: _templateManager.find( { template: projectOptions.template } ),
        defaultMedia: projectOptions.defaultMedia,
        onload: function( preview ) {
          that.currentProject.title = projectOptions.title;
          that.currentProject.guid = PopcornMaker.getUUID();
          if ( projectOptions.onload ) {
            projectOptions.onload( preivew );
          }
        }
      }); //Preview
    }; //newProject

    this.importProject = function( projectData, defaultMedia ) {
      _butter.clearProject(); 
      _butter.clearPlugins();
      that.toggleLoadingScreen( true );
      that.toggleKeyboardFunctions( false );
      that.destroyCurrentPreview();
      that.createPreview({
        template: _templateManager.find( { root: projectData.template } ) || _templateManager.templates[ 0 ],
        defaultMedia: defaultMedia,
        projectData: projectData.project,
        onload: function() {
          that.currentProject.guid = projectData.guid || PopcornMaker.getUUID();
          that.currentProject.title = projectData.title;
        }
      });
    }; //importProject

    this.createPreview = function( previewOptions ) {
      that.destroyCurrentPreview();
      that.currentProject.preview = new _butter.Preview({
        template: previewOptions.template.template,
        defaultMedia: previewOptions.defaultMedia,
        importData: previewOptions.projectData,
        onload: function( preview ) {
          that.currentProject.template = previewOptions.template
          that.buildRegistry( _butter.currentMedia.registry );
          if ( previewOptions.onload ) {
            previewOptions.onload( preview );
          }
          $('.tiny-scroll').tinyscrollbar();
          that.toggleLoadingScreen( false );
          that.toggleKeyboardFunctions( true );
        } //onload
      }); //Preview
    }; //createPreview

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

  PopcornMaker.getSafeString = function( input ) {
    return input && input.length > 0 ? $("<div/>").text( input ).html() : "";
  }; //getSafeString

  PopcornMaker.getUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }).toUpperCase();
  };

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


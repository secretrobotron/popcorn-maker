(function(){

  require.config({
    baseUrl: "js"
  });

  define([
    "button-manager",
    "template-manager",
    "editor-manager",
    "popup-manager",
    "menu",
    "timeline",
    "preview",
    "editor",
    "welcome",
    "utils" ],
    function( ButtonManager, TemplateManager, EditorManager, PopupManager, Menu, Timeline, Preview, Editor, Welcome, utils ) {

    var LAYOUTS_DIR = "./layouts",
        EDITORS_DIR = "./editors",
        TEMPLATES_CONFIG = LAYOUTS_DIR + "/conf.json",
        EDITORS_CONFIG = EDITORS_DIR + "/conf.json",
        PACKAGE_SERVER_ADDR = "http://localhost:8888";

    if ( window.location.href.indexOf( "resetSavedProjects=true" ) > -1 ) {
      localStorage.setItem( "PopcornMaker.SavedProjects", "" );
    } //if
    
    function PopcornMaker() {

      var that = this,
          _templateManager,
          _editorManager,
          _popupManager,
          _buttonManager,
          _loadingOverlay,
          _menu,
          _timeline,
          _editor,
          _preview,
          _welcome;

      this.currentProject = {
        guid: utils.getUUID(),
        preview: undefined,
        template: undefined
      }; //currentProject

      var init = function( e ) {
        _butter = e.data;

        _templateManager = new TemplateManager({
          config: TEMPLATES_CONFIG,
          container: "layout-select",
          layoutsDir: LAYOUTS_DIR
        });
        _editorManager = new EditorManager({
          config: EDITORS_CONFIG,
          editorsDir: EDITORS_DIR
        });
        _popupManager = new PopupManager(),
        _buttonManager = new ButtonManager();

        _editorManager.initEditors( _butter );
        _butter.setProjectDetails("title", "Untitled Project" );

        _popupManager.addPopup( "change-media", "#change-media-popup" );
        _popupManager.addPopup( "edit-track", "#edit-track-popup" );
        _popupManager.addPopup( "delete-track", "#delete-track-popup" );

        _loadingOverlay = $( "#loading-overlay" );
        _loadingOverlay.hide();

        _templateManager.init();
        _popupManager.init();
        _buttonManager.init();

        _templateManager.buildList();

        _menu = new Menu( that );
        _timeline = new Timeline( that );
        _editor = new Editor( that );
        _preview = new Preview( that );
        _welcome = new Welcome( that );
     
        _timeline.showTools(); 
        _popupManager.hidePopups();
        _popupManager.showPopup( "welcome" );
      }; //init

      Object.defineProperty( that, "popupManager", { get: function() { return _popupManager; } } );
      Object.defineProperty( that, "templateManager", { get: function() { return _templateManager; } } );
      Object.defineProperty( that, "buttonManager", { get: function() { return _buttonManager; } } );
      Object.defineProperty( that, "butter", { get: function() { return _butter; } } );

      var _butter = new Butter({
        modules: {
          eventeditor: {
            target: "editor-popup",
          },
          pluginmanager: {
            target: "plugin-tray",
            pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>'
          },
          timeline: {
            target: "timeline-div"
          },
          trackeditor: {
            target: "edit-target-popup"
          },
          previewer: {
            target: "main",
          }
        },
        ready: init
      }); //butter

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
          _loadingOverlay.show();
        }
        else {
          _loadingOverlay.hide();
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
          guid: that.currentProject.guid || utils.getUUID(),
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
            that.currentProject.guid = utils.getUUID();
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
          _butter.pluginmanager.clear();
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
        _butter.pluginmanager.clear();
        _butter.setProjectDetails( "title", projectOptions.title );
        that.toggleLoadingScreen( true );
        that.toggleKeyboardFunctions( false );
        that.destroyCurrentPreview();
        that.createPreview({
          template: _templateManager.find( { template: projectOptions.template } ),
          defaultMedia: projectOptions.defaultMedia,
          onload: function( preview ) {
            that.currentProject.title = projectOptions.title;
            that.currentProject.guid = utils.getUUID();
            if ( projectOptions.onload ) {
              projectOptions.onload( preivew );
            }
          }
        }); //Preview
      }; //newProject

      this.importProject = function( projectData, defaultMedia ) {
        _butter.clearProject(); 
        _butter.pluginmanager.clear();
        that.toggleLoadingScreen( true );
        that.toggleKeyboardFunctions( false );
        that.destroyCurrentPreview();

        if (  projectData && 
              projectData.project && 
              projectData.project.media && 
              projectData.project.media.length > 0 ) {
          defaultMedia = projectData.project.media[ 0 ].url;       
        } //if

        that.createPreview({
          template: _templateManager.find( { root: projectData.template } ) || _templateManager.templates[ 0 ],
          defaultMedia: defaultMedia,
          projectData: projectData.project,
          onload: function() {
            that.currentProject.guid = projectData.guid || utils.getUUID();
            that.currentProject.title = projectData.title;
          }
        });
      }; //importProject

      this.createPreview = function( previewOptions ) {
        that.destroyCurrentPreview();
        that.currentProject.preview = new _butter.previewer.Preview({
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

    return PopcornMaker;

  }); //define
})();


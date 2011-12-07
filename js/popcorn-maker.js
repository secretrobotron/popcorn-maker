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
        template: undefined,
        mediaErrorState: {},
        initialized: false
      }; //currentProject

      // horrible, horrible hack. must replace later
      this.state = "initializing";

      Object.defineProperty( this, "isMediaBroken", {
        get: function() {
          return Object.keys( that.currentProject.mediaErrorState ).length > 0;
        }
      });

      Object.defineProperty( this, "mediaAccessAllowed", {
        get: function() {
          return !that.isMediaBroken
            && that.currentProject.initialized
            && that.currentProject.preview
            && that.currentProject.template;
        }
      });

      var init = function( e ) {
        _butter = e.data;

        _templateManager = new TemplateManager({
          config: TEMPLATES_CONFIG,
          container: "layout-select",
          description: "template-description",
          layoutsDir: LAYOUTS_DIR
        });
        _editorManager = new EditorManager({
          config: EDITORS_CONFIG,
          editorsDir: EDITORS_DIR
        });
        _popupManager = new PopupManager( that ),
        _buttonManager = new ButtonManager();

        _editorManager.initEditors( _butter );

        _popupManager.addPopup( "change-media", "#change-media-popup" );
        _popupManager.addPopup( "edit-track", "#edit-track-popup" );
        _popupManager.addPopup( "delete-track", "#delete-track-popup" );
        _popupManager.addPopup( "load-failed", "#load-failed-popup" );
        _popupManager.addPopup( "load-timeout", "#media-timeout-popup" );

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
        _popupManager.showPopup( "welcome", {
          onClose: function(){
          }
        });

        that.state = "ready";

        _buttonManager.addSet( "all", [
          "add-project",
          "change-title",
          "change-url",
          "confirm-delete-project",
          "confirm-load",
          "create-new",
          "credits",
          "delete-project",
          "edit-projects",
          "import-json",
          "load-project",
          "open-help",
          "popup-close",
          "publish-project",
          "retry-load",
          "save-project",
          "save-project-data",
          "show-html",
          "show-json",
          "timeout-keep-waiting",
          "timeout-retry-load",
          "wizard-add-project",
          "wizard-create-new"
        ]);

      }; //init

      Object.defineProperty( that, "popupManager", { get: function() { return _popupManager; } } );
      Object.defineProperty( that, "templateManager", { get: function() { return _templateManager; } } );
      Object.defineProperty( that, "buttonManager", { get: function() { return _buttonManager; } } );
      Object.defineProperty( that, "butter", { get: function() { return _butter; } } );

      function onKeyDown( event ) {
        var inc = event.shiftKey ? 1 : 0.1;

        if( event.keyCode === 39 ) {
          if ( _butter.targettedEvent ) {
            _butter.timeline.moveFrameRight( event );
          } else {
            _butter.currentTime = _butter.currentTime + inc;
          }
        }
        else if( event.keyCode === 37 ) {
          if ( _butter.targettedEvent ) {
            _butter.timeline.moveFrameLeft( event );
          } else {
            _butter.currentTime = _butter.currentTime - inc;
          }
        }
        else if ( event.keyCode === 32 ) {
          if ( !_popupManager.open ) {
            event.preventDefault();
            that.currentProject.preview.playing ? that.currentProject.preview.pause() : that.currentProject.preview.play();
          }
        }
      } //onKeyDown

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
          document.addEventListener( "keydown", onKeyDown, false);
        }
        else {
          document.removeEventListener( "keydown", onKeyDown, false);
        }
      } //toggleKeyboardFunctions

      this.buildRegistry = function( registry ) {
        for( var manifest in registry ) {
          if ( registry.hasOwnProperty( manifest ) ) {
            _butter.pluginmanager.add( { type: manifest } );
          }
        } //for
      }; //buildRegistry

      this.destroyCurrentPreview = function() {
        if ( that.currentProject.preview ) {
          that.currentProject.preview.destroy();
          delete that.currentProject.preview;
          delete that.currentProject.template;
          that.currentProject.initialized = false;
        } //if
      }; //destroyCurrentPreview

      this.getProjectExport = function() {
        return {
          template: that.currentProject.template.root,
          title: that.currentProject.title,
          guid: that.currentProject.guid || utils.getUUID(),
          project: _butter.exportProject(),
          timeStamp: that.currentProject.timeStamp
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

          that.currentProject.timeStamp = Date.now();
          var projectToSave = that.getProjectExport();
          localProjects[ projectToSave.guid ] = projectToSave;
          localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
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
          that.currentProject.initialized = false;
          that.createPreview({
            template: template,
            projectData: projectData.project,
            onload: function( preview ) {
              that.currentProject.title = projectData.title;
              that.currentProject.guid = projectData.guid;
              that.currentProject.timeStamp = projectData.timeStamp;
            }
          });
        } //if
      }; //loadProject

      this.newProject = function( projectOptions ) {
        _butter.clearProject();
        _butter.pluginmanager.clear();
        that.toggleLoadingScreen( true );
        that.toggleKeyboardFunctions( false );
        that.destroyCurrentPreview();
        that.currentProject.initialized = false;
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

        that.currentProject.initialized = false;

        that.createPreview({
          template: _templateManager.find( { root: projectData.template } ) || _templateManager.templates[ 0 ],
          defaultMedia: defaultMedia,
          projectData: projectData.project,
          onload: function() {
            that.currentProject.guid = projectData.guid || utils.getUUID();
            that.currentProject.title = projectData.title;
            that.currentProject.timeStamp = projectData.timeStamp;
          }
        });
      }; //importProject

      this.createPreview = function( previewOptions ) {
        that.state = "create-preview";
        that.destroyCurrentPreview();
        that.currentProject.preview = new _butter.previewer.Preview({
          template: previewOptions.template.template,
          defaultMedia: previewOptions.defaultMedia,
          importData: previewOptions.projectData,
          exportBaseUrl: "http://mozillapopcorn.org/maker/" + previewOptions.template.template,
          onload: function( preview ) {
            that.currentProject.template = previewOptions.template
            that.buildRegistry( _butter.currentMedia.registry );
            that.currentProject.initialized = true;
            _buttonManager.toggleSet( "preview", true );
            if ( previewOptions.onload ) {
              previewOptions.onload( preview );
            }
            _popupManager.hidePopups();
            $('.tiny-scroll').tinyscrollbar();
            that.toggleLoadingScreen( false );
            that.toggleKeyboardFunctions( true );
          }, //onload
          onfail: function( preview ) {
            that.toggleKeyboardFunctions( true );
          }
        }); //Preview
      }; //createPreview

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
            exportBaseUrl: "http://mozillapopcorn.org/maker"
          }
        },
        ready: init
      }); //butter

    } //PopcornMaker

    return PopcornMaker;

  }); //define
})();


(function() {
  PopcornMaker.Menu = function( pm ) {
    var popupManager = pm.popupManager,
        buttonManager = pm.buttonManager,
        templateManager = pm.templateManager,
        butter = pm.butter;

    var $projectsDropDown = $( "#projects-dropdown" ),
        $newProjectTitleInput = $( "#title-input-box" );
        $saveProjectTitleInput = $( "#project-title-textbox" );

    buttonManager.add( "add-project", $( ".add-project-btn" ), {
      click: function() {
        popupManager.hidePopups();
        $newProjectTitleInput.val( "New Project" );
        popupManager.showPopup( "add-project" );
      }
    });

    popupManager.addPopup( "confirm-load", "#load-confirmation-dialog" );
    popupManager.addPopup( "help", "#help-popup" );
    popupManager.addPopup( "save", "#save-popup" );
    popupManager.addPopup( "add-project", "#add-project-popup" );
    popupManager.addPopup( "project-title", "#project-title-popup" );
    popupManager.addPopup( "error", "#error-popup" );

    buttonManager.add( "open-help", $( '.open-help, .help' ), {
      click: function() {
        popupManager.hidePopups();
        popupManager.showPopup( "help" );
      }
    }); //open-help
    
    buttonManager.add( "user-manual", $('#_user_manual'), {
      click: function() {
        $('#popup-add-project').hide();
        $("#help-popup .scroll-popup-container").animate({
          left: '-700px'
        }, 500);
      }
    }); //user-manual

    buttonManager.add( "publish-project", $( ".publish-project-btn" ), {
      click: function() {
        pm.currentProject.preview.fetchHTML( function( html ) {
          popupManager.hidePopups();
          popupManager.showPopup( "captcha" );
          var container = $( "#captcha-popup" )[ 0 ];
          container.innerHTML = "";
          var iframe = document.createElement( "iframe" );
          iframe.setAttribute( "scrolling", "no" );
          iframe.src = PACKAGE_SERVER_ADDR + "/captcha?butter_template=" + pm.currentProject.template.root;
          container.appendChild( iframe );
        });
      }
    }); //publish-project

    buttonManager.add( "save-project-data", $(".save-project-data-btn"), {
      click: function() {
        var title = $('.project-title-textbox').val() || projectToSave.title;
        title = PopcornMaker.getSafeString( title );
        pm.currentProject.title = title;
        pm.saveProject();
      }
    }); //save-project-data

    buttonManager.add( "save-project", "save-project-btn", {
      click: function() {
        pm.currentProject.preview.fetchHTML( function( html ) {
          popupManager.hidePopups();
          $('#export-data').val( html );
          var safeTitle = PopcornMaker.getSafeString( pm.currentProject.title );
          $saveProjectTitleInput.val( safeTitle );
          popupManager.showPopup( "save" );
        });
      }
    }); //save-project-btn
    buttonManager.add( "change-url", $( ".change-url-btn" ), {
      click: function() {
        $(".media-title-div").html( $('#url').val() );
        butter.currentMedia.url = ( $('#url').val() );
        popupManager.hidePopups();
      }
    }); //change-url-btn
    buttonManager.add( "edit-selected-project", "edit-selected-project", {
      click: function () {
        var safeTitle = PopcornMaker.getSafeString( pm.currentProject.title );
        if ( $projectsDropDown[0].selectedIndex > 0 ) {
          $('#project-title').val( safeTitle );
          popupManager.showPopup( "project-title" );
        }
      }
    }); //edit-selected-project
    buttonManager.add( "change-title", "change-title-btn", {
      click: function() {
        var newTitle = PopcornMaker.getSafeString( $('#project-title').val() ),
          oldTitle = PopcornMaker.getSafeString( $projectsDropDown.val() ),
          idx = $projectsDropDown[0].selectedIndex,
          selectedOpt,
          targetProject;

        if ( newTitle.length > 0) {
          localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
      
          localProjects = localProjects ? JSON.parse( localProjects ) : localProjects;
          
          ( butter.getProjectDetails ( "title" ) === newTitle ) && butter.setProjectDetails ( "title", newTitle );
          
          selectedOpt = $projectsDropDown[0].options[ idx ];
          
          selectedOpt.value = newTitle;
          while ( selectedOpt.childNodes.length > 0 ) {
            selectedOpt.removeChild( selectedOpt.firstChild );
          }
          selectedOpt.appendChild( document.createTextNode( newTitle ) );
          $projectsDropDown[0].refresh();
          
          if ( localProjects[ oldTitle ] ) {
            targetProject = localProjects[ oldTitle ];
            delete localProjects[ oldTitle ];
            targetProject.title = newTitle;
            localProjects[ newTitle ] = targetProject;
            localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
          }
          
          $('.close-div').fadeOut('fast');
          $('.popups').hide();
          escapeKeyEnabled = false;
        }
      }
    }); //change-title-btn

    buttonManager.add( "popup-close", $('.popup-close-btn'), {
      click: function () {
        popupManager.hidePopups();
      }
    });

    buttonManager.add( "confirm-load", $(".confirm-load-btn"), {
      click: function() {
        var guid = $projectsDropDown.val();
        pm.loadProject( guid );
      }   
    }); //confirm-load
    
    buttonManager.add( "create-new", $( ".create-new-btn" ), {
      click: function() {
        var safeTitle = $newProjectTitleInput.val() || "Untitled Project";
        safeTitle = PopcornMaker.getSafeString( safeTitle );
        pm.newProject({
          title: safeTitle,
          template: document.getElementById( 'layout-select' ).value,
          defaultMedia: document.getElementById( 'timeline-media-input-box' ).value
        });
        popupManager.hidePopups();
      }
    });

    buttonManager.add( "import-json", "import-json-btn", {
      click: function() {
        var dataString = $("#import-json-area").val();
        if ( dataString ) {
//          try {
            var data = JSON.parse( dataString );
            popupManager.hidePopups();
            pm.importProject( data, document.getElementById( 'timeline-media-input-box' ).value );
//          }
//          catch ( e ) {
//            console.log ( "Error loading in Data", e );
//          }
        }
      }
    }); //import-json
    
    buttonManager.add( "show-json", $( ".show-json-btn" ), {
      click: function() {
        var exp = pm.getProjectExport();
        $('#export-data').val( JSON.stringify( exp ) );
      }
    }); //show-json

    buttonManager.add( "show-html", $( ".show-html-btn" ), {
      click: function() {
        pm.currentProject.preview.fetchHTML( function( html ) {
          $('#export-data').val( html );
        });
      }
    }); //show-html
    
    butter.listen( "error", function( error ) {
      if( error.data.type === "popcorn-initialization" ) {
        pm.toggleLoadingScreen( false );
        popupManager.showPopup( "error", {
          message: "<p style=\"font-weight: bold\">While loading the selected template, an error occured. Please make sure the template has access to the libraries it requires.</p><p style=\"font-size: 70%\">" + error.data.message + "</p>",
          buttons: {
            ok: function() {
              popupManager.hidePopups();
            }
          }
        });
      }
    });

    this.populateSavedProjectsList = function( skipRefresh ) {
    
      var localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
      localProjects = localProjects ? JSON.parse( localProjects ) : localProjects;

      $projectsDropDown.empty();
      
      $( "<option/>", {
          "value": undefined,
          "html": "[select a project]"
        }).appendTo( $projectsDropDown );
      
      localProjects && $.each( localProjects, function( index, oneProject ) {
        $( "<option/>", {
          "value": oneProject.guid,
        }).appendTo( $projectsDropDown ).text( PopcornMaker.getSafeString( oneProject.title ) );
      });

      if ( !skipRefresh ) {
        $projectsDropDown[0].refresh()
      }

    }; //populateSavedProjectsList

    this.populateSavedProjectsList( true );
    create_msDropDown();

    function create_msDropDown() {
      try {
        $(".projects-dd").msDropDown();
      } catch( e ) {
        alert( "Error: "+ e.message);
      }
    }
   
    var ddLoadFunc = function() {
      var title = $projectsDropDown.val(),
          localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
      localProjects = localProjects ? JSON.parse( localProjects ) : undefined;
      if ( $projectsDropDown[0].selectedIndex > 0 ) {
        popupManager.hidePopups();
        popupManager.showPopup( "confirm-load" );
      }
    };
    
    $projectsDropDown.change( ddLoadFunc );

  }; //Menu
})();

(function() {
  PopcornMaker.Menu = function( pm ) {
    var popupManager = pm.popupManager,
        buttonManager = pm.buttonManager,
        templateManager = pm.templateManager,
        butter = pm.butter;

    buttonManager.add( "add-project", $( ".add-project-btn" ), {
      click: function() {
        popupManager.hidePopups();
        popupManager.showPopup( "add-project" );
      }
    });

    popupManager.addPopup( "confirm-load", "#load-confirmation-dialog" );
    popupManager.addPopup( "help", "#help-popup" );
    popupManager.addPopup( "save", "#save-popup" );
    popupManager.addPopup( "add-project", "#add-project-popup" );
    popupManager.addPopup( "project-title", "#project-title-popup" );

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
        pm.currentPreview.fetchHTML( function( html ) {
          popupManager.hidePopups();
          popupManager.showPopup( "captcha" );
          var container = $( "#captcha-popup" )[ 0 ];
          container.innerHTML = "";
          var iframe = document.createElement( "iframe" );
          iframe.setAttribute( "scrolling", "no" );
          iframe.src = PACKAGE_SERVER_ADDR + "/captcha?butter_template=" + pm.currentTemplate.root;
          container.appendChild( iframe );
        });
      }
    }); //publish-project

    buttonManager.add( "save-project-data", $(".save-project-data-btn"), {
      click: function() {
        
        try {
          var projectToSave = butter.exportProject(),
          overwrite = false,  
          title;

          projectToSave.template = pm.currentTemplate.root;
          
          localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
          
          title = projectToSave.project.title = $('.project-title-textbox').val() || projectToSave.project.title;
          
          localProjects = localProjects ? JSON.parse( localProjects ) : {};
          
          overwrite = localProjects[ title ] ? true : false;
          
          localProjects[ title ] = projectToSave;

          !overwrite &&
          $( "<option/>", {
            "value": projectToSave.project.title,
            "html": projectToSave.project.title
          }).appendTo( projectsDrpDwn );
          localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
          projectsDrpDwn[0].refresh()
          $('.close-div').fadeOut('fast');
          $('.popups').hide();
          escapeKeyEnabled = false;
        }
        catch ( e ) {
          throw new Error("Saving Failed...");
        }
      }
    }); //save-project-data

    buttonManager.add( "save-project", "save-project-btn", {
      click: function() {
        pm.currentPreview.fetchHTML( function( html ) {
          popupManager.hidePopups();
          $('#export-data').val( html );
          $('.project-title-textbox').val( butter.getProjectDetails( "title" ) );
          popupManager.showPopup( "save" );
        });
      }
    }); //save-project-btn
    buttonManager.add( "change-url", "change-url-btn", {
      click: function() {
        $(".media-title-div").html( $('#url').val() );
        butter.currentMedia.url = ( $('#url').val() );
        popupManager.hidePopups();
      }
    }); //change-url-btn
    buttonManager.add( "edit-selected-project", "edit-selected-project", {
      click: function () {
        if ( projectsDrpDwn[0].selectedIndex > 0 ) {
          $('#project-title').val( $( ".projects-dd" ).val() );
          popupManager.showPopup( "project-title" );
        }
      }
    }); //edit-selected-project
    buttonManager.add( "change-title", "change-title-btn", {
      click: function() {
        var newTitle = $('#project-title').val(),
          oldTitle = $( ".projects-dd" ).val(),
          idx = projectsDrpDwn[0].selectedIndex,
          selectedOpt,
          targetProject;

        if ( newTitle.length > 0) {
          localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
      
          localProjects = localProjects ? JSON.parse( localProjects ) : localProjects;
          
          ( butter.getProjectDetails ( "title" ) === newTitle ) && butter.setProjectDetails ( "title", newTitle );
          
          selectedOpt = projectsDrpDwn[0].options[ idx ];
          
          selectedOpt.value = newTitle;
          selectedOpt.innerHTML = newTitle;
          projectsDrpDwn[0].refresh();
          
          if ( localProjects[ oldTitle ] ) {
            targetProject = localProjects[ oldTitle ];
            delete localProjects[ oldTitle ];
            targetProject.project.title = newTitle;
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
        var title = projectsDrpDwn.val();

        if ( localProjects && localProjects[ title ] ) {
          butter.clearProject();         
          butter.clearPlugins();
          pm.currentTemplate = templateManager.find( { root: localProjects[ title ].template } );
          console.log( localProjects[ title ] );

          pm.toggleLoadingScreen( true );
          pm.toggleKeyboardFunctions( false );
          popupManager.hidePopups();

          pm.currentPreview = new butter.Preview({
            template: pm.currentTemplate.template,
            importData: localProjects[ title ],
            onload: function( preview ) {
              pm.buildRegistry( butter.currentMedia.registry );
              $('.tiny-scroll').tinyscrollbar();
              pm.toggleLoadingScreen( false );
              pm.toggleKeyboardFunctions( true );
            } //onload
          }); //Preview
        } //if
      }
    }); //confirm-load
    
    buttonManager.add( "create-new", $( ".create-new-btn" ), {
      click: function() {
        butter.clearProject();
        butter.clearPlugins();
        butter.setProjectDetails( "title", ( $( "title-input-box" ).val() || "Untitled Project" ) );
        pm.currentTemplate = templateManager.find( { template: document.getElementById( 'layout-select' ).value } );
        pm.toggleLoadingScreen( true );
        pm.toggleKeyboardFunctions( false );
        pm.currentPreview = new butter.Preview({
          template: pm.currentTemplate.template,
          defaultMedia: document.getElementById('timeline-media-input-box').value,
          onload: function( preview ) {
            pm.buildRegistry( butter.currentMedia.registry );
            $('.tiny-scroll').tinyscrollbar();
            pm.toggleLoadingScreen( false );
            pm.toggleKeyboardFunctions( true );
          } //onload
        }); //Preview
        popupManager.hidePopups();
      }
    });

    buttonManager.add( "import-json", "import-json-btn", {
      click: function() {
        var dataString = $("#import-json-area").val();
        if ( dataString ) {
        
          try {
            var data = JSON.parse( dataString );
            popupManager.hidePopups();
            butter.clearProject(); 
            butter.clearPlugins();
            pm.currentTemplate = templateManager.find( { root: data.template } ) || templateManager.templates[ 0 ];
            pm.toggleLoadingScreen( true );
            pm.toggleKeyboardFunctions( false );

            pm.currentPreview = new butter.Preview({
              template: pm.currentTemplate.template,
              defaultMedia: document.getElementById( 'timeline-media-input-box' ).value,
              importData: data,
              onload: function( preview ) {
                pm.buildRegistry( butter.currentMedia.registry );
                $('.tiny-scroll').tinyscrollbar();
                pm.toggleLoadingScreen( false );
                pm.toggleKeyboardFunctions( true );
              } //onload
            }); //Preview
            return;
          }
          catch ( e ) {
            console.log ( "Error Loading in Data", e );
          }
        }
      }
    }); //import-json
    
    buttonManager.add( "show-json", $( ".show-json-btn" ), {
      click: function() {
        var exp = butter.exportProject();
        exp.template = pm.currentTemplate.root;
        $('#export-data').val( JSON.stringify( exp ) );
      }
    }); //show-json

    buttonManager.add( "show-html", $( ".show-html-btn" ), {
      click: function() {
        pm.currentPreview.fetchHTML( function( html ) {
          $('#export-data').val( html );
        });
      }
    }); //show-html
    
    var projectsDrpDwn = $(".projects-dd"),
        localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
    
    localProjects = localProjects ? JSON.parse( localProjects ) : localProjects;
    
    $( "<option/>", {
        "value": undefined,
        "html": "[select a project]"
      }).appendTo( projectsDrpDwn );
    
    localProjects && $.each( localProjects, function( index, oneProject ) {
      $( "<option/>", {
        "value": oneProject.project.title,
        "html": oneProject.project.title
      }).appendTo( projectsDrpDwn );
    });
    
    create_msDropDown();

    function create_msDropDown() {
      try {
        $(".projects-dd").msDropDown();
      } catch( e ) {
        alert( "Error: "+ e.message);
      }
    }
   
    var ddLoadFunc = function() {
      var title = projectsDrpDwn.val();
      localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
      localProjects = localProjects ? JSON.parse( localProjects ) : undefined;
      if ( projectsDrpDwn[0].selectedIndex > 0 && localProjects[ title ] ) {
        popupManager.hidePopups();
        popupManager.showPopup( "confirm-load" );
      }
    };
    
    $(".projects-dd").change( ddLoadFunc );

  }; //Menu
})();

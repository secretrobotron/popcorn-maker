(function() {
  define( [ "utils" ], function( utils ) {

    var Menu = function( pm ) {
      var popupManager = pm.popupManager,
          buttonManager = pm.buttonManager,
          templateManager = pm.templateManager,
          butter = pm.butter;

      var $projectsListBox = $( "select.projects-list" ),
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
      popupManager.addPopup( "edit-project", "#edit-project-popup" );
      popupManager.addPopup( "error", "#error-popup" );
      popupManager.addPopup( "delete-project", "#delete-project-popup" );
      popupManager.addPopup( "clear-track-confirm", "#clear-track-confirmation" );
      popupManager.addPopup( "delete-track-confirm", "#delete-track-confirmation" );
      popupManager.addPopup( "credits-popup", "#credits-popup" );

      buttonManager.add( "open-help", $( '.open-help, .help' ), {
        click: function() {
          popupManager.hidePopups();
          popupManager.showPopup( "help" );
        }
      }); //open-help

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
          var title = $('.project-title-textbox').val() || pm.currentProject.title;
          title = utils.getSafeString( title );
          pm.currentProject.title = title;
          pm.saveProject();
        }
      }); //save-project-data

      buttonManager.add( "save-project", $(".save-project-btn"), {
        click: function() {
          if ( pm.currentProject && pm.currentProject.preview ) {
            pm.currentProject.preview.fetchHTML( function( html ) {
              popupManager.hidePopups();
              $('#export-data').val( html );
              var safeTitle = utils.getSafeString( pm.currentProject.title );
              $saveProjectTitleInput.val( safeTitle );
              popupManager.showPopup( "save" );
            });
          } //if
        }
      }); //save-project-btn

      buttonManager.add( "confirm-delete-project", $( "#confirm-deleteProjectBtn" ) , {
        click: function() {
          var localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" ),
              guid;

          localProjects = localProjects ? JSON.parse( localProjects ) : {};

          guid = $projectsListBox.val();

          if ( localProjects[ guid ] ) {
            delete localProjects[ guid ];
            localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
            popupManager.hidePopups();
          }
        }
      });

      buttonManager.add( "delete-project", $( "#delete-selected-project-btn" ), {
        click: function() {
          if ( $projectsListBox.val() ) {
            popupManager.hidePopups();
            popupManager.showPopup( "delete-project" );
          }
        }
      });

      buttonManager.add( "change-url", $( ".change-url-btn" ), {
        click: function() {
          $(".media-title-div").html( $('#url').val() );
          popupManager.hidePopups();
          var newUrl = $('#url').val();
          if ( newUrl !== butter.currentMedia.url ) {
            butter.currentMedia.url = ( $('#url').val() );
            pm.toggleLoadingScreen( true );
            function changeComplete( media ) {
              pm.toggleLoadingScreen( false );
              butter.unlisten( "mediacontentchangecomplete", changeComplete );
            }
            butter.listen( "mediacontentchangecomplete", changeComplete );
          } //if
        } //click
      }); //change-url-btn

      buttonManager.add( "edit-projects", $( ".edit-projects" ), {
        click: function () {
          updateProjectList();
          $projectsListBox[ 0 ].selectedIndex = -1;
          if ( !$projectsListBox[ 0 ].options.length ) {
            $( "#project-title-input-box" ).attr( "disabled", "disabled" );
          }
          $( "#project-title-input-box" ).val( "" );
          $( "#date-saved" ).text( "" );
          popupManager.showPopup( "edit-project" );
        }
      }); //edit-selected-project

      buttonManager.add( "change-title", $( "#change-title-btn" ), {
        click: function() {
          var newTitle = utils.getSafeString( $( "#project-title-input-box" ).val() ),
              localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" ),
              targetProject;

          localProjects = localProjects ? JSON.parse( localProjects ) : {};
          targetProject = localProjects[ $projectsListBox.val() ];

          if ( targetProject && newTitle.length > 0 && newTitle !== targetProject.title ) {
            targetProject.title = newTitle;
            targetProject.timeStamp = Date.now();
            localProjects[ targetProject.guid ] = targetProject;
            localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
            updateProjectList();
            $( "#project-title-input-box" ).val( "" );
            $( "#date-saved" ).text( "" );
          }
        }
      });

      buttonManager.add( "load-project", $( "#load-selected-project-btn" ), {
        click: function() {
          if ( $projectsListBox.val() ) {
            popupManager.hidePopups();
            popupManager.showPopup( "confirm-load" );
          }
        }
      });

      buttonManager.add( "popup-close", $('.popup-close-btn'), {
        click: function () {
          popupManager.hidePopups();
        }
      });

      buttonManager.add( "confirm-load", $(".confirm-load-btn"), {
        click: function() {
          var guid = $projectsListBox.val();
          pm.loadProject( guid );
        }
      }); //confirm-load

      buttonManager.add( "create-new", $( ".create-new-btn" ), {
        click: function() {
          var safeTitle = $newProjectTitleInput.val() || "Untitled Project";
          safeTitle = utils.getSafeString( safeTitle );
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
              var data = JSON.parse( dataString );
              popupManager.hidePopups();
              pm.importProject( data, document.getElementById( 'timeline-media-input-box' ).value );
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

      buttonManager.add( "credits", $("h1.logo a"), {
        click: function() {
          popupManager.showPopup( "credits-popup" );
        }
      });

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

      function updateProjectList() {
        var localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" ),
              plb = $projectsListBox[ 0 ];

        localProjects = localProjects ? JSON.parse( localProjects ) : {};

        while ( plb.lastChild ) {
          plb.removeChild( plb.lastChild );
        }

        $.each( localProjects, function( index, oneProject ) {
          $( "<option/>", {
            "value": oneProject.guid,
          }).appendTo( plb ).text( utils.getSafeString( oneProject.title ) );
        });
      }

      function loadProjectInfo( guid ) {
        var localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" ),
            plb = $projectsListBox[ 0 ],
            titleInput = $( "#project-title-input-box" ),
            dateSaved = $( "#date-saved" ),
            data;

        localProjects = localProjects ? JSON.parse( localProjects ) : {};

        //load saved Project
        data = localProjects[ guid ];
        if ( data ) {
          titleInput.val( data.title ).removeAttr( "disabled" );
          dateSaved.text( ( data.timeStamp && parseTimeStamp( data.timeStamp ) ) || "No timestamp data" );
        }

      }

      function parseTimeStamp( timeStamp ) {
        var d = new Date( timeStamp );
        return d.toLocaleString();
      }

      $projectsListBox.change( function() {

        loadProjectInfo( $projectsListBox[ 0 ].value );
      });

    }; //Menu

    return Menu;

  }); //define
})();

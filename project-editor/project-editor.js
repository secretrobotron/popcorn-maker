(function() {

  $(document).ready( function( e ) {

    var projectList = document.getElementById( "project-list" ),
        editorForm = document.getElementById( "project-editor-form" ),
        editor = document.getElementById( "project-editor-textarea" ),
        localProjects,
        currentProject,
        projects = [];

    try {
      localProjects = JSON.parse( localStorage.getItem( "PopcornMaker.SavedProjects" ) );
    }
    catch( e ) {
      if ( confirm( "There was a syntax error loading the projects (\"" + e.message + "\"). Do you want to clear them?" ) ) {
        localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( {} ) );
      } //if
      localProjects = {};
    } //try

    function Project( dataObj ) {
      var that = this;

      var data = JSON.stringify( dataObj ),
          guid = dataObj.guid,
          name = dataObj.title || "[UNNAMED]";

      var element = document.createElement( "li" );
      element.innerHTML = name;

      Object.defineProperty( this, "element", {
        get: function() { return element; }
      });

      Object.defineProperty( this, "data", {
        get: function() { return data; }
      });

      element.addEventListener( "click", function( e ) {
        editor.removeAttribute( "disabled" );
        editor.value = data;
        if ( !currentProject ) {
          for ( var i=0; i<editorForm.children.length; ++i ) {
            editorForm.children[ i ].removeAttribute( "disabled" );
          } //for
        } //if
        currentProject = that;
      }, false );

      this.save = function() {
        try {
          var saveObj = JSON.parse( editor.value );
          data = JSON.stringify( saveObj );
          localProjects[ guid ] = saveObj;
          localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
          element.innerHTML = saveObj.title;
          alert( "Saved" );
        }
        catch( e ) {
          alert( "Problem parsing project string. Check syntax." );
        } //try
      }; //save

      this.reset = function() {
        editor.value = data;
      }; //reset

      this.destroy = function() {
        delete localProjects[ guid ];
        localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
        var idx = projects.indexOf( that );
        projects.splice( idx, 1 );
        projectList.removeChild( element );
      }; //destroy

      projectList.appendChild( element );
    } //Project

    for ( var projectName in localProjects ) {
      if ( localProjects.hasOwnProperty( projectName ) ) {
        var project = new Project( localProjects[ projectName ] );
        projects.push( project );
      } //if
    } //for

    document.getElementById( "project-editor-save" ).addEventListener( "click", function( e ) {
      if ( currentProject ) {
        currentProject.save();
      }
    }, false );

    document.getElementById( "project-editor-reset" ).addEventListener( "click", function( e ) {
      if ( currentProject ) {
        currentProject.reset();
      }
    }, false );

    document.getElementById( "project-editor-delete" ).addEventListener( "click", function( e ) {
      if ( currentProject ) {
        if ( confirm( "Are you sure?" ) ) {
          currentProject.destroy();
          for ( var i=0; i<editorForm.children.length; ++i ) {
            editorForm.children[ i ].setAttribute( "disabled", "true" );
          } //for
        }
      }
    }, false );

    document.getElementById( "project-list-clear" ).addEventListener( "click", function( e ) {
      if ( confirm( "Are you sure?" ) ) {
        while ( projects.length ) {
          projects[ 0 ].destroy();
        } //for
        editor.value = "";
      } //if
    }, false );
  });

})();

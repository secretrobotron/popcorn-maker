(function(){

  window.addEventListener("DOMContentLoaded", function(){
    
    var b  = new Butter();
    document.getElementById( "main" ).style.height = window.innerHeight - document.getElementsByTagName( "HEADER" )[ 0 ].clientHeight - 5 + "px";
    b.comm();

    b.eventeditor( { target: "popup-4", defaultEditor: "lib/popcornMakerEditor.html", editorWidth: "101%", editorHeight: "101%"  } );

    b.previewer({
      layout: "layouts/default.html",
      target: "main",
      media: "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm",
      callback: function() {
        b.buildPopcorn( b.getCurrentMedia() , function() {

          var registry = b.getRegistry();
          for( var i = 0, l = registry.length; i < l; i++ ) {
            b.addPlugin( { type: registry[ i ].type } );
          }
          $('.tiny-scroll').tinyscrollbar();
        } );
      }
    });
    
    b.plugintray({ target: "plugin-tray", pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>' });
    
    b.timeline({ target: "timeline-div"});
    b.trackeditor({ target: "popup-5"});

    b.addCustomEditor( "external/layouts/city-slickers/editor.html", "slickers" );

    b.setProjectDetails("title", "Untitled Project" );
    $(".p-timeline-title").html( "Untitled Project" );
    
    b.listen( "mediaready", function() {
      $(".media-title-div").html( b.getCurrentMedia().getUrl() );
    });

    b.listen( "clientdimsupdated", function( e ) {
      $('#popup-4')
      .css( "height", e.data.height + "px" )
      .css("width", e.data.width + "px" );
      centerPopup( $('#popup-4') );
    });
    
    b.listen ( "trackeditstarted", function() {
      
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-4').show();
      $(' .balck-overlay ').hide();
    });
    
    b.listen ( "trackeditclosed", function() {
      $('.close-div').fadeOut('fast');
      $('.popups').hide(); 
    });

    var scrubber = document.getElementById( "scrubber" );
    var layersDiv = document.getElementById( "layers-div" );
    var scrubberContainer = document.getElementById( "scrubber-container" );
    var tracksDiv = document.getElementById( "tracks-div" );
    var progressBar = document.getElementById( "progress-bar" );
    var timelineDuration = document.getElementById( "timeline-duration" );

    function checkScrubber( event ) {

      layersDiv.style.top = -tracksDiv.scrollTop + "px";
      scrubber.style.left = -tracksDiv.scrollLeft + b.currentTimeInPixels() + "px";
      progressBar.style.width = -tracksDiv.scrollLeft + b.currentTimeInPixels() + "px";

      var scrubberLeft = parseInt( scrubber.style.left, 10);

      if ( scrubberLeft < 0 ) {

        progressBar.style.width = "0px";
      }

      if ( scrubberLeft > scrubberContainer.offsetWidth ) {

        progressBar.style.width = "100%";
        scrubber.style.left = scrubberContainer.offsetWidth + "px";
      }

      return scrubberLeft;
    }

    b.listen( "mediatimeupdate", function( event ) {

      var scrubberLeft = checkScrubber( event );

      timelineDuration.innerHTML = b.secondsToSMPTE( b.currentTime() );

      scrubber.style.display = "block";
      if ( scrubberLeft >= scrubberContainer.offsetWidth ) {

        tracksDiv.scrollLeft = b.currentTimeInPixels() - scrubberContainer.offsetWidth;
      } else if ( scrubberLeft < 0 ) {

        tracksDiv.scrollLeft = b.currentTimeInPixels();
      }
    });

    document.getElementById( "tracks-div" ).addEventListener( "scroll", function( event ) {

      scrubberLeft = checkScrubber( event );

      if ( scrubberLeft - 5 > scrubberContainer.offsetWidth || scrubberLeft < 0 ) {

        scrubber.style.display = "none";
      } else {

        scrubber.style.display = "block";
      }
    }, false );

    var scrubberClicked = false;

    scrubberContainer.addEventListener( "mousedown", function( event ) {

      scrubberClicked = true;
      b.currentTimeInPixels( event.clientX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft );
    }, false);

    document.addEventListener( "mouseup", function( event ) {

      scrubberClicked = false;
    }, false);

    document.addEventListener( "mousemove", function( event ) {

      if ( scrubberClicked ) {

        var scrubberPos = event.pageX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft;

        if ( scrubberPos >= 0 ) {

          b.currentTimeInPixels( scrubberPos );
        } else {

          b.currentTime( 0 );
        }
      }
    }, false);

    b.listen( "mediatimeupdate", function() {

      scrubber.style.left = b.currentTimeInPixels() - tracksDiv.scrollLeft + "px";
    });

    var trackLayers = {};
    var editTrackTargets =  document.getElementById( "track-edit-target" );
    var trackJSONtextArea = document.getElementById( "track-edit-JSON" );

    var createLayer = function( track ) {

      var layerDiv = document.createElement( "div" );
      layerDiv.id = "layer-" + track.getId();
      layerDiv.innerHTML = layerDiv.id;
      layerDiv.setAttribute("class", "layer-btn");
      layerDiv.style.position = "relative";

      var ulist = document.createElement( "ul" );
      ulist.className = "actions";

      var pointerBubble = document.createElement( "li" );
      pointerBubble.className = "bubble_pointer";

      var editButton = document.createElement( "li" );
      editButton.className = "edit";
      editButton.innerHTML = "<a href=\"#\">edit</a>";

      var deleteButton = document.createElement( "li" );
      deleteButton.className = "delete";
      deleteButton.innerHTML = "<a href=\"#\">delete</a>";
      deleteButton.addEventListener( "click", function( click ) {

        b.removeTrack( track );
      }, false );

      trackJSONtextArea.addEventListener( "change", function() {

        b.setTrackJSON( this.value );
      }, false );

      editButton.addEventListener( "click", function( click ) {

        editTrackTargets.innerHTML = "<option value=\"\">Media Element (if applicable)</option>";

        var targets = b.getTargets( true );

        for ( var i = 0; i < targets.length; i++ ) {

          editTrackTargets.innerHTML += "<option value=\"" + targets[ i ].name + "\">" + targets[ i ].name + "</option>";
        }

        b.openEditTrack( track );

        trackJSONtextArea.value = b.getTrackJSON();

        editTrackTargets.value = b.getEditTrack().target;

        $('.close-div').fadeOut('fast');
        $('.popupDiv').fadeIn('slow');
        $('#popup-5').show();
        $(' .balck-overlay ').hide();
      }, false );

      ulist.appendChild( pointerBubble );
      ulist.appendChild( editButton );
      ulist.appendChild( deleteButton );

      layerDiv.appendChild( ulist );

      return layerDiv;
    };

    var closeTrackEditor = function() {

      b.closeEditTrack();
      $('.popupDiv').fadeOut( 'slow' );
      $('#popup-5').hide();
    };

    var applyTrackEditor = function() {

      b.setTrackTarget( editTrackTargets.value );
    };

    document.getElementById( "cancel-track-edit" ).addEventListener( "click", function( e ) {

      closeTrackEditor();
    }, false );

    document.getElementById( "apply-track-edit" ).addEventListener( "click", function( e ) {

      applyTrackEditor();
    }, false );

    document.getElementById( "ok-track-edit" ).addEventListener( "click", function( e ) {

      applyTrackEditor();
      closeTrackEditor();
    }, false );

    document.getElementById( "delete-track-edit" ).addEventListener( "click", function( e ) {

      b.deleteTrack();
      closeTrackEditor();
    }, false );

    document.getElementById( "clear-track-edit" ).addEventListener( "click", function( e ) {

      trackJSONtextArea.value = "[]";
      b.clearTrack();
    }, false );

    b.listen( "trackadded", function( event ) {

      trackLayers[ "layer-" + event.data.getId() ] = createLayer( event.data );
      layersDiv.appendChild( trackLayers[ "layer-" + event.data.getId() ] );
    });

    b.listen( "trackremoved", function( event ) {

      layersDiv.removeChild( trackLayers[ "layer-" + event.data.getId() ] );
    });

    b.listen( "trackmoved", function( event ) {

      layersDiv.removeChild( trackLayers[ "layer-" + event.data.getId() ] );
      layersDiv.insertBefore( trackLayers[ "layer-" + event.data.getId() ], layersDiv.children[ event.data.newPos ] );
    });

    function centerPopup( popup ) {
      popup.css( "margin-left", ( window.innerWidth / 2 ) - ( popup[0].clientWidth / 2 ) );
    }

    function create_msDropDown() {
      try {
        $(".projects-dd").msDropDown();
      } catch( e ) {
        alert( "Error: "+ e.message);
      }
    }
    
    // Load projects from localStorage //
    
    var projectsDrpDwn = $(".projects-dd"),
    localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
    
    localProjects = localProjects ? JSON.parse( localProjects ) : localProjects;

    localProjects && $.each( localProjects, function( index, oneProject ) {
      $( "<option/>", {
        "value": oneProject.project.title,
        "html": oneProject.project.title
      }).appendTo( projectsDrpDwn );
    });
    
    create_msDropDown()
    
    function loadProjectsFromServer(){
      //load stuff from bobby's server
    }
    
    loadProjectsFromServer();
    
    // Saving

    $(".save-project-data-btn").click(function(){
      
      try {
        var localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" ),
        projectToSave = b.exportProject(),
        overwrite = false,
        projectsDrpDwn = $( ".projects-dd" ) ;
        
        localProjects = localProjects ? JSON.parse( localProjects ) : [];
        
        for ( var i = 0, l = localProjects.length; i < l; i++ ) {
          if ( localProjects[ i ].project.title === projectToSave.project.title ) {
            localProjects[ i ] = projectToSave;
            overwrite = true;
          }
        }
        !overwrite && localProjects.push( projectToSave ) && 
        $( "<option/>", {
          "value": projectToSave.project.title,
          "html": projectToSave.project.title
        }).appendTo( projectsDrpDwn );
        localStorage.setItem( "PopcornMaker.SavedProjects", JSON.stringify( localProjects ) );
        projectsDrpDwn[0].refresh()
        window.alert( b.getProjectDetails( "title" ) + " was saved" );
      }
      catch ( e ) {
        throw new Error("Saving Failed...");
      }
    
    });

    document.getElementsByClassName( "play-btn" )[ 0 ].addEventListener( "mousedown", function( event ) {
      b.isPlaying() ? b.play() : b.pause();
    }, false);

    b.listen( "mediaplaying", function( event ) {
      document.getElementsByClassName( "play-btn" )[ 0 ].children[ 0 ].children[ 0 ].style.backgroundPosition = "0pt -25px";
    } );

    b.listen( "mediapaused", function( event ) {
      document.getElementsByClassName( "play-btn" )[ 0 ].children[ 0 ].children[ 0 ].style.backgroundPosition = "0pt 0px";
    } );

    $( ".edit-selected-project" ).click( function() {
      var localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" ),
      projectsDrpDwn = $( ".projects-dd" );

      if ( projectsDrpDwn[0].selectedIndex > -1 ) {

        localProjects = localProjects ? JSON.parse( localProjects ) : [];
        
        for ( var i = 0, l = localProjects.length; i < l; i++ ) {
          if ( localProjects[ i ].project.title === projectsDrpDwn[0].value ) {
            b.clearProject();
            b.importProject( localProjects[ i ] );
            return;
          }
        }
      }
    });

    //$('.enable-scroll').tinyscrollbar();

    $(".collapse-btn").toggle(function() {

      $('.collapse-btn a').css('backgroundPosition','6px 7px');
      $(".toolbox").animate({ width: "46px" }, 500);
      $('.collapse-btn a').text("");
      $(".timeline").stop().animate({ paddingRight:'86px'}, 500);
      $(".qtip").hide();

      },function() {

        $('.collapse-btn a').css('backgroundPosition','6px -9px');
        $(".toolbox").animate({ width: "120px" }, 500);
        $('.collapse-btn a').text("collapse"); 
        $(".timeline").stop().animate({ paddingRight:'160px'}, 500);

    });

    $(".hide-timeline a").toggle(function() {

      $(this).css('backgroundPosition','20px -10px');
      $(".hide-timeline").animate({ bottom: '36px' }, 500);
      $("#properties-panel").animate({ height: '38px' }, 500);
      $(this).text("Show Timeline"); 

    },function() {

      $(this).css('backgroundPosition','20px 7px');
      $(this).text("Hide Timeline"); 
      $(".hide-timeline").animate({ bottom: "268px" }, 500);
      $("#properties-panel").animate({ height: "270px" }, 500);
    });

    $(".play-btn a").toggle(function() {
      $(".play-btn a span").css('backgroundPosition','0 -25px');
    },function() {
      $(".play-btn a span").css('backgroundPosition','0 0');
    });

    $(".sound-btn a").toggle(function() {
      $(".sound-btn a span").css('backgroundPosition','0 -16px');
    },function() {
      $(".sound-btn a span").css('backgroundPosition','0 0');
    });

    $('.timeline-title.media-title-div').click(function(){
      $('#url').val( b.getCurrentMedia().getUrl() );
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-1').show();
      centerPopup( $('#popup-1') );
      $(' .balck-overlay ').hide();
    });
    
    $('.change-url-btn').click(function(){
      $(".media-title-div").html( $('#url').val() );
      b.getCurrentMedia().setUrl( $('#url').val() );
      $('.close-div').fadeOut('fast');
      $('.popups').hide();
    });

    $('.layer-btn .edit span').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-2').show();
      centerPopup( $('#popup-2') );
      $(' .balck-overlay ').hide();
    });

    $('.p-3').click(function(){
      
      $('.track-content').html( $('<div/>').text( b.getHTML() ).html() );
      
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-3').show();
      centerPopup( $('#popup-3') );
      $(' .balck-overlay ').show();
    });
    
    $('.p-timeline-title').click(function(){
      $('#project-title').val( b.getProjectDetails( "title" ) );

      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-project-title').show();
      centerPopup( $('#popup-project-title') );
      $('.balck-overlay').hide();
    });
    
    $(".change-title-btn").click( function() {
      var title = $('#project-title').val();
      if ( title.length > 0) {
        b.setProjectDetails("title", title);
        $(".p-timeline-title").html( title );
        $('.close-div').fadeOut('fast');
        $('.popups').hide();
      }
    });

    $('.popup-close-btn, .balck-overlay').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popups').hide();
    });

    //$(function(){ $("label").inFieldLabels(); });

//    $(function() {
//      $( ".draggable" ).draggable();
//    });

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

  }, false);


})();


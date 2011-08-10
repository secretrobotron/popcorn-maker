(function(){

  window.addEventListener("DOMContentLoaded", function(){
    
    var b  = new Butter();

    b.eventeditor( { target: "popup-4", defaultEditor: "lib/popcornMakerEditor.html", editorWidth: "100%", editorHeight: "100%"  } );

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
    
    b.plugintray({ target: "plugin-tray", pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>' });
    b.addPlugin( { type: "image" } );
    b.addPlugin( { type: "footnote" } );
    b.addPlugin( { type: "twitter" } );
    b.addPlugin( { type: "webpage" } );
    b.addPlugin( { type: "subtitle" } );
    b.addPlugin( { type: "googlenews" } );
    
    b.timeline({ target: "timeline-div"});

    //$('.enable-scroll').tinyscrollbar();
    
    b.setProjectDetails("title", "Untitled Project" );
    $(".p-timeline-title").html( "Untitled Project" );
    
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

    document.getElementById( "tracks-div" ).addEventListener( "scroll", function( e ) {

      document.getElementById( "layers-div" ).style.top = -this.scrollTop + "px";
    }, false);

    b.listen( "mediatimeupdate", function() {

      document.getElementById( "scrubber" ).style.left = b.currentTimeInPixels() + "px";
    });
    
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
        console.log(projectToSave);
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
        console.log( "Saving Failed!", e );
      }
    
    });

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

    $('.timeline-heading .edit a').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-1').show();
      $(' .balck-overlay ').hide();
    });

    $('.layer-btn .edit span').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-2').show();
      $(' .balck-overlay ').hide();
    });

    $('.p-3').click(function(){
      
      console.log("sdfsdf", $('<div/>').text( b.getHTML() ).html() );
      $('.track-content').html( $('<div/>').text( b.getHTML() ).html() );
      
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-3').show();
      $(' .balck-overlay ').show();
    });
    
    $('.p-timeline-title').click(function(){
      $('#project-title').val( b.getProjectDetails( "title" ) );

      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-project-title').show();
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

    $(function(){ $("label").inFieldLabels(); });

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

  }, false);


})();


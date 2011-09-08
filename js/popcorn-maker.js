(function(){

  var layouts = [
    "layouts/default.html",
    "layouts/default-basic.html",
    "Other...",
  ],
  currentLayout, currentPreview;

  window.addEventListener("DOMContentLoaded", function() {
  
    $("#properties-panel").css('height','38px');

    $("#properties-panel").css('display','block');

    $(".hide-timeline").css('bottom','36px');	

    $(".hide-timeline").css('display','block');

    $("#properties-panel").animate({

      height: '270px'

    }, 500);

    $(".hide-timeline").animate({

      bottom: '268px'

    }, 500);
    
    
    //if ( !localStorage.getItem( "PopcornMaker.SavedProjects" ) ) {
      $('#welcome-popup').fadeIn(2000);
      $('.popupDiv').fadeIn('slow');
      centerPopup($('#welcome-popup'));
      var escapeKeyEnabled = true;
    //}
      
    $('#loading-overlay').hide();
    //Carousel for Help inner page
		$(function(){
			$('.slides').slides({
				preload: true,
				generateNextPrev: true
			});
		});
		
		//Popup sliding
    $('.import-scroll-toggler').click(function() {
										 
        $(".scroll-popup-container.spc-add-project").animate({
            "margin-left": '-400px'
        }, 750);
    });
    
    $('.import-scroll-back-toggler').click(function() {
										 
        $(".scroll-popup-container.spc-add-project").animate({
            "margin-left": '0px'
        }, 750);
    });
    
    //Popup sliding
    $('.tutorial-btn').click(function() {
										 
        $(this).parent().parent().animate({
            left: '-700px'
        }, 500);

    });
    
    $('.open-help, .help').click(function() {
										 
        $('#popup-add-project').hide();
        $("#help-popup").fadeIn('slow');
        $('.popupDiv').fadeIn('slow');
        $('.balck-overlay').show();
        escapeKeyEnabled = true;

    });
    
    $('.help-close-btn').click(function() {
										 
        $("#help-popup").fadeOut('fast');
        $("#welcome-popup").hide();
        $(".popupDiv").fadeOut("fast");
        $('.balck-overlay').hide();
        escapeKeyEnabled = false;

    });
    
    $('#_user_manual').click(function() {
										 
        $('#popup-add-project').hide();
        $("#help-popup .scroll-popup-container").animate({
            left: '-700px'
        }, 500);

    });

    function buildRegistry( registry ) {
      for( var i = 0, l = registry.length; i < l; i++ ) {
        if( registry[ i ].type !== "text" ) {
          b.addPlugin( { type: registry[ i ].type } );
        }
      } 
    }

    function toggleLoadingScreen ( state ) {
      if ( state ) {
        $('#loading-overlay').show();
      }
      else {
        $('#loading-overlay').hide();
      }
    }

    var layoutSelect = document.getElementById('layout-select');
    for ( var i=0; i<layouts.length; ++i ) {
      var option = document.createElement( 'option' );
      option.value = layouts[ i ];
      option.innerHTML = layouts[ i ];
      option.class = "ddprojects-option";
      layoutSelect.appendChild( option );
    }

    $( "#template-other" ).hide();
    var otherOption = layoutSelect.options[ layoutSelect.options.length - 1 ],
        otherText = $( "#template-other" )[ 0 ];
    layoutSelect.addEventListener( 'change', function( e ) {
      if ( layoutSelect.selectedIndex === otherOption.index ) {
        $( "#template-other" ).show();
      }
      else {
        $( "#template-other" ).hide();
      } //if
    }, false );
    otherText.addEventListener( 'change', function( e ) {
      otherOption.value = otherText.value;
      console.log( otherOption.value );
    }, false );

    currentLayout = layouts[ 0 ];

    var b  = new Butter();
    document.getElementById( "main" ).style.height = window.innerHeight - document.getElementsByTagName( "HEADER" )[ 0 ].clientHeight - 15 + "px";
    b.comm();

    b.eventeditor( { target: "popup-4", defaultEditor: "lib/popcornMakerEditor.html" } );
    
    b.previewer({
      target: "main",
      popcornUrl: "../lib/popcorn-complete.js",
      butterUrl: "../lib/butter.js"
    });

    b.plugintray({ target: "plugin-tray", pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>' });
    
    b.timeline({ target: "timeline-div"});
    b.trackeditor({ target: "popup-5"});

    b.addCustomEditor( "external/layouts/city-slickers/editor.html", "slickers" );
    b.addCustomEditor( "external/layouts/cgg/editor.html", "fkb" );
    b.addCustomEditor( "external/layouts/blackpanthers/editor.html", "googlestreets" );

    b.setProjectDetails("title", "Untitled Project" );
    $(".p-timeline-title").html( "Untitled Project" );
    
    b.listen( "mediaready", function() {
      $(".media-title-div").html( b.currentMedia.url );
    });

    b.listen( "clientdimsupdated", function( e ) {
      var popup4 = $('#popup-4');
      popup4.css( "height", e.data.height + "px" )
      .css("width", e.data.width + "px" );
      $('#butter-editor-iframe')
      .css("height", e.data.height + "px")
      .css("width", e.data.width + "px" );
      centerPopup( popup4 );
      popup4.css("visibility", "visible");
    });
    
    b.listen ( "trackeditstarted", function() {
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow').css("height", "0%").css("width","0%");
      $('.popup-4').show();
      
      
    });
    
    b.listen ( "trackeditclosed", function() {
      $('.close-div').fadeOut('fast');
      $('.popupDiv').hide().css("height", "").css("width","");
      $('popup-4').css("visibility", "hidden")
      .css( "display", "" );
    });

    var scrubber = document.getElementById( "scrubber" );
    var layersDiv = document.getElementById( "layers-div" );
    var scrubberContainer = document.getElementById( "scrubber-container" );
    var tracksDiv = document.getElementById( "tracks-div" );
    var timelineDiv = document.getElementById( "timeline" );
    var progressBar = document.getElementById( "progress-bar" );
    var timelineDuration = document.getElementById( "timeline-duration" );
    var timelineTarget = document.getElementById( "timeline-div" );
    var slideValue = 0;

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

      timelineDuration.innerHTML = b.secondsToSMPTE( b.currentTime );

      scrubber.style.display = "block";
      if ( scrubberLeft >= scrubberContainer.offsetWidth ) {

        tracksDiv.scrollLeft = b.currentTimeInPixels() - scrubberContainer.offsetWidth;
      } else if ( scrubberLeft < 0 ) {

        tracksDiv.scrollLeft = b.currentTimeInPixels();
      }
    });

    var zoom = function( event ) {

      if ( event.shiftKey ) {

        event.preventDefault();
        b.zoom( event.detail || event.wheelDelta );
      }

      var scrubberLeft = checkScrubber( event );

      if ( scrubberLeft - 5 > scrubberContainer.offsetWidth || scrubberLeft < 0 ) {

        scrubber.style.display = "none";
      } else {

        scrubber.style.display = "block";
      }

      drawCanvas();
    };

    timelineDiv.addEventListener( "DOMMouseScroll", zoom, false );
    timelineDiv.addEventListener( "mousewheel", zoom, false );

    tracksDiv.addEventListener( "scroll", function( event ) {

      var scrubberLeft = checkScrubber( event );

      if ( scrubberLeft - 5 > scrubberContainer.offsetWidth || scrubberLeft < 0 ) {

        scrubber.style.display = "none";
      } else {

        scrubber.style.display = "block";
      }

      document.getElementById( "timing-notches-canvas" ).style.left = -tracksDiv.scrollLeft + "px";
    }, false );

    var scrubberClicked = false;

    scrubberContainer.addEventListener( "mousedown", function( event ) {

      scrubberClicked = true;
      b.targettedEvent = undefined;
      b.currentTimeInPixels( event.clientX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft );
    }, false);

    document.addEventListener( "mouseup", function( event ) {

      scrubberClicked = false;
    }, false);

    document.addEventListener( "mousemove", function( event ) {

      if ( scrubberClicked ) {

        var scrubberPos = event.pageX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft;

        if ( scrubberPos <= 0 ) {

          b.currentTimeInPixels( 0 );
        } else if ( scrubberPos >= timelineTarget.offsetWidth ) {

          b.currentTimeInPixels( timelineTarget.offsetWidth );
        } else {

          b.currentTimeInPixels( scrubberPos );
        }
      }
    }, false);

    b.listen( "mediatimeupdate", function() {

      scrubber.style.left = b.currentTimeInPixels() - tracksDiv.scrollLeft + "px";
    });

    var drawCanvas = function() {
      var canvasDiv = document.getElementById( "timing-notches-canvas" );
      canvasDiv.style.width = timelineTarget.style.width;

      var context = canvasDiv.getContext( "2d" );

      canvasDiv.height = canvasDiv.offsetHeight;
      canvasDiv.width = canvasDiv.offsetWidth;

      var inc = canvasDiv.offsetWidth / b.duration,
          //heights = [ 10, 4, 7, 4 ],
          textWidth = context.measureText( b.secondsToSMPTE( 5 ) ).width,
          padding = 20,
          lastPosition = 0,
          lastTimeDisplayed = -( ( textWidth + padding ) / 2 );

      context.clearRect ( 0, 0, canvasDiv.width, canvasDiv.height );

      context.beginPath();

      for ( var i = 1, l = b.duration; i < l; i++ ) {

        var position = i * inc;
        var spaceBetween = -~( position ) - -~( lastPosition );

        // ensure there is enough space to draw a seconds tick
        if ( spaceBetween > 3 ) {

          // ensure there is enough space to draw a half second tick
          if ( spaceBetween > 6 ) {

            context.moveTo( -~position - spaceBetween / 2, 0 );
            context.lineTo( -~position - spaceBetween / 2, 7 );

            // ensure there is enough space for quarter ticks
            if ( spaceBetween > 12 ) {

              context.moveTo( -~position - spaceBetween / 4 * 3, 0 );
              context.lineTo( -~position - spaceBetween / 4 * 3, 4 );

              context.moveTo( -~position - spaceBetween / 4, 0 );
              context.lineTo( -~position - spaceBetween / 4, 4 );

            }
          }
          context.moveTo( -~position, 0 );
          context.lineTo( -~position, 10 );

          if ( ( position - lastTimeDisplayed ) > textWidth + padding ) {

            lastTimeDisplayed = position;
            context.fillText( b.secondsToSMPTE( i ), -~position - ( textWidth / 2 ), 21 );
          }

          lastPosition = position;
        }
      }
      context.stroke();
      context.closePath();
    };

    b.listen( "timelineready", function( event ) {

      drawCanvas();
    });

      $( "#slider" ).slider({
			value:0,
			min: 0,
			max: 6,
			step: 1,
			slide: function( event, ui ) {
        b.zoom( slideValue - ui.value );
        drawCanvas();
        slideValue = ui.value;
			}
		});

    document.addEventListener( "keypress", function( event ) {

      var inc = event.shiftKey ? 1 : 0.1;

      if( event.keyCode === 39 ) {
        if ( b.targettedEvent ) {

          b.moveFrameRight( event );
        } else {

          b.currentTime = b.currentTime + inc;
        }
      } else if( event.keyCode === 37 ) {
        if ( b.targettedEvent ) {

          b.moveFrameLeft( event );
        } else {

          b.currentTime = b.currentTime - inc;
        }
      }
    }, false);

    var trackLayers = {};
    var editTrackTargets =  document.getElementById( "track-edit-target" );
    var trackJSONtextArea = document.getElementById( "track-edit-JSON" );

    var createLayer = function( track ) {

      var layerDiv = document.createElement( "div" );
      layerDiv.id = "layer-" + track.id;
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
        $('.close-div').fadeOut('fast');
        $('.popupDiv').fadeIn('slow');
        $('#popup-delete-track').show();
        $('#deleteTrackBtn').click(function(){
          b.removeTrack( track );
          $('#popup-delete-track').hide();
        });
        centerPopup( $('#popup-delete-track') );
        $('.balck-overlay').hide();
      }, false );

      editButton.addEventListener( "click", function( click ) {

        editTrackTargets.innerHTML = "<option value=\"\">Media Element (if applicable)</option>";

        var targets = b.serializeTargets();

        for ( var i = 0; i < targets.length; i++ ) {

          editTrackTargets.innerHTML += "<option value=\"" + targets[ i ].name + "\">" + targets[ i ].name + "</option>";
        }

        var editor = new b.TrackEditor( track );
        trackJSONtextArea.value = editor.json;
        editTrackTargets.value = editor.target;

        //$('.close-div').fadeOut('fast');
        $('.popupDiv').fadeIn( 200 ).css("height", "100%").css("width","100%");
        $('#popup-5').show();
        $(' .balck-overlay ').show();
        centerPopup( $('#popup-5') );

        var closeTrackEditor = function() {
          $('.popupDiv').fadeOut( 200 ).css("height", "").css("width","");
          $('#popup-5').fadeOut( 200 );
          //$(' .balck-overlay ').delay( 200 ).hide();
          document.getElementById( "cancel-track-edit" ).removeEventListener( "click", clickCancel, false );
          document.getElementById( "apply-track-edit" ).removeEventListener( "click", clickApply, false );
          document.getElementById( "ok-track-edit" ).removeEventListener( "click", clickOk, false );
          document.getElementById( "delete-track-edit" ).removeEventListener( "click", clickDelete, false );
          document.getElementById( "clear-track-edit" ).removeEventListener( "click", clickClear, false );
          trackJSONtextArea.removeEventListener( "change", changeTarget, false );
        }; //closeTrackEditor

        var applyTrackEditor = function() {
          editor.target = editTrackTargets.value;
        }; //applyTrackEditor

        function clickCancel( e ) { 
          closeTrackEditor(); 
        }
        function clickOk( e ) { 
          applyTrackEditor();
          closeTrackEditor();
        }
        function clickApply( e ) { 
          applyTrackEditor(); 
        }
        function clickDelete( e ) { 
          editor.remove();
          closeTrackEditor();
        }
        function clickClear( e ) { 
          trackJSONtextArea.value = "";
          editor.clear();
        }
        function clickEdit( e ) { 
          closeTrackEditor(); 
        }
        function changeTarget( e) { 
          b.setTrackJSON( this.value );
        }

        document.getElementById( "cancel-track-edit" ).addEventListener( "click", clickCancel, false );
        document.getElementById( "apply-track-edit" ).addEventListener( "click", clickApply, false );
        document.getElementById( "ok-track-edit" ).addEventListener( "click", clickOk, false );
        document.getElementById( "delete-track-edit" ).addEventListener( "click", clickDelete, false );
        document.getElementById( "clear-track-edit" ).addEventListener( "click", clickClear, false );
        trackJSONtextArea.addEventListener( "change", changeTarget, false );

      }, false );

      ulist.appendChild( pointerBubble );
      ulist.appendChild( editButton );
      ulist.appendChild( deleteButton );

      layerDiv.appendChild( ulist );

      return layerDiv;
    };

    b.listen( "trackadded", function( event ) {

      trackLayers[ "layer-" + event.data.id ] = createLayer( event.data );
      layersDiv.appendChild( trackLayers[ "layer-" + event.data.id ] );
    });

    b.listen( "trackremoved", function( event ) {

      layersDiv.removeChild( trackLayers[ "layer-" + event.data.id ] );
    });

    b.listen( "trackmoved", function( event ) {

      layersDiv.removeChild( trackLayers[ "layer-" + event.data.id ] );
      layersDiv.insertBefore( trackLayers[ "layer-" + event.data.id ], layersDiv.children[ event.data.newPos ] );
    });

    document.addEventListener( "keypress", function( event ) {

      if ( event.charCode === 32 ) {

        event.preventDefault();
        currentPreview.playing ? currentPreview.pause() : currentPreview.play();
      }
    }, false );

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
    
    create_msDropDown()

    $(".save-project-data-btn").click(function(){
      
      try {
        var projectToSave = b.exportProject(),
        overwrite = false,  
        title;

        projectToSave.layout = currentLayout;
        
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
    
    });

    document.getElementsByClassName( "sound-btn" )[ 0 ].addEventListener( "mousedown", function( event ) {
      b.mute && b.mute();
    }, false);

    document.getElementsByClassName( "play-btn" )[ 0 ].addEventListener( "mousedown", function( event ) {
      currentPreview.playing ? currentPreview.pause() : currentPreview.play();
    }, false);

    b.listen( "mediapaused", function( event ) {
      document.getElementsByClassName( "play-btn" )[ 0 ].children[ 0 ].children[ 0 ].style.backgroundPosition = "-321px -19px";
    } );

    b.listen( "mediaplaying", function( event ) {
      document.getElementsByClassName( "play-btn" )[ 0 ].children[ 0 ].children[ 0 ].style.backgroundPosition = "-322px 7px";
    } );
    
    $('.add-project-btn').click(function() {
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-add-project').show();
      centerPopup( $('#popup-add-project') );
      $(' .balck-overlay ').show();
      escapeKeyEnabled = true;
    });  
    $('.wizard-add-project-btn').click(function() {
      $("#help-popup").fadeOut('fast');
      $("#welcome-popup").hide();
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-add-project').show();
      centerPopup( $('#popup-add-project') );
      $(' .balck-overlay ').show();
      escapeKeyEnabled = true;
    });
    
    $('.wizard-create-new-btn').click(function() {
      $("#help-popup").fadeOut('fast');
      $("#welcome-popup").hide();
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-add-project').show();
      centerPopup( $('#popup-add-project') );
      $(' .balck-overlay ').show();
      escapeKeyEnabled = true;
    });

    $(".collapse-btn").toggle(function() {

      $('.collapse-btn a').css('backgroundPosition','-330px -152px');
      $(".toolbox").animate({ width: "46px" }, 500);
      $('.collapse-btn a').text("");
      $(".timeline").stop().animate({ paddingRight:'86px'}, 500);
      $(".qtip").hide();

      },function() {

        $('.collapse-btn a').css('backgroundPosition','-330px -167px');
        $(".toolbox").animate({ width: "120px" }, 500);
        $('.collapse-btn a').text("collapse"); 
        $(".timeline").stop().animate({ paddingRight:'160px'}, 500);

    });

    $(".hide-timeline a").toggle(function() {

      $(this).css('backgroundPosition','-239px -7px');
      $(".hide-timeline").animate({ bottom: '36px' }, 500);
      $("#properties-panel").animate({ height: '38px' }, 500);
      $(this).text("Show Timeline"); 

    },function() {

      $(this).css('backgroundPosition','-239px 10px');
      $(this).text("Hide Timeline"); 
      $(".hide-timeline").animate({ bottom: "268px" }, 500);
      $("#properties-panel").animate({ height: "270px" }, 500);
    });

    $(".play-btn a").toggle(function() {
      //$(".play-btn a span").css('backgroundPosition','0 -25px');
    },function() {
      //$(".play-btn a span").css('backgroundPosition','0 0');
    });

    $(".sound-btn a").toggle(function() {
      $(".sound-btn a span").css('backgroundPosition','-109px -157px');
    },function() {
      $(".sound-btn a span").css('backgroundPosition','-109px -141px');
    });

    $('li.edit a.edit-timeline-media').click(function(){
      $('#url').val( b.currentMedia.url );
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-1').show();
      centerPopup( $('#popup-1') );
      $(' .balck-overlay ').hide();
      escapeKeyEnabled = true;
    });
    
    $('.change-url-btn').click(function(){
      $(".media-title-div").html( $('#url').val() );
      b.currentMedia.url = ( $('#url').val() );
      $('.close-div').fadeOut('fast');
      $('.popups').hide();
      escapeKeyEnabled = false;
    });

    $('.layer-btn .edit span').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-2').show();
      centerPopup( $('#popup-2') );
      $(' .balck-overlay ').hide();
    });

    $('.p-3').click(function(){
      currentPreview.fetchHTML( function( html ) {
        $('#export-data').val( html );
        $('.project-title-textbox').val( b.getProjectDetails( "title" ) );
        $('.close-div').fadeOut('fast');
        $('.popupDiv').fadeIn('slow');
        $('#popup-3').show();
        $('#popup-add-project').hide();
        centerPopup( $('#popup-3') );
        $(' .balck-overlay ').show();
        escapeKeyEnabled = true;
      });
    });
    
    $('.edit-selected-project').click(function(){
      if ( projectsDrpDwn[0].selectedIndex > 0 ) {
        $('#project-title').val( $( ".projects-dd" ).val() );

        $('.close-div').fadeOut('fast');
        $('.popupDiv').fadeIn('slow');
        $('#popup-project-title').show();
        centerPopup( $('#popup-project-title') );
        $('.balck-overlay').hide();
        escapeKeyEnabled = true;
      }
    });
    
    $(".change-title-btn").click( function() {
      var newTitle = $('#project-title').val(),
        oldTitle = $( ".projects-dd" ).val(),
        idx = projectsDrpDwn[0].selectedIndex,
        selectedOpt,
        targetProject;

      if ( newTitle.length > 0) {
        localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
    
        localProjects = localProjects ? JSON.parse( localProjects ) : localProjects;
        
        ( b.getProjectDetails ( "title" ) === newTitle ) && b.setProjectDetails ( "title", newTitle );
        
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
    });

    $('.popup-close-btn').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popups').hide();
      escapeKeyEnabled = false;
    });
    
    var ddLoadFunc = function() {
      var title = projectsDrpDwn.val();
      localProjects = localStorage.getItem( "PopcornMaker.SavedProjects" );
      localProjects = localProjects ? JSON.parse( localProjects ) : undefined;
      if ( projectsDrpDwn[0].selectedIndex > 0 && localProjects[ title ] ) {
        $('.close-div').fadeOut('fast');
        $('.popupDiv').fadeIn('slow');
        $('#load-confirmation-dialog').show();
        centerPopup( $('#load-confirmation-dialog') );
        $('.balck-overlay').show();
        escapeKeyEnabled = true;
      }
    };
    
    $(".projects-dd").change(ddLoadFunc);

    $(".confirm-load-btn").click(function() {
      var title = projectsDrpDwn.val();

      if ( localProjects && localProjects[ title ] ) {
        b.clearProject();         
        b.clearPlugins();
        currentLayout = localProjects[ title ].layout;
        console.log( localProjects[ title ] );

        toggleLoadingScreen( true );
        $('.close-div').fadeOut('fast');
        $('.popups').hide();
        $('balck-overlay').show()
        escapeKeyEnabled = false;

        currentPreview = new b.Preview({
          template: currentLayout,
          defaultMedia: document.getElementById( 'media-url' ).value,
          importData: localProjects[ title ],
          onload: function( preview ) {
            buildRegistry( b.currentMedia.registry );
            $('.tiny-scroll').tinyscrollbar();
            toggleLoadingScreen( false );
          } //onload
        }); //Preview
      } //if
    });
    
    $(".create-new-btn").click(function() {
      $("#welcome-popup, #help-popup, #popup-add-project").hide();
      b.clearProject();
      b.clearPlugins();
      b.setProjectDetails( "title", ( $( "title-input-box" ).val() || "Untitled Project" ) );
      currentLayout = document.getElementById( 'layout-select' ).value;
      toggleLoadingScreen( true );
      currentPreview = new b.Preview({
        template: currentLayout,
        defaultMedia: document.getElementById('timeline-media-input-box').value,
        onload: function( preview ) {
          buildRegistry( b.currentMedia.registry );
          $('.tiny-scroll').tinyscrollbar();
          toggleLoadingScreen( false );
        } //onload
      }); //Preview
      $('.close-div').fadeOut('fast');
      $('.popups').hide();
      escapeKeyEnabled = false;
    });
    
    $("#import-json-btn").click(function() {
      var dataString = $("#import-json-area").val();
      if ( dataString ) {
      
        try {
          var data = JSON.parse( dataString );
          $("#welcome-popup").hide();
          $("#help-popup").hide();
          b.clearProject(); 
          b.clearPlugins();
          currentLayout = data.layout ? data.layout : layouts[ 0 ];
          toggleLoadingScreen( true );
          $('.close-div').fadeOut('fast');
          $('.popups').hide();
          escapeKeyEnabled = false;

          currentPreview = new b.Preview({
            template: currentLayout,
            defaultMedia: document.getElementById( 'timeline-media-input-box' ).value,
            importData: data,
            onload: function( preview ) {
              buildRegistry( b.currentMedia.registry );
              $('.tiny-scroll').tinyscrollbar();
              toggleLoadingScreen( false );
            } //onload
          }); //Preview
          return;
        }
        catch ( e ) {
          console.log ( "Error Loading in Data", e );
        }
      }
    });
    
    $(".show-json-btn").click(function() {
      var exp = b.exportProject();
      exp.layout = currentLayout;
      $('#export-data').val( JSON.stringify( exp ) );
    });

    $(".show-html-btn").click(function() {
      currentPreview.fetchHTML( function( html ) {
        $('#export-data').val( html );
      });
    });
    
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

    $(window).keypress( function ( event ) {
      if ( event.keyCode === 27 && escapeKeyEnabled ) {
        $('.close-div').fadeOut('fast');
        $('.popups').hide();
        $("#help-popup").fadeOut('fast');
        $("#welcome-popup").hide();
        $('.balck-overlay').hide();
        escapeKeyEnabled = false;
      }
    });
  }, false);


})();


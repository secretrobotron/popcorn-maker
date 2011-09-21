(function(){

  var LAYOUTS_DIR = "./layouts",
      TEMPLATES_CONFIG = LAYOUTS_DIR + "/conf.json",
      PACKAGE_SERVER_ADDR = "http://localhost:8888";

  var currentTemplate, currentPreview;
  
  var getJSON = function( src, successCallback, errorCallback ) {
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

  function Template ( root ) {
    var manifest = getJSON( LAYOUTS_DIR + "/" + root + "/manifest.json" );
    var name = manifest.title || root;
    var thumbnail = new Image();
    if ( manifest.thumbnail ) {
      thumbnail.src = LAYOUTS_DIR + "/" + root + "/" + manifest.thumbnail;
    }
    var template = manifest.template || "index.html";
    Object.defineProperty( this, "title", { get: function() { return name; } });
    Object.defineProperty( this, "thumbnail", { get: function() { return thumbnail; } });
    Object.defineProperty( this, "template", { get: function() { return LAYOUTS_DIR + "/" + root + "/" + template; } });
    Object.defineProperty( this, "root", { get: function() { return root } } );
  } //Template

  function TemplateManager ( options ) {
    var templates = [],
        templateList = getJSON( options.config );
    for ( var i=0; i<templateList.length; ++i ) {
      templates.push( new Template( templateList[ i ] ) );
    } //for

    Object.defineProperty( this, "templates", { get: function() { return templates; } } );

    this.find = function( options ) {
      for ( var i=0; i<templates.length; ++i ) {
        if (  templates[ i ].title === options ||
              templates[ i ].title === options.title ||
              templates[ i ].template === options.template ||
              templates[ i ].root === options.root ) {
          return templates[ i ];
        } //if
      } //for
      return;
    }; //find

    var select = document.getElementById( options.container ),
        thumbnailContainer = $( "#template-thumbnail" );

    function showThumbnail( img ) {
      thumbnailContainer.html("");
      thumbnailContainer.append( $( img ) );
    } //showThumbnail

    showThumbnail( templates[ 0 ].thumbnail );

    this.buildList = function() {
      function createOption( value, innerHTML ) {
        var option = document.createElement( 'option' );
        option.value = value;
        option.innerHTML = innerHTML;
        option.class = "ddprojects-option";
        return option;
      }

      for ( var i=0; i<templates.length; ++i ) {
        select.appendChild( createOption( templates[ i ].template, templates[ i ].title ) );
      }
      select.appendChild( createOption( "-1", "Ohter..." ) );
      
      $( "#template-other" ).hide();
      var otherOption = select.options[ select.options.length - 1 ],
          otherText = $( "#template-other" )[ 0 ];
      select.addEventListener( 'change', function( e ) {
        if ( select.selectedIndex === otherOption.index ) {
          $( "#template-other" ).show();
        }
        else {
          for ( var i=0; i<templates.length; ++i ) {
            if ( templates[ i ].template === select.options[ select.selectedIndex ].value ) {
              showThumbnail( templates[ i ].thumbnail );
              break;
            }
          }
          $( "#template-other" ).hide();
        } //if
      }, false );
      otherText.addEventListener( 'change', function( e ) {
        otherOption.value = otherText.value;
      }, false );
    }; //buildList

  } //TemplateManager

  var ui = {
    panels: {
    },
    timeline: {
    },
    popups: {
    },
    overlays: {
    }
  }; //panels

  function PopupManager() {

    var popups = [],
        escapeKeyEnabled;

    this.addPopup = function( name, id ) {
      ui.popups[ name ] = $( id );
      popups.push( ui.popups[ name ] );
    }; //addPopup

    this.hidePopups = function() {
      for ( var i=0; i<popups.length; ++i ) {
        popups[ i ].hide();
      } //for
      $(".popupDiv").fadeOut("fast");
      $('.close-div').fadeOut('fast');
      $('.balck-overlay').hide();
      escapeKeyEnabled = false;
    }; //hidePopups

    this.showPopup = function( name ) {
      var popup = ui.popups[ name ];
      popup.fadeIn( 2000 );
      $('.popupDiv').fadeIn('slow');
      $('.balck-overlay').show();
      popup.css( "margin-left", ( window.innerWidth / 2 ) - ( popup[0].clientWidth / 2 ) );
      escapeKeyEnabled = true;
    }; //showPopup

    this.hidePopup = function( name ) {
      var popup = ui.popups[ name ];
      popup.fadeOut('fast');
      $(".popupDiv").fadeOut("fast");
      $('.balck-overlay').hide();
      escapeKeyEnabled = false;
    }; //hidePopup

    $(window).keypress( function ( event ) {
      if ( event.keyCode === 27 && escapeKeyEnabled ) {
        that.hidePopups();
      }
    });

  } //PopupManager

  function TimelineManager() {
    this.showTools = function() {
      ui.panels.properties.animate({
        height: '270px'
      }, 500);

      ui.timeline.hide.animate({
        bottom: '268px'
      }, 500);
    }; //show
  } //TimelineManager

  window.addEventListener("DOMContentLoaded", function() {

    Butter.Logger.logFunction = function( logMessage ) {
      console.log( "From Butter", logMessage );
    };
    var butter = new Butter();
	
    function buildRegistry( registry ) {
      for( var i = 0, l = registry.length; i < l; i++ ) {
        if( registry[ i ].type !== "text" ) {
          butter.addPlugin( { type: registry[ i ].type } );
        }
      } 
    } //buildRegistry

    function toggleLoadingScreen ( state ) {
      if ( state ) {
        ui.overlays.loading.show();
      }
      else {
        ui.overlays.loading.hide();
      }
    } //toggleLoadingScreen

    var templateManager = new TemplateManager({
      config: TEMPLATES_CONFIG,
      container: "layout-select"
    });
    templateManager.buildList();

    var popupManager = new PopupManager();
    popupManager.addPopup( "captcha", "#captcha-popup" );
    popupManager.addPopup( "welcome", "#welcome-popup" );
    popupManager.addPopup( "help", "#help-popup" );
    popupManager.addPopup( "save", "#save-popup" );
    popupManager.addPopup( "add-project", "#add-project-popup" );
    popupManager.addPopup( "project-title", "#project-title-popup" );
    popupManager.addPopup( "change-media", "#change-media-popup" );
    popupManager.addPopup( "edit-track", "#edit-track-popup" );
    popupManager.hidePopups();

    ui.panels.properties = $( "#properties-panel" );
    ui.overlays.loading = $( "#loading-overlay" );
    ui.timeline.hide = $( ".hide-timeline" );
    
    ui.panels.properties.css( 'height','38px' );
    ui.panels.properties.css( 'display','block' );
    ui.timeline.hide.css( 'bottom', '36px' );	
    ui.timeline.hide.css( 'display', 'block' );
   
    popupManager.showPopup( "welcome" );
      
    ui.overlays.loading.hide();

    var timelineManager = new TimelineManager();
    timelineManager.showTools(); 
	
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
    $('.tutorial-btn').click(function() {
      $(this).parent().parent().animate({
        left: '-700px'
      }, 500);
    });
    
    $('.open-help, .help').click(function() {
      popupManager.hidePopups();
      popupManager.showPopup( "help" );
    });
    
    $('.help-close-btn').click(function() {
			popupManager.hidePopup( "help" );							 
    });
    
    $('#_user_manual').click(function() {
      $('#popup-add-project').hide();
      $("#help-popup .scroll-popup-container").animate({
        left: '-700px'
      }, 500);
    });

    document.getElementById( "main" ).style.height = window.innerHeight - document.getElementsByTagName( "HEADER" )[ 0 ].clientHeight - 15 + "px";
    butter.comm();

    butter.eventeditor( { target: "popup-4", defaultEditor: "lib/popcornMakerEditor.html" } );
    
    butter.previewer({
      target: "main",
      popcornUrl: "../lib/popcorn-complete.js",
      butterUrl: Butter.getScriptLocation() + "butter.js"
    });

    butter.plugintray({ target: "plugin-tray", pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>' });
    
    butter.timeline({ target: "timeline-div"});
    butter.trackeditor({ target: "popup-5"});

    butter.addCustomEditor( "external/layouts/city-slickers/editor.html", "slickers" );
    butter.addCustomEditor( "external/layouts/cgg/editor.html", "fkb" );
    butter.addCustomEditor( "external/layouts/blackpanthers/editor.html", "googlestreets" );

    butter.setProjectDetails("title", "Untitled Project" );
    $(".p-timeline-title").html( "Untitled Project" );
    
    butter.listen( "mediaready", function() {
      $(".media-title-div").html( butter.currentMedia.url );
    });

    butter.listen( "clientdimsupdated", function( e ) {
      var popup4 = $('#popup-4');
      popup4.css( "height", e.data.height + "px" )
      .css("width", e.data.width + "px" );
      $('#butter-editor-iframe')
      .css("height", e.data.height + "px")
      .css("width", e.data.width + "px" );
      centerPopup( popup4 );
      popup4.css("visibility", "visible");
    });
    
    butter.listen ( "trackeditstarted", function() {
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow').css("height", "0%").css("width","0%");
      $('.popup-4').show();
      
      
    });
    
    butter.listen ( "trackeditclosed", function() {
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
      scrubber.style.left = -tracksDiv.scrollLeft + butter.currentTimeInPixels() + "px";
      progressBar.style.width = -tracksDiv.scrollLeft + butter.currentTimeInPixels() + "px";

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

    butter.listen( "mediatimeupdate", function( event ) {

      var scrubberLeft = checkScrubber( event );

      timelineDuration.innerHTML = butter.secondsToSMPTE( butter.currentTime );

      scrubber.style.display = "block";
      if ( scrubberLeft >= scrubberContainer.offsetWidth ) {

        tracksDiv.scrollLeft = butter.currentTimeInPixels() - scrubberContainer.offsetWidth;
      } else if ( scrubberLeft < 0 ) {

        tracksDiv.scrollLeft = butter.currentTimeInPixels();
      }
    });

    var zoom = function( event ) {

      if ( event.shiftKey ) {

        event.preventDefault();
        butter.zoom( event.detail || event.wheelDelta );
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
      butter.targettedEvent = undefined;
      butter.currentTimeInPixels( event.clientX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft );
    }, false);

    document.addEventListener( "mouseup", function( event ) {

      scrubberClicked = false;
    }, false);

    document.addEventListener( "mousemove", function( event ) {

      if ( scrubberClicked ) {

        var scrubberPos = event.pageX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft;

        if ( scrubberPos <= 0 ) {

          butter.currentTimeInPixels( 0 );
        } else if ( scrubberPos >= timelineTarget.offsetWidth ) {

          butter.currentTimeInPixels( timelineTarget.offsetWidth );
        } else {

          butter.currentTimeInPixels( scrubberPos );
        }
      }
    }, false);

    butter.listen( "mediatimeupdate", function() {

      scrubber.style.left = butter.currentTimeInPixels() - tracksDiv.scrollLeft + "px";
    });

    var drawCanvas = function() {
      var canvasDiv = document.getElementById( "timing-notches-canvas" );
      canvasDiv.style.width = timelineTarget.style.width;

      var context = canvasDiv.getContext( "2d" );

      canvasDiv.height = canvasDiv.offsetHeight;
      canvasDiv.width = canvasDiv.offsetWidth;

      var inc = canvasDiv.offsetWidth / butter.duration,
          //heights = [ 10, 4, 7, 4 ],
          textWidth = context.measureText( butter.secondsToSMPTE( 5 ) ).width,
          padding = 20,
          lastPosition = 0,
          lastTimeDisplayed = -( ( textWidth + padding ) / 2 );

      context.clearRect ( 0, 0, canvasDiv.width, canvasDiv.height );

      context.beginPath();

      for ( var i = 1, l = butter.duration; i < l; i++ ) {

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
            context.fillText( butter.secondsToSMPTE( i ), -~position - ( textWidth / 2 ), 21 );
          }

          lastPosition = position;
        }
      }
      context.stroke();
      context.closePath();
    };

    butter.listen( "timelineready", function( event ) {

      drawCanvas();
    });

      $( "#slider" ).slider({
			value:0,
			min: 0,
			max: 6,
			step: 1,
			slide: function( event, ui ) {
        butter.zoom( slideValue - ui.value );
        drawCanvas();
        slideValue = ui.value;
			}
		});

    document.addEventListener( "keypress", function( event ) {

      var inc = event.shiftKey ? 1 : 0.1;

      if( event.keyCode === 39 ) {
        if ( butter.targettedEvent ) {

          butter.moveFrameRight( event );
        } else {

          butter.currentTime = butter.currentTime + inc;
        }
      } else if( event.keyCode === 37 ) {
        if ( butter.targettedEvent ) {

          butter.moveFrameLeft( event );
        } else {

          butter.currentTime = butter.currentTime - inc;
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
          butter.removeTrack( track );
          $('#popup-delete-track').hide();
        });
        centerPopup( $('#popup-delete-track') );
        $('.balck-overlay').hide();
      }, false );

      editButton.addEventListener( "click", function( click ) {

        editTrackTargets.innerHTML = "<option value=\"\">Media Element (if applicable)</option>";

        var targets = butter.serializeTargets();

        for ( var i = 0; i < targets.length; i++ ) {

          editTrackTargets.innerHTML += "<option value=\"" + targets[ i ].name + "\">" + targets[ i ].name + "</option>";
        }

        var editor = new butter.TrackEditor( track );
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
          butter.setTrackJSON( this.value );
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

    butter.listen( "trackadded", function( event ) {

      trackLayers[ "layer-" + event.data.id ] = createLayer( event.data );
      layersDiv.appendChild( trackLayers[ "layer-" + event.data.id ] );
    });

    butter.listen( "trackremoved", function( event ) {

      layersDiv.removeChild( trackLayers[ "layer-" + event.data.id ] );
    });

    butter.listen( "trackmoved", function( event ) {

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

    $(".publish-project-btn").click(function(){
      currentPreview.fetchHTML( function( html ) {
        popupManager.hidePopups();
        popupManager.showPopup( "captcha" );
        var container = $( "#captcha-popup" )[ 0 ];
        container.innerHTML = "";
        var iframe = document.createElement( "iframe" );
        iframe.setAttribute( "scrolling", "no" );
        iframe.src = PACKAGE_SERVER_ADDR + "/captcha?butter_template=" + currentTemplate.root;
        container.appendChild( iframe );
      });
    });

    $(".save-project-data-btn").click(function(){
      
      try {
        var projectToSave = butter.exportProject(),
        overwrite = false,  
        title;

        projectToSave.template = currentTemplate.root;
        
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
      butter.mute && butter.mute();
    }, false);

    document.getElementsByClassName( "play-btn" )[ 0 ].addEventListener( "mousedown", function( event ) {
      currentPreview.playing ? currentPreview.pause() : currentPreview.play();
    }, false);

    butter.listen( "mediapaused", function( event ) {
      document.getElementsByClassName( "play-btn" )[ 0 ].children[ 0 ].children[ 0 ].style.backgroundPosition = "-321px -19px";
    } );

    butter.listen( "mediaplaying", function( event ) {
      document.getElementsByClassName( "play-btn" )[ 0 ].children[ 0 ].children[ 0 ].style.backgroundPosition = "-322px 7px";
    } );
    
    $('.add-project-btn').click(function() {
      popupManager.hidePopups();
      popupManager.showPopup( "add-project" );
    });  
    $('.wizard-add-project-btn').click(function() {
      popupManager.hidePopups();
      popupManager.showPopup( "add-project" );
    });
    $('.wizard-create-new-btn').click(function() {
      popupManager.hidePopups();
      popupManager.showPopup( "add-project" );
    });

    $(".collapse-btn").toggle(
      function() {
        $('.collapse-btn a').css('backgroundPosition','-330px -152px');
        $(".toolbox").animate({ width: "46px" }, 500);
        $('.collapse-btn a').text("");
        $(".timeline").stop().animate({ paddingRight:'86px'}, 500);
        $(".qtip").hide();
      },
      function() {
        $('.collapse-btn a').css('backgroundPosition','-330px -167px');
        $(".toolbox").animate({ width: "120px" }, 500);
        $('.collapse-btn a').text("collapse"); 
        $(".timeline").stop().animate({ paddingRight:'160px'}, 500);
      }
    );

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
      $('#url').val( butter.currentMedia.url );
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-1').show();
      centerPopup( $('#popup-1') );
      $(' .balck-overlay ').hide();
      escapeKeyEnabled = true;
    });
    
    $('.change-url-btn').click(function(){
      $(".media-title-div").html( $('#url').val() );
      butter.currentMedia.url = ( $('#url').val() );
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
        $('.project-title-textbox').val( butter.getProjectDetails( "title" ) );
        popupManager.showPopup( "save" );
      });
    });
    
    $('.edit-selected-project').click(function(){
      if ( projectsDrpDwn[0].selectedIndex > 0 ) {
        $('#project-title').val( $( ".projects-dd" ).val() );
        popupManager.showPopup( "project-title" );
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
    });

    $('.popup-close-btn').click(function(){
      popupManager.hidePopups();
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
        butter.clearProject();         
        butter.clearPlugins();
        currentTemplate = templateManager.find( { root: localProjects[ title ].template } );
        console.log( localProjects[ title ] );

        toggleLoadingScreen( true );
        popupManager.hidePopups();

        currentPreview = new butter.Preview({
          template: currentTemplate.template,
          defaultMedia: document.getElementById( 'media-url' ).value,
          importData: localProjects[ title ],
          onload: function( preview ) {
            buildRegistry( butter.currentMedia.registry );
            $('.tiny-scroll').tinyscrollbar();
            toggleLoadingScreen( false );
          } //onload
        }); //Preview
      } //if
    });
    
    $(".create-new-btn").click(function() {
      $("#welcome-popup, #help-popup, #popup-add-project").hide();
      butter.clearProject();
      butter.clearPlugins();
      butter.setProjectDetails( "title", ( $( "title-input-box" ).val() || "Untitled Project" ) );
      currentTemplate = templateManager.find( { template: document.getElementById( 'layout-select' ).value } );
      toggleLoadingScreen( true );
      currentPreview = new butter.Preview({
        template: currentTemplate.template,
        defaultMedia: document.getElementById('timeline-media-input-box').value,
        onload: function( preview ) {
          buildRegistry( butter.currentMedia.registry );
          $('.tiny-scroll').tinyscrollbar();
          toggleLoadingScreen( false );
        } //onload
      }); //Preview
      popupManager.hidePopups();
    });
    
    $("#import-json-btn").click(function() {
      var dataString = $("#import-json-area").val();
      if ( dataString ) {
      
        try {
          var data = JSON.parse( dataString );
          popupManager.hidePopups();
          butter.clearProject(); 
          butter.clearPlugins();
          currentTemplate = templateManager.find( { root: data.template } ) || templateManager.templates[ 0 ];
          toggleLoadingScreen( true );

          currentPreview = new butter.Preview({
            template: currentTemplate.template,
            defaultMedia: document.getElementById( 'timeline-media-input-box' ).value,
            importData: data,
            onload: function( preview ) {
              buildRegistry( butter.currentMedia.registry );
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
      var exp = butter.exportProject();
      exp.template = currentTemplate.root;
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

  }, false);


})();


(function() {
  define( [], function() {

    var Timeline = function( pm ) {

      var butter = pm.butter,
          popupManager = pm.popupManager;

      var propertiesPanel = $( "#properties-panel" ),
          hideTimelineDiv = $( ".hide-timeline" );
   
      hideTimelineDiv.css( 'bottom', '36px' );	
      hideTimelineDiv.css( 'display', 'block' );
      propertiesPanel.css( 'height','38px' );
      propertiesPanel.css( 'display','block' );

      this.showTools = function() {
        propertiesPanel.animate({
          height: '270px'
        }, 500);

        hideTimelineDiv.animate({
          bottom: '268px'
        }, 500);
      }; //show

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

      $(".sound-btn a").toggle(function() {
        $(".sound-btn a span").css('backgroundPosition','-109px -157px');
      },function() {
        $(".sound-btn a span").css('backgroundPosition','-109px -141px');
      });

      $('li.edit a.edit-timeline-media').click(function(){
        pm.popupManager.hidePopups();
        $('#url').val( pm.butter.currentMedia.url );
        pm.popupManager.showPopup( "change-media" );
      });

      $(".p-timeline-title").html( "Untitled Project" );
      
      butter.listen( "mediaready", function() {
        $(".media-title-div").html( butter.currentMedia.url );
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
        scrubber.style.left = -tracksDiv.scrollLeft + butter.timeline.currentTimeInPixels() + "px";
        progressBar.style.width = -tracksDiv.scrollLeft + butter.timeline.currentTimeInPixels() + "px";

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

        timelineDuration.innerHTML = butter.timeline.secondsToSMPTE( butter.currentTime );

        scrubber.style.display = "block";

        if ( scrubberLeft >= scrubberContainer.offsetWidth ) {
          tracksDiv.scrollLeft = butter.timeline.currentTimeInPixels() - scrubberContainer.offsetWidth;
        } else if ( scrubberLeft < 0 ) {
          tracksDiv.scrollLeft = butter.timeline.currentTimeInPixels();
        }

      });

      var zoom = function( event ) {

        if ( event.shiftKey ) {
          event.preventDefault();
          butter.timeline.zoom( event.detail || event.wheelDelta );
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
        butter.timeline.currentTimeInPixels( event.clientX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft );
      }, false);

      document.addEventListener( "mouseup", function( event ) {

        scrubberClicked = false;
      }, false);

      document.addEventListener( "mousemove", function( event ) {

        if ( scrubberClicked ) {

          var scrubberPos = event.pageX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft;

          if ( scrubberPos <= 0 ) {
            butter.timeline.currentTimeInPixels( 0 );
          } else if ( scrubberPos >= timelineTarget.offsetWidth ) {
            butter.timeline.currentTimeInPixels( timelineTarget.offsetWidth );
          } else {
            butter.timeline.currentTimeInPixels( scrubberPos );
          }

        }
      }, false);

      butter.listen( "mediatimeupdate", function() {
        scrubber.style.left = butter.timeline.currentTimeInPixels() - tracksDiv.scrollLeft + "px";
      });

      var drawCanvas = function() {
        var canvasDiv = document.getElementById( "timing-notches-canvas" );
        canvasDiv.style.width = timelineTarget.style.width;

        var context = canvasDiv.getContext( "2d" );

        canvasDiv.height = canvasDiv.offsetHeight;
        canvasDiv.width = canvasDiv.offsetWidth;

        var inc = canvasDiv.offsetWidth / butter.duration,
            //heights = [ 10, 4, 7, 4 ],
            textWidth = context.measureText( butter.timeline.secondsToSMPTE( 5 ) ).width,
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
              // text color
              context.fillStyle = "#999999";
              context.fillText( butter.timeline.secondsToSMPTE( i ), -~position - ( textWidth / 2 ), 21 );
            }

            lastPosition = position;
          }
        }
        // stroke color
        context.strokeStyle = "#999999";
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
          butter.timeline.zoom( slideValue - ui.value );
          drawCanvas();
          slideValue = ui.value;
        }
      });

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
          popupManager.hidePopups();
          popupManager.showPopup( "delete-track" );
          $('#deleteTrackBtn').click(function(){
            butter.removeTrack( track );
            popupManager.hidePopups();
          });
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
          popupManager.showPopup( "edit-target" );

          var closeTrackEditor = function() {
            popupManager.hidePopups();
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
          function changeTarget( e ) { 
            editor.json = this.value;
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

      document.getElementsByClassName( "sound-btn" )[ 0 ].addEventListener( "click", function( event ) {
        butter.mute && butter.mute();
      }, false);

      document.getElementsByClassName( "play-btn" )[ 0 ].addEventListener( "click", function( event ) {
        pm.currentProject.preview.playing ? pm.currentProject.preview.pause() : pm.currentProject.preview.play();
      }, false);

      butter.listen( "mediaplaying", function( event ) {
        document.getElementsByClassName( "play-btn" )[ 0 ].children[ 0 ].children[ 0 ].style.backgroundPosition = "-321px -19px";
      });

      butter.listen( "mediapaused", function( event ) {
        document.getElementsByClassName( "play-btn" )[ 0 ].children[ 0 ].children[ 0 ].style.backgroundPosition = "-322px 7px";
      });

    }; //Timeline

    return Timeline;

  }); //define
})();

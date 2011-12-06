(function() {
  define( [ "utils" ], function( utils ) {

    var Timeline = function( pm ) {

      var butter = pm.butter,
          popupManager = pm.popupManager,
          buttonManager = pm.buttonManager;

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
        pm.state = "change-media";
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

      function checkScrubber() {

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

        var scrubberLeft = checkScrubber();

        timelineDuration.innerHTML = butter.timeline.secondsToSMPTE( Math.round( butter.currentTime ) );

        scrubber.style.display = "block";

        if ( scrubberLeft >= scrubberContainer.offsetWidth ) {
          tracksDiv.scrollLeft = butter.timeline.currentTimeInPixels() - scrubberContainer.offsetWidth;
        } else if ( scrubberLeft < 0 ) {
          tracksDiv.scrollLeft = butter.timeline.currentTimeInPixels();
        }

      });

      var sliderElement = $( "#slider" );
      sliderElement.slider({
        value: 1,
        min: 1,
        max: 7,
        step: 1,
        slide: function( event, ui ) {
          slideValue = zoom( slideValue - ui.value );
        }
      });

      var zoom = function( delta ) {

        if ( pm.mediaAccessAllowed ) {
          var newZoom = butter.timeline.zoom( delta ),
              scrubberLeft = checkScrubber();

          if ( scrubberLeft - 5 > scrubberContainer.offsetWidth || scrubberLeft < 0 ) {
            scrubber.style.display = "none";
          } else {
            scrubber.style.display = "block";
          }

          drawCanvas();

          return newZoom;
        }
        return 0;
      };

      var mouseEvent = function( event ) {

        if ( pm.mediaAccessAllowed && event.shiftKey ) {

          event.preventDefault();
          slideValue = zoom( event.detail || event.wheelDelta );
          sliderElement.slider( "value", slideValue );
        }
      };

      timelineDiv.addEventListener( "DOMMouseScroll", mouseEvent, false );
      timelineDiv.addEventListener( "mousewheel", mouseEvent, false );
      timelineDiv.addEventListener( "click", mouseEvent, false );

      tracksDiv.addEventListener( "scroll", function( event ) {

        if ( pm.mediaAccessAllowed ) {
          var scrubberLeft = checkScrubber();

          if ( scrubberLeft - 5 > scrubberContainer.offsetWidth || scrubberLeft < 0 ) {
            scrubber.style.display = "none";
          } else {
            scrubber.style.display = "block";
          }

          document.getElementById( "timing-notches-canvas" ).style.left = -tracksDiv.scrollLeft + "px";
        } //if
      }, false );

      var scrubberClicked = false;

      scrubberContainer.addEventListener( "mousedown", function( event ) {

        if ( pm.mediaAccessAllowed ) {

          scrubberClicked = true;
          butter.targettedEvent = undefined;
          butter.timeline.currentTimeInPixels( event.clientX - scrubberContainer.offsetLeft - 22 + tracksDiv.scrollLeft );
        }
      }, false);

      document.addEventListener( "mouseup", function( event ) {

        scrubberClicked = false;
      }, false);

      document.addEventListener( "mousemove", function( event ) {

        if ( scrubberClicked && pm.mediaAccessAllowed ) {

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

      var trackLayers = {};
      var editTrackTargets =  document.getElementById( "track-edit-target" );
      var trackJSONtextArea = document.getElementById( "track-edit-JSON" );

      var createLayer = function( track ) {

        var layerDiv = document.createElement( "div" );
        layerDiv.id = "layer-" + track.id;
        $( layerDiv ).append( $( "<textnode/>", {
          innerHTML: layerDiv.id
        })[ 0 ] );
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

          var targets = butter.serializeTargets(),
              $trackTitletb = $( "#track-title-input-box" ),
              $textNode = $( $( layerDiv ).children( "textnode" )[0] );

          for ( var i = 0; i < targets.length; i++ ) {

            editTrackTargets.innerHTML += "<option value=\"" + targets[ i ].name + "\">" + targets[ i ].name + "</option>";
          }

          var editor = new butter.trackeditor.Editor( track );

          trackJSONtextArea.value = JSON.stringify( editor.json );
          editTrackTargets.value = editor.target;

          $trackTitletb.val( $textNode.text() );
          popupManager.showPopup( "edit-target" );

          var closeTrackEditor = function() {
            $trackTitletb.val( "" );
            popupManager.hidePopups();
            document.getElementById( "apply-track-edit" ).removeEventListener( "click", clickApply, false );
            document.getElementById( "ok-track-edit" ).removeEventListener( "click", clickOk, false );
            document.getElementById( "delete-track-edit" ).removeEventListener( "click", clickDelete, false );
            document.getElementById( "clear-track-edit" ).removeEventListener( "click", clickClear, false );
            trackJSONtextArea.removeEventListener( "change", changeTarget, false );
            $( "#delete-track-confirmation" ).children( "a.popup-close-btn" ).unbind( "click" );
            $( "#clear-track-confirmation" ).children( "a.popup-close-btn" ).unbind( "click" );

          }; //closeTrackEditor

          popupManager.showPopup( "edit-target", {
            onClose: closeTrackEditor
          });

          function applyTrackEditor() {
            var newName = utils.getSafeString( $trackTitletb.val() );
            $textNode.text( newName || layerDiv.id );
            editor.target = editTrackTargets.value;
          }
          function clickOk( e ) {
            applyTrackEditor();
            closeTrackEditor();
          }
          function clickApply( e ) {
            applyTrackEditor();
          }
          function clickDelete( e ) {
            popupManager.hidePopups();
            popupManager.showPopup( "delete-track-confirm", {
              onClose: function() {
                popupManager.hidePopups();
                popupManager.showPopup( "edit-target", {
                  onClose: closeTrackEditor
                });
              }
            });
          }
          buttonManager.add( "delete-track", $( "#delete-track-confirm-btn" ), {
            click: function() {
              editor.remove();
              closeTrackEditor();
            }
          });

          function clickClear( e ) {
            popupManager.hidePopups();
            popupManager.showPopup( "clear-track-confirm", {
              onClose: function() {
                popupManager.hidePopups();
                popupManager.showPopup( "edit-target", {
                  onClose: closeTrackEditor
                });
              }
            });
          }
          buttonManager.add( "clear-track", $( "#clear-track-confirm-btn" ), {
            click: function() {
              $( "#clear-track-confirmation" ).children( "a.popup-close-btn" ).unbind( "click" );
              trackJSONtextArea.value = "";
              editor.clear();
              popupManager.hidePopups();
              popupManager.showPopup( "edit-target", {
                onClose: closeTrackEditor
              });
            }
          });
          function clickEdit( e ) {
            closeTrackEditor();
          }
          function changeTarget( e ) {
            editor.json = this.value;
          }

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
        if ( pm.mediaAccessAllowed ) {
          pm.currentProject.preview.playing ? pm.currentProject.preview.pause() : pm.currentProject.preview.play();
        } //if
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

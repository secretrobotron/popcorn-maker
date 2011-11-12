/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function( window, document, undefined ) {

  define( [ "core/logger", "core/eventmanager", "core/trackevent", "comm/comm" ], function( Logger, EventManager, Comm, TrackEvent ) {

    var EventEditor = function( butter, options ) {

      options = options || {};

      var defaultEditor = options.defaultEditor || "defaultEditor.html",
          editors = {},
          commServer = new Comm.CommServer();

      var Editor = function ( butter, options ) {
        var target = options.target,
            type = options.type,
            source = options.source,
            editorHeight,
            editorWidth,
            targetContainer,
            targetWindow,
            that = this;

        var editorLinkName = "editorLink" + Editor.guid++;

        editorWidth = options.editorWidth || 400;
        editorHeight = options.editorHeight || 400;

        function clearTarget() {
          while ( targetContainer.firstChild ) {
            targetContainer.removeChild( targetContainer.firstChild );
          }
        } //clearTarget

        if ( typeof target === "string" && target !== "window" ) {
          targetContainer = document.getElementById( target );
        } //if

        this.construct = function( trackEvent ) {
          var updateEditor = function( e ){
            commServer.send( editorLinkName, {
              "id": e.data.id, 
              "options": e.data.popcornOptions
            }, "trackeventupdated" );
          };
          var checkRemoved = function( e ) {
            commServer.send( editorLinkName, e.data.id, "trackeventremoved" );
          };
          var targetAdded = function( e ) {
            commServer.send( editorLinkName, butter.targets, "domtargetsupdated" );
          };
          var clientDimsUpdated = function( dims ) {
            editorHeight = dims.height;
            editorWidth = dims.width;
            butter.trigger( "clientdimsupdated", that, "eventeditor" );
          };
          var undoListeners = function() {
            butter.unlisten ( "trackeventupdated", updateEditor );
            butter.unlisten ( "targetadded", targetAdded );
            butter.unlisten ( "trackeventremoved", checkRemoved );
            butter.unlisten ( "clientdimsupdated", clientDimsUpdated );
            commServer.forget( editorLinkName, "okayclicked" );
            commServer.forget( editorLinkName, "applyclicked" );
            commServer.forget( editorLinkName, "deleteclicked" );
            commServer.forget( editorLinkName, "cancelclicked" );
            commServer.forget( editorLinkName, "clientdimsupdated" );
            commServer.destroy( editorLinkName );
          };

          function filterKnownFields( fields ) {
            var val;

            function checkNumber( num ) {
              var val = parseFloat( num );
              if ( isNaN( val ) || val < 0 ) {
                val = 0;
              }
              return val;
            } //checkNumber

            fields[ "start" ] = checkNumber( fields[ "start" ] );
            fields[ "end" ] = checkNumber( fields[ "end" ] );
          } //filterKnownFields

          function setupServer( bindingType ) {
            var succeeded = false;

            var binding = bindingType === "window" ? "bindWindow" : "bindFrame";
            commServer[ binding ]( editorLinkName, targetWindow, function() {
              butter.listen( "trackeventupdated", updateEditor );
              butter.listen( "targetadded", targetAdded );
              butter.listen( "trackeventremoved", checkRemoved );
              
              commServer.listen( editorLinkName, "okayclicked", function( newOptions ){
                filterKnownFields( newOptions );
                trackEvent.popcornOptions = newOptions;
                if ( targetWindow.close ) {
                  targetWindow.close();
                }
                if ( targetWindow && targetWindow.parentNode ) {
                  targetWindow.parentNode.removeChild( targetWindow );
                }
                undoListeners();
                targetWindow = undefined;
                butter.trigger( "trackeventupdated", trackEvent );
                butter.trigger( "trackeditclosed", that );
              });

              commServer.listen( editorLinkName, "applyclicked", function( newOptions ) {
                filterKnownFields( newOptions );
                trackEvent.popcornOptions = newOptions;
                butter.trigger( "trackeventupdated", trackEvent );
              });

              commServer.listen( editorLinkName, "deleteclicked", function() {
                butter.removeTrackEvent( trackEvent );
                if ( targetWindow.close ) {
                  targetWindow.close();
                }
                if ( targetWindow && targetWindow.parentNode ) {
                  targetWindow.parentNode.removeChild( targetWindow );
                }
                undoListeners();
                targetWindow = undefined;
                butter.trigger( "trackeditclosed", that );
              });

              commServer.listen( editorLinkName, "cancelclicked", function() {
                if ( targetWindow.close ) {
                  targetWindow.close();
                }
                if ( targetWindow && targetWindow.parentNode ) {
                  targetWindow.parentNode.removeChild( targetWindow );
                }
                undoListeners();
                targetWindow = undefined;
                butter.trigger( "trackeditclosed", that );
              });

            });

            commServer.listen( editorLinkName, "ready", editorReady );
            commServer.listen( editorLinkName, "clientdimsupdated", clientDimsUpdated );

            var checkEditorInterval;
            function editorReady() {
              succeeded = true;
              butter.trigger( "trackeditstarted", that );
              commServer.forget( editorLinkName, "ready", editorReady );
              clearInterval( checkEditorInterval );
              var targetCollection = butter.targets, targetArray = [];
              for ( var i=0, l=targetCollection.length; i<l; ++i ) {
                targetArray.push( [ targetCollection[ i ].name, targetCollection[ i ].id ] );
              }
              trackEvent.manifest = butter.getManifest( trackEvent.type );
              commServer.send( editorLinkName, {
                "trackEvent": trackEvent, 
                "targets": targetArray,
                "id": trackEvent.id
              }, "edittrackevent");
            }
            checkEditorInterval = setInterval( function() {
              commServer.send( editorLinkName, "ready", "ready" );
            }, 500 );
            setTimeout( function() {
              clearInterval( checkEditorInterval );
              commServer.forget( editorLinkName, "ready", editorReady );
              if ( succeeded ) {
                return;
              }
              if ( targetWindow.close ) {
                targetWindow.close();
              }
              if ( targetWindow && targetWindow.parentNode ) {
                targetWindow.parentNode.removeChild( targetWindow );
              }
              undoListeners();
              targetWindow = undefined;
              butter.trigger( "trackeditfailed", that );
            }, 5000 );

          } //setupServer

          if ( target === "window" ) {
            if ( !targetWindow ) {
              targetWindow = window.open( source, "", "width=" + editorWidth + ",height=" + editorHeight + ",menubar=no,toolbar=no,location=no,status=no" );
              setupServer( "window" );
              targetWindow.addEventListener( "beforeunload", function() {
                undoListeners();
                butter.trigger( "trackeditclosed", that );
                targetWindow = undefined;
              }, false );
            }
          }
          else {
            if ( targetContainer ) {
              clearTarget();
            }
            targetWindow = document.createElement( "iframe" );
            targetWindow.id = "butter-editor-iframe";
            targetWindow.style.width = editorWidth;
            targetWindow.style.height = editorHeight;
            setupServer( "iframe" );
            targetWindow.setAttribute( "src", source );
            targetWindow.src = source;
            targetContainer.appendChild( targetWindow );
          } //if


        }; //construct

        this.setDimensions = function( width, height ) {
          if ( !height ) {
            height = width.height;
            width = width.width;
          }
          editorWidth = width;
          editorHeight = height;
        }; //setDimensions

        Object.defineProperty( this, "type", {
          get: function() { return target === "window" ? "window" : "iframe"; }
        });

        Object.defineProperty( this, "size", {
          get: function() { return { width: editorWidth, height: editorHeight }; }
        });

        Object.defineProperty( this, "window", {
          get: function() { return targetWindow; }
        });
        
      } //Editor
      Editor.guid = 0;

      if ( !options || typeof options !== "object" ) {
        throw new Error( "invalid arguments for initializing editor" );
      }

      this.editTrackEvent = function( trackEvent ) {
        if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ) {
          return false;
        }

        var type = trackEvent.type;
        if ( !editors[ type ] ) {
          type = "default";
        }
        editors[ type ].construct( trackEvent );
        return true;
      }; //editTrackEvent

      this.addEditor = function( editorSource, pluginType, target ) {
        if ( !pluginType || !editorSource ) {
          return false;
        }
        return editors[ pluginType ] = new Editor({
          source: editorSource,
          type: pluginType,
          target: target
        });
      }; //addCustomEditor
            
      this.removeCustomEditor = function( pluginType ) {
        if ( !pluginType ) {
          return false;
        }
        var oldSource = editors[ pluginType ];
        editors[ pluginType ] = undefined;
        return oldSource;
      }; //removeCustomEditor

    }; //EventEditor

    return {
      name: "eventeditor",
      init: function( butter, options ) {
        return new EventEditor( butter, options );
      } //init
    };

  }); //define

})( window, window.document );


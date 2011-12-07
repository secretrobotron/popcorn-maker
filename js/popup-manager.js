(function() {

  define( [], function() {

    function PopupManager( popcornMaker ) {

      var popups = [],
          openPopups = [],
          popupsByName = {},
          escapeKeyEnabled,
          that = this,
          buttonListeners = {}
          pm = popcornMaker;

      function removeButtonListeners( name ) {
        var listeners = buttonListeners[ name ]
        for ( var i=0, l=listeners.length; i<l; ++i ) {
          listeners[ i ].element.removeEventListener( 'click', listeners[ i ].listener, false );
        }
        buttonListeners[ name ] = [];
      } //removeButtonListners

      this.addPopup = function( name, id ) {
        var popup = $( id );
        popups.push( popup );
        popupsByName[ name ] = popup;
        buttonListeners[ name ] = [];
      }; //addPopup

      this.hidePopups = function() {
        for ( var i=0; i<popups.length; ++i ) {
          popups[ i ].hide();
        } //for
        for ( var name in buttonListeners ) {
          if ( buttonListeners.hasOwnProperty( name ) ) {
            removeButtonListeners( name );
          } //if
        } //for
        $(".popupDiv").fadeOut("fast");
        $('.close-div').fadeOut('fast');
        $('.balck-overlay').hide();
        escapeKeyEnabled = false;
        openPopups = [];
        pm.toggleKeyboardFunctions( true );
      }; //hidePopups

      this.showPopup = function( name, options ) {
        pm.toggleKeyboardFunctions( false );
        options = options || {};

        var popup = popupsByName[ name ];
        popup.fadeIn( 2000 );
        $('.popupDiv').fadeIn('slow');
        $('.balck-overlay').show();
        popup.css( "margin-left", ( window.innerWidth / 2 ) - ( popup[0].clientWidth / 2 ) );

        if ( options.width ) {
          popup.css( { width: options.width + "px" } );
        }
        if ( options.height ) {
          popup.css( { height: options.height + "px" } );
        }

        escapeKeyEnabled = true;
        var idx = openPopups.indexOf( name );
        if ( idx > -1 ) {
          openPopups.push( name );
        } //if

        if ( options.message ) {
          var messageContainer = popup[ 0 ].getElementsByClassName( "desc" );
          if ( messageContainer ) {
            messageContainer[ 0 ].innerHTML = options.message;
          }
        }

        if ( options.buttons ) {
          for ( var button in options.buttons ) {
            if ( options.buttons.hasOwnProperty( button ) ) {
              var elemList = popup[ 0 ].getElementsByTagName( 'input' );
              for ( var i=0, l=elemList.length; i<l; ++i ) {
                if ( elemList[ i ].name === button ) {
                  elemList[ i ].addEventListener( 'click', options.buttons[ button ], false );
                  buttonListeners[ name ].push( { element: elemList[ i ], listener: options.buttons[ button ] } );
                }
              }
            }
          }
        }

        if ( options.onClose && typeof options.onClose === "function" ) {
          var closebtn = popup.children( ".popup-close-btn" );
          closebtn && closebtn.click( function() {
            $( this ).unbind( "click" );
            options.onClose();
          });
        }
      }; //showPopup

      this.hidePopup = function( name ) {
        var popup = popupsByName[ name ];
        popup.fadeOut('fast');
        $(".popupDiv").fadeOut("fast");
        $('.balck-overlay').hide();
        escapeKeyEnabled = false;
        var idx = openPopups.indexOf( name );
        if ( idx > -1 ) {
          openPopups.splice( idx, 1 );
        } //if
        removeButtonListeners( name );
        if ( openPopups.length === 0 ) {
          pm.toggleKeyboardFunctions( true );
        } //if
      }; //hidePopup

      Object.defineProperty( this, "open", {
        get: function() { return openPopups.length > 0; }
      });

      $(window).keypress( function ( event ) {
        if ( event.keyCode === 27 && openPopups.length > 0 ) {
          that.hidePopups();
        }
      });

      this.init = function() {
      }; //init

    } //PopupManager

    return PopupManager;

  }); //define

})();

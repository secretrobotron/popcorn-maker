(function () {

  define( [], function() {

    var ButtonManager = function() {
      var buttons = {},
          that = this;

      this.add = function( name, button, functions ) {
        if ( typeof( button ) === "string" ) {
          button = document.getElementById( button );
        }
        if ( button ) {
          buttons[ name ] = {
            button: button,
            functions: functions
          };
          if ( button.jquery ) {
            buttons[ name ].bind = function( name, fn ) {
              button.bind( name, fn );
            }
            buttons[ name ].unbind = function( name, fn ) {
              button.unbind( name, fn );
            }
          }
          else {
            buttons[ name ].bind = function( name, fn ) {
              button.addEventListener( name, fn, false );
            }
            buttons[ name ].unbind = function( name, fn ) {
              button.removeEventListener( name, fn, false );
            }
          }
          if ( functions ) {
            that.bind( name );
          } //if
        } //if
      }; //add

      this.bind = function( name, fnName, fn ) {
        var button = buttons[ name ];
        if ( fnName ) {
          button.bind( fnName, fn );
        }
        else {
          var functions = button.functions;
          if ( functions ) {
            for ( var func in functions ) {
              if ( functions.hasOwnProperty( func ) ) {
                button.bind( func, functions[ func ] );
              } //if
            } //for
          } //if
        } //if
      }; //bind

      this.unbind = function( name, fnName, fn ) {
        var button = buttons[ name ];
        if ( fnName ) {
          button.unbind( fnName, fn );
        }
        else {
          var functions = button.functions;
          if ( functions ) {
            for ( var func in functions ) {
              if ( functions.hasOwnProperty( func ) ) {
                button.unbind( func, functions[ func ] );
              } //if
            } //for
          } //if
        } //if
      }; //unbind

      this.toggle = function( name, state ) {
        buttons[ name ].setAttribute( "disabled", "true" );
      }; //toggle

      this.init = function() {
      }; //init

    } //ButtonManager

    return ButtonManager;

  }); //define

})();

(function () {

  define( [], function() {

    var ButtonManager = function() {
      var buttons = {},
          sets = {},
          that = this;

      this.addSet = function( name, set ) {
        sets[ name ] = set;
      }; //addSet 

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
            button.unbind();
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

      function doBind( button, funcName, func ) {
        var wrapperFunc = func;
        if ( funcName === "click" ) {
          wrapperFunc = function( e ) {
            if ( !button.disabled ) {
              func( e );
            } //if
          }; //wrapperFunc
        }
        button.bind( funcName, wrapperFunc );
      } //doBind

      this.bind = function( name, fnName, fn ) {
        var button = buttons[ name ];
        if ( fnName ) {
          doBind( button, fnName, fn );
        }
        else {
          var functions = button.functions;
          if ( functions ) {
            for ( var func in functions ) {
              if ( functions.hasOwnProperty( func ) ) {
                doBind( button, func, functions[ func ] );
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

      function doToggle( name, state ) {
        if ( buttons[ name ] ) {
          $( buttons[ name ].button ).attr( "disabled", "true" );
          buttons[ name ].disabled = true;
        } //if
      } //doToggle

      this.toggle = function( name, state ) {
        if ( name === "string" ) {
          doToggle( name, state );
        }
        else {
          for ( var i=0; i<name.length; ++i ) {
            doToggle( name[ i ], state );
          } //for
        } //if
      }; //toggle

      this.toggleSet = function( name, state ) {
        if ( sets[ name ] ) {
          that.toggle( sets[ name ], state );
        } //if
      }; //toggleSet

      this.init = function() {
      }; //init

    } //ButtonManager

    return ButtonManager;

  }); //define

})();

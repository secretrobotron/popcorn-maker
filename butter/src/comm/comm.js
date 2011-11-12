(function (window, document, Butter, undefined) {

  var MESSAGE_PREFIX = "BUTTER", MESSAGE_PREFIX_LENGTH = MESSAGE_PREFIX.length;

  if ( !Butter ) {
    Butter = window.Butter = {};
  } //if

  var parseEvent = Butter.parseCommEvent = function ( e, win ) {
    if ( e.source !== win && e.data.indexOf( MESSAGE_PREFIX ) === 0 ) {
      return JSON.parse( e.data.substring( MESSAGE_PREFIX_LENGTH ) );
    } //if
  }; //parseEvent

  Butter.CommClient = function ( name, onmessage ) {

    var listeners = {},
        that = this;

    window.addEventListener('message', function ( e ) {
      var data = parseEvent( e, window );
      if ( data ) {
        if ( data.type && listeners[ data.type ] ) {
          var list = listeners[ data.type ];
          for ( var i=0; i<list.length; ++i ) {
            list[i]( data.message );
          } //for
        } //if
        onmessage && onmessage( data );
      } //if
    }, false);

    this.listen = function ( type, callback ) {
      if (type && callback) {
        if ( !listeners[ type ] ) {
          listeners[ type ] = [];
        } //if
        listeners[ type ].push( callback );
        return callback;
      }
      else {
        throw new Error('Must provide a type and callback for CommClient listeners');
      } //if
    };

    this.forget = function ( type, callback ) {
      if ( !callback ) {
        delete listeners[ type ];
      }
      else {
        var theseListeners = listeners[ type ];
        if ( theseListeners ) {
          var idx = listeners[ type ].indexOf( callback );
          if ( idx > -1 ) {
            var callback = listeners[ type ][ idx ];
            listeners[ type ].splice( idx, 1 );
            return callback;
          } //if
        }
      } //if
    };

    this.send = function ( message, type ) {
      if ( !type ) {
        postMessage( MESSAGE_PREFIX + JSON.stringify( message ), "*" );
      }
      else {
        postMessage( MESSAGE_PREFIX + JSON.stringify( { type: type, message: message } ), "*" );
      } //if
    }; //send

    this.async = function( message, type, handler ) {
      var wrapper = function( message ) {
        that.forget( type, wrapper );
        handler( message );
      }; //wrapper
      that.listen( type, wrapper ); 
      that.send( message, type );
    }; //async

    this.returnAsync = function( type, handler ) {
      that.listen( type, function( message ) {
        that.send( handler( message ), type );
      });
    }; //returnAsync

  }; //CommClient

  Butter.CommServer = function () {

    var clients = {},
        that = this;

    function Client ( name, client, callback ) {

      var listeners = {},
          that = this;

      this.getName = function () {
        return name;
      };

      this.listen = function ( type, callback ) {
        if (type && callback) {
          if ( !listeners[ type ] ) {
            listeners[ type ] = [];
          } //if
          listeners[ type ].push( callback );
          return callback;
        }
        else {
          throw new Error('Must provide a type and callback for CommServer listeners');
        } //if
      }; //listen

      this.forget = function ( type, callback ) {
        if ( !callback ) {
          delete listeners[ type ];
        }
        else {
          var theseListeners = listeners[ type ];
          if ( theseListeners ) {
            var idx = listeners[ type ].indexOf( callback );
            if ( idx > -1 ) {
              var callback = listeners[ type ][ idx ];
              listeners[ type ].splice( idx, 1 );
              return callback;
            } //if
          } //if
        } //if
      }; //forget

      this.send = function ( message, type ) {
        if ( !type ) {
          client.postMessage( MESSAGE_PREFIX + JSON.stringify( message ), "*" );
        }
        else {
          client.postMessage( MESSAGE_PREFIX + JSON.stringify( { type: type, message: message } ), "*" );
        } //if
      }; //send

      this.async = function( message, type, handler ) {
        var wrapper = function( message ) {
          that.forget( type, wrapper );
          handler( message );
        }; //wrapper
        that.listen( type, wrapper ); 
        that.send( message, type );
      }; //async

      this.init = function( readyClient ) {
        client = readyClient;
        client.addEventListener( "message", function ( e ) {
          var data = parseEvent( e, window );
          if ( data ) {
            if ( data.type && listeners[ data.type ] ) {
              var list = listeners[ data.type ];
              for ( var i=0; i<list.length; ++i ) {
                list[i]( data.message );
              } //for
            } //if
            callback && callback( data );
          } //if
        }, false );
      }; //init

      this.destroy = function() {
        delete listeners;
      }; //destroy

    } //Client

    this.bindFrame = function ( name, frame, readyCallback, messageCallback ) {
      clients[ name ] = new Client( name, frame.contentWindow, messageCallback );
      frame.addEventListener( "load", function (e) {
        clients[ name ].init( frame.contentWindow );
        readyCallback && readyCallback( e );
      }, false );
    };

    this.bindWindow = function ( name, win, readyCallback, messageCallback ) {
      clients[ name ] = new Client( name, win, messageCallback );
      win.addEventListener( "load", function (e) {
        clients[ name ].init( win );
        readyCallback && readyCallback( e );
      }, false );
    };

    this.bindClientWindow = function ( name, client, callback ) {
      clients[ name ] = new Client( name, client, callback );
      clients[ name ].init( client );
    };

    this.listen = function ( name, type, callback ) {
      clients[ name ] && clients[ name ].listen( type, callback );
    };

    this.forget = function ( name, type, callback ) {
      clients[ name ] && clients[ name ].forget( type, callback );
    };

    this.send = function ( name, message, type ) {
      clients[ name ] && clients[ name ].send( message, type );
    };

    this.async = function( name, message, type, handler ) {
      clients[ name ] && clients[ name ].async( message, type, handler );
    };

    this.destroy = function( name ) {
      if ( name ) {
        clients[ name ] && clients[ name ].destroy();
        delete clients[ name ];
      }
      else {
        for ( var clientName in clients ) {
          if ( clients.hasOwnProperty( clientName ) ) {
            clients[ clientName ].destroy();
            delete clients[ clientName ];
          } //if
        } //for
      } //if
    }; //destroy

  } //CommServer

  Butter.registerModule( "comm", function( options ) {
    this.CommClient = Butter.CommClient;
    this.CommServer = Butter.CommServer;
  });
})(window, document, Butter);

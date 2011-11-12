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

(function() {
  define( [ "core/logger" ], function( Logger ) {

    var EventManager = function( emOptions ) {

      var listeners = {},
          related = {},
          id = "EventManager" + EventManager.guid++,
          logger = emOptions.logger || new Logger( id ),
          targetName = id,
          that = this;
      
      this.listen = function( type, listener, relatedObject ) {
        if ( type && listener ) {
          if ( !listeners[ type ] ) {
            listeners[ type ] = [];
          } //if
          listeners[ type ].push( listener );
          if ( relatedObject ) {
            if ( !related[ relatedObject ] ) {
              related[ relatedObject ] = [];
            } //if
            related[ relatedObject ].push( listener );
          } //if
        }
        else {
          logger.error( "type and listener required to listen for event." );
        } //if
      }; //listen

      this.unlisten = function( type, listener ) {
        if ( type && listener ) {
          var theseListeners = listeners[ type ];
          if ( theseListeners ) {
            var idx = theseListeners.indexOf( listener );
            if ( idx > -1 ) {
              theseListeners.splice( idx, 1 );
            } //if
          } //if
        }
        else {
          logger.error( "type and listener required to unlisten for event" );
        } //if
      }; //unlisten

      this.unlistenByType = function( type, relatedObject ) {
        var relatedListeners = related[ relatedObject ];
        for ( var i=0, l=relatedListeners; i<l; ++i ) {
          that.unlisten( type, relatedListeners[ i ] );
        } //for
        delete related[ relatedObject ];
      }; //unlistenByType

      this.dispatch = function( type, data ) {
        if ( type ) {
          var theseListeners = listeners[ type ];
          if ( theseListeners ) {
            var e = {
              target: targetName,
              type: type,
              data: data
            };
            for ( var i=0, l=theseListeners.length; i<l; ++i ) {
              theseListeners[ i ]( e );
            } //for
          } //if
        }
        else {
          logger.error( "type required to dispatch event" );
        } //if
      }; //dispatch

      this.apply = function( name, to ) {
        to.listen = that.listen;
        to.unlisten = that.unlisten;
        to.dispatch = that.dispatch;
        targetName = name;
      }; //apply

      this.repeat = function( e ) {
        that.dispatch( e.type, e.data );
      }; //repeat

    }; //EventManager
    EventManager.guid = 0;

    return EventManager;

  }); //define

})();

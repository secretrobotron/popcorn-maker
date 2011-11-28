(function() {
  define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

    var TrackEvent = function ( options ) {
      var id = "TrackEvent" + TrackEvent.guid++,
          logger = new Logger( id ),
          em = new EventManager( { logger: logger } ),
          that = this;

      em.apply( "TrackEvent", this );

      options = options || {};
      var name = options.name || 'Track' + Date.now();
      this.start = options.start || 0;
      this.end = options.end || 0;
      this.type = options.type;
      this.popcornOptions = options.popcornOptions || {
        start: that.start,
        end: that.end
      };
      this.popcornEvent = options.popcornEvent;
      this.track = options.track;

      Object.defineProperty( this, "target", {
        get: function() {
          return that.popcornOptions.target;
        },
        set: function( val ) {
          logger.log( "target changed: " + val );
          that.popcornOptions.target = val;
        }
      }); //target

      Object.defineProperty( this, "name", {
        get: function() {
          return name;
        }
      });

      Object.defineProperty( this, "id", {
        get: function() {
          return id;
        }
      });

      Object.defineProperty( this, "json", {
        get: function() {
          return {
            id: id,
            start: this.start,
            end: this.end,
            type: this.type,
            popcornOptions: this.popcornOptions,
            track: this.track ? this.track.name : undefined,
            name: name
          };
        },
        set: function( importData ) {
          this.start = importData.start || 0;
          this.end = importData.end || 0;
          this.type = importData.type;
          if ( importData.name ) {
            name = importData.name;
          }
          this.popcornOptions = importData.popcornOptions;
        }
      });

    }; //TrackEvent
    TrackEvent.guid = 0;

    return TrackEvent;

  }); //define

})();

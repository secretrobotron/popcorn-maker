(function() {
  function PopupManager() {

    var popups = [],
        openPopups = [],
        popupsByName = {},
        escapeKeyEnabled,
        that = this;

    this.addPopup = function( name, id ) {
      var popup = $( id );
      popups.push( popup );
      popupsByName[ name ] = popup;
    }; //addPopup

    this.hidePopups = function() {
      for ( var i=0; i<popups.length; ++i ) {
        popups[ i ].hide();
      } //for
      $(".popupDiv").fadeOut("fast");
      $('.close-div').fadeOut('fast');
      $('.balck-overlay').hide();
      escapeKeyEnabled = false;
      openPopups = [];
    }; //hidePopups

    this.showPopup = function( name, options ) {
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

  window.PopupManager = PopupManager;
})();

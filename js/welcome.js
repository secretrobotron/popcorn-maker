(function() {

  define( [], function() {

    var Welcome = function( pm ) {

      var popupManager = pm.popupManager,
          buttonManager = pm.buttonManager;

      popupManager.addPopup( "welcome", "#welcome-popup" );

      //Popup sliding
      $('.import-scroll-toggler').click(function() {
        $(".scroll-popup-container.spc-add-project").animate({
          "margin-left": '-400px'
        }, 750);
      });
      $('.import-scroll-back-toggler').click(function() {
        $(".scroll-popup-container.spc-add-project").animate({
          "margin-left": '0px'
        }, 750);
      });
      $('.tutorial-btn').click(function() {
        $(this).parent().parent().animate({
          left: '-700px'
        }, 500);
      });

      buttonManager.add( "wizard-add-project", $( ".wizard-add-project-btn" ), {
        click: function() {
          popupManager.hidePopups();
          popupManager.showPopup( "add-project" );
        }
      });

      buttonManager.add( "wizard-create-new", $('.wizard-create-new-btn'), {
        click: function() {
          popupManager.hidePopups();
          popupManager.showPopup( "add-project" );
        }
      });

    }; //Welcome

    return Welcome;

  }); //define

})();

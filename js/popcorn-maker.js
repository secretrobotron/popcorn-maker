(function(){

  window.addEventListener("DOMContentLoaded", function(){
    
    var b  = new Butter();

    b.eventeditor( { target: "popup-4", defaultEditor: "lib/defaultEditor.html", editorWidth: "98%", editorHeight: "98%"  } );

    b.previewer({
      layout: "layouts/default.html",
      target: "main",
      media: "http://robothaus.org/bugs/video/brendan1.ogv",
      callback: function() {
        b.buildPopcorn( b.getCurrentMedia() , function() {

          var registry = b.getRegistry();
        } );
      }
    });
    
    b.plugintray({ target: "plugin-tray", pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>' });
    b.addPlugin( { type: "image" } );
    b.addPlugin( { type: "footnote" } );
    b.addPlugin( { type: "twitter" } );
    b.addPlugin( { type: "webpage" } );
    b.addPlugin( { type: "subtitle" } );
    b.addPlugin( { type: "googlenews" } );
    
    b.timeline({ target: "timeline-div"});

    $('.enable-scroll').tinyscrollbar();
    
    b.listen ( "trackeditstarted", function() {
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-4').show();
      $(' .balck-overlay ').hide();
    });
    
    b.listen ( "trackeditclosed", function() {
      $('.close-div').fadeOut('fast');
      $('.popups').hide(); 
    });


    return;
    $(".collapse-btn").toggle(function() {

      $('.collapse-btn a').css('backgroundPosition','6px 7px');
      $(".toolbox").animate({ width: "46px" }, 500);
      $('.collapse-btn a').text("");
      $(".timeline").stop().animate({ paddingRight:'86px'}, 500);
      $(".qtip").hide();

      },function() {

        $('.collapse-btn a').css('backgroundPosition','6px -9px');
        $(".toolbox").animate({ width: "120px" }, 500);
        $('.collapse-btn a').text("collapse"); 
        $(".timeline").stop().animate({ paddingRight:'160px'}, 500);

    });

    $(".hide-timeline a").toggle(function() {

      $(this).css('backgroundPosition','20px -10px');
      $(".hide-timeline").animate({ bottom: '36px' }, 500);
      $("#properties-panel").animate({ height: '38px' }, 500);
      $(this).text("Show Timeline"); 

    },function() {

      $(this).css('backgroundPosition','20px 7px');
      $(this).text("Hide Timeline"); 
      $(".hide-timeline").animate({ bottom: "268px" }, 500);
      $("#properties-panel").animate({ height: "270px" }, 500);
    });

    $(".play-btn a").toggle(function() {
      $(".play-btn a span").css('backgroundPosition','0 -25px');
    },function() {
      $(".play-btn a span").css('backgroundPosition','0 0');
    });

    $(".sound-btn a").toggle(function() {
      $(".sound-btn a span").css('backgroundPosition','0 -16px');
    },function() {
      $(".sound-btn a span").css('backgroundPosition','0 0');
    });

    try {
      $(".websites2").msDropDown();
    } catch(e) {
      alert("Error: "+e.message);
    }

    $('.timeline-heading .edit a').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-1').show();
      $(' .balck-overlay ').hide();
    });

    $('.layer-btn .edit a').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-2').show();
      $(' .balck-overlay ').hide();
    });

    $('.p-3').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popupDiv').fadeIn('slow');
      $('#popup-3').show();
      $(' .balck-overlay ').show();
    });

//    $('.track-event').click(function(){
//      $('.close-div').fadeOut('fast');
//      $('.popupDiv').fadeIn('slow');
//      $('#popup-4').show();
//      $(' .balck-overlay ').hide();
//    });

    $('.popup-close-btn, .balck-overlay').click(function(){
      $('.close-div').fadeOut('fast');
      $('.popups').hide();
    });

    $('a#slickbox-toggle').click(function() {
      $('#slickbox').slideToggle(400);
      $(this).text($(this).text() == 'Show box' ? 'Hide box' : 'Show box'); // <- HERE
      return false;
    });

    $(function(){ $("label").inFieldLabels(); });

    $(function() {
      $( ".draggable" ).draggable();
    });

    var d = {
      links: {
        position: {
          at: "top right",
          my: "bottom left",
          viewport: $(window)
        }
      },
    },
    c = $("#contentheader");

    $('a[title!=""]', c).qtip(d.links);			

  }, false);


})();


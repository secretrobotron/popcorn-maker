/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, document, undefined, Butter) {

  var b = new Butter();
  var tracksContainer;
  module ( "Timeline Setup" );
  
  test( "Check Existence", function() {

    expect(2);

    ok( b.timeline, "timeline method exists" );
    ok( typeof b.timeline === "function", "butter.timeline() is a function" );
  });

  module ( "Timeline Options" );

  test( "Target Containers", function() {

    expect(1);
    tracksContainer = document.getElementById( "target-div" );
    b.timeline({ target: "target-div" });
    b.addMedia({ name: "video1", media: "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm" });
    equals( tracksContainer.children.length, 1, "track container was created via id" );
  });

  module( "Timeline Events" );

  test( "timelineready", function() {

    expect(2);

    var mediaReady = false;
    b.listen( "timelineready", function() {

      mediaReady = true;
    });
    var media1 = b.addMedia({ name: "video1", media: "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm" });
    media1.duration = function() {

      return 178;
    };
    b.trigger( "mediaready", media1 );
    ok( mediaReady, "mediaready event was fired" );

    var media2 = b.addMedia({ name: "video1", media: "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm" });
    media2.duration = function() {

      return 178;
    };
    b.trigger( "mediaready", media2 );
    b.listen( "timelineready", function() {

      mediaChanged = true;
    });
    b.setMedia( media2 );
    ok( mediaChanged, "mediaready event was fired" );
  });
  
  module ( "Timeline Functions" );

  test( "currentTimeInPixels", function() {

    expect(6);

    b.timeline({ target: "target-div" });
    var media = b.addMedia({ name: "video1", media: "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm" });
    media.duration = function() {

      return 178;
    };
    b.trigger( "mediaready", media );
    b.setMedia( media );

    equals( b.currentTimeInPixels(), 0, "checking pixel at starting of video" );
    b.currentTime( b.duration() );
    equals( b.currentTimeInPixels(), tracksContainer.offsetWidth, "checking pixel at end of video" );
    b.currentTime( b.duration() / 2 );
    equals( b.currentTimeInPixels(), tracksContainer.offsetWidth / 2, "checking pixel half way through video" );

    b.currentTimeInPixels( 0 )
    equals( b.currentTime(), 0, "checking second at pixel 0" );
    b.currentTimeInPixels( tracksContainer.offsetWidth );
    equals( b.currentTime(), b.duration(), "checking second at last pixel" );
    b.currentTimeInPixels( tracksContainer.offsetWidth / 2 );
    equals( b.currentTime(), b.duration() / 2, "checking second at middle pixel" );
  });
})(window, document, undefined, Butter);


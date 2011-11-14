(function() {
  require.config({
    baseUrl: "butter/src/"
  });

  define( [ "butter/src/butter.js" ], function( Butter ) {
    return Butter;
  });
})();

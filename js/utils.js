(function() {
  define( [], function() {

    return {

      getJSON: function( src, successCallback, errorCallback ) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', src, false);
        xmlHttp.send(null);
        if ( xmlHttp.status === 200 || xmlHttp.status === 0 ) {
          return JSON.parse( xmlHttp.responseText );
        }
        else {
          return
        }
      }, //getJSON
      getSafeString: function( input ) {
        return input && input.length > 0 ? $("<div/>").text( input ).html() : "";
      }, //getSafeString
      getUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
          return v.toString(16);
        }).toUpperCase();
      } //getUUID

    }; //utils

  });
})();

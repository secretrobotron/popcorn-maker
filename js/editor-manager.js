(function() {

  define( [ "utils" ], function( utils ) {

    function EditorManager ( options ) {

      var rootDir = options.editorsDir;

      function Editor( editorName ) {

        var editorBasePath = rootDir + "/" + editorName;
        var editorOptions = utils.getJSON( editorBasePath + "/manifest.json" );

        if ( editorOptions.editor.match( /https?:\/\// ) ) {
          editorBaseBath = "";
        }

        this.init = function( butter ) {
          var path = editorBasePath + "/" + editorOptions.editor;
          var view = editorOptions.view !== "window" ? "editor-popup" : "window";
          butter.eventeditor.addEditor( path, editorOptions.plugin, view );
        }; //init
      } //Editor

      var editors = [],
          editorList = utils.getJSON( options.config );

      for ( var i=0; i<editorList.length; ++i ) {
        editors.push( new Editor( editorList[ i ] ) );
      } //for

      this.initEditors = function( butter ) {
        for ( var i=0; i<editors.length; ++i ) {
          editors[ i ].init( butter );
        }
      };

    } //EditorManager

    return EditorManager;

  }); //define

})();

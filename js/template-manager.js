(function() {

  define( [ "utils" ], function( utils ) {

    function Template ( root, layoutsDir ) {
      var manifest = utils.getJSON( layoutsDir + "/" + root + "/manifest.json" ),
          name = manifest.title || root,
          thumbnail = new Image();
      if ( manifest.thumbnail ) {
        thumbnail.src = layoutsDir + "/" + root + "/" + manifest.thumbnail;
      }
      var template = manifest.template || "index.html";
      Object.defineProperty( this, "title", { get: function() { return name; } });
      Object.defineProperty( this, "thumbnail", { get: function() { return thumbnail; } });
      Object.defineProperty( this, "template", { get: function() { return layoutsDir + "/" + root + "/" + template; } });
      Object.defineProperty( this, "root", { get: function() { return root } } );
    } //Template

    function TemplateManager ( options ) {
      var templates = [],
          templateList = utils.getJSON( options.config );
      for ( var i=0; i<templateList.length; ++i ) {
        templates.push( new Template( templateList[ i ], options.layoutsDir ) );
      } //for

      Object.defineProperty( this, "templates", { get: function() { return templates; } } );

      this.find = function( options ) {
        for ( var i=0; i<templates.length; ++i ) {
          if (  templates[ i ].title === options ||
                templates[ i ].title === options.title ||
                templates[ i ].template === options.template ||
                templates[ i ].root === options.root ) {
            return templates[ i ];
          } //if
        } //for
        return;
      }; //find

      var select = document.getElementById( options.container ),
          thumbnailContainer = $( "#template-thumbnail" );

      function showThumbnail( img ) {
        thumbnailContainer.html("");
        thumbnailContainer.append( $( img ) );
      } //showThumbnail

      showThumbnail( templates[ 0 ].thumbnail );

      this.buildList = function() {
        function createOption( value, innerHTML ) {
          var option = document.createElement( 'option' );
          option.value = value;
          option.appendChild( document.createTextNode( utils.getSafeString( innerHTML ) ) );
          option.class = "ddprojects-option";
          return option;
        }

        for ( var i=0; i<templates.length; ++i ) {
          select.appendChild( createOption( templates[ i ].template, templates[ i ].title ) );
        }
        select.appendChild( createOption( "-1", "Other..." ) );
        
        $( "#template-other" ).hide();
        var otherOption = select.options[ select.options.length - 1 ],
            otherText = $( "#template-other" )[ 0 ];
        select.addEventListener( 'change', function( e ) {
          if ( select.selectedIndex === otherOption.index ) {
            $( "#template-other" ).show();
          }
          else {
            for ( var i=0; i<templates.length; ++i ) {
              if ( templates[ i ].template === select.options[ select.selectedIndex ].value ) {
                showThumbnail( templates[ i ].thumbnail );
                break;
              }
            }
            $( "#template-other" ).hide();
          } //if
        }, false );
        otherText.addEventListener( 'change', function( e ) {
          otherOption.value = otherText.value;
        }, false );
      }; //buildList

      this.init = function() {
      }; //init

    } //TemplateManager

    TemplateManager.Template = Template;

    return TemplateManager;

  }); //define

})();
